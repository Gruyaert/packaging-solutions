import { useEffect, useState, type ReactNode } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { createLocalPackagingWorkspace, type WritableKind } from "@/application/local-packaging-workspace";
import { loadAllDefaultMasterRows } from "@/infrastructure/default-masterdata";
import type { Snapshot } from "@/infrastructure/packaging-records";
import { PackagingDataContext } from "./PackagingDataProvider";

export function LocalPackagingDataProvider({ children }: { children: ReactNode }) {
  const [workspace] = useState(createLocalPackagingWorkspace);
  const [records, setRecords] = useState(() => workspace.getRecords()), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const current = workspace.getRecords();
        if (!current.cartons.length && !current.shapes.length) {
          const defaults = await loadAllDefaultMasterRows();
          workspace.sync("cartons", defaults.cartons.filename, defaults.cartons.checksum, defaults.cartons.rows);
          workspace.sync("shapes", defaults.shapes.filename, defaults.shapes.checksum, defaults.shapes.rows);
        }
        if (mounted) setRecords(workspace.getRecords());
      } catch (error) {
        if (mounted) toast.error(error instanceof Error ? error.message : "Basisdata kon niet worden geladen.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [workspace]);
  async function perform<T,>(operation: () => T): Promise<T | undefined> {
    setBusy(true);
    try { const result = operation(); setRecords(workspace.getRecords()); toast.success("Opgeslagen in het browsergeheugen; niet in Supabase."); return result; }
    catch (error) { toast.error(error instanceof z.ZodError ? error.issues.map(issue => issue.message).slice(0, 3).join(" ") : error instanceof Error ? error.message : "Lokale actie mislukt."); return undefined; }
    finally { setBusy(false); }
  }
  async function refresh() { setRecords(workspace.getRecords()); toast.info("Lokale testrecords zijn actueel. Er wordt geen database benaderd."); }
  const write = (kind: WritableKind, values: Record<string, unknown>, id?: string) => perform(() => workspace.write(kind, values, id));
  const sync = async (kind: "cartons" | "shapes", filename: string, checksum: string | null, rows: Record<string, unknown>[]) => !!await perform(() => workspace.sync(kind, filename, checksum, rows));
  const activate = async (id: string) => !!await perform(() => workspace.activate(id));
  const saveSolution = (snapshot: Snapshot, name: string, definitionId: string | null, basedOn?: string, sourceMode?: "search" | "custom") => perform(() => workspace.saveSolution(snapshot, name, definitionId, basedOn, sourceMode));
  return <PackagingDataContext.Provider value={{ storage: "local", records, loading, error: "", busy: busy || loading, refresh, write, sync, activate, saveSolution }}>{children}</PackagingDataContext.Provider>;
}
