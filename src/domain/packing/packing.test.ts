import { describe, expect, it } from "vitest";
import { customBoxes, DEFAULT_CUSTOM, realityErrors } from "./custom-box";
import { searchPackaging } from "./engine";
import { overlaps, supported } from "./geometry";
import { DEFAULT_PALLET, effectivePallet, palletize } from "./pallet";
import { detectRestPlacements, exactFilter, makeSolution, sortSolutions } from "./scoring";
import { assertInput, ORIENTATIONS, outside, weightInKg, type Box, type Placement, type Product } from "./types";
import { validatePlacements } from "./validation";
const spacing = { length: 0, width: 0, height: 0 };
const product = (patch: Partial<Product> = {}): Product => ({ productId: "A", reference: "A", length: 100, width: 80, height: 20, quantity: 2, weightKg: 0.1, rotations: ["L-B-H"], maxInLength: 100, maxInWidth: 100, maxLayers: 100, ...patch });
const box = (patch: Partial<Box> = {}): Box => ({ boxId: "test-box", reference: "Golden fixture", length: 200, width: 80, height: 50, cardboard: 0, ...patch });
const placement = (patch: Partial<Placement> = {}): Placement => ({ placementId: "p1", productId: "A", x: 0, y: 0, z: 0, length: 100, width: 80, height: 20, orientation: "L-B-H", layerIndex: 0, ...patch });

describe("B4 golden contracttests", () => {
  it("G01: 100×80×20, twee stuks: z=0 en exact 30 mm bovenruimte", () => {
    const result = searchPackaging([product()], [box()], { ...spacing, height: 30 }, "desired");
    const solution = exactFilter(result.solutions, [product()])[0];
    expect(solution).toBeDefined();
    expect(solution.placements.map(p => [p.x, p.y, p.z])).toEqual([[0, 0, 0], [100, 0, 0]]);
    expect(solution.box.height - Math.max(...solution.placements.map(p => p.z + p.height))).toBe(30);
    expect(solution.validation.status).toBe("valid");
  });
  it("G02: A=50/B=20; afwijkende aantallen blijven in zoekset, exactfilter apart", () => {
    const a = product({ length: 10, width: 10, height: 10, quantity: 50, maxLayers: 1 });
    const b = product({ productId: "B", reference: "B", length: 10, width: 10, height: 10, quantity: 20, maxLayers: 1 });
    const result = searchPackaging([a, b], [box({ length: 100, width: 100, height: 10 })], spacing, "desired");
    const before = JSON.stringify(result.solutions);
    expect(result.solutions.some(s => s.counts.A !== 50 || s.counts.B !== 20)).toBe(true);
    const exact = exactFilter(result.solutions, [a, b]);
    expect(exact.length).toBeGreaterThan(0);
    expect(exact.every(s => s.counts.A === 50 && s.counts.B === 20)).toBe(true);
    expect(JSON.stringify(result.solutions)).toBe(before);
  });
  it("G03: alle 3 lineaire patronen per rotatie, kortste herhaling eerst", () => {
    const p = product({ quantity: 3, rotations: ["L-B-H", "B-L-H"] });
    const result = customBoxes([p], { length: 10, width: 20, height: 30 });
    expect(result.solutions).toHaveLength(6);
    expect(result.solutions[0].metadata.pattern).toContain("1×1×3");
    for (const r of p.rotations) for (const pattern of ["3×1×1", "1×3×1", "1×1×3"]) expect(result.solutions.some(s => s.metadata.pattern === `${r} · ${pattern}`)).toBe(true);
    expect(result.solutions.every(s => s.validation.status === "valid")).toBe(true);
    expect(result.solutions.every(s => Math.min(...s.placements.map(p => p.z)) === 0)).toBe(true);
  });
  it("G04: multi-product maatwerk met echte exacte placements en packingcontrole", () => {
    const products = [product(), product({ productId: "B", reference: "B", length: 60, width: 50, height: 30, quantity: 1 })];
    const result = customBoxes(products, spacing, DEFAULT_CUSTOM, { maxAttempts: 64 });
    expect(result.mode).toBe("multi");
    expect(result.solutions.length).toBeGreaterThan(0);
    for (const s of result.solutions) {
      expect(s.placements).toHaveLength(3);
      expect(s.counts).toEqual({ A: 2, B: 1 });
      expect(validatePlacements(products, s.box, spacing, s.placements, true).status).toBe("valid");
    }
  });
  it("G05: veel te ruime doos wint niet enkel door nette handling", () => {
    const p = product({ quantity: 1 });
    const placements = [placement()];
    const tight = makeSolution("tight", [p], box({ length: 110, width: 90, height: 25 }), spacing, placements, "minder nette handling");
    const huge = makeSolution("huge", [p], box({ length: 1000, width: 800, height: 500 }), spacing, placements, "net raster");
    tight.practicalScore = 0; // Zelfs perfecte handling mag de extreme volumekloof niet compenseren.
    huge.practicalScore = 100;
    expect(sortSolutions([huge, tight], "practical")[0].solutionId).toBe("tight");
  });
  it("G06: los restproduct markeren, compacte aangesloten rest niet", () => {
    const row = [placement({ length: 10, width: 10, height: 10 }), placement({ placementId: "p2", x: 10, length: 10, width: 10, height: 10 })];
    const loose = placement({ placementId: "rest", x: 80, y: 40, length: 10, width: 10, height: 10 });
    expect(detectRestPlacements([...row, loose])).toEqual(["rest"]);
    expect(detectRestPlacements([...row, { ...loose, y: 0 }])).toEqual(["rest"]);
    expect(detectRestPlacements([...row, { ...loose, x: 0, y: 10 }])).toEqual([]);
    const p = product({ length: 10, width: 10, height: 10, quantity: 3 });
    const s = makeSolution("rest-test", [p], box({ length: 100, width: 60, height: 10 }), spacing, [...row, loose], "rest");
    expect(s.metadata.restPlacementIds).toEqual(["rest"]);
    expect(s.metadata.handlingScore).toBeLessThan(1);
    expect(s.placements[2].length).toBe(10);
  });
  it("G07: 5 mm per zijde = +10 mm effectief, doos gebruikt buitenmaten", () => {
    const settings = { ...DEFAULT_PALLET, palletLength: 1200, palletWidth: 800, overhangLengthPerSide: 5, overhangWidthPerSide: 5, maxTotalHeight: 500 };
    expect(effectivePallet(settings)).toEqual({ length: 1210, width: 810 });
    const carton = box({ length: 599, width: 399, height: 98, cardboard: 1 });
    expect(outside(carton)).toEqual({ length: 601, width: 401, height: 100 });
    const result = palletize({ kind: "database", box: carton }, settings);
    expect(result[0].boxesPerLayer).toBe(4);
    expect(result[0].layers).toBe(3);
    expect(result[0].totalBoxes).toBe(12);
    expect(result[0].height).toBe(444);
    expect(result[0].overhang).toEqual({ lengthPerSide: 5, widthPerSide: 5 });
    for (const r of result) for (const p of r.placements) {
      expect(p.x).toBeGreaterThanOrEqual(-5);
      expect(p.y).toBeGreaterThanOrEqual(-5);
      expect(p.x + p.length).toBeLessThanOrEqual(1205 + 1e-6);
      expect(p.y + p.width).toBeLessThanOrEqual(805 + 1e-6);
    }
  });
});

describe("Fysieke regressies en veiligheidsgrenzen", () => {
  it("Symmetrische horizontale speling en topclearance zonder mutatie", () => {
    const result = customBoxes([product()], { length: 10, width: 20, height: 30 });
    expect(result.solutions.every(s => Math.min(...s.placements.map(p => p.x)) === 5 && Math.min(...s.placements.map(p => p.y)) === 10)).toBe(true);
    expect(result.solutions.every(s => s.box.height - Math.max(...s.placements.map(p => p.z + p.height)) === 30)).toBe(true);
  });
  it("Zweven en overlap worden afgekeurd", () => {
    expect(validatePlacements([product()], box(), spacing, [placement({ z: 5 })]).gravityCheck.valid).toBe(false);
    const invalid = validatePlacements([product()], box(), spacing, [placement(), placement({ placementId: "p2" })]);
    expect(invalid.overlapAnalysis.pairs).toEqual([["p1", "p2"]]);
    expect(invalid.status).toBe("invalid");
  });
  it("Volledige support kan uit twee coplanaire producten bestaan", () => {
    const bottom = [placement({ length: 50 }), placement({ placementId: "p2", x: 50, length: 50 })];
    expect(supported(placement({ placementId: "upper", z: 20 }), bottom)).toBe(true);
    expect(supported(placement({ placementId: "upper", x: 1, z: 20 }), bottom)).toBe(false);
  });
  it("Rotatie, nominale maten, IDs, maxima en laagindex worden gecontroleerd", () => {
    const p = product({ quantity: 1, maxInLength: 1 });
    expect(validatePlacements([p], box(), spacing, [placement({ orientation: "B-L-H" })]).status).toBe("invalid");
    expect(validatePlacements([p], box(), spacing, [placement({ length: 99 })]).status).toBe("invalid");
    expect(validatePlacements([p], box(), spacing, [placement({ productId: "unknown" })]).status).toBe("invalid");
    expect(validatePlacements([p], box(), spacing, [placement({ layerIndex: 1 })]).status).toBe("invalid");
    expect(validatePlacements([p], box(), spacing, [placement(), placement({ placementId: "p2", x: 100 })]).status).toBe("invalid");
  });
  it("Alle zes rotaties bruikbaar, en weigering realiteitsfilter expliciet", () => {
    const result = customBoxes([product({ quantity: 2, rotations: [...ORIENTATIONS] })], spacing);
    expect(result.solutions.length + result.rejected.length).toBe(18);
    expect(realityErrors(box({ length: 2001 }), DEFAULT_CUSTOM).length).toBeGreaterThan(0);
    expect(customBoxes([product({ quantity: 3, maxLayers: 1 })], spacing).rejected.some(r => r.pattern.includes("1×1×3"))).toBe(true);
  });
  it("Gewicht g/kg met 3 decimalen; ongeldige invoer afgekeurd", () => {
    expect(weightInKg(125.125, "g")).toBeCloseTo(0.125125);
    expect(weightInKg(1.234, "kg")).toBe(1.234);
    expect(() => weightInKg(1.2345, "kg")).toThrow();
    expect(() => assertInput([], spacing)).toThrow();
    expect(() => assertInput(Array.from({ length: 6 }, (_, i) => product({ productId: String(i) })), spacing)).toThrow();
  });
  it("Engine muteert invoer niet; exactfilter en ranking evenmin", () => {
    const products = [product()], boxes = [box()];
    const before = JSON.stringify({ products, boxes });
    const result = searchPackaging(products, boxes, spacing, "desired");
    const original = JSON.stringify(result.solutions);
    sortSolutions(result.solutions, "practical"); exactFilter(result.solutions, products);
    expect(JSON.stringify(result.solutions)).toBe(original);
    expect(JSON.stringify({ products, boxes })).toBe(before);
  });
  it("Een afwijking tot nul stuks verdwijnt niet stil uit Alle oplossingen", () => {
    const products = [product(), product({ productId: "B", reference: "B", length: 500, width: 500, height: 500, quantity: 1 })];
    const result = searchPackaging(products, [box()], spacing, "desired");
    expect(result.solutions.some(s => s.counts.A > 0 && s.counts.B === 0)).toBe(true);
    expect(exactFilter(result.solutions, products)).toHaveLength(0);
    expect(result.solutions[0].validation.warnings.length).toBeGreaterThan(0);
  });
  it("Annulering en truncatie expliciet", () => {
    const abort = new AbortController(); abort.abort();
    expect(() => searchPackaging([product()], [box()], spacing, "desired", { signal: abort.signal })).toThrow();
    expect(searchPackaging([product()], [box()], spacing, "desired", { maxAttempts: 1 }).truncated).toBe(true);
  });
  it("Palletlagen overlappen niet en ondersteunen herhaalde/alternerende laag", () => {
    const results = palletize({ kind: "database", box: box({ length: 400, width: 200, height: 100 }) }, { ...DEFAULT_PALLET, maxTotalHeight: 500 });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) for (let i = 0; i < r.placements.length; i++) {
      const p = r.placements[i];
      for (let j = i + 1; j < r.placements.length; j++) expect(overlaps(p, r.placements[j])).toBe(false);
      if (p.layerIndex > 0) expect(supported(p, r.placements)).toBe(true);
    }
  });
});
