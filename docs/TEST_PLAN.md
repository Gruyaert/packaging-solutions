# Testplan

Versie 0.5. B4-packingfeedback is bron van de golden verwachtingen, niet een fictieve Zite-export. **Bevestigd**: zeven feedbackcases en lokale testmodus. **Voorlopig voorstel**: support/ranking/restheuristieken. **Open**: productievoorbeelden en daadwerkelijke uitvoerstatus.

## Lokale testmodus 0.5
[local-packaging-workspace.test.ts](../src/application/local-packaging-workspace.test.ts) bevat zeven uitvoerbare regressies: lege/gescheiden nieuwe instances, carton CRUD/duplicate keys, volledig gevalideerde import/upsert/history zonder deletes, shape-masterreferentie, cloned immutable snapshots/lineage/modus/context, actief-pointer/archive en immutable echt palletresultaat. Vitest-config bevat nu application-tests en source-alias. Tests zijn geschreven, niet uitgevoerd.

Browseracceptatie nog uit te voeren:
- `/test` en login-knop werken zonder sessie; beschermde `/` blijft beschermd.
- Alle beheer-/berekenacties gebruiken uitsluitend testrecords, ook met bestaande login; geen packaging REST/RPC-requests bij lokale acties.
- Eigen Excelmapping-preview/import/historiek werkt lokaal; fouten geven geen gedeeltelijke import.
- Tabwissels behouden records; herladen, sluiten en opnieuw `/test` openen start leeg; header-exit vraagt bevestiging en draagt niets over.
- HTML/solution/pallet/workspace downloads bevatten dezelfde eigen testdata; workspace-export storage=local; geen cloudrecords of token/email lek in lokale UI/export.
- Dezelfde physical/mode/variant/active/archive checks, geen echte RLS/Auth-acceptatieclaim door lokale simulatietests.

Deze ronde: source/imports/routes/isolatie handmatig gecontroleerd. Typecheck, build, Vitest, lint en interactieve browseracceptatie niet uitgevoerd omdat daarvoor geen uitvoeringstool beschikbaar is. Eerdere 0.4-checks hieronder zijn historische resultaten, geen bewijs voor deze uitbreiding.

## Historische 0.4-verificatie en acceptatie
- Projectbrede TypeScriptcheck: uitgevoerd, geslaagd na correctie van de ExcelJS cell.col-conversie.
- Database audit: alle zes tabellen RLS=true; anon SELECT=false, geen client DELETE; shapes/imports geen directe client INSERT/UPDATE, pallets INSERT-only; own-user policies en service-role grants aanwezig.
- Productiebuild: zie actuele changelog; unit/lint/browseracceptatie niet uitgevoerd.
- [search-limits.test.ts](../src/domain/packing/search-limits.test.ts): regressies voor caps tijdens fill, globale Z-lagen, inputimmutability en ongeldige limieten, geschreven maar niet uitgevoerd.

| ID | Acceptatiecase | Status |
|---|---|---|
| D01 | signup/login/logout, bevestiging, actuele-origin callback, cache leeg bij ander account | browser nog niet uitgevoerd |
| D02 | recovery met PKCE/hash bereikt update-password vóór hoofdscherm; verlopen links geven fout | browser nog niet uitgevoerd |
| D03 | twee accounts kunnen elkaars records niet lezen/wijzigen, anon geen toegang | schema audit geslaagd; twee-accountintegratietest open |
| D04 | carton CRUD/status, snapshotdoos blijft gelijk na masterwijziging | browser open |
| D05 | expliciete mapping, positieve mm, duplicate/missing keys, booleans/formulecache; volledige preview | echte XLSX/browser open |
| D06 | sync volledige transactie inclusief history, failure geen gedeeltelijke wijzigingen, geen deletes | function/constraints gereviewd; rollbackscenario open |
| D07 | readonly shapes; actieve shape kiezen; PRODUCT zonder shape; STOCK/PERSO-contexten | browser open |
| D08 | save/open/metadata/duplicate/variantrecalc/validate/compare; oorspronkelijke placements gelijk | browser open |
| D09 | snapshot/context/mode/based_on/owner edits afgewezen; current solution binnen eigen definitie | triggers aanwezig; mutatietests open |
| D10 | activate pointer atomisch, actieve solution niet archiveren, concept herstellen | RPC/guards aanwezig; browser/concurrentietest open |
| D11 | palletbron filtertable ipv doosdropdown, karton precies eenmaal, opgeslagen input/settings/result | browser open |
| D12 | HTML escapen en dezelfde placements; JSON revalidatie; werkruimte-export alleen eigen records | code gereviewd; browser/downloadtest open |
| D13 | 320/768/1280/1920px: geen horizontale page-scroll; tabel lokale scroll, label/inputuitlijning, toetsenbord/a11y | browser open |
| D14 | zoekannulering/truncatie, geen stale results van andere definitie; fouten niet als opgeslagen presenteren | code gereviewd; browser open |

Geen geautomatiseerde tests als groen presenteren op basis van alleen typecheck/build. Geen fixtures naar productiegegevens schrijven voor deze audit.

## Uitvoerbare domeintests
Bestand [packing.test.ts](../src/domain/packing/packing.test.ts), Vitest Node-config [src/vitest.config.ts](../src/vitest.config.ts). React en worker zijn niet nodig om de engine te testen. Package-script test = eenmalige Vitest-run; test:watch = interactieve runner; typecheck = TypeScript zonder emit.

| ID | Regel | Concrete golden verwachting |
|---|---|---|
| G01 | R11/R12 | 100×80×20, twee stuks in 200×80×50 met 30 hoogtespeling: (0,0,0), (100,0,0), hoogste bovenvlak20 en 30 bovenruimte |
| G02 | R13 | A50/B20 in capaciteit100: target-oplossing exact50/20; vulalternatieven blijven aanwezig; exactfilter muteert zoekset niet |
| G03 | R18 | N=3, twee rotaties: zes lineaire opties, korte-as eerst, elke getoonde variant exact en geldig |
| G04 | R19 | Twee producten met 2+1 stuks: echte placements, exacte counts, support/bounds/overlapcontrole geldig |
| G05 | R17 | Extreme volumekloof: veel te ruime doos niet eerst, zelfs wanneer diens handlingscore kunstmatig maximaal is |
| G06 | R20 | Twee dominante rijplaatsen plus afgelegen singleton: rest-ID gemarkeerd en penalty; aangesloten compacte singleton geen losse rest |
| G07 | R22 | 5 mm per zijde: 1210×810; buitenmaat incl. karton; 4 dozen/laag, 3 lagen, 12 totaal, 444 mm totale hoogte in fixture |

Aanvullende regressies: symmetrische speling, geen overlap/zweven, union-support op twee coplanaire producten, verboden rotatie, nominale wijziging, onbekende IDs, onlogische laagindex, maxima, alle zes rotaties, realiteitsfilter, kartondikte, gewichtconversie/3 decimalen, max vijf producten, geen mutatie van input/placements bij ranking/filter, AbortSignal/truncatie, palletcollisions/support in alle getoonde patronen.

Vergelijking: exacte fixturecoördinaten waar bepaald, anders volledige fysieke validatie; geometrie epsilon1e-6mm. Fixtures bestaan alleen in tests, geen demoresultaten in UI. Tests blijven ook buiten huidige greedy engine bruikbaar.

## Browseracceptatie — nog niet uitgevoerd
Product1 verplicht; maximaal5; verwijdering optioneel product; uitsluitend geselecteerde rotaties; gewicht g/kg; beide strategieën; exacttoggle zonder zoeken; single custom zonder sortering; multi custom met sortering; afgekeurde varianten zichtbaar; workerannulering; gewijzigde input vereist opnieuw rekenen; laagviewer wijzigt placements niet; JSON export/reimport geen maat/spacingverandering; palletbronnen/overhang/hoogtepatronen. Responsiviteit, toegankelijkheid en operatorreview nog nodig.

## Behouden eerdere contracttests
T01–T07 en T14–T15 worden voor geïmplementeerde opslag gedekt door bovenstaande acceptatiecases; automatische override-resolutie en CERM blijven toekomstig. T08–T13 worden fysiek onderbouwd door G01/G02 en support/immutabilityregressies; 3D/animatie volgen later. Databaseguards zijn geïmplementeerd; daadwerkelijk uitgevoerde mutatie-/browseracceptatie blijft open.

I01–I08 blijven inspectieacceptatie: oorspronkelijke XLSX-werkbladen/hiddenstate/celwaarden, koprij en exacte keys, formules/cache zonder uitvoeren, SHA-256, geen file-data upload/persistentie, fouten/limieten en volledig JSON-bronrapport. Excelinhoud niet uit fixturedata afleiden.

## Historische verificatiestatus 0.3 (niet de actuele 0.4-status)
In deze turn: code/types handmatig gelezen, Vitest-dependency succesvol geïnstalleerd. Geen command-executie- of browsertool beschikbaar, dus Vitest, typecheck, build, lint en browseracceptatie **niet uitgevoerd**. Geen groen testresultaat claimen. Dit is een acceptatieblokkade voor productie, niet voor het schrijven van tests. Zie [changelog](CHANGELOG.md), [contract](ALGORITHM_CONTRACT.md), [ontwikkelhandleiding](DEVELOPER_MANUAL.md) en [index](README.md).
