import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePackagingData } from "./PackagingDataProvider";
import { NumberField } from "./ProductInputs";
import { RecordTable } from "./RecordTable";
import { MasterImport } from "./MasterImport";
import { ExcelImport } from "./ExcelImport";
import type { CartonRecord } from "@/infrastructure/packaging-records";
import { DimensionGuide } from "./DimensionGuide";

const initial = { reference: "", description: "", material: "", length: 0, width: 0, height: 0, cardboard: 0, active: true };
export function CartonManagement() {
  const { records, write, busy, refresh } = usePackagingData();
  const [draft, setDraft] = useState(initial), [id, setId] = useState<string>(), [error, setError] = useState("");
  const edit = (c: CartonRecord) => { setId(c.id); setDraft({ reference: c.reference, description: c.description, material: c.material, length: Number(c.length), width: Number(c.width), height: Number(c.height), cardboard: Number(c.cardboard), active: c.active }); setError(""); };
  return <section className="space-y-5"><div><h1 className="text-2xl font-semibold">Omdozenbeheer</h1><p className="mt-1 text-xs text-muted-foreground">Interne maten in mm. Wijzigingen vervangen nooit bestaande solution-snapshots; deactiveren in plaats van verwijderen.</p></div>
    <DimensionGuide kind="box" />
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
    <RecordTable label="Omdozen" rows={records.cartons} selectedId={id} columns={[{ label: "Referentie", value: r => r.reference }, { label: "Beschrijving", value: r => r.description }, { label: "Materiaal", value: r => r.material }, { label: "Binnen-L", value: r => r.length }, { label: "Binnen-B", value: r => r.width }, { label: "Binnen-H", value: r => r.height }, { label: "Karton", value: r => r.cardboard }, { label: "Status", value: r => r.active ? "actief" : "inactief" }]} actions={r => <><Button size="sm" variant="outline" className="rounded-lg" disabled={busy} onClick={() => edit(r)}>Bewerken</Button><Button size="sm" variant="ghost" className="rounded-lg" disabled={busy} onClick={() => write("cartons", { active: !r.active }, r.id)}>{r.active ? "Deactiveren" : "Activeren"}</Button></>} />
    <form className="space-y-4 rounded-2xl border bg-card p-4" onSubmit={async e => { e.preventDefault(); setError(""); if (!draft.reference.trim() || ![draft.length, draft.width, draft.height].every(n => Number.isFinite(n) && n > 0) || !Number.isFinite(draft.cardboard) || draft.cardboard < 0) { setError("Referentie, positieve interne maten en niet-negatieve kartondikte zijn verplicht."); return; } if (await write("cartons", { ...draft, reference: draft.reference.trim() }, id)) { setDraft(initial); setId(undefined); } }}><h2 className="font-semibold">{id ? "Omdoos wijzigen" : "Omdoos toevoegen"}</h2><fieldset disabled={busy} className="space-y-3"><div className="grid gap-3 sm:grid-cols-3">{(["reference", "description", "material"] as const).map((key, index) => <label key={key} className="space-y-1 text-xs">{["Referentie", "Beschrijving", "Materiaal"][index]}<Input className="rounded-xl" required={key === "reference"} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></label>)}</div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{(["length", "width", "height", "cardboard"] as const).map((key, index) => <NumberField key={key} label={["Binnen-L (mm)", "Binnen-B (mm)", "Binnen-H (mm)", "Karton (mm)"][index]} value={draft[key]} onChange={n => setDraft({ ...draft, [key]: n })} />)}</div><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })} />Actief</label></fieldset>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex gap-2"><Button className="rounded-xl" disabled={busy}>Opslaan</Button><Button type="button" variant="outline" className="rounded-xl" onClick={() => { setDraft(initial); setId(undefined); setError(""); }}>Nieuw / annuleren</Button></div></form>
    <ExcelImport kind="cartons" />
    <MasterImport kind="cartons" />
  </section>;
}
