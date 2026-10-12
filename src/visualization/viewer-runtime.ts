import type { Placement, Product } from '@/domain/packing/types';
import { createViewerModel } from './viewer-model';
export interface ViewerData { title: string; kind: 'packaging' | 'pallet'; placements: Placement[]; products: Product[]; bounds: { length: number; width: number; height: number }; validation: { status: string; warnings: string[]; errors?: string[] }; fullSolution?: unknown; context?: unknown; pallet?: unknown; settings?: Record<string, unknown> }
// Self-contained: serialized together with the model factory into offline reports.
export function mountViewer(root: HTMLElement, data: ViewerData, Plotly: any, initial: Record<string, unknown> = {}, onMetric?: (name: string, ms: number) => void, factory = createViewerModel) {
  const model = factory(data.placements,initial), { state,ordered,levels } = model;
  const colors = ['#2563eb','#7c3aed','#d97706','#db2777','#0284c7'];
  const ids = [...new Set(ordered.map(p=>p.productId))];
  const escape = (s:string) => s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  let disposed=false,rendering=false,pending=false,timer:ReturnType<typeof setInterval>|undefined,delay:ReturnType<typeof setTimeout>|undefined;
  root.innerHTML='<div class="pv-controls"></div><details class="pv-options"><summary>Meer weergaveopties</summary><div class="pv-advanced"></div></details><p class="pv-help"></p><div class="pv-plot" style="height:480px;min-width:0"></div><div class="pv-timeline"></div><p class="pv-status" role="status"></p><p class="pv-validation"></p>';
  const controls=root.querySelector('.pv-controls')!,advanced=root.querySelector('.pv-advanced')!,timeline=root.querySelector('.pv-timeline')!,status=root.querySelector('.pv-status')!,help=root.querySelector('.pv-help')!,plot=root.querySelector('.pv-plot') as HTMLElement;
  const defaultCamera=()=>({eye:{x:1.5,y:1.5,z:1.2},up:{x:0,y:0,z:1},center:{x:0,y:0,z:0}});
  let camera=defaultCamera(),drag:{id:number;x:number;angle:number;radius:number;z:number}|undefined,frame=0,cameraBusy=false,cameraPending=false;
  function cameraHelp(){help.textContent=state.projection!=='3d'?'Gebruik het muiswiel om te zoomen. Kies 3D om te draaien.':state.rotation==='z'?'Sleep links/rechts om rond de Z-as te draaien. De kijkhoogte blijft vast. Muiswiel = zoom. Vrij roteren vind je onder Meer weergaveopties.':'Vrije 3D-rotatie: sleep om over alle assen te draaien. Reset camera herstelt het overzicht.';plot.style.touchAction=state.projection==='3d'?'none':'auto';}
  async function applyCamera(){if(disposed)return;if(cameraBusy||rendering){cameraPending=true;return;}cameraBusy=true;cameraPending=false;try{await Plotly.relayout(plot,{'scene.camera':camera});}catch(error){if(!disposed)status.textContent=`Camera kon niet worden bijgewerkt: ${String(error)}`;}finally{cameraBusy=false;if(disposed&&!rendering)Plotly.purge(plot);else if(cameraPending&&!disposed)queueCamera();}}
  function queueCamera(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;void applyCamera();});}
  function resetCamera(){if(drag&&plot.hasPointerCapture(drag.id))plot.releasePointerCapture(drag.id);drag=undefined;camera=defaultCamera();if(state.projection==='3d')queueCamera();else void Plotly.relayout(plot,{'xaxis.autorange':true,'yaxis.autorange':true});}
  function pointerDown(e:PointerEvent){
    if(state.projection!=='3d'||state.rotation!=='z'||e.button!==0||drag||(e.target as Element).closest('.modebar,.legend'))return;
    const live=(plot as any).layout?.scene?.camera;
    if(live?.eye)camera={...defaultCamera(),...live,up:{x:0,y:0,z:1}};
    drag={id:e.pointerId,x:e.clientX,angle:Math.atan2(camera.eye.y,camera.eye.x),radius:Math.hypot(camera.eye.x,camera.eye.y),z:camera.eye.z};
    plot.setPointerCapture(e.pointerId);e.preventDefault();e.stopImmediatePropagation();
  }
  function pointerMove(e:PointerEvent){if(!drag||drag.id!==e.pointerId)return;const angle=drag.angle-(e.clientX-drag.x)*0.008;camera={...camera,eye:{x:drag.radius*Math.cos(angle),y:drag.radius*Math.sin(angle),z:drag.z},up:{x:0,y:0,z:1}};queueCamera();e.preventDefault();e.stopImmediatePropagation();}
  function pointerEnd(e:PointerEvent){if(!drag||drag.id!==e.pointerId)return;drag=undefined;if(plot.hasPointerCapture(e.pointerId))plot.releasePointerCapture(e.pointerId);e.stopImmediatePropagation();}
  plot.addEventListener('pointerdown',pointerDown,true);plot.addEventListener('pointermove',pointerMove,true);plot.addEventListener('pointerup',pointerEnd,true);plot.addEventListener('pointercancel',pointerEnd,true);plot.addEventListener('lostpointercapture',pointerEnd,true);
  function select(label:string,key:'projection'|'rotation'|'mode'|'layer'|'speed',options:[string,string][],parent=controls) { const l=document.createElement('label'),input=document.createElement('select'); l.textContent=label+' '; for(const [value,text] of options){const o=document.createElement('option');o.value=value;o.textContent=text;input.append(o);} input.value=String(state[key]);input.onchange=()=>{ if(key==='speed'){state.speed=Number(input.value);if(timer)play();}else {state[key]=input.value;if(key==='rotation')resetCamera();}cameraHelp();schedule();};l.append(input);parent.append(l); }
  function toggle(label:string,key:'colors'|'axes'|'grid'|'labels'){const l=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=state[key];input.onchange=()=>{state[key]=input.checked;schedule();};l.append(input,document.createTextNode(' '+label));advanced.append(l);}
  function slider(label:string,key:'opacity'|'productGap'|'layerGap',max:number,step=1,parent=advanced){const l=document.createElement('label'),output=document.createElement('span'),input=document.createElement('input');input.type='range';input.min='0';input.max=String(max);input.step=String(step);input.value=String(state[key]);input.setAttribute('aria-label',label);const text=()=>key==='opacity'?`${label}: ${Math.round(state[key]*100)}%`:`${label}: ${state[key]} mm`;output.textContent=text();input.oninput=()=>{state[key]=Number(input.value);output.textContent=text();schedule();};l.append(output,input);parent.append(l);}
  function button(text:string,action:()=>void,parent=timeline){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=action;parent.append(b);}
  select('Aanzicht','projection',[['3d','3D'],['top','Bovenaanzicht'],['front','Vooraanzicht'],['side','Zijaanzicht']]);
  select('Weergave','mode',[['filled','Gevuld'],['wire','Draadmodel'],['both','Gevuld + draadmodel']]);
  select('Laag','layer',[['all','Alle lagen'],...levels.map(n=>[String(n),`Laag ${n+1}`] as [string,string])]);
  slider('Dekking','opacity',1,0.05,controls);
  button('Reset camera',resetCamera,controls);
  select('Draaien','rotation',[['z','Alleen Z-as (standaard)'],['free','Vrij · alle assen']],advanced);
  toggle('Productkleuren','colors');toggle('Assen','axes');toggle('Raster','grid');toggle('Labels','labels');
  slider('Uit elkaar · producten','productGap',100);slider('Uit elkaar · lagen','layerGap',100);
  const note=document.createElement('p');note.className='pv-help';note.textContent='Uit elkaar trekken is alleen een kijkhulp; het verandert geen maten of posities.';advanced.append(note);
  function pause(){if(timer)clearInterval(timer);timer=undefined;}
  function go(n:number){pause();state.step=Math.max(0,Math.min(ordered.length,n));schedule();}
  function play(){pause();if(!ordered.length)return;if(state.step>=ordered.length)state.step=0;schedule();timer=setInterval(()=>{if(rendering||pending)return;state.step++;schedule();if(state.step>=ordered.length)pause();},800/state.speed);}
  button('Begin',()=>go(0));button('Vorige',()=>go(state.step-1));button('Afspelen',play);button('Pauze',pause);button('Volgende',()=>go(state.step+1));button('Einde',()=>go(ordered.length));
  select('Snelheid','speed',[0.25,0.5,1,2,4].map(n=>[String(n),`${n}×`]),timeline);
  const warnings=data.products.filter(p=>p.allowCompression||p.compressibilityX||p.compressibilityY||p.compressibilityZ).map(p=>`${p.reference}: allowCompression=${!!p.allowCompression}; X/Y/Z=${p.compressibilityX??0}/${p.compressibilityY??0}/${p.compressibilityZ??0} mm (nominale assen, geen materiaalgoedkeuring)`);
  const validation=root.querySelector('.pv-validation') as HTMLElement;
  validation.dataset.status=data.validation.status;
  validation.textContent=`Validatie: ${data.validation.status}. ${[...(data.validation.errors??[]),...data.validation.warnings,...warnings].join(' · ')} Nominale maten blijven behouden; uit elkaar trekken is uitsluitend visueel.`;
  function schedule(){if(delay)clearTimeout(delay);delay=setTimeout(()=>void render(),80);}
  async function render(){
    if(disposed)return;if(rendering||cameraBusy){pending=true;schedule();return;}rendering=true;
    const liveCamera=(plot as any).layout?.scene?.camera;
    if(state.rotation==='z'&&!drag&&!frame&&!cameraPending&&liveCamera?.eye)camera={...defaultCamera(),...liveCamera,up:{x:0,y:0,z:1}};
    const start=performance.now(),{items:visible,total}=model.visible(),traces:any[]=[];
    const current=ordered[state.step-1];
    status.textContent=`Stap ${state.step}/${ordered.length} · huidig ${current?.placementId??'geen'} · laag ${current?current.layerIndex+1:'—'} · geplaatst ${state.step}, resterend ${ordered.length-state.step}. Getoond ${visible.length}/${total}${total>600?' (laatste 600; kies een laag of een eerdere animatiestap voor andere items)':''}.`;
    const edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],faces=[[0,1,2],[0,2,3],[4,6,5],[4,7,6],[0,4,5],[0,5,1],[1,5,6],[1,6,2],[2,6,7],[2,7,3],[3,7,4],[3,4,0]];
    // Pallet placements already start at palletHeight: the base occupies Z=0..palletHeight.
    const pallet=data.kind==='pallet'?(data.pallet as {settings?:{palletLength:number;palletWidth:number;palletHeight:number}}|undefined)?.settings:undefined;
    if(pallet){
      const l=pallet.palletLength,w=pallet.palletWidth,h=pallet.palletHeight;
      const vertices=[[0,0,0],[l,0,0],[l,w,0],[0,w,0],[0,0,h],[l,0,h],[l,w,h],[0,w,h]];
      const name=`Palletbasis · ${h} mm`;
      if(state.projection==='3d')traces.push({type:'mesh3d',x:vertices.map(v=>v[0]),y:vertices.map(v=>v[1]),z:vertices.map(v=>v[2]),i:faces.map(f=>f[0]),j:faces.map(f=>f[1]),k:faces.map(f=>f[2]),color:'#64748b',opacity:1,flatshading:true,name,showlegend:true,hoverinfo:'text',text:`Fysieke palletbasis ${l} × ${w} × ${h} mm (schematisch volume)`});
      else{const lo=model.project([0,0,0]),hi=model.project([l,w,h]);traces.push({type:'scatter',mode:'lines',x:[lo[0],hi[0],hi[0],lo[0],lo[0]],y:[lo[1],lo[1],hi[1],hi[1],lo[1]],fill:'toself',fillcolor:'#e2e8f0',line:{color:'#475569',width:2},name,showlegend:true,hoverinfo:'name'});}
    }
    for(const [ci,id] of ids.entries()){
      const group=visible.filter(p=>p.productId===id),color=state.colors?colors[ci%colors.length]:colors[0];
      const mesh:any={type:'mesh3d',x:[],y:[],z:[],i:[],j:[],k:[],color,opacity:state.opacity,hoverinfo:'skip',flatshading:true,showscale:false};
      const wire:any={type:'scatter3d',mode:'lines',x:[],y:[],z:[],line:{color,width:2},hoverinfo:'skip',showlegend:false};
      const points:any={type:state.projection==='3d'?'scatter3d':'scatter',mode:state.labels?'markers+text':'markers',x:[],y:[],z:[],text:[],hovertext:[],hoverinfo:'text',marker:{size:4,color},name:escape(data.products.find(p=>p.productId===id)?.reference??id),showlegend:true};
      for(const p of group){
        const d=model.display(p),{x,y,z}=d;
        const v=[[x,y,z],[x+p.length,y,z],[x+p.length,y+p.width,z],[x,y+p.width,z],[x,y,z+p.height],[x+p.length,y,z+p.height],[x+p.length,y+p.width,z+p.height],[x,y+p.width,z+p.height]];
        if(state.projection==='3d'){const offset=mesh.x.length;v.forEach(a=>{mesh.x.push(a[0]);mesh.y.push(a[1]);mesh.z.push(a[2]);});faces.forEach(f=>{mesh.i.push(offset+f[0]);mesh.j.push(offset+f[1]);mesh.k.push(offset+f[2]);});edges.forEach(e=>{for(const n of e){wire.x.push(v[n][0]);wire.y.push(v[n][1]);wire.z.push(v[n][2]);}wire.x.push(null);wire.y.push(null);wire.z.push(null);});}
        else{const lo=model.project([x,y,z]),hi=model.project([x+p.length,y+p.width,z+p.height]);traces.push({type:'scatter',mode:'lines',x:[lo[0],hi[0],hi[0],lo[0],lo[0]],y:[lo[1],lo[1],hi[1],hi[1],lo[1]],fill:state.mode==='wire'?'none':'toself',fillcolor:color,opacity:state.opacity,line:{color,width:state.mode==='filled'?0:1},hoverinfo:'skip',showlegend:false});}
        const center=[x+p.length/2,y+p.width/2,z+p.height/2],c=state.projection==='3d'?center:model.project(center);
        points.x.push(c[0]);points.y.push(c[1]);points.z.push(c[2]);points.text.push(escape(p.placementId));points.hovertext.push(`${escape(p.placementId)} · ${escape(p.orientation)}<br>Fysiek X/Y/Z ${p.x}/${p.y}/${p.z} mm<br>L/B/H ${p.length}/${p.width}/${p.height} mm · laag ${p.layerIndex+1}`);
      }
      if(group.length){if(state.projection==='3d'){if(state.mode!=='wire')traces.push(mesh);if(state.mode!=='filled')traces.push(wire);}traces.push(points);}
    }
    // Bounds remain physical even when products are visually exploded.
    const b=data.bounds,v=[[0,0,0],[b.length,0,0],[b.length,b.width,0],[0,b.width,0],[0,0,b.height],[b.length,0,b.height],[b.length,b.width,b.height],[0,b.width,b.height]];
    const outline:any={type:state.projection==='3d'?'scatter3d':'scatter',mode:'lines',x:[],y:[],z:[],line:{color:'#475569',width:2},hoverinfo:'skip',name:data.kind==='pallet'?'Palletgrens / stapelhoogte':'Omdoos · binnenmaat',showlegend:true};
    for(const edge of edges){for(const n of edge){const p=state.projection==='3d'?v[n]:model.project(v[n]);outline.x.push(p[0]);outline.y.push(p[1]);outline.z.push(p[2]);}outline.x.push(null);outline.y.push(null);outline.z.push(null);}traces.push(outline);
    const axis=(title:string)=>({title,visible:state.axes,showgrid:state.grid,zeroline:state.grid,gridcolor:'#e2e8f0'});
    const layout:any={autosize:true,margin:{l:35,r:10,t:10,b:35},paper_bgcolor:'#ffffff',plot_bgcolor:'#ffffff',font:{color:'#0f172a'},uirevision:`${state.projection}-${state.rotation}`,legend:{orientation:'h'},scene:{aspectmode:'data',dragmode:state.rotation==='free'?'orbit':false,camera:state.rotation==='z'?camera:undefined,xaxis:axis('X · lengte mm'),yaxis:axis('Y · breedte mm'),zaxis:axis('Z · hoogte mm')},xaxis:axis(state.projection==='side'?'Y mm':'X mm'),yaxis:{...axis(state.projection==='top'?'Y mm':'Z mm'),scaleanchor:'x'}};
    onMetric?.('Plotly build',performance.now()-start);
    try{const renderStart=performance.now();await Plotly.react(plot,traces,layout,{responsive:true,scrollZoom:true,displaylogo:false,modeBarButtonsToRemove:['sendDataToCloud',...(state.rotation==='z'?['orbitRotation','tableRotation','pan3d','resetCameraDefault3d','resetCameraLastSave3d']:[])]});onMetric?.('render',performance.now()-renderStart);}catch(error){if(!disposed)status.textContent=`Viewer kon niet renderen: ${String(error)}. Probeer een 2D-projectie als WebGL niet beschikbaar is.`;}
    finally{rendering=false;if(disposed)Plotly.purge(plot);else {if(pending){pending=false;schedule();}if(cameraPending)queueCamera();}}
  }
  cameraHelp();
  const resize=new ResizeObserver(()=>{if(!disposed&&!rendering)void Plotly.Plots.resize(plot);});resize.observe(plot);schedule();
  return{settings:()=>({...state}),destroy:()=>{disposed=true;pause();if(delay)clearTimeout(delay);if(frame)cancelAnimationFrame(frame);resize.disconnect();plot.removeEventListener('pointerdown',pointerDown,true);plot.removeEventListener('pointermove',pointerMove,true);plot.removeEventListener('pointerup',pointerEnd,true);plot.removeEventListener('pointercancel',pointerEnd,true);plot.removeEventListener('lostpointercapture',pointerEnd,true);if(drag&&plot.hasPointerCapture(drag.id))plot.releasePointerCapture(drag.id);drag=undefined;if(!rendering&&!cameraBusy)Plotly.purge(plot);root.replaceChildren();}};
}
export const VIEWER_CSS=`.pv-controls,.pv-timeline,.pv-advanced{display:flex;flex-wrap:wrap;gap:12px;align-items:center}.pv-controls{padding:12px;background:#f8fafc;border:1px solid #dbe3ef;border-radius:16px}.pv-timeline{margin-top:12px}.pv-controls label,.pv-advanced label,.pv-timeline label{font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0}.pv-controls input[type=range],.pv-advanced input[type=range]{width:110px;max-width:100%;accent-color:#2563eb}.pv-controls select,.pv-advanced select,.pv-controls button,.pv-timeline button,.pv-timeline select{background:#fff;color:#0f172a;border:1px solid #cbd5e1;border-radius:10px;padding:9px;min-height:38px;max-width:100%}.pv-controls button,.pv-timeline button{cursor:pointer;font-weight:600}.pv-timeline button:nth-child(3){background:#2563eb;color:#fff;border-color:#2563eb}.pv-controls button:hover,.pv-timeline button:hover{border-color:#2563eb}.pv-options{border:1px solid #dbe3ef;border-radius:12px;padding:10px 12px;margin-top:10px;font-size:12px}.pv-options summary{cursor:pointer;color:#1d4ed8;font-weight:600}.pv-advanced{padding-top:14px}.pv-advanced input[type=checkbox]{accent-color:#2563eb}.pv-help{font-size:12px;color:#475569;line-height:1.6}.pv-controls button:focus-visible,.pv-timeline button:focus-visible,input:focus-visible,select:focus-visible,.pv-options summary:focus-visible{outline:2px solid #2563eb;outline-offset:2px}.pv-status,.pv-validation{font-size:12px;line-height:1.6;overflow-wrap:anywhere}.pv-validation{border-left:3px solid #2563eb;border-radius:8px;padding:10px;background:#eff6ff;color:#1e3a8a}.pv-validation[data-status=invalid]{border-color:#b82949;background:#fff0f2;color:#8f1934}.pv-plot{width:100%;overflow:hidden}.modebar{max-width:100%}`;
