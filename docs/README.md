# Documentatie · Verpakkingsoptimalisatie

Contractversie 0.1 · basisfase, geen optimalisatie-engine.

## Index: twaalf verplichte documenten
1. [Deze index](README.md)
2. [Gebruikershandleiding](USER_MANUAL.md)
3. [Ontwikkelhandleiding en vervolgfasen](DEVELOPER_MANUAL.md)
4. [Architectuur](ARCHITECTURE.md)
5. [Datamodel](DATA_MODEL.md)
6. [Algoritmecontract en R-regels](ALGORITHM_CONTRACT.md)
7. [UI-contract en U-gebieden](UI_CONTRACT.md)
8. [Import/export](IMPORT_EXPORT.md)
9. [Testplan en T-tests](TEST_PLAN.md)
10. [Changelog en verificatie](CHANGELOG.md)
11. [Besluiten](DECISION_LOG.md)
12. [Open vragen Q01–Q13](OPEN_QUESTIONS.md)

Aanvullend: [bronregister](sources/README.md), [project](../README.md).

## Status en bronhiërarchie
**Bevestigd**: expliciete gebruikersvereiste of daadwerkelijk gecontroleerde observatie, met bron. Dit betekent niet dat het gedrag al werkt of in Zite geobserveerd is.
**Voorlopig voorstel**: ontwerpkeuze/representatie die nog goedkeuring of bewijs vereist.
**Open**: ontbrekende specificatie of bewijs, gekoppeld aan Q-ID en blokkade.

B1: goedgekeurd implementatieplan in deze opdracht en werkplan .dyad/plans/chat-2-plan.md; bron van functionele vereisten. B2: attachments-manifest plus gecontroleerde bestandsstatistieken; bewijst ontvangst/naam/grootte, niet inhoud. B3 (open): XLSX-inhoud en Zite screenshots/input-output; moet mappings/geometrie onderbouwen. Voorstellen mogen B3 nooit vervangen. Bij conflict tussen nieuw bewijs en B1: expliciet besluit, geen stille wijziging.

## Wijzigingsregel
Elke functionele wijziging werkt relevante contracten, R/U/T-traceerbaarheid, vragen, besluitlog en changelog in dezelfde wijzigingsset bij. Vermeld bron, contractversie en echte teststatus; geen definitieve claims bij ontbrekend bewijs.
