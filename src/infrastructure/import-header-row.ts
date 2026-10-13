import type { InspectedSheet } from './inspect-workbook';
import { IMPORT_REQUIRED, type MasterKind } from './suggest-excel-mapping';

export function isRepeatedImportHeader(sheet: InspectedSheet, row: InspectedSheet['rows'][number], headerRow: number, kind: MasterKind, mapping: Record<string, number>) {
  if (row.number === headerRow) return false;
  const header = sheet.rows.find(candidate=>candidate.number===headerRow);
  if (!header) return false;
  return IMPORT_REQUIRED[kind].every(field=>{
    const original=header.cells.find(cell=>cell.column===mapping[field]), candidate=row.cells.find(cell=>cell.column===mapping[field]);
    return original && candidate && original.type!=='formule' && candidate.type!=='formule' && candidate.type!=='Excel-fout' && original.text.trim().length>0 && original.text.trim().toLowerCase()===candidate.text.trim().toLowerCase();
  });
}
