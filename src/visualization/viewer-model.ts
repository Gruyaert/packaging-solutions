import type { Placement } from '@/domain/packing/types';
export interface ViewerSettings { projection: string; rotation: string; mode: string; shadeMode: string; opacity: number; boundsOpacity: number; contours: boolean; lighting: boolean; keepCamera: boolean; axes: boolean; grid: boolean; labels: boolean; colors: boolean; productGap: number; layerGap: number; layer: string; step: number; speed: number; selectedPlacementId?: string; cameraProjection: string; camera?: { eye: { x: number; y: number; z: number }; up: { x: number; y: number; z: number }; center: { x: number; y: number; z: number } } }
export interface ViewerItem extends Placement { productIndex: number; shadeIndex: number; layerPosition: number; orderIndex: number }
// Self-contained factory, also embedded together with the runtime into offline reports.
export function createViewerModel(placements: Placement[], initial: Record<string, unknown> = {}) {
  const ordered = [...placements].sort((a,b)=>a.layerIndex-b.layerIndex || a.z-b.z || a.y-b.y || a.x-b.x);
  const levels = [...new Set(ordered.map(p => p.layerIndex))].sort((a,b)=>a-b);
  const ids = [...new Set(ordered.map(p => p.productId))];
  const productRanks = new Map(ids.map((id,index)=>[id,index]));
  const shadeCounts = new Map<string,number>();
  const layerCounts = new Map<number,number>();
  const items: ViewerItem[] = ordered.map((placement, orderIndex) => {
    const shadeIndex = shadeCounts.get(placement.productId) ?? 0;
    shadeCounts.set(placement.productId, shadeIndex + 1);
    const layerPosition = layerCounts.get(placement.layerIndex) ?? 0;
    layerCounts.set(placement.layerIndex, layerPosition + 1);
    return { ...placement, productIndex: productRanks.get(placement.productId) ?? 0, shadeIndex, layerPosition, orderIndex };
  });
  const itemById = new Map(items.map(item => [item.placementId, item]));
  const ranks = new Map<number, { x: Map<number,number>; y: Map<number,number> }>();
  const coordinates = new Map<number,{x:Set<number>;y:Set<number>}>();
  for (const p of ordered) { let c = coordinates.get(p.layerIndex); if (!c) { c = { x:new Set(),y:new Set() }; coordinates.set(p.layerIndex,c); } c.x.add(p.x); c.y.add(p.y); }
  for (const [layer,c] of coordinates) ranks.set(layer,{x:new Map([...c.x].sort((a,b)=>a-b).map((v,i)=>[v,i])),y:new Map([...c.y].sort((a,b)=>a-b).map((v,i)=>[v,i]))});
  const layerRanks = new Map(levels.map((v,i)=>[v,i]));
  const number = (key:string, fallback:number, min:number, max:number) => typeof initial[key] === 'number' && Number.isFinite(initial[key]) ? Math.max(min,Math.min(max,initial[key] as number)) : fallback;
  const choice = (key:string, choices:string[],fallback:string) => choices.includes(String(initial[key])) ? String(initial[key]) : fallback;
  const bool = (key:string,fallback:boolean) => typeof initial[key] === 'boolean' ? initial[key] as boolean : fallback;
  const selected = typeof initial.selectedPlacementId === 'string' && itemById.has(initial.selectedPlacementId) ? initial.selectedPlacementId : undefined;
  const state: ViewerSettings = {
    projection:choice('projection',['3d','top','front','side'],'3d'), rotation:choice('rotation',['upright','z','free'],'upright'),
    mode:choice('mode',['filled','wire','both'],'both'), shadeMode:choice('shadeMode',['product','tints','layers'],'tints'),
    opacity:number('opacity',0.78,0,1), boundsOpacity:number('boundsOpacity',1,0,1), contours:bool('contours',true), lighting:bool('lighting',true),
    keepCamera:bool('keepCamera',true), axes:bool('axes',false), grid:bool('grid',false), labels:bool('labels',false), colors:bool('colors',true),
    productGap:number('productGap',0,0,100), layerGap:number('layerGap',0,0,100), layer:choice('layer',['all',...levels.map(String)],'all'),
    step:Math.floor(number('step',ordered.length,0,ordered.length)), speed:[0.25,0.5,1,2,4].includes(Number(initial.speed)) ? Number(initial.speed) : 1,
    selectedPlacementId:selected, cameraProjection:choice('cameraProjection',['perspective','orthographic'],'perspective'),
  };
  const saved = initial.camera as ViewerSettings['camera'];
  const finitePoint = (point: { x: number; y: number; z: number } | undefined) => point && [point.x,point.y,point.z].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=8);
  if (state.keepCamera && saved && finitePoint(saved.eye) && Math.hypot(saved.eye.x,saved.eye.y,saved.eye.z)>0) {
    state.camera = { eye:{...saved.eye}, up:finitePoint(saved.up)&&Math.hypot(saved.up.x,saved.up.y,saved.up.z)>0?{...saved.up}:{x:0,y:0,z:1}, center:finitePoint(saved.center)?{...saved.center}:{x:0,y:0,z:0} };
  }
  function visible(limit = 600) { const eligible = items.slice(0,state.step).filter(p=>state.layer==='all'||p.layerIndex===Number(state.layer)); return { total:eligible.length,items:eligible.slice(-limit) }; }
  function display(p:Placement) { const rank = ranks.get(p.layerIndex)!; return { ...p,x:p.x+(rank.x.get(p.x) ?? 0)*state.productGap,y:p.y+(rank.y.get(p.y) ?? 0)*state.productGap,z:p.z+(layerRanks.get(p.layerIndex) ?? 0)*state.layerGap }; }
  function project(v:number[]) { return state.projection==='front' ? [v[0],v[2]] : state.projection==='side' ? [v[1],v[2]] : [v[0],v[1]]; }
  function selectPlacement(id?: string) { state.selectedPlacementId = id && itemById.has(id) ? id : undefined; return state.selectedPlacementId ? itemById.get(state.selectedPlacementId) : undefined; }
  return { ordered, items, levels, ids, state, visible, display, project, itemFor:(id:string)=>itemById.get(id), selectPlacement };
}