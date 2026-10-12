import type { Box, Product, SearchResult, Spacing, Strategy } from "@/domain/packing/types";
import type { CustomSettings } from "@/domain/packing/custom-box";
export interface PackingRequest {
  mode: "search" | "custom"; products: Product[]; boxes: Box[]; spacing: Spacing;
  strategy: Strategy; custom: CustomSettings; maxWeightKg?: number; maxTotalLayers?: number;
}
export type PackingResponse = { result: SearchResult & { rejected?: { pattern: string; errors: string[] }[] }; elapsed?: number } | { error: string };
