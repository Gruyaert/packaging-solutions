import { describe, expect, it } from "vitest";
import { createLocalPackagingWorkspace } from "./local-packaging-workspace";
import { makeSolution } from "@/domain/packing/scoring";
import { DEFAULT_PALLET, palletize } from "@/domain/packing/pallet";
import type { Product } from "@/domain/packing/types";
import type { Snapshot } from "@/infrastructure/packaging-records";

const carton = { reference: "Fixture doos", length: 100, width: 100, height: 100, cardboard: 0 };
function snapshot(): Snapshot {
  const product: Product = { productId: "fixture", reference: "Testfixture", length: 10, width: 10, height: 10, weightKg: 0.1, quantity: 1, rotations: ["L-B-H"], maxInLength: 1, maxInWidth: 1, maxLayers: 1 };
  const box = { ...carton, boxId: "fixture-box" };
  const solution = makeSolution("fixture-solution", [product], box, { length: 0, width: 0, height: 0 }, [{ placementId: "fixture-placement", productId: product.productId, x: 0, y: 0, z: 0, length: 10, width: 10, height: 10, orientation: "L-B-H", layerIndex: 0 }], "testfixture");
  return { contractVersion: "0.3", products: [product], solution };
}
const definition = (product: string, mode: "STOCK" | "PERSO" = "STOCK") => ({ name: "Fixture definitie", scope: "PRODUCT", product_number: product, packaging_mode: mode });

describe("Isolated ephemeral workspace", () => {
  it("starts empty and each instance is independent", () => {
    const first = createLocalPackagingWorkspace(), second = createLocalPackagingWorkspace();
    expect(Object.values(first.getRecords()).every(rows => rows.length === 0)).toBe(true);
    first.write("cartons", carton);
    expect(second.getRecords().cartons).toHaveLength(0);
    expect(createLocalPackagingWorkspace().getRecords().cartons).toHaveLength(0);
    expect(first.getRecords().cartons[0].user_id).toBe("local-test");
  });
  it("supports carton changes and rejects duplicate references", () => {
    const workspace = createLocalPackagingWorkspace(), saved = workspace.write("cartons", carton);
    workspace.write("cartons", { active: false, length: 200 }, saved.id);
    expect(workspace.getRecords().cartons[0]).toMatchObject({ id: saved.id, active: false, length: 200 });
    expect(() => workspace.write("cartons", carton)).toThrow("bestaat al");
  });
  it("validates all rows before applying imports and records history without deletions", () => {
    const workspace = createLocalPackagingWorkspace();
    const original = workspace.write("cartons", carton);
    expect(() => workspace.sync("cartons", "invalid.xlsx", null, [{ ...carton, reference: "Nieuwe doos" }, { ...carton, length: -1 }])).toThrow();
    expect(workspace.getRecords().cartons).toHaveLength(1);
    expect(workspace.getRecords().imports).toHaveLength(0);
    workspace.sync("cartons", "valid.xlsx", "fixture-checksum", [{ ...carton, length: 150 }, { ...carton, reference: "Nieuwe doos" }]);
    expect(workspace.getRecords().cartons.find(c => c.reference === carton.reference)).toMatchObject({ id: original.id, length: 150 });
    workspace.sync("cartons", "subset.xlsx", null, [{ ...carton, length: 160 }]);
    expect(workspace.getRecords().cartons).toHaveLength(2);
    expect(workspace.getRecords().imports).toHaveLength(2);
  });
  it("imports shapes and requires an existing masterkey for a SHAPE definition", () => {
    const workspace = createLocalPackagingWorkspace();
    const values = { name: "Shape fixture", scope: "SHAPE", shape_id: "S", variant_id: "V", packaging_mode: "STOCK" };
    expect(() => workspace.write("definitions", values)).toThrow("shape-masterkey");
    workspace.sync("shapes", "shapes.xlsx", null, [{ shape_id: "S", variant_id: "V", format_a: 10, format_b: 20, format_h: 30 }]);
    workspace.write("definitions", values);
    expect(workspace.getRecords().shapes).toHaveLength(1);
    expect(workspace.getRecords().definitions).toHaveLength(1);
  });
  it("preserves physical snapshots, original lineage and mode/context boundaries", () => {
    const workspace = createLocalPackagingWorkspace();
    const stock = workspace.write("definitions", definition("P"));
    const perso = workspace.write("definitions", definition("P", "PERSO"));
    const input = snapshot();
    const original = workspace.saveSolution(input, "Origineel", stock.id);
    const before = JSON.stringify(workspace.getRecords().solutions[0].snapshot);
    input.products[0].length = 99;
    const copy = workspace.saveSolution(workspace.getRecords().solutions[0].snapshot, "Kopie", stock.id, original.id);
    expect(workspace.getRecords().solutions.find(s => s.id === copy.id)?.based_on).toBe(original.id);
    expect(JSON.stringify(workspace.getRecords().solutions[0].snapshot)).toBe(before);
    expect(() => workspace.write("solutions", { snapshot: snapshot() }, original.id)).toThrow();
    expect(() => workspace.saveSolution(snapshot(), "Verkeerde modus", perso.id, original.id, "custom")).toThrow("variant");
    expect(() => workspace.write("definitions", { packaging_mode: "PERSO" }, stock.id)).toThrow("context");
  });
  it("replaces the active pointer atomically and protects current snapshots from archive", () => {
    const workspace = createLocalPackagingWorkspace(), d = workspace.write("definitions", definition("A"));
    const first = workspace.saveSolution(snapshot(), "Eerste", d.id), second = workspace.saveSolution(snapshot(), "Tweede", d.id);
    workspace.activate(first.id);
    expect(() => workspace.write("solutions", { status: "archived" }, first.id)).toThrow("eerst");
    workspace.activate(second.id);
    expect(workspace.getRecords().definitions[0].current_solution_id).toBe(second.id);
    expect(workspace.getRecords().solutions.find(s => s.id === first.id)?.status).toBe("draft");
    workspace.write("solutions", { name: "Historie", metadata: { notes: "Lokaal" }, status: "archived" }, first.id);
    expect(() => workspace.activate(first.id)).toThrow("niet-gearchiveerde");
  });
  it("stores an actual pallet pattern as an immutable result", () => {
    const workspace = createLocalPackagingWorkspace();
    const source = { kind: "database" as const, box: snapshot().solution.box };
    const settings = { ...DEFAULT_PALLET, maxTotalHeight: 344 };
    const result = palletize(source, settings)[0];
    const saved = workspace.write("pallets", { name: "Pallet fixture", source, settings, result });
    expect(workspace.getRecords().pallets[0].result.totalBoxes).toBe(result.totalBoxes);
    expect(() => workspace.write("pallets", { name: "Gewijzigd" }, saved.id)).toThrow("onveranderlijk");
  });
});
