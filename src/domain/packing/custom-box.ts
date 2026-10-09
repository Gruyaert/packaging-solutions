import { assertInput, outside, rotated, volume, type Box, type Dimensions, type Placement, type Product, type SearchOptions, type SearchResult, type Spacing } from "./types";
import { indexLayers } from "./geometry";
import { packAttempt, rotationVariants } from "./engine";
import { makeSolution } from "./scoring";

export interface CustomSettings { cardboard: number; palletLength: number; palletWidth: number; oversizePercent: number; maxBoxDimension: number }
export const DEFAULT_CUSTOM: CustomSettings = { cardboard: 3, palletLength: 1200, palletWidth: 800, oversizePercent: 5, maxBoxDimension: 2000 };
export function realityErrors(box: Box, settings: CustomSettings) {
  const d = outside(box), errors: string[] = [];
  if (Math.max(d.length, d.width, d.height) > settings.maxBoxDimension) errors.push("Buitenmaat overschrijdt maximale doosdimensie.");
  const l = settings.palletLength * (1 + settings.oversizePercent / 100), w = settings.palletWidth * (1 + settings.oversizePercent / 100);
  if (!((d.length <= l && d.width <= w) || (d.width <= l && d.length <= w))) errors.push("Footprint past niet op pallet met toegelaten overmaat, ook niet gedraaid.");
  return errors;
}
export interface CustomResult extends SearchResult { rejected: { pattern: string; errors: string[] }[]; mode: "linear" | "multi" }
export function customBoxes(products: Product[], spacing: Spacing, settings: CustomSettings = DEFAULT_CUSTOM, options: SearchOptions = {}): CustomResult {
  assertInput(products, spacing);
  if (![settings.cardboard, settings.oversizePercent].every(n => Number.isFinite(n) && n >= 0) || ![settings.palletLength, settings.palletWidth, settings.maxBoxDimension].every(n => Number.isFinite(n) && n > 0)) throw new Error("Ongeldige maatwerk-/palletinstellingen.");
  if (products.reduce((sum, p) => sum + p.quantity, 0) > Math.min(300, options.maxPlacements ?? 200)) throw new Error("Maatwerk vereist alle producten; verhoog binnen de limiet tot 300 of verlaag het aantal.");
  const solutions: CustomResult["solutions"] = [], rejected: CustomResult["rejected"] = [];
  let attempts = 0, truncated = false;
  if (products.length === 1) {
    const product = products[0];
    const candidates = product.rotations.flatMap(orientation => {
      const dims = rotated(product, orientation);
      return (["length", "width", "height"] as const).map(axis => ({ orientation, dims, axis, repeatDimension: dims[axis] }));
    }).sort((a, b) => a.repeatDimension - b.repeatDimension);
    for (const c of candidates) {
      options.signal?.throwIfAborted(); attempts++;
      const dimensions: Dimensions = { ...c.dims, [c.axis]: c.dims[c.axis] * product.quantity };
      const pattern = `${c.orientation} · ${c.axis === "length" ? `${product.quantity}×1×1` : c.axis === "width" ? `1×${product.quantity}×1` : `1×1×${product.quantity}`}`;
      const box: Box = { boxId: `custom-${attempts}`, reference: pattern, length: dimensions.length + spacing.length, width: dimensions.width + spacing.width, height: dimensions.height + spacing.height, cardboard: settings.cardboard };
      const placements: Placement[] = indexLayers(Array.from({ length: product.quantity }, (_, i) => ({ placementId: `p-${i + 1}`, productId: product.productId, x: spacing.length / 2 + (c.axis === "length" ? i * c.dims.length : 0), y: spacing.width / 2 + (c.axis === "width" ? i * c.dims.width : 0), z: c.axis === "height" ? i * c.dims.height : 0, ...c.dims, orientation: c.orientation, layerIndex: 0 })));
      const solution = makeSolution(`linear-${attempts}`, products, box, spacing, placements, pattern, true);
      const errors = [...realityErrors(box, settings), ...solution.validation.errors];
      if (errors.length) rejected.push({ pattern, errors }); else solutions.push(solution);
    }
  } else {
    const totalVolume = products.reduce((sum, p) => sum + volume(p) * p.quantity, 0), root = Math.cbrt(totalVolume);
    const extents = products.map(p => Math.max(p.length, p.width, p.height));
    const maxEdge = Math.max(...extents);
    const containers: Dimensions[] = [];
    for (const scale of [1.2, 1.6, 2.2, 3]) for (const ratio of [[1, 1, 1], [2, 1, 0.5], [1, 2, 0.5], [1, 1, 2]]) containers.push({ length: Math.max(maxEdge, root * scale * ratio[0]) + spacing.length, width: Math.max(maxEdge, root * scale * ratio[1]) + spacing.width, height: Math.max(maxEdge, root * scale * ratio[2]) + spacing.height });
    const seen = new Set<string>();
    const maxAttempts = Math.min(96, options.maxAttempts ?? 48);
    outer: for (const rotations of rotationVariants(products)) for (const dims of containers) for (const reverse of [false, true]) {
      options.signal?.throwIfAborted();
      if (attempts >= maxAttempts) { truncated = true; break outer; }
      const order = reverse ? [...products].reverse() : products;
      const directions = reverse ? [...rotations].reverse() : rotations;
      const trialBox: Box = { ...dims, cardboard: settings.cardboard, boxId: `trial-${attempts}`, reference: "Kandidaatruimte" };
      const packed = packAttempt(order, trialBox, spacing, directions, false, options);
      attempts++; truncated ||= packed.truncated;
      if (!packed.placements.length) continue;
      const box: Box = { boxId: `custom-${attempts}`, reference: "Multi-product maatwerk", cardboard: settings.cardboard, length: Math.max(...packed.placements.map(p => p.x + p.length)) + spacing.length / 2, width: Math.max(...packed.placements.map(p => p.y + p.width)) + spacing.width / 2, height: Math.max(...packed.placements.map(p => p.z + p.height)) + spacing.height };
      const solution = makeSolution(`multi-${attempts}`, products, box, spacing, packed.placements, "multi-product extreme-points", true);
      if (solution.validation.status !== "valid") continue;
      const errors = realityErrors(box, settings);
      if (errors.length) { rejected.push({ pattern: solution.metadata.pattern, errors }); continue; }
      const key = JSON.stringify([box.length, box.width, box.height, packed.placements.map(p => [p.productId, p.x, p.y, p.z, p.orientation])]);
      if (!seen.has(key)) { solutions.push(solution); seen.add(key); }
    }
  }
  return { mode: products.length === 1 ? "linear" : "multi", solutions, rejected, attempts, truncated, warnings: [products.length === 1 ? "Lineaire varianten; afgekeurde kandidaten staan apart." : "Multi-product zoekdekking is heuristisch; alle getoonde oplossingen bevatten exact de gevraagde producten.", ...(truncated ? ["Zoeklimiet bereikt."] : [])] };
}
