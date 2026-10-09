# Gebruikershandleiding

Versie 0.2. **Bevestigd**: broninspectie is toegevoegd aan de startpagina. **Voorlopig voorstel**: stijl en koprijselectie. **Open**: domeinmapping en oorspronkelijke Zite-bediening.

## Excelbestanden inspecteren
1. Klik bovenaan op **Excelbestanden inspecteren**.
2. Selecteer de originele Shapes.xlsx en Omdozen.xlsx op je computer, eventueel samen.
3. Kies een bestand en open de werkbladen. Ook verborgen werkbladen worden opgenomen.
4. Controleer de koprij: standaard wordt de eerste niet-lege rij voorgesteld, niet als bewezen header aangenomen.
5. Selecteer expliciet sleutelkolommen om exacte duplicaten en ontbrekende/niet-toetsbare sleutels te bekijken. Formules in sleutelvelden worden niet automatisch als geldig beschouwd.
6. Bekijk broncellen, celtypen, formules en opgeslagen cacheresultaten. De tabel toont 20 niet-lege datarijen per pagina.
7. Gebruik **Inspectierapport downloaden** voor het volledige JSON-bronrapport. Je kunt dit rapport hier in de chat delen om de mapping te laten uitwerken; controleer eerst op vertrouwelijke gegevens.

Geen CSV-conversie of andere ChatGPT-chat nodig. De bestandskeuze geeft de browser toestemming om lokaal te lezen; het is geen serverupload. Chatbijlagen zijn niet automatisch toegankelijk vanuit de preview. Het rapport bevat alle uitgelezen cellen, werkbladzichtbaarheid, lege rijen binnen het gebruikte bereik, samengevoegde bereiken en SHA-256 indien Web Crypto beschikbaar is. Interactieve koprij- en sleutelkeuzes worden niet in het rapport opgeslagen.

## Privacy en beperkingen
Bestanden worden niet gewijzigd, naar een server gestuurd, in Git geplaatst of in browseropslag bewaard. Inspectie wissen of pagina herladen verwijdert de sessieresultaten; een gedownload rapport blijft op je computer staan. Een nieuwe selectie vervangt de vorige resultaten. Alleen vertrouwde .xlsx-bestanden gebruiken; maximaal 5 MB per bestand, 20.000 rijen/256 kolommen per blad, 200.000 gevulde cellen per bestand. Limieten voor rijen/cellen worden na parsing gecontroleerd; dit is geen sandbox voor schadelijke spreadsheets. Formules worden niet uitgevoerd en links niet geopend. Cachewaarden kunnen ontbreken of verouderd zijn. ExcelJS levert geïnterpreteerde celwaarden, niet de ruwe XML van alle Excel-eigenschappen.

## Status begrijpen
**Technisch geïnspecteerd — mapping nog open** betekent dat een bestand lokaal is uitgelezen, niet dat de betekenis of masterdata gevalideerd is. Het afzonderlijke bronregister blijft de vastgelegde projectstatus tonen totdat een inspectierapport is beoordeeld. Geen eenheden of doosentiteit worden verzonnen.

## Nog niet beschikbaar
Contractfase — optimalisatie nog niet beschikbaar. Geen packing-engine, productie-import, database, CERM, definitieve solutionbewerking, 3D of operationele exports. Alleen het inspectierapport kan worden gedownload. STOCK/PERSO en immutable solutions blijven contractvereisten, niet geïmplementeerde flows.

Voor vervolg zijn het echte inspectierapport, screenshots/input-outputvoorbeelden en opname-/publicatiebeleid nodig. Zie [UI](UI_CONTRACT.md), [import/export](IMPORT_EXPORT.md), [vragen](OPEN_QUESTIONS.md) en [index](README.md).
