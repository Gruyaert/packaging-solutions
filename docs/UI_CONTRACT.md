# UI-contract

Versie0.3. **Bevestigd**: B4 packingvereisten, eigen werkende implementatie. **Voorlopig voorstel**: vormgeving, support/maxima/rankingheuristieken. **Open**: Zite-screenshots en databaseworkflow. Alleen route /, geen nieuwe route/config.

| Gebied | Geïmplementeerde velden/acties | Validatie en stroom | Grens |
|---|---|---|---|
| U04 invoer | 1–5 producten; reference,L/B/H,gewicht+eenheid,aantal,6rotaties,maxima; speling; 1–8 handmatige kandidaatdozen | finite positieve maten, integer aantallen/maxima; kg-normalisatie; snapshot→worker | compressibility later, geen Excelmapping |
| U05 zoekresultaten | gewenst/vullen; ecologisch/maxfill; exacttoggle; solutionselectie | alleen fysiek gevalideerde oplossingen, countfilter ná zoeken | heuristische dekking, attempts/truncatie zichtbaar |
| U06 detail | fysieke placementtabel, counts, gewicht, binnen/buitenmaat, ValidationJSON, rest-ID | read-only snapshot | geen Editor/variant-opslag |
| U07 viewer | SVG bovenaanzicht per laag, productkleuren/rest-rand | plaatsingsdata direct, selectie alleen UI-state | geen3D/exploded/animatie |
| U09 snapshots | lokale v0.3 JSON-download en opgeslagen snapshot als palletbron | Zod+fysieke revalidatie; geen bestandsmutatie | geen CERM/operationele databasewrite |
| U10 Excelinspectie | bestaande lokale XLSX-reader, keychecks, JSON-bronrapport | read-only; geen formules uitvoeren/serverupload | masterschema open Q01 |
| U11 maatwerk | single lineair, multi echte packing, karton/pallet/overmaat/maxdimensie | single zonder sortering; multi met lucht/ecologie; alle gevraagde producten; realiteitsfilter | rejected met redenen, begrensde zoekdekking |
| U12 palletisatie | bron actieve solution/saved JSON/handmatige buitenmaat; palletinstellingen, overhang, sortering, metrics en patroonviewer | buitenmaten; geometrisch geldige grid/meng/gedragen alternatie | database niet gekoppeld; draagkracht/materiaalcertificering onbekend |

Product1 verplicht, optionele producten verwijderen/toevoegen. Lege invoer bevat geen fictieve producten/resultaten. Workerannulering beëindigt rekenen. Resultaten gebruiken laatste invoersnapshot; wijzigingen vereisen herberekening. Filter/ranking laat de zoekset ongewijzigd. Single custom blijft gegenereerde korte-asvolgorde; multi bevat geen partiële solution. Rapportage van afgekeurde lineaire kandidaten, expliciete limietmeldingen.

Behouden toekomstige U01 productoverrides, U02 gecontroleerde shape-masterdata, U03 aparte STOCK/PERSO-contexten, U08 historische variant/actiefbeheer. Deze worden niet gesuggereerd als beschikbare opslagfuncties. Geen Zite-reconstructieclaim. Zie [contract](ALGORITHM_CONTRACT.md), [data](DATA_MODEL.md), [tests](TEST_PLAN.md), [gebruik](USER_MANUAL.md) en [index](README.md).
