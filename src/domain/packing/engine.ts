import { EPS, assertInput, rotated, type Box, type Orientation, type Placement, type Product, type SearchOptions, type SearchProfile, type SearchResult, type Spacing, type Strategy, volume } from "./types";
import { generateLayerPatterns, type LayerPattern } from "./layer-patterns";
import { inBounds, indexLayers, levelKey, overlaps, respectsMaxima, supported } from "./geometry";
import { isSimplePattern, makeSolution, sortSolutions } from "./scoring";

export function rotationVariants(products: Product[]): Orientation[][] {
  const result: Orientation[][] = [];
  const seen = new Set<string>();
  const add = (value: Orientation[]) => { const key = value.join("|"); if (!seen.has(key)) { seen.add(key); result.push(value); } };
  for (let offset = 0; offset < 6; offset++) add(products.map(product => product.rotations[offset % product.rotations.length]));
  function visit(index: number, chosen: Orientation[]) {
    if (result.length >= 24) return;
    if (index === products.length) { add(chosen); return; }
    for (const rotation of products[index].rotations) visit(index + 1, [...chosen, rotation]);
  }
  visit(0, []);
  return result;
}

export function packAttempt(products: Product[], box: Box, spacing: Spacing, orientations: Orientation[], fill: boolean, options: SearchOptions = {}) {
  const placements: Placement[] = [];
  const counts = Object.fromEntries(products.map(product => [product.productId, 0]));
  const points = [{ x: spacing.length / 2, y: spacing.width / 2, z: 0 }];
  const limit = Math.max(1, Math.min(fill ? 1000 : 300, options.maxPlacements ?? (fill ? 1000 : 200)));
  let checks = 0, truncated = false, weightKg = 0;
  const levels = new Set<number>();
  const seenPoints = new Set(points.map(point => `${point.x}|${point.y}|${point.z}`));
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
        if (!inBounds(candidate, box, spacing) || !respectsMaxima(candidate, placements, product) || placements.some(placement => overlaps(candidate, placement)) || !supported(candidate, placements)) continue;
        candidates.push(candidate);
      }
      const candidate = fill ? candidates.sort((a, b) => b.height - a.height || b.width - a.width || b.length - a.length)[0] : candidates[0];
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
    let progress = true;
    while (progress && !truncated) {
      progress = false;
      for (let index = 0; index < products.length; index++) {
        const product = products[index];
        const rotations = [orientations[index], ...product.rotations.filter(rotation => rotation !== orientations[index])];
        const start = counts[product.productId] % rotations.length;
        for (let offset = 0; offset < rotations.length; offset++) if (insert(product, rotations[(start + offset) % rotations.length])) { progress = true; break; }
      }
    }
  } else {
    for (let index = 0; index < products.length; index++) insert(products[index], orientations[index]);
    for (let index = 0; index < products.length; index++) while (counts[products[index].productId] < products[index].quantity && insert(products[index], orientations[index])) { /* continue until requested count or geometry blocks */ }
  }
  return { placements: indexLayers(placements), truncated };
}

interface BeamState {
  placements: Placement[];
  counts: Record<string, number>;
  z: number;
  weightKg: number;
  layerHeights: number[];
  patterns: string[];
}
interface BeamRun {
  states: BeamState[];
  explored: number;
  retained: number;
  layerHeights: number[];
  truncated: boolean;
}

function targetCounts(products: Product[], box: Box, strategy: Strategy, options: SearchOptions) {
  return Object.fromEntries(products.map(product => {
    if (strategy === "desired") return [product.productId, product.quantity];
    const smallest = Math.min(...product.rotations.map(rotation => volume(rotated(product, rotation))));
    const estimate = Math.max(1, Math.ceil(volume(box) / smallest));
    return [product.productId, Math.min(options.maxPlacements ?? 300, estimate)];
  }));
}

function stateScore(state: BeamState, products: Product[], box: Box, targets: Record<string, number>, profile: SearchProfile) {
  const packed = state.placements.reduce((sum, placement) => sum + volume(placement), 0) / volume(box);
  const countProgress = products.reduce((sum, product) => sum + Math.min(1, state.counts[product.productId] / Math.max(1, targets[product.productId])), 0) / products.length;
  const heightProgress = state.z / box.height;
  const simpleBonus = state.patterns.length <= 1 ? 0.03 : 0;
  return profile === "simple-practical" ? 0.55 * countProgress + 0.25 * packed + 0.15 * heightProgress + simpleBonus : 0.68 * packed + 0.2 * countProgress + 0.12 * heightProgress;
}

function stateKey(state: BeamState) {
  return JSON.stringify([state.z, state.counts, state.placements.map(placement => [placement.productId, placement.x, placement.y, placement.z, placement.orientation])]);
}

function appendPattern(state: BeamState, pattern: LayerPattern, products: Product[], box: Box, spacing: Spacing, options: SearchOptions): BeamState | undefined {
  const nextCounts = { ...state.counts };
  let nextWeight = state.weightKg;
  for (const product of products) {
    const added = pattern.counts[product.productId] ?? 0;
    nextCounts[product.productId] += added;
    nextWeight += added * product.weightKg;
    if (nextCounts[product.productId] > (options.maxPlacements ?? 300)) return undefined;
    if (options.maxWeightKg !== undefined && nextWeight > options.maxWeightKg + EPS) return undefined;
  }
  if (state.z + pattern.height > box.height - spacing.height + EPS) return undefined;
  const added = pattern.placements.map((placement, index) => ({ ...placement, placementId: `p-${state.placements.length + index + 1}`, z: state.z }));
  const all = [...state.placements, ...added];
  for (const placement of added) {
    const product = products.find(item => item.productId === placement.productId);
    if (!product || !inBounds(placement, box, spacing) || !respectsMaxima(placement, all.filter(item => item.placementId !== placement.placementId), product) || all.some(item => item.placementId !== placement.placementId && overlaps(placement, item)) || (placement.z > EPS && !supported(placement, state.placements))) return undefined;
  }
  return { placements: indexLayers(all), counts: nextCounts, z: state.z + pattern.height, weightKg: nextWeight, layerHeights: [...state.layerHeights, pattern.height], patterns: [...state.patterns, `${pattern.strategy} · ${pattern.ordering}`] };
}

function beamSearch(
  products: Product[],
  box: Box,
  spacing: Spacing,
  strategy: Strategy,
  preferred: Orientation[],
  profile: SearchProfile,
  options: SearchOptions,
): BeamRun {
  const beamWidth = options.beamWidth ?? 24;
  const layerCandidateLimit = options.layerCandidateLimit ?? 24;
  const targets = targetCounts(products, box, strategy, options);
  let frontier: BeamState[] = [{ placements: [], counts: Object.fromEntries(products.map(product => [product.productId, 0])), z: 0, weightKg: 0, layerHeights: [], patterns: [] }];
  const finished: BeamState[] = [];
  let explored = 0, retained = 0, truncated = false;
  const heights = new Set<number>();
  const maxLayers = options.maxTotalLayers ?? 20;
  for (let depth = 0; depth < maxLayers && frontier.length; depth++) {
    const next: BeamState[] = [];
    for (const state of frontier) {
      options.signal?.throwIfAborted();
      const remaining = Object.fromEntries(products.map(product => [product.productId, Math.max(0, targets[product.productId] - state.counts[product.productId])]));
      const patterns = generateLayerPatterns(products, remaining, box, spacing, state.z, profile, preferred, layerCandidateLimit);
      explored += patterns.length;
      for (const pattern of patterns) {
        heights.add(pattern.height);
        const candidate = appendPattern(state, pattern, products, box, spacing, options);
        if (!candidate) continue;
        next.push(candidate);
        if (finished.length < 500) finished.push(candidate);
      }
    }
    if (!next.length) break;
    const unique = new Map<string, BeamState>();
    for (const state of next) {
      const key = stateKey(state);
      const current = unique.get(key);
      if (!current || stateScore(state, products, box, targets, profile) > stateScore(current, products, box, targets, profile)) unique.set(key, state);
    }
    const ordered = [...unique.values()].sort((a, b) => stateScore(b, products, box, targets, profile) - stateScore(a, products, box, targets, profile));
    if (ordered.length > beamWidth) truncated = true;
    frontier = ordered.slice(0, beamWidth);
    retained += frontier.length;
  }
  return { states: finished, explored, retained, layerHeights: [...heights].sort((a, b) => a - b), truncated };
}

function resultSignature(box: Box, placements: Placement[]) {
  return JSON.stringify([box.boxId, box.length, box.width, box.height, placements.map(placement => [placement.productId, placement.x, placement.y, placement.z, placement.orientation])]);
}

export function searchPackaging(products: Product[], boxes: Box[], spacing: Spacing, strategy: Strategy, options: SearchOptions = {}): SearchResult {
  assertInput(products, spacing, boxes);
  if (!boxes.length) throw new Error("Voer minstens één doos met interne maten in.");
  if (options.maxWeightKg !== undefined && (!Number.isFinite(options.maxWeightKg) || options.maxWeightKg < 0)) throw new Error("Ongeldig maximumgewicht.");
  if (options.maxTotalLayers !== undefined && (!Number.isSafeInteger(options.maxTotalLayers) || options.maxTotalLayers < 1)) throw new Error("Maximaal totaal aantal lagen moet positief en geheel zijn.");
  const profile = options.profile ?? "maximum-fill";
  const budget = Math.max(boxes.length, options.maxAttempts ?? 96);
  const solutions: SearchResult["solutions"] = [];
  const signatures = new Set<string>();
  const invalidSignatures = new Set<string>();
  const rejected: { pattern: string; errors: string[] }[] = [];
  const diagnostics = { beamWidth: options.beamWidth ?? 24, layerCandidateLimit: options.layerCandidateLimit ?? 24, statesExplored: 0, statesRetained: 0, layerHeights: new Set<number>(), strategies: new Set<string>(), orderings: new Set<string>(), validCandidates: 0, rejectedCandidates: 0, duplicateCandidates: 0, rejectionReasons: {} as Record<string, number>, profile };
  let attempts = 0, truncated = false;
  const orders = [products, [...products].sort((a, b) => volume(b) - volume(a) || b.height - a.height), [...products].reverse()];
  outer: for (const box of boxes) {
    const variants = orders.flatMap(order => rotationVariants(order).map(preferred => ({ order, preferred })));
    for (const variant of variants) {
      options.signal?.throwIfAborted();
      if (attempts >= budget) { truncated = true; break outer; }
      attempts++;
      const run = beamSearch(variant.order, box, spacing, strategy, variant.preferred, profile, options);
      diagnostics.statesExplored += run.explored;
      diagnostics.statesRetained += run.retained;
      run.layerHeights.forEach(height => diagnostics.layerHeights.add(height));
      truncated ||= run.truncated;
      for (const state of run.states) {
        if (!state.placements.length) continue;
        state.patterns.forEach(pattern => { const [method, ordering] = pattern.split(" · "); diagnostics.strategies.add(method); diagnostics.orderings.add(ordering); });
        const candidateSignature = resultSignature(box, state.placements);
        if (signatures.has(candidateSignature) || invalidSignatures.has(candidateSignature)) { diagnostics.duplicateCandidates++; continue; }
        const solution = makeSolution(`solution-${attempts}-${solutions.length + 1}`, products, box, spacing, state.placements, `layer-beam · ${state.patterns.join(" / ")}`, false, profile);
        if (solution.validation.status !== "valid") {
          invalidSignatures.add(candidateSignature);
          diagnostics.rejectedCandidates++;
          solution.validation.errors.forEach(error => { diagnostics.rejectionReasons[error] = (diagnostics.rejectionReasons[error] ?? 0) + 1; });
          rejected.push({ pattern: solution.metadata.pattern, errors: solution.validation.errors });
          continue;
        }
        diagnostics.validCandidates++;
        signatures.add(candidateSignature);
        solutions.push(solution);
      }
    }
  }
  let ranked = sortSolutions(solutions, profile === "simple-practical" ? "practical" : "fill");
  if (profile === "simple-practical") {
    const simple = ranked.filter(isSimplePattern);
    if (simple.length) ranked = simple;
    else if (ranked.length) rejected.push({ pattern: "simple-practical", errors: ["Geen geldig eenvoudig patroon gevonden; maximale-vullingkandidaten behouden."] });
  }
  const perBox = new Map<string, number>();
  ranked = ranked.filter(solution => { const count = perBox.get(solution.box.boxId) ?? 0; if (count >= 20) return false; perBox.set(solution.box.boxId, count + 1); return true; });
  const resultDiagnostics = { beamWidth: diagnostics.beamWidth, layerCandidateLimit: diagnostics.layerCandidateLimit, statesExplored: diagnostics.statesExplored, statesRetained: diagnostics.statesRetained, layerHeights: [...diagnostics.layerHeights].sort((a, b) => a - b), strategies: [...diagnostics.strategies], orderings: [...diagnostics.orderings], validCandidates: diagnostics.validCandidates, rejectedCandidates: diagnostics.rejectedCandidates, duplicateCandidates: diagnostics.duplicateCandidates, rejectionReasons: diagnostics.rejectionReasons, profile: diagnostics.profile };
  return { solutions: ranked, attempts, truncated, rejected: rejected.slice(0, 40), diagnostics: resultDiagnostics, warnings: ["ZITE-style laag-voor-laag beam search; geen bewijs van globaal optimum.", "Elke kandidaat is opnieuw geometrisch gevalideerd.", `Identieke kandidaatstates overgeslagen: ${diagnostics.duplicateCandidates}.`, ...(profile === "simple-practical" ? ["Eenvoudige/praktische kandidaten zijn geselecteerd op oriëntatie, laagherhaling en rasterregelmaat."] : []), ...(truncated ? ["Zoeklimiet bereikt; resultaten zijn niet volledig."] : [])] };
}