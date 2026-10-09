# Import/exportcontract

Versie 0.4. Lokale XLSX-inspectie, expliciete mastermapping/preview, atomische Supabase-sync en fysieke solution-/palletrapporten beschikbaar. Originele Excelheaders en bronmapping worden niet verzonnen.

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
- **Fysieke solution-JSON 0.3**: products + box/spacing/placements, afgeleide validatie/scores. Bij openen schema en fysieke geometrie opnieuw valideren; niet vertrouwen op meegeleverde ValidationJSON. Lokale pallet-snapshotinvoer maximaal 5 MB. Geen definitie-/workspace-herstelimport.
- **Solution HTML**: escaped gebruikerscontent, dezelfde concrete placements in tabellen/laag-SVG en ValidationJSON. Geen afgeleide renderercoördinaten.
- **Pallet-JSON**: concrete bron, instellingen en geselecteerd fysiek patroon; opgeslagen resultaat is immutable.
- **Werkruimte-JSON 0.4**: alle eigen masterrecords, definities, solution-metadata/context/snapshots, importhistoriek en palletresultaten. Alleen download, geen automatisch herstel of CERM-format.

Downloads kunnen vertrouwelijke data bevatten; geen automatisch delen/push naar GitHub/CERM. Master-sync wijzigt geen bestaande solution-snapshots. Bronpublicatie en productieformats blijven afzonderlijke besluiten.

Zie [gebruik](USER_MANUAL.md), [data](DATA_MODEL.md), [tests](TEST_PLAN.md), [vragen](OPEN_QUESTIONS.md) en [index](README.md).
