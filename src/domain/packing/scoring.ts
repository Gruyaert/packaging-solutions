import { EPS, outside, volume, type Box, type PatternMetrics, type Placement, type Product, type Solution, type Spacing, type Sorting } from "./types";
import { validatePlacements } from "./validation";
import { levelKey } from "./geometry";

export function detectRestPlacements(placements: Placement[]) {
  const groups = new Map<string, Placement[]>();
  for (const p of placements) {
    const key = JSON.stringify([p.productId, p.orientation, levelKey(p.z)]);
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  const rests: string[] = [];
  const adjacent = (p: Placement, q: Placement) => {
    const xOverlap = p.x < q.x + q.length - EPS && p.x + p.length > q.x + EPS;
    const yOverlap = p.y < q.y + q.width - EPS && p.y + p.width > q.y + EPS;
    return (xOverlap && (Math.abs(p.y - q.y - q.width) <= EPS || Math.abs(q.y - p.y - p.width) <= EPS)) || (yOverlap && (Math.abs(p.x - q.x - q.length) <= EPS || Math.abs(q.x - p.x - p.length) <= EPS));
  };
  for (const group of groups.values()) {
    const unseen = new Set(group);
    const clusters: Placement[][] = [];
    while (unseen.size) {
      const first = unseen.values().next().value as Placement;
      unseen.delete(first);
      const cluster = [first];
      for (let i = 0; i < cluster.length; i++) for (const p of unseen) if (adjacent(cluster[i], p)) { cluster.push(p); unseen.delete(p); }
      clusters.push(cluster);
    }
    if (clusters.some(c => c.length >= 2)) rests.push(...clusters.filter(c => c.length === 1).map(c => c[0].placementId));
  }
  return rests;
}

function patternMetrics(placements: Placement[], box: Box, restPlacementIds: string[]): PatternMetrics {
  const layers = new Map<number, Placement[]>();
  for (const placement of placements) layers.set(placement.layerIndex, [...(layers.get(placement.layerIndex) ?? []), placement]);
  const layerValues = [...layers.values()];
  const layerSignatures = layerValues.map(layer => JSON.stringify(layer.map(p => [p.productId, p.orientation, Number(p.x.toFixed(4)), Number(p.y.toFixed(4)), p.length, p.width]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))));
  const repeatedLayerRatio = layerSignatures.length ? Math.max(...layerSignatures.map(signature => layerSignatures.filter(other => other === signature).length)) / layerSignatures.length : 0;
  const orientations = new Set(placements.map(p => p.orientation));
  const products = new Set(placements.map(p => p.productId));
  const orientationComplexity = placements.length ? Math.min(1, Math.max(0, (orientations.size - Math.max(1, products.size)) / Math.max(1, placements.length - 1))) : 0;
  const xs = [...new Set(placements.map(p => Number(p.x.toFixed(4))))];
  const ys = [...new Set(placements.map(p => Number(p.y.toFixed(4))))];
  const regularPositions = placements.length ? 1 - Math.min(1, Math.max(0, xs.length + ys.length - Math.sqrt(placements.length) * 2) / Math.max(1, placements.length * 2)) : 0;
  const regularity = placements.length ? Math.max(0, 0.65 * regularPositions + 0.35 * (1 - restPlacementIds.length / placements.length)) : 0;
  const top = placements.length ? Math.max(...placements.map(p => p.z + p.height)) : 0;
  const occupiedLength = placements.length ? Math.max(...placements.map(p => p.x + p.length)) - Math.min(...placements.map(p => p.x)) : 0;
  const occupiedWidth = placements.length ? Math.max(...placements.map(p => p.y + p.width)) - Math.min(...placements.map(p => p.y)) : 0;
  const compactness = box.length > 0 && box.width > 0 ? Math.min(1, (occupiedLength * occupiedWidth) / (box.length * box.width)) : 0;
  const verticalFill = box.height > 0 ? Math.min(1, top / box.height) : 0;
  const simple = orientations.size <= Math.max(2, products.size) && (layerSignatures.length <= 1 || repeatedLayerRatio >= 0.5) && regularity >= 0.45;
  return { layerCount: layerValues.length, usedOrientations: orientations.size, orientationComplexity, repeatedLayerRatio, gridRegularity: regularity, verticalFill, compactness, simple };
}

export function isSimplePattern(solution: Solution) {
  return solution.metadata.patternMetrics?.simple ?? solution.metadata.handlingScore >= 0.55;
}

export function makeSolution(id: string, products: Product[], box: Box, spacing: Spacing, placements: Placement[], pattern: string, exact = false, strategy?: string): Solution {
  const validation = validatePlacements(products, box, spacing, placements, exact);
  const packedVolume = placements.reduce((sum, p) => sum + volume(p), 0);
  const utilization = packedVolume / volume(box);
  const transportEfficiency = packedVolume / volume(outside(box));
  const restPlacementIds = detectRestPlacements(placements);
  if (restPlacementIds.length) validation.warnings.push(`${restPlacementIds.length} losse restplacements gedetecteerd; handlingpenalty toegepast.`);
  if (products.some(p => p.compressibilityX || p.compressibilityY || p.compressibilityZ)) validation.warnings.push("Compressibility wordt nog niet toegepast; nominale maten behouden.");
  const metrics = patternMetrics(placements, box, restPlacementIds);
  const flat = placements.length ? placements.filter(p => p.height <= Math.min(p.length, p.width) + EPS).length / placements.length : 0;
  const simpleOrientation = placements.length ? placements.filter(p => p.orientation === "L-B-H" || p.orientation === "B-L-H").length / placements.length : 0;
  const handlingScore = Math.max(0, 0.3 * (1 - restPlacementIds.length / Math.max(1, placements.length)) + 0.25 * metrics.repeatedLayerRatio + 0.2 * simpleOrientation + 0.15 * flat + 0.1 * metrics.gridRegularity);
  const ecology = (utilization + transportEfficiency) / 2;
  const practicalScore = 100 * ecology * (0.58 * ecology + 0.42 * handlingScore);
  const metadata = { restPlacementIds, handlingScore, pattern, patternMetrics: metrics, ...(strategy ? { strategy } : {}) };
  return { solutionId: id, box: { ...box }, spacing: { ...spacing }, placements: placements.map(p => ({ ...p })), validation, counts: validation.counts, utilization, air: 1 - utilization, transportEfficiency, weightKg: placements.reduce((sum, p) => sum + (products.find(q => q.productId === p.productId)?.weightKg ?? 0), 0), practicalScore, metadata };
}
export function exactFilter(solutions: Solution[], products: Product[]) {
  return solutions.filter(s => products.every(p => s.counts[p.productId] === p.quantity));
}
export function sortSolutions(solutions: Solution[], sorting: Sorting): Solution[] {
  const ecology = (s: Solution) => (s.utilization + s.transportEfficiency) / 2;
  const verticalFill = (s: Solution) => s.metadata.patternMetrics?.verticalFill ?? (s.placements.length ? Math.max(...s.placements.map(p => p.z + p.height)) / s.box.height : 0);
  const fillQuality = (s: Solution) => 0.62 * s.utilization + 0.2 * Math.min(1, verticalFill(s)) + 0.18 * (s.metadata.patternMetrics?.compactness ?? 0);
  const best = Math.max(0, ...solutions.map(ecology));
  return [...solutions].sort((a, b) => {
    if (sorting === "fill") return fillQuality(b) - fillQuality(a) || b.utilization - a.utilization || volume(a.box) - volume(b.box);
    const aGroup = ecology(a) >= best * 0.75 ? 1 : 0, bGroup = ecology(b) >= best * 0.75 ? 1 : 0;
    return bGroup - aGroup || b.practicalScore - a.practicalScore || (b.metadata.patternMetrics?.gridRegularity ?? 0) - (a.metadata.patternMetrics?.gridRegularity ?? 0) || b.utilization - a.utilization;
  });
}