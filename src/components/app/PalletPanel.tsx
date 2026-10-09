import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DEFAULT_PALLET, effectivePallet, palletize, type PalletResult, type PalletSettings } from "@/domain/packing/pallet";
import type { Solution, Sorting } from "@/domain/packing/types";
import { parseSolutionSnapshot } from "@/infrastructure/solution-snapshot";
import { NumberField } from "./ProductInputs";
export function PalletPanel({ solution }: { solution?: Solution }) {
  const [source, setSource] = useState("packaging"), [saved, setSaved] = useState<Solution>();
  const [dims, setDims] = useState({ length: 0, width: 0, height: 0 });
  const [settings, setSettings] = useState<PalletSettings>({ ...DEFAULT_PALLET });
  const [sorting, setSorting] = useState<Sorting>("fill"), [results, setResults] = useState<PalletResult[]>([]), [error, setError] = useState("");
  const effective = effectivePallet(settings);
  const update = (patch: Partial<PalletSettings>) => { setSettings({ ...settings, ...patch }); setResults([]); };
  const run = () => {
    try {
      if (source === "packaging" && !solution) throw new Error("Kies eerst een geldige packing solution.");
      if (source === "saved" && !saved) throw new Error("Lees eerst een geldig opgeslagen JSON-snapshot in.");
      const input = source === "manual" ? { kind: "database" as const, box: { ...dims, boxId: "manual-carton", reference: "Omdoos buitenmaat", cardboard: 0 } } : { kind: source === "saved" ? "saved" as const : "packaging" as const, solution: (source === "saved" ? saved : solution)! };
      setResults(palletize(input, settings, sorting)); setError("");
    } catch (e) { setResults([]); setError(e instanceof Error ? e.message : "Palletisatie mislukt."); }
  };
  const best = results[0];
  return <section className="space-y-4 rounded-2xl border bg-card p-5" aria-label="Palletisatie">
    <h3 className="text-xl font-semibold">Palletisatie</h3>
    <label className="block space-y-1 text-xs font-medium">Bron<select className="h-10 w-full rounded-xl border bg-background px-3" value={source} onChange={e => { setSource(e.target.value); setResults([]); }}><option value="packaging">Gekozen packaging solution</option><option value="manual">Omdoos · handmatige buitenmaten</option><option value="saved">Opgeslagen solution · JSON-snapshot</option></select></label>
    {source === "manual" && <><p className="text-xs text-muted-foreground">De database is nog niet gekoppeld. Voer de buitenmaten van een bestaand doosrecord in; kartondikte niet opnieuw toevoegen.</p><div className="grid grid-cols-3 gap-3">{(["length", "width", "height"] as const).map((axis, i) => <NumberField key={axis} label={["Buiten-L", "Buiten-B", "Buiten-H"][i] + " (mm)"} value={dims[axis]} min={0.001} onChange={v => { setDims({ ...dims, [axis]: v }); setResults([]); }} />)}</div></>}
    {source === "saved" && <label className="block space-y-2 text-sm">Solutionbestand<input type="file" accept=".json" className="block w-full text-xs" onChange={async e => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; try { if (file.size > 5 * 1024 * 1024) throw new Error("Snapshot maximaal 5 MB."); const parsed = parseSolutionSnapshot(await file.text()); setSaved(parsed.solution); setResults([]); setError(""); } catch (err) { setSaved(undefined); setResults([]); setError(err instanceof Error ? err.message : "Ongeldig snapshot."); } }} />{saved && <span className="text-xs text-primary">Gevalideerd: {saved.solutionId}</span>}</label>}
    {source === "packaging" && <p className="text-xs text-muted-foreground">{solution ? `${solution.box.reference} · ${solution.solutionId}; buitenmaat inclusief kartondikte` : "Nog geen solution geselecteerd."}</p>}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{(["palletLength", "palletWidth", "palletHeight", "maxTotalHeight", "overhangLengthPerSide", "overhangWidthPerSide"] as const).map((key, index) => <NumberField key={key} label={["Pallet-L", "Pallet-B", "Pallethoogte", "Max. totale hoogte", "Overhang L per zijde", "Overhang B per zijde"][index] + " (mm)"} value={settings[key]} onChange={n => update({ [key]: n })} />)}</div>
    <p className="text-xs text-muted-foreground">Effectief footprint: {effective.length} × {effective.width} mm. 5 mm overhang per zijde voegt 10 mm toe.</p>
    <div className="flex flex-wrap items-center gap-3"><label className="text-xs">Sortering<select className="ml-2 rounded-xl border bg-background p-2" value={sorting} onChange={e => { setSorting(e.target.value as Sorting); setResults([]); }}><option value="fill">Maximale palletvulling</option><option value="practical">Praktisch/ecologisch</option></select></label><Button className="rounded-xl" onClick={run}>Palletpatronen berekenen</Button></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {best && <><p className="text-sm font-semibold">Beste patroon: {best.pattern}</p><svg role="img" aria-label="Beste palletpatroon, eerste laag" viewBox={`${-settings.overhangLengthPerSide} ${-settings.overhangWidthPerSide} ${effective.length} ${effective.width}`} className="max-h-72 w-full rounded-xl border bg-background">{best.placements.filter(p => p.layerIndex === 0).map(p => <rect key={p.placementId} x={p.x} y={p.y} width={p.length} height={p.width} fill={p.orientation === "L-B-H" ? "hsl(var(--primary))" : "hsl(var(--foreground))"} fillOpacity={0.3} stroke="hsl(var(--primary))" vectorEffect="non-scaling-stroke"><title>{p.placementId} · {p.orientation}</title></rect>)}<rect x={0} y={0} width={settings.palletLength} height={settings.palletWidth} fill="none" stroke="hsl(var(--foreground))" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" /></svg><p className="text-xs text-muted-foreground">{best.warnings.join(" ")} Gestippeld = fysieke palletgrens.</p></>}
    {results.length > 0 && <div className="overflow-auto rounded-xl border"><table className="w-full whitespace-nowrap text-left text-xs"><thead className="bg-secondary"><tr>{["Patroon", "Per laag", "Lagen", "Totaal", "Hoogte mm", "Oppervlak", "Volume", "Overhang L/B", "Score"].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{results.slice(0, 20).map((r, index) => <tr key={index} className="border-t">{[r.pattern, r.boxesPerLayer, r.layers, r.totalBoxes, r.height.toFixed(2), `${(r.surfaceUtilization * 100).toFixed(1)}%`, `${(r.volumeEfficiency * 100).toFixed(1)}%`, `${r.overhang.lengthPerSide}/${r.overhang.widthPerSide}`, r.score.toFixed(1)].map((v, i) => <td key={i} className="p-2">{v}</td>)}</tr>)}</tbody></table></div>}
    {results.length > 20 && <p className="text-xs text-muted-foreground">Top 20 van {results.length} patronen weergegeven.</p>}
    {!error && results.length === 0 && <p className="text-xs text-muted-foreground">Bereken om patronen te tonen. Als niets past binnen footprint/hoogte, blijft de lijst leeg.</p>}
  </section>;
}
