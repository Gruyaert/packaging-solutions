# Bronregister

Versie 0.1. **Bevestigd**: onderstaande namen uit attachments-manifest en daadwerkelijke bytegroottes uit file-stat. **Open**: inhoud, toestemming, checksum. **Voorlopig voorstel**: docs/sources als toekomstige bronarchiefplek na goedkeuring.

| Bron-ID | Oorspronkelijke naam | Ontvangen bronpad | Gecontroleerde grootte | Ontvangen volgens manifest | Inhoud | SHA-256 |
|---|---|---|---|---|---|---|
| S01 | Shapes.xlsx | .dyad/media/909614591ecc3e0ab309ac9e19d7917feee9e72d799d539ab9757135c88e02a9.xlsx | 48345 bytes | 2026-10-09T07:41:42.948Z | niet gecontroleerd | niet berekend |
| S02 | Omdozen.xlsx | .dyad/media/71cb403628f25e56778261c78386efffee2d9ce9e85c20bcb6f6dafab32792f1.xlsx | 7802 bytes | 2026-10-09T07:41:42.948Z | niet gecontroleerd | niet berekend |

Herkomst B2: .dyad/media/attachments-manifest.json; MIME application/vnd.openxmlformats-officedocument.spreadsheetml.sheet. Geen inhoudelijke afleiding uit bestandsnaam. De opgeslagen namen zijn niet onafhankelijk geverifieerd als SHA-256.

## Bewaarbeleid en blokkades
Oorspronkelijke bestanden niet gewijzigd, niet naar public gekopieerd en geen downloadroute toegevoegd. Ook nog niet naar docs/sources gekopieerd: Q10 (opnametoestemming en gevoelige inhoud) open. Er is dus geen bytekopie die als gecontroleerd mag worden aangemerkt. Q12: checksumtool ontbreekt. Q01: XLSX-parser ontbreekt; werkbladen/headers/types/formules/cache/hidden tabs/lege rijen/duplicaten/keys/eenheden allemaal onbekend. Vraag een werkbladextract plus metadata; CSV alleen volstaat niet voor formules en hidden-state.

Na toestemming: ongewijzigde bytes kopiëren, onafhankelijk SHA-256 bron en kopie vergelijken, register bijwerken; geen openbaar downloadpad. Zie [import/export](../IMPORT_EXPORT.md), [vragen](../OPEN_QUESTIONS.md) en [index](../README.md).
