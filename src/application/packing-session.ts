import type { CustomSettings } from "@/domain/packing/custom-box";
import type { PackingResponse } from "./packing-job";
import type { Box, Product, Solution, Sorting, Spacing, Strategy } from "@/domain/packing/types";

export type PackingSessionResponse = Extract<PackingResponse, { result: unknown }>;

export interface PackingSessionState {
  mode: "search" | "custom";
  products: (Product & { inputWeight: number; weightUnit: "g" | "kg" })[];
  source: string;
  strategy: Strategy;
  sorting: Sorting;
  exact: boolean;
  spacing: Spacing;
  custom: CustomSettings;
  manual: Box[];
  maxWeight: number;
  maxLayers: number;
  response?: PackingSessionResponse;
  resultProducts: Product[];
  resultMode: "search" | "custom";
  selectedId: string;
  selectedSolution?: Solution;
  definitionId?: string;
}

const key = "packaging-packing-session-v1";

export function readPackingSession(): PackingSessionState | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const value = window.sessionStorage.getItem(key);
    return value ? JSON.parse(value) as PackingSessionState : undefined;
  } catch {
    return undefined;
  }
}

export function writePackingSession(value: PackingSessionState) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Session storage is optional; the live React state remains authoritative.
  }
}

export function clearPackingSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(key);
}

export function selectedPackingSessionSolution(session?: PackingSessionState) {
  if (!session?.response) return session?.selectedSolution;
  return session.response.result.solutions.find(solution => solution.solutionId === session.selectedId) ?? session.selectedSolution;
}
