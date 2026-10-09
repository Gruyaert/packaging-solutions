import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product, Solution } from "@/domain/packing/types";
import { usePackagingData } from "./PackagingDataProvider";
import { RecordTable } from "./RecordTable";

export function SaveSolution({ solution, products, mode, definitionId, basedOn, onSaved }: { solution: Solution; products: Product[]; mode: "search" | "custom"; definitionId?: string; basedOn?: string; onSaved(id: string): void }) {
  const { records, saveSolution, busy } = usePackagingData();
  const expectedMode = mode === "custom" ? "PERSO" : "STOCK";
  const [name, setName] = useState(solution.box.reference), [definition, setDefinition] = useState(records.definitions.find(d => d.id === definitionId)?.packaging_mode === expectedMode ? definitionId! : "");
  const parent = records.solutions.find(s => s.id === basedOn);
  const modeMismatch = !!parent && parent.packaging_mode !== expectedMode;
  const selected = records.definitions.find(d => d.id === definition);
  return <details className="rounded-xl border bg-secondary/20 p-4"><summary className="cursor-pointer text-sm font-semibold">{basedOn ? "Nieuwe fysieke variant opslaan" : "Solution opslaan in werkruimte"}</summary><form className="mt-4 space-y-3" onSubmit={async e => { e.preventDefault(); const saved = await saveSolution({ contractVersion: "0.3", products, solution }, name, definition || null, basedOn, mode); if (saved) onSaved(saved.id); }}>
    <label className="block space-y-1 text-xs">Naam<Input className="rounded-xl" required value={name} onChange={e => setName(e.target.value)} /></label><p className="text-xs">Context: {selected ? `${selected.name} · ${selected.packaging_mode}` : "losse solution, zonder definitie"}{basedOn && " · afgeleid van een bestaande snapshot"}</p>
    {!basedOn && <><Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => setDefinition("")}>Zonder definitie opslaan</Button><RecordTable label="Opslagdefinitie" rows={records.definitions.filter(d => d.status === "active" && d.packaging_mode === expectedMode)} selectedId={definition} columns={[{ label: "Naam", value: d => d.name }, { label: "Scope", value: d => d.scope }, { label: "Modus", value: d => d.packaging_mode }, { label: "Product / shape", value: d => d.product_number || `${d.shape_id}/${d.variant_id}` }]} actions={d => <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={() => setDefinition(d.id)}>Kiezen</Button>} /></>}
    <p className="text-xs text-muted-foreground">Immutable snapshot met producten, doos, speling, placements en herberekende validatie. Activeren is een afzonderlijke handeling.</p>{modeMismatch && <p role="alert" className="text-xs text-destructive">Een variant moet in de oorspronkelijke {parent!.packaging_mode}-modus blijven. Gebruik de oorspronkelijke zoek-/maatwerktab.</p>}<Button className="rounded-xl" disabled={busy || !name.trim() || modeMismatch}>Opslaan en openen</Button>
  </form></details>;
}
