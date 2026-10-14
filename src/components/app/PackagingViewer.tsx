import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { mountViewer, VIEWER_CSS, type ViewerData } from '@/visualization/viewer-runtime';
import { loadPlotly } from '@/visualization/plotly';
import { recordMetric } from '@/application/performance';
import { exportInteractiveReport } from '@/infrastructure/interactive-report';
import { createViewerPalette } from '@/visualization/viewer-palette';
export function PackagingViewer({ data }: { data: ViewerData }) {
  const host = useRef<HTMLDivElement>(null), runtime = useRef<ReturnType<typeof mountViewer> | undefined>(undefined), visualSettings = useRef<Record<string, unknown> | undefined>(data.settings);
  const [visible, setVisible] = useState(false), [error, setError] = useState(''), [exporting, setExporting] = useState(false);
  useEffect(() => { const observer = new IntersectionObserver(entries => setVisible(entries.some(e => e.isIntersecting)), { rootMargin: '100px' }); if (host.current) observer.observe(host.current); return () => observer.disconnect(); }, []);
  useEffect(() => {
    if (!visible) return;
    let canceled = false;
    setError('');
    void loadPlotly().then(plotly => { if (!canceled && host.current) {
      const settings = { ...visualSettings.current, step: data.placements.length, layer: 'all' };
      runtime.current = mountViewer(host.current, data, plotly, settings, recordMetric, undefined, createViewerPalette());
    } }).catch(e => { if (!canceled) setError(String(e)); });
    return () => { canceled = true; if (runtime.current) { visualSettings.current = runtime.current.settings(); runtime.current.destroy(); runtime.current = undefined; } };
  }, [visible, data]);
  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border bg-card p-3 sm:p-4" aria-label="Interactive Packaging Viewer">
      <style>{VIEWER_CSS}</style>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{data.kind === 'pallet' ? 'Stapelschema' : 'Vulschema'}</h3>
        <Button variant="outline" size="sm" className="rounded-xl border-primary/30 text-primary" disabled={exporting} onClick={async () => { setExporting(true); try { await exportInteractiveReport({ ...data, settings: runtime.current?.settings() ?? visualSettings.current }); } catch (e) { setError(String(e)); } finally { setExporting(false); } }}>{exporting ? 'Infokaart voorbereiden…' : 'Operator-infokaart ↗'}</Button>
      </div>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      {!visible && <p className="p-4 text-xs text-muted-foreground">Viewer wordt geladen wanneer zichtbaar.</p>}
      {/* The imperative viewer exclusively owns this container's children. */}
      <div ref={host} className="aspect-[4/3] min-h-48 w-full min-w-0 max-w-full overflow-hidden rounded-xl bg-background" />
    </section>
  );
}
