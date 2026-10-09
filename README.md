# Verpakkingsoptimalisatie

Enginefase0.3: productinvoer → concrete packingplacements → gevalideerde solutions → maatwerkdozen/palletisatie. Geen fictieve demoresultaten, geen globale optimaliteitsclaim.

## Beschikbaar
- Maximaal5 producten, zes selecteerbare rotaties, g/kg met3decimalen, rij-/kolom-/laagmaxima.
- Gewenste aantallen en minimaal lucht/vullen; exactfilter apart, afwijkende oplossingen blijven behouden.
- Single-product lineair maatwerk; multi-product echte packing, realiteitsfilter inclusief kartondikte.
- Praktisch/ecologisch60/40 met zwaar gewicht voor lucht/transportvolume, restmetadata.
- ValidationJSON, read-only laagviewer/placementtabel en lokale v0.3 JSON-snapshots.
- Palletisatie met 0/90/meng/ondersteunde alternerende patronen, buitenmaten, overhang en metrics.
- Bestaande lokale XLSX-inspectie, geen CSV-conversie vereist.

Engine puur TypeScript los van React; zoeken in annuleerbare Web Worker. Vitest golden fixtures voor alle7feedbackcases plus regressies. Zoek/placementlimieten worden expliciet gemeld; tests/build/typecheck in deze turn niet uitgevoerd wegens ontbrekende uitvoertool.

Database/CERM, gecontroleerde productie-masterimport, persistente versionering/CurrentSolutionID, Solution Editor, compressie en3D blijven afzonderlijke vervolgstappen. Pallet-Boxadapter accepteert doosrecords; UI heeft handmatige buitenmaat zolang database niet gekoppeld is. Gewicht/draagkracht/transportstabiliteit niet gecertificeerd.

[Gebruik](docs/USER_MANUAL.md) · [Contract](docs/ALGORITHM_CONTRACT.md) · [Tests](docs/TEST_PLAN.md) · [Ontwikkeling](docs/DEVELOPER_MANUAL.md) · [Documentatie](docs/README.md) · [Changelog](docs/CHANGELOG.md) · [Vragen](docs/OPEN_QUESTIONS.md)

React19/TypeScript/Vite/Tailwind/shadcn; routes in src/App.tsx. Geen backend. GitHub-opname/rechten/publicatie niet geverifieerd, geen push/PR geclaimd.
