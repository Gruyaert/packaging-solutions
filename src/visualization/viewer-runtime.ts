import type { Placement, Product } from '@/domain/packing/types';
import type { ViewerPalette } from './viewer-palette';
import { createViewerModel } from './viewer-model';

export interface ViewerData {
  title: string;
  kind: 'packaging' | 'pallet';
  placements: Placement[];
  products: Product[];
  bounds: { length: number; width: number; height: number };
  validation: { status: string; warnings: string[]; errors?: string[] };
  fullSolution?: unknown;
  context?: unknown;
  pallet?: unknown;
  settings?: Record<string, unknown>;
}

// Self-contained: serialized together with the model and palette factories into offline reports.
export function mountViewer(root: HTMLElement, data: ViewerData, Plotly: any, initial: Record<string, unknown> = {}, onMetric?: (name: string, ms: number) => void, factory = createViewerModel, paletteOverride?: ViewerPalette) {
  const fallbackPalette = () => {
    const bases=['#2563eb','#7c3aed','#d97706','#db2777','#0891b2','#16a34a','#dc2626','#9333ea'],offsets=[0.12,-0.1,0.06,-0.16,0,0.18,-0.05,0.09];
    const channel=(value:string)=>Number.parseInt(value,16),hex=(value:number)=>Math.max(0,Math.min(255,Math.round(value))).toString(16).padStart(2,'0');
    const mix=(color:string,target:string,amount:number)=>{const source=color.replace('#',''),destination=target.replace('#','');return '#'+[0,2,4].map(index=>hex(source.slice(index,index+2))*(1-amount)+channel(destination.slice(index,index+2))*amount).join('');};
    const productBase=(index:number)=>bases[((index%bases.length)+bases.length)%bases.length];
    const boxColor=(index:number,shade:number,layer:number,mode:string)=>{const base=productBase(index);if(mode==='product')return base;const offset=mode==='layers'?(layer%2?-0.14:0.12):offsets[((shade%offsets.length)+offsets.length)%offsets.length];return offset>=0?mix(base,'#ffffff',offset):mix(base,'#0f172a',Math.abs(offset));};
    const wireColor=(index:number)=>mix(productBase(index),'#0f172a',0.34);
    const textColor=(color:string)=>{const source=color.replace('#',''),values=[0,2,4].map(index=>channel(source.slice(index,index+2))/255).map(value=>value<=0.03928?value/12.92:((value+0.055)/1.055)**2.4);return 0.2126*values[0]+0.7152*values[1]+0.0722*values[2]>0.45?'#0f172a':'#ffffff';};
    return{productBase,boxColor,wireColor,textColor,bounds:'#475569',pallet:'#94a3b8',selected:'#0f172a',hover:'#f59e0b'};
  };
  const palette = paletteOverride ?? fallbackPalette();
  const model = factory(data.placements, initial), { state, ordered, levels } = model;
  const ids = [...new Set(ordered.map(placement => placement.productId))];
  const escape = (value:string) => value.replace(/[&<>\"']/g, character => ({'&':'&','<':'<','>':'>','\"':'"',"'":'''}[character]!));

  let disposed=false,rendering=false,pending=false,timer:ReturnType<typeof setInterval>|undefined,delay:ReturnType<typeof setTimeout>|undefined,backgroundDelay:ReturnType<typeof setTimeout>|undefined;
  root.innerHTML='<div class="pv-toolbar"><div class="pv-controls"><div class="pv-camera"></div></div><div class="pv-camera"></div><details class="pv-options pv-advanced-options"><summary>More display options <span>color · light · labels · spacing</span></summary><div class="pv-advanced"></div></details><p class="pv-status" role="status"></p></div><div class="pv-plot"></div><p class="pv-help"></p><details class="pv-options pv-checks"><summary>Control and technical remarks</summary><p class="pv-validation"></p></details>';\n  const controls=root.querySelector('.pv-controls')!,cameraControls=root.querySelector('.pv-camera')!,advanced=root.querySelector('.pv-advanced')!,timeline=root.querySelector('.pv-timeline')!,status=root.querySelector('.pv-status')!,help=root.querySelector('.pv-help')!,plot=root.querySelector('.pv-plot') as HTMLElement;

  const viewport = () => {
    const rect = typeof plot.getBoundingClientRect === 'function' ? plot.getBoundingClientRect() : undefined;
    return { width: Math.max(1, rect?.width || (plot as any).clientWidth || 800), height: Math.max(1, rect?.height || (plot as any).clientHeight || 500) };
  };
  const fitDistance = () => {
    const view=viewport(),horizontal=Math.max(data.bounds.length,data.bounds.width,1),vertical=Math.max(data.bounds.height+(Math.max(0,levels.length-1)*state.layerGap),1),screenRatio=view.width/view.height;
    const mismatch=Math.max(horizontal/(vertical*screenRatio),vertical*screenRatio/horizontal,1);
    return Math.max(1.95,Math.min(5.8,2.15*Math.sqrt(mismatch)));
  };
  const cameraForDistance = (distance:number) => { const length=Math.hypot(1,1,0.8);return{eye:{x:distance/length,y:distance/length,z:distance*0.8/length},up:{x:0,y:0,z:1},center:{x:0,y:0,z:0}}; };
  const defaultCamera = () => cameraForDistance(2.35);
  const fittedCamera = () => cameraForDistance(fitDistance());
  let camera=state.camera??fittedCamera(),frame=0,cameraBusy=false,cameraPending=false,cameraTouched=!!state.camera,needsFit=!state.camera,fitRevision=0;
  const pointers=new Map<number,{x:number;y:number}>();
  let pinchDistance=0,lastResize='';

  function clampCamera(){const radius=Math.max(0.75,Math.min(8,Math.hypot(camera.eye.x,camera.eye.y,camera.eye.z))),azimuth=Math.atan2(camera.eye.y,camera.eye.x),pitch=Math.max(0.08,Math.min(1.48,Math.atan2(camera.eye.z,Math.hypot(camera.eye.x,camera.eye.y))));camera={...camera,eye:{x:radius*Math.cos(pitch)*Math.cos(azimuth),y:radius*Math.cos(pitch)*Math.sin(azimuth),z:radius*Math.sin(pitch)},up:{x:0,y:0,z:1}};}
  if(state.rotation!=='free')clampCamera();
  plot.tabIndex=0;
  plot.setAttribute('aria-label','Interactive packaging schema. Arrow keys rotate, plus/minus zoom, Home centers content and Escape deselects.');

  function cameraHelp(){help.textContent=state.projection!=='3d'?'Mouse wheel or + / − to zoom. Fit content centers the full physical bounding box.':state.rotation==='free'?'Free orbit · all axes. Fit content centers again; Escape centers selection.':state.rotation==='z'?'Sleep left/right · fixed viewing height. Mouse wheel, pinch gesture or + / − to zoom.':'Sleep around or from above; the schema stays upright. Mouse wheel, pinch gesture or + / − to zoom.';plot.style.touchAction=state.projection==='3d'?'none':'auto';}
  async function applyCamera(){if(disposed)return;if(cameraBusy||rendering){cameraPending=true;return;}cameraBusy=true;cameraPending=false;try{await Plotly.relayout(plot,{'scene.camera':camera});}catch(error){if(!disposed)status.textContent=`Camera could not be updated: ${String(error)}`;}finally{cameraBusy=false;if(disposed&&!rendering)Plotly.purge(plot);else if(cameraPending&&!disposed)queueCamera();}}
  function queueCamera(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;void applyCamera();});}
  function releasePointers(){for(const id of [...pointers.keys()]){pointers.delete(id);if(plot.hasPointerCapture(id))plot.releasePointerCapture(id);}pinchDistance=0;}
  function syncCamera(){if(frame||cameraPending||cameraBusy)return;const live=(plot as any).layout?.scene?.camera;if(live?.eye)camera={...defaultCamera(),...live};}
  function fitToContent(){releasePointers();cameraTouched=false;needsFit=true;fitRevision++;if(state.projection==='3d'){camera=fittedCamera();queueCamera();}else void Plotly.relayout(plot,{'xaxis.autorange':true,'yaxis.autorange':true}).catch(()=>{});
  }
  function resetCamera(){releasePointers();cameraTouched=true;needsFit=false;camera=defaultCamera();if(state.projection==='3d')queueCamera();else void Plotly.relayout(plot,{'xaxis.autorange':true,'yaxis.autorange':true}).catch(()=>{});
  }
  function zoom(factor:number,user=true){if(user)cameraTouched=true;if(state.projection==='3d'){syncCamera();const radius=Math.max(0.001,Math.hypot(camera.eye.x,camera.eye.y,camera.eye.z)),next=Math.max(0.75,Math.min(8,radius*factor));camera={...camera,eye:{x:camera.eye.x*next/radius,y:camera.eye.y*next/radius,z:camera.eye.z*next/radius}};queueCamera();}else{const layout=(plot as any)._fullLayout;if(!layout)return;const ranges:Record<string,number[]>={};for(const axis of ['xaxis','yaxis']){const range=layout[axis]?.range;if(range){const mid=(range[0]+range[1])/2,half=(range[1]-range[0])*factor/2;ranges[`${axis}.range`]=[mid-half,mid+half];}void Plotly.relayout(plot,ranges).catch(()=>{});
  }}
  function turn(dx:number,dy:number){cameraTouched=true;const radius=Math.hypot(camera.eye.x,camera.eye.y,camera.eye.z),azimuth=Math.atan2(camera.eye.y,camera.eye.x)-dx*0.008,currentPitch=Math.atan2(camera.eye.z,Math.hypot(camera.eye.x,camera.eye.y)),pitch=state.rotation==='z'?currentPitch:Math.max(0.08,Math.min(1.48,currentPitch+dy*0.008));camera={...camera,eye:{x:radius*Math.cos(pitch)*Math.cos(azimuth),y:radius*Math.cos(pitch)*Math.sin(azimuth),z:radius*Math.sin(pitch)},up:{x:0,y:0,z:1}};queueCamera();}

  function pointerDown(event:PointerEvent){if(state.projection!=='3d'||state.rotation==='free'||event.button!==0||(event.target as Element).closest('.modebar,.legend'))return;syncCamera();pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});plot.setPointerCapture(event.pointerId);if(pointers.size===2){const [a,b]=[...pointers.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);}}
  function pointerMove(event:PointerEvent){const before=pointers.get(event.pointerId);if(!before)return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(pointers.size===1)turn(event.clientX-before.x,event.clientY-before.y);else{const [a,b]=[...pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);if(distance>0&&pinchDistance>0)zoom(pinchDistance/distance);pinchDistance=distance;}event.preventDefault();event.stopImmediatePropagation();}
  function pointerEnd(event:PointerEvent){if(!pointers.has(event.pointerId))return;pointers.delete(event.pointerId);pinchDistance=0;if(plot.hasPointerCapture(event.pointerId))plot.releasePointerCapture(event.pointerId);}
  function wheel(event:WheelEvent){if(state.projection!=='3d'||state.rotation==='free'||(event.target as Element).closest('.modebar'))return;event.preventDefault();event.stopImmediatePropagation();zoom(Math.exp(Math.max(-100,Math.min(100,event.deltaY))*0.003));}
  function keydown(event:KeyboardEvent){if(event.key==='Escape'){model.selectPlacement(undefined);schedule();event.preventDefault();}else if(event.key==='Home'){fitToContent();event.preventDefault();}else if(event.key==='+'||event.key==='='){zoom(0.85);event.preventDefault();}else if(event.key==='-'){zoom(1.18);event.preventDefault();}else if(state.projection==='3d'&&state.rotation!=='free'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){syncCamera();turn(event.key==='ArrowLeft'?-12:event.key==='ArrowRight'?12:0,event.key==='ArrowUp'?12:event.key==='ArrowDown'?-12:0);event.preventDefault();}}
  plot.addEventListener('pointerdown',pointerDown,true);plot.addEventListener('pointermove',pointerMove,true);plot.addEventListener('pointerup',pointerEnd,true);plot.addEventListener('pointercancel',pointerEnd,true);plot.addEventListener('lostpointercapture',pointerEnd,true);plot.addEventListener('wheel',wheel,{capture:true,passive:false});plot.addEventListener('keydown',keydown);

  let lastPointClick=0;
  const clickHandler=(event:any)=>{lastPointClick=performance.now();const id=event?.points?.[0]?.customdata?.[0]??event?.points?.[0]?.customdata;model.selectPlacement(typeof id==='string'?id:undefined);schedule();};
  const backgroundClick=()=>{if(backgroundDelay)clearTimeout(backgroundDelay);backgroundDelay=setTimeout(()=>{backgroundDelay=undefined;if(!disposed&&performance.now()-lastPointClick>60&&state.selectedPlacementId){model.selectPlacement(undefined);schedule();}},0);
  };
  const relayoutHandler=(event:any)=>{if(cameraBusy||rendering)return;const next=event?.['scene.camera'];if(next?.eye){camera={...defaultCamera(),...next};cameraTouched=true;needsFit=false;}};
  const plotOn=(name:string,handler:(event:any)=>void)=>{if(typeof (plot as any).on==='function')(plot as any).on(name,handler);else if(typeof Plotly.on==='function')Plotly.on(plot,name,handler);
  };
  const plotOff=(name:string,handler:(event:any)=>void)=>{if(typeof (plot as any).removeListener==='function')(plot as any).removeListener(name,handler);else if(typeof Plotly.removeListener==='function')Plotly.removeListener(plot,name,handler);
  };
  plot.addEventListener('click',backgroundClick);
  plotOn('plotly_click',clickHandler);
  plotOn('plotly_relayout',relayoutHandler);

  function select(label:string,key:'projection'|'rotation'|'mode'|'layer'|'speed'|'shadeMode'|'cameraProjection',options:[string,string][],parent=controls){const wrapper=document.createElement('label'),input=document.createElement('select');wrapper.textContent=label+' ';for(const [value,text] of options){const option=document.createElement('option');option.value=value;option.textContent=text;input.append(option);}input.value=String(state[key]);input.onchange=()=>{if(key==='speed'){state.speed=Number(input.value);if(timer)play();}else{syncCamera();state[key]=input.value;if(key==='rotation'){cameraTouched=true;if(state.rotation!=='free')clampCamera();queueCamera();}if(key==='cameraProjection'){cameraTouched=false;needsFit=true;fitRevision++;}}cameraHelp();schedule();};wrapper.append(input);parent.append(wrapper);}
  function toggle(label:string,key:'colors'|'axes'|'grid'|'labels'|'keepCamera'|'contours'|'lighting'){const wrapper=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=state[key];input.onchange=()=>{state[key]=input.checked;schedule();};wrapper.append(input,document.createTextNode(' '+label));advanced.append(wrapper);}
  function slider(label:string,key:'opacity'|'boundsOpacity'|'productGap'|'layerGap',max:number,step=1,parent=advanced){const wrapper=document.createElement('label'),output=document.createElement('span'),input=document.createElement('input');input.type='range';input.min='0';input.max=String(max);input.step=String(step);input.value=String(state[key]);input.setAttribute('aria-label',label);const text=()=>key==='opacity'||key==='boundsOpacity'?`${label}: ${Math.round(state[key]*100)}%`:`${label}: ${state[key]} mm`;output.textContent=text();input.oninput=()=>{state[key]=Number(input.value);output.textContent=text();if(key==='productGap'||key==='layerGap'){cameraTouched=false;needsFit=true;fitRevision++;}schedule();};wrapper.append(output,input);parent.append(wrapper);}
  function button(text:string,action:()=>void,parent=timeline,ariaLabel=text){const element=document.createElement('button');element.type='button';element.textContent=text;element.setAttribute('aria-label',ariaLabel);element.title=ariaLabel;element.onclick=action;parent.append(element);return element;}
  function button2(text:string,action:()=>void,parent=timeline,ariaLabel=text){const element=document.createElement('button');element.type='button';element.textContent=text;element.setAttribute('aria-label',ariaLabel);element.title=ariaLabel;element.onclick=action;parent.append(element);return element;}

  select('View','mode',[['filled','Filled'],['wire','Wireframe'],['both','Filled + wire']],controls);
  slider('Opacity','opacity',1,0.05,controls);
  const projectionButtons=new Map<string,HTMLButtonElement>();
  for(const [value,text] of [['3d','3D'],['top','Top'],['front','Front'],['side','Side']])projectionButtons.set(value,button2(text,()=>{syncCamera();releasePointers();state.projection=value;cameraTouched=false;needsFit=true;fitRevision++;cameraHelp();schedule();},cameraControls));
  select('Layer','layer',[['all','All layers'],...levels.map(level=>[String(level),`Layer ${level+1}`] as [string,string])],cameraControls);
  button2('−',()=>zoom(1.18),cameraControls,'Zoom out');button2('+',()=>zoom(0.85),cameraControls,'Zoom in');button2('Fit content',fitToContent,cameraControls,'Fit to content');button2('Reset camera',resetCamera,cameraControls);
  select('Shade mode','shadeMode',[['tints','Product + shades'],['product','Product color only'],['layers','Layer accents']],advanced);
  select('Projection','cameraProjection',[['perspective','Perspective'],['orthographic','Orthographic']],advanced);
  select('Rotation','rotation',[['upright','Upright · rotate and tilt'],['z','Z-axis only'],['free','Free · all axes']],advanced);
  toggle('Keep camera','keepCamera');toggle('Contours','contours');toggle('Product colors','colors');toggle('Shadow / lighting','lighting');toggle('Axes','axes');toggle('Grid','grid');toggle('Labels','labels');
  slider('Bounding box / pallet / contour','boundsOpacity',1,0.05);slider('Separate · products','productGap',100);slider('Separate · layers','layerGap',100);
  const note=document.createElement('p');note.className='pv-help';note.textContent='Shades, shadows, selection and pulling apart are viewing aids; measurements and physical positions remain unchanged.';

  function pause(){if(timer)clearInterval(timer);timer=undefined;}
  function go(step:number){pause();state.step=Math.max(0,Math.min(ordered.length,step));schedule();}
  function play(){pause();if(!ordered.length)return;if(state.step>=ordered.length)state.step=0;schedule();timer=setInterval(()=>{if(rendering||pending)return;state.step++;schedule();if(state.step>=ordered.length)pause();},800/state.speed);}
  button2('|<',()=>go(0),timeline,'First step');button2('<',()=>go(state.step-1),timeline,'Previous step');button2('>',play,timeline,'Play');button2('||',pause,timeline,'Pause');button2('>|',()=>go(state.step+1),timeline,'Next step');button2('>>|',()=>go(ordered.length),timeline,'Last step');
  select('Speed','speed',[0.25,0.5,1,2,4].map(value=>[String(value),`${value}×`]),timeline);

  const warnings=data.products.filter(product=>product.allowCompression||product.compressibilityX||product.compressibilityY||product.compressibilityZ).map(product=>`${product.reference}: allowCompression=${!!product.allowCompression}; X/Y/Z=${product.compressibilityX??0}/${product.compressibilityY??0}/${product.compressibilityZ??0} mm (nominal dimensions, no material approval)`);
  const validation=root.querySelector('.pv-validation') as HTMLElement;
  validation.dataset.status=data.validation.status;
  validation.textContent=`Validation: ${data.validation.status}. ${[...(data.validation.errors??[]),...data.validation.warnings,...warnings].join(' · ')} Nominal dimensions are preserved; viewer interaction is visual only.`;
  if(data.validation.status==='invalid')(root.querySelector('.pv-checks') as HTMLDetailsElement).open=true;

  function schedule(){if(delay)clearTimeout(delay);delay=setTimeout(()=>void render(),80);}
  async function render(){
    if(disposed)return;if(rendering||cameraBusy){pending=true;schedule();return;}rendering=true;
    if(!pointers.size){if(state.keepCamera)syncCamera();else if(!frame&&!cameraPending){camera=fittedCamera();cameraTouched=false;needsFit=true;}}
    if(needsFit&&state.projection==='3d'){camera=fittedCamera();needsFit=false;}
    for(const [value,element] of projectionButtons)element.setAttribute('aria-pressed',String(state.projection===value));
    const start=performance.now(),{items:visible,total}=model.visible(),traces:any[]=[];
    const current=ordered[state.step-1],selectedItem=state.selectedPlacementId?model.itemFor(state.selectedPlacementId):undefined;
    status.textContent=`Step ${state.step}/${ordered.length} · visible ${visible.length}/${total} · active layer ${state.layer==='all'?'all':Number(state.layer)+1}${total>600?' · last 600 rendered':''}${selectedItem?` · selected ${selectedItem.placementId}, layer ${selectedItem.layerIndex+1}`:current?` · current ${current.placementId}`:' · no selection'}.`;
    const edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],faces=[[0,1,2],[0,2,3],[4,6,5],[4,7,6],[0,4,5],[0,5,1],[1,5,6],[1,6,2],[2,6,7],[2,7,3],[3,7,4],[3,4,0]];
    const pallet=data.kind==='pallet'?(data.pallet as {settings?:{palletLength:number;palletWidth:number;palletHeight:number}}|undefined)?.settings:undefined;
    if(pallet){
      const length=pallet.palletLength,width=pallet.palletWidth,height=pallet.palletHeight,vertices=[[0,0,0],[length,0,0],[length,width,0],[0,width,0],[0,0,height],[length,0,height],[length,width,height],[0,width,height]],name=`Pallet base · ${height} mm`;
      if(state.projection==='3d')traces.push({type:'mesh3d',x:vertices.map(vertex=>vertex[0]),y:vertices.map(vertex=>vertex[1]),z:vertices.map(vertex=>vertex[2]),i:faces.map(face=>face[0]),j:faces.map(face=>face[1]),k:faces.map(face=>face[2]),color:palette.pallet,opacity:state.boundsOpacity,flatshading:true,lighting:state.lighting?{ambient:0.8,diffuse:0.3,specular:0.1,roughness:0.9}:undefined,name,showlegend:true,hoverinfo:'text',text:`Physical pallet base ${length} × ${width} × ${height} mm`});
      else{const low=model.project([0,0,0]),high=model.project([length,width,height]);traces.push({type:'scatter',mode:'lines',x:[low[0],high[0],high[0],low[0],low[0]],y:[low[1],low[1],high[1],high[1],low[1]],fill:'toself',fillcolor:'#e2e8f0',opacity:state.boundsOpacity,line:{color:palette.bounds,width:2},name,showlegend:true,hoverinfo:'name'});
      }
    }
    for(const [productIndex,productId] of ids.entries()){
      const group=visible.filter(item=>item.productId===productId);
      if(!group.length)continue;
      const reference=escape(data.products.find(product=>product.productId===productId)?.reference??productId),baseColor=palette.productBase(productIndex),familyWire=state.colors?palette.wireColor(productIndex):palette.bounds,selectedInGroup=group.some(item=>item.placementId===state.selectedPlacementId),dimmed=!!state.selectedPlacementId&&!selectedInGroup;
      const mesh:any={type:'mesh3d',x:[],y:[],z:[],i:[],j:[],k:[],vertexcolor:[],color:baseColor,opacity:dimmed?Math.max(0.2,state.opacity*0.48):state.opacity,hoverinfo:'skip',flatshading:true,lighting:state.lighting?{ambient:0.52,diffuse:0.7,specular:0.3,roughness:0.72,fresnel:0.12}:{ambient:1,diffuse:0,specular:0,roughness:1},lightposition:{x:1000,y:1000,z:2000},showscale:false,showlegend:false,legendgroup:productId};
      const wire:any={type:'scatter3d',mode:'lines',x:[],y:[],z:[],line:{color:familyWire,width:2},opacity:dimmed?0.45:1,hoverinfo:'skip',showlegend:false,legendgroup:productId};
      const selectedWire:any={type:'scatter3d',mode:'lines',x:[],y:[],z:[],line:{color:palette.selected,width:5},hoverinfo:'skip',showlegend:false,legendgroup:productId};
      const hit:any={type:state.projection==='3d'?'scatter3d':'scatter',mode:state.labels?'markers+text':'markers',x:[],y:[],z:[],text:[],hovertext:[],customdata:[],hovertemplate:'%{hovertext}<extra></extra>',hoverinfo:'text',marker:{size:18,color:'rgba(0,0,0,0.001)',opacity:0.01,line:{width:0}},textfont:{color:familyWire,size:11},showlegend:false,legendgroup:productId,name:reference};
      for(const item of group){
        const display=model.display(item),{x,y,z}=display,vertices=[[x,y,z],[x+item.length,y,z],[x+item.length,y+item.width,z],[x,y+item.width,z],[x,y,z+item.height],[x+item.length,y,z+item.height],[x+item.length,y+item.width,z+item.height],[x,y+item.width,z+item.height]],itemColor=state.colors?palette.boxColor(item.productIndex,item.shadeIndex,item.layerIndex,state.shadeMode as 'product'|'tints'|'layers'):baseColor;
        if(state.projection==='3d'){
          const offset=mesh.x.length;vertices.forEach(vertex=>{mesh.x.push(vertex[0]);mesh.y.push(vertex[1]);mesh.z.push(vertex[2]);mesh.vertexcolor.push(itemColor);});faces.forEach(face=>{mesh.i.push(offset+face[0]);mesh.j.push(offset+face[1]);mesh.k.push(offset+face[2]);});edges.forEach(edge=>{for(const index of edge){wire.x.push(vertices[index][0]);wire.y.push(vertices[index][1]);wire.z.push(vertices[index][2]);}wire.x.push(null);wire.y.push(null);wire.z.push(null);});if(item.placementId===state.selectedPlacementId)edges.foreshort(edge=>{for(const index of edge){selectedWire.x.push(vertices[index][0]);selectedWire.y.push(vertices[index][1]);selectedWire.z.push(vertices[index][2]);}selectedWire.x.push(null);selectedWire.y.push(null);selectedWire.z.push(null);});
        }else{
          const low=model.project([x,y,z]),high=model.project([x+item.length,y+item.width,z+item.height]),selected=item.placementId===state.selectedPlacementId;
          traces.push({type:'scatter',mode:'lines',x:[low[0],high[0],high[0],low[0],low[0]],y:[low[1],low[1],high[1],high[1],low[1]],fill:state.mode==='wire'?'none':'toself',fillcolor:itemColor,opacity:selected?Math.min(1,state.opacity+0.18):dimmed?Math.max(0.2,state.opacity*0.48):state.opacity,line:{color:selected?palette.selected:familyWire,width:selected?3:state.mode==='filled'?0:2},hoverinfo:'skip',showlegend:false,legendgroup:productId});
        }
        const center=[x+item.length/2,y+item.width/2,z+item.height/2],projected=state.projection==='3d'?center:model.project(center);
        hit.x.push(projected[0]);hit.y.push(projected[1]);hit.z.push(projected[2]);hit.customdata.push([item.placementId]);hit.text.push(state.labels?escape(item.placementId):'');hit.hovertext.push(`<b>${escape(item.placementId)}</b> · ${reference}<br>Layer ${item.layerIndex+1} · step ${item.orderIndex+1}<br>Physical X/Y/Z ${item.x}/${item.y}/${item.z} mm<br>L/B/H ${item.length}/${item.width}/${item.height} mm · rotation ${escape(item.orientation)}`);
      }
      if(state.projection==='3d'){if(state.mode!=='wire')traces.push(mesh);if(state.mode!=='filled')traces.push(wire);if(selectedWire.x.length)traces.push(selectedWire);}
      traces.push(hit,{type:state.projection==='3d'?'scatter3d':'scatter',mode:'markers',x:[null],y:[null],z:[null],marker:{size:10,color:baseColor,line:{color:familyWire,width:2}},name:`${reference} (${group.length})`,showlegend:true,hoverinfo:'skip',legendgroup:productId});
    }
    const bounds=data.bounds,vertices=[[0,0,0],[bounds.length,0,0],[bounds.length,bounds.width,0],[0,bounds.width,0],[0,0,bounds.height],[bounds.length,0,bounds.height],[bounds.length,bounds.width,bounds.height],[0,bounds.width,bounds.height]],outline:any={type:state.projection==='3d'?'scatter3d':'scatter',mode:'lines',x:[],y:[],z:[],opacity:state.boundsOpacity,line:{color:palette.bounds,width:2},hoverinfo:'skip',name:data.kind==='pallet'?'Pallet boundaries / step heights':'Bounding box · inner dimensions',showlegend:true};
    for(const edge of edges){for(const index of edge){const point=state.projection==='3d'?vertices[index]:model.project(vertices[index]);outline.x.push(point[0]);outline.y.push(point[1]);outline.z.push(point[2]);}outline.x.push(null);outline.y.push(null);outline.z.push(null);}
    if(state.contours)traces.push(outline);
    const axis=(title:string)=>({title,visible:state.axes,showgrid:state.grid,zeroline:state.grid,gridcolor:'#dbe3ef'});
    const layout:any={autosize:true,margin:{l:8,r:8,t:24,b:8},paper_bgcolor:'#ffffff',plot_bgcolor:'#ffffff',font:{color:'#0f172a'},uirevision:`${state.projection}-${state.rotation}-${fitRevision}`,legend:{orientation:'h',x:0,y:1.04,xanchor:'left',yanchor:'bottom',groupclick:'togglegroup',font:{size:11}},scene:{aspectmode:'data',dragmode:state.rotation==='free'?'orbit':false,camera:{...camera,projection:{type:state.cameraProjection}},xaxis:axis('X · length mm'),yaxis:axis('Y · width mm'),zaxis:axis('Z · height mm')},xaxis:axis(state.projection==='side'?'Y mm':'X mm'),yaxis:{...axis(state.projection==='top'?'Y mm':'Z mm'),scaleanchor:'x'}};
    onMetric?.('Plotly build',performance.now()-start);
    try{const renderStart=performance.now();await Plotly.react(plot,traces,layout,{responsive:true,scrollZoom:true,displaylogo:false,displayModeBar:false});onMetric?.('render',performance.now()-renderStart);}catch(error){if(!disposed)status.textContent=`Viewer could not render: ${String(error)}. Try a 2D projection if WebGL is not available.`;(root.querySelector('.pv-checks') as HTMLDetailsElement|null)?.setAttribute('open','');}
    finally{rendering=false;if(disposed)Plotly.purge(plot);else{if(pending){pending=false;schedule();}if(cameraPending)queueCamera();}}
  }

  cameraHelp();
  const resize=new ResizeObserver(()=>{if(disposed)return;const size=viewport(),key=`${Math.round(size.width)}x${Math.round(size.height)}`;if(key===lastResize)return;lastResize=key;if(!rendering)void Plotly.Plots.resize(plot);if(!cameraTouched){needsFit=true;fitRevision++;schedule();}});
  resize.observe(plot);schedule();
  return {
    settings:()=>{syncCamera();const settings={...state};delete settings.camera;return{...settings,...(state.keepCamera?{camera}:{})};},
    destroy:()=>{disposed=true;pause();if(delay)clearTimeout(delay);if(backgroundDelay)clearTimeout(backgroundDelay);if(frame)cancelAnimationFrame(frame);resize.disconnect();plot.removeEventListener('pointerdown',pointerDown,true);plot.removeEventListener('pointermove',pointerMove,true);plot.removeEventListener('pointerup',pointerEnd,true);plot.removeEventListener('pointercancel',pointerEnd,true);plot.removeEventListener('lostpointercapture',pointerEnd,true);plot.removeEventListener('wheel',wheel,true);plot.removeEventListener('keydown',keydown);plot.removeEventListener('click',backgroundClick);plotOff('plotly_click',clickHandler);plotOff('plotly_relayout',relayoutHandler);releasePointers();if(!rendering&&!cameraBusy)Plotly.purge(plot);root.replaceChildren();},
  };
}