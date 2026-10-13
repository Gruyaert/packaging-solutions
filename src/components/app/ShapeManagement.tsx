import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ShapeRecord } from "@/infrastructure/packaging-records";
import { usePackagingData } from "./PackagingDataProvider";
import { RecordTable } from "./RecordTable";
import { MasterImport } from "./MasterImport";
import { ExcelImport } from "./ExcelImport";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function ShapeManagement({ onDefinition }: { onDefinition(shape: ShapeRecord): void }) {
  const { records, busy, refresh } = usePackagingData();
  return <section className="space-y-5"><div><h1 className="text-2xl font-semibold">Shapes masterdata</h1><p className="mt-1 text-xs text-muted-foreground">Alleen-lezen masterdata. Wijzig via expliciet gemapte Excel-synchronisatie; geen vrije bewerking van masterkeys of formaten.</p></div>
    <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Masterdata importeren</h2>
          <Button variant="outline" size="sm" onClick={async () => {
            try {
              const { error } = await supabase.rpc('seed_masterdata');
              if (error) throw error;
              toast.success("Database succesvol gevuld met voorbeelddata");
              await refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Fout bij het vullen van de database");
            }
          }} disabled={busy}>
            Database vullen met voorbeelddata
          </Button>
        </div>
    <RecordTable label="Shapes" rows={records.shapes} columns={[{ label: "ShapeID", value: r => r.shape_id }, { label: "Variant", value: r => r.variant_id }, { label: "Beschrijving", value: r => r.description }, { label: "Productgroep", value: r => r.product_group }, { label: "Format A", value: r => r.format_a }, { label: "Format B", value: r => r.format_b }, { label: "Format H", value: r => r.format_h }, { label: "Status", value: r => r.blocked ? "geblokkeerd" : r.active ? "actief" : "inactief" }]} actions={r => <Button variant="outline" size="sm" className="rounded-lg" disabled={r.blocked || !r.active} onClick={() => onDefinition(r)}>Definitie maken</Button>} />
    <ExcelImport kind="shapes" />
    <MasterImport kind="shapes" />
  </section>;
}