# Besluitlog

Versie 0.2. Bronnen: B1, repository-observaties en expliciete gebruikersvraag om pragmatisch verder te gaan. Geen verborgen enginekeuze.

| ID / status | Besluit en context | Alternatief | Motivatie / gevolgen |
|---|---|---|---|
| D01 bevestigd | geen engine/demoresultaten zonder bewijs | generieke packing-demo | hulpmiddelen uitbreiden mag; domeinregels verzinnen niet |
| D02 voorlopig voorstel | vier modulegrenzen | lege engine/repositorylaag | alleen concrete behoefte implementeren; infrastructure bevat nu inspectie-adapter |
| D03 bevestigd | originele bronnen niet gewijzigd of in Git opgenomen | direct kopiëren | Q10 toestemming/gevoeligheid open |
| D04 vervangen door D09 | oorspronkelijke beperking: geen XLSX-runtime voor informatief skelet | inspectiebibliotheek toevoegen | gebruiker vraagt expliciet pragmatisch door te gaan; fasegrens geen keurslijf |
| D05 voorlopig voorstel | read-only renderstate, variant-/actiefacties apart | mutabele placements | ondersteunt R06–R08; geen renderer/engine nu |
| D06 voorlopig voorstel | mobile-first blauw/teal skelet | Zite zonder screenshots namaken | Q02 blokkeert reconstructie |
| D07 bevestigd | geen GitHub-publicatieclaim zonder bewijs | main als remotebewijs | remote/rechten/branchbeleid Q11 open |
| D08 open | opslag appdata/CERM | Git als operationele database of DB kiezen | Q09 ontbreekt; geen integratie |
| D09 bevestigd als implementatiekeuze | ExcelJS 4.4.0 lazy browserinspectie + Web Crypto SHA-256 | gebruiker CSV laten maken of serverreader | origineel XLSX direct bruikbaar, geen upload/persistentie/bronpublicatie; grotere lazy dependency; alleen vertrouwde kleine bronnen; parsing is geen mappingbewijs |

Nieuwe inspectiefunctionaliteit en dependency in dezelfde wijzigingsset gedocumenteerd. Zie [vragen](OPEN_QUESTIONS.md), [architectuur](ARCHITECTURE.md), [import](IMPORT_EXPORT.md) en [index](README.md).
