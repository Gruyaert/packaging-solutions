import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Product, Solution } from "@/domain/packing/types";
import { outside } from "@/domain/packing/types";
import { downloadSolutionSnapshot } from "@/infrastructure/solution-snapshot";
export function SolutionDetails({ solution, products }: { solution: Solution; products: Product[] }) {
  const [layer, setLayer] = useState(0), [page, setPage] = useState(0);
  const layers = [...new Set(solution.placements.map(p => p.layerIndex))];
  const outer = outside(solution.box);
  const colors = ["var(--primary)", "var(--foreground)", "var(--muted-foreground)", "var(--accent-foreground)", "var(--ring)"];
  return <section className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5" aria-label="Solutiondetail">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">{solution.box.reference} · {solution.solutionId}</h3><Button variant="outline" className="rounded-xl" onClick={() => downloadSolutionSnapshot(solution, products)}>Solution JSON downloaden</Button></div>
    <p className="text-sm">Binnenmaat {solution.box.length.toFixed(2)} × {solution.box.width.toFixed(2)} × {solution.box.height.toFixed(2)} mm · buitenmaat {outer.length.toFixed(2)} × {outer.width.toFixed(2)} × {outer.height.toFixed(2)} mm</p>
    <p className="text-sm">{(solution.utilization * 100).toFixed(1)}% benutting · {(solution.air * 100).toFixed(1)}% lucht · {solution.weightKg.toFixed(3)} kg · score {solution.practicalScore.toFixed(1)}</p>
    <p className="text-xs text-muted-foreground">{products.map(p => `${p.reference}: ${solution.counts[p.productId] ?? 0}/${p.quantity} gevraagd`).join(" · ")} · restplacements: {solution.metadata.restPlacementIds.length}</p>
    <label className="flex items-center gap-3 text-sm">Bovenaanzicht per laag<select className="rounded-xl border bg-background p-2" value={layer} onChange={e => setLayer(Number(e.target.value))}>{layers.map(n => <option key={n} value={n}>Laag {n + 1}</option>)}</select></label>
    <svg role="img" aria-label={`Fysieke placements laag ${layer + 1}; X lengte, Y breedte`} viewBox={`0 0 ${solution.box.length} ${solution.box.width}`} className="max-h-80 w-full rounded-xl border bg-background">
      <rect x={0} y={0} width={solution.box.length} height={solution.box.width} fill="none" stroke="hsl(var(--border))" />
      {solution.placements.filter(p => p.layerIndex === layer).map(p => <rect key={p.placementId} x={p.x} y={p.y} width={p.length} height={p.width} fill={`hsl(${colors[Math.max(0, products.findIndex(q => q.productId === p.productId))]})`} fillOpacity={0.35} stroke={solution.metadata.restPlacementIds.includes(p.placementId) ? "hsl(var(--destructive))" : "hsl(var(--primary))"} strokeWidth={1} vectorEffect="non-scaling-stroke"><title>{p.placementId} · {p.productId} · z={p.z} · {p.orientation}</title></rect>)}
    </svg>
    <p className="text-xs text-muted-foreground">Alleen-lezen projectie. Rode rand = gedetecteerd los restproduct. Laagkeuze verandert geen placementwaarde. Vrije hoogte blijft volledig bovenaan.</p>
    <div className="max-h-72 overflow-auto rounded-xl border" tabIndex={0} aria-label="Fysieke plaatsingsdata"><table className="w-full whitespace-nowrap text-left text-xs"><thead className="bg-secondary"><tr>{["ID", "Product", "X", "Y", "Z", "L", "B", "H", "Rotatie", "Laag", "Rest"].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{solution.placements.slice(page * 25, page * 25 + 25).map(p => <tr key={p.placementId} className="border-t">{[p.placementId, p.productId, p.x, p.y, p.z, p.length, p.width, p.height, p.orientation, p.layerIndex, solution.metadata.restPlacementIds.includes(p.placementId) ? "ja" : "nee"].map((v, i) => <td key={i} className="p-2">{typeof v === "number" ? Number(v.toFixed(4)) : v}</td>)}</tr>)}</tbody></table></div>
    <div className="flex items-center gap-3"><Button variant="outline" className="rounded-xl" disabled={page === 0} onClick={() => setPage(page - 1)}>Vorige</Button><span className="text-xs">Pagina {page + 1}</span><Button variant="outline" className="rounded-xl" disabled={(page + 1) * 25 >= solution.placements.length} onClick={() => setPage(page + 1)}>Volgende</Button></div>
    <details className="text-xs"><summary className="cursor-pointer font-semibold">ValidationJSON · {solution.validation.status}</summary><pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-background p-3">{JSON.stringify(solution.validation, null, 2)}</pre></details>
  </section>;
}
