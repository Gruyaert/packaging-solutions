import { EPS, outside, volume, type Box, type Placement, type Product, type Solution, type Sorting } from "./types";
import { supported } from "./geometry";
export interface PalletSettings { palletLength: number; palletWidth: number; palletHeight: number; maxTotalHeight: number; overhangLengthPerSide: number; overhangWidthPerSide: number }
export const DEFAULT_PALLET: PalletSettings = { palletLength: 1200, palletWidth: 800, palletHeight: 144, maxTotalHeight: 1800, overhangLengthPerSide: 0, overhangWidthPerSide: 0 };
export type PalletSource = { kind: "packaging" | "saved"; solution: Solution; products?: Product[]; context?: { definitionId?: string; mode?: "STOCK" | "PERSO" } } | { kind: "database"; box: Box };
export interface PalletResult {
  pattern: string; family?: "grid" | "strip" | "guillotine" | "maxrects" | "alternating"; boxesPerLayer: number; layers: number; totalBoxes: number; height: number;
  surfaceUtilization: number; volumeEfficiency: number; overhang: { lengthPerSide: number; widthPerSide: number };
  score: number; placements: Placement[]; warnings: string[];
}
export function effectivePallet(settings: PalletSettings) {
  return { length: settings.palletLength + 2 * settings.overhangLengthPerSide, width: settings.palletWidth + 2 * settings.overhangWidthPerSide };
}
interface Pattern { label: string; family: PalletResult["family"]; layer: Placement[] }
interface FreeRect { x: number; y: number; length: number; width: number }

function maxRectsLayer(length: number, width: number, outer: ReturnType<typeof outside>): Placement[] {
  let free: FreeRect[] = [{ x: 0, y: 0, length, width }];
  const result: Placement[] = [];
  while (free.length && result.length < 1000) {
    let best: { rect: FreeRect; rotated: boolean; score: number } | undefined;
    for (const rect of free) for (const rotated of [false, true]) {
      const boxLength = rotated ? outer.width : outer.length, boxWidth = rotated ? outer.length : outer.width;
      if (boxLength > rect.length + EPS || boxWidth > rect.width + EPS) continue;
      const score = rect.length * rect.width - boxLength * boxWidth + rect.y * 0.001 + rect.x * 0.000001;
      if (!best || score < best.score) best = { rect, rotated, score };
    }
    if (!best) break;
    const boxLength = best.rotated ? outer.width : outer.length, boxWidth = best.rotated ? outer.length : outer.width;
    result.push({ placementId: `maxrect-${result.length}`, productId: "pallet-box", x: best.rect.x, y: best.rect.y, z: 0, length: boxLength, width: boxWidth, height: outer.height, orientation: best.rotated ? "B-L-H" : "L-B-H", layerIndex: 0 });
    const next: FreeRect[] = [];
    for (const rect of free) {
      const placed = result[result.length - 1];
      const intersects = rect.x < placed.x + placed.length - EPS && rect.x + rect.length > placed.x + EPS && rect.y < placed.y + placed.width - EPS && rect.y + rect.width > placed.y + EPS;
      if (!intersects) { next.push(rect); continue; }
      const right = rect.x + rect.length - (placed.x + placed.length), bottom = rect.y + rect.width - (placed.y + placed.width);
      if (right > EPS) next.push({ x: placed.x + placed.length, y: rect.y, length: right, width: rect.width });
      if (bottom > EPS) next.push({ x: rect.x, y: placed.y + placed.width, length: placed.length, width: bottom });
      const left = placed.x - rect.x, top = placed.y - rect.y;
      if (left > EPS) next.push({ x: rect.x, y: rect.y, length: left, width: rect.width });
      if (top > EPS) next.push({ x: rect.x, y: rect.y, length: rect.length, width: top });
    }
    free = next.filter((rect, index, all) => rect.length > EPS && rect.width > EPS && !all.some((other, otherIndex) => otherIndex !== index && other.x <= rect.x + EPS && other.y <= rect.y + EPS && other.x + other.length >= rect.x + rect.length - EPS && other.y + other.width >= rect.y + rect.width - EPS));
  }
  return result.map((placement, index) => ({ ...placement, placementId: `base-${index}`, productId: "pallet-box" }));
}

export function palletize(source: PalletSource, settings: PalletSettings = DEFAULT_PALLET, sorting: Sorting = "fill"): PalletResult[] {
  if (source.kind !== "database" && source.solution.validation.status !== "valid") throw new Error("Palletisatie vereist een geldige packaging/saved solution.");
  const box = source.kind === "database" ? source.box : source.solution.box;
  if (![box.length, box.width, box.height].every(n => Number.isFinite(n) && n > 0) || !Number.isFinite(box.cardboard) || box.cardboard < 0) throw new Error("Ongeldige doosmaten.");
  if (![settings.palletLength, settings.palletWidth, settings.maxTotalHeight].every(n => Number.isFinite(n) && n > 0) || ![settings.palletHeight, settings.overhangLengthPerSide, settings.overhangWidthPerSide].every(n => Number.isFinite(n) && n >= 0)) throw new Error("Ongeldige palletinstellingen.");
  const outer = outside(box), effective = effectivePallet(settings);
  const layers = Math.floor((settings.maxTotalHeight - settings.palletHeight + EPS) / outer.height);
  if (layers <= 0) return [];
  function grid(x: number, y: number, length: number, width: number, rotated: boolean): Placement[] {
    const boxLength = rotated ? outer.width : outer.length, boxWidth = rotated ? outer.length : outer.width;
    const nx = Math.floor((length + EPS) / boxLength), ny = Math.floor((width + EPS) / boxWidth);
    if (nx * ny > 1000) throw new Error("Meer dan 1000 dozen per laag; buiten de palletinspectielimiet.");
    return Array.from({ length: nx * ny }, (_, index): Placement => ({ placementId: `box-${index}`, productId: "pallet-box", x: x + (index % nx) * boxLength, y: y + Math.floor(index / nx) * boxWidth, z: 0, length: boxLength, width: boxWidth, height: outer.height, orientation: rotated ? "B-L-H" : "L-B-H", layerIndex: 0 }));
  }
  const patterns: Pattern[] = [
    { label: "0° raster", family: "grid", layer: grid(0, 0, effective.length, effective.width, false) },
    { label: "90° raster", family: "grid", layer: grid(0, 0, effective.length, effective.width, true) },
    { label: "MaxRects · gemengde oriëntaties", family: "maxrects", layer: maxRectsLayer(effective.length, effective.width, outer) },
  ];
  for (const rotated of [false, true]) {
    const edgeX = rotated ? outer.width : outer.length, edgeY = rotated ? outer.length : outer.width;
    const nx = Math.floor(effective.length / edgeX), ny = Math.floor(effective.width / edgeY);
    if (nx > 100 || ny > 100) throw new Error("Palletpatroon overschrijdt limiet van 100 snijposities per as.");
    for (let n = 1; n <= nx; n++) {
      const split = n * edgeX;
      patterns.push({ label: `Guillotine · X-split ${n} (${rotated ? 90 : 0}°)`, family: "guillotine", layer: [...grid(0, 0, split, effective.width, rotated), ...grid(split, 0, effective.length - split, effective.width, !rotated)] });
    }
    for (let n = 1; n <= ny; n++) {
      const split = n * edgeY;
      patterns.push({ label: `Guillotine · Y-split ${n} (${rotated ? 90 : 0}°)`, family: "guillotine", layer: [...grid(0, 0, effective.length, split, rotated), ...grid(0, split, effective.length, effective.width - split, !rotated)] });
    }
    if (effective.width > edgeY + EPS) patterns.push({ label: `Strook · ${rotated ? 90 : 0}° + dwars`, family: "strip", layer: [...grid(0, 0, effective.length, edgeY, rotated), ...grid(0, edgeY, effective.length, effective.width - edgeY, !rotated)] });
  }
  const unique = new Map<string, Pattern>();
  for (const pattern of patterns) if (pattern.layer.length) {
    if (pattern.layer.length > 1000) throw new Error("Meer dan 1000 dozen per gemengde laag; buiten de palletinspectielimiet.");
    const layer = pattern.layer.map((placement, index) => ({ ...placement, placementId: `base-${index}` }));
    const signature = JSON.stringify(layer.map(placement => [placement.x, placement.y, placement.length, placement.width]));
    if (!unique.has(signature)) unique.set(signature, { ...pattern, layer });
  }
  const candidates = [...unique.values()];
  const results: PalletResult[] = [];
  function add(a: Pattern, b?: Pattern) {
    if (a.layer.length * layers > 3000) throw new Error("Meer dan 3000 palletplacements; verlaag de hoogte of vergroot de doos.");
    const placements: Placement[] = [];
    for (let layer = 0; layer < layers; layer++) {
      const pattern = b && layer % 2 ? b : a;
      for (const placement of pattern.layer) placements.push({ ...placement, placementId: `pallet-${layer}-${placements.length}`, x: placement.x - settings.overhangLengthPerSide, y: placement.y - settings.overhangWidthPerSide, z: settings.palletHeight + layer * outer.height, layerIndex: layer });
    }
    const count = a.layer.length, surfaceUtilization = count * outer.length * outer.width / (effective.length * effective.width);
    const volumeEfficiency = placements.length * volume(outer) / (effective.length * effective.width * (settings.maxTotalHeight - settings.palletHeight));
    const handling = b ? 0.8 : a.family === "grid" ? 1 : a.family === "strip" ? 0.92 : a.family === "maxrects" ? 0.86 : 0.88;
    results.push({ pattern: b ? `${a.label} ↔ ${b.label} · alternerend` : a.label, family: b ? "alternating" : a.family, boxesPerLayer: count, layers, totalBoxes: placements.length, height: settings.palletHeight + layers * outer.height, surfaceUtilization, volumeEfficiency, overhang: { lengthPerSide: settings.overhangLengthPerSide, widthPerSide: settings.overhangWidthPerSide }, score: 100 * volumeEfficiency * (0.6 * volumeEfficiency + 0.4 * handling), placements, warnings: ["Geometrische controle, geen certificering van gewicht, draagkracht, wrijving of transportstabiliteit."] });
  }
  for (const pattern of candidates) add(pattern);
  for (let i = 0; i < candidates.length; i++) for (let j = i + 1; j < candidates.length; j++) {
    const a = candidates[i], b = candidates[j];
    if (a.layer.length !== b.layer.length || layers < 2 || a.family === "guillotine" || b.family === "guillotine") continue;
    const supportedAbove = (top: Placement[], bottom: Placement[]) => top.every(placement => supported({ ...placement, placementId: `top-${placement.placementId}`, z: outer.height }, bottom));
    if (supportedAbove(a.layer, b.layer) && supportedAbove(b.layer, a.layer)) add(a, b);
  }
  const best = Math.max(0, ...results.map(result => result.volumeEfficiency));
  return results.sort((a, b) => sorting === "fill" ? b.totalBoxes - a.totalBoxes || b.surfaceUtilization - a.surfaceUtilization : Number(b.volumeEfficiency >= best * 0.75) - Number(a.volumeEfficiency >= best * 0.75) || b.score - a.score);
}