import { assertInput, outside, rotated, volume, type Box, type Dimensions, type Placement, type Product, type SearchOptions, type SearchProfile, type SearchResult, type Spacing } from "./types";
import { indexLayers } from "./geometry";
import { searchPackaging } from "./engine";
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

function candidateContainers(products: Product[], spacing: Spacing) {
  const totalVolume = products.reduce((sum, product) => sum + volume(product) * product.quantity, 0);
  const root = Math.cbrt(totalVolume);
  const maxEdge = Math.max(...products.flatMap(product => [product.length, product.width, product.height]));
  const dimensions: Dimensions[] = [];
  const ratios = [[1, 1, 1], [2, 1, 0.5], [1, 2, 0.5], [1, 1, 2], [3, 1, 1], [1, 3, 1]];
  for (const scale of [1.05, 1.2, 1.5, 1.9, 2.5, 3.2]) for (const ratio of ratios) dimensions.push({ length: Math.max(maxEdge, root * scale * ratio[0]) + spacing.length, width: Math.max(maxEdge, root * scale * ratio[1]) + spacing.width, height: Math.max(maxEdge, root * scale * ratio[2]) + spacing.height });
  for (const product of products) for (const orientation of product.rotations) {
    const dims = rotated(product, orientation);
    dimensions.push({ length: dims.length * product.quantity + spacing.length, width: dims.width + spacing.width, height: dims.height + spacing.height });
    dimensions.push({ length: dims.length + spacing.length, width: dims.width * product.quantity + spacing.width, height: dims.height + spacing.height });
    dimensions.push({ length: dims.length + spacing.length, width: dims.width + spacing.width, height: dims.height * product.quantity + spacing.height });
  }
  const seen = new Set<string>();
  return dimensions.filter(dimension => {
    const key = [dimension.length, dimension.width, dimension.height].map(value => value.toFixed(4)).join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function customBoxes(products: Product[], spacing: Spacing, settings: CustomSettings = DEFAULT_CUSTOM, options: SearchOptions = {}): CustomResult {
  assertInput(products, spacing);
  if (![settings.cardboard, settings.oversizePercent].every(n => Number.isFinite(n) && n >= 0) || ![settings.palletLength, settings.palletWidth, settings.maxBoxDimension].every(n => Number.isFinite(n) && n > 0)) throw new Error("Ongeldige maatwerk-/palletinstellingen.");
  if (products.reduce((sum, product) => sum + product.quantity, 0) > Math.min(300, options.maxPlacements ?? 200)) throw new Error("Maatwerk vereist alle producten; verhoog binnen de limiet tot 300 of verlaag het aantal.");
  const profile: SearchProfile = options.profile ?? "maximum-fill";
  const solutions: CustomResult["solutions"] = [], rejected: CustomResult["rejected"] = [];
  let attempts = 0, truncated = false;
  if (products.length === 1) {
    const product = products[0];
    const candidates = product.rotations.flatMap(orientation => {
      const dims = rotated(product, orientation);
      return (["length", "width", "height"] as const).map(axis => ({ orientation, dims, axis, repeatDimension: dims[axis] }));
    }).sort((a, b) => a.repeatDimension - b.repeatDimension);
    for (const candidate of candidates) {
      options.signal?.throwIfAborted(); attempts++;
      const dimensions: Dimensions = { ...candidate.dims, [candidate.axis]: candidate.dims[candidate.axis] * product.quantity };
      const pattern = `${candidate.orientation} · ${candidate.axis === "length" ? `${product.quantity}×1×1` : candidate.axis === "width" ? `1×${product.quantity}×1` : `1×1×${product.quantity}`}`;
      const box: Box = { boxId: `custom-${attempts}`, reference: pattern, length: dimensions.length + spacing.length, width: dimensions.width + spacing.width, height: dimensions.height + spacing.height, cardboard: settings.cardboard };
      const placements: Placement[] = indexLayers(Array.from({ length: product.quantity }, (_, index) => ({ placementId: `p-${index + 1}`, productId: product.productId, x: spacing.length / 2 + (candidate.axis === "length" ? index * candidate.dims.length : 0), y: spacing.width / 2 + (candidate.axis === "width" ? index * candidate.dims.width : 0), z: candidate.axis === "height" ? index * candidate.dims.height : 0, ...candidate.dims, orientation: candidate.orientation, layerIndex: 0 })));
      const solution = makeSolution(`linear-${attempts}`, products, box, spacing, placements, pattern, true, profile);
      const errors = [...realityErrors(box, settings), ...solution.validation.errors];
      if (errors.length) rejected.push({ pattern, errors }); else solutions.push(solution);
    }
  } else {
    const maxAttempts = Math.min(96, options.maxAttempts ?? 48);
    const containers = candidateContainers(products, spacing);
    const seen = new Set<string>();
    for (const dimensions of containers) {
      options.signal?.throwIfAborted();
      if (attempts >= maxAttempts) { truncated = true; break; }
      attempts++;
      const trialBox: Box = { ...dimensions, cardboard: settings.cardboard, boxId: `trial-${attempts}`, reference: "Kandidaatruimte" };
      const packed = searchPackaging(products, [trialBox], spacing, "desired", { ...options, profile, maxAttempts: 24, maxPlacements: options.maxPlacements ?? 300 });
      truncated ||= packed.truncated;
      const exact = packed.solutions.filter(solution => products.every(product => solution.counts[product.productId] === product.quantity));
      if (!exact.length) {
        rejected.push({ pattern: `Kandidaat ${attempts}`, errors: ["Geen geldige kandidaat met alle gevraagde producten in deze ruimte."] });
        continue;
      }
      for (const candidate of exact.slice(0, 6)) {
        const length = Math.max(...candidate.placements.map(placement => placement.x + placement.length)) + spacing.length / 2;
        const width = Math.max(...candidate.placements.map(placement => placement.y + placement.width)) + spacing.width / 2;
        const height = Math.max(...candidate.placements.map(placement => placement.z + placement.height)) + spacing.height;
        const box: Box = { boxId: `custom-${attempts}-${solutions.length + 1}`, reference: "Multi-product maatwerk · layer-beam", length, width, height, cardboard: settings.cardboard };
        const solution = makeSolution(`multi-${attempts}-${solutions.length + 1}`, products, box, spacing, candidate.placements, "multi-product layer-beam", true, profile);
        const errors = realityErrors(box, settings);
        if (errors.length) { rejected.push({ pattern: solution.metadata.pattern, errors }); continue; }
        const key = JSON.stringify([box.length, box.width, box.height, candidate.placements.map(placement => [placement.productId, placement.x, placement.y, placement.z, placement.orientation])]);
        if (!seen.has(key) && solution.validation.status === "valid") { seen.add(key); solutions.push(solution); }
      }
    }
  }
  const diagnostics = {
    beamWidth: options.beamWidth ?? 24,
    layerCandidateLimit: options.layerCandidateLimit ?? 24,
    statesExplored: solutions.length + rejected.length,
    statesRetained: solutions.length,
    layerHeights: [...new Set(solutions.flatMap(solution => solution.placements.map(placement => placement.height)))].sort((a, b) => a - b),
    strategies: ["area", "short", "long", "bottom"],
    orderings: ["input", "area", "longest", "shortest", "reverse"],
    validCandidates: solutions.length,
    rejectedCandidates: rejected.length,
    rejectionReasons: rejected.reduce<Record<string, number>>((result, item) => { for (const error of item.errors) result[error] = (result[error] ?? 0) + 1; return result; }, {}),
    profile,
  };
  return { mode: products.length === 1 ? "linear" : "multi", solutions, rejected: rejected.slice(0, 40), attempts, truncated, diagnostics, warnings: [products.length === 1 ? "Lineaire maatwerkvarianten met geometrische validatie; afgekeurde kandidaten staan apart." : "Multi-product maatwerk gebruikt laag-voor-laag beam search; alle getoonde oplossingen bevatten exact de gevraagde producten.", ...(truncated ? ["Zoeklimiet bereikt."] : [])] };
}