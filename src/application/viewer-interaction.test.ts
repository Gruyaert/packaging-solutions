import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountViewer, type ViewerData } from '@/visualization/viewer-runtime';
import { createViewerModel } from '@/visualization/viewer-model';
import { DEFAULT_PALLET, palletize } from '@/domain/packing/pallet';
import { palletViewerData } from '@/infrastructure/interactive-report';

// Minimal DOM boundary for runtime logic tests; this does not simulate WebGL or browser gestures.
class NodeStub {
  children: NodeStub[] = [];
  listeners = new Map<string, (event: any) => void>();
  style: Record<string, string> = {};
  dataset: Record<string, string> = {};
  textContent = '';
  innerHTML = '';
  value = '';
  className = '';
  layout: any;
  onchange?: () => void;
  onclick?: () => void;
  append(...children: NodeStub[]) { this.children.push(...children); }
  setAttribute() {}
  closest() { return null; }
  addEventListener(name: string, callback: (event: any) => void) { this.listeners.set(name, callback); }
  removeEventListener(name: string) { this.listeners.delete(name); }
  setPointerCapture() {}
  hasPointerCapture() { return true; }
  releasePointerCapture() {}
  replaceChildren() { this.children = []; }
}
function setup(data: ViewerData) {
  vi.useFakeTimers();
  const nodes = new Map(['.pv-controls', '.pv-advanced', '.pv-timeline', '.pv-status', '.pv-help', '.pv-plot', '.pv-validation'].map(key => [key, new NodeStub()]));
  const root = Object.assign(new NodeStub(), { querySelector: (key: string) => nodes.get(key) });
  vi.stubGlobal('document', { createElement: () => new NodeStub(), createTextNode: (text: string) => Object.assign(new NodeStub(), { textContent: text }) });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('requestAnimationFrame', (callback: () => void) => setTimeout(callback, 16));
  vi.stubGlobal('cancelAnimationFrame', clearTimeout);
  const plot = nodes.get('.pv-plot')!;
  const Plotly = {
    react: vi.fn(async (_plot: unknown, _traces: any[], layout: any) => { plot.layout = layout; }),
    relayout: vi.fn(async (_plot: unknown, change: Record<string, any>) => { if (change['scene.camera']) plot.layout.scene.camera = change['scene.camera']; }),
    purge: vi.fn(), Plots: { resize: vi.fn() },
  };
  const serialized = new Function(`return (${mountViewer.toString()});`)() as typeof mountViewer;
  const runtime = serialized(root as unknown as HTMLElement, data, Plotly, {}, undefined, createViewerModel);
  return { nodes, plot, Plotly, runtime };
}
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });
const results = () => palletize({ kind: 'database', box: { boxId: 'box', reference: 'Doos', length: 400, width: 300, height: 200, cardboard: 3 } }, DEFAULT_PALLET);

describe('Serialized viewer camera and pallet logic', () => {
  it('draws the physical base without adding pallet height twice or modifying placements', async () => {
    const result = results()[0];
    const before = JSON.stringify(result);
    const data = palletViewerData('Pallet', result, DEFAULT_PALLET);
    const { Plotly, runtime } = setup(data);
    await vi.advanceTimersByTimeAsync(100);
    const traces = Plotly.react.mock.calls[0][1] as any[];
    const base = traces.find(trace => trace.name?.startsWith('Palletbasis'));
    expect(base.opacity).toBe(1);
    expect(Math.min(...base.z)).toBe(0);
    expect(Math.max(...base.z)).toBe(DEFAULT_PALLET.palletHeight);
    const boxes = traces.find(trace => trace.type === 'mesh3d' && trace !== base);
    expect(Math.min(...boxes.z)).toBe(DEFAULT_PALLET.palletHeight);
    expect(JSON.stringify(result)).toBe(before);
    runtime.destroy();
    expect(Plotly.purge).toHaveBeenCalled();
  });
  it('keeps vertical eye height and radius fixed while dragging, with explicit free rotation', async () => {
    const data = palletViewerData('Pallet', results()[0], DEFAULT_PALLET);
    const { nodes, plot, Plotly, runtime } = setup(data);
    await vi.advanceTimersByTimeAsync(100);
    expect(plot.layout.scene.dragmode).toBe(false);
    const eye = { ...plot.layout.scene.camera.eye };
    const event = (x: number) => ({ button: 0, pointerId: 1, clientX: x, target: new NodeStub(), preventDefault() {}, stopImmediatePropagation() {} });
    plot.listeners.get('pointerdown')!(event(100));
    plot.listeners.get('pointermove')!({ ...event(180), clientY: 1000 });
    await vi.advanceTimersByTimeAsync(20);
    const next = plot.layout.scene.camera.eye;
    expect(next.z).toBe(eye.z);
    expect(Math.hypot(next.x, next.y)).toBeCloseTo(Math.hypot(eye.x, eye.y));
    expect(next.x).not.toBe(eye.x);
    expect(plot.layout.scene.camera.up).toEqual({ x: 0, y: 0, z: 1 });
    plot.listeners.get('pointerup')!(event(180));
    const rotation = nodes.get('.pv-advanced')!.children.find(node => node.textContent === 'Draaien ')!.children[0];
    rotation.value = 'free'; rotation.onchange!();
    await vi.advanceTimersByTimeAsync(100);
    expect(plot.layout.scene.dragmode).toBe('orbit');
    expect(runtime.settings().rotation).toBe('free');
    rotation.value = 'z'; rotation.onchange!();
    await vi.advanceTimersByTimeAsync(100);
    expect(plot.layout.scene.dragmode).toBe(false);
    expect(plot.layout.scene.camera.eye).toEqual(eye);
    expect(Plotly.relayout).toHaveBeenCalled();
    runtime.destroy();
    expect(plot.listeners.size).toBe(0);
  });
});
