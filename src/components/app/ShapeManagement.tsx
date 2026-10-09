import { Button } from "@/components/ui/button";
import type { ShapeRecord } from "@/infrastructure/packaging-records";
import { usePackagingData } from "./PackagingDataProvider";
import { RecordTable } from "./RecordTable";
import { MasterImport } from "./MasterImport";

export function ShapeManagement({ onDefinition }: { onDefinition(shape: ShapeRecord): void }) {
  const { records } = usePackagingData();
  return <section className="space-y-5"><div><h1 className="text-2xl font-semibold">Shapes masterdata</h1><p className="mt-1 text-xs text-muted-foreground">Alleen-lezen masterdata. Wijzig via expliciet gemapte Excel-synchronisatie; geen vrije bewerking van masterkeys of formaten.</p></div>
    <RecordTable label="Shapes" rows={records.shapes} columns={[{ label: "ShapeID", value: r => r.shape_id }, { label: "Variant", value: r => r.variant_id }, { label: "Beschrijving", value: r => r.description }, { label: "Productgroep", value: r => r.product_group }, { label: "Format A", value: r => r.format_a }, { label: "Format B", value: r => r.format_b }, { label: "Format H", value: r => r.format_h }, { label: "Status", value: r => r.blocked ? "geblokkeerd" : r.active ? "actief" : "inactief" }]} actions={r => <Button variant="outline" size="sm" className="rounded-lg" disabled={r.blocked || !r.active} onClick={() => onDefinition(r)}>Definitie maken</Button>} />
    <MasterImport kind="shapes" />
  </section>;
}
