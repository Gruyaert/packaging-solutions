# Open vragen

Versie 0.1. Elke rij heeft status **open**. Geen ontbrekende regel wordt vervangen door een generieke aanname. B1 bevestigt vereisten; B2 bevestigt alleen ontvangen bronmetadata. Zie [bronregister](sources/README.md).

| ID | Vraag | Impact | Noodzakelijke bron | Implementatieblokkade |
|---|---|---|---|---|
| Q01 | Werkbladen, headers, celtypen, verborgen tabs, formules/cache, lege rijen, dubbele/ontbrekende keys en eenheden? Exacte doosentiteit? | datamodel en mapping | beide werkbladextracten inclusief metadata of geschikt XLSX-inspectiemiddel | echte masterimport/schema |
| Q02 | Hoe ziet Zite eruit; welke schermen, routes, tabellen en controles bestaan? | reconstructietrouw | screenshots en functionele voorbeelden | definitieve UI/renderer; niet voorlopig skelet |
| Q03 | Is PackagingMode onderdeel override-uniciteit; hoe werken veldmerge, leeg/null/fallback en optionele shapereferenties? | deterministische resolutie | override/standard voorbeelden en besluit | resolutie-engine |
| Q04 | Wie bezit context/CurrentSolutionID; solution-ID, variantrelatie, metadata, editbare velden, actieve historie? | versiebeheer en modusscheiding | echte solutionworkflow/export | solutionopslag en mutaties |
| Q05 | Eenheden, interne/externe doosmaat, nominale maten, tolerantiegrenzen, horizontale verdeling en compressie-effect? | fysieke juistheid | brondefinities + meetvoorbeelden | dimensionele berekening |
| Q06 | Assen/oorsprong, rotaties, patronen, botsing/precisie, supportcontact en laagcriteria? | geometrische juistheid | placementdata, enginebewijs en supportvoorbeelden | packing-engine en fysieke visualisatie |
| Q07 | Zoekdekking, ranking, exactfiltersemantiek, limieten, annulering en gouden uitkomsten? | volledigheid/prestatie | Zite input/output + onderbouwde algoritmeregels | enginekeuze/implementatie/golden assertions |
| Q08 | Importvervanging, deletionbeleid, revisies en exportformaten? | dataverlies en interoperabiliteit | expliciet import/exportbeleid en voorbeelden | productie-import/export |
| Q09 | Waar staat eigen appdata; CERM-grens, autorisatie en bewaarbeleid? | architectuur/privacy | eigenaar- en infrastructuurbesluit | persistente appdata/CERM-koppeling |
| Q10 | Mogen Excelbytes in Git; bevatten ze gevoelige of vertrouwelijke data? | publicatie/privacy | expliciete toestemming + inhoudscontrole | kopiëren naar docs/sources en publiceren van bronnen |
| Q11 | Is GitHub-remote gekoppeld; welke rechten, doelbranch en PR-procedure? | publicatiebewijs | remoteconfig + toegangscontrole + branchbeleid | push/PR; lokale main is geen bewijs |
| Q12 | Onafhankelijke SHA-256 en integriteitscontrole van bronnen? | herkomst/integriteit | checksumtool op oorspronkelijke bytes | verified hash/bytevergelijking; namen zijn geen bewijs |
| Q13 | Mobiel/desktop/a11y en lint feitelijk uitgevoerd? | acceptatie skelet | browsercontrole en ESLint-run | volledige faseacceptatie; build/typecheck niet voldoende |

## Beschikbare voorziening en resterende blokkades (0.2)
De parserblokkade is pragmatisch aangepakt: lokale browserinspectie via ExcelJS 4.4.0 en SHA-256 via Web Crypto indien beschikbaar. De originele XLSX-bestanden kunnen rechtstreeks worden geselecteerd; geen CSV-conversie vereist. Q01/Q12 blijven open voor de twee projectbronnen totdat echte resultaten/checksums worden gedeeld en beoordeeld; implementatie is geen bewijs van inhoudelijke controle.

Deze chat heeft geen browserbesturing, command-uitvoering voor tests of Git remote/push-tools. De preview heeft geen directe toegang tot chatbijlagen. Download het lokale JSON-inspectierapport en deel het bewust voor inhoudelijke analyse, met aandacht voor vertrouwelijke gegevens. Bronnen blijven ongewijzigd op ontvangen locatie totdat Q10 is opgelost. Zie [inspectiecontract](IMPORT_EXPORT.md).

Zie [algoritme](ALGORITHM_CONTRACT.md), [testplan](TEST_PLAN.md), [besluiten](DECISION_LOG.md) en [index](README.md).
