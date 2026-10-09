# Verpakkingsoptimalisatie

Werkruimtefase 0.5: private Supabase-opslag én lokale testmodus zonder account rond de pure TypeScript packing-engine. Geen fictieve productmappings/resultaten of globale optimaliteitsclaim.

## Testen zonder account
Klik op **Testen zonder account** op login of open `/test`. Vanuit je private workspace gebruik je **Lokaal testen**. Berekeningen, eigen Excelmapping/import en beheer-/solution-/palletacties gebruiken uitsluitend een aparte lege memory-workspace, geen Supabase-packagingdata. Herladen/verlaten wist alle testrecords; downloads blijven lokaal bestaan. Geen automatische cloudtransfer of workspace-herstelimport. Lokale regressietests toegevoegd; uitvoering/typecheck/build/browseracceptatie van 0.5 nog open (zie changelog).

## Beschikbaar
- Email/password, publiek callback/reset en beschermde privéwerkruimte per gebruiker.
- Publieke lokale testwerkruimte met expliciete opslag-/verlieswaarschuwing en dezelfde beheerflows.
- Verpakking zoeken, Omdoos op maat, Palletisatie, Omdozenbeheer, Shapes masterdata, Packaging Definitions, Solutions, Rapporten / Exports; discrete Debug / Performance.
- Maximaal vijf producten, zes rotaties, g/kg, productmaxima; zoek-time totaalgewicht-/lagenlimieten, aparte exactfilter/ranking.
- Filterbare tabellen, compacte uitgelijnde invoer, inklapbare advanced options en contained table overflow.
- Omdozen CRUD/status, shapes read-only, expliciete lokale XLSX mapping/preview en atomische upsert/importhistoriek.
- SHAPE/PRODUCT + STOCK/PERSO-definities, immutable physical snapshots en mode/context/variantguards.
- Echte save/open/duplicate/recalculate-as-variant/validate/compare/activate/archive actions; read-only laagviewer en JSON/HTML-rapport.
- Palletbron via filterbare database-dozen-/solutionlijst, berekende patterns en bron/settings/resultaatopslag.

Engine is los van React/database, zoeken in annuleerbare Web Worker. Zeven golden tests plus fysieke en globale zoeklimitregressies geschreven. Typecheck en schema-privileges gecontroleerd; buildstatus in changelog. Vitest/lint/browseracceptatie niet uitgevoerd.

Nog niet beschikbaar: automatische override/fallback-resolutie, vrije placement-editor, compressie, 3D, gedeelde teams, CERM-integratie, workspace-herstelimport. Geen gewichts-/draagkracht-/transportcertificering. Originele Excelbytes niet gepubliceerd. Geen GitHub push/PR geclaimd.

[Gebruik](docs/USER_MANUAL.md) · [UI](docs/UI_CONTRACT.md) · [Algoritme](docs/ALGORITHM_CONTRACT.md) · [Tests](docs/TEST_PLAN.md) · [Ontwikkeling](docs/DEVELOPER_MANUAL.md) · [Documentatie](docs/README.md) · [Changelog](docs/CHANGELOG.md)

React/TypeScript/Vite/Tailwind/shadcn + Supabase Auth/Postgres; centrale routes in src/App.tsx. Publishable browserkey, RLS en least-privilege grants; geen geheime servicekey in frontend.
