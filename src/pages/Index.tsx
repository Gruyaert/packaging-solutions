import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app/AppShell";
import { WorkspaceNavigation } from "@/components/app/WorkspaceNavigation";
import { PackingWorkbench } from "@/components/app/PackingWorkbench";
import { ExcelInspector } from "@/components/app/ExcelInspector";
import { CartonManagement } from "@/components/app/CartonManagement";
import { ShapeManagement } from "@/components/app/ShapeManagement";
import { DefinitionManagement } from "@/components/app/DefinitionManagement";
import { SolutionManagement } from "@/components/app/SolutionManagement";
import { PalletPanel } from "@/components/app/PalletPanel";
import { ReportsPanel } from "@/components/app/ReportsPanel";
import { PerformanceDashboard } from "@/components/app/PerformanceDashboard";
import { usePackagingData } from "@/components/app/PackagingDataProvider";
import type { DefinitionRecord, ShapeRecord, SolutionRecord } from "@/infrastructure/packaging-records";
import type { Product, Solution } from "@/domain/packing/types";

export default function Index() {
  const { records, loading, error, refresh, busy, storage } = usePackagingData();
  const [tab, setTab] = useState("search"), [mode, setMode] = useState<"search" | "custom">("search");
  const [shape, setShape] = useState<ShapeRecord>(), [definitionId, setDefinitionId] = useState<string>(), [initial, setInitial] = useState<SolutionRecord>(), [solutionId, setSolutionId] = useState<string>(), [palletSolution, setPalletSolution] = useState<Solution>();
  const [palletProducts, setPalletProducts] = useState<Product[]>([]);
  const [palletContext, setPalletContext] = useState<{ definitionId?: string; mode?: "STOCK" | "PERSO" }>();
  const navigate = (value: string) => { setTab(value); if (value === "search" || value === "custom") setMode(value); };
  const openSolution = (id: string) => { setSolutionId(id); setTab("solutions"); };
  const palletize = (solution: Solution, products: Product[], context?: { definitionId?: string; mode?: "STOCK" | "PERSO" }) => { const record = records.solutions.find(r => r.snapshot.solution.solutionId === solution.solutionId); setPalletSolution(solution); setPalletProducts(products); setPalletContext(record ? { definitionId: record.definition_id ?? undefined, mode: record.packaging_mode } : context); setTab("pallet"); };
  const calculate = (definition: DefinitionRecord) => { setInitial(undefined); setDefinitionId(definition.id); navigate(definition.packaging_mode === "PERSO" ? "custom" : "search"); };
  const recalculate = (record: SolutionRecord) => { setInitial(record); setDefinitionId(record.definition_id ?? undefined); navigate(record.packaging_mode === "PERSO" ? "custom" : "search"); };
  return <AppShell><div className="min-w-0 space-y-5">
    <WorkspaceNavigation value={tab} onNavigate={navigate} />
    {loading && <p className="rounded-2xl border bg-card p-5 text-sm">Werkruimte laden…</p>}
    {error && <div role="alert" className="space-y-3 rounded-2xl border border-destructive/30 bg-card p-4"><p className="text-sm text-destructive">Werkruimte niet geladen: {error}</p><Button variant="outline" className="rounded-xl" onClick={() => refresh()}>Opnieuw laden</Button></div>}
    {!loading && !error && <>
      {(tab === "search" || tab === "custom") && <PackingWorkbench mode={mode} initial={initial} definitionId={definitionId} onSaved={openSolution} onPalletize={palletize} />}
      {tab === "pallet" && <PalletPanel solution={palletSolution} products={palletProducts} context={palletContext} />}
      {tab === "cartons" && <CartonManagement />}
      {tab === "shapes" && <ShapeManagement onDefinition={s => { setShape(s); setTab("definitions"); }} />}
      {tab === "definitions" && <DefinitionManagement seed={shape} onCalculate={calculate} onSolution={openSolution} />}
      {tab === "solutions" && <SolutionManagement key={solutionId ?? "all"} initialId={solutionId} onRecalculate={recalculate} onPalletize={palletize} />}
      {tab === "reports" && <ReportsPanel onSolution={openSolution} />}
      {tab === "debug" && <section className="min-w-0 space-y-5"><div><h1 className="text-xl font-semibold">Debug / Performance</h1><p className="mt-1 text-xs text-muted-foreground">Technische diagnose blijft beschikbaar als secundaire werkruimte.</p></div><PerformanceDashboard /><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{Object.entries(records).map(([kind, rows]) => <div key={kind} className="rounded-2xl border bg-card p-3"><p className="truncate text-xs text-muted-foreground">{kind}</p><p className="mt-1 text-xl font-semibold">{rows.length}</p></div>)}</div><Button variant="outline" className="rounded-xl" disabled={busy} onClick={() => refresh()}>{storage === "local" ? "Lokale records controleren" : "Database opnieuw laden"}</Button><ExcelInspector /></section>}
    </>}
  </div></AppShell>;
}
