# Architectuur

Versie 0.5. React/TypeScript/Vite, Tailwind/shadcn, React Router in `src/App.tsx`, Supabase Auth/Postgres en een aparte in-memory testprovider. Packing blijft pure TypeScript, onafhankelijk van React, database en authenticatie.

## Lokale isolatie
`/test` mount uitsluitend LocalPackagingDataProvider rond dezelfde Index. De beveiligde `/` behoudt RequireSession + PackagingDataProvider; geen rechten/policies of echte authgebruiker aangepast. De gedeelde context benoemt storage=local/supabase. Er is geen automatische fallback van mislukte cloudwrites naar lokale opslag.

`src/application/local-packaging-workspace.ts` heeft een nieuwe lege state per providerinstantie, Zod-invoerchecks, upsert/historiek, immutable snapshot/context/modus, variantafkomst, actieve selectie en opnieuw afgeleide palletresultaten. Geen Supabase-import/call, persistent storage of externe IO in de lokale store. Provideracties publiceren de nieuwe memory-records en expliciete lokale succes/foutmeldingen. De appbrede auth-sessiemonitor blijft bestaan, maar testacties gebruiken geen Supabase-packagingqueries/RPCs of cloudcache.

Route verlaten/herladen maakt een nieuwe lege testwerkruimte; geen automatische transfer/import naar de database. Workspace-export vermeldt storage en lokale records gebruiken user_id=local-test, niet een auth.users-ID. Server-RLS/privileges blijven een afzonderlijke acceptatiegrens.

## Lagen
- **Domain/packing**: types, bounds/collision/full-footprint support, ValidationJSON, search-time gewicht-/lagenconstraints, exactfilter/ranking, begrensde engine, maatwerk en pallet.
- **Application**: workerberichtcontract, annuleerbare Web Worker en lokale testworkspace-operaties. Berekening blijft lokaal.
- **Infrastructure**: lokale lazy ExcelJS-inspectie, fysieke Zod-snapshotrevalidatie, typed database-records en veilige lokale HTML/JSON-export.
- **UI/auth**: Supabase Auth UI, sessiemonitor, beschermde `/`, publieke login/callback/reset. Geen eigen auth-protocol of profielmodel.
- **UI/data**: PackagingDataProvider gebruikt per-gebruiker querykeys, pagineert databasefetches, levert typed records en echte mutaties/RPCs. Afmelden wist querycache.
- **UI/screens**: compacte tabs en filterbare gepagineerde tabellen, managementcomponents, save/variant/active-flow, packingdetail en palletbron/resultaatopslag.

## Databasegrens
Zes `public.packaging_*`-tabellen met `user_id → auth.users.id`, RLS en expliciete grants. Geen anon privileges; service_role volledig server-side, nooit browsercredentials. Client CRUD is beperkt tot benodigde operations, geen hard delete. Shapes/importhistoriek worden uitsluitend door de authentieke atomische sync-RPC geschreven.

`sync_packaging_master`: auth.uid vereist, 1–2000 rijen, explicit mapped data, upsert en historiek in één transactie, geen impliciete verwijdering. `activate_packaging_solution`: owner/context-scoped actieve status/pointer. Triggers bewaken ownership, immutable snapshot/context/mode/afkomst, bestaande shape-masterkey, mode-isolatie en een geldige current-solutionverwijzing. Geometrische validatie blijft domaincode, geen SQL-optimizer.

Definities hebben een afzonderlijke SHAPE/PRODUCT + STOCK/PERSO-context. Varianten blijven in dezelfde context en modus. Geen automatische override/fallback-resolver, rollen of gedeelde workspace ingevoerd.

## Veiligheid en grenzen
Browser gebruikt uitsluitend publishable key. Auth redirect is absoluut op de huidige app-origin; PKCE/code/hash verwerking via de client. Recovery wordt voor gewone hoofdschermnavigatie afgehandeld. Exports escapen gebruikerscontent, SVG is afgeleid van gevalideerde placements. Originele XLSX-bestanden blijven lokaal; bevestigde records worden wel opgeslagen. Geen CERM-write of bronpublicatie.

Querydata kan worden vernieuwd; geen realtime samenwerking. Geen globale optimaliteitsclaim, certificering, compressibility, 3D of vrije placement-editor. Browser-/operatoracceptatie en daadwerkelijk uitvoeren van unit tests blijven afzonderlijke verificatiestappen.

Zie [algoritme](ALGORITHM_CONTRACT.md), [data](DATA_MODEL.md), [UI](UI_CONTRACT.md), [tests](TEST_PLAN.md) en [index](README.md).
