import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { LocalWorkspace } from "@/application/local-workspace";
import { PackagingDataContext } from "./PackagingDataProvider";

export function LocalPackagingDataProvider({ children }: { children: ReactNode }) {
  const [workspace] = useState(() => new LocalWorkspace());
  const [records, setRecords] = useState(workspace.records);
  async function perform<T,>(operation: () => T): Promise<T | undefined> {
    try {
      const result = operation();
      setRecords(workspace.records);
      toast.success("Opgeslagen in de lokale testwerkruimte · niet in Supabase.");
      return result;
    } catch (error) { toast.error(error instanceof Error ? error.message : "Lokale actie mislukt."); return undefined; }
  }
  return <PackagingDataContext.Provider value={{ storageMode: "local", records, loading: false, error: "", busy: false,
    refresh: async () => { setRecords(workspace.records); },
    write: (kind, values, id) => perform(() => workspace.write(kind, values, id)),
    sync: async (kind, filename, checksum, rows) => !!await perform(() => workspace.sync(kind, filename, checksum, rows)),
    activate: async id => !!await perform(() => workspace.activate(id)),
    saveSolution: (snapshot, name, definitionId, basedOn, sourceMode) => perform(() => workspace.saveSolution(snapshot, name, definitionId, basedOn, sourceMode)),
  }}>{children}</PackagingDataContext.Provider>;
}
