import { describe, expect, it } from 'vitest';
import { isRepeatedImportHeader } from '@/infrastructure/import-header-row';
import { suggestHeaderMapping } from '@/infrastructure/suggest-excel-mapping';
import type { InspectedSheet } from '@/infrastructure/inspect-workbook';

function fixture(headers: string[]): InspectedSheet {
  return { name: 'Omdozen', visibility: 'visible', rowCount: 4, columnCount: headers.length, emptyRows: [], mergedRanges: [], rows: [1, 3].map(number => ({ number, cells: headers.map((text, index) => ({ address: `${index+1}:${number}`, column: index+1, type: 'string', text, value: text })) })) };
}
describe('Excel correction boundaries', () => {
  it('recognizes additional inside-axis aliases without interpreting outside dimensions', () => {
    const sheet = fixture(['Doosnummer', 'Lengte X (mm)', 'Breedte binnen', 'Hoogte Z', 'Outside length']);
    expect(suggestHeaderMapping(sheet, 1, 'cartons').mapping).toEqual({ reference: 1, length: 2, width: 3, height: 4 });
  });
  it('only skips a repeated complete required header and preserves the source', () => {
    const sheet = fixture(['Referentie', 'Lengte', 'Breedte', 'Hoogte', 'Omschrijving']);
    const mapping = suggestHeaderMapping(sheet, 1, 'cartons').mapping;
    const before = JSON.stringify(sheet);
    expect(isRepeatedImportHeader(sheet, sheet.rows[0], 1, 'cartons', mapping)).toBe(false);
    expect(isRepeatedImportHeader(sheet, sheet.rows[1], 1, 'cartons', mapping)).toBe(true);
    expect(JSON.stringify(sheet)).toBe(before);
    sheet.rows[1].cells[2].text = '300';
    expect(isRepeatedImportHeader(sheet, sheet.rows[1], 1, 'cartons', mapping)).toBe(false);
  });
  it('does not silently skip formula, error or subtotal rows', () => {
    const sheet = fixture(['Referentie', 'Lengte', 'Breedte', 'Hoogte']);
    const mapping = suggestHeaderMapping(sheet, 1, 'cartons').mapping;
    for (const type of ['formule', 'Excel-fout']) {
      sheet.rows[1].cells[0].type = type;
      expect(isRepeatedImportHeader(sheet, sheet.rows[1], 1, 'cartons', mapping)).toBe(false);
    }
    sheet.rows[1].cells[0].type = 'string'; sheet.rows[1].cells[0].text = 'Subtotaal';
    expect(isRepeatedImportHeader(sheet, sheet.rows[1], 1, 'cartons', mapping)).toBe(false);
    expect(isRepeatedImportHeader(sheet, sheet.rows[1], 1, 'cartons', {})).toBe(false);
  });
  it('supports exact shape headers without translating format axes into carton fields', () => {
    const sheet = fixture(['ShapeID', 'ShapeVariantID', 'Format A', 'Format B', 'Format H']);
    const mapping = suggestHeaderMapping(sheet, 1, 'shapes').mapping;
    expect(isRepeatedImportHeader(sheet, sheet.rows[1], 1, 'shapes', mapping)).toBe(true);
    expect(isRepeatedImportHeader(sheet, sheet.rows[1], 1, 'cartons', mapping)).toBe(false);
  });
});
