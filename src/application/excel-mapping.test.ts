import { describe, expect, it } from 'vitest';
import { suggestHeaderMapping, suggestWorkbookMapping } from '@/infrastructure/suggest-excel-mapping';
import type { InspectedSheet, WorkbookInspection } from '@/infrastructure/inspect-workbook';

function sheet(headers: string[], headerRow = 1, name = 'Blad', visibility = 'visible'): InspectedSheet {
  return { name, visibility, rowCount: headerRow + 1, columnCount: headers.length, emptyRows: [], mergedRanges: [], rows: [{ number: headerRow, cells: headers.map((text, index) => ({ address: `${index + 1}:${headerRow}`, column: index + 1, type: 'string', text, value: text })) }] };
}
function book(sheets: InspectedSheet[]): WorkbookInspection {
  return { contractVersion: '0.2', status: 'technisch geïnspecteerd — mapping open', filename: 'fixture.xlsx', sizeBytes: 100, sha256: null, inspectedAt: '2026-01-01T00:00:00Z', sheets };
}
const cartonHeaders = ['Referentie', 'Binnen-L (mm)', 'Binnen-B (mm)', 'Binnen-H (mm)', 'Kartondikte', 'Omschrijving'];
describe('Local intelligent Excel mapping', () => {
  it('recognizes Dutch carton headers and optional fields without changing workbook data', () => {
    const input = sheet(cartonHeaders), before = JSON.stringify(input);
    const result = suggestHeaderMapping(input, 1, 'cartons');
    expect(result.mapping).toEqual({ reference: 1, length: 2, width: 3, height: 4, cardboard: 5, description: 6 });
    expect(result.missing).toEqual([]);
    expect(JSON.stringify(input)).toBe(before);
  });
  it('recognizes reordered English headers, case, separators and mm suffixes', () => {
    const result = suggestHeaderMapping(sheet(['HEIGHT [MM]', 'BOX_REFERENCE', 'inner-width mm', 'Internal Length', 'Material', 'IsActive']), 1, 'cartons');
    expect(result.mapping).toMatchObject({ height: 1, reference: 2, width: 3, length: 4, material: 5, active: 6 });
    expect(result.missing).toHaveLength(0);
  });
  it('keeps shape format fields separate from product/carton dimensions', () => {
    const input = sheet(['ShapeID', 'ShapeVariantID', 'Format A (mm)', 'Format_B', 'Format H', 'ProductGroup', 'Blocked']);
    const result = suggestHeaderMapping(input, 1, 'shapes');
    expect(result.mapping).toEqual({ shape_id: 1, variant_id: 2, format_a: 3, format_b: 4, format_h: 5, product_group: 6, blocked: 7 });
    expect(suggestHeaderMapping(input, 1, 'cartons').mapping.length).toBeUndefined();
  });
  it('finds a header below a preamble and chooses the relevant visible sheet', () => {
    const target = sheet(cartonHeaders, 4, 'Omdozen');
    target.rows.unshift({ number: 1, cells: [{ address: '1:1', column: 1, type: 'string', text: 'Maandrapport', value: 'Maandrapport' }] });
    const result = suggestWorkbookMapping(book([sheet(['Info'], 1, 'Toelichting'), target]), 'cartons');
    expect(result).toMatchObject({ sheetIndex: 1, headerRow: 4, ambiguous: false, found: true });
    expect(result.missing).toHaveLength(0);
  });
  it('does not guess when two columns have the same target meaning', () => {
    const result = suggestHeaderMapping(sheet([...cartonHeaders, 'Internal Length']), 1, 'cartons');
    expect(result.mapping.length).toBeUndefined(); expect(result.missing).toContain('length');
    expect(result.warnings.join(' ')).toContain('Meerdere mogelijke kolommen');
    expect(result.mapping.width).toBe(3);
  });
  it('does not apply any mapping for equally likely sheets or repeated headers', () => {
    const twoSheets = suggestWorkbookMapping(book([sheet(cartonHeaders), sheet(cartonHeaders, 1, 'Tweede')]), 'cartons');
    expect(twoSheets.ambiguous).toBe(true); expect(twoSheets.mapping).toEqual({});
    const repeated = sheet(cartonHeaders);
    repeated.rows.push({ ...repeated.rows[0], number: 3 });
    expect(suggestWorkbookMapping(book([repeated]), 'cartons').ambiguous).toBe(true);
  });
  it('leaves unknown fields, cm units and outside dimensions unmapped for manual review', () => {
    const result = suggestHeaderMapping(sheet(['Reference', 'Length (cm)', 'Outside width', 'Height', 'Notes']), 1, 'cartons');
    expect(result.mapping).toEqual({ reference: 1, height: 4 });
    expect(result.missing).toEqual(['length', 'width']);
  });
  it('ignores hidden sheets by default but can recognize an explicitly chosen sheet', () => {
    const input = book([sheet(['Info']), sheet(cartonHeaders, 2, 'Verborgen', 'hidden')]);
    expect(suggestWorkbookMapping(input, 'cartons').found).toBe(false);
    const chosen = suggestWorkbookMapping(input, 'cartons', 1);
    expect(chosen).toMatchObject({ sheetIndex: 1, headerRow: 2, found: true });
  });
  it('does not treat formula headers as trusted column names', () => {
    const input = sheet(cartonHeaders); input.rows[0].cells[1].type = 'formule';
    const result = suggestHeaderMapping(input, 1, 'cartons');
    expect(result.mapping.length).toBeUndefined(); expect(result.missing).toContain('length');
  });
  it('bounds header search and keeps incomplete safe suggestions for manual completion', () => {
    expect(suggestWorkbookMapping(book([sheet(cartonHeaders, 51)]), 'cartons').found).toBe(false);
    const partial = suggestWorkbookMapping(book([sheet(['Reference', 'Length', 'Something else'])]), 'cartons');
    expect(partial).toMatchObject({ found: true, ambiguous: false, mapping: { reference: 1, length: 2 } });
    expect(partial.missing).toEqual(['width', 'height']);
    expect(suggestWorkbookMapping(book([]), 'shapes').mapping).toEqual({});
  });
});
