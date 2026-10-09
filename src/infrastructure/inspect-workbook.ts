import type { Cell, CellValue } from "exceljs";

export interface InspectedCell {
  address: string;
  column: number;
  type: string;
  text: string;
  value: unknown;
  formula?: string;
  sharedFormula?: string;
  cachedValue?: unknown;
}
export interface InspectedSheet {
  name: string;
  visibility: string;
  rowCount: number;
  columnCount: number;
  rows: { number: number; cells: InspectedCell[] }[];
  emptyRows: number[];
  mergedRanges: string[];
}
export interface WorkbookInspection {
  contractVersion: "0.2";
  status: "technisch geïnspecteerd — mapping open";
  filename: string;
  sizeBytes: number;
  sha256: string | null;
  inspectedAt: string;
  sheets: InspectedSheet[];
}

function serializable(value: CellValue | undefined): unknown {
  if (value instanceof Date) return value.toISOString();
  if (value === undefined) return null;
  return value;
}

function inspectCell(cell: Cell): InspectedCell {
  const value = cell.value;
  const result: InspectedCell = {
    address: cell.address,
    column: cell.col as number,
    type: value === null ? "leeg" : value instanceof Date ? "datum" : typeof value,
    text: cell.text,
    value: serializable(value),
  };
  if (value && typeof value === "object" && !(value instanceof Date)) {
    if ("formula" in value || "sharedFormula" in value) {
      result.type = "formule";
      if ("formula" in value) result.formula = value.formula;
      if ("sharedFormula" in value) result.sharedFormula = value.sharedFormula;
      result.cachedValue = serializable(value.result);
    } else if ("richText" in value) result.type = "rich text";
    else if ("hyperlink" in value) result.type = "hyperlink";
    else if ("error" in value) result.type = "Excel-fout";
  }
  return result;
}

export async function inspectWorkbook(file: File): Promise<WorkbookInspection> {
  if (!/\.xlsx$/i.test(file.name)) throw new Error("Selecteer een .xlsx-bestand.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Maximaal 5 MB per bestand voor deze lokale inspectie.");
  const bytes = await file.arrayBuffer();
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  try {
    await workbook.xlsx.load(bytes);
  } catch {
    throw new Error("Dit XLSX-bestand kan niet worden gelezen. Controleer of het geldig en niet met een wachtwoord beveiligd is.");
  }
  const sheets: InspectedSheet[] = [];
  let totalCells = 0;
  for (const sheet of workbook.worksheets) {
    if (sheet.rowCount > 20000 || sheet.columnCount > 256) {
      throw new Error("Het werkblad overschrijdt de inspectielimiet (20.000 rijen / 256 kolommen). Er is geen gedeeltelijk rapport gemaakt.");
    }
    const rows: InspectedSheet["rows"] = [];
    const emptyRows: number[] = [];
    for (let number = 1; number <= sheet.rowCount; number++) {
      const cells: InspectedCell[] = [];
      sheet.getRow(number).eachCell((cell) => {
        if (cell.value !== null) cells.push(inspectCell(cell));
      });
      totalCells += cells.length;
      if (totalCells > 200000) throw new Error("Maximaal 200.000 gevulde cellen per inspectie. Er is geen gedeeltelijk rapport gemaakt.");
      if (cells.length) rows.push({ number, cells });
      else emptyRows.push(number);
    }
    sheets.push({
      name: sheet.name,
      visibility: sheet.state,
      rowCount: sheet.rowCount,
      columnCount: sheet.columnCount,
      rows,
      emptyRows,
      mergedRanges: sheet.model.merges ?? [],
    });
  }
  const digest = globalThis.crypto?.subtle
    ? await crypto.subtle.digest("SHA-256", bytes)
    : null;
  return {
    contractVersion: "0.2",
    status: "technisch geïnspecteerd — mapping open",
    filename: file.name,
    sizeBytes: file.size,
    sha256: digest ? Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("") : null,
    inspectedAt: new Date().toISOString(),
    sheets,
  };
}

export function checkKeys(sheet: InspectedSheet, headerRow: number, columns: number[]) {
  const missingRows: number[] = [];
  const groups = new Map<string, number[]>();
  if (!columns.length) return { missingRows, duplicates: [] as number[][] };
  for (const row of sheet.rows.filter((item) => item.number > headerRow)) {
    const values = columns.map((column) => row.cells.find((cell) => cell.column === column));
    if (values.some((cell) => !cell || cell.type === "formule" || !cell.text.trim())) {
      missingRows.push(row.number);
      continue;
    }
    const key = JSON.stringify(values.map((cell) => [cell!.type, cell!.value]));
    groups.set(key, [...(groups.get(key) ?? []), row.number]);
  }
  return { missingRows, duplicates: [...groups.values()].filter((rows) => rows.length > 1) };
}
