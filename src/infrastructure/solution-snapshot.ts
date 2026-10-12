import { z } from "zod";
import { ORIENTATIONS, assertInput, type Product, type Solution } from "@/domain/packing/types";
import { makeSolution } from "@/domain/packing/scoring";
import { OPERATION_TYPES, editorSolution, type EditorAudit } from "@/domain/packing/editor";
const positive = z.number().finite().positive(), nonnegative = z.number().finite().nonnegative();
const dimension = z.object({ length: positive, width: positive, height: positive });
const product = dimension.extend({ productId: z.string().min(1), reference: z.string().min(1), weightKg: nonnegative, quantity: z.number().int().positive(), rotations: z.array(z.enum(ORIENTATIONS)).min(1), maxInLength: z.number().int().positive(), maxInWidth: z.number().int().positive(), maxLayers: z.number().int().positive(), compressibilityX: nonnegative.optional(), compressibilityY: nonnegative.optional(), compressibilityZ: nonnegative.optional(), allowCompression: z.boolean().optional() });
const placement = dimension.extend({ placementId: z.string().min(1), productId: z.string().min(1), x: z.number().finite(), y: z.number().finite(), z: z.number().finite(), orientation: z.enum(ORIENTATIONS), layerIndex: z.number().int().nonnegative() });
const editor = z.object({ sourceSolutionId: z.string().min(1), baselineCounts: z.record(z.number().int().nonnegative()), palletSettings: z.object({ palletLength: positive, palletWidth: positive, palletHeight: nonnegative, maxTotalHeight: positive, overhangLengthPerSide: nonnegative, overhangWidthPerSide: nonnegative }), operations: z.array(z.object({ operationId: z.string().uuid(), solutionId: z.string().min(1), timestamp: z.string().datetime(), operationType: z.enum(OPERATION_TYPES), parametersJSON: z.record(z.unknown()), beforePlacementJSON: z.array(placement).max(300), afterPlacementJSON: z.array(placement).max(300), user: z.string().min(1), note: z.string() })).min(1).max(202) });
const schema = z.object({ contractVersion: z.literal("0.3"), products: z.array(product).min(1).max(5), editor: editor.optional(), solution: z.object({ solutionId: z.string().min(1), box: dimension.extend({ boxId: z.string().min(1), reference: z.string(), cardboard: nonnegative }), spacing: z.object({ length: nonnegative, width: nonnegative, height: nonnegative }), placements: z.array(placement).min(1).max(300) }) });
export function parseSolutionSnapshot(text: string): { products: Product[]; solution: Solution; editor?: EditorAudit } {
  const result = schema.safeParse(JSON.parse(text));
  if (!result.success) throw new Error("Ongeldig solutionbestand; verwacht een volledig snapshot met contractVersion 0.3 en geldige auditvelden.");
  const { products, solution, editor: audit } = result.data;
  assertInput(products, solution.spacing, [solution.box]);
  let rebuilt = makeSolution(solution.solutionId, products, solution.box, solution.spacing, solution.placements, audit ? "Edited solution" : "ingelezen snapshot");
  if (audit) {
    if (new Set(audit.operations.map(op => op.operationId)).size !== audit.operations.length) throw new Error("Dubbele operationId in de editoraudit.");
    rebuilt = editorSolution({ solutionId: solution.solutionId, products, solution: rebuilt, audit, past: [], future: [] }, solution.placements);
  }
  if (rebuilt.validation.status !== "valid") throw new Error(rebuilt.validation.errors.join(" "));
  return { products, solution: rebuilt, ...(audit ? { editor: audit } : {}) };
}
export function downloadSolutionSnapshot(solution: Solution, products: Product[], editor?: EditorAudit) {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ contractVersion: "0.3", products, solution, ...(editor ? { editor } : {}) }, null, 2)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = "packaging-solution.json"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
