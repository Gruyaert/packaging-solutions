import { z } from "zod";
import { ORIENTATIONS, assertInput, type Product, type Solution } from "@/domain/packing/types";
import { makeSolution } from "@/domain/packing/scoring";
const positive = z.number().finite().positive();
const dimension = z.object({ length: positive, width: positive, height: positive });
const product = dimension.extend({ productId: z.string().min(1), reference: z.string().min(1), weightKg: z.number().finite().nonnegative(), quantity: z.number().int().positive(), rotations: z.array(z.enum(ORIENTATIONS)).min(1), maxInLength: z.number().int().positive(), maxInWidth: z.number().int().positive(), maxLayers: z.number().int().positive() });
const schema = z.object({ contractVersion: z.literal("0.3"), products: z.array(product).min(1).max(5), solution: z.object({ solutionId: z.string().min(1), box: dimension.extend({ boxId: z.string().min(1), reference: z.string(), cardboard: z.number().finite().nonnegative() }), spacing: z.object({ length: z.number().finite().nonnegative(), width: z.number().finite().nonnegative(), height: z.number().finite().nonnegative() }), placements: z.array(dimension.extend({ placementId: z.string().min(1), productId: z.string().min(1), x: z.number().finite(), y: z.number().finite(), z: z.number().finite(), orientation: z.enum(ORIENTATIONS), layerIndex: z.number().int().nonnegative() })).min(1).max(300) }) });
export function parseSolutionSnapshot(text: string): { products: Product[]; solution: Solution } {
  const result = schema.safeParse(JSON.parse(text));
  if (!result.success) throw new Error("Ongeldig solutionbestand; verwacht een volledig snapshot met contractVersion 0.3.");
  const { products, solution } = result.data as { products: Product[]; solution: Pick<Solution, "solutionId" | "box" | "spacing" | "placements"> };
  assertInput(products, solution.spacing, [solution.box]);
  const rebuilt = makeSolution(solution.solutionId, products, solution.box, solution.spacing, solution.placements, "ingelezen snapshot");
  if (rebuilt.validation.status !== "valid") throw new Error(rebuilt.validation.errors.join(" "));
  return { products, solution: rebuilt };
}
export function downloadSolutionSnapshot(solution: Solution, products: Product[]) {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ contractVersion: "0.3", products, solution }, null, 2)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = "packaging-solution.json"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
