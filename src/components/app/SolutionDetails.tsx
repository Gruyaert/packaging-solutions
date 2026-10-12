import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { outside, type Product, type Solution } from '@/domain/packing/types';
import { downloadSolutionSnapshot } from '@/infrastructure/solution-snapshot';
import type { EditorAudit } from '@/domain/packing/editor';
import { solutionViewerData } from '@/infrastructure/interactive-report';
import { usePackagingData } from './PackagingDataProvider';
import { PackagingViewer } from './PackagingViewer';
export function SolutionDetails({ solution, products, editor, definitionId, mode }: { solution: Solution; products: Product[]; editor?: EditorAudit; definitionId?: string; mode?: 'STOCK' | 'PERSO' }) {
  const [page, setPage] = useState(0), { records } = usePackagingData();
  const outer = outside(solution.box);
  const data = useMemo(() => { const record = records.solutions.find(r => r.snapshot.solution.solutionId === solution.solutionId); const result = solutionViewerData(record?.name ?? solution.box.reference, solution, products, records, record, { definitionId, mode }); if (editor && !record) result.fullSolution = { contractVersion:'0.3', products, solution, editor }; return result; }, [solution, products, editor, records, definitionId, mode]);
  return <section className="min-w-0 space-y-4 rounded-2xl border bg-card p-4 sm:p-5" aria-label="Solutiondetail">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="break-all font-semibold">{solution.box.reference} · {solution.solutionId}</h3><Button variant="outline" className="rounded-xl" onClick={() => downloadSolutionSnapshot(solution, products, editor)}>Solution JSON downloaden</Button></div>
    <p className="text-sm">Binnenmaat {solution.box.length.toFixed(2)} × {solution.box.width.toFixed(2)} × {solution.box.height.toFixed(2)} mm · buitenmaat {outer.length.toFixed(2)} × {outer.width.toFixed(2)} × {outer.height.toFixed(2)} mm</p>
    <p className="text-sm">{(solution.utilization * 100).toFixed(1)}% benutting · {(solution.air * 100).toFixed(1)}% lucht · {solution.weightKg.toFixed(3)} kg · score {solution.practicalScore.toFixed(1)}</p>
    <p className="text-xs text-muted-foreground">{products.map(p => `${p.reference}: ${solution.counts[p.productId] ?? 0}/${p.quantity} gevraagd`).join(' · ')} · restplacements: {solution.metadata.restPlacementIds.length}</p>
    <PackagingViewer key={solution.solutionId} data={data} />
    <div className="max-h-72 overflow-auto rounded-xl border" tabIndex={0} aria-label="Fysieke plaatsingsdata"><table className="w-full whitespace-nowrap text-left text-xs"><thead className="bg-secondary"><tr>{['ID','Product','X','Y','Z','L','B','H','Rotatie','Laag'].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{solution.placements.slice(page * 25, page * 25 + 25).map(p => <tr key={p.placementId} className="border-t">{[p.placementId,p.productId,p.x,p.y,p.z,p.length,p.width,p.height,p.orientation,p.layerIndex+1].map((v,i) => <td key={i} className="p-2">{typeof v === 'number' ? Number(v.toFixed(4)) : v}</td>)}</tr>)}</tbody></table></div>
    <div className="flex items-center gap-3"><Button variant="outline" className="rounded-xl" disabled={page === 0} onClick={() => setPage(page - 1)}>Vorige</Button><span className="text-xs">Pagina {page+1}</span><Button variant="outline" className="rounded-xl" disabled={(page+1)*25 >= solution.placements.length} onClick={() => setPage(page+1)}>Volgende</Button></div>
    <details className="text-xs"><summary className="cursor-pointer font-semibold">ValidationJSON · {solution.validation.status}</summary><pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-background p-3">{JSON.stringify(solution.validation,null,2)}</pre></details>
  </section>;
}
