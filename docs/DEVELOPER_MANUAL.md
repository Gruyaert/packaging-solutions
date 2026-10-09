# Ontwikkelhandleiding

Versie 0.4. React/TypeScript/Vite, centrale routes in `src/App.tsx`, Tailwind/shadcn, Supabase, ExcelJS 4.4.0 en Vitest. Gebruik hot reload voor normale source-edits; Dyad beheert installatie/preview.

## Modulegrenzen
`src/domain/packing` bevat geen React/database/IO. `types`, `geometry`, `validation`, `scoring`, `engine`, `custom-box` en `pallet` blijven centrale fysieke waarheid. Zoeklimieten maxWeightKg/maxTotalLayers werken tijdens insert; exact counts blijft een apart resultaatfilter. Application worker begrenst op 96 pogingen/300 placements en het bestaande geometrisch budget. Pallet heeft eigen werkbudgetten; limieten worden gemeld.

Infrastructure bevat lokale werkboekinspectie, validated v0.3 fysieke snapshots, typed packaging-records en escaped HTML/local JSON export. Supabase-client op `src/integrations/supabase/client.ts` gebruikt alleen public publishable key, PKCE en URL-detectie. Geen service-key in de browser.

SessionContextProvider monitort auth, recovery en sign-out/cache-isolatie. Publieke `/login`, `/auth/callback`, `/reset-password`; hoofdroute beschermd. Callback wacht op clientinitialisatie; code niet dubbel uitwisselen. Nieuwe origins/callbacks moeten in Supabase Redirect URLs toegestaan zijn. Geen hardcoded localhost-return URLs.

PackagingDataProvider fetches alle eigen records in batches van 1000, querykey bevat gebruiker-ID; schermtabellen tonen 25 records en kolomfilters. Mutaties vernieuwen data en tonen echte fouten. Geen mocks of lokale fallback die mislukte writes als succesvol presenteert.

## Databaseschema en veiligheid
Schema is via verbonden SQL-beheer aangemaakt, niet via handgeschreven migratiefiles. Tabellen en guards staan in [datamodel](DATA_MODEL.md). Controleer RLS én effectieve grants: Supabase default privileges kunnen anon/full-client access toevoegen; deze zijn expliciet ingetrokken en minimale rechten opnieuw toegekend. Shapes/importhistoriek hebben alleen client SELECT. Pallets client SELECT/INSERT. Cartons/definitions/solutions SELECT/INSERT/UPDATE. Geen client DELETE.

Master-sync is SECURITY DEFINER, auth.uid gecontroleerd, own-user upsert + historiek atomisch; geen deletions. Activeren is afzonderlijke RPC binnen eigenaar/definitie. Guards behouden owner, fysieke snapshot, definitie, modus en lineage; actieve huidige snapshot niet archiveren. Geometrie wordt bij UI-ingang/opslag/export opnieuw gevalideerd. Serverguards doen geen fysieke engineberekening.

## Tests en beschikbare verificatie
Package scripts bestaan voor test/test:watch/typecheck/build/lint; geen nieuwe serverstart nodig. `packing.test.ts` bevat zeven golden cases plus fysieke regressies; `search-limits.test.ts` voegt echte zoekconstraintregressies toe. Laat tests niet ongemerkt onderdeel van buildconfig worden alleen om een ontbrekende testuitvoertool te omzeilen.

Deze implementatieronde: projectbrede TypeScriptcheck geslaagd; database RLS/effectieve privileges gecontroleerd. Productiebuildresultaat staat in [changelog](CHANGELOG.md). Vitest, lint en interactieve browser/a11y-/twee-accountacceptatie zijn niet uitgevoerd; geen testgroen claimen. Testscenario's staan in [testplan](TEST_PLAN.md).

## Bewuste open grenzen
Geen automatische productoverride/standaard-fallback, vrije placement-editor, 3D, compressie, gedeelde teams, CERM-export of herstelimport voor workspace-JSON. Originele bronbytes blijven buiten Git tot expliciete toestemming. Geen GitHub push/PR geclaimd. Werkelijke Excelmapping moet door de gebruiker bevestigd blijven, nooit uit bestandsnamen afleiden.

Zie [architectuur](ARCHITECTURE.md), [algoritme](ALGORITHM_CONTRACT.md), [import/export](IMPORT_EXPORT.md), [vragen](OPEN_QUESTIONS.md) en [index](README.md).
