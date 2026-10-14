import { describe, expect, it } from 'vitest';
import { palletize, DEFAULT_PALLET } from '@/domain/packing/pallet';
import type { Product, Solution } from '@/domain/packing/types';

const product: Product = {
  productId: 'p', reference: 'Product', length: 100, width: 80, height: 50, quantity: 4,
  weightKg: 1, rotations: ['L-B-H'], maxInLength: 10, maxInWidth: 10, maxLayers: 10,
};

const solution: Solution = {
  solutionId: 'solution', box: { boxId: 'box', reference: 'Doos', length: 400, width: 300, height: 200, cardboard: 3 },
  spacing: { length: 0, width: 0, height: 0 }, placements: [{ placementId: 'placement', productId: 'p', x: 0, y: 0, z: 0, length: 100, width: 80, height: 50, orientation: 'L-B-H', layerIndex: 0 }],
  counts: { p: 1 }, restPlacementIds: [], weightKg: 1, utilization: 0.1, air: 0.9, transportEfficiency: 0.1, practicalScore: 1,
  metadata: { restPlacementIds: [], handlingScore: 1, pattern: 'fixture' }, validation: { status: 'valid', errors: [], warnings: [], counts: { p: 1 }, overlapAnalysis: { valid: true, pairs: [] }, gravityCheck: { valid: true, unsupported: [] }, boundsCheck: { valid: true, outside: [] } },
};

describe('palletization from a selected packaging solution', () => {
  it('returns pallet patterns for the packaging source used by Verpakking zoeken', () => {
    const results = palletize({ kind: 'packaging', solution, products: [product], context: { mode: 'STOCK' } }, DEFAULT_PALLET);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].placements.length).toBeGreaterThan(0);
  });
});
