import { EPS, outside, rotated, type Orientation, type Placement, type Product, type Solution } from "./types";
import { indexLayers, levelKey, overlaps } from "./geometry";
import { makeSolution, detectRestPlacements } from "./scoring";
import { DEFAULT_PALLET, effectivePallet, type PalletSettings } from "./pallet";

export const OPERATION_TYPES = ["MOVE_ITEM", "ROTATE_ITEM", "ALIGN_ROW", "ALIGN_COLUMN", "DISTRIBUTE_REMAINDER", "SNAP_TO_ROW", "SNAP_TO_COLUMN", "CREATE_LAYER", "MIRROR_LAYER", "APPLY_COMPRESSION_TOLERANCE", "MAKE_CURRENT", "DUPLICATE_SOLUTION", "EDIT_METADATA", "RECALCULATE", "UNDO", "REDO", "VALIDATE"] as const;
export interface EditorOperation { operationId: string; solutionId: string; timestamp: string; operationType: typeof OPERATION_TYPES[number]; parametersJSON: Record<string, unknown>; beforePlacementJSON: Placement[]; afterPlacementJSON: Placement[]; user: string; note: string }
export interface EditorAudit { sourceSolutionId: string; baselineCounts: Record<string, number>; palletSettings: PalletSettings; operations: EditorOperation[] }
export interface EditorState { solutionId: string; products: Product[]; solution: Solution; audit: EditorAudit; past: Placement[][]; future: Placement[][] }
const copy = (items: Placement[]) => items.map(p => ({ ...p }));
export function operation(solutionId: string, type: EditorOperation["operationType"], before: Placement[], after: Placement[], user: string, parametersJSON: Record<string, unknown> = {}, note = ""): EditorOperation {
  const beforeById = new Map(before.map(p => [p.placementId, p])), afterById = new Map(after.map(p => [p.placementId, p]));
  const changedBefore = type === "DUPLICATE_SOLUTION" ? before : before.filter(p => JSON.stringify(p) !== JSON.stringify(afterById.get(p.placementId)));
  const changedAfter = type === "DUPLICATE_SOLUTION" ? after : after.filter(p => JSON.stringify(p) !== JSON.stringify(beforeById.get(p.placementId)));
  return { operationId: crypto.randomUUID(), solutionId, timestamp: new Date().toISOString(), operationType: type, parametersJSON, beforePlacementJSON: copy(changedBefore), afterPlacementJSON: copy(changedAfter), user, note };
}
export function startEditor(sourceSolutionId: string, products: Product[], solution: Solution, user: string, palletSettings: PalletSettings = DEFAULT_PALLET): EditorState {
  const solutionId = crypto.randomUUID(), clonedProducts = structuredClone(products);
  const draft = makeSolution(solutionId, clonedProducts, solution.box, solution.spacing, copy(solution.placements), "Edited draft");
  return { solutionId, products: clonedProducts, solution: draft, past: [], future: [], audit: { sourceSolutionId, baselineCounts: { ...draft.counts }, palletSettings: { ...palletSettings }, operations: [operation(solutionId, "DUPLICATE_SOLUTION", solution.placements, draft.placements, user, { sourceSolutionId })] } };
}
export function editorSolution(state: EditorState, placements: Placement[]) {
  const result = makeSolution(state.solutionId, state.products, state.solution.box, state.solution.spacing, placements, "Edited solution");
  for (const p of state.products) if ((result.counts[p.productId] ?? 0) !== state.audit.baselineCounts[p.productId]) result.validation.errors.push(`Aantal gewijzigd ten opzichte van origineel: ${p.reference}.`);
  if (!Number.isFinite(result.weightKg) || result.weightKg < 0) result.validation.errors.push("Totaal productgewicht is ongeldig of niet numeriek berekenbaar.");
  const settings = state.audit.palletSettings, outer = outside(result.box), effective = effectivePallet(settings);
  if (![settings.palletLength, settings.palletWidth, settings.maxTotalHeight].every(n => Number.isFinite(n) && n > 0) || ![settings.palletHeight, settings.overhangLengthPerSide, settings.overhangWidthPerSide].every(n => Number.isFinite(n) && n >= 0) || ![effective.length, effective.width].every(Number.isFinite)) result.validation.errors.push("Ongeldige palletinstellingen.");
  else {
    if (!((outer.length <= effective.length + EPS && outer.width <= effective.width + EPS) || (outer.width <= effective.length + EPS && outer.length <= effective.width + EPS))) result.validation.errors.push("Buitenmaat doos overschrijdt ingestelde palletfootprint (0°/90°).");
    if (outer.height + settings.palletHeight > settings.maxTotalHeight + EPS) result.validation.errors.push("Doos plus pallethoogte overschrijdt ingestelde maximale totaalhoogte.");
  }
  result.validation.status = result.validation.errors.length ? "invalid" : "valid";
  return result;
}
export function transformItem(state: EditorState, placementId: string, patch: { x?: number; y?: number; z?: number; orientation?: Orientation }) {
  const current = state.solution.placements.find(p => p.placementId === placementId);
  if (!current) throw new Error("Selecteer een bestaand placement.");
  const product = state.products.find(p => p.productId === current.productId)!;
  if (patch.orientation && !product.rotations.includes(patch.orientation)) throw new Error("Deze rotatie is niet toegestaan.");
  if ([patch.x, patch.y, patch.z].some(n => n !== undefined && !Number.isFinite(n))) throw new Error("Coördinaten moeten eindige getallen zijn.");
  return indexLayers(state.solution.placements.map(p => p.placementId === placementId ? { ...p, ...patch, ...(patch.orientation ? rotated(product, patch.orientation) : {}) } : { ...p }));
}
export function snapItem(state: EditorState, placementId: string, targetId: string, axis: "row" | "column", join = false) {
  const p = state.solution.placements.find(q => q.placementId === placementId), target = state.solution.placements.find(q => q.placementId === targetId);
  if (!p || !target || p.placementId === target.placementId) throw new Error("Selecteer een ander doelplacement.");
  if (!join) return transformItem(state, placementId, axis === "row" ? { y: target.y, z: target.z } : { x: target.x, z: target.z });
  const row = state.solution.placements.filter(q => q.placementId !== placementId && Math.abs(q.y - target.y) <= EPS && Math.abs(q.z - target.z) <= EPS);
  const left = Math.min(...row.map(q => q.x)) - p.length, right = Math.max(...row.map(q => q.x + q.length));
  const choices = [left, right].map(x => ({ x, score: Math.abs(x - p.x), fits: x >= state.solution.spacing.length / 2 - EPS && x + p.length <= state.solution.box.length - state.solution.spacing.length / 2 + EPS }));
  choices.sort((a, b) => Number(b.fits) - Number(a.fits) || a.score - b.score);
  return transformItem(state, placementId, { x: choices[0].x, y: target.y, z: target.z });
}
export function applyEditor(state: EditorState, placements: Placement[], type: EditorOperation["operationType"], user: string, parameters: Record<string, unknown> = {}, note = ""): EditorState {
  if (state.audit.operations.length >= 200) throw new Error("Maximaal 200 gelogde draftacties; sla op en open een nieuw duplicaat.");
  const before = state.solution.placements;
  return { ...state, solution: editorSolution(state, placements), past: [...state.past, copy(before)], future: [], audit: { ...state.audit, operations: [...state.audit.operations, operation(state.solutionId, type, before, placements, user, parameters, note)] } };
}
export function travelEditor(state: EditorState, direction: "UNDO" | "REDO", user: string): EditorState {
  if (state.audit.operations.length >= 200) throw new Error("Maximaal 200 draftacties bereikt.");
  const stack = direction === "UNDO" ? state.past : state.future;
  if (!stack.length) return state;
  const placements = copy(stack[stack.length - 1]), before = state.solution.placements;
  return { ...state, solution: editorSolution(state, placements), past: direction === "UNDO" ? state.past.slice(0, -1) : [...state.past, copy(before)], future: direction === "REDO" ? state.future.slice(0, -1) : [...state.future, copy(before)], audit: { ...state.audit, operations: [...state.audit.operations, operation(state.solutionId, direction, before, placements, user)] } };
}
export function editorRemainders(placements: Placement[]): Record<string, string[]> {
  const reasons: Record<string, string[]> = {};
  const add = (p: Placement, reason: string) => { reasons[p.placementId] = [...new Set([...(reasons[p.placementId] ?? []), reason])]; };
  for (const id of detectRestPlacements(placements)) reasons[id] = ["kleine losse restgroep"];
  for (const productId of new Set(placements.map(p => p.productId))) {
    const group = placements.filter(p => p.productId === productId);
    for (const [label, key] of [["rij", (p: Placement) => `${levelKey(p.z)}:${levelKey(p.y)}`], ["kolom", (p: Placement) => `${levelKey(p.z)}:${levelKey(p.x)}`], ["laag", (p: Placement) => String(levelKey(p.z))], ["oriëntatie", (p: Placement) => p.orientation]] as const) {
      const counts = new Map<string, number>(); group.forEach(p => counts.set(key(p), (counts.get(key(p)) ?? 0) + 1));
      const max = Math.max(...counts.values());
      if (max < 2) continue;
      for (const p of group) if (counts.get(key(p))! < max) add(p, `buiten dominante ${label}`);
    }
  }
  return reasons;
}
export function overlapDiagnostics(products: Product[], placements: Placement[]) {
  const result: { placements: string[]; axis: string; overlapMm: number; toleranceMm: number; warning: string }[] = [];
  for (let i = 0; i < placements.length; i++) for (let j = i + 1; j < placements.length; j++) {
    const a = placements[i], b = placements[j]; if (!overlaps(a, b)) continue;
    const depths = [Math.min(a.x + a.length - b.x, b.x + b.length - a.x), Math.min(a.y + a.width - b.y, b.y + b.width - a.y), Math.min(a.z + a.height - b.z, b.z + b.height - a.z)];
    const axis = depths.indexOf(Math.min(...depths));
    const capacity = (p: Placement) => { const product = products.find(q => q.productId === p.productId); if (!product?.allowCompression) return 0; const d = rotated({ length: product.compressibilityX ?? 0, width: product.compressibilityY ?? 0, height: product.compressibilityZ ?? 0 }, p.orientation); return [d.length, d.width, d.height][axis]; };
    result.push({ placements: [a.placementId, b.placementId], axis: ["X", "Y", "Z"][axis], overlapMm: depths[axis], toleranceMm: capacity(a) + capacity(b), warning: "Overlapping blijft ongeldig in v1; tolerantiewaarde is diagnostiek, geen materiaalgoedkeuring." });
  }
  return result;
}
