import { EPS, outside, volume, type Box, type Placement, type Product, type Solution, type Spacing, type Sorting } from "./types";
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

export function makeSolution(id: string, products: Product[], box: Box, spacing: Spacing, placements: Placement[], pattern: string, exact = false): Solution {
  const validation = validatePlacements(products, box, spacing, placements, exact);
  const packedVolume = placements.reduce((sum, p) => sum + volume(p), 0);
  const utilization = packedVolume / volume(box);
  const transportEfficiency = packedVolume / volume(outside(box));
  const restPlacementIds = detectRestPlacements(placements);
  if (restPlacementIds.length) validation.warnings.push(`${restPlacementIds.length} losse restplacements gedetecteerd; handlingpenalty toegepast.`);
  if (products.some(p => p.compressibilityX || p.compressibilityY || p.compressibilityZ)) validation.warnings.push("Compressibility wordt nog niet toegepast; nominale maten behouden.");
  const layers = new Map<number, Placement[]>();
  for (const p of placements) layers.set(p.layerIndex, [...(layers.get(p.layerIndex) ?? []), p]);
  const signatures = [...layers.values()].map(layer => JSON.stringify(layer.map(p => [p.productId, p.orientation, p.x, p.y]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))));
  const repeated = signatures.length ? Math.max(...signatures.map(s => signatures.filter(t => t === s).length)) / signatures.length : 0;
  const flat = placements.length ? placements.filter(p => p.height <= Math.min(p.length, p.width) + EPS).length / placements.length : 0;
  const simple = placements.length ? placements.filter(p => p.orientation === "L-B-H" || p.orientation === "B-L-H").length / placements.length : 0;
  const regular = placements.length ? 1 - restPlacementIds.length / placements.length : 0;
  const handlingScore = Math.max(0, 0.35 * regular + 0.3 * repeated + 0.2 * simple + 0.15 * flat - 0.5 * (1 - regular));
  const ecology = (utilization + transportEfficiency) / 2;
  const practicalScore = 100 * ecology * (0.6 * ecology + 0.4 * handlingScore);
  return { solutionId: id, box: { ...box }, spacing: { ...spacing }, placements: placements.map(p => ({ ...p })), validation, counts: validation.counts, utilization, air: 1 - utilization, transportEfficiency, weightKg: placements.reduce((sum, p) => sum + (products.find(q => q.productId === p.productId)?.weightKg ?? 0), 0), practicalScore, metadata: { restPlacementIds, handlingScore, pattern } };
}
export function exactFilter(solutions: Solution[], products: Product[]) {
  return solutions.filter(s => products.every(p => s.counts[p.productId] === p.quantity));
}
export function sortSolutions(solutions: Solution[], sorting: Sorting): Solution[] {
  const ecology = (s: Solution) => (s.utilization + s.transportEfficiency) / 2;
  const verticalFill = (s: Solution) => s.placements.length ? Math.max(...s.placements.map(p => p.z + p.height)) / s.box.height : 0;
  const fillQuality = (s: Solution) => 0.72 * s.utilization + 0.28 * Math.min(1, verticalFill(s));
  const best = Math.max(0, ...solutions.map(ecology));
  return [...solutions].sort((a, b) => {
    if (sorting === "fill") return fillQuality(b) - fillQuality(a) || b.utilization - a.utilization || volume(a.box) - volume(b.box);
    const aGroup = ecology(a) >= best * 0.75 ? 1 : 0, bGroup = ecology(b) >= best * 0.75 ? 1 : 0;
    return bGroup - aGroup || b.practicalScore - a.practicalScore || b.utilization - a.utilization;
  });
}
