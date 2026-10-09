import { useEffect, useRef, useState } from "react";
import { Boxes, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DEFAULT_CUSTOM, type CustomSettings } from "@/domain/packing/custom-box";
import { assertInput, weightInKg, type Box, type Product, type Solution, type Sorting, type Spacing, type Strategy } from "@/domain/packing/types";
import { exactFilter, sortSolutions } from "@/domain/packing/scoring";
import type { PackingRequest, PackingResponse } from "@/application/packing-job";
import { newProduct, NumberField, ProductInputs } from "./ProductInputs";
import { PalletPanel } from "./PalletPanel";
import { SolutionDetails } from "./SolutionDetails";

export function PackingWorkbench() {
  const [products, setProducts] = useState([newProduct(1)]);
  const [mode, setMode] = useState<"search" | "custom">("search");
  const [strategy, setStrategy] = useState<Strategy>("desired"), [sorting, setSorting] = useState<Sorting>("fill"), [exact, setExact] = useState(false);
  const [spacing, setSpacing] = useState<Spacing>({ length: 0, width: 0, height: 0 });
  const [custom, setCustom] = useState<CustomSettings>({ ...DEFAULT_CUSTOM });
  const [boxes, setBoxes] = useState<Box[]>([{ boxId: "box-1", reference: "Doos 1", length: 0, width: 0, height: 0, cardboard: 3 }]);
  const [response, setResponse] = useState<Extract<PackingResponse, { result: unknown }>>();
  const [resultProducts, setResultProducts] = useState<Product[]>([]), [resultMode, setResultMode] = useState<"search" | "custom">("search");
  const [selectedId, setSelectedId] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const workerRef = useRef<Worker | undefined>(undefined);
  useEffect(() => () => workerRef.current?.terminate(), []);
  function calculate() {
    setError("");
    try {
      const normalized = products.map(({ inputWeight, weightUnit, ...product }) => ({ ...product, weightKg: weightInKg(inputWeight, weightUnit) }));
      assertInput(normalized, spacing, mode === "search" ? boxes : []);
      const job: PackingRequest = { products: normalized, mode, boxes, spacing, strategy, custom };
      workerRef.current?.terminate();
      const worker = new Worker(new URL("../../application/packing.worker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker; setBusy(true); setResponse(undefined);
      worker.onmessage = ({ data }: MessageEvent<PackingResponse>) => {
        if (workerRef.current !== worker) return;
        setBusy(false); worker.terminate(); workerRef.current = undefined;
        if ("error" in data) setError(data.error);
        else { setResponse(data); setResultProducts(normalized); setResultMode(mode); setSelectedId(data.result.solutions[0]?.solutionId ?? ""); }
      };
      worker.onerror = () => { if (workerRef.current !== worker) return; setBusy(false); worker.terminate(); workerRef.current = undefined; setError("De rekenworker kon niet worden uitgevoerd. Probeer opnieuw of controleer de previewfout."); };
      worker.postMessage(job);
    } catch (err) { workerRef.current?.terminate(); workerRef.current = undefined; setBusy(false); setError(err instanceof Error ? err.message : "Ongeldige invoer."); }
  }
  const linear = resultMode === "custom" && resultProducts.length === 1;
  const filtered = response ? (exact ? exactFilter(response.result.solutions, resultProducts) : response.result.solutions) : [];
  const ranked = linear ? filtered : sortSolutions(filtered, sorting);
  const selected: Solution | undefined = ranked.find(s => s.solutionId === selectedId) ?? ranked[0];
  return <Card className="rounded-3xl border-primary/25 shadow-none">
    <CardHeader className="p-5 sm:p-7"><div className="mb-2 flex items-center gap-2 text-primary"><Boxes aria-hidden="true" className="size-5" /><span className="text-xs font-bold uppercase tracking-widest">Packing · maatwerk · palletisatie</span></div><h1 className="text-3xl font-semibold tracking-tight">Verpakkingsoptimalisatie</h1><p className="text-sm leading-relaxed text-muted-foreground">Vul echte product- en doosmaten in. Alle resultaten komen uit gecontroleerde placements. Zoekdekking is heuristisch; er is geen databasekoppeling of automatische Excelmapping.</p></CardHeader>
    <CardContent className="space-y-6 px-5 pb-5 sm:px-7 sm:pb-7">
      <form onSubmit={e => { e.preventDefault(); calculate(); }} className="space-y-6">
        <fieldset disabled={busy} className="space-y-6">
          <div className="flex flex-wrap gap-3"><Button type="button" variant={mode === "search" ? "default" : "outline"} className="rounded-xl" aria-pressed={mode === "search"} onClick={() => setMode("search")}>Verpakking zoeken</Button><Button type="button" variant={mode === "custom" ? "default" : "outline"} className="rounded-xl" aria-pressed={mode === "custom"} onClick={() => setMode("custom")}>Omdoos op maat</Button></div>
          <ProductInputs products={products} onChange={setProducts} />
          <section className="space-y-3"><h3 className="font-semibold">Praktische speling</h3><div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{(["length", "width", "height"] as const).map((key, i) => <NumberField key={key} label={["Lengtespeling totaal", "Breedtespeling totaal", "Hoogtespeling bovenaan"][i] + " (mm)"} value={spacing[key]} onChange={n => setSpacing({ ...spacing, [key]: n })} />)}</div><p className="text-xs text-muted-foreground">L/B gelijk verdeeld over beide zijden. Z begint op 0; hoogtespeling ligt uitsluitend bovenaan.</p></section>
          {mode === "search" ? <section className="space-y-4">
            <label className="block space-y-1 text-sm font-medium">Zoekstrategie<select className="h-10 w-full rounded-xl border bg-background px-3" value={strategy} onChange={e => setStrategy(e.target.value as Strategy)}><option value="desired">Gewenste aantallen · inclusief afwijkende alternatieven</option><option value="fill">Minimale lucht / maximaal vullen</option></select></label>
            <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Kandidaatdozen · interne maten</h3><Button type="button" variant="outline" className="rounded-xl" disabled={boxes.length >= 8} onClick={() => setBoxes([...boxes, { boxId: `box-${Date.now()}`, reference: `Doos ${boxes.length + 1}`, length: 0, width: 0, height: 0, cardboard: 3 }])}>Doos toevoegen</Button></div>
            {boxes.map((box, index) => <div key={box.boxId} className="rounded-2xl border bg-background p-4"><div className="mb-3 flex items-center justify-between text-sm font-medium">{box.reference}{index > 0 && <Button type="button" variant="ghost" className="rounded-xl" onClick={() => setBoxes(boxes.filter(b => b.boxId !== box.boxId))}>Verwijderen</Button>}</div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{(["length", "width", "height", "cardboard"] as const).map((key, i) => <NumberField key={key} label={["Binnen-L", "Binnen-B", "Binnen-H", "Kartondikte"][i] + " (mm)"} value={box[key]} onChange={n => setBoxes(boxes.map(b => b.boxId === box.boxId ? { ...b, [key]: n } : b))} />)}</div></div>)}
          </section> : <section className="space-y-3"><h3 className="font-semibold">Maatwerk · realiteitsfilter</h3><p className="text-xs text-muted-foreground">{products.length === 1 ? "Lineaire opties per toegelaten rotatie; eerst herhalen over de kortste productmaat. Geen lucht-/ecologische sortering." : "Echte multi-product packing: alle gevraagde producten, gevolgd door compacte doosafleiding en hervalidatie."}</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{(["cardboard", "palletLength", "palletWidth", "oversizePercent", "maxBoxDimension"] as const).map((key, i) => <NumberField key={key} label={["Karton (mm)", "Pallet-L (mm)", "Pallet-B (mm)", "Overmaat (%)", "Max. doosmaat (mm)"][i]} value={custom[key]} onChange={n => setCustom({ ...custom, [key]: n })} />)}</div></section>}
        </fieldset>
        <div className="flex flex-wrap gap-3"><Button type="submit" className="gap-2 rounded-xl px-6" disabled={busy}>{busy && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}{busy ? "Zoeken…" : mode === "search" ? "Verpakkingen zoeken" : "Maatwerkdozen berekenen"}</Button>{busy && <Button type="button" variant="outline" className="rounded-xl" onClick={() => { workerRef.current?.terminate(); workerRef.current = undefined; setBusy(false); setError("Zoekopdracht geannuleerd."); }}>Annuleren</Button>}</div>
      </form>
      <p className="text-xs text-muted-foreground">Maximaal 96 pogingen, 300 placements per poging en een geometrisch werkbudget. Limieten worden gemeld. Geen garantie op globale optimale oplossing.</p>
      {error && <p role="alert" className="rounded-xl border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
      {response && <section className="space-y-4" aria-label="Packingresultaten">
        <div className="rounded-xl bg-secondary p-4 text-sm"><strong>{response.result.solutions.length} geldige gevonden oplossingen</strong> · {response.result.attempts} pogingen{response.result.truncated && " · zoeklimiet bereikt"}<p className="mt-2 text-xs">{response.result.warnings.join(" ")}</p><p className="mt-2 text-xs">Resultaten gebruiken de invoersnapshot van de laatste berekening; gewijzigde invoer vereist opnieuw berekenen.</p></div>
        {!linear && <div className="flex flex-wrap items-center gap-4"><label className="text-sm">Sortering<select className="ml-2 rounded-xl border bg-background p-2" value={sorting} onChange={e => { setSorting(e.target.value as Sorting); setSelectedId(""); }}><option value="fill">{resultMode === "custom" ? "Minimale lucht" : "Maximale vulling"}</option><option value="practical">Praktisch/ecologisch</option></select></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={exact} onChange={e => { setExact(e.target.checked); setSelectedId(""); }} />Exact gevraagd aantal · filter op resultaten</label></div>}
        <p className="text-xs text-muted-foreground">{ranked.length} zichtbaar · {linear ? "lineaire generatievolgorde" : "sortering verandert geen zoekresultaten of placements"}</p>
        {ranked.length > 0 && <label className="block space-y-1 text-sm font-medium">Solution<select className="h-11 w-full rounded-xl border bg-background px-3" value={selected?.solutionId ?? ""} onChange={e => setSelectedId(e.target.value)}>{ranked.map((s, i) => <option key={s.solutionId} value={s.solutionId}>{i + 1}. {s.box.reference} · {(s.utilization * 100).toFixed(1)}% · {Object.values(s.counts).join("/")} stuks</option>)}</select></label>}
        {!ranked.length && <p className="text-sm">Geen geldige oplossing gevonden binnen deze zoekdekking{exact ? " met exact de gevraagde aantallen" : ""}. Dit bewijst niet dat packing onmogelijk is.</p>}
        {selected && <SolutionDetails key={selected.solutionId} solution={selected} products={resultProducts} />}
        {!!response.result.rejected?.length && <details className="text-sm"><summary className="cursor-pointer">Afgekeurde maatwerkvarianten ({response.result.rejected.length})</summary><ul className="mt-3 space-y-2 text-xs">{response.result.rejected.map((r, i) => <li key={i}>{r.pattern}: {r.errors.join(" ")}</li>)}</ul></details>}
      </section>}
      <PalletPanel key={selected?.solutionId ?? "no-solution"} solution={selected} />
    </CardContent>
  </Card>;
}
