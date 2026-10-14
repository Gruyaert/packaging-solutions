import { EPS, assertInput, rotated, type Box, type Orientation, type Placement, type Product, type SearchOptions, type SearchResult, type Spacing, type Strategy, volume } from "./types";
import { inBounds, indexLayers, levelKey, overlaps, respectsMaxima, supported } from "./geometry";
import { makeSolution } from "./scoring";

export function rotationVariants(products: Product[]): Orientation[][] {
  const result: Orientation[][] = [];
  const add = (v: Orientation[]) => { if (!result.some(r => JSON.stringify(r) === JSON.stringify(v))) result.push(v); };
  for (let offset = 0; offset < 6; offset++) add(products.map(p => p.rotations[offset % p.rotations.length]));
  function visit(index: number, chosen: Orientation[]) {
    if (result.length >= 24) return;
    if (index === products.length) { add(chosen); return; }
    for (const r of products[index].rotations) visit(index + 1, [...chosen, r]);
  }
  visit(0, []);
  return result;
}

export function packAttempt(products: Product[], box: Box, spacing: Spacing, orientations: Orientation[], fill: boolean, options: SearchOptions = {}) {
  const placements: Placement[] = [];
  const counts = Object.fromEntries(products.map(p => [p.productId, 0]));
  const points = [{ x: spacing.length / 2, y: spacing.width / 2, z: 0 }];
  const limit = Math.max(1, Math.min(fill ? 1000 : 300, options.maxPlacements ?? (fill ? 1000 : 200)));
  let checks = 0, truncated = false, weightKg = 0;
  const levels = new Set<number>();
  const seenPoints = new Set(points.map(p => `${p.x}|${p.y}|${p.z}`));
  function insert(product: Product, orientation: Orientation) {
    options.signal?.throwIfAborted();
    if (placements.length >= limit || checks >= 250000) { truncated = true; return false; }
    if (options.maxWeightKg !== undefined && weightKg + product.weightKg > options.maxWeightKg + EPS) return false;
    points.sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x);
    for (const point of points) {
      const candidates: Placement[] = [];
      for (const candidateOrientation of fill ? [orientation, ...product.rotations.filter(rotation => rotation !== orientation)] : [orientation]) {
        const candidate: Placement = { ...point, ...rotated(product, candidateOrientation), productId: product.productId, placementId: `p-${placements.length + 1}`, orientation: candidateOrientation, layerIndex: 0 };
        checks += placements.length + 1;
        if (checks > 250000) { truncated = true; return false; }
        if (options.maxTotalLayers !== undefined && !levels.has(levelKey(candidate.z)) && levels.size >= options.maxTotalLayers) continue;
        if (!inBounds(candidate, box, spacing) || !respectsMaxima(candidate, placements, product) || placements.some(p => overlaps(candidate, p)) || !supported(candidate, placements)) continue;
        candidates.push(candidate);
      }
      const candidate = fill
        ? candidates.sort((a, b) => b.height - a.height || b.width - a.width || b.length - a.length)[0]
        : candidates[0];
      if (!candidate) continue;
      placements.push(candidate); counts[product.productId]++; weightKg += product.weightKg; levels.add(levelKey(candidate.z));
      for (const next of [{ x: candidate.x + candidate.length, y: candidate.y, z: candidate.z }, { x: candidate.x, y: candidate.y + candidate.width, z: candidate.z }, { x: candidate.x, y: candidate.y, z: candidate.z + candidate.height }]) {
        const key = `${next.x}|${next.y}|${next.z}`;
        if (!seenPoints.has(key)) { points.push(next); seenPoints.add(key); }
      }
      return true;
    }
    return false;
  }
  if (fill) {
    // Max-fill deliberately ignores the requested quantity. Cycle through product
    // types and try every allowed orientation when the preferred one is blocked.
    let progress = true;
    while (progress && !truncated) {
      progress = false;
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const rotations = [orientations[i], ...product.rotations.filter(rotation => rotation !== orientations[i])];
        const start = counts[product.productId] % rotations.length;
        for (let offset = 0; offset < rotations.length; offset++) {
          if (insert(product, rotations[(start + offset) % rotations.length])) { progress = true; break; }
        }
      }
    }
  } else {
    // Desired-count mode reserves and completes each product independently.
    for (let i = 0; i < products.length; i++) insert(products[i], orientations[i]);
    for (let i = 0; i < products.length; i++) while (counts[products[i].productId] < products[i].quantity && insert(products[i], orientations[i])) { /* placements appended by insert */ }
  }
  return { placements: indexLayers(placements), truncated };
}

export function searchPackaging(products: Product[], boxes: Box[], spacing: Spacing, strategy: Strategy, options: SearchOptions = {}): SearchResult {
  assertInput(products, spacing, boxes);
  if (!boxes.length) throw new Error("Voer minstens één doos met interne maten in.");
  if (options.maxWeightKg !== undefined && (!Number.isFinite(options.maxWeightKg) || options.maxWeightKg < 0)) throw new Error("Ongeldig maximumgewicht.");
  if (options.maxTotalLayers !== undefined && (!Number.isSafeInteger(options.maxTotalLayers) || options.maxTotalLayers < 1)) throw new Error("Maximaal totaal aantal lagen moet positief en geheel zijn.");
  const maxAttempts = Math.max(boxes.length, Math.min(96, options.maxAttempts ?? 48));
  const solutions: SearchResult["solutions"] = [];
  const signatures = new Set<string>();
  let attempts = 0, truncated = false;
  const orders = [products, [...products].sort((a, b) => volume(b) - volume(a)), [...products].reverse()];
  const variants = orders.flatMap(order => rotationVariants(order).map(rotations => ({ order, rotations, fill: strategy === "fill" })));
  const plan = [...boxes.map(box => ({ ...variants[0], box })), ...variants.slice(1).flatMap(variant => boxes.map(box => ({ ...variant, box })))]
  outer: for (const { order, rotations, fill, box } of plan) {
    options.signal?.throwIfAborted();
    if (attempts >= maxAttempts) { truncated = true; break outer; }
    const packed = packAttempt(order, box, spacing, rotations, fill, options);
    attempts++; truncated ||= packed.truncated;
    const solution = makeSolution(`solution-${attempts}`, products, box, spacing, packed.placements, fill ? "extreme-points · vullen" : "extreme-points · gevraagd");
    if (solution.validation.status !== "valid") continue;
    const signature = JSON.stringify([box, packed.placements.map(p => [p.productId, p.x, p.y, p.z, p.orientation])]);
    if (!signatures.has(signature)) { solutions.push(solution); signatures.add(signature); }
  }
  return { solutions, attempts, truncated, warnings: ["Heuristische zoekdekking; geen bewijs van globaal optimum.", ...(truncated ? ["Zoeklimiet bereikt; resultaten zijn niet volledig."] : [])] };
}
