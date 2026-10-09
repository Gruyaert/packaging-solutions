# UI-contract

Versie 0.4. De gevraagde beheerworkflow is geïmplementeerd met Supabase. Fysiek snapshotcontract blijft 0.3. Vormgeving en heuristische keuzes zijn geen reconstructieclaim van Zite.

## Navigatie en layout
Acht tabs: **Verpakking zoeken**, **Omdoos op maat**, **Palletisatie**, **Omdozenbeheer**, **Shapes masterdata**, **Packaging Definitions**, **Solutions**, **Rapporten / Exports**. **Debug / Performance** is een afzonderlijke, discrete actie. Compacte desktoplayout, responsive grids en afgebakende tabelscroll; geen bedoelde horizontale page-scroll. Tabellen hebben filters per kolom en pagina's van 25 records. Productvelden blijven uitgelijnd met meerregelige labels. Rotaties/maxima, speling/limieten en palletoverhang zijn inklapbaar.

Routes blijven in `src/App.tsx`: `/` beschermd, `/login`, `/auth/callback` en `/reset-password` publiek. Email/password via Supabase Auth UI; geen sociale providers of profielvelden. Privéwerkruimte per gebruiker, geen gedeelde bedrijfsruimte of rollenmodel. Afmelden wist querycache en brengt de gebruiker naar login. Herstel bereikt eerst het wachtwoordscherm.

| Gebied | Functionele acties | Grenzen |
|---|---|---|
| Zoeken | 1–5 producten, zes rotaties, gewicht g/kg, gewenste/vulstrategie, actieve omdozen kiezen in filterbare tabel of handmatige binnenmaten | 96 pogingen/300 placements en geometrisch budget; heuristische dekking |
| Zoeklimieten | maximum totaal productgewicht en totaal Z-startniveaus tijdens plaatsing; 0 in UI = geen limiet | inhoudsgewicht, geen geschat kartongewicht; laagdefinitie voorlopig voorstel |
| Resultaten | tabel, exactfilter na zoeken, sortering, details, echte databaseopslag, palletiseren, JSON/HTML | fysieke input van laatste berekening; herberekenen na wijzigingen |
| Maatwerk | lineair bij één product; exact multi-product packing, realiteitsfilter en afkeurreden | single zonder lucht/ecologische sortering |
| Omdozen | toevoegen, wijzigen, activeren/deactiveren, filteren, Excelpreview/sync/historiek | interne mm-maten; geen fysieke geschiedenis overschrijven of hard delete |
| Shapes | filteren, uitsluitend lezen, definitie starten, Excelpreview/sync/historiek | geen vrije masterbewerking; Format A/B/H niet automatisch naar product-L/B/H omgezet |
| Definitions | SHAPE/PRODUCT + STOCK/PERSO-context maken, naam/status wijzigen, berekenen, actieve solution openen | logische context niet in de editor wijzigen; productnummer kan zonder shape; geen automatische override/fallback-resolver |
| Solutions | openen, metadata, dupliceren, bewerken/herberekenen als variant, valideren, twee snapshots vergelijken, activeren, archiveren/herstellen, palletiseren, JSON/HTML | inhoud/mode/context/afkomst immutable; actieve definitie-solution eerst vervangen vóór archiveren |
| Pallet | database-doos via filterbare tabel, database-solution, gekozen packing, handmatige buitenmaat of JSON; patroonkiezen, bron/settings/result opslaan, export | geometrisch, geen draagkracht-, gewicht- of transportcertificering |
| Rapporten | saved-solution HTML met laagvisuals/placements/validatie, fysieke JSON, pallet-JSON, volledige eigen werkruimte-JSON | geen CERM-format of herstelimport; downloads kunnen vertrouwelijk zijn |
| Debug | aantallen, opnieuw laden, bestaande lokale broninspectie | geen sessietokens/geheime sleutels; performancewaarschuwingen bij berekeningen |

STOCK-solutions worden vanuit zoeken opgeslagen, PERSO vanuit maatwerk. Alleen bijpassende definitiemodus kan worden geselecteerd. Varianten blijven in de oorspronkelijke modus en definitie; databaseguards controleren deze isolatie. Activeren is een aparte atomische RPC; er worden geen fysieke placements gewijzigd.

Zie [algoritme](ALGORITHM_CONTRACT.md), [data](DATA_MODEL.md), [gebruik](USER_MANUAL.md), [tests](TEST_PLAN.md) en [index](README.md).
