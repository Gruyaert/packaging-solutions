# Import/exportcontract

Versie 0.7. Lokale XLSX-inspectie, expliciete mapping/preview, atomische Supabase-sync en interactieve offline solution-/palletrapporten. Originele Excelheaders en bronmapping worden niet verzonnen.

## Interactief offline HTML (0.7)
**Export → Interactief HTML rapport** maakt één bestand met de lokaal gebundelde Plotly gl3d-runtime inline, dezelfde generieke placement-viewer/model als de app en volledige brondata. Geen CDN, externe scripts, server, React of Dyad-runtime nodig bij openen. WebGL is nodig voor 3D; 2D-projecties blijven selecteerbaar. De exportgeneratie in de app moet wel de lokale bundle kunnen laden. Offline openen via file:// en productie-minificatie zijn nog niet interactief geverifieerd.

JSON is waarheid: `<script type="application/json" id="packaging-solution-data">` bevat titel/kind, alle placements, producten, fysieke bounds, validatie, fullSolution, bekende shape/definition/mode/productNumber-context, gekoppelde palletresultaten en genormaliseerde visualisatie-instellingen. Fysieke snapshot blijft 0.3 met optionele editor-audit; werkruimte-export blijft 0.6 met operationlogs. Ontbrekende bronmetadata wordt null/leeg, nooit verzonnen. Voor unsaved palletbronnen worden productgegevens expliciet meegegeven; database-doosbronnen hebben geen onbekende productinhoud. Context bij opgeslagen oplossingen wordt uit de huidige eigen masterrecords toegevoegd, niet als historische immutable masterversie voorgesteld.

Rapportsecties: 1 Overzicht, 2 Shape / Definition, 3 Producten, 4 Verpakking (placements), 5 3D / Projecties, 6 Validatie / compressibility, 7 Laagopbouw, 8 Palletisatie, 9 Instellingen, 10 Technische data/full JSON. Viewers tonen hoogstens de laatste 600 items binnen de gekozen laag/timeline; de volledige data blijft in JSON. Exploded/timeline/camera wijzigen nooit fysieke placements of ValidationJSON. Instellingen van Export in de viewer zijn de huidige weergave; afzonderlijke rapportacties starten met defaults.

Bestandsnamen, datum in ISO UTC en veilige segmenten:
- SHAPE_STANDARD (scope SHAPE): `verpakkingsrapport_[ShapeID]_[ShapeVariantID]_[PackagingMode]_[datum].html`.
- PRODUCT_OVERRIDE (scope PRODUCT): `verpakkingsrapport_product_[ProductNumber]_[PackagingMode]_[datum].html`.
- FREE: `verpakkingsrapport_[vrije_ref]_[datum].html`.

Gebruikerstekst wordt HTML-escaped; ingebedde JSON escape't <, >, &, U+2028/U+2029 om script-breakout te voorkomen. Technische JSON wordt met textContent getoond. CSP blokkeert netwerkverbindingen; inline scripts/styles en eval zijn toegestaan voor de embedded Plotly-runtime. Download bevat mogelijk gevoelige producten/mastercontext/editor-actorinformatie; geen automatische upload of publicatie. Grote volledige JSON/Plotly-bundle vergroten bestand en parsekosten; bounded rendering is geen garantie tegen iedere freeze op onbeperkte bestanden.

## Bronnen en inspectie
Oorspronkelijk manifest: Omdozen.xlsx 7.802 bytes, Shapes.xlsx 48.345 bytes. De assistent heeft die broninhoud nog niet onafhankelijk geïnspecteerd of goedgekeurd. Geen oorspronkelijke bytes gewijzigd, gepubliceerd of naar Git/public gekopieerd. Zie [bronregister](sources/README.md).

ExcelJS wordt pas bij bestandskeuze geladen. Inspectie-JSON versie 0.2 bevat bestandsnaam/grootte, SHA-256 indien Web Crypto beschikbaar, sheets/visibility/ranges, lege rijnummers, merges, celtypen/waarden/tekst en formules/cache. Formules worden niet uitgevoerd; cache kan ontbreken/verouderd zijn. Bestaande keyinspectie vergelijkt exacte bronwaarden/types. Rapportdelen/download is een bewuste gebruikersactie, niet automatische upload.

## Operationele master-sync
Omdozenbeheer en Shapes masterdata bieden een eigen expliciete werkblad/koprij/kolom-mapping; geen automatische suggestie op basis van bestandsnaam of kolomlabel. Verplichte cartonvelden: reference en interne length/width/height. Shapevelden: shape_id, variant_id, format_a/b/h. Gegevensmaten moeten positieve mm-getallen zijn; karton niet-negatief. Numerieke tekst accepteert decimale komma, niet automatische duizendtalsemantiek. Formulewaarden mogen voor numerieke maten alleen uit aanwezige cache komen; sleutelformules worden afgewezen. Booleanvelden accepteren true/false, 1/0, ja/nee of yes/no.

Ongekoppelde optionele doelvelden worden leeg/0, active=true en blocked=false. Ze kunnen bestaande waarden vervangen; preview toont de volledige doelwaarden. Geen stille behoud-/fallbackregel. Filters/paginering laten alle previewrecords bereikbaar. Fouten, ontbrekende required mappings, dubbel gemapte kolommen of dubbele keys blokkeren het geheel. Maximaal 2000 records; geen gedeeltelijke sync.

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
