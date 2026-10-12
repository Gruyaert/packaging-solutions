import type { Product, Solution } from '@/domain/packing/types';
import type { PackagingRecords, SolutionRecord } from './packaging-records';

export function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function exportSolutionHtml(name: string, solution: Solution, products: Product[], records?: PackagingRecords, record?: SolutionRecord, options?: { definitionId?: string; mode?: 'STOCK' | 'PERSO' }) {
  const { exportInteractiveReport, solutionViewerData } = await import('./interactive-report');
  await exportInteractiveReport(solutionViewerData(name, solution, products, records, record, options));
}
