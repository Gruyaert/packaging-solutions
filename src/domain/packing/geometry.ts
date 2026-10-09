import { EPS, type Box, type Placement, type Spacing } from "./types";
export function overlaps(a: Placement, b: Placement) {
  return a.x < b.x + b.length - EPS && a.x + a.length > b.x + EPS && a.y < b.y + b.width - EPS && a.y + a.width > b.y + EPS && a.z < b.z + b.height - EPS && a.z + a.height > b.z + EPS;
}
export function inBounds(p: Placement, box: Box, spacing: Spacing) {
  return p.x >= spacing.length / 2 - EPS && p.y >= spacing.width / 2 - EPS && p.z >= -EPS && p.x + p.length <= box.length - spacing.length / 2 + EPS && p.y + p.width <= box.width - spacing.width / 2 + EPS && p.z + p.height <= box.height - spacing.height + EPS;
}
export function supported(p: Placement, placements: Placement[]) {
  if (Math.abs(p.z) <= EPS) return true;
  const supports = placements.filter(q => q.placementId !== p.placementId && Math.abs(q.z + q.height - p.z) <= EPS && q.x < p.x + p.length - EPS && q.x + q.length > p.x + EPS && q.y < p.y + p.width - EPS && q.y + q.width > p.y + EPS);
  if (!supports.length) return false;
  const xs = [...new Set([p.x, p.x + p.length, ...supports.flatMap(q => [Math.max(p.x, q.x), Math.min(p.x + p.length, q.x + q.length)])])].sort((a, b) => a - b);
  const ys = [...new Set([p.y, p.y + p.width, ...supports.flatMap(q => [Math.max(p.y, q.y), Math.min(p.y + p.width, q.y + q.width)])])].sort((a, b) => a - b);
  for (let x = 0; x < xs.length - 1; x++) for (let y = 0; y < ys.length - 1; y++) {
    if (xs[x + 1] - xs[x] <= EPS || ys[y + 1] - ys[y] <= EPS) continue;
    const mx = (xs[x] + xs[x + 1]) / 2, my = (ys[y] + ys[y + 1]) / 2;
    if (!supports.some(q => mx >= q.x - EPS && mx <= q.x + q.length + EPS && my >= q.y - EPS && my <= q.y + q.width + EPS)) return false;
  }
  return true;
}
export const levelKey = (z: number) => Math.round(z / EPS);
export function indexLayers(placements: Placement[]): Placement[] {
  const levels = [...new Set(placements.map(p => levelKey(p.z)))].sort((a, b) => a - b);
  return placements.map(p => ({ ...p, layerIndex: levels.indexOf(levelKey(p.z)) }));
}
export function respectsMaxima(candidate: Placement, placements: Placement[], maxima: { maxInLength: number; maxInWidth: number; maxLayers: number }) {
  const same = [...placements.filter(p => p.productId === candidate.productId), candidate];
  const layer = same.filter(p => Math.abs(p.z - candidate.z) <= EPS);
  return new Set(layer.map(p => levelKey(p.x))).size <= maxima.maxInLength && new Set(layer.map(p => levelKey(p.y))).size <= maxima.maxInWidth && new Set(same.map(p => levelKey(p.z))).size <= maxima.maxLayers;
}
