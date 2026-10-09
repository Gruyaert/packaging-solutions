# Gebruikershandleiding

Versie 0.5. Met account bewaart Supabase eigen masterrecords en resultaten; zonder account is een afzonderlijke tijdelijke testwerkruimte beschikbaar. Rekenen blijft lokaal in de browser. Zoekdekking is heuristisch. Geen productie-/transportcertificaat of CERM-write.

## Testen zonder account
Klik op **Testen zonder account** boven het aanmeldformulier, of open `/test`. Ben je al aangemeld, gebruik **Lokaal testen** in de header. De testwerkruimte begint leeg; er zijn geen verzonnen producten, masterrecords of voorbeeldresultaten.

Gebruik eigen handmatige invoer of Excelbestanden om dezelfde berekeningen en beheerflows te testen: omdozen, gecontroleerde shapes-import, definities, solutionopslag/varianten/activeren/archiveren en palletresultaten. De lokale provider valideert invoer en bewaakt snapshot/context/modus; dit is geen test van echte databaseautorisatie of servertransacties.

**Alles blijft uitsluitend in het browsergeheugen.** Ook als je al ingelogd bent, worden geen Supabase-packagingrecords gelezen of gewijzigd. Er is geen anonieme aanmelding, localStorage/IndexedDB voor testrecords of automatische overdracht naar je privéwerkruimte. Herladen, sluiten of verlaten wist de testwerkruimte. Gewone tabwissels binnen de app behouden de lokale records.

Wil je resultaten bewaren, download solution-JSON/HTML, pallet-JSON of de lokale werkruimte-JSON via Rapporten / Exports voordat je vertrekt. Gedownloade bestanden blijven op je computer; volledige werkruimte-JSON heeft geen automatische herstelimport. Verlaten via de header vraagt bevestiging. Browser Terug/herladen kan de testdata eveneens wissen.

## Aanmelden en werkruimte
Meld je aan of maak een account via email/password. Bevestig je email indien Supabase dit vereist. Gebruik Wachtwoord vergeten om een herstelmail aan te vragen; de link opent een wachtwoord-update, niet de gewone startpagina. De app gebruikt een callback op de huidige app-origin. Voor een nieuw deployment moeten de absolute callback/reset-URLs in Supabase Redirect URLs zijn toegestaan.

Iedere gebruiker heeft een eigen privéwerkruimte. Er zijn geen gedeelde teamrecords, beheerrollen of extra profielvelden. Afmelden maakt de lokale dataquerycache leeg; opgeslagen records blijven bestaan. Gewone herlading bewaart de serverdata, maar niet de onopgeslagen invoer/resultaten.

## Tabellen en navigatie
Gebruik de acht hoofdtabs; Debug / Performance is discreet rechts. Iedere tabel heeft kolomfilters en 25 records per pagina. Breedte-overflow blijft binnen de tabel. Geavanceerde opties zijn uitklapbaar. Kolomfilters wijzigen geen opgeslagen gegevens.

## Omdozenbeheer
1. Voeg een referentie, beschrijving/materiaal, positieve **interne L/B/H in mm** en niet-negatieve kartondikte toe.
2. Bewerk bestaande records of activeer/deactiveer ze. Er is geen hard delete.
3. Kies voor Excelimport het XLSX-bestand, werkblad en koprij. Koppel alle verplichte doelvelden expliciet; mappings worden niet geraden.
4. Controleer de volledige filterbare preview (nieuw/bijwerken/ongewijzigd) en alle waarden. Fouten of dubbele keys blokkeren de volledige import.
5. Bevestig mapping en millimetereenheid en synchroniseer. Records worden atomisch ingevoegd/bijgewerkt; ontbrekende bronrecords worden **niet verwijderd**. Importhistoriek bewaart bestandsnaam, checksum en aantal.

Ongekoppelde optionele velden worden leeg/0, actief=true en geblokkeerd=false. Dit kan bestaande waarden vervangen; de preview toont deze doelwaarden. Maximaal 2000 gegevensrijen per sync. Upload geen onbetrouwbare XLSX-bestanden.

## Shapes masterdata
Filter ShapeID, variant, beschrijving/productgroep, Format A/B/H en status. Vrije masterbewerking is niet beschikbaar; gebruik de gecontroleerde Excelmapping/preview. Sleutel = ShapeID + variant. Actieve, niet-geblokkeerde shapes kunnen een definitie starten. De app interpreteert Format A/B/H niet automatisch als product-L/B/H.

## Packaging Definitions
Maak een naam en kies SHAPE of PRODUCT en STOCK of PERSO. SHAPE kiest een bestaande actieve masterkey in een filterbare lijst. PRODUCT heeft alleen een productnummer nodig. Bestaande logische context blijft behouden; naam/status kunnen wijzigen. Berekenen opent de passende zoek-/maatwerktab en de opslagcontext. Actieve openen toont de aan deze definitie gekoppelde snapshot.

Er is nog geen automatische veldgewijze override/standaard-fallback. Productinvoer wordt bewust ingevuld; het bestaan van een definitie is geen domeinmapping van een Excelrecord.

## Verpakking zoeken
1. Vul 1–5 producten in: referentie, nominale L/B/H mm, aantal en gewicht g/kg met maximaal 3 invoerdecimalen.
2. Open Geavanceerd voor toegelaten rotaties en productmaxima. Maxima tellen startposities per product/laag en Z-startniveaus.
3. Stel speling in: L/B totaal, gelijk over beide kanten; hoogte volledig bovenaan, z=0.
4. Optioneel: max. totaal **productgewicht** en max. totaal lagen. 0 betekent geen limiet. Doosgewicht is onbekend en wordt niet geschat. Totaal lagen = unieke Z-startniveaus over alle producten. Dit zijn zoekconstraints, geen achteraf weggefilterde oplossingen.
5. Selecteer actieve omdozen via de filterbare kandidaatlijst of vul echte handmatige interne maten in. Selectie bewaart de gekozen maten op het selectiemoment.
6. Kies Gewenste aantallen of Minimale lucht/maximaal vullen en bereken. Annuleren stopt de worker.
7. Bekijk/filter resultaten, wijzig sortering of het aparte Exact gevraagd aantal-filter. Alle afwijkende oplossingen blijven in de oorspronkelijke zoekset.

Geen gevonden resultaat bewijst geen onmogelijkheid. Invoerveranderingen vereisen opnieuw rekenen. De snapshot hoort bij de laatste berekening, niet bij later gewijzigde velden. Zoekpogingen, waarschuwingen en truncatie staan bij het resultaat.

## Omdoos op maat
Eén product: per toegelaten rotatie N×1×1, 1×N×1 en 1×1×N, korte-asherhaling eerst, zonder lucht/ecologische sortering. Twee of meer producten: echte packing met alle gevraagde aantallen, compacte doosafleiding en hervalidatie. Stel karton, palletfootprint, overmaat en maximumdoosmaat in; afgekeurde opties worden met reden getoond. Zoeklimieten voor totaalgewicht/lagen zijn alleen beschikbaar voor Verpakking zoeken.

## Opslaan, history en Solutions
Bekijk hetzelfde read-only laagaanzicht, placements, binnen/buitenmaat, benutting/gewicht en ValidationJSON. JSON export bewaart fysieke snapshotversie 0.3. HTML bevat dezelfde placements en laagvisuals.

Open Solution opslaan: geef een naam en kies eventueel een definitie van de passende modus. Opslaan maakt een concept, geen automatisch actieve oplossing. Ga naar Solutions voor:
- **Openen** en metadata (naam/notities) wijzigen.
- **Dupliceren**: nieuwe snapshot met afkomstlink, origineel behouden.
- **Bewerken / herberekenen als variant**: producten/doos/speling terug naar de passende werkbank; na berekening nieuw resultaat opslaan. Geen vrije placement-drag-editor.
- **Valideren**: schema en fysieke geometrie opnieuw controleren; scores worden afgeleid, niet blind vertrouwd.
- **Vergelijken**: twee snapshots selecteren voor doos-, count-, benutting-, gewicht- en spelingoverzicht.
- **Als actief instellen**: atomisch de actieve verwijzing binnen dezelfde definitie vervangen.
- **Archiveren** of als concept herstellen. De huidige definitie-solution kan pas worden gearchiveerd nadat je een andere hebt geactiveerd.

Physical snapshot, mode, definitie en variantafkomst zijn immutable. Een variant mag niet tussen STOCK/PERSO of definities wisselen. De afzonderlijke database-ID is niet hetzelfde als de lokale engine solutionId.

## Palletisatie
Gebruik Palletiseren bij een resultaat of kies een actieve omdoos/database-solution in de filterbare tabel. JSON- en handmatige buitenmaatbronnen blijven beschikbaar. Binnenmaat + 2×karton wordt precies eenmaal naar buitenmaat omgezet; bij handmatige buitenmaten wordt geen karton toegevoegd.

Stel pallet-L/B/H en max. totale hoogte in; Geavanceerd bevat overhang per zijde. Effectieve maat = basis + 2×overhang. Bereken raster-, gemengde en ondersteunde alternerende patronen. Kies een patroon om het eerste-laagaanzicht te tonen, geef een resultaatnaam en sla bron, instellingen en concrete placements op. JSON-downloads zijn beschikbaar bij berekende en opgeslagen resultaten. Geen certificering van palletgewicht, draagkracht, wrijving of stabiliteit.

## Rapporten, inspectie en privacy
Rapporten / Exports biedt opgeslagen solution HTML/JSON, pallet-JSON en een volledige **eigen** werkruimte-export. Volledige JSON is geen automatische herstelimport of CERM-formaat. Bestanden kunnen gevoelige productgegevens bevatten.

Debug bevat de bestaande lokale broninspectie met sheets/hidden-state/celtypen/formules/cache/SHA-256. Er worden geen formules uitgevoerd. XLSX tot 5 MB, 20.000 rijen/256 kolommen per blad en 200.000 cellen; limieten gelden na parsing en voorkomen niet iedere ZIP-bomb. Originele bestanden worden niet opgeslagen of gepubliceerd; alleen expliciet bevestigde importrecords en historiek gaan naar Supabase.

Nog niet beschikbaar: automatische override-resolutie, vrije placement-editor, compressibility, 3D, gedeelde teams en CERM-integratie. Zie [contract](ALGORITHM_CONTRACT.md), [UI](UI_CONTRACT.md), [tests](TEST_PLAN.md) en [index](README.md).
