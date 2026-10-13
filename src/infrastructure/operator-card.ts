import type { ViewerData } from '@/visualization/viewer-runtime';
import { createViewerModel } from '@/visualization/viewer-model';
import type { Solution } from '@/domain/packing/types';
import { outside } from '@/domain/packing/types';
import type { PalletResult, PalletSettings, PalletSource } from '@/domain/packing/pallet';

export const OPERATOR_CARD_CSS = `
*{box-sizing:border-box}body{--ink:#0f172a;--blue:#2563eb;--line:#cbd5e1;font:15px/1.5 system-ui,sans-serif;color:var(--ink);background:#f1f5f9;margin:0;padding:16px;overflow-wrap:anywhere}main{max-width:1200px;margin:auto}header{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:16px}.eyebrow{color:#1d4ed8;font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:700}h1{font-size:clamp(22px,4vw,32px);line-height:1.2;margin:4px 0}h2{font-size:18px;margin:0 0 12px}h3{font-size:15px}.meta{font-size:12px;color:#475569}.stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:16px}.stat,.panel,.appendix{background:#fff;border:1px solid var(--line);border-radius:18px;padding:16px;min-width:0}.stat span{display:block;font-size:12px;color:#475569}.stat strong{display:block;margin-top:6px;font-size:20px;color:#1d4ed8}.work{display:grid;gap:16px;grid-template-columns:minmax(240px,.4fr) minmax(0,1fr);align-items:start}.panel{margin-bottom:16px}.table-scroll{overflow:auto;max-height:420px;max-width:100%}table{border-collapse:collapse;width:100%;font-size:13px}th,td{text-align:left;padding:9px 6px;border-bottom:1px solid #e2e8f0}th{color:#475569;font-size:12px}summary{cursor:pointer;min-height:32px;font-weight:600;color:#1d4ed8}.appendix{margin-top:12px}.appendix>div{margin-top:12px}pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:350px;overflow:auto;font-size:12px}.layer-plan{width:100%;max-height:290px;display:block;margin:12px 0;background:#f8fafc;border-radius:12px}.notice{background:#eff6ff;border:1px solid #93c5fd;color:#1e3a8a;border-radius:14px;padding:12px;margin-bottom:16px;font-size:13px}.danger{background:#fff1f2;border-color:#fda4af;color:#9f1239}.print-button{cursor:pointer;min-height:44px;border:1px solid #93c5fd;border-radius:12px;background:#fff;color:#1d4ed8;padding:10px 16px;font-weight:700}footer{padding:16px 0;font-size:12px;color:#475569}.screen-only{font-size:12px;color:#475569}
@media(max-width:760px){body{padding:10px}.work{display:flex;flex-direction:column}.work>section{width:100%}.visual{order:-1}.stats{gap:6px}.stat{padding:10px}.stat strong{font-size:16px}header{align-items:flex-start}.print-button{padding:8px}}
@media print{body{background:#fff;padding:0;font-size:11px}.print-button,.screen-only,#viewer,.technical{display:none!important}.work{display:block}.stats{margin-bottom:8px}.panel,.stat{break-inside:avoid;border-color:#94a3b8;padding:10px}.layer-plan{max-height:310px}.appendix:not([open]){display:none}header{margin:0 0 8px}h1{font-size:22px}footer{font-size:10px}}
`;

export function operatorCardBody(data: ViewerData, escape: (value: unknown) => string, table: (headers: string[], rows: unknown[][]) => string) {
  const e = escape, isPallet = data.kind === 'pallet';
  const pallet = isPallet ? data.pallet as { settings?: PalletSettings; result?: PalletResult; source?: PalletSource } | undefined : undefined;
  const snapshot = data.fullSolution as { solution?: Solution } | undefined;
  const box = isPallet ? pallet?.source?.kind === 'database' ? pallet.source.box : snapshot?.solution?.box : snapshot?.solution?.box;
  const outer = box ? outside(box) : undefined;
  const levels = [...new Set(data.placements.map(p=>p.layerIndex))].sort((a,b)=>a-b);
  const counts = new Map<string,number>();
  for(const p of data.placements)counts.set(p.productId,(counts.get(p.productId)??0)+1);
  const label = (id:string) => isPallet ? box?.reference??id : data.products.find(p=>p.productId===id)?.reference??id;
  const dimensions = (d:{length:number;width:number;height:number}) => `${d.length} × ${d.width} × ${d.height} mm`;
  const groups = [...counts].map(([id,count])=>[label(id),count]);
  const first = data.placements.filter(p=>p.layerIndex===levels[0]);
  const shown = first.slice(0,600);
  const minX=Math.min(0,...shown.map(p=>p.x)),minY=Math.min(0,...shown.map(p=>p.y));
  const maxX=Math.max(data.bounds.length,...shown.map(p=>p.x+p.length)),maxY=Math.max(data.bounds.width,...shown.map(p=>p.y+p.width));
  const ids=[...new Set(createViewerModel(data.placements).ordered.map(p=>p.productId))];
  const colors=['#2563eb','#7c3aed','#d97706','#db2777','#0284c7'];
  const plan=`<svg class="layer-plan" viewBox="${minX-10} ${minY-10} ${maxX-minX+20} ${maxY-minY+20}" role="img" aria-label="Bovenaanzicht eerste laag"><rect x="0" y="0" width="${data.bounds.length}" height="${data.bounds.width}" fill="white" stroke="#334155" stroke-width="2" vector-effect="non-scaling-stroke"/>${shown.map(p=>`<rect x="${p.x}" y="${p.y}" width="${p.length}" height="${p.width}" fill="${colors[ids.indexOf(p.productId)%colors.length]}" fill-opacity=".3" stroke="#1e40af" vector-effect="non-scaling-stroke"><title>${e(label(p.productId))} · ${e(p.orientation)} · ${e(p.length)} × ${e(p.width)} mm</title></rect>`).join('')}</svg>`;
  const layerRows = levels.map(level=>{const placements=data.placements.filter(p=>p.layerIndex===level);const layerCounts=new Map<string,number>();for(const p of placements)layerCounts.set(p.productId,(layerCounts.get(p.productId)??0)+1);return [level+1,[...layerCounts].map(([id,n])=>`${n} × ${label(id)}`).join(' · '),[...new Set(placements.map(p=>p.orientation))].join(' / ')];});
  const invalid=data.validation.status==='invalid';
  return `<header><div><div class="eyebrow">Operator-infokaart · ${isPallet?'stapelen':'doos vullen'}</div><h1>${e(data.title)}</h1><div class="meta">Maten in millimeters · X = lengte · Y = breedte · Z = hoogte</div></div><button class="print-button" id="print-card" type="button">Afdrukken</button></header>
${invalid?`<div class="notice danger" role="alert"><strong>Niet gebruiken: ongeldige oplossing.</strong> ${e((data.validation.errors??[]).join(' · '))}</div>`:''}
<div class="stats"><div class="stat"><span>${isPallet?'Palletbasis':'Omdoos · binnenmaat'}</span><strong>${e(isPallet&&pallet?.settings?`${pallet.settings.palletLength} × ${pallet.settings.palletWidth} × ${pallet.settings.palletHeight} mm`:dimensions(data.bounds))}</strong></div><div class="stat"><span>${isPallet?'Dozen totaal':'Stuks per omdoos'}</span><strong>${data.placements.length}</strong></div><div class="stat"><span>${isPallet?'Lagen · totale hoogte':'Aantal lagen'}</span><strong>${levels.length}${isPallet?` · ${e(data.bounds.height)} mm`:''}</strong></div></div>
<div class="work"><section class="panel"><h2>${isPallet?'Wat stapel je?':'Wat gaat in de doos?'}</h2>${table([isPallet?'Omdoos':'Product','Aantal in dit schema'],groups)}${outer?`<p class="meta">Omdoos · buitenmaat: <strong>${e(dimensions(outer))}</strong></p>`:''}<h3>Eerste laag · van boven</h3>${plan}<p class="meta">${first.length} ${isPallet?'dozen':'stuks'} op laag ${(levels[0]??0)+1}${first.length>600?' · eerste 600 getekend':''}. Lengte (X) horizontaal, breedte (Y) verticaal.</p><h3>Laagopbouw</h3>${table(['Laag','Inhoud','Oriëntatie L/B/H'],layerRows)}<p class="meta">L-B-H = uitgangspositie. De volgorde geeft de product-/doosmaten langs X, Y en Z aan.</p></section>
<section class="panel visual"><h2>${isPallet?'Zo stapel je de pallet':'Zo vul je de doos'}</h2><div id="viewer"></div><p class="screen-only">Bekijk ook Boven, Voor of Zij. Kies een laag of open Stap voor stap vullen / stapelen. De animatie is een geometrische kijkhulp, geen gecertificeerde montagevolgorde.</p></section></div>
${isPallet?'<div class="notice">Palletisatie is geometrisch berekend. Draagkracht, gewichtslimieten en transportstabiliteit zijn niet gecertificeerd; volg de geldende werkplaatsinstructies.</div>':''}
${data.validation.warnings.length?`<details class="appendix"><summary>Aandachtspunten bij deze berekening (${data.validation.warnings.length})</summary><div>${data.validation.warnings.map(w=>`<p>${e(w)}</p>`).join('')}</div></details>`:''}`;
}
