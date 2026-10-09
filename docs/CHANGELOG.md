# Changelog

## 2026-10-09 · Contractbasis en appskelet (0.1)
Datum gebaseerd op ontvangen manifest/plan; geen onafhankelijke tijdmeting.

Wijziging: twaalf projectspecifieke documenten, bronregister, modulegrenzen, traceerbaarheid R01–R15/U01–U09/T01–T15, Nederlandse startpagina met twee kleine componenten. README vervangen; globals.css centrale kleuren en radius aangepast. App.tsx, config en dependencies ongewijzigd. Werkplan bijgewerkt; geen hash-snapshot gewijzigd.
Waarom: onderhoudbare reconstructiebasis zonder ontbrekende packingregels te verzinnen.
Impact: informatieve startpagina, geen operationele functies of opslag. Geen Excelbytes gekopieerd of openbaar gemaakt.
Risico's: broninhoud, geometrie, screenshots, opslag, bronrechten en publicatie blijven open; voorlopige stijl is geen Zite-reconstructie.

### Werkelijke verificatie
- Beginsituatie: git-status schoon op main; HEAD 9435ceb62ca691d942610c9838c7d439d850f8f2.
- Bronaanwezigheid/metadata: gecontroleerd; inhoud/SHA-256/bytekopie: niet uitgevoerd, geblokkeerd.
- Typecheck: uitgevoerd, geslaagd; geen TypeScriptfouten.
- Productiebuild: uitgevoerd, geslaagd (Vite 8.0.10). Bestaande waarschuwingen: deprecated esbuild-optie in react-swc-plugin en verouderde Browserslist-data; geen config/dependencywijziging uitgevoerd.
- Documentlinks/inventaris: uitgevoerd; 18 Markdownbestanden gecontroleerd (12 hoofddocs, bronregister, 4 module-README's, project-README); geen kapotte relatieve links of nultekens; R01–R15 en T01–T15 aanwezig.
- ESLint: niet uitgevoerd, geen uitvoertool beschikbaar.
- Browser mobiel/desktop/a11y: niet uitgevoerd, geen browserbesturing beschikbaar.
- Packing/invariant/golden tests: definities, niet uitgevoerd; geen engine.
- Lokale commit: Dyad beheert dit na afloop; nieuwe hash nog niet geverifieerd.
- GitHub push/PR: niet uitgevoerd; remote/rechten/branchbeleid niet geverifieerd (Q11).

Zie [testplan](TEST_PLAN.md), [besluiten](DECISION_LOG.md) en [index](README.md).
