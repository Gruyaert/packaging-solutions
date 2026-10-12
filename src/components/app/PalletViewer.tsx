import { useMemo } from 'react';
import type { PalletResult, PalletSettings, PalletSource } from '@/domain/packing/pallet';
import { palletViewerData } from '@/infrastructure/interactive-report';
import { usePackagingData } from './PackagingDataProvider';
import { PackagingViewer } from './PackagingViewer';
export function PalletViewer({ result, settings, source, title }: { result: PalletResult; settings: PalletSettings; source?: PalletSource; title: string }) {
  const { records } = usePackagingData();
  const data = useMemo(() => palletViewerData(title, result, settings, source, records), [result, settings, source, title, records]);
  return <PackagingViewer data={data} />;
}
