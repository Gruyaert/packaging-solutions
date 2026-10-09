# Ontwikkelhandleiding

Versie 0.2. **Bevestigd**: React 19/TypeScript/Vite en ExcelJS 4.4.0 voor lokale inspectie. **Voorlopig voorstel**: fasering. **Open**: opslag, mapping en publicatievoorwaarden.

## Omgeving en scripts
Dyad verzorgt dependency-installatie en Vite-preview; gewone edits gebruiken hot reload. package.json definieert dev, build, build:dev, preview en lint. Geen npm-testscript/testframework toegevoegd. ExcelJS 4.4.0 geïnstalleerd via dependencybeheer; browserondersteuning maakt server/DB onnodig voor inspectie. ExcelJS wordt dynamisch geladen bij bestandskeuze, niet in de hoofdweergave. Typecheck/build/lint alleen claimen bij daadwerkelijke uitvoer; deze turn biedt geen uitvoertool voor die checks.

## Modules en wijzigingen
Routes blijven in src/App.tsx. Index gebruikt AppShell, ContractPhaseOverview en ExcelInspector. Infrastructure bevat nu inspect-workbook.ts; domain/application/visualization behouden alleen module-README's. Geen engine/repositorylaag. UI-toestand alleen React-geheugen; File/ArrayBuffer niet naar public, opslag of API. globals.css/config ongewijzigd in 0.2. Zie [architectuur](ARCHITECTURE.md) en [inspectiecontract](IMPORT_EXPORT.md).

Checklist: bron/status; relevante contracten; R/U/T-koppelingen; Q-blokkades; besluiten/changelog met echte teststatus; links; typecheck/build indien uitvoerbaar. Accepted hash-snapshots niet wijzigen, voortgang alleen in werkplan. Lokale parsing is geen gevalideerde masterimport.

## GitHub-workflow
Gewenste bron: https://github.com/Gruyaert/packaging-solutions. Geobserveerd: lokale main, aanvankelijk schoon, HEAD 9435ceb62ca691d942610c9838c7d439d850f8f2. Geen remote/rechten verifieerbaar met huidige tools (Q11). Voor publicatie: remote vaststellen, rechten controleren, gewenste doelbranch/PR en beschermingsregels bevestigen, Q10 voor bronbytes oplossen. Geen automatische push of PR. Dyad beheert de lokale commit aan het einde van de wijziging; deze sessie maakt geen eigen commits. Hash pas na verifieerbaar commitresultaat rapporteren. Lokaal werk is geen GitHub-publicatie.

## Gefaseerd vervolg en acceptatie (voorlopig voorstel)
| Fase | Acceptatiecriterium | Vereiste docs-update / blokkade |
|---|---|---|
| 1 Excelmapping/schema | beide werkbladen volledig geïnventariseerd; keys/typen/eenheden gevalideerd; discrepanties gerapporteerd | sources, DATA_MODEL, IMPORT_EXPORT, TEST_PLAN; Q01/Q10/Q12 |
| 2 Masterdata en aparte appopslag | gecontroleerde masterrevisie; productoverride-only geldig; opslag/CERM-grens goedgekeurd; geen masteroverschrijving | ARCHITECTURE, DATA_MODEL, DECISION_LOG; Q03/Q09 |
| 3 Solutionversionering | T03/T06/T07 uitvoerbaar en groen; owner/actiefpointer bewezen | DATA_MODEL, UI_CONTRACT, TEST_PLAN; Q04 |
| 4 Onderbouwde packing-engine | geometrie en zoek/rankingcontract bevestigd; echte golden tests reproduceerbaar; geen generieke vervanging | ALGORITHM_CONTRACT, TEST_PLAN, DECISION_LOG; Q05–Q07 |
| 5 Read-only visualisatie | iedere placementwaarde onveranderd bij alle visuele acties; assen en bediening bewezen | UI_CONTRACT, ARCHITECTURE, TEST_PLAN; Q02/Q06 |
| 6 Import/export | beleid goedgekeurd; preview/rapport/mapping en foutafhandeling getest; geen stil dataverlies | IMPORT_EXPORT, USER_MANUAL, TEST_PLAN; Q08 |
| 7 Regressie/productievalidatie | golden suite, browser/a11y, prestaties en autorisatie aantoonbaar; gebruikersacceptatie | alle contracten, CHANGELOG; Q07/Q09/Q13 |

Elke fase vereist eigen review en actuele docs, geen toestemming voor volgende fase door dit skelet. Zie [index](README.md), [tests](TEST_PLAN.md) en [vragen](OPEN_QUESTIONS.md).
