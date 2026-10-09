# application

packing-job.ts bevat het workerberichtcontract; packing.worker.ts roept pure domainfuncties aan. UI termination annuleert zonder main-thread blokkade; publieke engine biedt AbortSignal. Geen service/repository voor hypothetische database. Contextresolutie/variantmaken/actiefkeuze later afzonderlijke use-cases.

Zie [architectuur](../../docs/ARCHITECTURE.md), [contract](../../docs/ALGORITHM_CONTRACT.md) en [ontwikkeling](../../docs/DEVELOPER_MANUAL.md).
