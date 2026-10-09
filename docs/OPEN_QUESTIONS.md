# Open vragen

Versie0.3. B4 bevestigt nu mm, X=L/Y=B/Z=H, halve horizontale speling, hoogtespeling bovenaan, zes selecteerbare rotaties, zoek-/sorteringsfeedback en palletoverhang. Oude engineblokkade opgeheven; resterende keuzes hieronder expliciet.

| ID/status | Vraag | Impact/benodigde bron | Blokkade |
|---|---|---|---|
| Q01 open | Excelheaders/keys/types/hidden/formules/cache/eenheden en echte doosentiteit? | echte bronrapporten en goedgekeurde mapping | productie-masterimport, niet handmatige engine |
| Q02 open | Zite-schermen/routes/bediening? | screenshots/operatorflows | reconstructietrouw, niet eigen werkbank |
| Q03 open | Override-scope/PackagingMode/null/fallback? | product/standardvoorbeelden | masterresolutie |
| Q04 open | Owner/CurrentSolutionID/variantmetadata? | opslag-/workflowbesluit | historische appopslag/editor |
| Q05 deels bevestigd | mm, halve L/B/topH en interne versus externe adaptermaten bevestigd; mastereenheden/tolerantiegrenzen/compressie-effect nog open | B4 + masterdefinities | compressie/productieschema |
| Q06 deels bevestigd | assen en zes rotaties bevestigd; volledige union-support, epsilon en maxima-definitie als algoritmevoorstel reviewen | operator/placementvoorbeelden | productievalidatie, niet implementatie |
| Q07 deels bevestigd | exacte filterfeedback en60/40 bevestigd; heuristische zoekdekking/rankingrest/palletpatronen reviewen, echte Zite-golden voorbeelden ontbreken | productieinput/output en performancebudget | optimaliteitsclaim en productieacceptatie |
| Q08 deels bevestigd | lokale0.3 snapshots geïmplementeerd; productie-import/delete/revision/exportformats open | beleid/examples | operationele import/export |
| Q09 open | opslag/eigenaar/CERM/autorisatie/bewaarbeleid? | architectuurbesluit | database/CERM-koppeling |
| Q10 open | mogen bronbytes/rapporten in Git, gevoeligheid? | expliciete toestemming en inhoudsreview | bronpublicatie |
| Q11 open | remote/rechten/branch/PR? | geverifieerde Gitconfig/beleid | push/PR |
| Q12 open voor projectbronnen | onafhankelijke bronchecksum/bytekopie? | echte lokale rapporten en vergelijking | integriteitsclaim |
| Q13 open | tests/typecheck/build/lint/browser/a11y werkelijk uitgevoerd? | uitvoerlogs en browserreview | productieacceptatie |

## Actuele beperkingen
Pure engine en Vitest-tests zijn toegevoegd op basis van nieuwe expliciete regels. Geen uitvoer-/browsertool in deze turn; tests/build/typecheck/lint niet als geslaagd rapporteren. Preview kan geen chatbijlagen rechtstreeks lezen; lokale Excel/snapshot-selectie wel. Originele Excelbytes niet gepubliceerd of gewijzigd. Database-recordadapter is nog geen databasekoppeling. Zie [contract](ALGORITHM_CONTRACT.md), [tests](TEST_PLAN.md), [besluiten](DECISION_LOG.md) en [index](README.md).
