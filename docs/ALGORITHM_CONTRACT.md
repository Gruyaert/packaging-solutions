# Algoritmecontract

Contractversie: 0.1. Status: **bevestigd** voor onderstaande gebruikersvereisten, niet voor bestaand Zite-gedrag. Bron B1: het goedgekeurde implementatieplan. **Voorlopig voorstel**: testaanpak. **Open**: geometrie en engineparameters.

## Invarianten en traceerbaarheid
| Regel | Bevestigde waarheid | Data / UI | Toekomstige test | Open vraag |
|---|---|---|---|---|
| R01 | Shape-masterkey is ShapeID + ShapeVariantID | ShapeMaster / U02 | T01 | Q01 |
| R02 | Shape-standardkey voegt PackagingMode toe | ShapeStandardDefinition / U02 | T02 | Q01 |
| R03 | Alleen STOCK en PERSO; contexten strikt gescheiden | PackagingContext / U03 | T03 | Q04 |
| R04 | Productoverride kan alleen ProductNumber bevatten; shapeverwijzingen niet verplicht | ProductOverride / U01 | T04 | Q03 |
| R05 | Productoverride heeft voorrang op shape standard | ProductOverride / U01 | T05 | Q03 |
| R06 | Bewerken maakt nieuwe solutionvariant; geschiedenis onveranderlijk | Solution / U08 | T06 | Q04 |
| R07 | CurrentSolutionID bepaalt actieve solution; kiezen is niet bewerken | PackagingContext / U08 | T07 | Q04 |
| R08 | Placements zijn fysieke waarheid; exploded view, laagafstand en animatie wijzigen die nooit | Placement / U06–U07 | T08 | Q06 |
| R09 | Nominale maten behouden; tolerantie en compressibility apart | Placement, tolerantie / U04 | T09 | Q05 |
| R10 | Product rust op bodem of onderliggende laag; geen zweven | Placement / U06 | T10 | Q06 |
| R11 | Hoogtespeling volledig bovenaan | tolerantie / U04 | T11 | Q05 |
| R12 | Lengte-/breedtespeling is totaal over beide zijden; verdeling open | tolerantie / U04 | T12 | Q05 |
| R13 | Exact aantal filtert oplossingen, vervangt zoeklogica niet; Alle oplossingen mag afwijkende aantallen tonen | Solution / U05 | T13 | Q07 |
| R14 | Shapes zijn gecontroleerde Excel-masterdata, niet vrij overschrijfbaar | ShapeMaster / U02–U09 | T14 | Q01, Q08 |
| R15 | Eigen appdata wordt niet als CERM-masterdata teruggeschreven | opslag / U09 | T15 | Q09 |

## Niet vastgelegde parameters
Geen enginekeuze, generieke packing-logica of demo-uitkomsten. Eenheden, assen, oorsprong, interne/externe doosmaten, toegestane rotaties, stapelpatronen, botsingscriteria, numerieke precisie en supportcriteria: **open** (Q05–Q06). Zoekdekking, ranking, limieten, afbreekvoorwaarden en annulering: **open** (Q07). Compressie mag niet stilzwijgend nominale maten wijzigen; fysiek effect vereist bewijs.

## Voorlopige veiligheidsmaatregelen
Geen berekening totdat parameters en golden voorbeelden zijn bevestigd. Toekomstige visualisatie krijgt alleen-lezen placementdata; afgeleide rendertransforms blijven lokaal. Toekomstige variantmutatie en actiefkeuze worden afzonderlijke applicatieacties. Dit zijn architectuurvoorstellen, geen geïmplementeerde garanties.

Zie [datamodel](DATA_MODEL.md), [UI](UI_CONTRACT.md), [tests](TEST_PLAN.md), [vragen](OPEN_QUESTIONS.md) en [index](README.md).
