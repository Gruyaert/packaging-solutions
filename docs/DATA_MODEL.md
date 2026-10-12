# Datamodelcontract

Werkruimtecontract 0.6; fysiek snapshotcontract 0.3 met optionele editor-audit. **Bevestigd** = vereiste uit B1/B4/editorfeedback; geen Excelmapping. **Voorlopig voorstel** = technische representatie/heuristiek. **Open** = onbekend.

## Actuele Supabase-opslag (0.6, gaat voor historische voorstellen hieronder)
Privé per auth-gebruiker, geen profielen/teams. Alle tabellen hebben UUID id, user_id met auth.users-FK, RLS en expliciete grants. Geen anon access of client hard delete; service_role full CRUD uitsluitend server-side.

| Tabel | Velden en keys | Clientrechten / mutabiliteit |
|---|---|---|
| packaging_cartons | reference (uniek per owner), description/material, positieve interne length/width/height mm, cardboard>=0, active, modified_on | SELECT/INSERT/UPDATE; status ipv delete; snapshots bewaren hun eigen doosmaten |
| packaging_shapes | shape_id+variant_id uniek per owner, description/product_group, positieve format_a/b/h mm, blocked/active, modified_on | SELECT; upsert alleen via master-sync-RPC |
| packaging_definitions | name, scope SHAPE/PRODUCT, shape_id/variant_id of product_number, packaging_mode STOCK/PERSO, settings JSON, status, current_solution_id FK, modified_on | SELECT/INSERT/UPDATE; unieke owner/scope/masterkey/mode/productcontext; keycontext met solutions niet wijzigen |
| packaging_solutions | definition_id optioneel, packaging_mode, name/status, created_from, based_on FK, snapshot JSON 0.3, metadata.notes, created_on/modified_on | SELECT/INSERT/UPDATE; alleen metadata/status wijzigbaar; snapshot/context/mode/afkomst/created_on immutable |
| packaging_imports | kind cartons/shapes, filename/checksum, summary.rows/policy, created_on | SELECT; RPC schrijft atomisch bij master-sync |
| packaging_pallets | name, source/settings/result JSON met concrete placements, created_on | SELECT/INSERT; opgeslagen resultaten immutable |
| packaging_operations | id (operation UUID), user_id, solution_id FK, timestamp, operation_type, parameters_json, before_placement_json/after_placement_json, actor UUID, note | authenticated SELECT-only, owner-RLS; geen anon; trigger-only clientlogwrites, append-only; service-role full CRUD |

Guards: eigenaar onveranderlijk; SHAPE-masterkey bestaat; definition/current solution en variantparent moeten owner/context/mode matchen. Actieve huidige solution niet archiveren. Activeren via afzonderlijke RPC wijzigt pointer/status binnen de definitie, niet placements. Standalone solution heeft eveneens een immutable mode. Eigen database-ID verschilt van lokale engine solutionId.

Editor: snapshot.editor bewaart sourceSolutionId (database-ID), baselineCounts, palletSettings en maximaal 202 gelogde operations (200 draftacties + twee Save-events). Edited-insert vereist created_from=edited, based_on=source en ongewijzigde products/box/spacing/counts ten opzichte van origineel. Initiële audit hoort bij immutable snapshot; operations worden atomisch naar owner-private rows gekopieerd met dezelfde operation UUID, persisted solution_id en server-side actor. Before/after zijn arrays van getroffen placements (bij duplicatie volledig; bij metadata/validatie zonder geometrische wijziging leeg). Later EDIT_METADATA en MAKE_CURRENT zijn append-only buiten de snapshot. current-event bevat definitie/old/new current. Stored invalid kan niet actief/current worden; serverguards controleren opgeslagen status/preservation, geen onafhankelijke volledige fysica. Geen invalid override in v1.

Settings JSON is opslagruimte, geen geïmplementeerde automatische veldgewijze override/fallback-resolver. Source Format A/B/H is masterdata; geen automatische productas-mapping. Supabase standaardgrants zijn ingetrokken en minimale rollenrechten opnieuw toegepast; RLS én grants zijn gecontroleerd.

## Nieuw fysiek enginecontract (B4, leidend boven oude voorstellen)
[types.ts](../src/domain/packing/types.ts) is uitvoerbaar: Product met productId/reference,length/width/height(mm),weightKg,quantity,rotations,maxInLength/maxInWidth/maxLayers. Product-ID is lokaal stabiel, niet automatisch ProductNumber/CERM-key. compressibilityX/Y/Z en allowCompression optioneel expliciet behouden; alleen editor-overlapdiagnostiek, geen geometrische acceptatie of nominale verkleining in v1.

Placement heeft verplichte placementId/productId,x/y/z,length/width/height (finite numbers in mm),orientation (een van zes labels),layerIndex (niet-negatief integer). Fysieke dimensies zijn georiënteerde nominale maten; bronproduct bewaart oorspronkelijke L/B/H. Dit vervangt onderstaande oude position/nominalDimensions/orientation-objectvoorstellen. Coördinaten X=L,Y=B,Z=H; z begint0. Spacing.length/width totaal, gelijke halve rand; spacing.height uitsluitend bovenaan.

Box is een engine-inputadapter met boxId/reference, interne length/width/height en cardboard(mm), niet de bevestigde Excel-doosentiteit. Buitenmaat=binnen+2karton. Solution bevat solutionId/box/spacing/placements/ValidationJSON/counts/utilization/air/transportEfficiency/weightKg/practicalScore en metadata.restPlacementIds/handlingScore/pattern. Scores zijn afgeleid, nooit fysieke waarheid. Editorwijzigingen gebeuren alleen in een duplicaat-draft; opgeslagen fysieke inhoud blijft immutable.

Snapshotcontract0.3: {contractVersion,products,solution,editor?}; JSON met volledige placements/speling en bij edited snapshots de initiële audit. Bij reimport schema én geometrie opnieuw valideren, scores herberekenen; edited auditcontext/counts/palletconstraints eveneens controleren. Definitie/mode/owner staan op database-record; audit bevat bron-ID en actorinformatie en kan dus vertrouwelijk zijn. Shape-resolutie niet impliciet toevoegen. Palletinput gebruikt Box buitenmaten uit adapter/solution/saved snapshot; settings meten mm en overhang per zijde, resultaten concrete doosplacements plus counts/hoogte/benutting/score.

## Historisch masterdata-/opslagveldregister (0.3; actuele opslag hierboven gaat voor)
Types hieronder blijven voorstellen voor masterdata/opslag, niet Excelkolommen. Bron B1 tenzij B4 hierboven specificeert. Referentieel sleutelbeleid en eigenaar blijven open.

| Entiteit / veld | Betekenis, typevoorstel | Verplicht / sleutel / relatie | Mutabiliteit en validatie | Status / vraag |
|---|---|---|---|---|
| ShapeMaster.ShapeID | shape-identiteit, string | ja; samengestelde key | gecontroleerde masterimport; niet leeg | bevestigd; Q01 |
| ShapeMaster.ShapeVariantID | shapevariant, string | ja; met ShapeID uniek | duplicaten afwijzen | bevestigd; Q01 |
| ShapeMaster.nominalDimensions | nominale geometrie, object | open; voorstelnaam | geen tolerantie in nominale maten; positief indien maat | voorlopig voorstel; Q05 |
| ShapeStandardDefinition.ShapeID, ShapeVariantID | shapeverwijzing, strings | ja; relatie ShapeMaster | geldige masterkey | bevestigd; Q01 |
| ShapeStandardDefinition.PackagingMode | modus, enum | ja; derde keydeel | uitsluitend STOCK of PERSO | bevestigd; Q04 |
| ShapeStandardDefinition.settings | standaardwaarden, object | velden open; voorstelnaam | gecontroleerde bron; resolutie open | voorlopig voorstel; Q03 |
| ProductOverride.ProductNumber | productnummer, string | ja; voldoende zonder shape | niet leeg; unieke scope nog open | bevestigd; Q03 |
| ProductOverride.ShapeID, ShapeVariantID | optionele verwijzing, strings | niet verplicht | referentievalidatie indien gekozen; paarbeleid open | bevestigd; Q03 |
| ProductOverride.PackagingMode | eventuele override-scope, enum | open; geen bewezen keydeel | modusvalidatie indien ingevoerd | voorlopig voorstel; Q03 |
| ProductOverride.values | overridevelden, object | open; voorstelnaam | voorrang bevestigd; veldmerge/nullfallback open | voorlopig voorstel; Q03 |
| PackagingContext.PackagingMode | gescheiden modus, enum | ja; eigenaar/key open | STOCK/PERSO niet vermengen | bevestigd; Q04 |
| PackagingContext.CurrentSolutionID | actieve solutionverwijzing, string | eigenaar, nulbaarheid open | wijst naar variant binnen juiste context | veld bevestigd, plaatsing voorlopig voorstel; Q04 |
| Solution.SolutionID | identiteit, string | ja als concept; veldnaam voorstel | historische inhoud onveranderlijk | voorlopig voorstel; Q04 |
| Solution.parentSolutionID | variantafkomst, string | open; voorstelnaam | nieuwe variant, geen overschrijven | voorlopig voorstel; Q04 |
| Solution.contextRef | contextrelatie, string | relatie vereist; naam/key open | nooit modusoverschrijdend | voorlopig voorstel; Q04 |
| Solution.placements | fysieke plaatsingen, array | fysieke waarheid; opslagrelatie open | alleen bij aanmaak; geen rendermutaties | voorlopig voorstel; Q06 |
| Placement.position | fysieke coördinaten, object | geometrisch nodig; naam open | assen/oorsprong/precisie nog niet validerbaar | voorlopig voorstel; Q06 |
| Placement.orientation | rotatie, object | open; voorstelnaam | geen generieke rotaties aannemen | voorlopig voorstel; Q06 |
| Placement.nominalDimensions | nominale maat, object | maatconcept bevestigd; naam open | behouden; geen renderer/tolerantie-effect | voorlopig voorstel; Q05 |
| PracticalTolerance.heightClearance | bovenspeling, number | verplichtheid open; voorstelnaam | volledig bovenaan; eenheid/bereik open | voorlopig voorstel; Q05 |
| PracticalTolerance.lengthClearance, widthClearance | totale horizontale speling, numbers | open; voorstelnamen | totale speling beide zijden; verdeling open | voorlopig voorstel; Q05 |
| PracticalTolerance.compressibility | aparte compressieparameter, object | open; voorstelnaam | nooit nominale maten vervangen | voorlopig voorstel; Q05 |
| VisualSettings.explodedView, layerSpacing, animation | weergave, boolean/number/boolean | optioneel voorstel | alleen renderstate, geen fysieke waarheid | voorlopig voorstel; Q02, Q06 |
| Doosentiteit | naam, velden, sleutels en relatie onbekend | open | pas bevestigen na Omdozen-inspectie | open; Q01, Q05 |

## Grenzen en resolutie
Bronwaarden zijn geen gevalideerde masterdata. Masterdata is geen eigen appdata. Shape standaard en override worden niet tot één mutabel object gereduceerd. R05 legt voorrang vast, maar veldgewijze fallback bij ontbrekende, lege of nullwaarden blijft Q03. Productsleutel vereist geen shape. CurrentSolutionID-eigenaarschap is Q04; plaatsing op PackagingContext is een voorstel. Variantmaken bewaart oorspronkelijke placements en metadata; actief kiezen wijzigt uitsluitend de toekomstige actieve verwijzing.

## JSON-documentatievoorbeelden
Onderstaande envelop is **voorlopig voorstel**, contractversie 0.1; geen schema-validator of importformaat. Alle envelopvelden zijn voorstel; ProductNumber is bevestigd als voldoende overridebasis. Illustratieve identificator, geen ontvangen product.

```json
{
  "contractVersion": "0.1",
  "status": "voorlopig voorstel",
  "proposedEntity": "ProductOverride",
  "data": { "ProductNumber": "<productnummer>" }
}
```

Tweede voorbeeld: voorgestelde keyrepresentatie, geen Excelrij of echte shape.

```json
{
  "contractVersion": "0.1",
  "status": "voorlopig voorstel",
  "proposedEntity": "ShapeStandardDefinition",
  "data": { "ShapeID": "<shape-id>", "ShapeVariantID": "<variant-id>", "PackagingMode": "STOCK" }
}
```

Zie [regels R01–R15](ALGORITHM_CONTRACT.md), [architectuur](ARCHITECTURE.md), [import](IMPORT_EXPORT.md), [vragen](OPEN_QUESTIONS.md) en [index](README.md).
