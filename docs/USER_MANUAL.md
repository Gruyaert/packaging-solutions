# Gebruikershandleiding

Versie0.3. Packing/maatwerk/palletisatie lokaal beschikbaar; zoekdekking heuristisch, geen productiecertificering of databasekoppeling.

## Verpakking zoeken
1. Vul product1 in: referentie, L/B/H in mm, aantal, gewicht g/kg (max3decimalen), rotaties en maxima. Voeg maximaal4 extra producten toe; verwijder ongebruikte extra producten.
2. Geef praktische speling op. L/B is totale speling gelijk over beide zijden; hoogte volledig bovenaan. Producten beginnen op z=0.
3. Vul één of meer echte kandidaatdozen in met interne maten en kartondikte.
4. Kies Gewenste aantallen of Minimale lucht/maximaal vullen en zoek. Annuleren beëindigt de worker.
5. Kies Maximale vulling of Praktisch/ecologisch. Exact gevraagd aantal is alleen een resultaatfilter; afwijkende oplossingen blijven behouden wanneer je dit uitschakelt.

De enginelimieten en waarschuwingen staan bij resultaten. Geen gevonden solution is geen bewijs van onmogelijkheid. Resultaten horen bij de laatste berekende invoer, niet bij latere wijzigingen. Herbereken na invoerwijzigingen.

## Omdoos op maat
Eén product: per rotatie N×1×1,1×N×1,1×1×N; eerst korte-asherhaling, geen ecologische/luchtsortering. Vanaf twee producten: echte packing met alle gevraagde aantallen; beide sorteringen beschikbaar. Stel karton, palletfootprint, overmaat en maxdoosdimensie in. Standaard1200×800,5%,2000mm. Buitenmaat=binnen+2karton; draaien op pallet toegestaan. Ongeldige lineaire opties staan onder Afgekeurde varianten.

## Solutiondetail
Bekijk counts versus gevraagd, lucht/benutting/gewicht, binnen/buitenmaten, fysieke placementtabel, read-only bovenaanzicht per laag en ValidationJSON. X=lengte,Y=breedte,Z=hoogte. Rode rand markeert heuristisch gedetecteerde losse restproductplaatsing. Geen nominale maatwijziging. Laagkeuze verandert geen placementdata.

Solution JSON downloaden bewaart een volledig lokaal v0.3 snapshot met products/spacing/placements/validation. Het bevat mogelijk vertrouwelijke gegevens. Dit is geen databaseopslag, variant-editor of CERM-export.

## Palletisatie
Kies actieve packaging solution, lokaal opgeslagen solution-JSON of handmatige buitenmaten van een omdoos. De database is nog niet aangesloten. Snapshots worden bij inlezen schema- en fysiek gevalideerd.

Stel palletL/B/H,maxTotaleHoogte en overhang per zijde in; effectieve maat=palletmaat+2overhang. Doosrotaties0/90, gemengde rasters en volledig ondersteunde alternerende lagen worden onderzocht. Bekijk dozen/laag,layers,totaal,hoogte,benutting,overhang en score. Het bovenaanzicht toont beste eerste laag; gestippeld is de palletgrens. Geen certificaat voor draagkracht, gewicht, wrijving of transportstabiliteit.

## Bestaande Excelinspectie
Selecteer oorspronkelijke XLSX in Excelbestanden inspecteren: alle werkbladen/hiddenstate, celtypen, formules/cache, lege rijen, koprij- en sleutelkeuze. Download volledig JSON-bronrapport om bewust te delen voor mappinganalyse. Geen CSV/andere chat verplicht. Chatbijlagen niet automatisch toegankelijk in preview. Max5MB per bestand;20.000rijen/256kolommen per blad en200.000cellen; alleen vertrouwde bestanden, geen formuleuitvoering. Technisch uitlezen is geen goedgekeurde mastermapping.

## Privacy en grenzen
Alles lokaal; geen serverupload/localStorage/database/CERM-write. Herladen wist sessie; gedownloade bestanden blijven op je computer. Later: gecontroleerde masterimport, eigenaar/CurrentSolutionID/versionering, Editor, compressie,3D en productieformaten. Zie [contract](ALGORITHM_CONTRACT.md), [UI](UI_CONTRACT.md), [tests](TEST_PLAN.md), [import](IMPORT_EXPORT.md) en [index](README.md).
