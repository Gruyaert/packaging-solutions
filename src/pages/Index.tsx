import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "@/components/app/AppShell";
import { PackingWorkbench } from "@/components/app/PackingWorkbench";
import { ExcelInspector } from "@/components/app/ExcelInspector";
import { CartonManagement } from "@/components/app/CartonManagement";
import { ShapeManagement } from "@/components/app/ShapeManagement";
import { DefinitionManagement } from "@/components/app/DefinitionManagement";
import { SolutionManagement } from "@/components/app/SolutionManagement";
import { PalletPanel } from "@/components/app/PalletPanel";
import { ReportsPanel } from "@/components/app/ReportsPanel";
import { usePackagingData } from "@/components/app/PackagingDataProvider";
import type { DefinitionRecord, ShapeRecord, SolutionRecord } from "@/infrastructure/packaging-records";
import type { Solution } from "@/domain/packing/types";

const tabs = [ ["search", "Verpakking zoeken"], ["custom", "Omdoos op maat"], ["pallet", "Palletisatie"], ["cartons", "Omdozenbeheer"], ["shapes", "Shapes masterdata"], ["definitions", "Packaging Definitions"], ["solutions", "Solutions"], ["reports", "Rapporten / Exports"] ];
export default function Index() {
  const { records, loading, error, refresh, busy } = usePackagingData();
  const [tab, setTab] = useState("search"), [mode, setMode] = useState<"search" | "custom">("search");
  const [shape, setShape] = useState<ShapeRecord>(), [definitionId, setDefinitionId] = useState<string>(), [initial, setInitial] = useState<SolutionRecord>(), [solutionId, setSolutionId] = useState<string>(), [palletSolution, setPalletSolution] = useState<Solution>();
  const navigate = (value: string) => { setTab(value); if (value === "search" || value === "custom") setMode(value); };
  const openSolution = (id: string) => { setSolutionId(id); setTab("solutions"); };
  const palletize = (solution: Solution) => { setPalletSolution(solution); setTab("pallet"); };
  const calculate = (definition: DefinitionRecord) => { setInitial(undefined); setDefinitionId(definition.id); navigate(definition.packaging_mode === "PERSO" ? "custom" : "search"); };
  const recalculate = (record: SolutionRecord) => { setInitial(record); setDefinitionId(record.definition_id ?? undefined); navigate(record.packaging_mode === "PERSO" ? "custom" : "search"); };
  return <AppShell><Tabs value={tab} onValueChange={navigate} className="min-w-0 space-y-5"><div className="flex flex-wrap items-start gap-2"><TabsList className="grid h-auto min-w-0 flex-1 grid-cols-2 gap-1 rounded-2xl bg-secondary p-1.5 sm:grid-cols-4 xl:grid-cols-8">{tabs.map(([value, label]) => <TabsTrigger key={value} value={value} className="min-h-11 whitespace-normal rounded-xl px-2 text-xs leading-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none">{label}</TabsTrigger>)}</TabsList><Button variant="ghost" size="sm" className="rounded-xl text-xs text-muted-foreground" aria-pressed={tab === "debug"} onClick={() => setTab("debug")}>Debug / Performance</Button></div>
    {loading && <p className="rounded-xl border bg-card p-5 text-sm">Werkruimte laden…</p>}{error && <div role="alert" className="space-y-3 rounded-xl border border-destructive/30 p-4"><p className="text-sm text-destructive">Werkruimte niet geladen: {error}</p><Button variant="outline" className="rounded-xl" onClick={() => refresh()}>Opnieuw laden</Button></div>}
    {!loading && !error && <><TabsContent value={mode} forceMount className={tab === "search" || tab === "custom" ? "min-w-0" : "hidden"}><PackingWorkbench mode={mode} initial={initial} definitionId={definitionId} onSaved={openSolution} onPalletize={palletize} /></TabsContent>
      {tab === "pallet" && <TabsContent value="pallet" className="min-w-0"><PalletPanel solution={palletSolution} /></TabsContent>}
      {tab === "cartons" && <TabsContent value="cartons" className="min-w-0"><CartonManagement /></TabsContent>}
      {tab === "shapes" && <TabsContent value="shapes" className="min-w-0"><ShapeManagement onDefinition={s => { setShape(s); setTab("definitions"); }} /></TabsContent>}
      {tab === "definitions" && <TabsContent value="definitions" className="min-w-0"><DefinitionManagement seed={shape} onCalculate={calculate} onSolution={openSolution} /></TabsContent>}
      {tab === "solutions" && <TabsContent value="solutions" className="min-w-0"><SolutionManagement key={solutionId ?? "all"} initialId={solutionId} onRecalculate={recalculate} onPalletize={palletize} /></TabsContent>}
      {tab === "reports" && <TabsContent value="reports" className="min-w-0"><ReportsPanel onSolution={openSolution} /></TabsContent>}
      {tab === "debug" && <section className="space-y-5"><h1 className="text-xl font-semibold">Debug / Performance</h1><p className="text-xs text-muted-foreground">Geen geheime sleutels of sessietokens in deze weergave. Zoekpogingen en truncatie staan bij de berekende resultaten.</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{Object.entries(records).map(([kind, rows]) => <div key={kind} className="rounded-xl border bg-card p-3"><p className="text-xs text-muted-foreground">{kind}</p><p className="mt-1 text-xl font-semibold">{rows.length}</p></div>)}</div><Button variant="outline" className="rounded-xl" disabled={busy} onClick={() => refresh()}>Database opnieuw laden</Button><ExcelInspector /></section>}
    </>}
  </Tabs></AppShell>;
}
