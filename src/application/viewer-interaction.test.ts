import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountViewer, type ViewerData } from '@/visualization/viewer-runtime';
import { createViewerModel } from '@/visualization/viewer-model';
import { DEFAULT_PALLET, palletize } from '@/domain/packing/pallet';
import { palletViewerData } from '@/infrastructure/interactive-report';

// Logic boundary only: these stubs do not exercise real DOM gestures or WebGL.
class NodeStub {
  children: NodeStub[] = [];
  listeners = new Map<string, (event: any) => void>();
  attributes = new Map<string, string>();
  captures = new Set<number>();
  style: Record<string, string> = {};
  dataset: Record<string, string> = {};
  textContent = ''; innerHTML = ''; value = ''; className = ''; open = false;
  layout: any;
  onchange?: () => void;
  onclick?: () => void;
  append(...children: NodeStub[]) { this.children.push(...children); }
  setAttribute(key: string, value: string) { this.attributes.set(key, value); }
  closest() { return null; }
  addEventListener(name: string, callback: (event: any) => void) { this.listeners.set(name, callback); }
  removeEventListener(name: string) { this.listeners.delete(name); }
  setPointerCapture(id: number) { this.captures.add(id); }
  hasPointerCapture(id: number) { return this.captures.has(id); }
  releasePointerCapture(id: number) { this.captures.delete(id); }
  replaceChildren() { this.children = []; }
}
function setup(data: ViewerData, initial: Record<string, unknown> = {}) {
  vi.useFakeTimers();
  const nodes = new Map(['.pv-controls', '.pv-camera', '.pv-advanced', '.pv-timeline', '.pv-status', '.pv-help', '.pv-plot', '.pv-validation', '.pv-checks'].map(key => [key, new NodeStub()]));
  const root = Object.assign(new NodeStub(), { querySelector: (key: string) => nodes.get(key) });
  vi.stubGlobal('document', { createElement: () => new NodeStub(), createTextNode: (text: string) => Object.assign(new NodeStub(), { textContent: text }) });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('requestAnimationFrame', (callback: () => void) => setTimeout(callback, 16));
  vi.stubGlobal('cancelAnimationFrame', clearTimeout);
  const plot = nodes.get('.pv-plot')!;
  const plotlyEvents = new Map<string, (event: any) => void>();
  const Plotly = {
    react: vi.fn(async (_plot: unknown, _traces: any[], layout: any) => { plot.layout = layout; }),
    relayout: vi.fn(async (_plot: unknown, change: Record<string, any>) => { if (change['scene.camera']) plot.layout.scene.camera = change['scene.camera']; }),
    on: vi.fn((_plot: unknown, name: string, handler: (event: any) => void) => plotlyEvents.set(name, handler)),
    removeListener: vi.fn((_plot: unknown, name: string) => plotlyEvents.delete(name)),
    purge: vi.fn(), Plots: { resize: vi.fn() },
  };
  const serialized = new Function(`return (${mountViewer.toString()});`)() as typeof mountViewer;
  const runtime = serialized(root as unknown as HTMLElement, data, Plotly, initial, undefined, createViewerModel);
  const event = (x: number, y = 0, id = 1) => ({ button: 0, pointerId: id, clientX: x, clientY: y, target: new NodeStub(), preventDefault() {}, stopImmediatePropagation() {} });
  const emit = (name: string, value: any) => plot.listeners.get(name)!(value);
  const rotation = nodes.get('.pv-advanced')!.children.find(node => node.textContent === 'Draaien ')!.children[0];
  const setRotation = async (value: string) => { rotation.value = value; rotation.onchange!(); await vi.advanceTimersByTimeAsync(100); };
  const emitPlotly = (name: string, value: any) => plotlyEvents.get(name)?.(value);
  return { nodes, plot, Plotly, runtime, event, emit, emitPlotly, setRotation };
}
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });
const data = () => palletViewerData('Pallet', palletize({ kind: 'database', box: { boxId: 'box', reference: 'Doos', length: 400, width: 300, height: 200, cardboard: 3 } }, DEFAULT_PALLET)[0], DEFAULT_PALLET);

describe('Serialized viewer camera and pallet logic', () => {
  it('draws the physical base and does not add pallet height twice', async () => {
    const input = data(), before = JSON.stringify(input);
    const { Plotly, runtime } = setup(input);
    await vi.advanceTimersByTimeAsync(100);
    const traces = Plotly.react.mock.calls[0][1];
    const base = traces.find(trace => trace.name?.startsWith('Palletbasis'));
    expect(base.opacity).toBe(1);
    expect(Math.min(...base.z)).toBe(0);
    expect(Math.max(...base.z)).toBe(DEFAULT_PALLET.palletHeight);
    const boxes = traces.find(trace => trace.type === 'mesh3d' && trace !== base);
    expect(Math.min(...boxes.z)).toBe(DEFAULT_PALLET.palletHeight);
    expect(JSON.stringify(input)).toBe(before);
    runtime.destroy(); expect(Plotly.purge).toHaveBeenCalled();
  });
  it('lets the default camera tilt without flipping, and zooms by wheel, buttons and pinch', async () => {
    const { plot, nodes, runtime, event, emit } = setup(data());
    await vi.advanceTimersByTimeAsync(100);
    const radius = () => { const eye = plot.layout.scene.camera.eye; return Math.hypot(eye.x, eye.y, eye.z); };
    const start = radius();
    emit('pointerdown', event(100, 100)); emit('pointermove', event(180, 2000));
    await vi.advanceTimersByTimeAsync(20);
    const eye = plot.layout.scene.camera.eye;
    expect(Math.atan2(eye.z, Math.hypot(eye.x, eye.y))).toBeCloseTo(1.48);
    expect(radius()).toBeCloseTo(start);
    emit('pointermove', event(180, -2000)); await vi.advanceTimersByTimeAsync(20);
    expect(plot.layout.scene.camera.eye.z).toBeGreaterThan(0);
    expect(plot.layout.scene.camera.up).toEqual({ x: 0, y: 0, z: 1 });
    emit('pointerup', event(180, -2000));
    emit('wheel', { ...event(0), deltaY: -100 }); await vi.advanceTimersByTimeAsync(20);
    expect(radius()).toBeLessThan(start);
    const wheelRadius = radius();
    nodes.get('.pv-camera')!.children.find(node => node.textContent === '+')!.onclick!();
    await vi.advanceTimersByTimeAsync(20); expect(radius()).toBeLessThan(wheelRadius);
    const beforePinch = radius();
    emit('pointerdown', event(0, 0, 1)); emit('pointerdown', event(100, 0, 2));
    emit('pointermove', event(200, 0, 2)); await vi.advanceTimersByTimeAsync(20);
    expect(radius()).toBeLessThan(beforePinch);
    runtime.destroy(); expect(plot.captures.size).toBe(0); expect(plot.listeners.size).toBe(0);
  });
  it('offers optional Z-only/free rotation and keeps the chosen projection accessible', async () => {
    const { plot, nodes, runtime, emit, event, setRotation } = setup(data(), { rotation: 'z' });
    await vi.advanceTimersByTimeAsync(100);
    const eye = { ...plot.layout.scene.camera.eye };
    emit('pointerdown', event(100)); emit('pointermove', event(180, 1000)); await vi.advanceTimersByTimeAsync(20);
    expect(plot.layout.scene.camera.eye.z).toBeCloseTo(eye.z);
    emit('pointerup', event(180));
    await setRotation('free'); expect(plot.layout.scene.dragmode).toBe('orbit');
    await setRotation('upright'); expect(plot.layout.scene.dragmode).toBe(false);
    expect(plot.layout.scene.camera.eye.x).toBeCloseTo(eye.x);
    expect(plot.layout.scene.camera.eye.y).toBeCloseTo(eye.y);
    expect(plot.layout.scene.camera.eye.z).toBeCloseTo(eye.z);
    const side = nodes.get('.pv-camera')!.children.find(node => node.textContent === 'Zij')!;
    side.onclick!(); await vi.advanceTimersByTimeAsync(100);
    expect(runtime.settings().projection).toBe('side'); expect(side.attributes.get('aria-pressed')).toBe('true');
    runtime.destroy();
  });
  it('exports the live camera only when preservation is enabled and reveals invalid checks', async () => {
    const input = data(); input.validation.status = 'invalid';
    const { plot, nodes, runtime } = setup(input, { camera: { eye: { x: 2, y: 1, z: 1 } } });
    await vi.advanceTimersByTimeAsync(100);
    expect(nodes.get('.pv-checks')!.open).toBe(true);
    expect(runtime.settings().camera?.eye).toEqual(plot.layout.scene.camera.eye);
    const keep = nodes.get('.pv-advanced')!.children.find(node => node.children.some(child => child.textContent === ' Camera behouden'))!.children[0];
    (keep as any).checked = false; keep.onchange!();
    expect(runtime.settings().camera).toBeUndefined();
    runtime.destroy();
  });
  it('uses stable per-box tint metadata, rich hover data and cleans up Plotly selection handlers', async () => {
    const { Plotly, plot, runtime, emitPlotly } = setup(data());
    await vi.advanceTimersByTimeAsync(100);
    const traces = Plotly.react.mock.calls[0][1];
    const productTrace = traces.find(trace => trace.type === 'mesh3d' && trace.vertexcolor);
    const pointTrace = traces.find(trace => trace.customdata);
    expect(productTrace.vertexcolor.length).toBe(productTrace.x.length);
    expect(new Set(productTrace.vertexcolor).size).toBeGreaterThan(1);
    expect(pointTrace.customdata[0][0]).toBeTruthy();
    emitPlotly('plotly_click', { points: [{ customdata: pointTrace.customdata[0] }] });
    await vi.advanceTimersByTimeAsync(100);
    expect(runtime.settings().selectedPlacementId).toBe(pointTrace.customdata[0][0]);
    expect(plot.layout.scene.camera.projection.type).toBe('perspective');
    runtime.destroy();
    expect(Plotly.removeListener).toHaveBeenCalled();
  });
});
