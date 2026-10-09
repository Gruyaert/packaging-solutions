import { describe, expect, it } from "vitest";
import { searchPackaging } from "./engine";
import type { Box, Product } from "./types";

const product: Product = { productId: "limit-fixture", reference: "Testfixture", length: 10, width: 10, height: 10, quantity: 8, weightKg: 0.25, rotations: ["L-B-H"], maxInLength: 10, maxInWidth: 10, maxLayers: 10 };
const box: Box = { boxId: "limit-box", reference: "Testfixture", length: 20, width: 20, height: 30, cardboard: 0 };
const spacing = { length: 0, width: 0, height: 0 };
describe("Search-time global limits", () => {
  it("caps content weight during packing, including fill alternatives", () => {
    const results = searchPackaging([product], [box], spacing, "fill", { maxWeightKg: 1 });
    expect(results.solutions.length).toBeGreaterThan(0);
    expect(results.solutions.every(s => s.weightKg <= 1 + 1e-6 && s.placements.length <= 4)).toBe(true);
  });
  it("caps unique global Z levels without changing product maxima", () => {
    const before = JSON.stringify(product);
    const results = searchPackaging([product], [box], spacing, "fill", { maxTotalLayers: 1 });
    expect(results.solutions.length).toBeGreaterThan(0);
    expect(results.solutions.every(s => new Set(s.placements.map(p => p.layerIndex)).size === 1 && s.placements.length === 4)).toBe(true);
    expect(JSON.stringify(product)).toBe(before);
  });
  it("rejects invalid global settings", () => {
    expect(() => searchPackaging([product], [box], spacing, "desired", { maxWeightKg: NaN })).toThrow();
    expect(() => searchPackaging([product], [box], spacing, "desired", { maxTotalLayers: 1.5 })).toThrow();
  });
});
