import defaultCartonsUrl from "@/assets/default-cartons.xlsx?url";
import defaultShapesUrl from "@/assets/default-shapes.xlsx?url";
import { inspectWorkbook, type InspectedSheet, type WorkbookInspection } from "./inspect-workbook";
import { IMPORT_FIELDS, IMPORT_REQUIRED, suggestHeaderMapping, type MasterKind } from "./suggest-excel-mapping";
import { isRepeatedImportHeader } from "./import-header-row";

const numeric = new Set(["length", "width", "height", "cardboard", "format_a", "format_b", "format_h"]);
const sources: Record<MasterKind, { url: string; filename: string }> = {
  cartons: { url: defaultCartonsUrl, filename: "Omdozen.xlsx" },
  shapes: { url: defaultShapesUrl, filename: "Shapes.xlsx" },
};

function findDefaultMapping(book: WorkbookInspection, kind: MasterKind) {
  const candidates: { sheetIndex: number; headerRow: number; mapping: Record<string, number>; missing: string[]; score: number }[] = [];
  book.sheets.forEach((sheet, sheetIndex) => {
    if (sheet.visibility !== "visible") return;
    for (const row of sheet.rows.filter(candidate => candidate.number <= 50)) {
      const suggestion = suggestHeaderMapping(sheet, row.number, kind);
      const recognizedRequired = IMPORT_REQUIRED[kind].length - suggestion.missing.length;
      if (recognizedRequired >= 2) candidates.push({ sheetIndex, headerRow: row.number, mapping: suggestion.mapping, missing: suggestion.missing, score: recognizedRequired * 100 + suggestion.matches.length });
    }
  });
  candidates.sort((a, b) => b.score - a.score || a.sheetIndex - b.sheetIndex || a.headerRow - b.headerRow);
  return candidates[0];
}

function parseRows(kind: MasterKind, sheet: InspectedSheet, headerRow: number, mapping: Record<string, number>) {
  const rows: Record<string, unknown>[] = [];
  const keys = new Set<string>();
  for (const row of sheet.rows.filter(candidate => candidate.number > headerRow)) {
    if (isRepeatedImportHeader(sheet, row, headerRow, kind, mapping)) continue;
    const requiredCells = IMPORT_REQUIRED[kind].map(field => row.cells.find(cell => cell.column === mapping[field]));
    if (requiredCells.every(cell => !cell || !cell.text.trim())) continue;
    const item: Record<string, unknown> = {};
    for (const field of IMPORT_FIELDS[kind]) {
      const cell = row.cells.find(candidate => candidate.column === mapping[field]);
      const raw = cell?.type === "formule" ? cell.cachedValue : cell?.value;
      if (numeric.has(field)) {
        const value = raw === null || raw === undefined || raw === "" ? (field === "cardboard" ? 0 : NaN) : typeof raw === "number" ? raw : Number(String(raw).trim().replace(",", "."));
        if (!Number.isFinite(value) || (field === "cardboard" ? value < 0 : value <= 0)) throw new Error(`${sources[kind].filename}: ongeldige ${field} op rij ${row.number}.`);
        item[field] = value;
      } else if (field === "active" || field === "blocked") {
        if (!mapping[field]) item[field] = field === "active";
        else {
          const value = String(raw ?? "").trim().toLowerCase();
          if (!["true", "false", "1", "0", "ja", "nee", "yes", "no"].includes(value)) throw new Error(`${sources[kind].filename}: ongeldige ${field} op rij ${row.number}.`);
          item[field] = ["true", "1", "ja", "yes"].includes(value);
        }
      } else {
        const value = cell?.text.trim() ?? "";
        if (IMPORT_REQUIRED[kind].includes(field) && !value) throw new Error(`${sources[kind].filename}: ${field} ontbreekt op rij ${row.number}.`);
        item[field] = value;
      }
    }
    const key = kind === "cartons" ? JSON.stringify([item.reference]) : JSON.stringify([item.shape_id, item.variant_id]);
    if (keys.has(key)) throw new Error(`${sources[kind].filename}: dubbele sleutel op rij ${row.number}.`);
    keys.add(key);
    rows.push(item);
  }
  if (!rows.length) throw new Error(`${sources[kind].filename}: geen masterdata gevonden.`);
  return rows;
}

export async function loadDefaultMasterRows(kind: MasterKind) {
  const source = sources[kind];
  const response = await fetch(source.url);
  if (!response.ok) throw new Error(`${source.filename} kon niet worden geladen.`);
  const blob = await response.blob();
  const inspection = await inspectWorkbook(new File([blob], source.filename, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const suggestion = findDefaultMapping(inspection, kind);
  if (!suggestion || suggestion.missing.length) throw new Error(`${source.filename}: verplichte standaardkolommen konden niet veilig worden herkend${suggestion?.missing.length ? ` (${suggestion.missing.join(", ")})` : ""}.`);
  const sheet = inspection.sheets[suggestion.sheetIndex];
  if (!sheet) throw new Error(`${source.filename}: werkblad ontbreekt.`);
  return { filename: source.filename, checksum: inspection.sha256, rows: parseRows(kind, sheet, suggestion.headerRow, suggestion.mapping) };
}

export async function loadAllDefaultMasterRows() {
  const [cartons, shapes] = await Promise.all([loadDefaultMasterRows("cartons"), loadDefaultMasterRows("shapes")]);
  return { cartons, shapes };
}

export function defaultMasterdataFilenames() {
  return { cartons: sources.cartons.filename, shapes: sources.shapes.filename };
}

export const DEFAULT_MASTERDATA_POLICY = "insert-if-missing; key-based upsert for later imports; no deletion";
export const DEFAULT_MASTERDATA_CONTRACT = "defaults-from-attached-excel-v1";
