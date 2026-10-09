# Testplan

Versie 0.3. B4 (huidige gebruikersprompt) is bron van onderstaande golden verwachtingen, niet een fictieve Zite-export. **Bevestigd**: zeven feedbackcases. **Voorlopig voorstel**: support/ranking/restheuristieken. **Open**: productievoorbeelden en daadwerkelijke uitvoerstatus.

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
T01–T07 en T14–T15 (masterkeys, override-resolutie, modusisolatie, historisch variant-/actiefbeheer en CERM-grens) blijven toekomstige opslag-/resolutietests. T08–T13 worden fysiek onderbouwd door G01/G02 en support/immutabilityregressies; 3D/animatie volgen later. Geen database/versioneringsclaim.

I01–I08 blijven inspectieacceptatie: oorspronkelijke XLSX-werkbladen/hiddenstate/celwaarden, koprij en exacte keys, formules/cache zonder uitvoeren, SHA-256, geen file-data upload/persistentie, fouten/limieten en volledig JSON-bronrapport. Excelinhoud niet uit fixturedata afleiden.

## Werkelijke verificatiestatus
In deze turn: code/types handmatig gelezen, Vitest-dependency succesvol geïnstalleerd. Geen command-executie- of browsertool beschikbaar, dus Vitest, typecheck, build, lint en browseracceptatie **niet uitgevoerd**. Geen groen testresultaat claimen. Dit is een acceptatieblokkade voor productie, niet voor het schrijven van tests. Zie [changelog](CHANGELOG.md), [contract](ALGORITHM_CONTRACT.md), [ontwikkelhandleiding](DEVELOPER_MANUAL.md) en [index](README.md).
