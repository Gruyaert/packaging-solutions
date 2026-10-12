export type MetricName = 'packing' | 'scoring' | 'custom carton' | 'palletisatie' | 'Plotly build' | 'render' | 'totaal';
export const metrics = new Map<string, { last: number; total: number; count: number }>();
export function recordMetric(name: string, ms: number) { const previous = metrics.get(name); metrics.set(name, { last: ms, total: (previous?.total ?? 0) + ms, count: (previous?.count ?? 0) + 1 }); }
