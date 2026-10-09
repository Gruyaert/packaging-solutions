import { searchPackaging } from "@/domain/packing/engine";
import { customBoxes } from "@/domain/packing/custom-box";
import type { PackingRequest, PackingResponse } from "./packing-job";
const scope = self as unknown as { onmessage: ((event: MessageEvent<PackingRequest>) => void) | null; postMessage(message: PackingResponse): void };
scope.onmessage = ({ data }) => {
  try {
    const result = data.mode === "custom"
      ? customBoxes(data.products, data.spacing, data.custom, { maxAttempts: 96, maxPlacements: 300 })
      : searchPackaging(data.products, data.boxes, data.spacing, data.strategy, { maxAttempts: 96, maxPlacements: 300, maxWeightKg: data.maxWeightKg, maxTotalLayers: data.maxTotalLayers });
    scope.postMessage({ result });
  } catch (error) {
    scope.postMessage({ error: error instanceof Error ? error.message : "Berekening mislukt." });
  }
};
