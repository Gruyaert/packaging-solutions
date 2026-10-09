# Architectuur

Versie0.3. React19/TypeScript/Vite, centrale routes in src/App.tsx. Packing-engine is puur TypeScript, UI onafhankelijk. Geen server/database.

Domain/packing bevat types, collision/support/bounds, ValidationJSON, exactfilter/ranking, extreme-point engine, custom-box en pallet. Alle output wordt uit concrete placements opgebouwd. Input en resultatensets worden niet in-place veranderd door viewer/filter/ranking. Shape/override/operationele owner niet geïmplementeerd.

Application bevat workerberichtcontract en Web Worker; UI start/annuleert worker. Domain kan ook rechtstreeks vanuit Node-tests draaien. Geen Reactimport in engine. Verwerking blijft lokaal en beperkt.

Infrastructure bevat read-only ExcelJS-parser en Zod-gevalideerde solution-snapshotadapter. Ingelezen scores/ValidationJSON niet vertrouwen: fysieke data opnieuw valideren. Geen localStorage/API/CERM. Download is bewust lokaal bestand, geen versiebeheerbare opslag.

UI: ProductInputs → invoersnapshot → worker → solutions → exactfilter/sortering → SolutionDetails. Viewer legt placements rechtstreeks in read-only SVG bovenaanzicht per laag. PalletPanel consumeert buitenmaten uit geselecteerde solution/gevalideerd snapshot/handmatige omdoos; database-recordadapter kan later aangesloten worden. Pallethoogte/overhang uit instellingen, geen productspeling opnieuw toepassen op buitenmaten.

Toekomst: gecontroleerde masterimport → override/standard-resolutie → aparte STOCK/PERSO contexten → historische variants/CurrentSolutionID. Eigen appdata-opslag en CERM-grens Q04/Q09. Geen enginekeuze uit fictieve Excelmappings.

Veiligheid: lokale beperkte bestanden, schema/finite-number checks, geen formules of links uitvoeren, brontekst via React, geen HTMLinjectie. ExcelZIP-limitatie geldt na parsing en is geen malware-sandbox. Database/publicatie/privacybesluiten nog open.

Zie [contract](ALGORITHM_CONTRACT.md), [import](IMPORT_EXPORT.md), [data](DATA_MODEL.md), [UI](UI_CONTRACT.md), [tests](TEST_PLAN.md) en [index](README.md).
