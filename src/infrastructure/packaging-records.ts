import type { Product, Solution } from "@/domain/packing/types";
import type { PalletResult, PalletSettings } from "@/domain/packing/pallet";

export interface CartonRecord { id: string; user_id: string; reference: string; description: string; material: string; length: number; width: number; height: number; cardboard: number; active: boolean; modified_on: string }
export interface ShapeRecord { id: string; user_id: string; shape_id: string; variant_id: string; description: string; product_group: string; format_a: number; format_b: number; format_h: number; blocked: boolean; active: boolean; modified_on: string }
export interface DefinitionRecord { id: string; user_id: string; name: string; scope: "SHAPE" | "PRODUCT"; shape_id: string; variant_id: string; packaging_mode: "STOCK" | "PERSO"; product_number: string; status: "active" | "inactive"; settings: Record<string, unknown>; current_solution_id: string | null; modified_on: string }
export interface Snapshot { contractVersion: "0.3"; products: Product[]; solution: Solution }
export interface SolutionRecord { id: string; user_id: string; definition_id: string | null; packaging_mode: "STOCK" | "PERSO"; name: string; status: "draft" | "active" | "archived"; created_from: string; based_on: string | null; snapshot: Snapshot; metadata: { notes?: string }; modified_on: string; created_on: string }
export interface ImportRecord { id: string; user_id: string; kind: "cartons" | "shapes"; filename: string; checksum: string | null; summary: { rows: number; policy: string }; created_on: string }
export interface PalletRecord { id: string; user_id: string; name: string; source: unknown; settings: PalletSettings; result: PalletResult; created_on: string }
export interface PackagingRecords { cartons: CartonRecord[]; shapes: ShapeRecord[]; definitions: DefinitionRecord[]; solutions: SolutionRecord[]; imports: ImportRecord[]; pallets: PalletRecord[] }
export type RecordKind = keyof PackagingRecords;
export const toBox = (c: CartonRecord) => ({ boxId: c.id, reference: c.reference, length: Number(c.length), width: Number(c.width), height: Number(c.height), cardboard: Number(c.cardboard) });
