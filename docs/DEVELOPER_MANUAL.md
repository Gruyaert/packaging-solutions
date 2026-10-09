# Ontwikkelhandleiding

Versie 0.1. **Bevestigd**: React 19/TypeScript/Vite, bestaande dependencyset ongewijzigd. **Voorlopig voorstel**: onderstaande fasering. **Open**: opslag, bronmapping en publicatievoorwaarden.

## Omgeving en scripts
Dyad verzorgt installatie via de bestaande package-/lockfile en start de Vite-preview; gewone edits gebruiken hot reload. package.json definieert dev (Vite), build (productie Vite), build:dev, preview en lint (ESLint). TypeScriptcontrole is apart beschikbaar in de ontwikkelomgeving; er is geen npm-testscript of testframework toegevoegd. Geen nieuwe runtime-XLSX-library, server of database. Gebruik de beschikbare verificatie-acties, niet een tweede dev-server.

## Modules en wijzigingen
Routes blijven in src/App.tsx (ongewijzigd). Index gebruikt AppShell en ContractPhaseOverview. Centrale themawaarden in globals.css zijn aangepast voor donkerblauwe tekst en teal/blauwe accenten; geen gradients. Domein-, application-, infrastructure- en visualizationmappen bevatten alleen verantwoordelijkheidsdocumentatie; geen lege engine/repositoryimplementaties. Zie [architectuur](ARCHITECTURE.md).

Checklist per wijziging: bron/status vastleggen; veldcontract bijwerken; R-regel/U-flow/T-test koppelen; Q-blokkades bijwerken; beslissing motiveren; changelog inclusief datum/impact/risico/echte teststatus; links controleren; typecheck en waar relevant build. Verander geen accepted hash-snapshot; voortgang alleen in werkplan.

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
