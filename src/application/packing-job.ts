import type { Box, Product, SearchResult, SearchProfile, Spacing, Strategy } from "@/domain/packing/types";
import type { CustomSettings } from "@/domain/packing/custom-box";
export interface PackingRequest {
  mode: "search" | "custom"; products: Product[]; boxes: Box[]; spacing: Spacing;
  strategy: Strategy; profile: SearchProfile; custom: CustomSettings; maxWeightKg?: number; maxTotalLayers?: number;
}
export type PackingResponse = { result: SearchResult; elapsed?: number } | { error: string };