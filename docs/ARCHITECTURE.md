# Architectuur

Versie 0.2. **Bevestigd**: React 19/TypeScript/Vite, centrale routing in src/App.tsx, Tailwind/shadcn. Lokale XLSX-inspectie toegevoegd; geen server, database of optimalisatie-engine.

## Modulegrenzen
- domain: toekomstige entiteiten/invarianten en resolutie, zonder React/IO; alleen README.
- application: toekomstige use-cases; geen concrete service/repository.
- infrastructure: inspect-workbook.ts leest lokale XLSX met dynamisch geladen ExcelJS 4.4.0. Retourneert broninspectie, geen domeinobjecten/masterdata. Opslag/CERM-adapters nog open.
- visualization: toekomstige read-only renderer; alleen README.
- components/app: AppShell, ContractPhaseOverview en interactieve ExcelInspector met SheetInspector; Index composeert. Inspectieresultaten/keuzes alleen in React-geheugen.

## Geïmplementeerde inspectiestroom
Browserbestandskeuze → oorspronkelijke ArrayBuffer → ExcelJS read-only parsing + SHA-256 via Web Crypto indien beschikbaar → bronrapport → werkblad/celpreview. Optionele lokale JSON-download; geen netwerkverzending, backend of persistentie. Bronstatus in projectregister staat los van tijdelijke browsersessie. Bij delen van een rapport in de chat kan inhoudelijke beoordeling volgen, niet automatisch vanuit React-state.

## Voorgestelde toekomstige stroom
Bron → inspectie/preview/validatie → gecontroleerde masterdata. ProductNumber + PackagingMode → override/standard-resolutie → engine-invoer → immutable Solution/Placements → read-only renderer. Variantmaken en actiefkeuze gescheiden. Rendertransforms nooit terug naar placements.

## Opslag en veiligheid — open
GitHub is bron van waarheid voor code/contracten, niet automatisch operationele data. Owner/transacties/autorisatie en CERM-grens Q04/Q09. Geen XLSX-bestanden in public of versiebeheer zonder Q10; rapport bevat mogelijk gevoelige data. Inspecteur is bedoeld voor vertrouwde kleine bronnen, geen sandbox voor schadelijke ZIP-bestanden. Rij/cellimieten na parsing. Formules/links niet uitgevoerd; broncellen als React-tekst, geen HTML-injectie.

Nog niet beschikbaar: engine, productie-import, database, CERM, definitieve solutionbewerking, 3D en operationele exports. Routes/config ongewijzigd. Zie [infrastructure](../src/infrastructure/README.md), [import](IMPORT_EXPORT.md), [UI](UI_CONTRACT.md), [vragen](OPEN_QUESTIONS.md) en [index](README.md).
