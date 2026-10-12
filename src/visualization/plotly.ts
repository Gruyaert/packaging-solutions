export async function loadPlotlySource(): Promise<string> {
  const module = await import('plotly.js-gl3d-dist-min/plotly-gl3d.min.js?raw');
  return module.default;
}
let loaded: Promise<any> | undefined;
export function loadPlotly(): Promise<any> {
  if (!loaded) loaded = loadPlotlySource().then(source => {
    const script = document.createElement('script'); script.textContent = source; document.head.append(script); script.remove();
    const plotly = (window as any).Plotly;
    if (!plotly) throw new Error('Lokale Plotly-bundle kon niet geladen worden.');
    return plotly;
  }).catch(error => { loaded = undefined; throw error; });
  return loaded;
}
