# Changelog

## Lokale testwerkruimte zonder account (0.5)

Wijziging: publieke `/test`, login-knop en header-entry/exit, duidelijke tijdelijke-opslagbanner, aparte memory-store/provider met lege eigen records. Cartonbeheer, expliciete shape/carton-upsert met importhistory, definities, validated immutable solutions/variants/activation/archive en echte palletopslag werken zonder account. Dezelfde UI en engine, lokale bron-/save-/export-/debuglabels en storage-markering op workspace-export. Zeven local-workspace-regressietests en passende Node-testconfig toegevoegd; relevante handleiding/contract/architectuur/testplan bijgewerkt.

Waarom: gebruiker wil zonder sign-in testen en bevestigde de lokale-testmodus. Geen demo-masterdata, geraden mapping of gefingeerde berekeningen toegevoegd.

Impact/privacy: uitsluitend browsergeheugen voor testrecords; verlaten/herladen wist data, downloads kunnen bewust lokaal bewaard worden. Geen packaging-API/RPC, browserpersistente testrecords, anon-login, cloudfallback of automatische transfer. Echte hoofdroute/auth/RLS/grants ongewijzigd. Lokale validators helpen flows testen maar vervangen geen echte DB/Auth-acceptatie.

Verificatie: relevante broncode, routes, contextinterface en isolatie handmatig gelezen; regressietests geschreven maar niet uitgevoerd. Typecheck/build/lint/browser in deze ronde niet uitgevoerd (geen beschikbare uitvoer-/browsertool). Geen eerdere succesvolle 0.4-checks als bewijs voor 0.5 hergebruikt. Geen serverrestart nodig voor gewone source-edits, geen nieuwe dependencies of databasewijzigingen.

## Werkruimte / Supabase UI (0.4)

Wijziging: publishable-key Supabase-client, Auth UI/sessiebeheer/private routes/callback/reset; zes private tabellen met RLS/minimale grants, master-sync/history en active-solution RPCs, immutable owner/snapshot/context/mode/lineageguards. Acht functionele tabs en discreet debug; compact input/advanced-controls/filtertabellen; carton CRUD/status, readonly shape-import, scoped definitions en real saved solution workflows. Pallet databasebron via filtertable, gekozen patroon/source/settings/result-opslag en JSON; veilige HTML-laagrapporten en volledige eigen werkruimte-export. Search-time totaalproductgewicht/global-Z-lagenlimieten en regressietests. Relevante contracten/handleidingen bijgewerkt.

Waarom: gebruiker bevestigde Supabase-integratie en vroeg door te werken. Eerste schema-uitvoering geweigerd; gebruiker gaf “Try again?”, daarna succesvol uitgevoerd. Geen bestaande tabellen blind vervangen. Supabase default privileges expliciet ingetrokken vóór definitieve least-privilege audit.

Impact: echte private werkruimte per login; originele XLSX blijft lokaal, alleen expliciet bevestigde records/historiek worden opgeslagen. Geen fictieve mastermapping of resultaten. Snapshot-envelope blijft fysiek 0.3; workspace-export 0.4. Rekenen blijft lokale worker. Naam/notities/status mutable; fysieke edits nieuwe variant. STOCK/PERSO server-side geïsoleerd. Geen CERM/publicatie/teams/automatische override-resolver/vrije placement-editor/3D/compressie.

### Werkelijke verificatie 0.4
- Dependencybeheer: Supabase-client en officiële Auth UI-packages succesvol toegevoegd/ververst.
- SQL: tabellen, guards/RPCs/grants succesvol uitgevoerd; effectieve privilege-audit daarna geslaagd: RLS alle zes true, anon SELECT alle zes false, geen client DELETE; shapes/imports direct write=false, pallets INSERT-only.
- TypeScript: projectbreed uitgevoerd, **geslaagd**; gerelateerde bestaande ExcelJS string→number assertion vervangen door echte Number-conversie.
- Productiebuild: uitgevoerd, **geslaagd** (Vite 8.0.10). Waarschuwingen: bestaande deprecated esbuild/react-swc-optie, verouderde Browserslist-data en grote chunks (app ~801 kB, lazy ExcelJS ~930 kB minified). Geen configuratie/dependencyupgrade buiten scope toegevoegd.
- Relatieve links: 12 hoofddocumenten gecontroleerd, geen ontbrekende targets. Beschikbare browser-consolefouten: geen gevonden; dit is geen interactieve browseracceptatie.
- Golden/regressietests inclusief nieuwe search-limits tests: geschreven, **niet uitgevoerd** (geen beschikbare test-runneractie).
- ESLint, browser/a11y, email/callback/recovery/twee-accountintegratie en echte XLSX-importacceptatie: **niet uitgevoerd**.
- Geen fixtures/bronbestanden naar productie/Git gepubliceerd; geen GitHub push/PR geclaimd.


## 2026-10-09 · Contractbasis en appskelet (0.1)
Datum gebaseerd op ontvangen manifest/plan; geen onafhankelijke tijdmeting.

Wijziging: twaalf projectspecifieke documenten, bronregister, modulegrenzen, traceerbaarheid R01–R15/U01–U09/T01–T15, Nederlandse startpagina met twee kleine componenten. README vervangen; globals.css centrale kleuren en radius aangepast. App.tsx, config en dependencies ongewijzigd. Werkplan bijgewerkt; geen hash-snapshot gewijzigd.
Waarom: onderhoudbare reconstructiebasis zonder ontbrekende packingregels te verzinnen.
Impact: informatieve startpagina, geen operationele functies of opslag. Geen Excelbytes gekopieerd of openbaar gemaakt.
Risico's: broninhoud, geometrie, screenshots, opslag, bronrechten en publicatie blijven open; voorlopige stijl is geen Zite-reconstructie.

### Werkelijke verificatie
- Beginsituatie: git-status schoon op main; HEAD 9435ceb62ca691d942610c9838c7d439d850f8f2.
- Bronaanwezigheid/metadata: gecontroleerd; inhoud/SHA-256/bytekopie: niet uitgevoerd, geblokkeerd.
- Typecheck: uitgevoerd, geslaagd; geen TypeScriptfouten.
- Productiebuild: uitgevoerd, geslaagd (Vite 8.0.10). Bestaande waarschuwingen: deprecated esbuild-optie in react-swc-plugin en verouderde Browserslist-data; geen config/dependencywijziging uitgevoerd.
- Documentlinks/inventaris: uitgevoerd; 18 Markdownbestanden gecontroleerd (12 hoofddocs, bronregister, 4 module-README's, project-README); geen kapotte relatieve links of nultekens; R01–R15 en T01–T15 aanwezig.
- ESLint: niet uitgevoerd, geen uitvoertool beschikbaar.
- Browser mobiel/desktop/a11y: niet uitgevoerd, geen browserbesturing beschikbaar.
- Packing/invariant/golden tests: definities, niet uitgevoerd; geen engine.
- Lokale basiscommit: 4fba1d897d1db2d3fd83805dab0e6ecfca485070 volgens latere gespreksprovenance.
- GitHub push/PR: niet uitgevoerd; remote/rechten/branchbeleid niet geverifieerd (Q11).

## Vervolgwijziging · Lokale XLSX-inspectie (0.2)
Datum: niet onafhankelijk vastgesteld in deze turn; geen datum verzonnen.

Wijziging: ExcelJS 4.4.0 geïnstalleerd, lazy browseradapter en ExcelInspector toegevoegd; Index gekoppeld, fase-/bronregisterteksten aangepast. Read-only werkblad- en celinspectie met hidden-state, formules/cache, lege rijen, merges, SHA-256 indien Web Crypto beschikbaar, expliciete sleutelcontrole en volledig JSON-bronrapport. Geen route/config/CSS-wijziging in deze uitbreiding.
Waarom: gebruiker vraagt pragmatisch verder te gaan; originele XLSX direct bruikbaar maken in plaats van CSV/andere chat verplicht te stellen. D04 vervangen door D09.
Impact: werkende implementatie van lokale inspectie, geen productie-import/engine/persistentie; oorspronkelijke bytes niet gepubliceerd of gewijzigd. Relevante docs en werkplan in dezelfde wijzigingsset.
Risico's: groter lazy parserbundle; alleen vertrouwde kleine bestanden; limieten na parsing beschermen niet tegen alle ZIP-bombs. Cached values kunnen ontbreken/verouderd zijn. Rapport kan vertrouwelijke bronwaarden bevatten. Technische inspectie bewijst geen domeinmapping.

### Werkelijke verificatie 0.2
- Dependency-installatie: succesvol gemeld door dependencybeheer.
- Broncode/types: handmatig gelezen; ExcelJS load(ArrayBuffer) en browser-entry gecontroleerd.
- Typecheck/build/lint/browser: niet uitgevoerd; huidige tools bieden geen uitvoering/browserbesturing. Eerdere geslaagde 0.1-checks niet hergebruikt als bewijs voor 0.2.
- Inspectietests I01–I08: gedefinieerd, niet uitgevoerd.
- Echte Shapes/Omdozen-inhoud/checksum: nog niet gelezen door assistent; lokale bestandsselectie + bewust gedeeld rapport nodig voor contractmapping. Geen headers of records verzonnen.
- Lokale0.2commit: bf01841d8901b3c3630e325e06731a0efaa343f5 volgens gespreksprovenance; geen push/PR-bewijs.

## Vervolgwijziging · Packing, maatwerk en palletisatie (0.3)
Datum: niet onafhankelijk vastgesteld in deze turn.

Wijziging: nieuw algoritmecontract vóór implementatie, pure domain-engine/geometry/validation/scoring/custom/pallet, worker, productinvoer, strategie/exactfilter, ecologische ranking, restmetadata, read-only laagviewer/placementtabel, v0.3 JSON snapshot/export/revalidatie, palletpanel en patroonmetrics. Excelinspectie behouden. Vitest5.0.3 geïnstalleerd; test/test:watch/typecheck scripts en onafhankelijke Node-testconfig toegevoegd. UI-fasestatus0.3 bijgewerkt. Geen router/server/database/CSS-wijzigingen.
Waarom: expliciete nieuwe gebruikersregels B4 autoriseren enginebouw; geen fictieve bronmappings.
Impact: handmatige echte input berekenen; geen persistentie/database/CERM/version-editor. Maatwerk één product alleen lineaire patronen, multi exact en geometrisch gecontroleerd. Overhang per zijde, karton/buitenmaten en topclearance consistent in engine/viewer/snapshot.
Risico's: begrensde heuristische zoekdekking, homogene rotatie/product/poging, conservatieve volledige support en restscoreheuristiek. Maxima-definitie en scoreformule vereisen operatorreview. Pallet geen draagkracht-/transportstabiliteitscertificaat. Database-recordbron alleen adapter/handmatige UI, geen gekoppelde DB. Compressibility/Editor later.

### Werkelijke verificatie0.3
- Algoritmecontract gelezen en bijgewerkt vóór enginebouw; benodigde documenten/modellen samen bijgewerkt.
- Vitest-installatie succesvol door dependencybeheer gemeld.
- G01–G07 en fysieke regressies geschreven als uitvoerbare tests, met B4-fixtures en expliciete verwachtingen.
- Code/imports/workerpad/geometrie/testverwachtingen handmatig gereviewd; bron bestanden teruggelezen. Geen globale optimaliteitsclaim.
- Vitest/typecheck/build/lint/browser: **niet uitgevoerd**, huidige tools bieden geen command- of browseruitvoering; eerdere succesvolle builds niet als0.3bewijs gebruiken. Productieacceptatie blijft hierdoor open.
- Originele Excelbytes niet gewijzigd of gepubliceerd; geen echte Excelheaders/products/solutions verzonnen. Tests bevatten uitsluitend expliciete fixtures.
- Geen GitHub-push/PR geclaimd; huidige nieuwe commit-hash niet geverifieerd.

Zie [testplan](TEST_PLAN.md), [besluiten](DECISION_LOG.md) en [index](README.md).
