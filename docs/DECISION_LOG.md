# Besluitlog

Versie 0.1. Bron B1 en repository-observaties. Status is expliciet, geen verborgen enginekeuze.

| ID / status | Besluit en context | Alternatief | Motivatie / gevolgen |
|---|---|---|---|
| D01 bevestigd | uitsluitend basisfase; geen engine of demoresultaten | generieke packing-demo | ontbrekend bewijs zou domeinregels vervalsen; toekomstige functies blijven gedocumenteerd |
| D02 voorlopig voorstel | vier modulegrenzen met README, zonder services | lege engine/repositorylaag | geen speculatieve code; invullen pas na bewijs |
| D03 bevestigd | bronnen blijven ongewijzigd in ontvangen media; geen docs-kopie nu | direct kopiëren | Q10 toestemming/gevoeligheid onbekend; structuur bevat register maar geen XLSX-kopie |
| D04 voorlopig voorstel | geen runtime-XLSX-library voor skelet | library installeren alleen voor inspectie | beschikbare sandbox kan ZIP/deflate niet lezen; Q01 via geschikt apart inspectiemiddel/extract oplossen |
| D05 voorlopig voorstel | read-only renderstate en aparte variant-/actiefacties | mutabele placements | ondersteunt R06–R08; nog geen engine/rendererimplementatie |
| D06 voorlopig voorstel | mobile-first witte afgeronde oppervlakken, blauw/teal centrale tokens | Zite namaken zonder screenshots | visueel duidelijk skelet; Q02 blokkeert reconstructie |
| D07 bevestigd | geen GitHub-publicatie claimen zonder bewijs | main als remotebewijs zien | tools geven geen remote/rechten; Q11 blokkeert push/PR; lokale commit door Dyad |
| D08 open | opslag van appdata/CERM | Git als operationele database of nieuwe DB kiezen | architectuurbesluit Q09 ontbreekt; geen integratie opgezet |

Elke vervolgkeuze bevat bron, alternatieven en gevolgen, met contract-/testupdates in dezelfde wijzigingsset. Zie [vragen](OPEN_QUESTIONS.md), [architectuur](ARCHITECTURE.md) en [index](README.md).
