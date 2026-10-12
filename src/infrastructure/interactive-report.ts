import { mountViewer, VIEWER_CSS, type ViewerData } from '@/visualization/viewer-runtime';
import { createViewerModel } from '@/visualization/viewer-model';
import { loadPlotlySource } from '@/visualization/plotly';
import { downloadFile } from './report-export';
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
  const section = (title: string, value: unknown) => `<section><h2>${title}</h2><pre>${e(JSON.stringify(value ?? null,null,2))}</pre></section>`;
  const table = (headers:string[],rows:unknown[][]) => `<div class="table-scroll"><table><thead><tr>${headers.map(h=>`<th>${e(h)}</th>`).join('')}</tr></thead><tbody>${rows.slice(0,600).map(row=>`<tr>${row.map(v=>`<td>${e(v ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${rows.length > 600 ? `<p>Tabel toont de eerste 600/${rows.length} rijen. Alle gegevens staan in packaging-solution-data / Technische data.</p>` : ''}`;
  const counts = data.placements.reduce<Record<string,number>>((acc,p) => { acc[String(p.layerIndex+1)] = (acc[String(p.layerIndex+1)] ?? 0)+1; return acc; }, {});
  const source = plotlySource.replace(/<\/script/gi, '<\\/script');
  const runtime = mountViewer.toString().replace(/<\/script/gi,'<\\/script'), model = createViewerModel.toString();
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; worker-src blob:"><title>${e(data.title)}</title><style>
*{box-sizing:border-box}body{--report-ink:#0f172a;--report-bg:#f8fafc;--report-border:#cbd5e1;--report-blue:#2563eb;font:14px system-ui;color:var(--report-ink);background:var(--report-bg);max-width:1100px;margin:auto;padding:16px;overflow-wrap:anywhere}section{min-width:0;background:#fff;border:1px solid var(--report-border);border-radius:20px;padding:16px;margin:16px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:400px;overflow:auto;font-size:12px}h2{font-size:18px}.table-scroll{max-width:100%;max-height:420px;overflow:auto}table{border-collapse:collapse;font-size:12px;width:100%}th,td{text-align:left;border-bottom:1px solid var(--report-border);padding:8px}h1{font-size:26px}summary{cursor:pointer} ${VIEWER_CSS}
</style></head><body><h1>${e(data.title)}</h1><section><h2>1. Overzicht</h2><p>${e(data.kind)} · ${data.placements.length} placements · validatie ${e(data.validation.status)}</p><p>Offline rapport; geen server/CDN. JSON is waarheid; uit elkaar trekken en animatie zijn uitsluitend visueel. Geen materiaal- of transportcertificaat.</p></section>
${section('2. Shape / Definition',data.context)}
<section><h2>3. Producten</h2>${data.products.length?table(['Referentie','L/B/H mm','Aantal gevraagd','Gewicht kg','Rotaties'],data.products.map(p=>[p.reference,`${p.length}/${p.width}/${p.height}`,p.quantity,p.weightKg,p.rotations.join(', ')])):'<p>Geen productgegevens in deze bron; doosplacements blijven beschikbaar.</p>'}</section>
<section><h2>4. Verpakking</h2><p>Viewergrens L/B/H: ${e(data.bounds.length)} / ${e(data.bounds.width)} / ${e(data.bounds.height)} mm.</p>${table(['ID','Product/doos','X','Y','Z','L','B','H','Rotatie','Laag'],data.placements.map(p=>[p.placementId,p.productId,p.x,p.y,p.z,p.length,p.width,p.height,p.orientation,p.layerIndex+1]))}<p>Omdoos, karton en speling staan ongewijzigd in de volledige solution JSON.</p></section>
<section><h2>5. 3D / Projecties</h2><p>Standaard draai je horizontaal rond de Z-as door links/rechts te slepen. Zoom met het muiswiel. Kies Meer weergaveopties → Draaien voor vrije rotatie. Reset camera herstelt het overzicht. WebGL vereist voor 3D; 2D-projecties blijven beschikbaar.</p><div id="viewer"></div></section>
${section('6. Validatie / compressibility', { validation:data.validation, compressibility:data.products.map(p=>({product:p.reference,allowCompression:p.allowCompression ?? false,X:p.compressibilityX ?? 0,Y:p.compressibilityY ?? 0,Z:p.compressibilityZ ?? 0})) })}
<section><h2>7. Laagopbouw</h2>${table(['Laag','Placements'],Object.entries(counts))}</section>${section('8. Palletisatie',data.pallet)}${section('9. Instellingen',data.settings)}
<section><h2>10. Technische data</h2><p>Volledige brondata inclusief placements in packaging-solution-data. De viewer begrenst alleen zichtbare geometrie, niet deze JSON.</p><details><summary>Full solution JSON</summary><pre id="technical-json"></pre></details></section>
<script type="application/json" id="packaging-solution-data">${scriptJson(data)}</script><script>${source}</script><script>const reportData=JSON.parse(document.getElementById('packaging-solution-data').textContent);document.getElementById('technical-json').textContent=JSON.stringify(reportData,null,2);const modelFactory=(${model});const startViewer=(${runtime});let viewerRuntime;const host=document.getElementById('viewer');const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!viewerRuntime){try{viewerRuntime=startViewer(host,reportData,window.Plotly,reportData.settings||{},undefined,modelFactory);}catch(error){host.textContent='Viewer kon niet starten: '+String(error);}}},{rootMargin:'100px'});observer.observe(host);</script></body></html>`;
}
export async function exportInteractiveReport(data: ViewerData) { const source = await loadPlotlySource(); downloadFile(reportFilename(data), buildInteractiveHtml(data, source), 'text/html;charset=utf-8'); }
