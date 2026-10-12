import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { mountViewer, VIEWER_CSS, type ViewerData } from '@/visualization/viewer-runtime';
import { loadPlotly } from '@/visualization/plotly';
import { recordMetric } from '@/application/performance';
import { exportInteractiveReport } from '@/infrastructure/interactive-report';
export function PackagingViewer({ data }: { data: ViewerData }) {
  const host = useRef<HTMLDivElement>(null), runtime = useRef<ReturnType<typeof mountViewer> | undefined>(undefined), visualSettings = useRef<Record<string, unknown> | undefined>(data.settings);
  const [visible, setVisible] = useState(false), [error, setError] = useState(''), [exporting, setExporting] = useState(false);
  useEffect(() => { const observer = new IntersectionObserver(entries => setVisible(entries.some(e => e.isIntersecting)), { rootMargin: '100px' }); if (host.current) observer.observe(host.current); return () => observer.disconnect(); }, []);
  useEffect(() => {
    if (!visible) return;
    let canceled = false;
    void loadPlotly().then(plotly => { if (!canceled && host.current) runtime.current = mountViewer(host.current, data, plotly, visualSettings.current, recordMetric); }).catch(e => { if (!canceled) setError(String(e)); });
    return () => { canceled = true; if (runtime.current) { visualSettings.current = runtime.current.settings(); runtime.current.destroy(); runtime.current = undefined; } };
  }, [visible, data]);
  return (
    <section className="min-w-0 rounded-2xl border bg-card p-3 sm:p-4" aria-label="Interactive Packaging Viewer">
      <style>{VIEWER_CSS}</style>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">Interactieve placement-viewer</h3>
        <Button variant="outline" className="rounded-xl" disabled={exporting} onClick={async () => { setExporting(true); try { await exportInteractiveReport({ ...data, settings: runtime.current?.settings() ?? visualSettings.current }); } catch (e) { setError(String(e)); } finally { setExporting(false); } }}>Export → {exporting ? 'Rapport voorbereiden…' : 'Interactief HTML rapport'}</Button>
      </div>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      {!visible && <p className="p-4 text-xs text-muted-foreground">Viewer wordt geladen wanneer zichtbaar.</p>}
      {/* The imperative viewer exclusively owns this container's children. */}
      <div ref={host} className="min-h-48 min-w-0" />
    </section>
  );
}
