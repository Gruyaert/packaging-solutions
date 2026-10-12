import type { Placement } from '@/domain/packing/types';
export interface ViewerSettings { projection: string; rotation: string; mode: string; opacity: number; axes: boolean; grid: boolean; labels: boolean; colors: boolean; productGap: number; layerGap: number; layer: string; step: number; speed: number }
// Self-contained factory, also embedded in the offline HTML.
export function createViewerModel(placements: Placement[], initial: Record<string, unknown> = {}) {
  const ordered = [...placements].sort((a,b) => a.layerIndex-b.layerIndex || a.z-b.z || a.y-b.y || a.x-b.x);
  const levels = [...new Set(ordered.map(p => p.layerIndex))].sort((a,b)=>a-b);
  const ranks = new Map<number, { x: Map<number,number>; y: Map<number,number> }>();
  const coordinates = new Map<number,{x:Set<number>;y:Set<number>}>();
  for (const p of ordered) { let c = coordinates.get(p.layerIndex); if (!c) { c = { x:new Set(),y:new Set() }; coordinates.set(p.layerIndex,c); } c.x.add(p.x); c.y.add(p.y); }
  for (const [layer,c] of coordinates) ranks.set(layer,{x:new Map([...c.x].sort((a,b)=>a-b).map((v,i)=>[v,i])),y:new Map([...c.y].sort((a,b)=>a-b).map((v,i)=>[v,i]))});
  const layerRanks = new Map(levels.map((v,i)=>[v,i]));
  const number = (key:string, fallback:number, min:number, max:number) => typeof initial[key] === 'number' && Number.isFinite(initial[key]) ? Math.max(min,Math.min(max,initial[key] as number)) : fallback;
  const choice = (key:string, choices:string[],fallback:string) => choices.includes(String(initial[key])) ? String(initial[key]) : fallback;
  const bool = (key:string,fallback:boolean) => typeof initial[key] === 'boolean' ? initial[key] as boolean : fallback;
  const state: ViewerSettings = { projection:choice('projection',['3d','top','front','side'],'3d'), rotation:choice('rotation',['z','free'],'z'), mode:choice('mode',['filled','wire','both'],'both'),opacity:number('opacity',0.65,0,1),axes:bool('axes',true),grid:bool('grid',true),labels:bool('labels',false),colors:bool('colors',true),productGap:number('productGap',0,0,100),layerGap:number('layerGap',0,0,100),layer:choice('layer',['all',...levels.map(String)],'all'),step:Math.floor(number('step',ordered.length,0,ordered.length)),speed:[0.25,0.5,1,2,4].includes(Number(initial.speed)) ? Number(initial.speed) : 1 };
  function visible(limit = 600) { const eligible = ordered.slice(0,state.step).filter(p=>state.layer==='all'||p.layerIndex===Number(state.layer)); return { total:eligible.length,items:eligible.slice(-limit) }; }
  function display(p:Placement) { const rank = ranks.get(p.layerIndex)!; return { ...p,x:p.x+(rank.x.get(p.x) ?? 0)*state.productGap,y:p.y+(rank.y.get(p.y) ?? 0)*state.productGap,z:p.z+(layerRanks.get(p.layerIndex) ?? 0)*state.layerGap }; }
  function project(v:number[]) { return state.projection==='front' ? [v[0],v[2]] : state.projection==='side' ? [v[1],v[2]] : [v[0],v[1]]; }
  return { ordered, levels, state, visible, display, project };
}
