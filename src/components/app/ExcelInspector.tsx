import { useRef, useState } from "react";
import { Download, FileSearch, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { checkKeys, inspectWorkbook, type InspectedSheet, type WorkbookInspection } from "@/infrastructure/inspect-workbook";

function SheetInspector({ sheet }: { sheet: InspectedSheet }) {
  const [headerRow, setHeaderRow] = useState(sheet.rows[0]?.number ?? 1);
  const [keys, setKeys] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const headers = sheet.rows.find((row) => row.number === headerRow)?.cells ?? [];
  const data = sheet.rows.filter((row) => row.number > headerRow);
  const findings = checkKeys(sheet, headerRow, keys);
  const shown = data.slice(page * 20, page * 20 + 20);
  const columns = Array.from({ length: sheet.columnCount }, (_, index) => index + 1);

  return (
    <div className="space-y-4 rounded-2xl border bg-background p-4 sm:p-5">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm font-medium">Koprij (jouw keuze, geen bevestigde mapping)
          <Input type="number" min={1} max={Math.max(1, sheet.rowCount)} value={headerRow} className="w-28 rounded-xl bg-card" onChange={(event) => {
            const value = Number(event.target.value);
            if (Number.isInteger(value) && value >= 1 && value <= Math.max(1, sheet.rowCount)) { setHeaderRow(value); setKeys([]); setPage(0); }
          }} />
        </label>
        <p className="text-sm text-muted-foreground">{sheet.rows.length} niet-lege rijen · {sheet.emptyRows.length} lege rijen binnen het gebruikte bereik</p>
      </div>
      <div>
        <p className="text-sm font-semibold">Kies kolommen voor een samengestelde sleutelcontrole</p>
        <p className="mt-1 text-xs text-muted-foreground">Exacte bronwaarden en celtypen worden vergeleken; geen automatische normalisatie. Formules in sleutelvelden gelden als niet toetsbaar.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {headers.map((cell) => <label key={cell.column} className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm">
            <input type="checkbox" checked={keys.includes(cell.column)} onChange={(event) => setKeys(event.target.checked ? [...keys, cell.column].sort((a, b) => a - b) : keys.filter((column) => column !== cell.column))} className="size-4 accent-[hsl(var(--primary))]" />
            {cell.text || cell.address} <span className="text-xs text-muted-foreground">({cell.address})</span>
          </label>)}
          {!headers.length && <p className="text-sm text-muted-foreground">Geen gevulde cellen in deze koprij.</p>}
        </div>
      </div>
      {keys.length > 0 && <div className="rounded-xl border bg-card p-3 text-sm" role="status">
        <p><strong>{findings.duplicates.length}</strong> dubbele sleutelgroepen · <strong>{findings.missingRows.length}</strong> rijen met ontbrekende/niet-toetsbare sleutel</p>
        <p className="mt-1 break-words">Dubbele rijnummers: {findings.duplicates.length ? findings.duplicates.map((rows) => rows.join(", ")).join("; ") : "geen"}</p>
        <p className="mt-1 break-words">Ontbrekend/niet toetsbaar: {findings.missingRows.join(", ") || "geen"}</p>
      </div>}
      <div className="max-h-[32rem] overflow-auto rounded-xl border bg-card" tabIndex={0} aria-label={`Celgegevens ${sheet.name}`}>
        <table className="w-full text-left text-xs">
          <caption className="sr-only">Broncellen; formules worden niet uitgevoerd. Koprij {headerRow} is een gebruikerskeuze.</caption>
          <thead className="sticky top-0 bg-secondary text-secondary-foreground"><tr><th className="p-3">Rij</th>{columns.map((column) => <th key={column} className="min-w-36 p-3">{headers.find((cell) => cell.column === column)?.text || `Kolom ${column}`}</th>)}</tr></thead>
          <tbody>{shown.map((row) => <tr key={row.number} className="border-t"><th className="p-3 align-top">{row.number}</th>{columns.map((column) => {
            const cell = row.cells.find((item) => item.column === column);
            return <td key={column} className="max-w-72 whitespace-pre-wrap break-words p-3 align-top">{cell ? <><p>{cell.text || "—"}</p><p className="mt-1 text-muted-foreground">{cell.address} · {cell.type}</p>{cell.type === "formule" && <><p className="mt-1 font-mono">={cell.formula ?? `gedeeld: ${cell.sharedFormula}`}</p><p className="mt-1">Cache: {JSON.stringify(cell.cachedValue)}</p></>}</> : <span className="text-muted-foreground">leeg</span>}</td>;
          })}</tr>)}</tbody>
        </table>
        {!shown.length && <p className="p-4 text-sm text-muted-foreground">Geen niet-lege datarijen na de gekozen koprij.</p>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Pagina {page + 1} van {Math.max(1, Math.ceil(data.length / 20))} · 20 niet-lege rijen per pagina</p>
        <div className="flex gap-2"><Button variant="outline" className="rounded-xl bg-card" disabled={page === 0} onClick={() => setPage(page - 1)}>Vorige</Button><Button variant="outline" className="rounded-xl bg-card" disabled={(page + 1) * 20 >= data.length} onClick={() => setPage(page + 1)}>Volgende</Button></div>
      </div>
      <details className="text-xs text-muted-foreground"><summary className="cursor-pointer font-medium">Lege rijen en samengevoegde bereiken</summary><p className="mt-2 break-words">Lege rijen: {sheet.emptyRows.join(", ") || "geen"}</p><p className="mt-2">Samengevoegd: {sheet.mergedRanges.join(", ") || "geen"}</p></details>
    </div>
  );
}

function downloadReport(reports: WorkbookInspection[]) {
  const blob = new Blob([JSON.stringify({ reportVersion: "0.2", scope: "broninspectie; geen gevalideerde mapping of masterdata", workbooks: reports }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "excel-broninspectie.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ExcelInspector() {
  const [reports, setReports] = useState<WorkbookInspection[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  async function inspect(files: File[]) {
    setBusy(true);
    setErrors([]);
    const results: WorkbookInspection[] = [];
    const failures: string[] = [];
    try {
      for (const file of files) {
        try { results.push(await inspectWorkbook(file)); }
        catch (error) { failures.push(`${file.name}: ${error instanceof Error ? error.message : "Inspectie mislukt."}`); }
      }
      setReports(results);
      setSelected(0);
      setErrors(failures);
    } finally { setBusy(false); }
  }

  const report = reports[selected];
  return (
    <Card id="excel-inspectie" className="mt-8 rounded-2xl border-primary/25 shadow-none">
      <CardHeader className="p-5 sm:p-6"><div className="mb-2 flex items-center gap-2 text-primary"><FileSearch aria-hidden="true" className="size-5" /><p className="text-xs font-bold uppercase tracking-widest">Werkende broninspectie</p></div><CardTitle className="text-2xl">Bekijk je originele Excelbestanden</CardTitle><p className="text-sm leading-relaxed text-muted-foreground">Selecteer Shapes.xlsx en Omdozen.xlsx vanaf je computer. De inspectie gebeurt uitsluitend in je browser: geen upload, opslag of masterdata-import. Een nieuwe selectie vervangt de vorige inspectie.</p></CardHeader>
      <CardContent className="space-y-5 px-5 pb-5 sm:px-6 sm:pb-6">
        <input ref={input} type="file" multiple accept=".xlsx" className="sr-only" tabIndex={-1} onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ""; if (files.length) void inspect(files); }} />
        <div className="flex flex-wrap gap-3">
          <Button className="gap-2 rounded-xl px-5" disabled={busy} onClick={() => input.current?.click()}>{busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <FileSearch aria-hidden="true" className="size-4" />}{busy ? "Bestanden lezen…" : "Excelbestanden inspecteren"}</Button>
          {reports.length > 0 && <><Button variant="outline" className="gap-2 rounded-xl" disabled={busy} onClick={() => downloadReport(reports)}><Download aria-hidden="true" className="size-4" />Inspectierapport downloaden</Button><Button variant="ghost" className="gap-2 rounded-xl" disabled={busy} onClick={() => { setReports([]); setErrors([]); setSelected(0); }}><Trash2 aria-hidden="true" className="size-4" />Inspectie wissen</Button></>}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">Alleen vertrouwde XLSX-bestanden. Maximaal 5 MB per bestand. Formules worden niet berekend en externe links worden niet geopend. Het JSON-rapport bevat bronwaarden en kan vertrouwelijke gegevens bevatten.</p>
        {busy && <p role="status" className="text-sm text-primary">Werkbladen, celtypen, formules en bronchecksum worden uitgelezen…</p>}
        {errors.length > 0 && <div role="alert" className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">{errors.map((error, index) => <p key={index}>{error}</p>)}</div>}
        {reports.length > 0 && <div className="flex flex-wrap gap-2" aria-label="Geïnspecteerde bestanden">{reports.map((item, index) => <Button key={index} variant={selected === index ? "default" : "outline"} className="rounded-xl" aria-pressed={selected === index} onClick={() => setSelected(index)}>{item.filename}</Button>)}</div>}
        {report && <div className="space-y-4">
          <div className="rounded-xl bg-secondary p-4 text-sm text-secondary-foreground"><p className="font-semibold">Technisch geïnspecteerd — mapping nog open</p><p className="mt-1">{report.sizeBytes.toLocaleString("nl-BE")} bytes · {report.sheets.length} werkbladen</p><p className="mt-2 break-all font-mono text-xs">SHA-256: {report.sha256 ?? "niet beschikbaar in deze browsercontext"}</p></div>
          {report.sheets.map((sheet, index) => <details key={`${report.sha256 ?? report.filename}-${index}`} className="rounded-2xl border p-4" open={report.sheets.length === 1 || undefined}><summary className="cursor-pointer text-sm font-semibold">{sheet.name} · {sheet.visibility === "visible" ? "zichtbaar" : sheet.visibility === "veryHidden" ? "zeer verborgen" : "verborgen"} · bereik {sheet.rowCount} × {sheet.columnCount}</summary><div className="mt-4"><SheetInspector sheet={sheet} /></div></details>)}
          <p className="text-xs leading-relaxed text-muted-foreground">De koprij is een voorstel dat je kunt aanpassen. Sleutelkolommen kies je expliciet. Eenheden, betekenis, doosentiteit en domeinvalidaties worden niet uit kolomnamen afgeleid. Het rapport bevat alle uitgelezen cellen, niet alleen de zichtbare pagina; interactieve sleutelkeuzes worden niet opgeslagen.</p>
        </div>}
      </CardContent>
    </Card>
  );
}
