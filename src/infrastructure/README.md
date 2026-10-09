# infrastructure

inspect-workbook.ts: lokale read-only ExcelJS-adapter, JSON-bronrapport0.2 met cellen/formules/metadata/SHA-256. Geen mastermapping.

solution-snapshot.ts: lokaal v0.3 JSON downloaden/lezen; Zod controleert vorm/finite numbers, domain valideert placements opnieuw. Niet vertrouwen op meegeleverde scores/ValidationJSON; geen verborgen fysieke mutaties. Geen serverupload, localStorage, database of CERM-write. Originele Excelbytes niet publiek gebundeld.

Zie [architectuur](../../docs/ARCHITECTURE.md), [import](../../docs/IMPORT_EXPORT.md), [data](../../docs/DATA_MODEL.md), [vragen](../../docs/OPEN_QUESTIONS.md) en [index](../../docs/README.md).
