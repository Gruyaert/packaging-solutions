import { EPS, outside, volume, type Box, type Placement, type Product, type Solution, type Sorting } from "./types";
import { supported } from "./geometry";
export interface PalletSettings { palletLength: number; palletWidth: number; palletHeight: number; maxTotalHeight: number; overhangLengthPerSide: number; overhangWidthPerSide: number }
export const DEFAULT_PALLET: PalletSettings = { palletLength: 1200, palletWidth: 800, palletHeight: 144, maxTotalHeight: 1800, overhangLengthPerSide: 0, overhangWidthPerSide: 0 };
export type PalletSource = { kind: "packaging" | "saved"; solution: Solution; products?: Product[]; context?: { definitionId?: string; mode?: "STOCK" | "PERSO" } } | { kind: "database"; box: Box };
export interface PalletResult {
  pattern: string; boxesPerLayer: number; layers: number; totalBoxes: number; height: number;
  surfaceUtilization: number; volumeEfficiency: number; overhang: { lengthPerSide: number; widthPerSide: number };
  score: number; placements: Placement[]; warnings: string[];
}
export function effectivePallet(settings: PalletSettings) {
  return { length: settings.palletLength + 2 * settings.overhangLengthPerSide, width: settings.palletWidth + 2 * settings.overhangWidthPerSide };
}
export function palletize(source: PalletSource, settings: PalletSettings = DEFAULT_PALLET, sorting: Sorting = "fill"): PalletResult[] {
  if (source.kind !== "database" && source.solution.validation.status !== "valid") throw new Error("Palletisatie vereist een geldige packaging/saved solution.");
  const box = source.kind === "database" ? source.box : source.solution.box;
  if (![box.length, box.width, box.height].every(n => Number.isFinite(n) && n > 0) || !Number.isFinite(box.cardboard) || box.cardboard < 0) throw new Error("Ongeldige doosmaten.");
  if (![settings.palletLength, settings.palletWidth, settings.maxTotalHeight].every(n => Number.isFinite(n) && n > 0) || ![settings.palletHeight, settings.overhangLengthPerSide, settings.overhangWidthPerSide].every(n => Number.isFinite(n) && n >= 0)) throw new Error("Ongeldige palletinstellingen.");
  const outer = outside(box), effective = effectivePallet(settings);
  const layers = Math.floor((settings.maxTotalHeight - settings.palletHeight + EPS) / outer.height);
  if (layers <= 0) return [];
  function grid(x: number, y: number, l: number, w: number, rotated: boolean): Placement[] {
    const length = rotated ? outer.width : outer.length, width = rotated ? outer.length : outer.width;
    const nx = Math.floor((l + EPS) / length), ny = Math.floor((w + EPS) / width);
    if (nx * ny > 1000) throw new Error("Meer dan 1000 dozen per laag; buiten de palletinspectielimiet.");
    return Array.from({ length: nx * ny }, (_, i): Placement => ({ placementId: `box-${i}`, productId: box.boxId, x: x + (i % nx) * length, y: y + Math.floor(i / nx) * width, z: 0, length, width, height: outer.height, orientation: rotated ? "B-L-H" : "L-B-H", layerIndex: 0 }));
  }
  const patterns: { label: string; layer: Placement[] }[] = [
    { label: "0° raster", layer: grid(0, 0, effective.length, effective.width, false) },
    { label: "90° raster", layer: grid(0, 0, effective.length, effective.width, true) },
  ];
  for (const rotated of [false, true]) {
    const edgeX = rotated ? outer.width : outer.length, edgeY = rotated ? outer.length : outer.width;
    const nx = Math.floor(effective.length / edgeX), ny = Math.floor(effective.width / edgeY);
    if (nx > 100 || ny > 100) throw new Error("Palletpatroon overschrijdt limiet van 100 snijposities per as.");
    for (let n = 1; n <= nx; n++) {
      const split = n * edgeX;
      patterns.push({ label: `Gemengd · X-split ${n} (${rotated ? 90 : 0}°)`, layer: [...grid(0, 0, split, effective.width, rotated), ...grid(split, 0, effective.length - split, effective.width, !rotated)] });
    }
    for (let n = 1; n <= ny; n++) {
      const split = n * edgeY;
      patterns.push({ label: `Gemengd · Y-split ${n} (${rotated ? 90 : 0}°)`, layer: [...grid(0, 0, effective.length, split, rotated), ...grid(0, split, effective.length, effective.width - split, !rotated)] });
    }
  }
  const unique = new Map<string, typeof patterns[number]>();
  for (const p of patterns) if (p.layer.length) {
    if (p.layer.length > 1000) throw new Error("Meer dan 1000 dozen per gemengde laag; buiten de palletinspectielimiet.");
    const layer = p.layer.map((q, i) => ({ ...q, placementId: `base-${i}` }));
    const signature = JSON.stringify(layer.map(q => [q.x, q.y, q.length, q.width]));
    if (!unique.has(signature)) unique.set(signature, { ...p, layer });
  }
  const candidates = [...unique.values()];
  const results: PalletResult[] = [];
  function add(a: typeof candidates[number], b?: typeof candidates[number]) {
    if (a.layer.length * layers > 3000) throw new Error("Meer dan 3000 palletplacements; verlaag de hoogte of vergroot de doos.");
    const placements: Placement[] = [];
    for (let layer = 0; layer < layers; layer++) {
      const pattern = b && layer % 2 ? b : a;
      for (const p of pattern.layer) placements.push({ ...p, placementId: `pallet-${layer}-${placements.length}`, x: p.x - settings.overhangLengthPerSide, y: p.y - settings.overhangWidthPerSide, z: settings.palletHeight + layer * outer.height, layerIndex: layer });
    }
    const count = a.layer.length, surfaceUtilization = count * outer.length * outer.width / (effective.length * effective.width);
    const volumeEfficiency = placements.length * volume(outer) / (effective.length * effective.width * (settings.maxTotalHeight - settings.palletHeight));
    const handling = b ? 0.8 : a.label.includes("raster") ? 1 : 0.85;
    results.push({ pattern: b ? `${a.label} ↔ ${b.label} · alternerend` : a.label, boxesPerLayer: count, layers, totalBoxes: placements.length, height: settings.palletHeight + layers * outer.height, surfaceUtilization, volumeEfficiency, overhang: { lengthPerSide: settings.overhangLengthPerSide, widthPerSide: settings.overhangWidthPerSide }, score: 100 * volumeEfficiency * (0.6 * volumeEfficiency + 0.4 * handling), placements, warnings: ["Geometrische controle, geen certificering van gewicht, draagkracht, wrijving of transportstabiliteit."] });
  }
  for (const p of candidates) add(p);
  for (let i = 0; i < candidates.length; i++) for (let j = i + 1; j < candidates.length; j++) {
    const a = candidates[i], b = candidates[j];
    if (a.layer.length !== b.layer.length || layers < 2 || a.label.includes("Gemengd") || b.label.includes("Gemengd")) continue;
    const supportedAbove = (top: Placement[], bottom: Placement[]) => top.every(p => supported({ ...p, placementId: `top-${p.placementId}`, z: outer.height }, bottom));
    if (supportedAbove(a.layer, b.layer) && supportedAbove(b.layer, a.layer)) add(a, b);
  }
  const best = Math.max(0, ...results.map(r => r.volumeEfficiency));
  return results.sort((a, b) => sorting === "fill" ? b.totalBoxes - a.totalBoxes || b.surfaceUtilization - a.surfaceUtilization : Number(b.volumeEfficiency >= best * 0.75) - Number(a.volumeEfficiency >= best * 0.75) || b.score - a.score);
}
