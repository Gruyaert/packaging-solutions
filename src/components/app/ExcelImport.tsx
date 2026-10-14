import { useState } from "react";
import { Sparkles, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { inspectWorkbook, type WorkbookInspection } from "@/infrastructure/inspect-workbook";
import { suggestHeaderMapping, suggestWorkbookMapping, IMPORT_FIELDS, IMPORT_REQUIRED, type MappingSuggestion, type MasterKind } from "@/infrastructure/suggest-excel-mapping";
import { usePackagingData } from "./PackagingDataProvider";
import { toast } from "sonner";

export function ExcelImport({ kind }: { kind: MasterKind }) {
  const { records, sync, busy } = usePackagingData();
  const [book, setBook] = useState<WorkbookInspection | undefined>();
  const [sheetIndex, setSheetIndex] = useState(0);
  const [header, setHeader] = useState(1);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string>("");
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [suggestion, setSuggestion] = useState<MappingSuggestion>();
  const [lastRow, setLastRow] = useState(1);

  const fields = IMPORT_FIELDS[kind];
  const required = IMPORT_REQUIRED[kind];
  const sheet = book?.sheets[sheetIndex];

  function recognize(inspection: WorkbookInspection, selectedSheet?: number) {
    const result = suggestWorkbookMapping(inspection, kind, selectedSheet);
    setSheetIndex(result.sheetIndex);
    setHeader(result.headerRow);
    setLastRow(inspection.sheets[result.sheetIndex]?.rowCount ?? 1);
    setMapping(result.mapping);
    setSuggestion(result);
    setConfirmed(false);
    setMode(result.found && !result.ambiguous && !result.missing.length && !result.warnings.length ? "auto" : "manual");
  }

  if (!book) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Excel importeren</CardTitle>
          <CardDescription>
            Importeer {kind === "cartons" ? "omdozen" : "shapes"} masterdata vanuit een Excel bestand (.xlsx).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            De import gebruikt slimme herkenning van Nederlandse en Engelse kolomnamen, inclusief schrijfwijzevarianten
            en de millimetereenheid.
          </p>
          <input
            type="file"
            accept=".xlsx"
            className="hidden"
            id="excel-file"
            ref={ref => {
              if (ref) {
                ref.addEventListener("change", async e => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  setReading(true);
                  setBook(undefined);
                  setError("");
                  setConfirmed(false);
                  setMapping({});
                  setSuggestion(undefined);
                  setMode("auto");
                  try {
                    const inspection = await inspectWorkbook(file);
                    if (!inspection.sheets.length) throw new Error("Het bestand bevat geen werkbladen.");
                    setBook(inspection);
                    recognize(inspection);
                  } catch (failure) {
                    setError(failure instanceof Error ? failure.message : "Lezen van het Excel-bestand mislukt.");
                  } finally {
                    setReading(false);
                  }
                });
              }
            }}
          />
          <label htmlFor="excel-file">
            <Button disabled={reading || busy} asChild>
              <span>
                <UploadCloud className="mr-2 size-4" />
                {reading ? "Lezen..." : "Bestand kiezen"}
              </span>
            </Button>
          </label>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  const missing = required.filter(field => !mapping[field]);
  const hasErrors = !!missing.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Excel importeren</CardTitle>
        <CardDescription>
          Importeer {kind === "cartons" ? "omdozen" : "shapes"} masterdata vanuit een Excel bestand (.xlsx).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={mode === "auto" ? "default" : "outline"}
            onClick={() => recognize(book)}
            disabled={busy || reading}
          >
            <Sparkles className="mr-2 size-4" />
            1. Slim herkennen
          </Button>
          <Button
            type="button"
            variant={mode === "manual" ? "default" : "outline"}
            onClick={() => {
              setMode("manual");
              setConfirmed(false);
            }}
            disabled={busy || reading}
          >
            2. Handmatig mappen
          </Button>
        </div>

        <div className="mb-4 space-y-2 rounded-md bg-muted p-3 text-sm">
          <p className="font-medium">{book.filename} · {sheet.name} · kopregel {header}</p>
          <p>
            {missing.length
              ? `Handmatige aanvulling nodig: ${missing.map(field => field).join(", ")}. Herkende velden zijn alvast ingevuld.`
              : "Alle verplichte kolommen zijn gekoppeld. Controleer de bronkolommen vóór synchronisatie."}
          </p>
          {suggestion?.warnings.map((warning, i) => (
            <p key={i} className="text-muted-foreground">{warning}</p>
          ))}
        </div>

        {mode === "manual" && (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 text-sm">
                <label className="block font-medium">Werkblad</label>
                <select
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={sheetIndex}
                  onChange={e => {
                    recognize(book, Number(e.target.value));
                    setMode("manual");
                  }}
                >
                  {book.sheets.map((s, i) => (
                    <option key={i} value={i}>
                      {s.name} ({s.visibility})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 text-sm">
                <label className="block font-medium">Kopregel</label>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, sheet.rowCount)}
                  value={header}
                  onChange={e => {
                    const value = e.target.valueAsNumber;
                    if (!Number.isSafeInteger(value) || value < 1 || value > Math.max(1, sheet.rowCount)) return;
                    setHeader(value);
                    const result = suggestHeaderMapping(sheet, value, kind);
                    setMapping(result.mapping);
                    setSuggestion(result);
                    setConfirmed(false);
                  }}
                />
              </div>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              {fields.map(field => (
                <div key={field} className="space-y-1">
                  <label className="block text-sm">
                    {field}
                    {required.includes(field) && <span className="text-destructive"> *</span>}
                  </label>
                  <select
                    className="h-9 w-full rounded-md border bg-background px-2"
                    value={mapping[field] ?? 0}
                    onChange={e => {
                      setMapping({ ...mapping, [field]: Number(e.target.value) });
                      setConfirmed(false);
                    }}
                  >
                    <option value={0}>Niet gekoppeld</option>
                    {Array.from({ length: sheet.columnCount }, (_, i) => (
                      <option key={i} value={i + 1}>
                        Kolom {i + 1}: {sheet.rows.find(r => r.number === header)?.cells.find(c => c.column === i + 1)?.text ?? "(geen koptekst)"}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mb-4 space-y-2 rounded-md border p-3 text-sm">
          <p className="font-medium">Preview (eerste 5 rijen):</p>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {fields.map(field => (
                  <th key={field} className="border p-1 text-left font-medium">{field}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheet?.rows
                .filter(r => r.number > header && r.number <= Math.min(lastRow, header + 5))
                .map(row => (
                  <tr key={row.number}>
                    {fields.map(field => {
                      const cell = row.cells.find(c => c.column === mapping[field]);
                      return (
                        <td key={field} className="border p-1 text-muted-foreground">
                          {cell?.text ?? "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              {(!sheet || sheet.rows.length <= header) && (
                <tr>
                  <td colSpan={fields.length} className="border p-2 text-center text-muted-foreground">
                    Geen gegevensrijen gevonden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t p-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
          />
          Ik bevestig de mapping en millimetereenheid; lege optionele velden mogen bestaande waarden vervangen.
        </label>
        <Button
          disabled={!confirmed || hasErrors || busy}
          onClick={async () => {
            const rows: Record<string, unknown>[] = [];
            const numeric = new Set(["length", "width", "height", "cardboard", "format_a", "format_b", "format_h"]);
            for (const row of sheet!.rows.filter(r => r.number > header && r.number <= lastRow)) {
              const item: Record<string, unknown> = {};
              for (const key of fields) {
                const cell = row.cells.find(cell => cell.column === mapping[key]);
                const raw = cell?.type === "formule" ? cell.cachedValue : cell?.value;
                if (numeric.has(key)) {
                  const value = raw === null || raw === undefined || raw === ""
                    ? (key === "cardboard" && !mapping[key] ? 0 : NaN)
                    : typeof raw === "number" ? raw : Number(String(raw).trim().replace(",", "."));
                  item[key] = value;
                } else if (key === "active" || key === "blocked") {
                  if (!mapping[key]) item[key] = key === "active";
                  else {
                    const value = String(raw ?? "").trim().toLowerCase();
                    item[key] = ["true", "1", "ja", "yes"].includes(value);
                  }
                } else {
                  const value = cell?.text.trim() ?? "";
                  if (required.includes(key) && !value) throw new Error(`${field}: ontbreekt in rij ${row.number}`);
                  item[key] = value;
                }
              }
              rows.push(item);
            }
            if (await sync(kind, book.filename, book.sha256, rows)) {
              toast.success(`Succesvol ${rows.length} records gesynchroniseerd naar ${kind}.`);
              setBook(undefined);
              setConfirmed(false);
            }
          }}
        >
          {hasErrors ? "Koppel alle verplichte velden" : "Synchroniseren"}
        </Button>
      </CardFooter>
    </Card>
  );
}
