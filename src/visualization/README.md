# visualization

De packaging- en palletviewers gebruiken één read-only Plotly-runtime voor live schermen en offline operatorrapporten. Fysieke placements, bounds, maten, coördinaten en layerIndex blijven de bron van waarheid; camera, exploded offsets, kleuren, tinten, lighting, selectie en labels zijn uitsluitend display-state.

Producten krijgen een vaste familie-kleur uit `viewer-palette.ts`. Individuele dozen krijgen deterministische tinten op basis van de stabiele placementvolgorde en laag. De tinten zijn geen extra fysieke betekenis. Hover/click gebruiken placement-ID, productreferentie, laag, rotatie, fysieke X/Y/Z en L/B/H zonder de placement te wijzigen.

`viewer-model.ts` levert stabiele `ViewerItem`-metadata. `viewer-runtime.ts` bouwt gebatchte mesh-/wire-/point-traces, gebruikt Plotly lighting en rich customdata, en ruimt camera-, pointer-, Plotly- en timerlisteners op. De offline HTML serialiseert dezelfde self-contained runtime en defaults; er is geen CDN- of netwerkafhankelijkheid.

Zie [UI](../../docs/UI_CONTRACT.md), [contract](../../docs/ALGORITHM_CONTRACT.md), [tests](../../docs/TEST_PLAN.md) en [palette-tests](./viewer-palette.test.ts).