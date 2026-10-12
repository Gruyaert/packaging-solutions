import { describe, expect, it } from "vitest";
import { applyEditor, editorRemainders, editorSolution, overlapDiagnostics, snapItem, startEditor, transformItem, travelEditor } from "./editor";
import { makeSolution } from "./scoring";
import type { Placement, Product } from "./types";
import { parseSolutionSnapshot } from "@/infrastructure/solution-snapshot";
import { createLocalPackagingWorkspace } from "@/application/local-packaging-workspace";
const actor = "local-test";
function fixture() {
  const product: Product = { productId: "p", reference: "Fixture", length: 20, width: 10, height: 10, weightKg: 0.1, quantity: 3, maxInLength: 20, maxInWidth: 20, maxLayers: 5, rotations: ["L-B-H", "B-L-H"] };
  const placements: Placement[] = [{ placementId: "a", productId: "p", x: 0, y: 0, z: 0, length: 20, width: 10, height: 10, orientation: "L-B-H", layerIndex: 0 }, { placementId: "b", productId: "p", x: 20, y: 0, z: 0, length: 20, width: 10, height: 10, orientation: "L-B-H", layerIndex: 0 }, { placementId: "rest", productId: "p", x: 60, y: 30, z: 0, length: 20, width: 10, height: 10, orientation: "L-B-H", layerIndex: 0 }];
  const products = [product], solution = makeSolution("fixture", products, { boxId: "box", reference: "Fixture doos", length: 100, width: 80, height: 30, cardboard: 2 }, { length: 0, width: 0, height: 0 }, placements, "fixture");
  return { products, solution, draft: startEditor("source", products, solution, actor) };
}
describe("Packing Solution Editor v1", () => {
  it("duplicates all physical inputs without mutating or aliasing the original", () => {
    const { products, solution, draft } = fixture(), before = JSON.stringify({ products, solution });
    const moved = applyEditor(draft, transformItem(draft, "rest", { x: 65 }), "MOVE_ITEM", actor);
    expect(moved.solution.placements.find(p => p.placementId === "rest")?.x).toBe(65);
    expect(JSON.stringify({ products, solution })).toBe(before);
    expect(draft.solutionId).not.toBe(solution.solutionId);
    expect(draft.audit.operations[0].operationType).toBe("DUPLICATE_SOLUTION");
    expect(draft.products).not.toBe(products);
  });
  it("uses nominal rotated dimensions and refuses forbidden orientations", () => {
    const { draft } = fixture();
    const rotated = transformItem(draft, "a", { orientation: "B-L-H" });
    expect(rotated[0]).toMatchObject({ length: 10, width: 20, height: 10 });
    expect(() => transformItem(draft, "a", { orientation: "H-L-B" })).toThrow("niet toegestaan");
    expect(() => transformItem(draft, "a", { x: NaN })).toThrow("eindige");
  });
  it("previews join-to-row before applying; removes the isolated remainder", () => {
    const { draft } = fixture();
    expect(editorRemainders(draft.solution.placements).rest).toContain("buiten dominante rij");
    const proposal = snapItem(draft, "rest", "a", "row", true);
    expect(proposal.find(p => p.placementId === "rest")).toMatchObject({ x: 40, y: 0 });
    expect(draft.solution.placements[2].y).toBe(30);
    const edited = applyEditor(draft, proposal, "SNAP_TO_ROW", actor, { targetId: "a" });
    expect(edited.solution.validation.status).toBe("valid");
    expect(editorRemainders(edited.solution.placements).rest).toBeUndefined();
    expect(edited.audit.operations.at(-1)?.parametersJSON.targetId).toBe("a");
  });
  it("snaps to columns and checks overlapping row proposals", () => {
    const { draft } = fixture();
    expect(snapItem(draft, "rest", "a", "column")[2]).toMatchObject({ x: 0, y: 30, z: 0 });
    expect(editorSolution(draft, transformItem(draft, "b", { x: 10 })).validation.overlapAnalysis.valid).toBe(false);
    expect(() => snapItem(draft, "a", "a", "row")).toThrow("ander");
  });
  it("records undo/redo and clears redo on a new branch", () => {
    const { draft } = fixture(), edited = applyEditor(draft, transformItem(draft, "rest", { y: 40 }), "MOVE_ITEM", actor);
    const undone = travelEditor(edited, "UNDO", actor), redone = travelEditor(undone, "REDO", actor);
    expect(undone.solution.placements).toEqual(draft.solution.placements);
    expect(redone.solution.placements).toEqual(edited.solution.placements);
    expect(redone.audit.operations.map(op => op.operationType)).toEqual(["DUPLICATE_SOLUTION", "MOVE_ITEM", "UNDO", "REDO"]);
    expect(applyEditor(undone, transformItem(undone, "rest", { y: 35 }), "MOVE_ITEM", actor).future).toHaveLength(0);
  });
  it("reports nominal-axis compression but never silently accepts overlap", () => {
    const { products, solution } = fixture(); products[0].allowCompression = true; products[0].compressibilityX = 3; products[0].compressibilityY = 1;
    const draft = startEditor("source", products, solution, actor);
    const placements = transformItem(draft, "b", { x: 19, orientation: "B-L-H" });
    const diagnostic = overlapDiagnostics(products, placements)[0];
    expect(diagnostic).toMatchObject({ axis: "X", overlapMm: 1, toleranceMm: 4 });
    expect(editorSolution(draft, placements).validation.status).toBe("invalid");
    expect(placements[1]).toMatchObject({ length: 10, width: 20 });
  });
  it("checks preserved counts, support, bounds, top clearance and pallet outside footprint", () => {
    const { draft } = fixture();
    expect(editorSolution(draft, draft.solution.placements.slice(1)).validation.errors.join(" ")).toContain("Aantal gewijzigd");
    expect(editorSolution(draft, transformItem(draft, "rest", { z: 5 })).validation.gravityCheck.valid).toBe(false);
    expect(editorSolution(draft, transformItem(draft, "rest", { x: -1 })).validation.boundsCheck.valid).toBe(false);
    expect(editorSolution(draft, transformItem(draft, "rest", { z: 21 })).validation.boundsCheck.valid).toBe(false);
    const tooSmall = { ...draft, audit: { ...draft.audit, palletSettings: { ...draft.audit.palletSettings, palletLength: 100, palletWidth: 80 } } };
    expect(editorSolution(tooSmall, tooSmall.solution.placements).validation.errors.join(" ")).toContain("palletfootprint");
    const tooLow = { ...draft, audit: { ...draft.audit, palletSettings: { ...draft.audit.palletSettings, maxTotalHeight: 150 } } };
    expect(editorSolution(tooLow, tooLow.solution.placements).validation.errors.join(" ")).toContain("totaalhoogte");
  });
  it("rebuilds snapshot validation and refuses forged green status for invalid geometry", () => {
    const { draft } = fixture(), invalid = editorSolution(draft, transformItem(draft, "b", { x: 10 }));
    invalid.validation.status = "valid";
    expect(() => parseSolutionSnapshot(JSON.stringify({ contractVersion: "0.3", products: draft.products, solution: invalid, editor: draft.audit }))).toThrow("Overlappende");
  });
  it("saves a new edited solution, keeps original content and audits activation/metadata", () => {
    const { products, solution } = fixture(), workspace = createLocalPackagingWorkspace();
    const definition = workspace.write("definitions", { name: "D", scope: "PRODUCT", product_number: "P", packaging_mode: "STOCK" });
    const original = workspace.saveSolution({ contractVersion: "0.3", products, solution }, "Original", definition.id);
    const before = JSON.stringify(workspace.getRecords().solutions[0].snapshot);
    workspace.activate(original.id);
    const draft = startEditor(original.id, products, solution, actor), edited = applyEditor(draft, snapItem(draft, "rest", "a", "row", true), "SNAP_TO_ROW", actor);
    const saved = workspace.saveSolution({ contractVersion: "0.3", products, solution: edited.solution, editor: edited.audit }, "Edited", definition.id, original.id);
    const record = workspace.getRecords().solutions.find(s => s.id === saved.id)!;
    expect(record).toMatchObject({ status: "draft", created_from: "edited", based_on: original.id });
    expect(JSON.stringify(workspace.getRecords().solutions[0].snapshot)).toBe(before);
    expect(record.snapshot.editor?.operations).toHaveLength(2);
    workspace.activate(saved.id); workspace.write("solutions", { name: "Nieuwe naam" }, saved.id);
    const log = workspace.getRecords().operations.filter(op => op.solution_id === saved.id);
    expect(log.map(op => op.operation_type)).toEqual(["DUPLICATE_SOLUTION", "SNAP_TO_ROW", "MAKE_CURRENT", "EDIT_METADATA"]);
    expect(log.find(op => op.operation_type === "MAKE_CURRENT")?.parameters_json.oldCurrent).toBe(original.id);
    expect(log.every(op => op.actor === actor)).toBe(true);
    expect(workspace.getRecords().definitions[0].current_solution_id).toBe(saved.id);
    expect(JSON.stringify(workspace.getRecords().solutions[0].snapshot)).toBe(before);
    expect(() => workspace.write("solutions", { snapshot: record.snapshot }, original.id)).toThrow();
  });
  it("rejects invalid edited saves atomically and bounds operation history", () => {
    const { products, solution } = fixture(), workspace = createLocalPackagingWorkspace();
    const original = workspace.saveSolution({ contractVersion: "0.3", products, solution }, "Original", null);
    const draft = startEditor(original.id, products, solution, actor), invalid = applyEditor(draft, transformItem(draft, "b", { x: 10 }), "MOVE_ITEM", actor);
    expect(() => workspace.saveSolution({ contractVersion: "0.3", products, solution: invalid.solution, editor: invalid.audit }, "Invalid", null, original.id)).toThrow("Overlappende");
    expect(workspace.getRecords().solutions).toHaveLength(1);
    expect(workspace.getRecords().operations).toHaveLength(0);
    const full = { ...draft, audit: { ...draft.audit, operations: Array.from({ length: 200 }, () => draft.audit.operations[0]) } };
    expect(() => applyEditor(full, full.solution.placements, "MOVE_ITEM", actor)).toThrow("200");
  });
});
