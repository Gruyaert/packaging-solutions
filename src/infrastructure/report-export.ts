import type { Product, Solution } from "@/domain/packing/types";

export function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const escapeHtml = (value: unknown) => String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
export function exportSolutionHtml(name: string, solution: Solution, products: Product[]) {
  const headers = ["ID", "Product", "X", "Y", "Z", "L", "B", "H", "Rotatie", "Laag"];
  const rows = solution.placements.map(p => [p.placementId, products.find(q => q.productId === p.productId)?.reference ?? p.productId, p.x, p.y, p.z, p.length, p.width, p.height, p.orientation, p.layerIndex + 1]);
  const layers = [...new Set(solution.placements.map(p => p.layerIndex))].map(layer => `<h2>Laag ${layer + 1}</h2><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${solution.box.length} ${solution.box.width}" style="max-height:300px;width:100%;border:1px solid #cbd5d1">${solution.placements.filter(p => p.layerIndex === layer).map(p => `<rect x="${p.x}" y="${p.y}" width="${p.length}" height="${p.width}" fill="#83b8aa" stroke="#26634f"><title>${escapeHtml(p.placementId)}</title></rect>`).join("")}</svg>`).join("");
  downloadFile("packaging-report.html", `<!doctype html><html lang="nl"><meta charset="utf-8"><title>${escapeHtml(name)}</title><style>body{font:14px system-ui;color:#21473b;max-width:1100px;margin:40px auto;padding:20px}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #cbd5d1;padding:6px;text-align:left}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><h1>${escapeHtml(name)}</h1><p>Contract 0.3 · heuristische zoekdekking · geen transportcertificering.</p><p>Doos: ${escapeHtml(solution.box.reference)} · binnen ${solution.box.length} × ${solution.box.width} × ${solution.box.height} mm · karton ${solution.box.cardboard} mm.</p><p>${(solution.utilization * 100).toFixed(1)}% benutting · ${solution.weightKg.toFixed(3)} kg.</p>${layers}<h2>Placements · mm</h2><table><thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(value => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`).join("")}</tbody></table><h2>ValidationJSON</h2><pre>${escapeHtml(JSON.stringify(solution.validation, null, 2))}</pre></html>`, "text/html;charset=utf-8");
}
