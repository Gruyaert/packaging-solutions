export const ORIENTATIONS = ["L-B-H", "L-H-B", "B-L-H", "B-H-L", "H-L-B", "H-B-L"] as const;
export type Orientation = typeof ORIENTATIONS[number];
export interface Dimensions { length: number; width: number; height: number }
export interface Product extends Dimensions {
  productId: string; reference: string; weightKg: number; quantity: number;
  rotations: Orientation[]; maxInLength: number; maxInWidth: number; maxLayers: number;
  compressibilityX?: number; compressibilityY?: number; compressibilityZ?: number; allowCompression?: boolean;
}
export interface Spacing { length: number; width: number; height: number }
export interface Placement extends Dimensions {
  placementId: string; productId: string; x: number; y: number; z: number;
  orientation: Orientation; layerIndex: number;
}
export interface Box extends Dimensions { boxId: string; reference: string; cardboard: number }
export interface ValidationJSON {
  status: "valid" | "invalid"; warnings: string[]; errors: string[]; counts: Record<string, number>;
  overlapAnalysis: { valid: boolean; pairs: string[][] };
  gravityCheck: { valid: boolean; unsupported: string[] };
  boundsCheck: { valid: boolean; outside: string[] };
}
export type SearchProfile = "maximum-fill" | "simple-practical";
export interface PatternMetrics {
  layerCount: number;
  usedOrientations: number;
  orientationComplexity: number;
  repeatedLayerRatio: number;
  gridRegularity: number;
  verticalFill: number;
  compactness: number;
  simple: boolean;
}
export interface Solution {
  solutionId: string; box: Box; spacing: Spacing; placements: Placement[];
  validation: ValidationJSON; counts: Record<string, number>; utilization: number;
  air: number; transportEfficiency: number; weightKg: number; practicalScore: number;
  metadata: { restPlacementIds: string[]; handlingScore: number; pattern: string; patternMetrics?: PatternMetrics; strategy?: string };
}
export type Strategy = "desired" | "fill";
export type Sorting = "fill" | "practical";
export interface SearchDiagnostics {
  beamWidth: number;
  layerCandidateLimit: number;
  statesExplored: number;
  statesRetained: number;
  layerHeights: number[];
  strategies: string[];
  orderings: string[];
  validCandidates: number;
  rejectedCandidates: number;
  duplicateCandidates: number;
  rejectionReasons: Record<string, number>;
  profile: SearchProfile;
}
export interface SearchOptions {
  signal?: AbortSignal;
  maxAttempts?: number;
  maxPlacements?: number;
  maxWeightKg?: number;
  maxTotalLayers?: number;
  profile?: SearchProfile;
  beamWidth?: number;
  layerCandidateLimit?: number;
}
export interface SearchResult {
  solutions: Solution[];
  attempts: number;
  truncated: boolean;
  warnings: string[];
  diagnostics?: SearchDiagnostics;
  rejected?: { pattern: string; errors: string[] }[];
}
export const EPS = 1e-6;
export const volume = (d: Dimensions) => d.length * d.width * d.height;
export const outside = (box: Box): Dimensions => ({ length: box.length + 2 * box.cardboard, width: box.width + 2 * box.cardboard, height: box.height + 2 * box.cardboard });
export function rotated(product: Dimensions, orientation: Orientation): Dimensions {
  const axes = { L: product.length, B: product.width, H: product.height };
  const [a, b, c] = orientation.split("-") as (keyof typeof axes)[];
  return { length: axes[a], width: axes[b], height: axes[c] };
}
export function weightInKg(value: number, unit: "g" | "kg") {
  if (!Number.isFinite(value) || value < 0 || Math.abs(value * 1000 - Math.round(value * 1000)) > EPS) throw new Error("Gewicht moet niet-negatief zijn, met maximaal 3 decimalen.");
  return unit === "g" ? value / 1000 : value;
}
export function assertInput(products: Product[], spacing: Spacing, boxes: Box[] = []) {
  if (products.length < 1 || products.length > 5) throw new Error("Voer 1 tot 5 producten in; product 1 is verplicht.");
  if (new Set(products.map(p => p.productId)).size !== products.length) throw new Error("Product-ID's moeten uniek zijn.");
  for (const p of products) {
    if (!p.productId.trim() || !p.reference.trim()) throw new Error("Product-ID en referentie zijn verplicht.");
    if (![p.length, p.width, p.height].every(n => Number.isFinite(n) && n > 0) || !Number.isFinite(volume(p)) || volume(p) <= 0) throw new Error("Productmaten/volume moeten positief en numeriek berekenbaar zijn (mm).");
    if (![p.quantity, p.maxInLength, p.maxInWidth, p.maxLayers].every(n => Number.isSafeInteger(n) && n > 0)) throw new Error("Aantallen en maxima moeten positieve gehele getallen zijn.");
    if (!Number.isFinite(p.weightKg) || p.weightKg < 0) throw new Error("Ongeldig gewicht.");
    if (!p.rotations.length || p.rotations.some(r => !ORIENTATIONS.includes(r))) throw new Error("Selecteer minstens één geldige rotatie.");
  }
  if (!Object.values(spacing).every(n => Number.isFinite(n) && n >= 0)) throw new Error("Speling moet niet-negatief zijn.");
  for (const b of boxes) if (!b.boxId || ![b.length, b.width, b.height].every(n => Number.isFinite(n) && n > 0) || !Number.isFinite(b.cardboard) || b.cardboard < 0 || !Number.isFinite(volume(b)) || !Number.isFinite(volume(outside(b))) || volume(b) <= 0) throw new Error("Doos vereist berekenbare positieve interne/buitenmaten en niet-negatieve kartondikte.");
}

export function uniqueOrientations(product: Product): Orientation[] {
  return [...new Set(product.rotations)];
}