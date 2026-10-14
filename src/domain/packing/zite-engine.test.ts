import { describe, expect, it } from "vitest";
import { customBoxes } from "./custom-box";
import { searchPackaging } from "./engine";
import { overlaps, supported } from "./geometry";
import { palletize, DEFAULT_PALLET } from "./pallet";
import { isSimplePattern } from "./scoring";
import { type Box, type Product } from "./types";

const spacing = { length: 0, width: 0, height: 0 };
const product = (patch: Partial<Product> = {}): Product => ({ productId: "zite-a", reference: "ZITE A", length: 100, width: 60, height: 20, quantity: 4, weightKg: 0.2, rotations: ["L-B-H", "B-L-H"], maxInLength: 100, maxInWidth: 100, maxLayers: 100, ...patch });
const box = (patch: Partial<Box> = {}): Box => ({ boxId: "zite-box", reference: "ZITE fixture", length: 220, width: 140, height: 80, cardboard: 0, ...patch });

describe("ZITE-style packing engine", () => {
  it("reports layer search diagnostics and keeps valid alternatives bounded", () => {
    const result = searchPackaging([product()], [box()], spacing, "desired", { maxAttempts: 12 });
    expect(result.solutions.length).toBeLessThanOrEqual(20);
    expect(result.solutions.length).toBeGreaterThan(0);
    expect(result.solutions.every(solution => solution.validation.status === "valid")).toBe(true);
    expect(result.diagnostics?.beamWidth).toBe(24);
    expect(result.diagnostics?.strategies).toEqual(expect.arrayContaining(["area", "short", "long", "bottom"]));
    expect(result.solutions.some(solution => solution.metadata.patternMetrics?.layerCount)).toBe(true);
  });

  it("keeps a deterministic result fingerprint while deduplicating equivalent states", () => {
    const request = { products: [product()], boxes: [box()], spacing, strategy: "desired" as const, options: { maxAttempts: 12 } };
    const first = searchPackaging(request.products, request.boxes, request.spacing, request.strategy, request.options);
    const second = searchPackaging(request.products, request.boxes, request.spacing, request.strategy, request.options);
    const fingerprint = (result: typeof first) => JSON.stringify(result.solutions.map(solution => ({ box: solution.box, placements: solution.placements, counts: solution.counts, pattern: solution.metadata.pattern })));
    expect(fingerprint(second)).toBe(fingerprint(first));
    expect(second.diagnostics?.duplicateCandidates).toBeGreaterThanOrEqual(0);
  });

  it("supports the practical profile without returning complex candidates when simple ones exist", () => {
    const result = searchPackaging([product({ quantity: 2 })], [box()], spacing, "desired", { profile: "simple-practical", maxAttempts: 12 });
    expect(result.diagnostics?.profile).toBe("simple-practical");
    expect(result.solutions.length).toBeGreaterThan(0);
    expect(result.solutions.every(isSimplePattern)).toBe(true);
  });

  it("uses the layer engine for multi-product maatwerk and keeps exact counts", () => {
    const result = customBoxes([product({ quantity: 2 }), product({ productId: "zite-b", reference: "ZITE B", length: 50, width: 40, height: 30, quantity: 1 })], spacing, undefined, { maxAttempts: 32 });
    expect(result.mode).toBe("multi");
    expect(result.solutions.length).toBeGreaterThan(0);
    expect(result.solutions.every(solution => solution.counts["zite-a"] === 2 && solution.counts["zite-b"] === 1)).toBe(true);
    expect(result.solutions.every(solution => solution.metadata.pattern.includes("layer-beam"))).toBe(true);
  });

  it("adds pallet pattern families and validates alternating support", () => {
    const results = palletize({ kind: "database", box: box({ length: 300, width: 180, height: 100 }) }, { ...DEFAULT_PALLET, maxTotalHeight: 600 });
    expect(results.some(result => result.family === "maxrects")).toBe(true);
    expect(results.some(result => result.family === "strip" || result.family === "guillotine")).toBe(true);
    for (const result of results) for (let i = 0; i < result.placements.length; i++) {
      for (let j = i + 1; j < result.placements.length; j++) expect(overlaps(result.placements[i], result.placements[j])).toBe(false);
      if (result.placements[i].layerIndex > 0) expect(supported(result.placements[i], result.placements)).toBe(true);
    }
  });
});