# Gebruikershandleiding

Versie 0.7. Met account bewaart Supabase eigen masterrecords, resultaten en operationlogs; zonder account is een afzonderlijke tijdelijke testwerkruimte beschikbaar. Rekenen blijft lokaal in de browser. Zoekdekking is heuristisch. Geen productie-/transportcertificaat of CERM-write.

## Visuele invoerhulp
De werkruimte gebruikt een wit-blauw thema met donkere tekst en pictogramnavigatie. Bij producten, doosvoorwaarden, omdozenbeheer en palletisatie toont een maatillustratie de assen: **X = lengte, Y = breedte, Z = hoogte**. Alle maten zijn millimeters; 25 cm vul je als 250 mm in. Productgewicht geldt per stuk; aantal geldt per omdoos. Binnenmaat is bruikbare doosruimte; buitenmaat omvat tweemaal de kartondikte per as. Pallethoogte is alleen de basis, maximale totale hoogte omvat ook alle dooslagen. Uitleg en eenheden staan naast de invoer; rotaties en stapellimieten zijn uitklapbaar. De figuur documenteert de assen, niet de werkelijk ingevoerde verhoudingen.

## Interactieve viewer en offline rapport
Dezelfde read-only viewer verschijnt bij Verpakking zoeken, Omdoos op maat, berekende/opgeslagen palletisatie en geopende saved/edited solutions. De aparte editor behoudt zijn selecteerbare editpreview; open een opgeslagen edited solution voor de generieke viewer. Plotly laadt pas wanneer de viewer in beeld komt.

- Kies **3D**, **Bovenaanzicht**, **Vooraanzicht** of **Zijaanzicht**. Standaard draai je alleen rond de **Z-as**: sleep links/rechts, de verticale kijkhoek blijft vast. Zoom met het muiswiel; **Reset camera** herstelt het overzicht. Onder **Meer weergaveopties → Draaien → Vrij · alle assen** kun je bewust vrije 3D-rotatie inschakelen. Terug naar Alleen Z-as herstelt de overzichtscamera. Deze keuze gaat mee bij export vanuit de viewer; zonder instelling is Z-as de standaard. 3D vereist WebGL; probeer 2D als je browser/GPU geen 3D kan tonen.
- Palletisatie toont een ondoorzichtige grijze **palletbasis** van Z=0 tot de ingevoerde pallethoogte. De dozen beginnen daarboven; er wordt geen hoogte bij de placements opgeteld. De basis blijft zichtbaar bij laagfilters, begin van de animatie en draadmodel. Dit is het schematische fysieke volume, geen hout-/planken-/draagkrachtmodel.
- Kies gevuld, draadmodel of beide. Dekking 0 = transparant, 1 = ondoorzichtig. Productkleuren, assen, raster en labels zijn afzonderlijk schakelbaar; hover toont originele X/Y/Z, maten, oriëntatie en laag.
- **Exploded productafstand** en **laagafstand** zijn 0–100 mm. Dit zijn alleen weergave-offsets: fysieke placements, counts, validatie en nominale maten blijven onveranderd. Productafstand spreidt gerangschikte X/Y-startposities per laag; laagafstand spreidt Z-laagniveaus.
- **Alle lagen** of één laag werkt voor doos en pallet. Validatiestatus en eventuele opgegeven compressibility worden onder de viewer getoond; tolerantie is geen materiaalgoedkeuring en maakt een rode overlap niet groen.
- Timeline: Begin/Vorige/Play/Pause/Volgende/Einde; snelheden 0.25x/0.5x/1x/2x/4x. Eén stap = productplacement, op pallet één doos. Volg stap/totaal, huidig item, laag en geplaatst/resterend. Animatievolgorde is laag/Z/Y/X, geen bewezen fysieke montagevolgorde.
- Bij meer dan 600 items toont de viewer de laatste 600 binnen de gekozen laag/stap en meldt de beperking. Kies een laag of eerdere stap om andere items te zien. De JSON blijft volledig; de weergave is geen bewijs van volledige collision-/transportcontrole.

Klik **Export → Interactief HTML rapport** in de viewer om de huidige visualisatie-instellingen mee te nemen. De afzonderlijke **Interactief HTML**-acties bij resultaten/Solutions/Rapporten starten met standaardinstellingen. Bewaar het ene HTML-bestand en open het in een moderne browser; Plotly en JSON zijn ingebed, zonder CDN/internet/server/Dyad. Het rapport bevat tien secties van overzicht tot full solution JSON, plus bekende shape/definition, STOCK/PERSO, productNumber, doos, validatie/compressibility en palletinformatie. Ontbrekende bronmetadata wordt niet aangevuld met schattingen. Bestandsnamen volgen shape/product/vrije referentie + datum; zie [import/exportcontract](IMPORT_EXPORT.md). Deel rapporten bewust: ze kunnen vertrouwelijke gegevens bevatten.

Palletberekening is annuleerbaar en gebeurt in een worker, net als packing/maatwerk. Twee identieke recente berekeningen kunnen uit een kleine tijdelijke cache komen; er is geen permanente opslag van die cache. **Debug / Performance** toont echte laatste/gemiddelde tijden en aantallen voor packing, scoring, custom carton, palletisatie, Plotly build, render en totaal. Een streep betekent nog niet gemeten; cachehits zijn geen nieuwe engineberekening. Geen universele freeze-vrijgarantie: grote JSON, apparaat/GPU en browser blijven bepalend. Offline openen, camerabediening en browserperformance zijn nog niet interactief geverifieerd.

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
3. Open **Excelmaster synchroniseren** en kies het XLSX-bestand. **1. Intelligent herkennen** zoekt lokaal het werkblad, de kopregel en bekende Nederlandse/Engelse kolommen. Je ziet alle voorgestelde koppelingen; het bestand wordt niet naar een AI-dienst gestuurd.
4. Bij ontbrekende of dubbelzinnige matches opent **2. Manueel mappen / aanpassen** met de veilige gedeeltelijke koppelingen ingevuld. Kies zelf werkblad, kopregel en kolommen. Ook bij succesvolle herkenning is deze tweede optie altijd beschikbaar. Een werkblad-/kopregelwijziging wist oude koppelingen; **Kolommen in deze kopregel herkennen** vult een nieuw voorstel voor die rij in. De eerste knop analyseert opnieuw het hele bestand.
5. Controleer de volledige filterbare preview (nieuw/bijwerken/ongewijzigd), interne maten en mm-eenheid. De herkenner rekent geen cm/inch of buitenmaten om. Formulekoppen/unknown labels worden niet geraden. Fouten, ontbrekende velden of dubbele keys blokkeren de volledige import.
6. Bevestig mapping, preview en millimetereenheid en synchroniseer. Records worden atomisch ingevoegd/bijgewerkt; ontbrekende bronrecords worden **niet verwijderd**. Importhistoriek bewaart bestandsnaam, checksum en aantal. Herkenning importeert nooit vanzelf.

Herkenning zoekt in de eerste 50 rijen van zichtbare sheets; verborgen sheets, latere kopregels en onbekende kolomnamen kun je manueel kiezen. Bij meerdere even waarschijnlijke sheets/kopregels wordt geen automatische mapping toegepast. Ongekoppelde optionele velden worden leeg/0, actief=true en geblokkeerd=false; dit kan bestaande waarden vervangen en wordt in de preview getoond. Iedere wijziging wist de bevestiging. Maximaal 2000 gegevensrijen per sync. Upload geen onbetrouwbare XLSX-bestanden.

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
- **Dupliceren en placements bewerken**: opent de Packing Solution Editor op een onopgeslagen duplicaat; zie hieronder.
- **Herberekenen als variant**: producten/doos/speling terug naar de passende werkbank; na berekening nieuw resultaat opslaan.
- **Valideren**: schema en fysieke geometrie opnieuw controleren; scores worden afgeleid, niet blind vertrouwd.
- **Vergelijken**: twee snapshots selecteren voor doos-, count-, benutting-, gewicht- en spelingoverzicht.
- **Maak actief**: bevestiging met definitie, oude/nieuwe current en waarschuwingen; daarna atomisch pointer/status wijzigen en MAKE_CURRENT loggen.
- **Archiveren** of als concept herstellen. De huidige definitie-solution kan pas worden gearchiveerd nadat je een andere hebt geactiveerd.

Physical snapshot, mode, definitie en variantafkomst zijn immutable. Een variant mag niet tussen STOCK/PERSO of definities wisselen. De afzonderlijke database-ID is niet hetzelfde als de lokale engine solutionId.

## Packing Solution Editor — eerste versie
1. Open een calculated of saved solution in **Solutions** en kies **Dupliceren en placements bewerken**. Het origineel wordt nooit het editdoel; producten, doos, speling en originele geplaatste aantallen blijven behouden.
2. Selecteer een placement via het bovenaanzicht, Enter/Spatie, of de placementlijst; kies een laag om die te zien. Donker = selectie; rode rand/REST = mogelijke afwijking van dominante rij/kolom/laag/oriëntatie of los groepje. Dit is heuristische diagnostiek, geen automatisch afkeurcriterium.
3. Voer X/Y/Z mm in en kies **Verplaatsing previewen**, of een toegestane rotatie en **Rotatie previewen**. Rotatie gebruikt de oorspronkelijke nominale maten. Negatieve/buitenliggende posities en onvoldoende support worden rood, niet stil gecorrigeerd.
4. Kies een ander placement als rij-/kolomdoel. **Snap naar rij** neemt Y/Z over, **Snap naar kolom** X/Z. **Sluit rest aan bij rij** stelt de dichtste passende linker-/rechterrand van die rij voor. Geen overgebleven ruimte? De preview kan rood zijn; maten worden niet verkleind.
5. Preview toont het laagaanzicht, delta in mm, overlapdiagnostiek en volledige ValidationJSON. **Voorstel bevestigen op duplicaat** past de wijziging toe; Annuleren behoudt de huidige draft. Een ongeldige draft mag worden onderzocht, maar niet opgeslagen of actief gemaakt.
6. Zet optioneel Grid aan en wijzig de stap. **Grid-snap XY** is een expliciete wijziging met preview; gridweergave op zich wijzigt geen placements. **Undo/Redo** herstellen fysieke placements, maar verwijderen hun auditgeschiedenis niet.
7. Controleer **Palletinstellingen**. Voor calculated bronnen begint dit met de bestaande europalletdefaults; een eerder edited snapshot behoudt zijn instellingen. Footprint bevat karton en overhang; beide doosoriëntaties worden gecontroleerd. Vergelijking toont actief (of bron) vs edited: benutting, luchtvolume, lagen, productgewicht, validatie, praktische score en echte palletpatronen op basis van doosgeometrie.
8. **Valideren** controleert geometrie, bounds/speling/hoogte, rotaties, countsbehoud, maxima, laagindex, overlap, gravity en palletfootprint. Groen kan opgeslagen worden; rood blokkeert Save. Een open preview moet eerst bevestigd of geannuleerd worden.
9. Geef de edited solution een naam en **Als nieuwe edited solution opslaan**. Dit bewaart een nieuw concept met based_on-bron, snapshot en elke bevestigde edit/undo/redo/validatie. Naam/palletcontext worden bij Save gelogd. Maak actief is daarna optioneel en vraagt een aparte bevestiging.

**Eerste-versiegrens compressie:** nominale maten blijven altijd behouden. allowCompression en compressibilityX/Y/Z zijn alleen expliciete overlapdiagnostiek; rotatie remapt nominale assen naar plaatsingsassen. Overlap blijft rood, ook als de getoonde tolerantie groter is. Geel/oranje materiaalacceptatie en een rode override zijn nog niet beschikbaar; er worden geen materiaaldrempels verzonnen.

Draft en draftlog blijven alleen in geheugen tot Save; tabwissel/sluiten/herladen kan ze wissen. De editor vraagt bevestiging bij sluiten/ander solution openen en waarschuwt bij browserverlaten. Opgeslagen cloudlogs zijn privé/append-only; in testmodus blijft ook opgeslagen data tijdelijk. **Operationlog** toont actor/tijd/type/parameters/before/after. Solution-JSON bewaart de initiële editoraudit; de volledige werkruimte-export bewaart ook latere MAKE_CURRENT- en metadata-events. Intelligente verdeling/spiegelen/nieuwe rijen/lagen en restdoos-editor zijn nog niet beschikbaar.

## Palletisatie
Gebruik Palletiseren bij een resultaat of kies een actieve omdoos/database-solution in de filterbare tabel. JSON- en handmatige buitenmaatbronnen blijven beschikbaar. Binnenmaat + 2×karton wordt precies eenmaal naar buitenmaat omgezet; bij handmatige buitenmaten wordt geen karton toegevoegd.

Stel pallet-L/B/H en max. totale hoogte in; Geavanceerd bevat overhang per zijde. Effectieve maat = basis + 2×overhang. Bereken raster-, gemengde en ondersteunde alternerende patronen. Kies een patroon om het eerste-laagaanzicht te tonen, geef een resultaatnaam en sla bron, instellingen en concrete placements op. JSON-downloads zijn beschikbaar bij berekende en opgeslagen resultaten. Geen certificering van palletgewicht, draagkracht, wrijving of stabiliteit.

## Rapporten, inspectie en privacy
Rapporten / Exports biedt opgeslagen solution HTML/JSON, pallet-JSON en een volledige **eigen** werkruimte-export. Volledige JSON is geen automatische herstelimport of CERM-formaat. Bestanden kunnen gevoelige productgegevens bevatten.

Debug bevat de bestaande lokale broninspectie met sheets/hidden-state/celtypen/formules/cache/SHA-256. Er worden geen formules uitgevoerd. XLSX tot 5 MB, 20.000 rijen/256 kolommen per blad en 200.000 cellen; limieten gelden na parsing en voorkomen niet iedere ZIP-bomb. Originele bestanden worden niet opgeslagen of gepubliceerd; alleen expliciet bevestigde importrecords en historiek gaan naar Supabase.

Nog niet beschikbaar: automatische override-resolutie, intelligente patroonacties/restdoos-editor, compressieacceptatie/overrides, gedeelde teams en CERM-integratie. Zie [contract](ALGORITHM_CONTRACT.md), [UI](UI_CONTRACT.md), [tests](TEST_PLAN.md) en [index](README.md).
