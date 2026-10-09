# UI-contract

Versie 0.1. Bron B1: goedgekeurd plan. **Bevestigd**: functionele vereisten. **Voorlopig voorstel**: huidige vormgeving en toekomstige schermindeling. **Open**: Zite-screenshots, routes en exacte tabellen (Q02). Alleen / is de startpagina; geen nieuwe functionele routes.

## Huidig skelet en lokale inspectie (uitbreiding 0.2)
Nederlandstalige titel en melding Contractfase — optimalisatie nog niet beschikbaar blijven. Geen producten/solutions/berekeningen, productie-import of operationele opslag/exports. Stijl voorlopig: afgeronde vlakken, centrale blauw/teal tokens, donkerblauwe tekst, Tailwind en aangepaste shadcn. Geen gereconstrueerde Zite-interface.

U10 (bevestigd als nieuwe implementatie, geen Zite-reconstructie): Excelbestanden inspecteren, bestand kiezen, alle werkbladen inclusief hidden/veryHidden openen, koprij aanpassen, keykolommen kiezen, pagineren, bronrapport downloaden en sessie wissen. Validatie: XLSX/extensie, 5 MB en structuurlimieten. Formules alleen tonen met cache, niet uitvoeren. Flow: browser-File → read-only parser → lokale React-state → optionele JSON-download. Geen bronmutatie of persistentie. Bronregisterstatus staat los van lokale sessie; mapping/eenheden blijven Q01/Q05. Rapport bevat alle broncellen, maar geen interactieve keykeuzes. Zie [inspectiecontract](IMPORT_EXPORT.md) en [gebruik](USER_MANUAL.md); tests I01–I08.

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
