# Import/exportcontract

Versie 0.1. **Bevestigd**: ontvangst van twee bestanden en masterdatagrens uit B1/B2. **Voorlopig voorstel**: toekomstige previewflow. **Open**: alle Excelmappings en exportspecificaties.

## Werkelijk gecontroleerd
Manifest gelezen en bestandsgroottes via file-stat bevestigd: Omdozen.xlsx 7.802 bytes; Shapes.xlsx 48.345 bytes. Bestanden zijn binaire XLSX. Inhoud niet uitgepakt: geen werkbladnamen, headers, records of formules gelezen. Zie volledige paden in [bronregister](sources/README.md). SHA-256 niet berekend; opgeslagen bestandsnamen lijken hashes, maar zijn geen geverifieerde checksum.

## Inspectiechecklist (alles open Q01)
Werkbladnamen/hidden-state; headers en celtypen; formules én cached values; lege rijen; dubbele sleutels; ontbrekende keyvelden; eenheden; nominale versus praktische maten. Geen mapping op basis van namen Shapes/Omdozen. Exacte doosentiteit pas na inspectie. Inspectie vereist apart geschikt middel of extract met metadata; geen runtime-library toegevoegd voor het skelet.

## Voorgestelde toekomstige flow
1. Ongewijzigde bronbytes + herkomst vastleggen na toestemming.
2. Bronwaarden lezen zonder automatische normalisatie of formule-uitvoering.
3. Mapping/schema-preview met expliciete veldherkomst aanbieden; huidige mapping is open.
4. Validatie rapporteren per werkblad/rij/veld, inclusief duplicaten en fouten; geen deels geslaagde vervanging stil doorzetten.
5. Na expliciete goedkeuring gevalideerde masterrevisie vastleggen, gescheiden van eigen appdata.

Dit is een voorstel, niet geïmplementeerde import. Shapes blijven gecontroleerde Excel-masterdata. Eigen appdata wordt niet teruggeschreven als CERM-masterdata (R14–R15). Importvervanging, verwijderingen en revisiebeleid Q08; operationele opslag Q09; bronopname Q10. Exports: formaat, velden, versie, eenheden en roundtripsemantiek onbekend, geen downloadknop.

Zie [data](DATA_MODEL.md), [tests](TEST_PLAN.md), [vragen](OPEN_QUESTIONS.md) en [index](README.md).
