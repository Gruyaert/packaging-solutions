import { describe, expect, it } from 'vitest';
import { createViewerModel } from '@/visualization/viewer-model';
import { buildInteractiveHtml, reportFilename, scriptJson, solutionViewerData, palletViewerData } from '@/infrastructure/interactive-report';
import { createResultCache } from './result-cache';
import { makeSolution } from '@/domain/packing/scoring';
import { DEFAULT_PALLET } from '@/domain/packing/pallet';
import type { Placement, Product } from '@/domain/packing/types';
import type { ViewerData } from '@/visualization/viewer-runtime';
const placements: Placement[] = [
  { placementId: 'b', productId: 'p', x: 10, y: 0, z: 0, length: 10, width: 10, height: 10, orientation: 'L-B-H', layerIndex: 0 },
  { placementId: 'a', productId: 'p', x: 0, y: 0, z: 0, length: 10, width: 10, height: 10, orientation: 'L-B-H', layerIndex: 0 },
  { placementId: 'c', productId: 'p', x: 0, y: 0, z: 10, length: 10, width: 10, height: 10, orientation: 'L-B-H', layerIndex: 1 },
];
const product: Product = { productId: 'p', reference: 'Product', length: 10, width: 10, height: 10, quantity: 3, weightKg: 0.1, rotations: ['L-B-H'], maxInLength: 10, maxInWidth: 10, maxLayers: 10, allowCompression: true, compressibilityX: 2 };
const data: ViewerData = { title: 'Eigen referentie', kind: 'packaging', placements, products: [product], bounds: { length: 30, width: 20, height: 30 }, validation: { status: 'valid', warnings: ['Nominale maten behouden.'] } };
describe('Shared placement viewer and offline reports', () => {
  it('defaults to upright rotation and exports normalized camera settings without changing placements', () => {
    expect(createViewerModel(placements).state.rotation).toBe('upright');
    expect(createViewerModel(placements, { rotation: 'invalid' }).state.rotation).toBe('upright');
    const camera = { eye: { x: 1, y: 2, z: 1 }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: 0 } };
    expect(createViewerModel(placements, { camera: { eye: { x: 0, y: 0, z: 0 } } }).state.camera).toBeUndefined();
    expect(createViewerModel(placements, { camera, keepCamera: false }).state.camera).toBeUndefined();
    for (const rotation of ['upright', 'z', 'free']) {
      const report = buildInteractiveHtml({ ...data, settings: { rotation, camera } }, 'window.Plotly = {};');
      const json = report.match(/<script type="application\/json" id="packaging-solution-data">([\s\S]*?)<\/script>/)![1];
      expect(JSON.parse(json).settings.rotation).toBe(rotation);
      expect(JSON.parse(json).settings.camera).toEqual(camera);
      expect(JSON.parse(json).placements).toEqual(placements);
      expect(report).toContain('Operator-infokaart');
      expect(report).not.toContain('#21473b');
    }
  });
  it('orders animation spatially without mutating input; exploded only changes display', () => {
    const before = JSON.stringify(placements), model = createViewerModel(placements);
    expect(model.ordered.map(p => p.placementId)).toEqual(['a', 'b', 'c']);
    model.state.productGap = 100; model.state.layerGap = 100;
    expect(model.display(placements[0]).x).toBe(110);
    expect(model.display(placements[2]).z).toBe(110);
    expect(JSON.stringify(placements)).toBe(before);
    expect(model.display(placements[0]).length).toBe(10);
  });
  it('uses the same layer and step filters for packaging and pallet placements', () => {
    const model = createViewerModel(placements);
    model.state.layer = '1'; expect(model.visible().items.map(p => p.placementId)).toEqual(['c']);
    model.state.step = 2; expect(model.visible().total).toBe(0);
    model.state.layer = 'all'; expect(model.visible().items).toHaveLength(2);
    model.state.step = 0; expect(model.visible().items).toHaveLength(0);
  });
  it('provides physical top/front/side projections and bounds imported visual settings', () => {
    const model = createViewerModel(placements, { opacity: 3, productGap: -1, layerGap: 500, step: 500, speed: 99, layer: 'fake', projection: 'fake' });
    expect(model.state).toMatchObject({ opacity: 1, productGap: 0, layerGap: 100, step: 3, speed: 1, layer: 'all', projection: '3d' });
    model.state.projection = 'top'; expect(model.project([1, 2, 3])).toEqual([1, 2]);
    model.state.projection = 'front'; expect(model.project([1, 2, 3])).toEqual([1, 3]);
    model.state.projection = 'side'; expect(model.project([1, 2, 3])).toEqual([2, 3]);
  });
  it('caps rendered geometry while retaining all source JSON for large datasets', () => {
    const large = Array.from({ length: 10000 }, (_, i) => ({ ...placements[0], placementId: String(i), x: i * 10 }));
    const model = createViewerModel(large);
    expect(model.visible().total).toBe(10000); expect(model.visible().items).toHaveLength(600);
    expect(model.ordered).toHaveLength(10000); expect(large).toHaveLength(10000);
    const report = buildInteractiveHtml({ ...data, placements: large }, 'window.Plotly = {};');
    expect(report).toContain('Tabel toont de eerste 600/10000 rijen');
    const embedded = report.match(/<script type="application\/json" id="packaging-solution-data">([\s\S]*?)<\/script>/)![1];
    expect(JSON.parse(embedded).placements).toHaveLength(10000);
  });
  it('escapes script-breaking content without changing JSON truth', () => {
    const malicious = '</script><script>alert(1)</script> & < > \u2028 \u2029';
    const encoded = scriptJson({ reference: malicious });
    expect(encoded).not.toContain('</script>'); expect(encoded).not.toContain('<');
    expect(JSON.parse(encoded).reference).toBe(malicious);
  });
  it('embeds Plotly, an operator card with collapsed technical appendices, complete source and no external runtime', () => {
    const report = buildInteractiveHtml({ ...data, title: '</script><img src=x>', fullSolution: { editor: { sourceSolutionId: 'original' } }, settings: { productGap: 35 } }, 'window.Plotly = {};');
    expect(report).toContain('window.Plotly = {};'); expect(report).toContain('connect-src \'none\'');
    expect(report).not.toMatch(/<script[^>]+src=/i); expect(report).not.toContain('cdn.plot.ly');
    const json = report.match(/<script type="application\/json" id="packaging-solution-data">([\s\S]*?)<\/script>/)![1];
    const parsed = JSON.parse(json);
    expect(parsed.placements).toEqual(placements); expect(parsed.settings.productGap).toBe(35);
    expect(parsed.products[0].compressibilityX).toBe(2); expect(parsed.validation.status).toBe('valid');
    expect(parsed.fullSolution.editor.sourceSolutionId).toBe('original');
    expect(report).toContain('Technische data · Full solution JSON'); expect(report).toContain('Validatie / compressibility');
    expect(report).toContain('const paletteFactory='); expect(report).toContain('const bases = ["#2563eb"');
    expect(report).toContain('<details class="appendix technical"><summary>Technische bijlagen');
    expect(report).not.toMatch(/<details[^>]*\bopen(?:\s|=|>)/);
    expect(report.indexOf('Wat gaat in de doos?')).toBeLessThan(report.indexOf('Technische bijlagen'));
    expect(report).toContain('Bovenaanzicht eerste laag'); expect(report).toContain('@media print');
    expect(report).not.toContain('<img src=x>');
    const scripts = [...report.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    for (const script of scripts) expect(() => new Function(script[1])).not.toThrow();
  });
  it('uses shape, product and free naming conventions with safe filename segments', () => {
    expect(reportFilename(data, '2026-10-12')).toBe('verpakkingsrapport_Eigen_referentie_2026-10-12.html');
    const shape = { ...data, context: { definition: { scope: 'SHAPE', shape_id: 'S/1', variant_id: 'V', packaging_mode: 'STOCK' } } };
    expect(reportFilename(shape, '2026-10-12')).toBe('verpakkingsrapport_S_1_V_STOCK_2026-10-12.html');
    const override = { ...data, context: { definition: { scope: 'PRODUCT', product_number: 'P', packaging_mode: 'PERSO' } } };
    expect(reportFilename(override, '2026-10-12')).toBe('verpakkingsrapport_product_P_PERSO_2026-10-12.html');
  });
  it('adapts search/custom/saved/edited and pallet sources without inventing metadata', () => {
    const solution = makeSolution('id', [product], { ...data.bounds, boxId: 'box', reference: 'Doos', cardboard: 0 }, { length: 0, width: 0, height: 0 }, placements, 'fixture');
    const packaging = solutionViewerData('Doos', solution, [product], undefined, undefined, { mode: 'PERSO' });
    expect(packaging.placements).toBe(solution.placements); expect(packaging.context).toMatchObject({ mode: 'PERSO', shape: null });
    const pallet = palletViewerData('Pallet', { pattern: 'fixture', boxesPerLayer: 2, layers: 1, totalBoxes: 2, height: 154, surfaceUtilization: 0.5, volumeEfficiency: 0.2, overhang: { lengthPerSide: 0, widthPerSide: 0 }, score: 1, placements, warnings: ['Geen transportcertificaat.'] }, DEFAULT_PALLET, { kind: 'packaging', solution, products: [product], context: { mode: 'PERSO' } });
    expect(pallet.placements).toBe(placements); expect(pallet.fullSolution).toBeDefined(); expect(pallet.validation.warnings).toHaveLength(1);
    expect(pallet.products).toEqual([product]);
    expect(pallet.products[0].compressibilityX).toBe(2);
    expect(pallet.context).toMatchObject({ mode: 'PERSO' });
  });
  it('executes the serialized model without the app module graph', () => {
    const factory = new Function(`return (${createViewerModel.toString()});`)() as typeof createViewerModel;
    const offline = factory(placements, { layerGap: 30, productGap: 25, step: 2 });
    expect(offline.visible().total).toBe(2);
    expect(offline.display(placements[0]).x).toBe(35);
    expect(offline.display(placements[2]).z).toBe(40);
    expect(placements[2].z).toBe(10);
  });
});
describe('Bounded ephemeral calculation cache', () => {
  it('clones reads/writes, evicts oldest and can clear on workspace exit', () => {
    const cache = createResultCache<{ n: number }>(2), value = { n: 1 };
    cache.set('a', value); value.n = 99; expect(cache.get('a')?.n).toBe(1);
    const read = cache.get('a')!; read.n = 42; expect(cache.get('a')?.n).toBe(1);
    cache.set('b', { n: 2 }); cache.get('a'); cache.set('c', { n: 3 }); expect(cache.get('b')).toBeUndefined();
    cache.clear(); expect(cache.size()).toBe(0);
  });
  it('does not retain oversized results or exceed a byte budget', () => {
    const cache = createResultCache<string>(2, 20); cache.set('large', 'x'.repeat(100)); expect(cache.size()).toBe(0);
    cache.set('a', '123456789'); cache.set('b', '123456789'); expect(cache.size()).toBe(1);
  });
});
