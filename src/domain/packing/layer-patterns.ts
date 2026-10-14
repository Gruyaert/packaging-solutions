import { EPS, rotated, type Box, type Dimensions, type Orientation, type Placement, type Product, type SearchProfile, type Spacing } from "./types";

export type LayerStrategy = "area" | "short" | "long" | "bottom";
interface FreeRect extends Dimensions { x: number; y: number }
export interface LayerPattern {
  height: number;
  placements: Placement[];
  counts: Record<string, number>;
  strategy: LayerStrategy;
  ordering: string;
  signature: string;
}

function intersects(a: FreeRect, b: Dimensions & { x: number; y: number }) {
  return a.x < b.x + b.length - EPS && a.x + a.length > b.x + EPS && a.y < b.y + b.width - EPS && a.y + a.width > b.y + EPS;
}

function contains(a: FreeRect, b: FreeRect) {
  return a.x <= b.x + EPS && a.y <= b.y + EPS && a.x + a.length >= b.x + b.length - EPS && a.y + a.width >= b.y + b.width - EPS;
}

function prune(rectangles: FreeRect[]) {
  return rectangles.filter((rect, index) => rect.length > EPS && rect.width > EPS && !rectangles.some((other, otherIndex) => otherIndex !== index && contains(other, rect)));
}

function splitFreeRectangles(free: FreeRect[], placed: Placement) {
  const next: FreeRect[] = [];
  for (const rect of free) {
    if (!intersects(rect, placed)) {
      next.push(rect);
      continue;
    }
    const right = rect.x + rect.length - (placed.x + placed.length);
    const bottom = rect.y + rect.width - (placed.y + placed.width);
    if (right > EPS) next.push({ x: placed.x + placed.length, y: rect.y, length: right, width: rect.width, height: 0 });
    if (bottom > EPS) next.push({ x: rect.x, y: placed.y + placed.width, length: placed.length, width: bottom, height: 0 });
    const left = placed.x - rect.x;
    if (left > EPS) next.push({ x: rect.x, y: rect.y, length: left, width: rect.width, height: 0 });
    const top = placed.y - rect.y;
    if (top > EPS) next.push({ x: rect.x, y: rect.y, length: rect.length, width: top, height: 0 });
  }
  return prune(next);
}

function placementScore(rect: FreeRect, dims: Dimensions, strategy: LayerStrategy) {
  const leftoverLength = rect.length - dims.length;
  const leftoverWidth = rect.width - dims.width;
  if (strategy === "short") return Math.min(leftoverLength, leftoverWidth) * 100000 + Math.max(leftoverLength, leftoverWidth);
  if (strategy === "long") return Math.max(leftoverLength, leftoverWidth) * 100000 + Math.min(leftoverLength, leftoverWidth);
  if (strategy === "bottom") return rect.y * 100000 + rect.x;
  return rect.length * rect.width - dims.length * dims.width;
}

const orderCache = new Map<string, Product[][]>();
function productOrders(products: Product[], preferred: Orientation[]) {
  const cacheKey = JSON.stringify([products.map(product => [product.productId, product.length, product.width, product.height, product.rotations]), preferred]);
  const cached = orderCache.get(cacheKey);
  if (cached) return cached;
  const base = [...products];
  const area = [...products].sort((a, b) => b.length * b.width - a.length * a.width || b.height - a.height);
  const longest = [...products].sort((a, b) => Math.max(b.length, b.width) - Math.max(a.length, a.width));
  const shortest = [...products].sort((a, b) => Math.min(a.length, a.width) - Math.min(b.length, b.width));
  const reverse = [...products].reverse();
  const orders = [base, area, longest, shortest, reverse];
  const preferredRanks = new Map(preferred.map((rotation, index) => [rotation, index]));
  const seen = new Set<string>();
  const result = orders.filter(order => {
    const key = order.map(product => product.productId).join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(order => {
    const rank = (product: Product) => { const first = preferred.find(rotation => product.rotations.includes(rotation)) ?? product.rotations[0]; return preferredRanks.get(first) ?? -1; };
    const preferredFirst = [...order].sort((a, b) => rank(a) - rank(b));
    return preferredFirst.length ? preferredFirst : order;
  });
  if (orderCache.size >= 64) orderCache.delete(orderCache.keys().next().value as string);
  orderCache.set(cacheKey, result);
  return result;
}

function buildLayer(
  products: Product[],
  remaining: Record<string, number>,
  box: Box,
  spacing: Spacing,
  baseZ: number,
  layerHeight: number,
  strategy: LayerStrategy,
  profile: SearchProfile,
  preferred: Orientation[],
  orderLabel: string,
): LayerPattern | undefined {
  const usable = { x: spacing.length / 2, y: spacing.width / 2, length: box.length - spacing.length, width: box.width - spacing.width, height: 0 };
  if (usable.length <= EPS || usable.width <= EPS) return undefined;
  let free: FreeRect[] = [usable];
  const placements: Placement[] = [];
  const counts: Record<string, number> = Object.fromEntries(products.map(product => [product.productId, 0]));
  const dimensions = new Map<string, Dimensions>();
  const allRotations = new Map<string, Orientation[]>();
  for (const product of products) {
    allRotations.set(product.productId, profile === "simple-practical"
      ? [preferred.find(rotation => product.rotations.includes(rotation)) ?? product.rotations[0]]
      : [...new Set([...preferred.filter(rotation => product.rotations.includes(rotation)), ...product.rotations.filter(rotation => !preferred.includes(rotation))])]);
    for (const orientation of product.rotations) dimensions.set(`${product.productId}|${orientation}`, rotated(product, orientation));
  }
  let serial = 0;
  while (free.length && placements.length < 500) {
    let best: { product: Product; orientation: Orientation; rect: FreeRect; dims: Dimensions; score: number } | undefined;
    for (const product of products) {
      if ((remaining[product.productId] ?? 0) <= counts[product.productId]) continue;
      const rotations = allRotations.get(product.productId) ?? product.rotations;
      for (const orientation of rotations) {
        const dims = dimensions.get(`${product.productId}|${orientation}`)!;
        if (Math.abs(dims.height - layerHeight) > EPS) continue;
        for (const rect of free) {
          if (dims.length > rect.length + EPS || dims.width > rect.width + EPS) continue;
          const score = placementScore(rect, dims, strategy);
          if (!best || score < best.score - EPS || (Math.abs(score - best.score) <= EPS && product.productId < best.product.productId)) best = { product, orientation, rect, dims, score };
        }
      }
    }
    if (!best) break;
    const placement: Placement = { placementId: `layer-${serial++}`, productId: best.product.productId, x: best.rect.x, y: best.rect.y, z: baseZ, ...best.dims, orientation: best.orientation, layerIndex: 0 };
    placements.push(placement);
    counts[best.product.productId]++;
    free = splitFreeRectangles(free, placement);
  }
  if (!placements.length) return undefined;
  const signature = JSON.stringify(placements.map(placement => [placement.productId, placement.orientation, placement.x, placement.y, placement.length, placement.width]).sort());
  return { height: layerHeight, placements, counts, strategy, ordering: orderLabel, signature };
}

const heightCache = new Map<string, number[]>();
export function layerHeightCandidates(products: Product[], remaining: Record<string, number>) {
  const cacheKey = JSON.stringify([products.map(product => [product.productId, product.length, product.width, product.height, product.rotations]), remaining]);
  const cached = heightCache.get(cacheKey);
  if (cached) return cached;
  const heights = new Set<number>();
  for (const product of products) if ((remaining[product.productId] ?? 0) > 0) for (const orientation of product.rotations) heights.add(rotated(product, orientation).height);
  const result = [...heights].sort((a, b) => a - b);
  if (heightCache.size >= 128) heightCache.delete(heightCache.keys().next().value as string);
  heightCache.set(cacheKey, result);
  return result;
}

export function generateLayerPatterns(
  products: Product[],
  remaining: Record<string, number>,
  box: Box,
  spacing: Spacing,
  baseZ: number,
  profile: SearchProfile,
  preferred: Orientation[],
  maxPatterns = 24,
): LayerPattern[] {
  const patterns: LayerPattern[] = [];
  const seen = new Set<string>();
  const heights = layerHeightCandidates(products, remaining);
  const strategies: LayerStrategy[] = ["area", "short", "long", "bottom"];
  for (const order of productOrders(products, preferred)) {
    const orderLabel = order.map(product => product.productId).join(" → ");
    for (const height of heights) for (const strategy of strategies) {
      const pattern = buildLayer(order, remaining, box, spacing, baseZ, height, strategy, profile, preferred, orderLabel);
      if (!pattern || seen.has(pattern.signature)) continue;
      seen.add(pattern.signature);
      patterns.push(pattern);
      if (patterns.length >= maxPatterns) return patterns;
    }
  }
  return patterns;
}