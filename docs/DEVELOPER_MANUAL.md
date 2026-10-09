# Ontwikkelhandleiding

Versie 0.3. React19/TypeScript/Vite, centrale routes in src/App.tsx, Tailwind/shadcn, ExcelJS4.4.0 en Vitest. De nieuwe gebruikersspecificatie autoriseert packing zonder te wachten op ontbrekende Zite-enginebewijs; geen claim op volledige reconstructie.

## Scripts en modules
Package-scripts: dev/preview, build/build:dev, lint, typecheck (tsc --noEmit), test (vitest run --config src/vitest.config.ts), test:watch. Dyad beheert installatie/preview; gewone edits gebruiken hot reload. Geen backend/database opgezet. Tests hebben Nodeomgeving, geen React of appplugins.

Domain packing:
- types.ts: fysieke datatypes, rotaties, eenheden en systeemgrensvalidatie.
- geometry.ts: AABB-overlap, symmetrische bounds, coplanaire union-support, maxima en lagen.
- validation.ts: ValidationJSON.
- scoring.ts: restdetectie, ecologische score, sortering en apart exactfilter.
- engine.ts: deterministische begrensde extreme-point zoekstrategie.
- custom-box.ts: lineair en echt multi-product maatwerk; karton/realiteitsfilter.
- pallet.ts: bronadapter, buitenmaten, overhang, grid/guillotine/gedragen alternatie.
- packing.test.ts: golden fixtures en regressies.

Application: packing-job.ts berichtcontract; packing.worker.ts rekent in Web Worker. UI kan terminate() gebruiken om direct te annuleren; publieke engine accepteert AbortSignal. Worker rekent maximaal96 pogingen/300 placements, geometrisch budget250.000 geschatte pairchecks per poging. Default pure API48/200. Pallet max100 snijposities/as,1000 dozen/laag,3000 totaal; overschrijding expliciete fout. Geen gedeeltelijke maatwerkoplossing als alle gevraagde producten niet passen.

Infrastructure: bestaande lokale XLSX-inspectie; solution-snapshot.ts valideert v0.3 JSON via Zod én fysiek opnieuw, vertrouwt geen meegeleverde ValidationJSON/score. Export en viewer wijzigen placements niet. Geen persistente opslag. UI omvat ProductInputs/PackingWorkbench/SolutionDetails/PalletPanel; Index behoudt Excelinspectie en bronstatus.

## Enginekeuzes/review
Heuristisch, niet exhaustief. Homogene rotatie per product per poging; maxima als aantal x/y-startposities per product/laag en z-niveaus. Volledige steun, geen materiaalcertificaat. Score60/40 met volumegewicht/benuttingsband; restheuristiek conservatief. Alle keuzes in [algoritmecontract](ALGORITHM_CONTRACT.md), wijzigingen met golden tests onderbouwen. Geen stil verkleinen van producten; compressibility pas later.

## Verificatie en docs
Voer test/typecheck/build/lint uit via beschikbare omgevingacties indien uitvoerbaar. Deze turn bevat geen command-/browsertool: geen geslaagde checks claimen. Voor productie: browser/a11y, performance, operatorreview, echte input-outputvoorbeelden en rapportage van limieten.
Elke wijziging: relevante contracten, veldmodel, tests, besluiten en changelog samen bijwerken. Hash-versioned accepted plans nooit wijzigen; werkplan mag voortgang registreren.

## Opslag/GitHub
Database-adapter neemt een doosrecord aan, maar er is geen echte databasekoppeling. UI gebruikt actieve solution, gevalideerd lokaal snapshot of handmatige buitenmaten. Voor productieopslag/eigenaar/CurrentSolutionID/variants eerst Q04/Q09 oplossen. GitHub alleen broncode/contracten, niet automatisch appdata/CERM. Remote/rechten/branchbeleid Q11 onbekend; bronopname Q10 wacht op toestemming. Geen push/PR geclaimd. Lokale eerdere commit bf01841d8901b3c3630e325e06731a0efaa343f5 volgens gespreksprovenance.

## Vervolgacceptatie
Excelmapping: echte sheets/keys/eenheden gevalideerd. Master/opslag: gecontroleerde revisies en eigenaar/mergebeleid. Versionering: T03/T06/T07 groen. Engine: golden suite uitgevoerd, performance/heuristieken operatorreview. Visualisatie: read-only regressies, later3D. Import/export: productieformaten/beleid goedgekeurd; huidige snapshots niet CERM-master. Productie: golden/browser/a11y/autoristatiebewijs. Zie [tests](TEST_PLAN.md), [vragen](OPEN_QUESTIONS.md), [architectuur](ARCHITECTURE.md) en [index](README.md).
