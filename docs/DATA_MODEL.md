# Datamodelcontract

Contractversie 0.1. **Bevestigd** = vereiste uit B1 (goedgekeurd plan), niet Excelmapping. **Voorlopig voorstel** = technische representatie. **Open** = onbekend; geen uitvoerbaar schema.

## Veldregister
Types string, object, number en array hieronder zijn **voorlopig voorstel**, ook bij bevestigde veldnamen. Exacte bronceltypen, nullbeleid, lengte en eenheden zijn open. Verplichtheid betreft logisch contract, niet een Excelkolom. Bron B1 tenzij anders vermeld.

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
