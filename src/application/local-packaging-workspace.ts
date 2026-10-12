import { z } from "zod";
import type { PackagingRecords, Snapshot, SolutionRecord } from "@/infrastructure/packaging-records";
import { parseSolutionSnapshot } from "@/infrastructure/solution-snapshot";
import { palletize, type PalletSource } from "@/domain/packing/pallet";

const text = z.string().trim().min(1, "Een verplicht tekstveld ontbreekt.");
const positive = z.number().finite().positive("Maten moeten positief zijn.");
const cartonSchema = z.object({ reference: text, description: z.string().default(""), material: z.string().default(""), length: positive, width: positive, height: positive, cardboard: z.number().finite().nonnegative().default(0), active: z.boolean().default(true) });
const shapeSchema = z.object({ shape_id: text, variant_id: text, description: z.string().default(""), product_group: z.string().default(""), format_a: positive, format_b: positive, format_h: positive, blocked: z.boolean().default(false), active: z.boolean().default(true) });
const definitionSchema = z.object({ name: text, scope: z.enum(["SHAPE", "PRODUCT"]), shape_id: z.string().default(""), variant_id: z.string().default(""), product_number: z.string().default(""), packaging_mode: z.enum(["STOCK", "PERSO"]), status: z.enum(["active", "inactive"]).default("active"), settings: z.record(z.unknown()).default({}), current_solution_id: z.string().nullable().default(null) });
const solutionSchema = z.object({ name: text, definition_id: z.string().nullable().default(null), packaging_mode: z.enum(["STOCK", "PERSO"]), based_on: z.string().nullable().default(null), created_from: text.default("packing"), status: z.enum(["draft", "active", "archived"]).default("draft"), snapshot: z.unknown(), metadata: z.object({ notes: z.string().optional() }).default({}) });
const solutionUpdate = z.object({ name: text.optional(), metadata: z.object({ notes: z.string().optional() }).optional(), status: z.enum(["draft", "active", "archived"]).optional() }).strict();
const palletSettings = z.object({ palletLength: positive, palletWidth: positive, palletHeight: z.number().finite().nonnegative(), maxTotalHeight: positive, overhangLengthPerSide: z.number().finite().nonnegative(), overhangWidthPerSide: z.number().finite().nonnegative() });
const definitionKeys = ["scope", "shape_id", "variant_id", "product_number", "packaging_mode"] as const;
const owner = "local-test";
export type WritableKind = "cartons" | "definitions" | "solutions" | "pallets";

export function createLocalPackagingWorkspace() {
  let records: PackagingRecords = { cartons: [], shapes: [], definitions: [], solutions: [], imports: [], pallets: [], operations: [] };
  function write(kind: WritableKind, values: Record<string, unknown>, id?: string): { id: string } {
    const recordId = id ?? crypto.randomUUID(), now = new Date().toISOString();
    const base = { id: recordId, user_id: owner, modified_on: now };
    if (kind === "cartons") {
      const old = records.cartons.find(c => c.id === id);
      if (id && !old) throw new Error("Omdoos niet gevonden in de testwerkruimte.");
      const parsed = cartonSchema.parse({ ...old, ...values });
      if (records.cartons.some(c => c.id !== recordId && c.reference === parsed.reference)) throw new Error("Deze omdoosreferentie bestaat al.");
      const row = { ...parsed, ...base };
      records = { ...records, cartons: old ? records.cartons.map(c => c.id === id ? row : c) : [...records.cartons, row] };
    } else if (kind === "definitions") {
      const old = records.definitions.find(d => d.id === id);
      if (id && !old) throw new Error("Definitie niet gevonden in de testwerkruimte.");
      const parsed = definitionSchema.parse({ ...old, ...values });
      if (parsed.scope === "PRODUCT" && !parsed.product_number.trim()) throw new Error("Een productnummer is verplicht.");
      if (parsed.scope === "SHAPE" && !records.shapes.some(s => s.shape_id === parsed.shape_id && s.variant_id === parsed.variant_id)) throw new Error("Kies een bestaande shape-masterkey.");
      if (old && records.solutions.some(s => s.definition_id === id) && definitionKeys.some(key => old[key] !== parsed[key])) throw new Error("Een definitie met solutions kan niet van context of modus veranderen.");
      if (records.definitions.some(d => d.id !== recordId && definitionKeys.every(key => d[key] === parsed[key]))) throw new Error("Er bestaat al een definitie voor deze context en modus.");
      if (parsed.current_solution_id && !records.solutions.some(s => s.id === parsed.current_solution_id && s.definition_id === recordId && s.packaging_mode === parsed.packaging_mode && s.status !== "archived")) throw new Error("De actieve solution moet tot deze definitie behoren.");
      const row = { ...parsed, ...base };
      records = { ...records, definitions: old ? records.definitions.map(d => d.id === id ? row : d) : [...records.definitions, row] };
    } else if (kind === "solutions") {
      const old = records.solutions.find(s => s.id === id);
      if (id && !old) throw new Error("Solution niet gevonden in de testwerkruimte.");
      if (old) {
        const changes = solutionUpdate.parse(values);
        if (changes.status === "archived" && records.definitions.some(d => d.current_solution_id === id)) throw new Error("Activeer eerst een andere solution voordat je de huidige archiveert.");
        if (changes.status === "active" && old.status !== "active") throw new Error("Gebruik Als actief instellen voor het activeren van een solution.");
        const updated = { ...old, ...changes, modified_on: now };
        const changedMetadata = updated.name !== old.name || JSON.stringify(updated.metadata) !== JSON.stringify(old.metadata);
        records = { ...records, solutions: records.solutions.map(s => s.id === id ? updated : s), operations: changedMetadata ? [...records.operations, { id: crypto.randomUUID(), user_id: owner, solution_id: recordId, timestamp: now, operation_type: "EDIT_METADATA", parameters_json: { beforeName: old.name, afterName: updated.name, beforeMetadata: old.metadata, afterMetadata: updated.metadata }, before_placement_json: [], after_placement_json: [], actor: owner, note: "" }] : records.operations };
      } else {
        const parsed = solutionSchema.parse(values);
        const snapshot: Snapshot = { contractVersion: "0.3", ...parseSolutionSnapshot(JSON.stringify(parsed.snapshot)) };
        const definition = records.definitions.find(d => d.id === parsed.definition_id);
        if (parsed.definition_id && (!definition || definition.packaging_mode !== parsed.packaging_mode)) throw new Error("Definitie en solution moeten dezelfde modus hebben.");
        const parent = records.solutions.find(s => s.id === parsed.based_on);
        if (parsed.based_on && (!parent || parent.definition_id !== parsed.definition_id || parent.packaging_mode !== parsed.packaging_mode)) throw new Error("Een variant moet bij de oorspronkelijke definitie en modus blijven.");
        if (parsed.status !== "draft") throw new Error("Een nieuwe solution wordt als concept opgeslagen; activeren is een aparte handeling.");
        if (parsed.created_from === "edited" && !snapshot.editor) throw new Error("Edited solution vereist een audit.");
        if (snapshot.editor) {
          if (!parent || snapshot.editor.sourceSolutionId !== parent.id || parsed.created_from !== "edited") throw new Error("Edited solution moet de oorspronkelijke bron behouden.");
          const original = parseSolutionSnapshot(JSON.stringify(parent.snapshot));
          if (JSON.stringify(snapshot.products) !== JSON.stringify(original.products) || JSON.stringify(snapshot.solution.box) !== JSON.stringify(original.solution.box) || JSON.stringify(snapshot.solution.spacing) !== JSON.stringify(original.solution.spacing) || JSON.stringify(snapshot.solution.counts) !== JSON.stringify(original.solution.counts) || JSON.stringify(snapshot.editor.baselineCounts) !== JSON.stringify(original.solution.counts)) throw new Error("Editor v1 behoudt producten, doos, speling en oorspronkelijke aantallen.");
        }
        const row: SolutionRecord = { ...parsed, snapshot, ...base, created_on: now };
        const operations = snapshot.editor?.operations.map(op => ({ id: op.operationId, user_id: owner, solution_id: recordId, timestamp: op.timestamp, operation_type: op.operationType, parameters_json: op.parametersJSON, before_placement_json: op.beforePlacementJSON, after_placement_json: op.afterPlacementJSON, actor: owner, note: op.note })) ?? [];
        if (!snapshot.editor && parent && (parsed.created_from === "duplicate" || parsed.created_from === "variant")) operations.push({ id: crypto.randomUUID(), user_id: owner, solution_id: recordId, timestamp: now, operation_type: parsed.created_from === "duplicate" ? "DUPLICATE_SOLUTION" : "RECALCULATE", parameters_json: { sourceSolutionId: parent.id }, before_placement_json: structuredClone(parent.snapshot.solution.placements), after_placement_json: structuredClone(snapshot.solution.placements), actor: owner, note: "" });
        if (operations.some(op => records.operations.some(existing => existing.id === op.id))) throw new Error("Deze editoroperaties zijn al opgeslagen; open een nieuw duplicaat.");
        records = { ...records, solutions: [...records.solutions, row], operations: [...records.operations, ...operations] };
      }
    } else {
      if (id) throw new Error("Opgeslagen palletresultaten zijn onveranderlijk.");
      const name = text.parse(values.name), settings = palletSettings.parse(values.settings);
      const source = structuredClone(values.source) as PalletSource;
      const pattern = z.object({ pattern: text }).parse(values.result).pattern;
      // Rebuild the selected pattern from its inputs instead of trusting stored metrics.
      const result = palletize(source, settings).find(candidate => candidate.pattern === pattern);
      if (!result) throw new Error("Dit palletpatroon past niet bij de bron en instellingen.");
      records = { ...records, pallets: [...records.pallets, { id: recordId, user_id: owner, name, source, settings, result, created_on: now }] };
    }
    return { id: recordId };
  }
  function sync(kind: "cartons" | "shapes", filename: string, checksum: string | null, rows: Record<string, unknown>[]) {
    if (!rows.length || rows.length > 2000) throw new Error("Een import moet 1 tot 2000 gegevensrijen bevatten.");
    const now = new Date().toISOString();
    if (kind === "cartons") {
      const parsed = rows.map(row => cartonSchema.parse(row));
      if (new Set(parsed.map(row => row.reference)).size !== parsed.length) throw new Error("Dubbele omdoosreferenties in de import.");
      const next = new Map(records.cartons.map(row => [row.reference, row]));
      for (const row of parsed) next.set(row.reference, { ...row, id: next.get(row.reference)?.id ?? crypto.randomUUID(), user_id: owner, modified_on: now });
      records = { ...records, cartons: [...next.values()] };
    } else {
      const parsed = rows.map(row => shapeSchema.parse(row));
      const key = (row: { shape_id: string; variant_id: string }) => JSON.stringify([row.shape_id, row.variant_id]);
      if (new Set(parsed.map(key)).size !== parsed.length) throw new Error("Dubbele shape-masterkeys in de import.");
      const next = new Map(records.shapes.map(row => [key(row), row]));
      for (const row of parsed) next.set(key(row), { ...row, id: next.get(key(row))?.id ?? crypto.randomUUID(), user_id: owner, modified_on: now });
      records = { ...records, shapes: [...next.values()] };
    }
    records = { ...records, imports: [...records.imports, { id: crypto.randomUUID(), user_id: owner, kind, filename, checksum, summary: { rows: rows.length, policy: "Lokale upsert zonder verwijderen" }, created_on: now }] };
    return true;
  }
  function activate(id: string) {
    const solution = records.solutions.find(s => s.id === id);
    if (!solution || solution.status === "archived") throw new Error("Kies een bestaande, niet-gearchiveerde solution.");
    parseSolutionSnapshot(JSON.stringify(solution.snapshot));
    const now = new Date().toISOString();
    if (solution.definition_id) {
      const definition = records.definitions.find(d => d.id === solution.definition_id);
      if (!definition || definition.packaging_mode !== solution.packaging_mode) throw new Error("De solution past niet bij deze definitie.");
    }
    const oldCurrent = records.definitions.find(d => d.id === solution.definition_id)?.current_solution_id ?? null;
    if (solution.status === "active" && (!solution.definition_id || oldCurrent === id)) return true;
    records = { ...records,
      solutions: records.solutions.map(s => s.id === id ? { ...s, status: "active", modified_on: now } : solution.definition_id && s.definition_id === solution.definition_id && s.status === "active" ? { ...s, status: "draft", modified_on: now } : s),
      definitions: records.definitions.map(d => d.id === solution.definition_id ? { ...d, current_solution_id: id, modified_on: now } : d),
      operations: [...records.operations, { id: crypto.randomUUID(), user_id: owner, solution_id: id, timestamp: now, operation_type: "MAKE_CURRENT", parameters_json: { definition: solution.definition_id, oldCurrent, newCurrent: id }, before_placement_json: structuredClone(records.solutions.find(s => s.id === oldCurrent)?.snapshot.solution.placements ?? []), after_placement_json: structuredClone(solution.snapshot.solution.placements), actor: owner, note: "" }],
    };
    return true;
  }
  function saveSolution(snapshot: Snapshot, name: string, definitionId: string | null, basedOn?: string, sourceMode?: "search" | "custom") {
    const parent = records.solutions.find(s => s.id === basedOn);
    const packagingMode = sourceMode ? sourceMode === "custom" ? "PERSO" : "STOCK" : parent?.packaging_mode ?? "STOCK";
    return write("solutions", { name, definition_id: definitionId, packaging_mode: packagingMode, based_on: basedOn ?? null, created_from: snapshot.editor ? "edited" : basedOn ? sourceMode ? "variant" : "duplicate" : sourceMode === "custom" ? "custom" : "packing", snapshot, metadata: structuredClone(parent?.metadata ?? {}), status: "draft" });
  }
  return { getRecords: () => records, write, sync, activate, saveSolution };
}
