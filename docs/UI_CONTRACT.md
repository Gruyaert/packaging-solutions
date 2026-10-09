# UI-contract

Versie 0.1. Bron B1: goedgekeurd plan. **Bevestigd**: functionele vereisten. **Voorlopig voorstel**: huidige vormgeving en toekomstige schermindeling. **Open**: Zite-screenshots, routes en exacte tabellen (Q02). Alleen / is de startpagina; geen nieuwe functionele routes.

## Huidig skelet (voorlopig voorstel, geïmplementeerd in deze fase)
Nederlandstalige titel Verpakkingsoptimalisatie, expliciete melding Contractfase — optimalisatie nog niet beschikbaar. Bronstatus onderscheidt ontvangen/metadata gecontroleerd van inhoud niet gecontroleerd. Geen producten, dozen, solutions, bereken-, import-, export- of opslagacties. Afgeronde witte vlakken, centrale blauwe/teal variabelen, donkerblauwe tekst; responsive Tailwind en aangepaste shadcn Cards/Badges. Illustratieve verpakking-iconografie is geen placementvisualisatie. Geen gereconstrueerde Zite-interface.

## Toekomstige functionele inventaris (niet beschikbaar)
| ID / gebied | Bevestigde velden en acties / regel | Validatie en toegestane wijziging | Voorgestelde datastroom | Open details / bewijs |
|---|---|---|---|---|
| U01 productcontext | ProductNumber; override zonder shape; voorrang R04–R05 | productidentiteit vereist; appoverride, niet master overschrijven | product → override + standaard → opgeloste invoer | overige velden/merge Q03; B1, productvoorbeelden nodig |
| U02 shape-masterdata | ShapeID, ShapeVariantID, standard met PackagingMode; R01–R02, R14 | unieke keys; geen vrije shape-edit | Excel → validatie → read-only master | tabel/kolommen Q01; Excelextract nodig |
| U03 STOCK/PERSO | PackagingMode; R03 | uitsluitend twee modi, geïsoleerde acties | modus → aparte context | scherm/owner Q04; B1 + contextvoorbeeld |
| U04 optimalisatie-invoer | nominale maat apart van tolerantie; R09, R11–R12 | geen nominale vervorming; bereik/eenheden open | opgeloste data + invoer → toekomstige engine | velden, defaults, eenheden Q05–Q07; enginebewijs |
| U05 oplossingenlijst | exact-aantalfilter en Alle oplossingen; R13 | filter na zoeken, geen vervangende zoekactie | engine-uitkomsten → filter → lijst | ranking, tabel, zoekdekking Q07; Zite-uitkomsten |
| U06 solutiondetail/placements | fysieke placements leidend; R08–R10 | geen in-place historische wijziging | solution → read-only placements | geometrie/velden Q06; placementexport |
| U07 visuele weergave | exploded view, laagafstand, animatie veranderen geen placements; R08 | alleen renderstate wijzigen | placements → renderer + lokale instellingen | controls/3D/assen Q02, Q06; screenshots |
| U08 varianten/actieve solution | nieuwe variant bij bewerken; CurrentSolutionID actief; R06–R07 | variant en actiefkeuze gescheiden; context geldig | variantmaken → historie; kiezen → pointer | editable velden/owner Q04; workflowvoorbeeld |
| U09 import/export | gecontroleerde shapes; appdata niet CERM-master; R14–R15 | toekomstige preview/validatie; geen stil overschrijven | bron → rapport → master; export apart | formats/vervanging/verwijdering Q08–Q09; beleid |

Alle toekomstige acties zijn vereisten of voorstellen, niet bestaande Zite-bediening. Geen impliciete CRUD, zoekschermen of extra velden. Zie [data](DATA_MODEL.md), [tests](TEST_PLAN.md), [vragen](OPEN_QUESTIONS.md) en [index](README.md).
