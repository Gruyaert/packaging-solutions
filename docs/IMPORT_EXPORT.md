# Import/exportcontract

Versie 0.7. Lokale XLSX-inspectie, expliciete mapping/preview, atomische Supabase-sync en interactieve offline solution-/palletrapporten. Originele Excelheaders en bronmapping worden niet verzonnen.

## Interactief offline HTML (0.7)
**Export → Interactief HTML rapport** maakt één bestand met de lokaal gebundelde Plotly gl3d-runtime inline, dezelfde generieke placement-viewer/model als de app en volledige brondata. Geen CDN, externe scripts, server, React of Dyad-runtime nodig bij openen. WebGL is nodig voor 3D; 2D-projecties blijven selecteerbaar. De exportgeneratie in de app moet wel de lokale bundle kunnen laden. Offline openen via file:// en productie-minificatie zijn nog niet interactief geverifieerd.

JSON is waarheid: `<script type="application/json" id="packaging-solution-data">` bevat titel/kind, alle placements, producten, fysieke bounds, validatie, fullSolution, bekende shape/definition/mode/productNumber-context, gekoppelde palletresultaten en genormaliseerde visualisatie-instellingen. Fysieke snapshot blijft 0.3 met optionele editor-audit; werkruimte-export blijft 0.6 met operationlogs. Ontbrekende bronmetadata wordt null/leeg, nooit verzonnen. Voor unsaved palletbronnen worden productgegevens expliciet meegegeven; database-doosbronnen hebben geen onbekende productinhoud. Context bij opgeslagen oplossingen wordt uit de huidige eigen masterrecords toegevoegd, niet als historische immutable masterversie voorgesteld.

De operator-infokaart vervangt de tien gelijkwaardige technische secties: maten/aantallen, product-/doosinhoud, eerste-laagschema, laagopbouw en interactieve visualisatie staan voorop. Context, productinvoer, plaatsingsdata, validatie/compressibility, palletinformatie, instellingen en full JSON blijven onderaan beschikbaar in standaard gesloten technische bijlagen. Print toont het statische eerste-laagschema en de laagopbouw, geen WebGL-canvas. Statistisch schema en tabellen zijn begrensd op 600 items/rijen met melding; volledige brondata blijft in JSON. Exploded/timeline/camera veranderen geen fysieke placements of ValidationJSON.

`rotation` normaliseert naar `upright` (standaard), `z` of `free`. Rechtop-modus begrenst de verticale kijkhoek zonder rollen/ondersteboven; zoom via wheel/pinch/knoppen/toetsenbord. Ongeldige/ontbrekende keuze wordt upright. Bij keepCamera=true worden genormaliseerde eye/up/center ook geëxporteerd, anders geen camera. Afzonderlijke rapportacties gebruiken defaults. Wit-blauw rapport en app delen de viewer. Palletbasis uit pallet.settings ligt op Z=0..palletHeight; fysieke doosplacements beginnen al boven de basis. Geen materiaalmodel/certificaat toegevoegd.

Bestandsnamen, datum in ISO UTC en veilige segmenten:
- SHAPE_STANDARD (scope SHAPE): `verpakkingsrapport_[ShapeID]_[ShapeVariantID]_[PackagingMode]_[datum].html`.
- PRODUCT_OVERRIDE (scope PRODUCT): `verpakkingsrapport_product_[ProductNumber]_[PackagingMode]_[datum].html`.
- FREE: `verpakkingsrapport_[vrije_ref]_[datum].html`.

Gebruikerstekst wordt HTML-escaped; ingebedde JSON escape't <, >, &, U+2028/U+2029 om script-breakout te voorkomen. Technische JSON wordt met textContent getoond. CSP blokkeert netwerkverbindingen; inline scripts/styles en eval zijn toegestaan voor de embedded Plotly-runtime. Download bevat mogelijk gevoelige producten/mastercontext/editor-actorinformatie; geen automatische upload of publicatie. Grote volledige JSON/Plotly-bundle vergroten bestand en parsekosten; bounded rendering is geen garantie tegen iedere freeze op onbeperkte bestanden.

## Bronnen en inspectie
Oorspronkelijk manifest: Omdozen.xlsx 7.802 bytes, Shapes.xlsx 48.345 bytes. De assistent heeft die broninhoud nog niet onafhankelijk geïnspecteerd of goedgekeurd. Geen oorspronkelijke bytes gewijzigd, gepubliceerd of naar Git/public gekopieerd. Zie [bronregister](sources/README.md).

ExcelJS wordt pas bij bestandskeuze geladen. Inspectie-JSON versie 0.2 bevat bestandsnaam/grootte, SHA-256 indien Web Crypto beschikbaar, sheets/visibility/ranges, lege rijnummers, merges, celtypen/waarden/tekst en formules/cache. Formules worden niet uitgevoerd; cache kan ontbreken/verouderd zijn. Bestaande keyinspectie vergelijkt exacte bronwaarden/types. Rapportdelen/download is een bewuste gebruikersactie, niet automatische upload.

## Operationele master-sync — intelligente herkenning, manuele fallback
Omdozenbeheer en Shapes masterdata starten met lokale herkenning van bekende Nederlandse/Engelse kolomlabels, hoofdletters, separators/diakritiek en mm-suffixen. De herkenner zoekt in de eerste 50 rijen van zichtbare werkbladen naar een kopregel met minstens twee herkende verplichte velden. Volledigheid van verplichte velden weegt zwaarder dan optionele matches. Bestandsnaam en onbekende celwaarden worden niet gebruikt om semantiek te verzinnen; geen externe AI-dienst/upload/API-kosten. Dit zijn uitlegbare herkenningsvoorstellen, geen garantie of getraind model.

Bij gelijkwaardige werkbladen/kopregels wordt geen mapping toegepast. Bij meerdere kolommen voor hetzelfde doelveld blijft dat doelveld ongekoppeld; veilige gedeeltelijke matches blijven beschikbaar. Ontbrekende verplichte velden of onduidelijkheid leiden naar manuele mapping. **2. Manueel mappen / aanpassen** is altijd beschikbaar, ook na succesvolle herkenning: kies werkblad/kopregel/kolom expliciet. **Kolommen in deze kopregel herkennen** geeft desgewenst een nieuw voorstel op de gekozen rij; **1. Intelligent herkennen** analyseert het hele werkboek opnieuw. Veranderen van werkblad/kopregel wist oude manuele koppelingen en bevestiging om stale mapping te voorkomen. Verborgen sheets worden alleen door de gebruiker gekozen, niet automatisch geselecteerd.

Verplichte cartonvelden: reference en interne length/width/height. Shapevelden: shape_id, variant_id, format_a/b/h. Geen automatische cm/inch-conversie, buiten→binnenconversie of Format A/B/H→productassenmapping. Neutrale labels zoals Length/L worden als voorstel getoond; de gebruiker moet interne mm-maten expliciet bevestigen. Maten positief, karton niet-negatief. Numerieke tekst accepteert decimale komma, niet automatische duizendtalsemantiek. Formulekoppen worden niet vertrouwd; numerieke datacellen mogen aanwezige formulecache gebruiken, sleutelformules niet. Booleanvelden accepteren true/false, 1/0, ja/nee of yes/no.

Ongekoppelde optionele doelvelden worden leeg/0, active=true en blocked=false. Ze kunnen bestaande waarden vervangen; preview toont alle doelwaarden. Geen stille behoud-/fallbackregel. Herkenning vervangt nooit preview, volledige validatie en bevestiging. Fouten/ontbrekende required mappings/dubbel gemapte kolommen/dubbele keys blokkeren alles. Maximaal 2000 records, geen gedeeltelijke sync. Iedere mappingwijziging wist de bevestiging.

Na expliciete bevestiging van mapping/preview/mm-eenheid schrijft `sync_packaging_master` eigen records + filename/checksum/count/history in één transactie. Uniek op owner+reference of owner+shape_id+variant_id; upsert zonder automatische deletions. Oorspronkelijke bestanden/werkboekinhoud worden niet server-side bewaard. Shape Format A/B/H wordt niet automatisch vertaald naar product-L/B/H.

## Bestandsgrenzen
Alleen vertrouwde XLSX tot 5 MB, maximaal 20.000 rijen/256 kolommen per blad en 200.000 gevulde cellen per bestand. Structuurlimieten gelden na parsing, dus geen volledige ZIP-bomb-/malwarebescherming. Geen links openen of formules uitvoeren.

## Exports
- **Fysieke solution-JSON 0.3**: products + box/spacing/placements, afgeleide validatie/scores en optionele editor-audit. Bij openen schema en fysieke geometrie opnieuw valideren; niet vertrouwen op meegeleverde ValidationJSON. Lokale pallet-snapshotinvoer maximaal 5 MB. Geen definitie-/workspace-herstelimport.
- **Interactief HTML**: embedded Plotly + gedeelde viewer en volledige bron-JSON; alle secties en veiligheid hierboven. Geen fysieke renderer-offsets in de waarheid.
- **Pallet-JSON**: concrete bron, bekende bronproducten, instellingen en geselecteerd fysiek patroon; opgeslagen resultaat is immutable.
- **Werkruimte-JSON 0.6**: alle eigen masterrecords, definities, solution-metadata/context/snapshots, operationlogs, importhistoriek en palletresultaten. Alleen download, geen automatisch herstel of CERM-format.

Downloads kunnen vertrouwelijke data bevatten; geen automatisch delen/push naar GitHub/CERM. Master-sync wijzigt geen bestaande solution-snapshots. Bronpublicatie en productieformats blijven afzonderlijke besluiten.

Zie [gebruik](USER_MANUAL.md), [data](DATA_MODEL.md), [tests](TEST_PLAN.md), [vragen](OPEN_QUESTIONS.md) en [index](README.md).
