import { ArrowRight, Box, Check, CircleDashed, FileSpreadsheet, Layers3, LockKeyhole, ScanLine, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sources = [
  { name: "Shapes.xlsx", size: "48.345 bytes", purpose: "Bron voor shape-masterdata · mapping nog open" },
  { name: "Omdozen.xlsx", size: "7.802 bytes", purpose: "Ontvangen doosbron · entiteit en velden nog open" },
];
const principles = [
  { title: "STOCK en PERSO blijven gescheiden", detail: "Elke verpakkingsmodus heeft een afzonderlijke context.", rule: "R03" },
  { title: "Placements bepalen de fysieke waarheid", detail: "Weergave-instellingen veranderen nooit de plaatsingsdata.", rule: "R08" },
  { title: "Bewerken maakt een nieuwe variant", detail: "Historie blijft behouden; actief kiezen is een aparte actie.", rule: "R06–R07" },
  { title: "Masterdata en appdata zijn gescheiden", detail: "Shapes blijven gecontroleerde Excel-masterdata.", rule: "R14–R15" },
];
const evidence = [
  { id: "Q01", title: "Werkbladinhoud en Excelmapping", detail: "Headers, celtypen, formules, sleutels en eenheden zijn nog niet onderzocht." },
  { id: "Q02", title: "Screenshots en functionele voorbeelden", detail: "Nodig om de oorspronkelijke interface te reconstrueren." },
  { id: "Q05–Q07", title: "Geometrie en echte zoekuitkomsten", detail: "Geen enginekeuze zonder onderbouwde regels en golden voorbeelden." },
  { id: "Q10–Q11", title: "Bronopname en GitHub-beleid", detail: "Toestemming, remote, rechten en branch-/PR-werkwijze moeten worden bevestigd." },
];

export function ContractPhaseOverview() {
  return (
    <div className="space-y-8">
      <section aria-labelledby="page-title" className="grid items-center gap-8 pb-2 md:grid-cols-[1fr_240px]">
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">Een controleerbare basis</p>
          <h1 id="page-title" className="break-words text-3xl font-bold leading-tight tracking-tight sm:text-5xl">Verpakkingsoptimalisatie</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Eerst de bronnen en spelregels vastleggen. Daarna pas rekenen, plaatsen en visualiseren — op basis van bewijs, niet van aannames.
          </p>
        </div>
        <div aria-hidden="true" className="relative hidden h-44 items-center justify-center rounded-[2rem] border border-border bg-secondary md:flex">
          <div className="rounded-3xl border border-primary/20 bg-card p-6 shadow-sm"><Box className="size-20 stroke-[1.2] text-primary" /></div>
          <span className="absolute right-5 top-5 rounded-xl bg-primary p-2.5 text-primary-foreground"><ScanLine className="size-5" /></span>
          <span className="absolute bottom-5 left-5 rounded-xl border bg-card p-2.5 text-primary"><Layers3 className="size-5" /></span>
        </div>
      </section>

      <section aria-label="Actuele fasestatus" className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-accent p-5 sm:flex-row sm:items-start sm:p-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary"><LockKeyhole aria-hidden="true" className="size-5" /></span>
        <div>
          <h2 className="font-semibold text-accent-foreground">Contractfase — optimalisatie nog niet beschikbaar</h2>
          <p className="mt-1 text-sm leading-relaxed text-accent-foreground">Dit skelet toont uitsluitend bron- en contractstatus. Er is geen engine, productie-import, database, CERM-koppeling, solutionbewerking, 3D-renderer of export.</p>
        </div>
      </section>

      <section aria-labelledby="sources-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 id="sources-title" className="text-xl font-semibold tracking-tight">Ontvangen bronbestanden</h2>
          <p className="text-sm text-muted-foreground">2 ontvangen · 0 inhoudelijk gecontroleerd</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {sources.map((source) => (
            <Card key={source.name} className="rounded-2xl border-border shadow-none">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-5 sm:p-6">
                <span className="rounded-xl bg-secondary p-3 text-primary"><FileSpreadsheet aria-hidden="true" className="size-6" /></span>
                <div className="min-w-0"><CardTitle className="text-lg">{source.name}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{source.size} · XLSX</p></div>
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
                <p className="text-sm text-muted-foreground">{source.purpose}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="gap-1.5 rounded-full bg-secondary px-2.5 py-1 font-medium text-secondary-foreground hover:bg-secondary"><Check aria-hidden="true" className="size-3" /> Ontvangen</Badge>
                  <Badge variant="outline" className="gap-1.5 rounded-full px-2.5 py-1 font-medium text-foreground"><CircleDashed aria-hidden="true" className="size-3" /> Inhoud niet gecontroleerd</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Aanwezigheid en bestandsgrootte gecontroleerd. Werkbladen en data zijn niet gelezen; bronbestanden worden niet openbaar aangeboden.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border shadow-none">
          <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-3">
            <div className="mb-2 flex items-center gap-2 text-primary"><ShieldCheck aria-hidden="true" className="size-5" /><span className="text-xs font-bold uppercase tracking-widest">Bevestigd in het plan</span></div>
            <CardTitle className="text-xl">Uitgangspunten liggen vast</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
            <ul className="divide-y divide-border">
              {principles.map((item) => <li key={item.rule} className="flex gap-3 py-4"><Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" /><div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.detail}</p><p className="mt-1 text-xs text-primary">{item.rule}</p></div></li>)}
            </ul>
            <p className="text-xs text-muted-foreground">Contractvereisten, geen reeds werkende functionaliteit.</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border shadow-none">
          <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-3">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground"><CircleDashed aria-hidden="true" className="size-5" /><span className="text-xs font-bold uppercase tracking-widest">Nog open</span></div>
            <CardTitle className="text-xl">Bewijs voor de volgende stap</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
            <ul className="divide-y divide-border">
              {evidence.map((item) => <li key={item.id} className="py-4"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.detail}</p><p className="mt-1 text-xs text-muted-foreground">{item.id}</p></li>)}
            </ul>
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="next-title" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Gefaseerd vervolg · voorlopig voorstel</p>
        <h2 id="next-title" className="mt-2 text-xl font-semibold">Van bronnen naar gevalideerde oplossingen</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {[{ title: "Bronnen & schema", detail: "Excelinspectie, gevalideerde masterdata en aparte appopslag." }, { title: "Solutions & engine", detail: "Versiehistorie en een engine gebaseerd op echte voorbeelden." }, { title: "Weergave & validatie", detail: "Read-only visualisatie, import/export en productieregressie." }].map((item, i) => <li key={item.title} className="flex gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">{i + 1}</span><div><h3 className="text-sm font-semibold">{item.title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.detail}</p></div></li>)}
        </ol>
        <p className="mt-6 flex items-start gap-2 border-t pt-4 text-xs leading-relaxed text-muted-foreground"><ArrowRight aria-hidden="true" className="size-4 shrink-0" />Elke fase krijgt eigen acceptatiecriteria. Geen ontbrekende packing-regel wordt vervangen door een demo-aanname.</p>
      </section>
    </div>
  );
}
