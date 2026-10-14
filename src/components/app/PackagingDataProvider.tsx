import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/auth/SessionContext";
import { loadDefaultMasterRows } from "@/infrastructure/default-masterdata";
import type { PackagingRecords, RecordKind, Snapshot } from "@/infrastructure/packaging-records";
import { parseSolutionSnapshot } from "@/infrastructure/solution-snapshot";

const kinds: RecordKind[] = ["cartons", "shapes", "definitions", "solutions", "imports", "pallets", "operations"];
const empty: PackagingRecords = { cartons: [], shapes: [], definitions: [], solutions: [], imports: [], pallets: [], operations: [] };
async function loadRecords(userId: string): Promise<PackagingRecords> {
  const entries = await Promise.all(kinds.map(async kind => {
    const rows: unknown[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.from(`packaging_${kind}`).select("*").eq("user_id", userId).order("id").range(offset, offset + 999);
      if (error) throw new Error(error.message);
      rows.push(...data);
      if (data.length < 1000) break;
    }
    return [kind, rows];
  }));
  return Object.fromEntries(entries) as unknown as PackagingRecords;
}
interface DataContext {
  storage: "local" | "supabase";
  records: PackagingRecords; loading: boolean; error: string; busy: boolean;
  refresh(): Promise<void>;
  write(kind: "cartons" | "definitions" | "solutions" | "pallets", values: Record<string, unknown>, id?: string): Promise<{ id: string } | undefined>;
  sync(kind: "cartons" | "shapes", filename: string, checksum: string | null, rows: Record<string, unknown>[]): Promise<boolean>;
  activate(id: string): Promise<boolean>;
  saveSolution(snapshot: Snapshot, name: string, definitionId: string | null, basedOn?: string, sourceMode?: "search" | "custom"): Promise<{ id: string } | undefined>;
}
export const PackagingDataContext = createContext<DataContext | null>(null);
export function usePackagingData() { const value = useContext(PackagingDataContext); if (!value) throw new Error("PackagingDataProvider ontbreekt."); return value; }
export function PackagingDataProvider({ children }: { children: ReactNode }) {
  const { session } = useSession(), queryClient = useQueryClient();
  const [busy, setBusy] = useState(false), [bootstrapping, setBootstrapping] = useState(false);
  const seeded = useRef(new Set<"cartons" | "shapes">());
  const userId = session!.user.id, key = ["packaging", userId];
  const query = useQuery({ queryKey: key, queryFn: () => loadRecords(userId), retry: 1 });
  useEffect(() => {
    if (query.isLoading || !query.data) return;
    const pending = (["cartons", "shapes"] as const).filter(kind => !seeded.current.has(kind));
    if (!pending.length) return;
    pending.forEach(kind => seeded.current.add(kind));
    setBootstrapping(true);
    void Promise.all(pending.map(async kind => {
      try {
        const defaults = await loadDefaultMasterRows(kind);
        const existingKeys = kind === "cartons"
          ? new Set(query.data!.cartons.map(row => row.reference))
          : new Set(query.data!.shapes.map(row => `${row.shape_id}\u0000${row.variant_id}`));
        const hasMissingDefaults = defaults.rows.some(row => kind === "cartons"
          ? !existingKeys.has(String(row.reference))
          : !existingKeys.has(`${row.shape_id}\u0000${row.variant_id}`));
        if (!hasMissingDefaults) return;
        const { error } = await supabase.rpc("seed_packaging_defaults", { p_kind: kind, p_filename: defaults.filename, p_checksum: defaults.checksum, p_rows: defaults.rows });
        if (error) throw new Error(error.message);
      } catch (error) {
        seeded.current.delete(kind);
        toast.error(error instanceof Error ? `${kind === "cartons" ? "Omdozen.xlsx" : "Shapes.xlsx"}: ${error.message}` : "Basisdata kon niet worden geladen.");
      }
    })).finally(() => {
      setBootstrapping(false);
      void queryClient.invalidateQueries({ queryKey: key });
    });
  }, [query.data, query.isLoading, queryClient, userId]);
  async function refresh() { await queryClient.invalidateQueries({ queryKey: ["packaging", userId] }); }
  async function perform<T,>(operation: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    try { const result = await operation(); await refresh(); toast.success("Opgeslagen in je werkruimte."); return result; }
    catch (error) { toast.error(error instanceof Error ? error.message : "Opslaan mislukt."); return undefined; }
    finally { setBusy(false); }
  }
  async function write(kind: "cartons" | "definitions" | "solutions" | "pallets", values: Record<string, unknown>, id?: string) {
    return perform(async () => {
      const table = supabase.from(`packaging_${kind}`);
      const { data, error } = await (id ? table.update(values).eq("id", id).eq("user_id", userId) : table.insert({ ...values, user_id: userId })).select("id").single();
      if (error) throw new Error(error.message);
      return data as { id: string };
    });
  }
  async function sync(kind: "cartons" | "shapes", filename: string, checksum: string | null, rows: Record<string, unknown>[]) {
    return !!await perform(async () => { const { error } = await supabase.rpc("sync_packaging_master", { p_kind: kind, p_filename: filename, p_checksum: checksum, p_rows: rows }); if (error) throw new Error(error.message); return true; });
  }
  async function activate(id: string) {
    return !!await perform(async () => {
      const record = query.data?.solutions.find(s => s.id === id);
      if (!record) throw new Error("Solution niet gevonden in de eigen werkruimte.");
      parseSolutionSnapshot(JSON.stringify(record.snapshot));
      const { error } = await supabase.rpc("activate_packaging_solution", { p_id: id });
      if (error) throw new Error(error.message);
      return true;
    });
  }
  async function saveSolution(snapshot: Snapshot, name: string, definitionId: string | null, basedOn?: string, sourceMode?: "search" | "custom") {
    try {
      const parsed = parseSolutionSnapshot(JSON.stringify(snapshot));
      if (!name.trim()) throw new Error("Geef de oplossing een naam.");
      const parent = query.data?.solutions.find(s => s.id === basedOn);
      if (parsed.editor) {
        if (!parent || parsed.editor.sourceSolutionId !== parent.id) throw new Error("Edited solution moet de oorspronkelijke bron behouden.");
        const original = parseSolutionSnapshot(JSON.stringify(parent.snapshot));
        if (JSON.stringify(parsed.products) !== JSON.stringify(original.products) || JSON.stringify(parsed.solution.box) !== JSON.stringify(original.solution.box) || JSON.stringify(parsed.solution.spacing) !== JSON.stringify(original.solution.spacing) || JSON.stringify(parsed.solution.counts) !== JSON.stringify(original.solution.counts) || JSON.stringify(parsed.editor.baselineCounts) !== JSON.stringify(original.solution.counts)) throw new Error("Editor v1 behoudt producten, doos, speling en oorspronkelijke aantallen.");
      }
      const packagingMode = sourceMode ? sourceMode === "custom" ? "PERSO" : "STOCK" : parent?.packaging_mode ?? "STOCK";
      return write("solutions", { name: name.trim(), definition_id: definitionId, packaging_mode: packagingMode, metadata: parent?.metadata ?? {}, based_on: basedOn ?? null, snapshot: { contractVersion: "0.3", ...parsed }, status: "draft", created_from: parsed.editor ? "edited" : basedOn ? sourceMode ? "variant" : "duplicate" : sourceMode === "custom" ? "custom" : "packing" });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Ongeldige solution."); return undefined; }
  }
  return <PackagingDataContext.Provider value={{ storage: "supabase", records: query.data ?? empty, loading: query.isLoading || bootstrapping, error: query.error?.message ?? "", busy: busy || bootstrapping, refresh, write, sync, activate, saveSolution }}>{children}</PackagingDataContext.Provider>;
}
