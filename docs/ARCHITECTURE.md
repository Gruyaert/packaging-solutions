# Architectuur

Versie 0.1. **Bevestigd**: React 19, TypeScript, Vite, centrale React Router-routes in src/App.tsx, Tailwind/shadcn aanwezig. Geen server, database of optimalisatie-engine in deze fase.

## Modulegrenzen — voorlopig voorstel
- domain: toekomstige entiteiten, invarianten R01–R15 en resolutie, zonder React/IO. Alleen een module-README in deze fase.
- application: toekomstige use-cases voor resolve, zoeken, variantmaken en actiefkeuze; geen concrete service/repository nu.
- infrastructure: toekomstige gecontroleerde bronadapters en aparte appopslag; geen Excel-runtime, CERM of database nu.
- visualization: toekomstige read-only renderer, nooit fysieke placementmutaties.
- components/app: twee presentational components; Index composeert; geen persistente state.

## Voorgestelde toekomstige stroom
Excelbron → inspectie/preview/validatierapport → gecontroleerde masterdata. ProductNumber + PackagingMode → override/standard-resolutie → gevalideerde engine-invoer → nieuwe immutable Solution + Placements → alleen-lezen weergave. Variantmaken bouwt nieuwe inhoud; actief kiezen wijzigt CurrentSolutionID bij een nog onbekende eigenaar. Renderinstellingen lopen niet terug naar placements.

## Opslag en vertrouwen — open
GitHub als bron van waarheid geldt voor code en contracten, niet automatisch voor operationele data. Appdata-opslag, CERM-grens, eigenaar, toegangsbeleid en transacties: Q04/Q09. Geen abstractielaag aangemaakt voordat de behoefte vaststaat. Bronnen niet onder public en geen downloads; Q10 blokkeert opname. Geen browseruploads, externe calls of nieuwe dependencies in het skelet.

## Fasegrens
Niet beschikbaar: engine, productie-import, database, CERM, definitieve solutionbewerking, 3D en exports. Deze blijven toekomstige functies, niet vervangen door demo's. Geen config- of routewijziging vereist voor de startpagina. Zie [module-uitleg](../src/domain/README.md), [data](DATA_MODEL.md), [UI](UI_CONTRACT.md), [vragen](OPEN_QUESTIONS.md), [vervolgfasen](DEVELOPER_MANUAL.md) en [index](README.md).
