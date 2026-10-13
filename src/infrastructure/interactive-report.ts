import { mountViewer, VIEWER_CSS, type ViewerData } from '@/visualization/viewer-runtime';
import { createViewerModel } from '@/visualization/viewer-model';
import { loadPlotlySource } from '@/visualization/plotly';
import { downloadFile } from './report-export';
import { operatorCardBody, OPERATOR_CARD_CSS } from './operator-card';
import type { Product, Solution } from '@/domain/packing/types';
import type { DefinitionRecord, PackagingRecords, SolutionRecord } from './packaging-records';
import type { PalletResult, PalletSettings, PalletSource } from '@/domain/packing/pallet';
export const escapeReportHtml = (value: unknown) => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]!);
export const scriptJson = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
export function reportFilename(data: ViewerData, date = new Date().toISOString().slice(0,10)) {
  const context = data.context as { definition?: DefinitionRecord; mode?: string } | undefined, d = context?.definition;
  const safe = (v: string) => v.replace(/[^\p{L}\p{N}_-]/gu, '_').slice(0,100) || 'vrij';
  const suffix = d?.scope === 'SHAPE' ? `${safe(d.shape_id)}_${safe(d.variant_id)}_${d.packaging_mode}` : d?.scope === 'PRODUCT' ? `product_${safe(d.product_number)}_${d.packaging_mode}` : safe(data.title);
  return `verpakkingsrapport_${suffix}_${safe(date)}.html`;
}
export function solutionViewerData(title: string, solution: Solution, products: Product[], records?: PackagingRecords, record?: SolutionRecord, options?: { definitionId?: string; mode?: 'STOCK'|'PERSO' }): ViewerData {
  const definition = records?.definitions.find(d => d.id === (record?.definition_id ?? options?.definitionId));
  const shape = definition?.scope === 'SHAPE' ? records?.shapes.find(s => s.shape_id === definition.shape_id && s.variant_id === definition.variant_id) : undefined;
  return { title, kind: 'packaging', products, placements: solution.placements, bounds: solution.box, validation: solution.validation, fullSolution: record?.snapshot ?? { contractVersion:'0.3',products,solution }, context: { definition: definition ?? null, shape: shape ?? null, mode: record?.packaging_mode ?? options?.mode ?? null, productNumber: definition?.product_number ?? null }, pallet: records?.pallets.filter(p => { const source = p.source as { solution?: Solution }; return source?.solution?.solutionId === solution.solutionId; }) ?? [] };
}
export function palletViewerData(title:string,result:PalletResult,settings:PalletSettings,source?:PalletSource,records?:PackagingRecords):ViewerData {
  const solution = source && source.kind !== 'database' ? source.solution : undefined;
  const record = records?.solutions.find(r=>r.snapshot.solution.solutionId===solution?.solutionId);
  const products = source && source.kind !== 'database' ? source.products ?? record?.snapshot.products ?? [] : [];
  const context = source && source.kind !== 'database' ? source.context : undefined;
  const packaging = solution ? solutionViewerData(title,solution,products,records,record,context) : undefined;
  return { title,kind:'pallet',placements:result.placements,products:packaging?.products ?? [],bounds:{length:settings.palletLength,width:settings.palletWidth,height:result.height},validation:{status:'geometrisch berekend',warnings:result.warnings},fullSolution:packaging?.fullSolution ?? source ?? null,context:packaging?.context,pallet:{source:source ?? null,settings,result} };
}
export function buildInteractiveHtml(input: ViewerData, plotlySource: string) {
  const data = { ...input, settings:{...createViewerModel(input.placements,input.settings).state} }, e = escapeReportHtml;
  const section = (title: string, value: unknown) => `<details class="appendix"><summary>${e(title)}</summary><div><pre>${e(JSON.stringify(value ?? null,null,2))}</pre></div></details>`;
  const table = (headers:string[],rows:unknown[][]) => `<div class="table-scroll"><table><thead><tr>${headers.map(h=>`<th>${e(h)}</th>`).join('')}</tr></thead><tbody>${rows.slice(0,600).map(row=>`<tr>${row.map(v=>`<td>${e(v ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${rows.length > 600 ? `<p>Tabel toont de eerste 600/${rows.length} rijen. Alle gegevens staan in packaging-solution-data / Technische data.</p>` : ''}`;
  const source = plotlySource.replace(/<\/script/gi, '<\\/script');
  const runtime = mountViewer.toString().replace(/<\/script/gi,'<\\/script'), model = createViewerModel.toString();
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; worker-src blob:"><title>${e(data.title)}</title><style>${OPERATOR_CARD_CSS}${VIEWER_CSS}</style></head><body><main>
${operatorCardBody(data,e,table)}
<details class="appendix technical"><summary>Technische bijlagen · context, validatie en volledige brondata</summary><div>
${section('Shape / Definition',data.context)}
${section('Validatie / compressibility',{validation:data.validation,compressibility:data.products.map(p=>({product:p.reference,allowCompression:p.allowCompression??false,X:p.compressibilityX??0,Y:p.compressibilityY??0,Z:p.compressibilityZ??0}))})}
<details class="appendix"><summary>Fysieke plaatsingsdata</summary><div>${table(['ID','Product/doos','X','Y','Z','L','B','H','Rotatie','Laag'],data.placements.map(p=>[p.placementId,p.productId,p.x,p.y,p.z,p.length,p.width,p.height,p.orientation,p.layerIndex+1]))}</div></details>
${section('Productinvoer',data.products)}${section('Palletisatie',data.pallet)}${section('Weergave-instellingen',data.settings)}
<details class="appendix"><summary>Technische data · Full solution JSON</summary><div><p>Alle placements zijn ongewijzigd opgenomen in packaging-solution-data. Maten, aantallen en validatie veranderen niet door camerabediening of animatie.</p><pre id="technical-json"></pre></div></details>
</div></details><footer>Offline infokaart · geen internet/CDN nodig · geometrische kijkhulp, geen materiaal- of transportcertificaat. WebGL nodig voor 3D; 2D-aanzichten en het eerste-laagschema blijven beschikbaar.</footer></main>
<script type="application/json" id="packaging-solution-data">${scriptJson(data)}</script><script>${source}</script><script>
const reportData=JSON.parse(document.getElementById('packaging-solution-data').textContent);document.getElementById('technical-json').textContent=JSON.stringify(reportData,null,2);document.getElementById('print-card').onclick=()=>window.print();
const modelFactory=(${model});const startViewer=(${runtime});let viewerRuntime;const host=document.getElementById('viewer');
function start(){if(viewerRuntime)return;try{viewerRuntime=startViewer(host,reportData,window.Plotly,reportData.settings||{},undefined,modelFactory);}catch(error){host.textContent='Viewer kon niet starten: '+String(error);}}
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){start();observer.disconnect();}},{rootMargin:'100px'});observer.observe(host);}else start();
</script></body></html>`;
}
export async function exportInteractiveReport(data: ViewerData) { const source = await loadPlotlySource(); downloadFile(reportFilename(data), buildInteractiveHtml(data, source), 'text/html;charset=utf-8'); }
