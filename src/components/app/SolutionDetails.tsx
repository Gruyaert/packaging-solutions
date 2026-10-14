import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { outside, type Product, type Solution } from '@/domain/packing/types';
import { downloadSolutionSnapshot } from '@/infrastructure/solution-snapshot';
import type { EditorAudit } from '@/domain/packing/editor';
import { solutionViewerData } from '@/infrastructure/interactive-report';
import { usePackagingData } from './PackagingDataProvider';
import { PackagingViewer } from './PackagingViewer';

export function SolutionDetails({ solution, products, editor, definitionId, mode, technical = true }: { solution: Solution; products: Product[]; editor?: EditorAudit; definitionId?: string; mode?: 'STOCK' | 'PERSO'; technical?: boolean }) {
  const { records } = usePackagingData();
  const data = useMemo(() => { const record = records.solutions.find(r => r.snapshot.solution.solutionId === solution.solutionId); const result = solutionViewerData(record?.name ?? solution.box.reference, solution, products, records, record, { definitionId, mode }); if (editor && !record) result.fullSolution = { contractVersion:'0.3', products, solution, editor }; return result; }, [solution, products, editor, records, definitionId, mode]);
  return <section className="min-w-0 max-w-full space-y-3" aria-label="Gekozen oplossing">
    <div className="min-w-0 rounded-2xl border bg-card p-3 sm:p-4"><div className="flex min-w-0 flex-wrap items-center justify-between gap-2"><h3 className="min-w-0 truncate font-semibold" title={solution.box.reference}>{solution.box.reference}</h3><span className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">{(solution.utilization * 100).toFixed(1)}% gevuld</span></div><p className="mt-2 text-sm">Binnenmaat: <strong>{solution.box.length} × {solution.box.width} × {solution.box.height} mm</strong></p><p className="mt-1 truncate text-xs text-muted-foreground" title={products.map(p => `${solution.counts[p.productId] ?? 0} × ${p.reference || 'Product'}`).join(' · ')}>{products.map(p => `${solution.counts[p.productId] ?? 0} × ${p.reference || 'Product'}`).join(' · ')} · {new Set(solution.placements.map(p => p.layerIndex)).size} lagen</p></div>
    {solution.validation.status === 'invalid' && <p role="alert" className="rounded-xl border border-destructive p-3 text-sm text-destructive">Ongeldige oplossing: {solution.validation.errors.join(' · ')}</p>}
    <PackagingViewer data={data} />
    {technical && <SolutionTechnicalDetails solution={solution} products={products} editor={editor} />}
  </section>;
}

export function SolutionTechnicalDetails({ solution, products, editor }: { solution: Solution; products: Product[]; editor?: EditorAudit }) {
  const [page, setPage] = useState(0);
  const outer = outside(solution.box);
  return <details className="rounded-xl border bg-card p-3 text-xs"><summary className="cursor-pointer font-semibold">Maten, controle en technische plaatsingsdata</summary><div className="mt-3 space-y-3"><p>Buitenmaat: {outer.length.toFixed(2)} × {outer.width.toFixed(2)} × {outer.height.toFixed(2)} mm · inhoud {solution.weightKg.toFixed(3)} kg · praktische score {solution.practicalScore.toFixed(1)}</p><p className="truncate" title={products.map(p => `${p.reference}: ${solution.counts[p.productId] ?? 0}/${p.quantity} gevraagd`).join(' · ')}>{products.map(p => `${p.reference}: ${solution.counts[p.productId] ?? 0}/${p.quantity} gevraagd`).join(' · ')} · {solution.metadata.restPlacementIds.length} restplaatsingen</p><p className="break-all text-muted-foreground">Oplossing-ID: {solution.solutionId}</p>
    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => downloadSolutionSnapshot(solution, products, editor)}>Technische JSON downloaden</Button>
    <div className="max-h-72 max-w-full overflow-auto rounded-xl border" tabIndex={0} aria-label="Fysieke plaatsingsdata"><table className="w-full min-w-[640px] whitespace-nowrap text-left text-xs"><thead className="bg-secondary"><tr>{['ID','Product','X','Y','Z','L','B','H','Rotatie','Laag'].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{solution.placements.slice(page * 25, page * 25 + 25).map(p => <tr key={p.placementId} className="border-t">{[p.placementId,p.productId,p.x,p.y,p.z,p.length,p.width,p.height,p.orientation,p.layerIndex+1].map((v,i) => <td key={i} className="p-2">{typeof v === 'number' ? Number(v.toFixed(4)) : v}</td>)}</tr>)}</tbody></table></div>
    <div className="flex flex-wrap items-center gap-3"><Button variant="outline" size="sm" className="rounded-xl" disabled={page === 0} onClick={() => setPage(page - 1)}>Vorige</Button><span>Pagina {page+1}</span><Button variant="outline" size="sm" className="rounded-xl" disabled={(page+1)*25 >= solution.placements.length} onClick={() => setPage(page+1)}>Volgende</Button></div>
    <details><summary className="cursor-pointer">Volledige validatie</summary><pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-background p-3">{JSON.stringify(solution.validation,null,2)}</pre></details></div></details>;
}
