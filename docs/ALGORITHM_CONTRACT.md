# Algoritmecontract

Versie 0.6; fysieke snapshot-envelop blijft 0.3 met optionele editoraudit. **Bevestigd**: gebruikersspecificaties voor packing, maatwerk/palletisatie (B4) en eerste editorflow. Dit autoriseert implementatie en vervangt het eerdere engineverbod. Geen claim dat heuristieken bestaand Zite-gedrag reconstrueren. **Voorlopig voorstel**: onderstaande zoek-, support-, rest- en scorekeuzes. **Open**: productievoorbeelden/bronmastermapping en compressieacceptatie; private Supabase-opslag is geïmplementeerd.

## Packing Solution Editor — eerste versie (0.6)
Bevestigd: calculated → duplicate-draft → edited → validate → save-new → maak actief optioneel. Geen inplace wijziging van een opgeslagen fysieke snapshot. Eerste versie: selectie, X/Y/Z verplaatsen, toegestane nominale rotaties, rij-/kolomsnap met preview, grid, undo/redo, resthighlight/diagnostiek, validatie, vergelijking en immutable edited-opslag met operationlog. Opslag gebeurt pas na geldige validatie; activeren vereist een aparte bevestiging met definitie/oude current/nieuwe solution/waarschuwingen.

Restclassificatie is een expliciete heuristiek: per product dominante start-Y/start-X, Z-niveau en oriëntatie met minstens twee placements; minderheidsposities/-oriëntaties/-lagen en bestaande geïsoleerde clusters worden als mogelijke rest gemarkeerd, niet automatisch fout. Snap kiest een bestaand doelplacement; aansluiten stelt een randpositie in diens rij voor. Preview toont delta en volledige validatie; bevestiging wijzigt uitsluitend het duplicaat. Laagindices worden opnieuw afgeleid uit fysieke Z-startniveaus. Productcounts moeten gelijk blijven aan het gedupliceerde origineel, ook wanneer een calculated oplossing afwijkt van gevraagd.

Compressibility X/Y/Z en allowCompression worden als expliciete invoer behouden en overlapdiagnostiek toont penetratie, richting en beschikbare tolerantie. **Veilige eerste-versiegrens**: geen geometrische overlap accepteren op basis van nog ongevalideerd materiaalgedrag; overlap blijft rood en kan niet opgeslagen/actief gemaakt worden. Geel/oranje tolerantieacceptatie, hoge-tolerantiedrempel, toestemming/override en effectieve support bij compressie zijn vervolgwerk, niet als werkzaam voorgesteld. Nominale maten worden nooit verkleind. Geen numerieke materiaalgrenzen raden.

Validatie: bestaande bounds/speling/topclearance/rotaties/maxima/gravity/layerchecks plus countsbehoud en door gebruiker instelbare palletfootprint inclusief karton/overhang. ValidationJSON is afgeleid; saved audit niet vertrouwen als fysiek bewijs. Operationlogs bevatten ID, solutionId, tijd, type, parameters, before/after placements, actor en note. Elke bevestigde edit en undo/redo blijft in het log; onopgeslagen draftlog is lokaal. Save bewaart log met nieuwe immutable snapshot; database-audit voor metadata/MAKE_CURRENT is append-only en eigenaar-gebonden. Lokale modus blijft memory-only. Dit zijn geen materiaal- of transportcertificaten.

Nog niet gestart in deze versie: automatische herverdeling, gelijkmatige/symmetrische patronen, rij/laagspiegelen, nieuwe rijen/lagen als intelligente acties, restdoos-editor en compressieacceptatie. Handmatig Z wijzigen naar een bestaand niveau is wel beschikbaar.

## Behouden domeinregels
R01 Shape-masterkey = ShapeID + ShapeVariantID; R02 standard voegt PackagingMode toe; R03 STOCK/PERSO gescheiden; R04 override mag alleen ProductNumber hebben; R05 override vóór standaard, veldmerge nog open; R06 historisch onveranderlijke solutions, bewerken maakt variant; R07 CurrentSolutionID kiest actief; R14 gecontroleerde Excel-masterdata; R15 appdata niet naar CERM-master. Owner/context/mode/variant/current-solutionregels zijn nu in Supabase geïmplementeerd. Automatische veldgewijze override/fallback-resolutie blijft open.

## Fysieke regels (bevestigd)
- R08 Placement is centrale waarheid: placementId, productId, x/y/z, length/width/height, orientation, layerIndex. X=lengte, Y=breedte, Z=hoogte; mm. Renderinstellingen wijzigen deze waarden nooit.
- R09 Nominale maten blijven behouden; compressibilityX/Y/Z gereserveerd voor later, momenteel geen compressie.
- R10 Bodem of onderliggende laag; nooit zweven.
- R11 Hoogtespeling volledig bovenaan. Start z=0; bruikbare hoogte = interne hoogte − hoogtespeling.
- R12 Horizontale speling is totaal, gelijk verdeeld: start x=lengtespeling/2, y=breedtespeling/2; bruikbare L/B = interne L/B − totale speling.
- R13 Exactfilter ná zoeken: alle actieve productcounts exact gevraagd. Alle oplossingen behoudt afwijkende aantallen.
- R16 Eén tot vijf producten; eerste verplicht. Positieve L/B/H/aantal, gewicht ≥0, invoer g/kg met 3 decimalen, intern kg. Alleen zes toegelaten labels L-B-H, L-H-B, B-L-H, B-H-L, H-L-B, H-B-L. MaxInLength/Width/Layers positief geheel.
- R17 Praktisch/ecologisch ≠ minimale lucht; 60% benutting/ecologie, 40% handling/regelmaat; veel te ruime doos mag niet winnen uitsluitend door net patroon.
- R18 Maatwerk één product: elke toegelaten rotatie N×1×1, 1×N×1, 1×1×N; eerst herhaling langs kortste georiënteerde maat. Geen ecologische/luchtsortering. Maxima en realiteitsfilter blijven gelden.
- R19 Maatwerk vanaf twee producten: echte collision/support-gecontroleerde placements; alle gevraagde producten. Geen bounding-box-only oplossing.
- R20 Losse restplacements detecteren, metadata-markeren en handlingpenalty; geen nominale verkleining. Editor later.
- R21 ValidationJSON: status/warnings/errors/counts/overlapAnalysis/gravityCheck/boundsCheck; controle van bounds, overlap, rotaties, dimensies, maxima, counts, geldige productId en laagopbouw.
- R22 Pallet effectieve L/B = basismaat + 2×overhang per zijde. Doosmaten zijn buitenmaten. PalletHeight telt mee in maxTotalHeight. Patronen 0°,90°,gemengd,alternerend indien nuttig.

## Geïmplementeerde algoritmekeuzes — voorlopig voorstel
Axis-aligned cuboids, contact toegestaan, epsilon 1e-6 mm. Support conservatief: volledige footprint ondersteund door union van coplanaire bovenvlakken; geen gedeeltelijke brugondersteuning. LayerIndex wordt afgeleid van oplopende unieke z-niveaus. MaxInLength/Width = maximum aantal verschillende x/y-startposities per product per laag; maxLayers = aantal z-niveaus per product. Dit is een expliciete definitie bij gemengde oriëntaties, nog te toetsen met operatorvoorbeelden.

Deterministische extreme-point greedy packing met verschillende productvolgordes en homogene rotatiekeuzes per product/poging. Gewenste aantallen probeert gevraagde aantallen; vult daarnaast door om afwijkende alternatieven te behouden. Minimale lucht gebruikt vulalternatieven. Zoekdekking is heuristisch, niet exhaustief. Limieten en truncatiestatus worden zichtbaar gerapporteerd; annulering kan via AbortSignal in publieke API. Geen bewijs van globale optimale oplossing.

Restdetectie: per product/orientatie/laag verbonden rasterclusters (gedeelde rand met positieve overlap); wanneer een dominant cluster minstens twee plaatsen bevat, geïsoleerde singletons markeren. Dit werkt ook bij een losse singleton ver weg op dezelfde rij/kolom. Compacte aangesloten onvolledige rij geen losse rest. Markering conservatief/heuristisch; afwijkende gemengde oriëntaties en kleine restclusters vereisen later uitgebreid patroonbewijs/Editor.

Ranking: benutting = nominal productvolume / intern doosvolume; transportEfficiency = nominal productvolume / buitenvolume inclusief karton. Ecology = gemiddelde van beide. Score =100×ecology×(0.6×ecology+0.4×handling). Handling uit regelmatige/herhaalbare lagen, eenvoudige/platte oriëntaties en restpenalty. Voorvermenigvuldiging voorkomt dat extreem lage benutting wordt gecompenseerd door handling. Alternatieven met ecology lager dan75% van beste zakken achter die groep. Formule is voorstel, gedrag R17 bindend.

Maatwerk één product: buitenmaat = interne maat + 2×kartondikte per as; standaard europallet 1200×800, 5% overmaat op totaal footprint, draaiing toegestaan, max elke buitenmaat 2000. Afgekeurde lineaire kandidaten worden met reden gerapporteerd. Multi-product: plaats werkelijk in kandidaatcontainers, leid vervolgens compacte interne doos af uit gevalideerde placements + speling, valideer opnieuw en pas hetzelfde realiteitsfilter toe.

Pallet: raster 0/90 en guillotine-mengpatronen; lagen herhalen of alterneren alleen bij volledige steun. Lage transportefficiëntie weegt ook hier zwaar. Geen gewichtslimiet/stabiliteitscertificaat uit onbekend materiaalgedrag; expliciete waarschuwing. Bronnen packaging/database/saved gebruiken dezelfde gevalideerde buitenmaatadapter; bron/settings/result-opslag in Supabase; opgeslagen oplossingen worden voor gebruik fysiek opnieuw gevalideerd.

## Globale zoekconstraints (0.4)
MaxWeightKg begrenst productinhoud tijdens iedere insert, zonder onbekend kartongewicht te verzinnen. MaxTotalLayers begrenst het aantal unieke Z-startniveaus over alle producten, met dezelfde epsilon-indexering als LayerIndex. UI 0 betekent geen limiet; API gebruikt optionele waarden. Deze constraints veranderen geen nominale maten en zijn niet hetzelfde als het achteraf toegepaste exactfilter. Totaal-lageninterpretatie blijft een expliciet algoritmevoorstel voor operatorreview; constraints gelden bij Verpakking zoeken, niet bij lineair maatwerk.

## ZITE-style zoekprofielen (0.8)
De primaire zoekmethode gebruikt een deterministische laag-voor-laag beam search. Per laag worden uniforme laaghoogtes, gededupliceerde productrotaties, productvolgordes en `area`/`short`/`long`/`bottom`-plaatsingsstrategieën gecombineerd met een 2D vrije-rechthoekgenerator. States worden op resterende aantallen, Z-hoogte, gewicht, laaggeschiedenis en werkelijke placements gededupliceerd. De standaard beam width is 24 en er worden maximaal 24 laagkandidaten per state bewaard; workerrequests kunnen dit begrensd aanpassen.

`maximum-fill` laat gemengde rotaties per individueel stuk toe en rangschikt op productvolume, verticale vulling en compactheid. `simple-practical` beperkt toegelaten oriëntaties per laag, selecteert eenvoudige patronen op basis van oriëntatiediversiteit, laagherhaling, rasterregelmaat en compacte footprint, en rangschikt daarna op praktische score. Als geen eenvoudige geldige oplossing bestaat, blijft de beste geometrisch geldige kandidaat zichtbaar met een diagnosemelding.

Desired search blijft partials bewaren en `exactFilter` wordt pas na de zoekopdracht toegepast. Maatwerk gebruikt dezelfde engine voor multi-product kandidaten; single-product maatwerk behoudt de bestaande lineaire contracten. Palletisatie rapporteert expliciete patroonfamilies (`grid`, `strip`, `guillotine`, `maxrects`, `alternating`) en valideert alternerende lagen op volledige support. Diagnostics bevatten beam states, laaghoogtes, strategieën, rejection reasons en truncatiestatus. Dit blijft een heuristische optimizer, geen globaal optimum of transportcertificaat.

## Traceerbaarheid
G01 R11–R12 hoogtespeling; G02 R13 exactfilter; G03 R18 lineair maatwerk; G04 R19 multi-product packing; G05 R17 te ruime doos; G06 R20 restplaatsing; G07 R22 overhang. Aanvullende tests: overlap/support/rotatie/maxima/cardboard/laaghoogte, beam determinisme, mixed rotations, simple-practical filtering en palletpatroonfamilies. Zie [tests](TEST_PLAN.md), [data](DATA_MODEL.md), [UI](UI_CONTRACT.md), [besluiten](DECISION_LOG.md) en [index](README.md).
