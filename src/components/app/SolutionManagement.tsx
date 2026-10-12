import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Product, Solution } from "@/domain/packing/types";
import type { EditorOperation } from "@/domain/packing/editor";
import type { SolutionRecord } from "@/infrastructure/packaging-records";
import { parseSolutionSnapshot } from "@/infrastructure/solution-snapshot";
import { exportSolutionHtml } from "@/infrastructure/report-export";
import { usePackagingData } from "./PackagingDataProvider";
import { RecordTable } from "./RecordTable";
import { SolutionDetails } from "./SolutionDetails";
import { SolutionEditor } from "./SolutionEditor";
import { ActivateSolution } from "./ActivateSolution";
import { OperationLog } from "./OperationLog";
function validated(record: SolutionRecord) { return parseSolutionSnapshot(JSON.stringify(record.snapshot)); }
export function SolutionManagement({ initialId, onRecalculate, onPalletize }: { initialId?: string; onRecalculate(record: SolutionRecord): void; onPalletize(solution: Solution): void }) {
  const { records, write, saveSolution, busy } = usePackagingData();
  const [selectedId, setSelectedId] = useState(initialId ?? ""), [compare, setCompare] = useState<string[]>([]), [editing, setEditing] = useState(false);
  const selected = records.solutions.find(s => s.id === selectedId);
  let parsed: { products: Product[]; solution: Solution } | undefined, error = "";
  if (selected) try { parsed = validated(selected); } catch (failure) { error = failure instanceof Error ? failure.message : "Ongeldige snapshot."; }
  const performValidated = (record: SolutionRecord, action: (parsed: { products: Product[]; solution: Solution }) => void) => { try { action(validated(record)); } catch (failure) { toast.error(failure instanceof Error ? failure.message : "Validatie mislukt."); } };
  return <section className="space-y-5"><div><h1 className="text-2xl font-semibold">Solutions</h1><p className="mt-1 text-xs text-muted-foreground">Fysieke snapshots blijven onveranderd. Alleen naam, notities en status kunnen wijzigen; placements bewerken/herberekenen maakt een nieuwe variant.</p></div>
    <RecordTable label="Solutions" rows={[...records.solutions].sort((a, b) => b.created_on.localeCompare(a.created_on))} selectedId={selectedId} columns={[{ label: "Naam", value: r => r.name }, { label: "Definitie", value: r => records.definitions.find(d => d.id === r.definition_id)?.name ?? "los" }, { label: "Modus", value: r => r.packaging_mode }, { label: "Status", value: r => r.status }, { label: "Bron", value: r => r.created_from }, { label: "Datum", value: r => r.created_on }, { label: "Variant van", value: r => records.solutions.find(s => s.id === r.based_on)?.name ?? "—" }]} actions={r => <><Button size="sm" variant="outline" className="rounded-lg" disabled={busy} onClick={() => { if (editing && !window.confirm("Een andere solution openen? Niet-opgeslagen editorwijzigingen gaan verloren.")) return; setEditing(false); setSelectedId(r.id); }}>Openen</Button><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={compare.includes(r.id)} disabled={!compare.includes(r.id) && compare.length >= 2} onChange={e => setCompare(e.target.checked ? [...compare, r.id] : compare.filter(id => id !== r.id))} />Vergelijken</label></>} />
    {compare.length === 2 && <div className="space-y-3 rounded-2xl border bg-secondary/30 p-4"><h2 className="font-semibold">Snapshotvergelijking</h2><div className="grid gap-3 sm:grid-cols-2">{compare.map(id => { const record = records.solutions.find(s => s.id === id)!; try { const { solution } = validated(record); return <div key={id} className="rounded-xl border bg-card p-3 text-xs"><strong>{record.name}</strong><p className="mt-2">Doos {solution.box.length} × {solution.box.width} × {solution.box.height} mm</p><p>{solution.placements.length} placements · {(solution.utilization * 100).toFixed(1)}% benutting · {solution.weightKg.toFixed(3)} kg</p><p>Speling: {Object.values(solution.spacing).join(" / ")} mm · validatie: {solution.validation.status}</p></div>; } catch (failure) { return <p key={id} className="text-xs text-destructive">{record.name}: {failure instanceof Error ? failure.message : "Ongeldige snapshot"}</p>; } })}</div></div>}
    {selected && <>{!editing && <SolutionMetadata key={selected.id + selected.modified_on} record={selected} />}<div className="flex flex-wrap gap-2">
      <Button variant="outline" className="rounded-xl" disabled={busy || !parsed || editing} onClick={async () => { if (!parsed) return; const copy = await saveSolution({ contractVersion: "0.3", products: parsed.products, solution: parsed.solution }, `${selected.name} · kopie`, selected.definition_id, selected.id); if (copy) setSelectedId(copy.id); }}>Dupliceren</Button>
      <Button variant="outline" className="rounded-xl" disabled={busy || !parsed || editing} onClick={() => setEditing(true)}>Dupliceren en placements bewerken</Button>
      <Button variant="outline" className="rounded-xl" disabled={!parsed || editing} onClick={() => performValidated(selected, () => onRecalculate(selected))}>Herberekenen als variant</Button>
      <Button variant="outline" className="rounded-xl" disabled={editing} onClick={() => performValidated(selected, () => toast.success("Snapshot opnieuw geometrisch gevalideerd."))}>Valideren</Button>
      <ActivateSolution record={selected} disabled={!parsed || editing} />
      <Button variant="outline" className="rounded-xl" disabled={!parsed || editing} onClick={() => performValidated(selected, ({ solution }) => onPalletize(solution))}>Palletiseren</Button>
      <Button variant="outline" className="rounded-xl" disabled={!parsed || editing} onClick={() => performValidated(selected, ({ solution, products }) => exportSolutionHtml(selected.name, solution, products))}>HTML-rapport</Button>
      <Button variant="ghost" className="rounded-xl" disabled={busy || editing} onClick={() => { if (window.confirm(selected.status === "archived" ? "Solution als concept herstellen?" : "Solution archiveren? De fysieke historie blijft bestaan.")) void write("solutions", { status: selected.status === "archived" ? "draft" : "archived" }, selected.id); }}>{selected.status === "archived" ? "Herstellen" : "Archiveren"}</Button>
    </div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{parsed && (editing ? <SolutionEditor key={selected.id} source={selected} {...parsed} onClose={() => setEditing(false)} onSaved={id => { setEditing(false); setSelectedId(id); }} /> : <SolutionDetails key={selected.id} {...parsed} />)}{!editing && <OperationLog title="Opgeslagen operationlog" operations={records.operations.filter(op => op.solution_id === selected.id).sort((a, b) => a.timestamp.localeCompare(b.timestamp)).map(op => ({ operationId: op.id, solutionId: op.solution_id, timestamp: op.timestamp, operationType: op.operation_type as EditorOperation["operationType"], parametersJSON: op.parameters_json, beforePlacementJSON: op.before_placement_json, afterPlacementJSON: op.after_placement_json, user: op.actor, note: op.note }))} />}</>}
  </section>;
}
function SolutionMetadata({ record }: { record: SolutionRecord }) {
  const { write, busy } = usePackagingData();
  const [name, setName] = useState(record.name), [notes, setNotes] = useState(record.metadata.notes ?? "");
  return <form className="space-y-3 rounded-2xl border bg-card p-4" onSubmit={async e => { e.preventDefault(); await write("solutions", { name: name.trim(), metadata: { notes } }, record.id); }}><h2 className="font-semibold">Solutionmetadata</h2><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-xs">Naam<Input className="rounded-xl" required value={name} onChange={e => setName(e.target.value)} /></label><label className="space-y-1 text-xs">Notities<Textarea className="rounded-xl" value={notes} onChange={e => setNotes(e.target.value)} /></label></div><Button size="sm" className="rounded-xl" disabled={busy || !name.trim()}>Metadata opslaan</Button></form>;
}
