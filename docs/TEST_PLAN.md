# Testplan

Versie 0.7 met intelligente Excelimport-uitbreiding. B4-packingfeedback is bron van golden verwachtingen, niet een fictieve Zite-export. **Bevestigd**: feedbackcases, lokale testmodus, editor, viewer/offline-export en automatische Excelherkenning met manuele fallback. **Voorlopig voorstel**: support/ranking/restheuristieken. **Open**: productievoorbeelden en daadwerkelijke uitvoerstatus.

## Taakgerichte UX, rechtopcamera en operator-infokaart — aanvullende acceptatie
Geschreven, **niet uitgevoerd**: vier [viewer-interaction.test.ts](../src/application/viewer-interaction.test.ts)-tests voor geserialiseerde runtime met DOM/Plotly-stubs: basis-Z zonder dubbele hoogte/immutable bron; pitchbegrenzing en wheel/button/pinchzoom; optionele Z/free plus aanzicht/aria-state; cameraexport/invalid checks. Viewer-report-tests aangepast voor upright/defaults/camera en operatorbody met gesloten technische bijlagen/printstijl/bronbehoud. Vier [import-header-row.test.ts](../src/application/import-header-row.test.ts)-tests voor aliases, exacte herhaalde carton-/shapeheaders, formule/error/subtotaalweigering. Stubs zijn geen echte browser/WebGL-acceptatie. Typecheck/build/Vitest/lint niet uitgevoerd.

Nog interactief te verifiëren, online én gedownload HTML:
- 320/768/1024/1280/1920 px: geen page-overflow, leesbare labels; brede invoer/resultaatlijst/viewer naast elkaar, compacte keuze op mobiel en resultaat vóór invoer. Bij klikken van kaart geen scroll naar viewer nodig; aandacht voor korte/laptopvensters en browserzoom.
- Kerngegevens/viewer voorop; zoeken/opslaan/palletiseren blijven werkend. Geen SaveSolution/andere undefined-verwijzingen, nieuw gekozen resultaat toont volledige placements in plaats van oude step/laag.
- Mouse/touch diagonaal en extreme verticale drag: upright verandert azimut én pitch zonder rollen/ondersteboven. Wheel, tweepointerpinch, +/− en keyboard/Home; browserpagina buiten plot normaal scrollbaar.
- Vrije orbit expliciet; Z-only optioneel. keepCamera aan bewaart live camera bij kiezen/aanpassen/export, uit reset rebuild en exporteert geen camera. Geen jumps of concurrerende updates tijdens animatie.
- Palletbasis zichtbaar in 3D/2D en step 0; contouren/dekking apart instelbaar, geen fysieke mutatie. Afmetingen 0/pallethoogte 0 en overhang controleren.
- Operatorrapport eerst werkelijke aantallen/maten/laaginformatie/schema. Details standaard dicht, invalid waarschuwing niet verborgen. Print statische laag/inhoud zonder WebGL; volledige JSON en escaping behouden.
- Excel handmatig sheet/header kiezen geeft nieuw veilig voorstel en wist bevestiging. Samples zichtbaar; lastRow-voetnootuitsluiting expliciet, exacte repeated headers gemeld, onbekende/invalid rijen niet stil verwijderd. Preview/key/eenheidbevestiging vereist vóór lokale/cloudsync.
- Teardown tijdens drag/pinch/relayout/render/load: geen events/capture/frames/timers/Promise-fouten. Chrome/Edge/Firefox/Safari, desktop/tablet/telefoon en file://-productie-export met netwerk uit nog werkelijk testen. Geen universele cross-devicegoedkeuring claimen.

## Intelligente Excelimport — aanvullende acceptatie
[excel-mapping.test.ts](../src/application/excel-mapping.test.ts): tien geschreven tests voor NL-cartonlabels/origineelbehoud, EN/reordering/separators/mm, shapeformat zonder productmapping, preamble/relevant zichtbaar werkblad, dubbele doelkandidaten, gelijke sheet-/kopregelscores, onbekende kolommen/cm/buitenmaten, verborgen sheet alleen expliciet, formula-headerweigering en 50-rijgrens/partial/no-match. Synthetische testdata, geen echte bronbestanden. **Niet uitgevoerd**. Bestaande application-testconfig omvat het bestand.

Bronreview: herkenner/schema-velden, UI-voorstel→preview→bevestiging→sync, bevestigingreset en behouden lokale/Supabase-sync. Typecheck/build/Vitest/lint/browser/echte XLSX-tests **niet uitgevoerd**; geen beschikbare uitvoer-/browsertool. Geen productie-imports of bronuploads voor verificatie.

Nog uit te voeren:
- Bekende carton-/shapeheaders automatisch herkennen, kopregel onder titel vinden, kolommen ongeordend en NL/EN; juiste data/changes zichtbaar vóór bevestigen.
- Unknown/duplicate kolommen en gelijke sheets/kopregels: niets gokken, manuele UI bereikbaar met veilige partial matches; verborgen sheet/rij >50 expliciet kiezen.
- Na automatische herkenning manueel corrigeren/ontkoppelen; sheet/headerwijziging reset mapping en bevestiging; knop voor gekozen kopregel vult nieuwe matches; globale knop heranalyseert werkboek.
- Numeric/boolean/cache/key/duplicate/2000-rijfouten blokkeren volledige sync. Auto-voorstel is geen data-/mm-/binnenmaatvalidatie; geen automatische writes.
- Optionele niet-gekoppelde defaults en overwrite zichtbaar; gebruiker expliciet bevestigen; failed sync behoudt invoer voor correctie.
- Cloud schrijft uitsluitend bevestigde own-user records/history; `/test` geen packaging API/RPC; XLSX geen AI-dienst/browserpersistente mapping-upload.
- Responsieve controls/keyboard en beide importschermen functioneel; echte Omdozen-/Shapesbron apart door gebruiker testen zonder automatische publicatie.

## Viewer / offline / performance 0.7
[viewer-report.test.ts](../src/application/viewer-report.test.ts) bevat elf geschreven regressies: originele data behouden bij animatiesortering/exploded; laag/stapfilters; top/front/side-projecties en instellingnormalisatie; 10.000-item bron met maximaal 600 renderitems; script-breakout escaping/JSON roundtrip; embedded runtime/JSON/rapportsecties/geen externe scripts en script-syntaxis; shape/product/free bestandsnamen; packaging/pallet-adapters en unsaved product-/compressibilitybehoud; zelfstandig geserialiseerd model; clone/LRU/clear-cache; oversize/bytebudget. **Niet uitgevoerd.** De reporttest gebruikt een kleine Plotly-stub voor structuur/syntaxis, geen bewijs dat echte Plotly offline werkt. Tests vallen onder bestaande application Vitest-config.

Handmatige bronreview uitgevoerd: viewer-adapters en resultaat/pallet/saved/edited/export-ingangen, lokale raw Plotly-lader, React vs imperative DOM-eigenaarschap, timer/observer/worker cleanup, begrensde geometrie/tabellen, memocache en timings. Geen shell/browseruitvoering beschikbaar: typecheck/build/Vitest/lint, WebGL/camera/offline/file:// en freeze/responsiviteit **niet uitgevoerd**. Geen historische groene checks als bewijs voor deze ronde. Geen productiegegevens/fixtures gewijzigd.

| ID | Vereiste interactieve acceptatie | Status |
|---|---|---|
| V01 | Viewer bij verpakking zoeken, custom carton, palletisatie, saved en edited solution; identieke fysieke placements/JSON | bron gekoppeld, browser open |
| V02 | 3D roteren/zoomen/pannen/hover/reset; gevuld/wire/beide, dekking/productkleuren/assen/grid/labels | implementatie aanwezig, WebGL/browser open |
| V03 | Exploded 0/50/100 mm op beide sliders; bron/coördinaten/nominale maten/counts/validatie bytegelijk | pure test geschreven, uitvoering/browser open |
| V04 | Alle lagen en elk laagnummer op doos/pallet; boven/front/side-projecties dezelfde bron | pure tests geschreven, browser open |
| V05 | Begin/vorige/play/pause/volgende/einde; elke snelheid; één product/doos per stap, counters/layer correct; geen timer na unmount | code gereviewd, browser open |
| V06 | Viewer zichtbaar→verborgen→zichtbaar, tabwissel/unmount/StrictMode tijdens async load/render; geen removeChild, dubbele observer of stale render | DOM-boundary gefixt, browserregressie open |
| V07 | Export van elke ingang; tien secties, shape/definition/mode/productNumber/box/productdata/placements/validation/compressibility/pallet/settings/full JSON | structuurtests geschreven, downloadbrowser open |
| V08 | Gedownload HTML via file:// met netwerk uit; geen CDN/server/Dyad; echte Plotly bedienen; JSON parsebaar; productie-minified export runtime zelfstandig | nog niet uitgevoerd |
| V09 | Kwaadaardige referentie zoals sluit-script-tag blijft inert; volledige JSON herstelt inhoud; export geen andere eigenaar/sessiontokens | escapingtest geschreven, security/browser open |
| V10 | 320/768/1280/1920 px: geen page-scroll horizontaal, controls wrap, tabellen intern scrollen, keyboard/focus/labels | browser/a11y open |
| V11 | 300 packaging / 3000 pallet / 10.000 viewer-fixture: rendercap gemeld; lagen/eerdere stappen bereikbaar; volledige JSON; main thread reageren | captest geschreven, freeze/heap/frameprofiel open |
| V12 | Worker annuleren/stale reacties negeren/unmount; identieke cachehit zonder nieuwe enginemeting; eviction/bytes/isolatie; dashboard zeven fasen met echte ms | bronreview/cachetests, uitvoering/browser open |

Bounded geometrie en worker zijn risicobeperking, geen bewezen freeze-vrijgarantie voor elk apparaat/bestand. Tables in HTML tonen hoogstens 600 rijen met melding, volledige bron blijft ingebed. Compressionwarnings zijn diagnostiek, geen nieuwe overlapacceptatie. Free/databasebronnen mogen ontbrekende shape/productgegevens tonen zonder ze te verzinnen.

## Editor 0.6 — geschreven tests en open acceptatie
[editor.test.ts](../src/domain/packing/editor.test.ts) bevat tien regressies: immutable duplicatie/move, nominale toegestane rotation/forbidden-input, join-to-row preview zonder mutation, column snap/overlap, undo/redo-log en nieuwe branch, remapping van compressie-assen met blijvend rood, counts/gravity/bounds/top/kaarton-footprint, forged-green rejection, save-new/lineage/origineelbehoud/current-pointer/metadata logging en atomic invalid-save/operationlimiet. Tests geschreven, **niet uitgevoerd**.

Uitgevoerd: operation-table grants/RLS via catalogus (anon SELECT=false, authenticated SELECT=true en write/delete=false, service-role toegang=true); bestaande immutable/context/modeguards en nieuwe audit/activationguards via catalogus gecontroleerd. Geen fixtures in productie geschreven. Niet uitgevoerd: typecheck/build/Vitest/lint/browser/a11y/twee-account/transaction rollback. Geel/oranje tolerantieacceptatie/override en intelligente patroonacties niet geïmplementeerd en dus niet als getest presenteren.

Browser/DB-acceptatie nog uit te voeren:
- Calculated → duplicate → select → move/rotation/snap/join preview → bevestigen → undo/redo → validate → save edited → reopen: origineel/products/doos/speling/counts/mode/context blijven identiek; edited krijgt nieuwe ID en based_on.
- Preview annuleren verandert niets; rood toepassen in draft mag, maar rood Save/Maak actief wordt geblokkeerd. Nominale maten blijven ook bij overlap/as-tolerantie ongewijzigd.
- Dominante rij/kolom/oriëntatie/laag en kleine groep: badge/highlight diagnostisch; aangesloten rest vermindert markering/handlingpenalty waar toepasselijk.
- Grid/view/laagselectie verandert geen fysieke data zonder expliciete bevestigde operatie; toetsenbordselectie bereikbaar; geen horizontale page-scroll op 320/768/1280/1920px.
- Audit heeft stabiele operation UUID, juiste persisted solution-ID/actor/tijd/type/parameters/before/after/note, inclusief undo/redo; metadata/MAKE_CURRENT append-only. Directe clientlog INSERT/UPDATE/DELETE en andere owner/anon SELECT weigeren.
- Activeren toont definitie/old/new/warnings, vervangt pointer atomisch, bewaart original/history en logt MAKE_CURRENT. Concurrentie en transaction-rollback van mislukte loginsert nog testen.
- Invalid snapshot met gefingeerde green flag in app hervalidatie geweigerd; databaseguard controleert stored flag en preserved inputs, niet onafhankelijke volledige fysica.
- Initiële audit in individuele JSON; later activation/metadata in workspace 0.6-export. Lokale modus geen packaging-API/RPC, geen persistentie/transfer; herladen verliest ook opgeslagen editorrecords.

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
