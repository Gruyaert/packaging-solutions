# Changelog

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
