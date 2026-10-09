import { z } from "zod";
import type { CartonRecord, DefinitionRecord, PackagingRecords, PalletRecord, ShapeRecord, Snapshot, SolutionRecord } from "@/infrastructure/packaging-records";
import { parseSolutionSnapshot } from "@/infrastructure/solution-snapshot";

// Runtime parsing ensures required fields; Zod inference widens them with strictNullChecks disabled.
type CartonFields = Omit<CartonRecord, "id" | "user_id" | "modified_on">;
type ShapeFields = Omit<ShapeRecord, "id" | "user_id" | "modified_on">;
type DefinitionFields = Omit<DefinitionRecord, "id" | "user_id" | "modified_on" | "current_solution_id">;
const name = z.string().trim().min(1, "Een naam of referentie is verplicht.");
const positive = z.number().finite().positive();
const cartonSchema = z.object({ reference: name, description: z.string().default(""), material: z.string().default(""), length: positive, width: positive, height: positive, cardboard: z.number().finite().nonnegative().default(0), active: z.boolean().default(true) }).strict();
const shapeSchema = z.object({ shape_id: name, variant_id: name, description: z.string().default(""), product_group: z.string().default(""), format_a: positive, format_b: positive, format_h: positive, blocked: z.boolean().default(false), active: z.boolean().default(true) }).strict();
const definitionSchema = z.object({ name, scope: z.enum(["SHAPE", "PRODUCT"]), shape_id: z.string().default(""), variant_id: z.string().default(""), product_number: z.string().default(""), packaging_mode: z.enum(["STOCK", "PERSO"]), settings: z.record(z.unknown()).default({}), status: z.enum(["active", "inactive"]).default("active") }).strict();
const metadataSchema = z.object({ notes: z.string().optional() }).strict();
const solutionUpdate = z.object({ name: name.optional(), metadata: metadataSchema.optional(), status: z.enum(["draft", "archived"]).optional() }).strict();
const definitionKey = (d: Pick<DefinitionRecord, "scope" | "shape_id" | "variant_id" | "product_number" | "packaging_mode">) => JSON.stringify([d.scope, d.shape_id, d.variant_id, d.product_number, d.packaging_mode]);
const localOwner = "local-test";

export class LocalWorkspace {
  records: PackagingRecords = { cartons: [], shapes: [], definitions: [], solutions: [], imports: [], pallets: [] };

  write(kind: "cartons" | "definitions" | "solutions" | "pallets", values: Record<string, unknown>, id?: string): { id: string } {
    const data = structuredClone(values), now = new Date().toISOString();
    const base = { id: id ?? crypto.randomUUID(), user_id: localOwner, modified_on: now };
    if (kind === "cartons") {
      const old = id ? this.records.cartons.find(c => c.id === id) : undefined;
      if (id && !old) throw new Error("Omdoos niet gevonden in de testwerkruimte.");
      const patch = cartonSchema.partial().parse(data);
      const fields = cartonSchema.parse(old ? { reference: old.reference, description: old.description, material: old.material, length: old.length, width: old.width, height: old.height, cardboard: old.cardboard, active: old.active, ...patch } : data) as CartonFields;
      if (this.records.cartons.some(c => c.id !== id && c.reference === fields.reference)) throw new Error("Deze omdoosreferentie bestaat al.");
      const record: CartonRecord = { ...base, ...fields };
      this.records = { ...this.records, cartons: old ? this.records.cartons.map(c => c.id === id ? record : c) : [...this.records.cartons, record] };
    } else if (kind === "definitions") {
      const old = id ? this.records.definitions.find(d => d.id === id) : undefined;
      if (id && !old) throw new Error("Definitie niet gevonden in de testwerkruimte.");
      let record: DefinitionRecord;
      if (old) {
        const patch = z.object({ name: name.optional(), status: z.enum(["active", "inactive"]).optional() }).strict().parse(data);
        record = { ...old, ...patch, modified_on: now };
      } else {
        const fields = definitionSchema.parse(data) as DefinitionFields;
        if (fields.scope === "PRODUCT" ? !fields.product_number.trim() || !!fields.shape_id || !!fields.variant_id : !this.records.shapes.some(s => s.shape_id === fields.shape_id && s.variant_id === fields.variant_id) || !!fields.product_number) throw new Error("Kies een bestaande shapekey of een productnummer zonder shapekey.");
        if (this.records.definitions.some(d => definitionKey(d) === definitionKey(fields))) throw new Error("Deze definitiecontext bestaat al.");
        record = { ...base, ...fields, current_solution_id: null };
      }
      this.records = { ...this.records, definitions: old ? this.records.definitions.map(d => d.id === id ? record : d) : [...this.records.definitions, record] };
    } else if (kind === "solutions") {
      if (!id) throw new Error("Gebruik de gevalideerde solution-opslag om een lokale snapshot te maken.");
      const old = this.records.solutions.find(s => s.id === id);
      if (!old) throw new Error("Solution niet gevonden in de testwerkruimte.");
      const patch = solutionUpdate.parse(data);
      if (patch.status === "archived" && this.records.definitions.some(d => d.current_solution_id === id)) throw new Error("Activeer eerst een andere solution voor deze definitie.");
      const record: SolutionRecord = { ...old, ...patch, modified_on: now };
      this.records = { ...this.records, solutions: this.records.solutions.map(s => s.id === id ? record : s) };
    } else {
      if (id) throw new Error("Opgeslagen palletresultaten zijn onveranderlijk.");
      const record = { ...data, ...base, name: name.parse(data.name), created_on: now } as unknown as PalletRecord;
      this.records = { ...this.records, pallets: [...this.records.pallets, record] };
    }
    return { id: base.id };
  }

  sync(kind: "cartons" | "shapes", filename: string, checksum: string | null, rows: Record<string, unknown>[]): boolean {
    if (!rows.length || rows.length > 2000) throw new Error("Een import moet 1 tot 2000 records bevatten.");
    const now = new Date().toISOString(), keys = new Set<string>();
    let cartons = this.records.cartons, shapes = this.records.shapes;
    // Stage every validated row first; a failure never commits a partial import or history.
    if (kind === "cartons") {
      const parsed = rows.map(row => cartonSchema.parse(structuredClone(row)) as CartonFields);
      cartons = [...cartons];
      for (const fields of parsed) {
        if (keys.has(fields.reference)) throw new Error("Dubbele referentie in de import.");
        keys.add(fields.reference);
        const index = cartons.findIndex(c => c.reference === fields.reference);
        const record: CartonRecord = { ...fields, id: index >= 0 ? cartons[index].id : crypto.randomUUID(), user_id: localOwner, modified_on: now };
        if (index < 0) cartons.push(record); else cartons[index] = record;
      }
    } else {
      const parsed = rows.map(row => shapeSchema.parse(structuredClone(row)) as ShapeFields);
      shapes = [...shapes];
      for (const fields of parsed) {
        const key = JSON.stringify([fields.shape_id, fields.variant_id]);
        if (keys.has(key)) throw new Error("Dubbele shapekey in de import.");
        keys.add(key);
        const index = shapes.findIndex(s => s.shape_id === fields.shape_id && s.variant_id === fields.variant_id);
        const record: ShapeRecord = { ...fields, id: index >= 0 ? shapes[index].id : crypto.randomUUID(), user_id: localOwner, modified_on: now };
        if (index < 0) shapes.push(record); else shapes[index] = record;
      }
    }
    this.records = { ...this.records, cartons, shapes, imports: [...this.records.imports, { id: crypto.randomUUID(), user_id: localOwner, kind, filename, checksum, summary: { rows: rows.length, policy: "upsert; geen automatische verwijdering" }, created_on: now }] };
    return true;
  }

  saveSolution(snapshot: Snapshot, solutionName: string, definitionId: string | null, basedOn?: string, sourceMode?: "search" | "custom"): { id: string } {
    const parsed = parseSolutionSnapshot(JSON.stringify(snapshot)), validatedName = name.parse(solutionName);
    const parent = basedOn ? this.records.solutions.find(s => s.id === basedOn) : undefined;
    if (basedOn && !parent) throw new Error("De oorspronkelijke solution ontbreekt.");
    const mode = sourceMode ? sourceMode === "custom" ? "PERSO" : "STOCK" : parent?.packaging_mode ?? "STOCK";
    const definition = definitionId ? this.records.definitions.find(d => d.id === definitionId) : undefined;
    if (definitionId && (!definition || definition.packaging_mode !== mode)) throw new Error("Definitie en solution moeten dezelfde modus hebben.");
    if (parent && (parent.definition_id !== definitionId || parent.packaging_mode !== mode)) throw new Error("Een variant moet in de oorspronkelijke definitie en modus blijven.");
    const now = new Date().toISOString();
    const record: SolutionRecord = { id: crypto.randomUUID(), user_id: localOwner, definition_id: definitionId, packaging_mode: mode, name: validatedName, status: "draft", based_on: basedOn ?? null, created_from: basedOn ? "variant" : sourceMode === "custom" ? "custom" : "packing", metadata: structuredClone(parent?.metadata ?? {}), snapshot: { contractVersion: "0.3", ...parsed }, created_on: now, modified_on: now };
    this.records = { ...this.records, solutions: [...this.records.solutions, record] };
    return { id: record.id };
  }

  activate(id: string): boolean {
    const target = this.records.solutions.find(s => s.id === id);
    if (!target || target.status === "archived") throw new Error("Kies een bestaande, niet-gearchiveerde solution.");
    parseSolutionSnapshot(JSON.stringify(target.snapshot));
    const now = new Date().toISOString();
    this.records = { ...this.records,
      solutions: this.records.solutions.map((s): SolutionRecord => s.id === id ? { ...s, status: "active", modified_on: now } : target.definition_id && s.definition_id === target.definition_id && s.status === "active" ? { ...s, status: "draft", modified_on: now } : s),
      definitions: this.records.definitions.map(d => d.id === target.definition_id ? { ...d, current_solution_id: id, modified_on: now } : d),
    };
    return true;
  }
}
