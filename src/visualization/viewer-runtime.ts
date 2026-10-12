import type { Placement, Product } from '@/domain/packing/types';
import { createViewerModel } from './viewer-model';
export interface ViewerData { title: string; kind: 'packaging' | 'pallet'; placements: Placement[]; products: Product[]; bounds: { length: number; width: number; height: number }; validation: { status: string; warnings: string[]; errors?: string[] }; fullSolution?: unknown; context?: unknown; pallet?: unknown; settings?: Record<string, unknown> }
// Self-contained: serialized together with the model factory into offline reports.
export function mountViewer(root: HTMLElement, data: ViewerData, Plotly: any, initial: Record<string, unknown> = {}, onMetric?: (name: string, ms: number) => void, factory = createViewerModel) {
  const model = factory(data.placements,initial), { state,ordered,levels } = model;
  const colors = ['#237b68','#d98d28','#536bc4','#be567e','#6d9342'];
  const ids = [...new Set(ordered.map(p=>p.productId))];
  const escape = (s:string) => s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  let disposed=false,rendering=false,pending=false,timer:ReturnType<typeof setInterval>|undefined,delay:ReturnType<typeof setTimeout>|undefined;
  root.innerHTML='<div class="pv-controls"></div><div class="pv-timeline"></div><p class="pv-status" role="status"></p><div class="pv-plot" style="height:440px;min-width:0"></div><p class="pv-validation"></p>';
  const controls=root.querySelector('.pv-controls')!,timeline=root.querySelector('.pv-timeline')!,status=root.querySelector('.pv-status')!,plot=root.querySelector('.pv-plot') as HTMLElement;
  function select(label:string,key:'projection'|'mode'|'layer'|'speed',options:[string,string][]) { const l=document.createElement('label'),input=document.createElement('select'); l.textContent=label+' '; for(const [value,text] of options){const o=document.createElement('option');o.value=value;o.textContent=text;input.append(o);} input.value=String(state[key]);input.onchange=()=>{ if(key==='speed'){state.speed=Number(input.value);if(timer)play();}else state[key]=input.value; schedule();};l.append(input);controls.append(l); }
  function toggle(label:string,key:'colors'|'axes'|'grid'|'labels'){const l=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=state[key];input.onchange=()=>{state[key]=input.checked;schedule();};l.append(input,document.createTextNode(' '+label));controls.append(l);}
  function slider(label:string,key:'opacity'|'productGap'|'layerGap',max:number,step=1){const l=document.createElement('label'),output=document.createElement('span'),input=document.createElement('input');input.type='range';input.min='0';input.max=String(max);input.step=String(step);input.value=String(state[key]);output.textContent=`${label}: ${state[key]}`;input.oninput=()=>{state[key]=Number(input.value);output.textContent=`${label}: ${state[key]}`;schedule();};l.append(output,input);controls.append(l);}
  function button(text:string,action:()=>void,parent=timeline){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=action;parent.append(b);}
  select('Projectie','projection',[['3d','3D'],['top','Bovenaanzicht'],['front','Vooraanzicht'],['side','Zijaanzicht']]);
  select('Weergave','mode',[['filled','Gevuld'],['wire','Draadmodel'],['both','Gevuld + draadmodel']]);
  select('Laag','layer',[['all','Alle lagen'],...levels.map(n=>[String(n),`Laag ${n+1}`] as [string,string])]);
  select('Snelheid','speed',[0.25,0.5,1,2,4].map(n=>[String(n),`${n}x`]));
  toggle('Productkleuren','colors');toggle('Assen','axes');toggle('Raster','grid');toggle('Labels','labels');
  slider('Dekking (0 = transparant, 1 = gevuld)','opacity',1,0.05);slider('Exploded productafstand mm','productGap',100);slider('Exploded laagafstand mm','layerGap',100);
  function pause(){if(timer)clearInterval(timer);timer=undefined;}
  function go(n:number){pause();state.step=Math.max(0,Math.min(ordered.length,n));schedule();}
  function play(){pause();if(!ordered.length)return;if(state.step>=ordered.length)state.step=0;schedule();timer=setInterval(()=>{if(rendering||pending)return;state.step++;schedule();if(state.step>=ordered.length)pause();},800/state.speed);}
  button('Begin',()=>go(0));button('Vorige',()=>go(state.step-1));button('Play',play);button('Pause',pause);button('Volgende',()=>go(state.step+1));button('Einde',()=>go(ordered.length));
  button('Reset camera',()=>{if(state.projection==='3d')void Plotly.relayout(plot,{'scene.camera':{eye:{x:1.5,y:1.5,z:1.2}}});else void Plotly.relayout(plot,{'xaxis.autorange':true,'yaxis.autorange':true});},controls);
  const warnings=data.products.filter(p=>p.allowCompression||p.compressibilityX||p.compressibilityY||p.compressibilityZ).map(p=>`${p.reference}: allowCompression=${!!p.allowCompression}; X/Y/Z=${p.compressibilityX??0}/${p.compressibilityY??0}/${p.compressibilityZ??0} mm (nominale assen, geen materiaalgoedkeuring)`);
  const validation=root.querySelector('.pv-validation') as HTMLElement;
  validation.dataset.status=data.validation.status;
  validation.textContent=`Validatie: ${data.validation.status}. ${[...(data.validation.errors??[]),...data.validation.warnings,...warnings].join(' · ')} Nominale maten blijven behouden; exploded is uitsluitend visueel.`;
  function schedule(){if(delay)clearTimeout(delay);delay=setTimeout(()=>void render(),80);}
  async function render(){
    if(disposed)return;if(rendering){pending=true;return;}rendering=true;
    const start=performance.now(),{items:visible,total}=model.visible(),traces:any[]=[];
    const current=ordered[state.step-1];
    status.textContent=`Stap ${state.step}/${ordered.length} · huidig ${current?.placementId??'geen'} · laag ${current?current.layerIndex+1:'—'} · geplaatst ${state.step}, resterend ${ordered.length-state.step}. Getoond ${visible.length}/${total}${total>600?' (laatste 600; kies een laag of een eerdere animatiestap voor andere items)':''}.`;
    const edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],faces=[[0,1,2],[0,2,3],[4,6,5],[4,7,6],[0,4,5],[0,5,1],[1,5,6],[1,6,2],[2,6,7],[2,7,3],[3,7,4],[3,4,0]];
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
    const outline:any={type:state.projection==='3d'?'scatter3d':'scatter',mode:'lines',x:[],y:[],z:[],line:{color:'#72867e',width:2},hoverinfo:'skip',showlegend:false};
    for(const edge of edges){for(const n of edge){const p=state.projection==='3d'?v[n]:model.project(v[n]);outline.x.push(p[0]);outline.y.push(p[1]);outline.z.push(p[2]);}outline.x.push(null);outline.y.push(null);outline.z.push(null);}traces.push(outline);
    const axis=(title:string)=>({title,visible:state.axes,showgrid:state.grid,zeroline:state.grid});
    const layout:any={autosize:true,margin:{l:35,r:10,t:10,b:35},paper_bgcolor:'#fffdf8',plot_bgcolor:'#fffdf8',uirevision:state.projection,legend:{orientation:'h'},scene:{aspectmode:'data',dragmode:'orbit',xaxis:axis('X · lengte mm'),yaxis:axis('Y · breedte mm'),zaxis:axis('Z · hoogte mm')},xaxis:axis(state.projection==='side'?'Y mm':'X mm'),yaxis:{...axis(state.projection==='top'?'Y mm':'Z mm'),scaleanchor:'x'}};
    onMetric?.('Plotly build',performance.now()-start);
    try{const renderStart=performance.now();await Plotly.react(plot,traces,layout,{responsive:true,scrollZoom:true,displaylogo:false,modeBarButtonsToRemove:['sendDataToCloud']});onMetric?.('render',performance.now()-renderStart);}catch(error){if(!disposed)status.textContent=`Viewer kon niet renderen: ${String(error)}. Probeer een 2D-projectie als WebGL niet beschikbaar is.`;}
    finally{rendering=false;if(disposed)Plotly.purge(plot);else if(pending){pending=false;schedule();}}
  }
  const resize=new ResizeObserver(()=>{if(!disposed&&!rendering)void Plotly.Plots.resize(plot);});resize.observe(plot);schedule();
  return{settings:()=>({...state}),destroy:()=>{disposed=true;pause();if(delay)clearTimeout(delay);resize.disconnect();if(!rendering)Plotly.purge(plot);root.replaceChildren();}};
}
export const VIEWER_CSS=`.pv-controls,.pv-timeline{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:12px}.pv-controls label{font-size:12px;display:flex;align-items:center;gap:5px;flex-wrap:wrap;min-width:0}.pv-controls input[type=range]{width:110px;max-width:100%}.pv-controls select,.pv-controls button,.pv-timeline button{background:#fffdf8;color:#21473b;border:1px solid #bdcfc7;border-radius:12px;padding:7px;max-width:100%}.pv-controls button:focus-visible,.pv-timeline button:focus-visible,.pv-controls input:focus-visible,.pv-controls select:focus-visible{outline:2px solid #237b68;outline-offset:2px}.pv-status,.pv-validation{font-size:12px;overflow-wrap:anywhere}.pv-validation{border-left:3px solid #237b68;padding:10px;background:#edf5f1}.pv-validation[data-status=invalid]{border-color:#b82949;background:#fff0f2;color:#8f1934}.pv-plot{width:100%;overflow:hidden}.modebar{max-width:100%}`;
