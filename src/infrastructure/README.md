# infrastructure

**Bevestigd**: inspect-workbook.ts is de lokale read-only XLSX-adapter (ExcelJS 4.4.0). Leest browser-File naar een versie 0.2 bronrapport met celwaarden, formules, werkbladmetadata en optionele SHA-256. checkKeys voert uitsluitend expliciet geselecteerde bronkeycontroles uit; geen domeinmapping.

Geen bestandswijziging, netwerkverzending of persistentie. De originele bijlagen zijn niet in een publieke bundel opgenomen. Bronrapporten zijn geen gevalideerde masterdata. Toekomstige appopslag/CERM-adapters **open**; geen kunstmatige repositorylaag.

Zie [architectuur](../../docs/ARCHITECTURE.md), [import](../../docs/IMPORT_EXPORT.md), [data](../../docs/DATA_MODEL.md), [vragen](../../docs/OPEN_QUESTIONS.md) en [index](../../docs/README.md).
