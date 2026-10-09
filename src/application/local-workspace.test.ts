import { describe, expect, it } from "vitest";
import { LocalWorkspace } from "./local-workspace";
import { makeSolution } from "@/domain/packing/scoring";
import type { Product } from "@/domain/packing/types";
import type { Snapshot } from "@/infrastructure/packaging-records";

const carton = { reference: "Testfixture", length: 100, width: 80, height: 20, cardboard: 0 };
function snapshot(): Snapshot {
  const product: Product = { productId: "fixture", reference: "Testfixture", length: 100, width: 80, height: 20, quantity: 1, weightKg: 0.1, rotations: ["L-B-H"], maxInLength: 1, maxInWidth: 1, maxLayers: 1 };
  const solution = makeSolution("fixture-solution", [product], { ...carton, boxId: "fixture-box" }, { length: 0, width: 0, height: 0 }, [{ placementId: "fixture-placement", productId: product.productId, x: 0, y: 0, z: 0, length: 100, width: 80, height: 20, orientation: "L-B-H", layerIndex: 0 }], "testfixture");
  return { contractVersion: "0.3", products: [product], solution };
}
const definition = (workspace: LocalWorkspace, product = "fixture", mode = "STOCK") => workspace.write("definitions", { name: "Testdefinitie", scope: "PRODUCT", product_number: product, packaging_mode: mode });

describe("Lokale testwerkruimte", () => {
  it("begint leeg en deelt geen gegevens tussen instanties", () => {
    const first = new LocalWorkspace(), second = new LocalWorkspace();
    first.write("cartons", carton);
    expect(first.records.cartons).toHaveLength(1);
    expect(second.records.cartons).toHaveLength(0);
  });
  it("bewaart carton-ID bij upsert en verwijdert geen ontbrekende records", () => {
    const workspace = new LocalWorkspace(), original = workspace.write("cartons", carton);
    workspace.write("cartons", { ...carton, reference: "Andere fixture" });
    workspace.sync("cartons", "fixture.xlsx", null, [{ ...carton, length: 120 }]);
    expect(workspace.records.cartons).toHaveLength(2);
    expect(workspace.records.cartons.find(c => c.reference === carton.reference)).toMatchObject({ id: original.id, length: 120 });
    expect(workspace.records.imports).toHaveLength(1);
  });
  it("importeert nooit gedeeltelijk bij ongeldige of dubbele rijen", () => {
    const workspace = new LocalWorkspace();
    const before = JSON.stringify(workspace.records);
    expect(() => workspace.sync("cartons", "fixture.xlsx", null, [carton, { ...carton, reference: "Ongeldig", height: -1 }])).toThrow();
    expect(() => workspace.sync("cartons", "fixture.xlsx", null, [carton, carton])).toThrow();
    expect(JSON.stringify(workspace.records)).toBe(before);
  });
  it("houdt shapes readonly en ondersteunt definitie op een geïmporteerde masterkey", () => {
    const workspace = new LocalWorkspace();
    workspace.sync("shapes", "fixture.xlsx", null, [{ shape_id: "fixture", variant_id: "1", format_a: 100, format_b: 80, format_h: 20 }]);
    expect(workspace.records.shapes).toHaveLength(1);
    workspace.write("definitions", { name: "Shapedefinitie", scope: "SHAPE", shape_id: "fixture", variant_id: "1", packaging_mode: "STOCK" });
    expect(workspace.records.definitions).toHaveLength(1);
  });
  it("bewaart originele geometrie, scoped active pointer en variantafkomst", () => {
    const workspace = new LocalWorkspace(), context = definition(workspace), input = snapshot();
    const first = workspace.saveSolution(input, "Origineel", context.id);
    input.products[0].length = 999;
    workspace.activate(first.id);
    expect(() => workspace.write("solutions", { status: "archived" }, first.id)).toThrow();
    expect(() => workspace.write("solutions", { snapshot: snapshot() }, first.id)).toThrow();
    const copy = workspace.saveSolution(workspace.records.solutions[0].snapshot, "Variant", context.id, first.id);
    workspace.activate(copy.id);
    expect(workspace.records.definitions[0].current_solution_id).toBe(copy.id);
    expect(workspace.records.solutions[0].status).toBe("draft");
    expect(workspace.records.solutions[0].snapshot.products[0].length).toBe(100);
    expect(workspace.records.solutions[1].based_on).toBe(first.id);
    workspace.write("solutions", { status: "archived" }, first.id);
  });
  it("weigert definitie- of moduswissels voor varianten", () => {
    const workspace = new LocalWorkspace(), firstContext = definition(workspace), otherContext = definition(workspace, "andere-fixture");
    const first = workspace.saveSolution(snapshot(), "Origineel", firstContext.id);
    expect(() => workspace.saveSolution(snapshot(), "Andere context", otherContext.id, first.id)).toThrow();
    expect(() => workspace.saveSolution(snapshot(), "Andere modus", firstContext.id, first.id, "custom")).toThrow();
    expect(workspace.records.solutions).toHaveLength(1);
  });
});
