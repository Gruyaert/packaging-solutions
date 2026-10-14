import type { InspectedSheet, WorkbookInspection } from './inspect-workbook';

export type MasterKind = 'cartons' | 'shapes';
export const IMPORT_FIELDS = {
  cartons: ['reference', 'length', 'width', 'height', 'cardboard', 'description', 'material', 'active'],
  shapes: ['shape_id', 'variant_id', 'format_a', 'format_b', 'format_h', 'description', 'product_group', 'blocked', 'active'],
};
export const IMPORT_REQUIRED = { cartons: ['reference', 'length', 'width', 'height'], shapes: ['shape_id', 'variant_id', 'format_a', 'format_b', 'format_h'] };
const aliases: Record<string, string[]> = {
  reference: ['reference', 'referentie', 'ref', 'id', 'code', 'doos', 'doos id', 'doosreferentie', 'omdoos', 'omdoos id', 'omdoosnummer', 'omdoosreferentie', 'omdoos ref', 'box reference', 'box id', 'carton reference', 'carton id', 'dooscode', 'boxcode', 'carton code', 'artikelnummer', 'article number', 'doosnummer', 'doos nr'],
  length: ['length', 'lengte', 'l', 'x', 'binnen l', 'binnen x', 'binnenlengte', 'interne lengte', 'internal length', 'inside length', 'inner length', 'lengte binnen', 'l binnen', 'lengte x', 'length x'],
  width: ['width', 'breedte', 'b', 'w', 'y', 'binnen b', 'binnen y', 'binnenbreedte', 'interne breedte', 'internal width', 'inside width', 'inner width', 'breedte binnen', 'b binnen', 'breedte y', 'width y'],
  height: ['height', 'hoogte', 'h', 'z', 'binnen h', 'binnen z', 'binnenhoogte', 'interne hoogte', 'internal height', 'inside height', 'inner height', 'hoogte binnen', 'h binnen', 'hoogte z', 'height z'],
  cardboard: ['cardboard', 'karton', 'dikte', 'karton dikte', 'kartondikte', 'cardboard thickness', 'board thickness', 'wanddikte', 'wall thickness'],
  shape_id: ['shape_id', 'shapeid', 'shape id', 'shape', 'shape ref', 'shape reference', 'shape code', 'shape nummer', 'shape nr', 'ref', 'reference', 'id', 'vorm', 'vorm id', 'vormcode'],
  variant_id: ['variant_id', 'shapevariant', 'shapevariantid', 'shape variant ref', 'shape variant reference', 'shape variant id', 'variant', 'variant id', 'variantid', 'variant code', 'variant nummer', 'variant nr'],
  format_a: ['format_a', 'format a', 'formata', 'formaat a', 'a'],
  format_b: ['format_b', 'format b', 'formatb', 'formaat b', 'b'],
  format_h: ['format_h', 'format h', 'formath', 'formaat h', 'h'],
  description: ['description', 'beschrijving', 'omschrijving', 'descriptie'],
  material: ['material', 'materiaal', 'material type', 'materiaaltype'],
  product_group: ['product_group', 'productgroup', 'product group', 'productgroep'],
  active: ['active', 'actief', 'is active', 'isactive'],
  blocked: ['blocked', 'geblokkeerd', 'is blocked', 'isblocked'],
};
const dimensions = new Set(['length', 'width', 'height', 'cardboard', 'format_a', 'format_b', 'format_h']);
function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
const normalizedAliases = Object.fromEntries(Object.entries(aliases).map(([key, values]) => [key, new Set(values.map(normalize))]));
export interface MappingSuggestion {
  mapping: Record<string, number>;
  matches: { field: string; column: number; header: string }[];
  warnings: string[];
  missing: string[];
}
export function suggestHeaderMapping(sheet: InspectedSheet, headerRow: number, kind: MasterKind): MappingSuggestion {
  const cells = sheet.rows.find(row => row.number === headerRow)?.cells ?? [];
  const mapping: Record<string, number> = {}, matches: MappingSuggestion['matches'] = [], warnings: string[] = [];
  for (const field of IMPORT_FIELDS[kind]) {
    const candidates = cells.filter(cell => {
      if (cell.type === 'formule' || cell.type === 'Excel-fout') return false;
      const text = dimensions.has(field) ? cell.text.trim().replace(/\s*[\[(]?\s*mm\s*[\])]?\s*$/i, '') : cell.text;
      return normalizedAliases[field].has(normalize(text));
    });
    if (candidates.length === 1) {
      mapping[field] = candidates[0].column;
      matches.push({ field, column: candidates[0].column, header: candidates[0].text });
    } else if (candidates.length > 1) warnings.push(`Meerdere mogelijke kolommen voor ${field}: ${candidates.map(c => c.text).join(' / ')}. Kies manueel.`);
  }
  for (const match of [...matches]) {
    if (matches.some(other => other.field !== match.field && other.column === match.column)) {
      delete mapping[match.field];
      warnings.push(`Kolom ${match.column} heeft meerdere mogelijke doelvelden; kies manueel.`);
    }
  }
  return { mapping, matches: matches.filter(match => mapping[match.field]), warnings, missing: IMPORT_REQUIRED[kind].filter(field => !mapping[field]) };
}
export interface WorkbookSuggestion extends MappingSuggestion { sheetIndex: number; headerRow: number; ambiguous: boolean; found: boolean }
export function suggestWorkbookMapping(book: WorkbookInspection, kind: MasterKind, selectedSheet?: number): WorkbookSuggestion {
  const candidates: (MappingSuggestion & { sheetIndex: number; headerRow: number; score: number })[] = [];
  book.sheets.forEach((sheet, sheetIndex) => {
    if (selectedSheet !== undefined ? sheetIndex !== selectedSheet : sheet.visibility !== 'visible') return;
    for (const row of sheet.rows.filter(r => r.number <= 50)) {
      const suggestion = suggestHeaderMapping(sheet, row.number, kind);
      const recognizedRequired = IMPORT_REQUIRED[kind].length - suggestion.missing.length;
      if (recognizedRequired < 2) continue;
      candidates.push({ ...suggestion, sheetIndex, headerRow: row.number, score: recognizedRequired * 100 + suggestion.matches.length });
    }
  });
  candidates.sort((a, b) => b.score - a.score || a.sheetIndex - b.sheetIndex || a.headerRow - b.headerRow);
  const best = candidates[0];
  if (!best) return { sheetIndex: selectedSheet ?? Math.max(0, book.sheets.findIndex(s => s.visibility === 'visible')), headerRow: 1, mapping: {}, matches: [], missing: [...IMPORT_REQUIRED[kind]], warnings: ['Geen betrouwbare kopregel herkend in de eerste 50 rijen. Kies werkblad, kopregel en kolommen manueel.'], ambiguous: false, found: false };
  const ambiguous = candidates.some((candidate, index) => index > 0 && candidate.score === best.score);
  if (ambiguous) return { ...best, mapping: {}, matches: [], missing: [...IMPORT_REQUIRED[kind]], warnings: ['Meerdere werkbladen/kopregels zijn even waarschijnlijk. Er is geen mapping toegepast; kies manueel.'], ambiguous: true, found: true };
  return { ...best, ambiguous: false, found: true };
}
