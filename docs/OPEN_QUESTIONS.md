# Open vragen

Versie0.4. B4 bevestigt nu mm, X=L/Y=B/Z=H, halve horizontale speling, hoogtespeling bovenaan, zes selecteerbare rotaties, zoek-/sorteringsfeedback en palletoverhang. Oude engineblokkade opgeheven; resterende keuzes hieronder expliciet.

| ID/status | Vraag | Impact/benodigde bron | Blokkade |
|---|---|---|---|
| Q01 open | Excelheaders/keys/types/hidden/formules/cache/eenheden en echte doosentiteit? | echte bronrapporten en goedgekeurde mapping | productie-masterimport, niet handmatige engine |
| Q02 open | Zite-schermen/routes/bediening? | screenshots/operatorflows | reconstructietrouw, niet eigen werkbank |
| Q03 open | Override-scope/PackagingMode/null/fallback? | product/standardvoorbeelden | masterresolutie |
| Q04 deels opgelost | Owner per auth-gebruiker, current pointer op definitie, immutable mode/context/snapshot en metadata geïmplementeerd; vrije editor nog niet | Supabase-schema/guards/UI | interactieve acceptatie/editor |
| Q05 deels bevestigd | mm, halve L/B/topH en interne versus externe adaptermaten bevestigd; mastereenheden/tolerantiegrenzen/compressie-effect nog open | B4 + masterdefinities | compressie/productieschema |
| Q06 deels bevestigd | assen en zes rotaties bevestigd; volledige union-support, epsilon en maxima-definitie als algoritmevoorstel reviewen | operator/placementvoorbeelden | productievalidatie, niet implementatie |
| Q07 deels bevestigd | exacte filterfeedback en60/40 bevestigd; heuristische zoekdekking/rankingrest/palletpatronen reviewen, echte Zite-golden voorbeelden ontbreken | productieinput/output en performancebudget | optimaliteitsclaim en productieacceptatie |
| Q08 deels bevestigd | lokale0.3 snapshots geïmplementeerd; productie-import/delete/revision/exportformats open | beleid/examples | operationele import/export |
| Q09 deels opgelost | Supabase private werkruimte, RLS/minimale grants en Auth geïmplementeerd; teams/retentie/CERM nog open | owner-schema bevestigd in uitvoering; operationeel beleid nodig | gedeelde workspace/CERM/retentie |
| Q10 open | mogen bronbytes/rapporten in Git, gevoeligheid? | expliciete toestemming en inhoudsreview | bronpublicatie |
| Q11 open | remote/rechten/branch/PR? | geverifieerde Gitconfig/beleid | push/PR |
| Q12 open voor projectbronnen | onafhankelijke bronchecksum/bytekopie? | echte lokale rapporten en vergelijking | integriteitsclaim |
| Q13 deels opgelost | Typecheck en schema-grantaudit geslaagd; build zie changelog, unit/lint/browser/twee-accountacceptatie open | beschikbare checkresultaten en browserreview | productieacceptatie |

## Actuele beperkingen
Supabase-workspace en UI zijn gekoppeld; geen bronmappings geraden. Typecheck en effectieve databasegrants gecontroleerd; exacte buildstatus in changelog. Vitest/lint/browser niet uitgevoerd. Automatische override-resolutie, vrije placement-editor, 3D/compressie, teams en CERM blijven open. Originele Excelbytes niet gepubliceerd of gewijzigd; alleen expliciet bevestigde imports gaan naar de database. Zie [contract](ALGORITHM_CONTRACT.md), [tests](TEST_PLAN.md), [besluiten](DECISION_LOG.md) en [index](README.md).
