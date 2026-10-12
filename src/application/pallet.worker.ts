import { palletize, type PalletSource, type PalletSettings, type PalletResult } from '@/domain/packing/pallet';
import type { Sorting } from '@/domain/packing/types';
export interface PalletRequest { source: PalletSource; settings: PalletSettings; sorting: Sorting }
export type PalletResponse = { results: PalletResult[]; elapsed: number } | { error: string };
const scope = self as unknown as { onmessage: ((event: MessageEvent<PalletRequest>) => void) | null; postMessage(message: PalletResponse): void };
scope.onmessage = ({ data }) => {
  try { const start = performance.now(); const results = palletize(data.source, data.settings, data.sorting); scope.postMessage({ results, elapsed: performance.now() - start }); }
  catch (error) { scope.postMessage({ error: error instanceof Error ? error.message : 'Palletisatie mislukt.' }); }
};
