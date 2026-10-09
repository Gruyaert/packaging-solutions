# Import/exportcontract

Versie 0.2. **Bevestigd**: een lokale XLSX-inspectievoorziening is toegevoegd. **Voorlopig voorstel**: koprijkeuze en toekomstige importflow. **Open**: bronmapping, masterdatavalidatie en operationele exports.

## Vastgelegde bronnen versus lokale inspectie
Manifest/file-stat uit basisfase: Omdozen.xlsx 7.802 bytes; Shapes.xlsx 48.345 bytes. Geen oorspronkelijke bytes gewijzigd of naar public/docs gekopieerd. Werkelijke werkbladen/kolommen van deze twee bestanden zijn in deze implementatieturn niet gelezen; geen mapping ingevuld. Zie [bronregister](sources/README.md).

## Beschikbare inspectie
ExcelJS 4.4.0 is bewust toegevoegd voor read-only broninspectie en wordt pas bij bestandskeuze dynamisch geladen. src/infrastructure/inspect-workbook.ts leest ArrayBuffer in de browser. Geen backend, netwerkverzending, database of persistente state. De keuze van de gebruiker is noodzakelijk omdat de preview geen directe toegang tot chatbijlagen heeft.

JSON-rapport 0.2 bevat bestandsnaam, bytegrootte, inspectietijd, SHA-256 van oorspronkelijke bytes indien Web Crypto beschikbaar is, werkbladnamen/zichtbaarheid, gebruikt bereik, lege rijnummers binnen dat bereik, samengevoegde bereiken en alle niet-lege cellen met adres, type, geïnterpreteerde bronwaarde, tekst en indien aanwezig formule/sharedFormula/cachedValue. Cached values worden niet herberekend en kunnen verouderd zijn. Niet alle XLSX-XML/stijleigenschappen worden geïnventariseerd. Samengevoegde cellen kunnen de waarde van hun mastercel weerspiegelen; ranges zijn apart vastgelegd.

Koprij = eerste niet-lege rij als aanpasbaar voorstel. Sleutelkolommen kiest de gebruiker, nooit op basis van bestandsnaam. Exacte bronwaarden plus typen worden vergeleken zonder trim-/nummernormalisatie; een witruimte-only waarde geldt wel als ontbrekend. Formules in keys zijn niet toetsbaar. Dubbele sleutelgroepen en ontbrekende/niet-toetsbare rijnummers zichtbaar; volledig lege rijen zijn apart gerapporteerd. Deze interactieve keuzes/controle-uitkomsten worden niet opgeslagen in het bronrapport.

Alleen vertrouwde XLSX tot 5 MB; maximaal 20.000 rijen en 256 kolommen per werkblad, 200.000 gevulde cellen per bestand. Structuurlimieten gelden na parsing, niet als bescherming tegen ZIP-bombs. Fouten geven geen gedeeltelijk werkboekrapport. Geen formules uitvoeren of links openen. Download is een inspectierapport, geen operationele export; kan vertrouwelijke bronwaarden bevatten.

## Nog te bevestigen (Q01, Q05)
Headers/eenheden/semantiek, exacte doosentiteit, relaties en gevalideerde keys pas na beoordeling van werkelijk gedeelde rapporten. Technisch uitlezen is niet hetzelfde als goedgekeurde mapping of masterimport. Geen automatische schatting van eenheden.

## Toekomstige productieflow — voorstel
Bronherkomst vastleggen na toestemming → expliciete mapping-preview → schema-/keyvalidatierapport per werkblad/rij/veld → goedgekeurde masterrevisie, gescheiden van eigen appdata. Shapes niet vrij overschrijven; appdata niet als CERM-master terugschrijven (R14–R15). Importvervanging/verwijderingsbeleid/exportformats open Q08, opslag Q09, Git-opname Q10. Geen productie-import of operationele exports geïmplementeerd.

Zie [gebruik](USER_MANUAL.md), [data](DATA_MODEL.md), [tests](TEST_PLAN.md), [vragen](OPEN_QUESTIONS.md) en [index](README.md).
