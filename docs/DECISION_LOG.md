# Besluitlog

Versie0.4. Bronnen B1/B2 en B4 huidige packingprompt. Status **bevestigd** voor vereisten; algoritmische keuzes zijn **voorlopig voorstel** voor verdere productievalidatie.

| ID | Status | Besluit / context | Alternatief | Gevolgen |
|---|---|---|---|---|
| D01 | vervangen door D10 | oude engineblokkade zonder bewijs | blijven wachten | B4 geeft nu concrete fysieke regels en toestemming |
| D02 | bevestigd als structuur | concrete modulegrenzen | lege abstractions | domain-packing pure functies, geen React/IO |
| D03 | bevestigd | originele bronnen niet gewijzigd/Git-gepubliceerd | direct kopiëren | Q10 blijft open |
| D04 | vervangen door D09 | oorspronkelijk geen XLSX-runtime | pragmatische reader | inspectie toegevoegd |
| D05 | bevestigd invariant | read-only placements, varianten/actief apart | mutabele viewer/history | laagviewer/snapshot blijft truth; versionering nu beschikbaar, vrije Editor later |
| D06 | voorlopig voorstel | compacte responsive teal UI | Zite namaken zonder screenshots | geen reconstructieclaim |
| D07 | bevestigd | geen GitHub-claim zonder remote/rechtenbewijs | main als bewijs | Q11 blijft open |
| D08 | gedeeltelijk vervangen door D19 | private appdata nu Supabase; CERM blijft open | lokaal-only | echte eigen opslag, geen CERM-write |
| D09 | bevestigd implementatie | lazy ExcelJS lokale inspectie | CSV/andere chat verplicht | originele XLSX bruikbaar, geen upload |
| D10 | bevestigd door B4 | packing/maatwerk/palletisatie nu implementeren | skelet behouden | eerdere verbod vervalt, ontbrekende domeinregels niet verzinnen |
| D11 | voorlopig voorstel | extreme-point greedy, diverse volgorde/rotaties, bounded | dure exhaustieve optimizer | valide gevonden resultaten, geen globale optimaliteitsclaim; truncatie zichtbaar |
| D12 | voorlopig voorstel | volledige footprint union-support, epsilon1e-6 | fractionele steun/materialen | conservatief; fysiek geldig geometrisch, operatorreview nodig |
| D13 | voorlopig voorstel | maxima tellen unieke x/y-origins per product/laag en z-levels | rij-/kolomdefinitie per dominant patroon | eenduidige mixed-product validatie; nader bevestigen |
| D14 | voorlopig voorstel | ecology=gemiddelde binnen-/buitenvolume-efficiëntie; scoreecology×(0.6ecology+0.4handling),75%-band | puur netheid of alleen lucht | lucht én transportvolume zwaar; te ruime dozen zakken |
| D15 | voorlopig voorstel | geïsoleerde singleton buiten dominante verbonden rastercluster markeren; compacte aangesloten rest niet | alle laatste rijstuks rest noemen | ook losse rest op dezelfde rij/kolom detecteren; conservatief, Editor later |
| D16 | bevestigd implementatie | worker/terminate-annulering, Vitest pure tests | blocking UI/geen tests | responsief,7golden cases uitvoerbaar; uitvoering niet geclaimd |
| D17 | voorlopig voorstel | buitenmaten=binnen+2karton; pallet grids/guillotine + gedragen alternatie | alleen volumequotient | geometrische patterns, geen dragkracht-/transportcertificaat |
| D18 | bevestigd implementatie | v0.3 JSON snapshot lokaal, schema+fysieke revalidatie | vertrouwen op ingelezen score/validation | viewer/export behouden placements; database-opslag toegevoegd in 0.4, geen CERM-write |

| D19 | geïmplementeerd | Supabase per-auth-user RLS, geen profiel/teams, minimale expliciete grants | gedeelde bedrijfsruimte | veilige private workspace; geen anon/hard delete |
| D20 | geïmplementeerd | atomische own-user upsert + importhistory, expliciete mapping/preview, geen automatische deletions | automatische headers/destructieve vervanging | bronbytes lokaal, bevestigde records naar Supabase |
| D21 | geïmplementeerd | immutable snapshots/mode/context/lineage; active pointer op definitie via RPC | inplace physical edits | varianten met origineel behouden; STOCK/PERSO geïsoleerd |
| D22 | voorlopig voorstel | globaal gewicht=inhoud, lagen=unieke Z-startniveaus; during-search caps | onbekend doosgewicht raden/achteraffilter | transparante constraints, operatorreview laagsemantiek |
| D23 | geïmplementeerd | HTML escaped met dezelfde placements; eigen workspace-JSON | CERM-format of autoherstel | bruikbare veilige exports, geen ongeautoriseerde publicatie |

Zie [contract](ALGORITHM_CONTRACT.md), [tests](TEST_PLAN.md), [vragen](OPEN_QUESTIONS.md), [changelog](CHANGELOG.md) en [index](README.md).
