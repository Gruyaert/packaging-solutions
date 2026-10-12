import { useState } from "react";
import { PackageSearch, Box, Layers3, Boxes, Shapes, FolderCog, Save, FileDown } from "lucide-react";
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
import { PerformanceDashboard } from '@/components/app/PerformanceDashboard';
import { usePackagingData } from "@/components/app/PackagingDataProvider";
import type { DefinitionRecord, ShapeRecord, SolutionRecord } from "@/infrastructure/packaging-records";
import type { Product, Solution } from "@/domain/packing/types";

const tabs = [
  { value: "search", label: "Verpakking zoeken", icon: PackageSearch },
  { value: "custom", label: "Omdoos op maat", icon: Box },
  { value: "solutions", label: "Opgeslagen oplossingen", icon: Save },
  { value: "pallet", label: "Palletisatie", icon: Layers3 },
  { value: "cartons", label: "Omdozenbeheer", icon: Boxes },
  { value: "shapes", label: "Shapes masterdata", icon: Shapes },
  { value: "definitions", label: "Verpakkingsdefinities", icon: FolderCog },
  { value: "reports", label: "Rapporten & exports", icon: FileDown },
];
export default function Index() {
  const { records, loading, error, refresh, busy, storage } = usePackagingData();
  const [tab, setTab] = useState("search"), [mode, setMode] = useState<"search" | "custom">("search");
  const [shape, setShape] = useState<ShapeRecord>(), [definitionId, setDefinitionId] = useState<string>(), [initial, setInitial] = useState<SolutionRecord>(), [solutionId, setSolutionId] = useState<string>(), [palletSolution, setPalletSolution] = useState<Solution>();
  const [palletProducts, setPalletProducts] = useState<Product[]>([]);
  const [palletContext, setPalletContext] = useState<{ definitionId?: string; mode?: "STOCK" | "PERSO" }>();
  const navigate = (value: string) => { setTab(value); if (value === "search" || value === "custom") setMode(value); };
  const openSolution = (id: string) => { setSolutionId(id); setTab("solutions"); };
  const palletize = (solution: Solution, products: Product[], context?: { definitionId?: string; mode?: "STOCK" | "PERSO" }) => {
    const record = records.solutions.find(r => r.snapshot.solution.solutionId === solution.solutionId);
    setPalletSolution(solution); setPalletProducts(products);
    setPalletContext(record ? { definitionId: record.definition_id ?? undefined, mode: record.packaging_mode } : context);
    setTab("pallet");
  };
  const calculate = (definition: DefinitionRecord) => { setInitial(undefined); setDefinitionId(definition.id); navigate(definition.packaging_mode === "PERSO" ? "custom" : "search"); };
  const recalculate = (record: SolutionRecord) => { setInitial(record); setDefinitionId(record.definition_id ?? undefined); navigate(record.packaging_mode === "PERSO" ? "custom" : "search"); };
  return <AppShell><Tabs value={tab} onValueChange={navigate} className="min-w-0 space-y-6">
    <nav aria-label="Werkruimteonderdelen" className="space-y-2"><TabsList className="grid h-auto w-full min-w-0 grid-cols-2 gap-1.5 rounded-2xl border bg-card p-2 shadow-sm sm:grid-cols-4">{tabs.map(({ value, label, icon: Icon }, index) => <TabsTrigger key={value} value={value} className={`min-h-12 min-w-0 justify-start gap-2 whitespace-normal rounded-xl px-3 py-2 text-left text-xs leading-4 text-muted-foreground transition-colors hover:bg-accent hover:text-primary data-[state=active]:bg-accent data-[state=active]:text-primary data-[state=active]:shadow-none ${index < 4 ? "font-semibold" : "font-medium"}`}><Icon aria-hidden="true" className="size-4 shrink-0" /><span>{label}</span></TabsTrigger>)}</TabsList><div className="flex justify-end"><Button variant="ghost" size="sm" className="h-7 rounded-xl text-xs text-muted-foreground" aria-pressed={tab === "debug"} onClick={() => setTab("debug")}>Debug / Performance</Button></div></nav>
    {loading && <p className="rounded-xl border bg-card p-5 text-sm">Werkruimte laden…</p>}{error && <div role="alert" className="space-y-3 rounded-xl border border-destructive/30 p-4"><p className="text-sm text-destructive">Werkruimte niet geladen: {error}</p><Button variant="outline" className="rounded-xl" onClick={() => refresh()}>Opnieuw laden</Button></div>}
    {!loading && !error && <><TabsContent value={mode} forceMount className={tab === "search" || tab === "custom" ? "min-w-0" : "hidden"}><PackingWorkbench mode={mode} initial={initial} definitionId={definitionId} onSaved={openSolution} onPalletize={palletize} /></TabsContent>
      {tab === "pallet" && <TabsContent value="pallet" className="min-w-0"><PalletPanel solution={palletSolution} products={palletProducts} context={palletContext} /></TabsContent>}
      {tab === "cartons" && <TabsContent value="cartons" className="min-w-0"><CartonManagement /></TabsContent>}
      {tab === "shapes" && <TabsContent value="shapes" className="min-w-0"><ShapeManagement onDefinition={s => { setShape(s); setTab("definitions"); }} /></TabsContent>}
      {tab === "definitions" && <TabsContent value="definitions" className="min-w-0"><DefinitionManagement seed={shape} onCalculate={calculate} onSolution={openSolution} /></TabsContent>}
      {tab === "solutions" && <TabsContent value="solutions" className="min-w-0"><SolutionManagement key={solutionId ?? "all"} initialId={solutionId} onRecalculate={recalculate} onPalletize={palletize} /></TabsContent>}
      {tab === "reports" && <TabsContent value="reports" className="min-w-0"><ReportsPanel onSolution={openSolution} /></TabsContent>}
      {tab === "debug" && <section className="space-y-5"><h1 className="text-xl font-semibold">Debug / Performance</h1><p className="text-xs text-muted-foreground">Geen geheime sleutels of sessietokens in deze weergave. Zoekpogingen en truncatie staan bij de berekende resultaten.</p><PerformanceDashboard /><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{Object.entries(records).map(([kind, rows]) => <div key={kind} className="rounded-xl border bg-card p-3"><p className="text-xs text-muted-foreground">{kind}</p><p className="mt-1 text-xl font-semibold">{rows.length}</p></div>)}</div><Button variant="outline" className="rounded-xl" disabled={busy} onClick={() => refresh()}>{storage === "local" ? "Lokale records controleren" : "Database opnieuw laden"}</Button><ExcelInspector /></section>}
    </>}
  </Tabs></AppShell>;
}
