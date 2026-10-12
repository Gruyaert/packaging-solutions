import { useEffect, useState } from 'react';
import { metrics } from '@/application/performance';
export function PerformanceDashboard() {
  const [, tick] = useState(0);
  useEffect(() => { const timer = setInterval(() => tick(n => n + 1), 1000); return () => clearInterval(timer); }, []);
  return <section className="min-w-0 rounded-2xl border bg-card p-4"><h2 className="font-semibold">Gemeten performance · ms</h2><p className="my-2 text-xs text-muted-foreground">Alleen uitgevoerde acties. Packing/custom/pallet = engine-walltijd in worker, inclusief interne scoreberekening. Scoring = apart gemeten resultaatfilter/sortering. Totaal = workerstart + communicatie + berekening; geen som van fasen. Render = Plotly.react. Cachehits zijn geen nieuwe berekeningen en verhogen deze aantallen niet. — = nog niet gemeten.</p><div className="overflow-auto"><table className="w-full text-left text-xs"><thead><tr><th className="p-2">Fase</th><th>Laatste</th><th>Gemiddeld</th><th>Aantal</th></tr></thead><tbody>{['packing','scoring','custom carton','palletisatie','Plotly build','render','totaal'].map(name => { const m = metrics.get(name); return <tr key={name} className="border-t"><th className="p-2">{name}</th><td>{m?.last.toFixed(2) ?? '—'}</td><td>{m ? (m.total / m.count).toFixed(2) : '—'}</td><td>{m?.count ?? 0}</td></tr>; })}</tbody></table></div></section>;
}
