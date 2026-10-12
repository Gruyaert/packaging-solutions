import { useEffect, useMemo, useRef, useState } from "react";
import { createResultCache } from '@/application/result-cache';
import { recordMetric } from '@/application/performance';
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_CUSTOM, type CustomSettings } from "@/domain/packing/custom-box";
import { assertInput, weightInKg, type Box, type Product, type Solution, type Sorting, type Spacing, type Strategy } from "@/domain/packing/types";
import { exactFilter, sortSolutions } from "@/domain/packing/scoring";
import type { PackingRequest, PackingResponse } from "@/application/packing-job";
import { toBox, type SolutionRecord } from "@/infrastructure/packaging-records";
import { exportSolutionHtml } from "@/infrastructure/report-export";
import { newProduct, NumberField, ProductInputs } from "./ProductInputs";
import { SolutionDetails } from "./SolutionDetails";
import { usePackagingData } from "./PackagingDataProvider";
import { RecordTable } from "./RecordTable";
import { SaveSolution } from "./SaveSolution";
import { DimensionGuide } from "./DimensionGuide";

export function PackingWorkbench({ mode, initial, definitionId, onSaved, onPalletize }: { mode: "search" | "custom"; initial?: SolutionRecord; definitionId?: string; onSaved(id: string): void; onPalletize(solution: Solution, products: Product[], context?: { definitionId?: string; mode?: "STOCK" | "PERSO" }): void }) {
  const { records, storage } = usePackagingData();
  const [products, setProducts] = useState([newProduct(1)]), [source, setSource] = useState("database");
  const [strategy, setStrategy] = useState<Strategy>("desired"), [sorting, setSorting] = useState<Sorting>("fill"), [exact, setExact] = useState(false);
  const [spacing, setSpacing] = useState<Spacing>({ length: 0, width: 0, height: 0 });
  const [custom, setCustom] = useState<CustomSettings>({ ...DEFAULT_CUSTOM });
  const [boxes, setBoxes] = useState<Box[]>([]), [manual, setManual] = useState<Box[]>([{ boxId: "manual-1", reference: "Handmatige doos 1", length: 0, width: 0, height: 0, cardboard: 0 }]);
  const [maxWeight, setMaxWeight] = useState(0), [maxLayers, setMaxLayers] = useState(0);
  const [response, setResponse] = useState<Extract<PackingResponse, { result: unknown }>>();
  const [resultProducts, setResultProducts] = useState<Product[]>([]), [resultMode, setResultMode] = useState<"search" | "custom">("search");
  const [selectedId, setSelectedId] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const workerRef = useRef<Worker | undefined>(undefined);
  const cache = useRef(createResultCache<Extract<PackingResponse, { result: unknown }>>());
  useEffect(() => () => { workerRef.current?.terminate(); cache.current.clear(); }, []);
  useEffect(() => {
    workerRef.current?.terminate(); workerRef.current = undefined; cache.current.clear(); setBusy(false); setResponse(undefined); setError("");
    if (!initial) { setProducts([newProduct(1)]); setSpacing({ length: 0, width: 0, height: 0 }); setBoxes([]); setSource("database"); setMaxWeight(0); setMaxLayers(0); return; }
    const snapshot = initial.snapshot;
    setProducts(snapshot.products.map(p => { const inKg = Math.abs(p.weightKg * 1000 - Math.round(p.weightKg * 1000)) < 1e-6; return { ...p, inputWeight: inKg ? p.weightKg : Number((p.weightKg * 1000).toFixed(3)), weightUnit: inKg ? "kg" as const : "g" as const }; }));
    setSpacing(snapshot.solution.spacing); setManual([snapshot.solution.box]); setSource("manual");
    setCustom(c => ({ ...c, cardboard: snapshot.solution.box.cardboard }));
  }, [initial, definitionId]);
  function calculate() {
    setError("");
    try {
      const normalized = products.map(({ inputWeight, weightUnit, ...product }) => ({ ...product, weightKg: weightInKg(inputWeight, weightUnit) }));
      const candidates = source === "database" ? boxes : manual;
      assertInput(normalized, spacing, mode === "search" ? candidates : []);
      if (mode === "search" && !candidates.length) throw new Error("Selecteer minstens één actieve omdoos uit de lijst of voer handmatige interne maten in.");
      if (!Number.isFinite(maxWeight) || maxWeight < 0 || !Number.isSafeInteger(maxLayers) || maxLayers < 0) throw new Error("Maximumgewicht moet niet-negatief zijn; totaal aantal lagen moet niet-negatief en geheel zijn.");
      const job: PackingRequest = { products: normalized, mode, boxes: candidates, spacing, strategy, custom, maxWeightKg: maxWeight || undefined, maxTotalLayers: maxLayers || undefined };
      const key = JSON.stringify(job), cached = cache.current.get(key);
      if (cached) { setResponse(cached); setResultProducts(normalized); setResultMode(mode); setSelectedId(cached.result.solutions[0]?.solutionId ?? ''); return; }
      workerRef.current?.terminate();
      const start = performance.now();
      const worker = new Worker(new URL("../../application/packing.worker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker; setBusy(true); setResponse(undefined);
      worker.onmessage = ({ data }: MessageEvent<PackingResponse>) => {
        if (workerRef.current !== worker) return;
        setBusy(false); worker.terminate(); workerRef.current = undefined;
        recordMetric('totaal', performance.now() - start);
        if ("error" in data) setError(data.error);
        else { if (data.elapsed !== undefined) recordMetric(mode === 'custom' ? 'custom carton' : 'packing', data.elapsed); cache.current.set(key, data); setResponse(data); setResultProducts(normalized); setResultMode(mode); setSelectedId(data.result.solutions[0]?.solutionId ?? ""); }
      };
      worker.onerror = () => { if (workerRef.current !== worker) return; setBusy(false); worker.terminate(); workerRef.current = undefined; setError("De rekenworker kon niet worden uitgevoerd."); };
      worker.postMessage(job);
    } catch (failure) { workerRef.current?.terminate(); workerRef.current = undefined; setBusy(false); setError(failure instanceof Error ? failure.message : "Ongeldige invoer."); }
  }
  const linear = resultMode === "custom" && resultProducts.length === 1;
  const ranked = useMemo(() => {
    const start = performance.now();
    const filtered = response ? (exact ? exactFilter(response.result.solutions, resultProducts) : response.result.solutions) : [];
    const result = linear ? filtered : sortSolutions(filtered, sorting);
    if (response) recordMetric('scoring', performance.now() - start);
    return result;
  }, [response, exact, resultProducts, linear, sorting]);
  const selected = ranked.find(s => s.solutionId === selectedId) ?? ranked[0];
  const context = records.definitions.find(d => d.id === (initial?.definition_id ?? definitionId));
  return <section className="min-w-0 space-y-5"><div><h1 className="text-2xl font-semibold tracking-tight">{mode === "search" ? "Verpakking zoeken" : "Omdoos op maat"}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{context ? `Context: ${context.name} · ${context.scope} · ${context.packaging_mode}. ` : ""}{initial && "Bewerken maakt een nieuwe variant; het origineel blijft ongewijzigd. "}Vul je producten in, kies de doosvoorwaarden en vergelijk de berekende oplossingen.</p></div>
    <form onSubmit={e => { e.preventDefault(); calculate(); }} className="space-y-6"><fieldset disabled={busy} className="space-y-6">
      <ProductInputs products={products} onChange={setProducts} />
      <div className="space-y-3"><h2 className="text-base font-semibold">2. Kies de doosvoorwaarden</h2><DimensionGuide kind="box" /></div>
      <details className="rounded-2xl border bg-card p-4"><summary className="cursor-pointer text-sm font-semibold">Geavanceerd · praktische speling{mode === "search" && ", gewicht en totaal aantal lagen"}</summary><div className="mt-4 space-y-3"><div className="grid gap-3 sm:grid-cols-3">{(["length", "width", "height"] as const).map((key, i) => <NumberField key={key} label={["L-speling totaal (mm)", "B-speling totaal (mm)", "H-speling bovenaan (mm)"][i]} value={spacing[key]} onChange={n => setSpacing({ ...spacing, [key]: n })} />)}</div><p className="text-xs text-muted-foreground">L/B gelijk verdeeld over beide zijden. Z begint op 0; hoogtespeling uitsluitend bovenaan.</p>{mode === "search" && <><div className="grid gap-3 sm:grid-cols-2"><NumberField label="Max. totaal productgewicht (kg) · 0=geen limiet" step="0.001" value={maxWeight} onChange={setMaxWeight} /><NumberField label="Max. totaal lagen · 0=geen limiet" step="1" value={maxLayers} onChange={setMaxLayers} /></div><p className="text-xs text-muted-foreground">Gewicht van inhoud; doosgewicht is onbekend en wordt niet geschat. Lagen tellen unieke Z-startniveaus over alle producten. Beide limieten gelden tijdens het zoeken, niet als resultaatfilter.</p></>}</div></details>
      {mode === "search" ? <section className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-xs">Zoekstrategie<select className="h-10 w-full rounded-xl border bg-card px-3" value={strategy} onChange={e => setStrategy(e.target.value as Strategy)}><option value="desired">Gewenste aantallen · met afwijkende alternatieven</option><option value="fill">Minimale lucht / maximaal vullen</option></select></label><label className="space-y-1 text-xs">Doosbron<select className="h-10 w-full rounded-xl border bg-card px-3" value={source} onChange={e => setSource(e.target.value)}><option value="database">{storage === "local" ? "Omdozen uit lokale testwerkruimte" : "Omdozen uit Supabase"}</option><option value="manual">Handmatige interne maten</option></select></label></div>
        {source === "database" ? <><p className="text-xs">{boxes.length} kandidaatdozen geselecteerd. Selectie bewaart de maten op het selectiemoment.</p><RecordTable label="Kandidaatdozen" rows={records.cartons.filter(c => c.active)} columns={[{ label: "Referentie", value: c => c.reference }, { label: "Beschrijving", value: c => c.description }, { label: "Binnen-L", value: c => c.length }, { label: "Binnen-B", value: c => c.width }, { label: "Binnen-H", value: c => c.height }, { label: "Karton", value: c => c.cardboard }]} actions={c => <label className="flex items-center gap-2"><input type="checkbox" checked={boxes.some(b => b.boxId === c.id)} onChange={e => setBoxes(e.target.checked ? [...boxes, toBox(c)] : boxes.filter(b => b.boxId !== c.id))} />Kandidaat</label>} /><div className="flex flex-wrap gap-2">{boxes.map(b => <Button key={b.boxId} type="button" size="sm" variant="outline" className="rounded-lg" onClick={() => setBoxes(boxes.filter(c => c.boxId !== b.boxId))}>{b.reference} ×</Button>)}</div></> : <><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">Interne kandidaatdoosmaten</h2><Button type="button" variant="outline" size="sm" className="rounded-xl" disabled={manual.length >= 8} onClick={() => setManual([...manual, { boxId: crypto.randomUUID(), reference: `Handmatige doos ${manual.length + 1}`, length: 0, width: 0, height: 0, cardboard: 0 }])}>Doos toevoegen</Button></div>{manual.map(box => <div key={box.boxId} className="space-y-3 rounded-xl border bg-card p-3"><div className="flex justify-between gap-3 text-xs">{box.reference}{manual.length > 1 && <Button type="button" size="sm" variant="ghost" className="rounded-lg" onClick={() => setManual(manual.filter(b => b.boxId !== box.boxId))}>Verwijderen</Button>}</div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{(["length", "width", "height", "cardboard"] as const).map((key, index) => <NumberField key={key} label={["Binnen-L (mm)", "Binnen-B (mm)", "Binnen-H (mm)", "Kartondikte (mm)"][index]} value={box[key]} onChange={n => setManual(manual.map(b => b.boxId === box.boxId ? { ...b, [key]: n } : b))} />)}</div></div>)}</>}
      </section> : <details open className="rounded-2xl border bg-card p-4"><summary className="cursor-pointer text-sm font-semibold">Maatwerk · realiteitsfilter</summary><div className="mt-4 space-y-3"><p className="text-xs text-muted-foreground">{products.length === 1 ? "Lineaire opties per rotatie, zonder lucht-/ecologische sortering." : "Echte multi-product packing met alle gevraagde producten, compacte doosafleiding en hervalidatie."}</p><div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{(["cardboard", "palletLength", "palletWidth", "oversizePercent", "maxBoxDimension"] as const).map((key, i) => <NumberField key={key} label={["Karton (mm)", "Pallet-L (mm)", "Pallet-B (mm)", "Overmaat (%)", "Max. doosmaat (mm)"][i]} value={custom[key]} onChange={n => setCustom({ ...custom, [key]: n })} />)}</div></div></details>}
    </fieldset><div className="flex flex-wrap gap-3"><Button className="gap-2 rounded-xl" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />}{busy ? "Zoeken…" : mode === "search" ? "Verpakkingen zoeken" : "Maatwerkdozen berekenen"}</Button>{busy && <Button type="button" variant="outline" className="rounded-xl" onClick={() => { workerRef.current?.terminate(); workerRef.current = undefined; setBusy(false); setError("Zoekopdracht geannuleerd."); }}>Annuleren</Button>}</div></form>
    {error && <p role="alert" className="rounded-xl border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
    <p className="text-xs text-muted-foreground">Max. 96 pogingen, 300 placements per poging en begrensd geometrisch werkbudget. Geen globaal optimum of garantie op volledige zoekdekking.</p>
    {response && <section className="space-y-4" aria-label="Packingresultaten"><div className="rounded-xl bg-secondary p-4 text-sm"><strong>{response.result.solutions.length} geldige oplossingen</strong> · {response.result.attempts} pogingen{response.result.truncated && " · zoeklimiet bereikt"}<p className="mt-2 text-xs">{response.result.warnings.join(" ")}</p><p className="mt-2 text-xs">Resultaatsnapshot van {resultMode === "search" ? "verpakking zoeken" : "maatwerk"}; gewijzigde invoer vereist opnieuw berekenen.</p></div>
      {!linear && <div className="flex flex-wrap items-center gap-3"><label className="text-xs">Sortering<select className="ml-2 rounded-xl border bg-card p-2" value={sorting} onChange={e => setSorting(e.target.value as Sorting)}><option value="fill">Maximale vulling / minimale lucht</option><option value="practical">Praktisch/ecologisch</option></select></label><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={exact} onChange={e => setExact(e.target.checked)} />Exact gevraagd aantal · resultaatfilter</label></div>}
      <RecordTable label="Packingresultaten" selectedId={selected?.solutionId} rows={ranked.map(s => ({ ...s, id: s.solutionId }))} columns={[{ label: "Doos", value: s => s.box.reference }, { label: "Binnenmaat", value: s => `${s.box.length} × ${s.box.width} × ${s.box.height}` }, { label: "Aantallen", value: s => Object.values(s.counts).join(" / ") }, { label: "Benutting %", value: s => (s.utilization * 100).toFixed(1) }, { label: "Gewicht kg", value: s => s.weightKg.toFixed(3) }, { label: "Patroon", value: s => s.metadata.pattern }]} actions={s => <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setSelectedId(s.solutionId)}>Bekijken</Button>} />
      {!ranked.length && <p className="text-xs">Geen oplossing binnen deze dekking{exact ? " met exact de gevraagde aantallen" : ""}. Dit bewijst niet dat packing onmogelijk is.</p>}
      {selected && <><div className="flex flex-wrap gap-2"><Button className="rounded-xl" onClick={() => onPalletize(selected, resultProducts, { definitionId: initial?.definition_id ?? definitionId, mode: resultMode === 'custom' ? 'PERSO' : 'STOCK' })}>Palletiseren</Button><Button variant="outline" className="rounded-xl" onClick={() => void exportSolutionHtml(selected.box.reference, selected, resultProducts, records, undefined, { definitionId: initial?.definition_id ?? definitionId, mode: resultMode === 'custom' ? 'PERSO' : 'STOCK' }).catch(failure => setError(String(failure)))}>Interactief HTML-rapport</Button></div><SaveSolution key={selected.solutionId} solution={selected} products={resultProducts} mode={resultMode} definitionId={initial?.definition_id ?? definitionId} basedOn={initial?.id} onSaved={onSaved} /><SolutionDetails key={selected.solutionId} solution={selected} products={resultProducts} definitionId={initial?.definition_id ?? definitionId} mode={resultMode === 'custom' ? 'PERSO' : 'STOCK'} /></>}
      {!!response.result.rejected?.length && <details className="text-xs"><summary className="cursor-pointer">Afgekeurde maatwerkvarianten ({response.result.rejected.length})</summary><ul className="mt-3 space-y-2">{response.result.rejected.map((r, i) => <li key={i}>{r.pattern}: {r.errors.join(" ")}</li>)}</ul></details>}
    </section>}
  </section>;
}
