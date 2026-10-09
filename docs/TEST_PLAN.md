# Testplan

Versie 0.1. **Bevestigd**: invarianten uit B1. **Voorlopig voorstel**: testdefinities hieronder. **Open**: golden verwachtingen en fysieke vergelijkingscriteria. Geen packing-test is uitgevoerd of geslaagd in deze fase.

## Invarianttests (toekomstig)
| Test | Regel / UI | Definitie | Verwachting / blokkade |
|---|---|---|---|
| T01 | R01 / U02 | dubbele ShapeID + ShapeVariantID aanbieden | detecteren; bronmapping Q01 |
| T02 | R02 / U02 | shape standard met gelijke triple | detecteren; dezelfde shape in andere modus aparte standard; Q01 |
| T03 | R03 / U03 | ophalen, bewerken, activeren in beide modi | geen contextlek; Q04 |
| T04 | R04 / U01 | override met uitsluitend ProductNumber | geldig zonder shape; scope Q03 |
| T05 | R05 / U01 | override en standard opzelfde veld, plus leeg/null | override vóór standard; fallbackverwachting open Q03 |
| T06 | R06 / U08 | solution bewerken | nieuwe variant; oude inhoud identiek; Q04 |
| T07 | R07 / U08 | andere variant actief kiezen | CurrentSolutionID verandert, solution niet; Q04 |
| T08 | R08 / U06–U07 | exploded view/laagafstand/animatie toggles | elke placementwaarde identiek vóór/na; Q06 |
| T09 | R09 / U04 | tolerantie/compressie toepassen | nominale afmetingen identiek; fysiek effect Q05 |
| T10 | R10 / U06 | bodem, ondersteunde laag en zwevend geval | geen zweven; exact supportcriterium Q06 |
| T11 | R11 / U04 | hoogteclearance controleren | geheel bovenaan; eenheid Q05 |
| T12 | R12 / U04 | lengte-/breedteclearance controleren | som beide zijden = totale speling; verdeling Q05 |
| T13 | R13 / U05 | zelfde zoekresultaat met exactfilter en Alle oplossingen | zoekset ongewijzigd; afwijkend aantal mogelijk in Alle; dekking Q07 |
| T14 | R14 / U02–U09 | poging vrije shape-edit/mastervervanging | geen vrije overschrijving; beleid Q08 |
| T15 | R15 / U09 | eigen appdata bewaren/exporteren | geen CERM-masterwrite; grens Q09 |

## Golden-testregister — open
G01 (voorlopig voorstel): bronvoorbeeld nog niet ontvangen; inputs open; verwachte solutions en placements open; vergelijkingscriteria open (eenheden, assen, numerieke tolerantie Q05–Q07). Vastleggen: test-ID, bewijsbestand/revisie, inputs, verwachte volledige placements/solutions, vergelijkingscriteria en status. Geen verzonnen voorbeeldresultaten. Pas na bewijs worden assertions ingevuld.

## Basisfaseacceptatie
A01: twaalf hoofddocumenten plus bronregister en modulebeschrijvingen aanwezig; relatieve links controleren.
A02: zes kerncontracten vóór appbouw geschreven; alle R-regels gekoppeld aan T-test en U-gebied.
A03: ontvangen bronnen/metadata onderscheiden van inhoudscontrole; geen mapping verzonnen.
A04: kopie uitsluitend na Q10; byte-identiteit/checksum pas na Q12. Momenteel geblokkeerd, geen kopieën.
A05: skelet zonder schijnacties/fictieve data; responsive klassen inspecteren; mobiele/desktopbrowser en toegankelijkheid handmatig toetsen (nog niet uitgevoerd).
A06: TypeScript en productiebuild uitvoeren; ESLint alleen geslaagd noemen bij echte run.
A07: code+docs dezelfde wijzigingsset; commit/push/PR uitsluitend claimen na bewijs. Q11 blokkeert publicatie.

Werkelijke verificatiestatus staat in [changelog](CHANGELOG.md), niet in bovenstaande toekomstige definities. Vervolgacceptatie per fase in [ontwikkelhandleiding](DEVELOPER_MANUAL.md). Zie [regels](ALGORITHM_CONTRACT.md), [vragen](OPEN_QUESTIONS.md) en [index](README.md).
