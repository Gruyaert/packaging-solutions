import { useMemo, useState } from "react";
import { Sparkles, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inspectWorkbook, type WorkbookInspection } from "@/infrastructure/inspect-workbook";
import { IMPORT_FIELDS, IMPORT_REQUIRED, suggestHeaderMapping, suggestWorkbookMapping, type MappingSuggestion, type MasterKind } from "@/infrastructure/suggest-excel-mapping";
import { usePackagingData } from "./PackagingDataProvider";
import { RecordTable } from "./RecordTable";

const numeric = new Set(["length", "width", "height", "cardboard", "format_a", "format_b", "format_h"]);
const labels: Record<string, string> = { reference: "Referentie", length: "Binnen-L (mm)", width: "Binnen-B (mm)", height: "Binnen-H (mm)", cardboard: "Karton (mm)", shape_id: "ShapeID", variant_id: "Variant", format_a: "Format A (mm)", format_b: "Format B (mm)", format_h: "Format H (mm)", description: "Beschrijving", material: "Materiaal", active: "Actief", blocked: "Geblokkeerd", product_group: "Productgroep" };
export function MasterImport({ kind }: { kind: MasterKind }) {
  const { records, sync, busy, storage } = usePackagingData();
  const [book, setBook] = useState<WorkbookInspection>(), [sheetIndex, setSheetIndex] = useState(0), [header, setHeader] = useState(1);
  const [mapping, setMapping] = useState<Record<string, number>>({}), [confirmed, setConfirmed] = useState(false), [reading, setReading] = useState(false), [error, setError] = useState("");
  const [mode, setMode] = useState<"auto" | "manual">("auto"), [suggestion, setSuggestion] = useState<MappingSuggestion>();
  const fields = IMPORT_FIELDS[kind], required = IMPORT_REQUIRED[kind], sheet = book?.sheets[sheetIndex];
  function recognize(inspection: WorkbookInspection, selectedSheet?: number) {
    const result = suggestWorkbookMapping(inspection, kind, selectedSheet);
    setSheetIndex(result.sheetIndex); setHeader(result.headerRow); setMapping(result.mapping); setSuggestion(result); setConfirmed(false);
    setMode(result.found && !result.ambiguous && !result.missing.length && !result.warnings.length ? "auto" : "manual");
  }
  const preview = useMemo(() => {
    const rows: Record<string, unknown>[] = [], errors: string[] = [], keys = new Set<string>();
    if (!sheet || required.some(key => !mapping[key])) return { rows, errors: ["Koppel alle verplichte velden."], changes: [] as { id: string; key: string; change: string; values: string }[] };
    const columns = Object.values(mapping).filter(Boolean);
    if (new Set(columns).size !== columns.length) errors.push("Iedere bronkolom mag slechts één doelveld hebben.");
    for (const row of sheet.rows.filter(row => row.number > header)) {
      const item: Record<string, unknown> = {};
      for (const key of fields) {
        const cell = row.cells.find(cell => cell.column === mapping[key]);
        const raw = cell?.type === "formule" ? cell.cachedValue : cell?.value;
        if (numeric.has(key)) {
          const value = raw === null || raw === undefined || raw === "" ? (key === "cardboard" && !mapping[key] ? 0 : NaN) : typeof raw === "number" ? raw : Number(String(raw).trim().replace(",", "."));
          if (!Number.isFinite(value) || (key === "cardboard" ? value < 0 : value <= 0)) errors.push(`Rij ${row.number}: ${labels[key]} moet ${key === "cardboard" ? "niet-negatief" : "positief"} numeriek zijn.`);
          item[key] = value;
        } else if (key === "active" || key === "blocked") {
          if (!mapping[key]) item[key] = key === "active";
          else { const value = String(raw ?? "").trim().toLowerCase(); if (!["true", "false", "1", "0", "ja", "nee", "yes", "no"].includes(value)) errors.push(`Rij ${row.number}: ${labels[key]} verwacht true/false, 1/0 of ja/nee.`); item[key] = ["true", "1", "ja", "yes"].includes(value); }
        } else {
          if (cell?.type === "formule" && required.includes(key)) errors.push(`Rij ${row.number}: sleutelvelden mogen geen formules bevatten.`);
          const value = cell?.text.trim() ?? "";
          if (required.includes(key) && !value) errors.push(`Rij ${row.number}: ${labels[key]} ontbreekt.`);
          item[key] = value;
        }
      }
      const key = kind === "cartons" ? JSON.stringify([item.reference]) : JSON.stringify([item.shape_id, item.variant_id]);
      if (keys.has(key)) errors.push(`Rij ${row.number}: dubbele sleutel ${key}.`); keys.add(key); rows.push(item);
    }
    if (!rows.length || rows.length > 2000) errors.push("Een import moet 1 tot 2000 gegevensrijen bevatten; er wordt niets gedeeltelijk geïmporteerd.");
    const changes = rows.map((row, index) => {
      const existing = kind === "cartons" ? records.cartons.find(c => c.reference === row.reference) : records.shapes.find(s => s.shape_id === row.shape_id && s.variant_id === row.variant_id);
      const unchanged = existing && fields.every(field => String((existing as unknown as Record<string, unknown>)[field]) === String(row[field]));
      return { id: String(index), key: kind === "cartons" ? String(row.reference) : `${row.shape_id} / ${row.variant_id}`, change: existing ? unchanged ? "ongewijzigd" : "bijwerken" : "nieuw", values: fields.map(field => `${labels[field]}: ${row[field]}`).join(" · ") };
    });
    return { rows, errors, changes };
  }, [sheet, mapping, header, kind, records, fields, required]);
  const missing = required.filter(field => !mapping[field]);
  return <details className="rounded-2xl border bg-secondary/20 p-4"><summary className="cursor-pointer font-semibold">Excelmaster synchroniseren · intelligente herkenning / manuele mapping</summary><div className="mt-4 space-y-4">
    <p className="text-xs text-muted-foreground">Het werkboek wordt lokaal gelezen en herkend, zonder AI-dienst of upload van je bestand. Alleen bevestigde records, bestandsnaam en checksum worden opgeslagen{storage === "local" ? " in het browsergeheugen, niet in Supabase" : " in je privéwerkruimte"}. Upsert, geen automatische verwijdering. Ongekoppelde optionele velden worden leeg/0; actief=true en geblokkeerd=false. Dit kan bestaande waarden vervangen.</p>
    <Input aria-label="Excelmasterbestand" className="rounded-xl bg-card" type="file" accept=".xlsx" disabled={reading || busy} onChange={async e => {
      const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
      setReading(true); setBook(undefined); setError(""); setConfirmed(false); setMapping({}); setSuggestion(undefined); setMode("auto");
      try { const inspection = await inspectWorkbook(file); if (!inspection.sheets.length) throw new Error("Het bestand bevat geen werkbladen."); setBook(inspection); recognize(inspection); }
      catch (failure) { setError(failure instanceof Error ? failure.message : "Lezen mislukt."); }
      finally { setReading(false); }
    }} />
    {reading && <p className="text-sm">Werkboek lokaal lezen en kolommen herkennen…</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {book && sheet && <fieldset disabled={busy || reading} className="min-w-0 space-y-4">
      <div className="flex flex-wrap gap-2"><Button type="button" variant={mode === "auto" ? "default" : "outline"} className="rounded-xl" aria-pressed={mode === "auto"} onClick={() => recognize(book)}><Sparkles size={16} className="mr-2" />1. Intelligent herkennen</Button><Button type="button" variant={mode === "manual" ? "default" : "outline"} className="rounded-xl" aria-pressed={mode === "manual"} onClick={() => { setMode("manual"); setConfirmed(false); }}><SlidersHorizontal size={16} className="mr-2" />2. Manueel mappen / aanpassen</Button></div>
      <div className="space-y-2 rounded-xl border bg-card p-4 text-xs" role="status"><p className="font-semibold">{book.filename} · {sheet.name} · kopregel {header}</p><p>{missing.length ? `Manuele aanvulling nodig: ${missing.map(field => labels[field]).join(", ")}. Herkende velden zijn alvast ingevuld.` : "Alle verplichte kolommen zijn gekoppeld. Controleer de bronkolommen, data en eenheid vóór synchronisatie."}</p>{suggestion?.warnings.map((warning, i) => <p key={i}>{warning}</p>)}<p className="text-muted-foreground">Herkenning gebruikt Nederlandse/Engelse kolomnamen en schrijfvarianten; geen interpretatie van onbekende kolommen. L/B/H moeten interne maten in mm zijn. Format A/B/H blijven shapevelden; ze worden niet naar productassen vertaald.</p></div>
      {mode === "manual" && <><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-xs">Werkblad<select className="h-10 w-full rounded-xl border bg-card px-3" value={sheetIndex} onChange={e => { const index = Number(e.target.value); setSheetIndex(index); setHeader(1); setMapping({}); setSuggestion(undefined); setConfirmed(false); }}>{book.sheets.map((s, i) => <option key={i} value={i}>{s.name} ({s.visibility})</option>)}</select></label><label className="space-y-1 text-xs">Kopregel<Input className="rounded-xl bg-card" type="number" min={1} max={Math.max(1, sheet.rowCount)} value={header} onChange={e => { const value = e.target.valueAsNumber; if (!Number.isSafeInteger(value) || value < 1 || value > Math.max(1, sheet.rowCount)) return; setHeader(value); setMapping({}); setSuggestion(undefined); setConfirmed(false); }} /></label></div>
        <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => { const result = suggestHeaderMapping(sheet, header, kind); setMapping(result.mapping); setSuggestion(result); setConfirmed(false); }}>Kolommen in deze kopregel herkennen</Button>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">{fields.map(field => <label key={field} className="space-y-1 text-xs">{labels[field]}{required.includes(field) && " *"}<select className="h-10 w-full rounded-xl border bg-card px-2" value={mapping[field] ?? 0} onChange={e => { setMapping({ ...mapping, [field]: Number(e.target.value) }); setConfirmed(false); }}><option value={0}>Niet gekoppeld</option>{Array.from({ length: sheet.columnCount }, (_, i) => <option key={i} value={i + 1}>Kolom {i + 1}: {sheet.rows.find(r => r.number === header)?.cells.find(c => c.column === i + 1)?.text ?? "(geen koptekst)"}</option>)}</select></label>)}</div></>}
      {mode === "auto" && <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{fields.map(field => <div key={field} className="rounded-xl border bg-card p-3 text-xs"><p className="font-semibold">{labels[field]}{required.includes(field) && " *"}</p><p className="mt-1 break-words">{mapping[field] ? `Kolom ${mapping[field]}: ${sheet.rows.find(r => r.number === header)?.cells.find(c => c.column === mapping[field])?.text ?? ""}` : "Niet herkend · standaardwaarde in preview"}</p></div>)}</div>}
      {!!preview.errors.length && <div role="alert" className="max-h-40 overflow-auto rounded-xl border border-destructive/30 p-3 text-xs text-destructive">{preview.errors.slice(0, 30).map((message, i) => <p key={i}>{message}</p>)}{preview.errors.length > 30 && <p>En {preview.errors.length - 30} andere fouten.</p>}<p className="mt-2">Pas zo nodig de manuele mapping aan. Een herkenningsvoorstel is geen geldige import zolang deze fouten bestaan.</p></div>}
      {!!preview.changes.length && <RecordTable label="Importpreview" rows={preview.changes} columns={[{ label: "Sleutel", value: r => r.key }, { label: "Wijziging", value: r => r.change }, { label: "Waarden", value: r => r.values }]} />}
      <label className="flex items-start gap-2 text-xs"><input className="mt-0.5" type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />Ik bevestig de mapping, preview en millimetereenheid; lege optionele velden mogen bestaande waarden vervangen.</label>
      <Button className="rounded-xl" disabled={!confirmed || !!preview.errors.length} onClick={async () => { if (await sync(kind, book.filename, book.sha256, preview.rows)) { setBook(undefined); setConfirmed(false); } }}>Bevestigde preview synchroniseren</Button>
    </fieldset>}
    <h4 className="text-sm font-semibold">Importhistoriek</h4><RecordTable label="Importhistoriek" rows={records.imports.filter(i => i.kind === kind).sort((a, b) => b.created_on.localeCompare(a.created_on))} columns={[{ label: "Bestand", value: r => r.filename }, { label: "Datum", value: r => r.created_on }, { label: "Records", value: r => r.summary.rows }, { label: "SHA-256", value: r => r.checksum ?? "niet beschikbaar" }]} />
  </div></details>;
}
