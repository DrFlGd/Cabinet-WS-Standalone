import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { KernelRequest, KernelResponse } from './types';
import { buildFeatureGraph } from './featureGraph';
import { buildCabinetDocument, DEFAULT_PARAMETERS } from '../cabinetModel';

const mocks = vi.hoisted(() => ({ makeBox: vi.fn(), draw: vi.fn(), exportSTEP: vi.fn(), setOC: vi.fn() }));
vi.mock('replicad-opencascadejs', () => ({ default: async () => ({}) }));
vi.mock('replicad-opencascadejs/wasm?url', () => ({ default: 'test.wasm' }));
vi.mock('replicad', () => ({ ...mocks, makeCylinder: vi.fn() }));

let scope: { onmessage: ((event: { data: KernelRequest }) => void) | null; postMessage: ReturnType<typeof vi.fn> };
let shapes: { translate: ReturnType<typeof vi.fn>; cut: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }[];

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  shapes = [];
  const makeShape = (): (typeof shapes)[number] => {
    const shape = { translate: vi.fn(), cut: vi.fn(), delete: vi.fn() };
    shape.translate.mockReturnValue(shape);
    shape.cut.mockImplementation(() => makeShape());
    shapes.push(shape);
    return shape;
  };
  mocks.makeBox.mockImplementation(makeShape);
  mocks.draw.mockImplementation(() => {
    const sketch = {
      movePointerTo: vi.fn(),
      lineTo: vi.fn(),
      close: vi.fn(),
      sketchOnPlane: vi.fn(),
      extrude: vi.fn(),
    };
    sketch.movePointerTo.mockReturnValue(sketch);
    sketch.lineTo.mockReturnValue(sketch);
    sketch.close.mockReturnValue(sketch);
    sketch.sketchOnPlane.mockReturnValue(sketch);
    sketch.extrude.mockImplementation(makeShape);
    return sketch;
  });
  mocks.exportSTEP.mockReturnValue(new Blob(['STEP bytes']));
  scope = { onmessage: null, postMessage: vi.fn() };
  vi.stubGlobal('self', scope);
  await import('./geometry.worker');
});
afterEach(() => vi.unstubAllGlobals());

async function exportParts(options: { failPart?: boolean; failCut?: boolean; failSerialize?: boolean; missing?: boolean; invalid?: boolean } = {}) {
  const document = buildCabinetDocument(DEFAULT_PARAMETERS);
  document.parts = document.parts.filter(part => part.category === 'carcass').slice(0, 2).map(part => ({ ...part, geometry: undefined, renderFeatures: [] }));
  if (options.invalid) document.parts[0].size.x = 0;
  const graph = buildFeatureGraph(document);
  for (const part of document.parts) graph.partFeatures[part.id] = [];
  if (options.failPart) mocks.makeBox.mockImplementationOnce(() => { throw new Error('broken body'); });
  if (options.failCut) {
    graph.partFeatures[document.parts[0].id] = [{ id: 'bad-cut', partId: document.parts[0].id, kind: 'dado', label: 'Dado', parameters: {}, position: { x: 0, y: 0, z: 0 }, size: { x: 5, y: 5, z: 5 } }];
    mocks.makeBox.mockImplementationOnce(() => {
      const shape = { translate: vi.fn(), cut: vi.fn(() => { throw new Error('broken cut'); }), delete: vi.fn() };
      shape.translate.mockReturnValue(shape);
      shapes.push(shape);
      return shape;
    });
  }
  if (options.failSerialize) mocks.exportSTEP.mockImplementation(() => { throw new Error('serialization failed'); });
  scope.onmessage!({ data: { type: 'export-step', requestId: 1, payload: { document, graph, dirtyPartIds: [] }, ...(options.missing ? { bodyIds: ['missing'] } : {}) } });
  await vi.waitFor(() => expect(scope.postMessage).toHaveBeenCalled(), { timeout: 2000 });
  return scope.postMessage.mock.calls[0][0] as KernelResponse;
}

describe('STEP worker export completeness', () => {
  it('exports all requested bodies and releases their shapes', async () => {
    const response = await exportParts();
    expect(response.type).toBe('step-exported');
    expect(mocks.exportSTEP.mock.calls[0][0]).toHaveLength(2);
    expect(shapes.every(shape => shape.delete.mock.calls.length > 0)).toBe(true);
  });
  it('exports retained tab geometry together with through-cut receiver slots', async () => {
    const source = buildCabinetDocument({
      ...DEFAULT_PARAMETERS,
      joineryStyle: 'tab_slot',
      dadoFitClearance: 0.5,
    });
    source.parts = source.parts.filter(part => ['carcass:left', 'carcass:bottom'].includes(part.id));
    const graph = buildFeatureGraph(source);

    scope.onmessage!({
      data: {
        type: 'export-step',
        requestId: 7,
        payload: { document: source, graph, dirtyPartIds: [] },
      },
    });
    await vi.waitFor(() => expect(scope.postMessage).toHaveBeenCalled(), { timeout: 2000 });

    const response = scope.postMessage.mock.calls[0][0] as KernelResponse;
    expect(response.type).toBe('step-exported');
    expect(mocks.exportSTEP.mock.calls[0][0].map((entry: { name: string }) => entry.name)).toEqual([
      'carcass:left',
      'carcass:bottom',
    ]);

    const receiverFeatures = graph.partFeatures['carcass:left'].filter(feature => feature.semanticRole === 'tab-slot-receiver');
    expect(receiverFeatures).toHaveLength(2);
    expect(receiverFeatures.every(feature => feature.parameters.machiningDepth === source.parts[0].size.x)).toBe(true);

    const bottom = source.parts.find(part => part.id === 'carcass:bottom')!;
    expect(bottom.geometry?.kind).toBe('extruded-profile');
    const bottomSketch = mocks.draw.mock.results[1]?.value as { lineTo: ReturnType<typeof vi.fn> } | undefined;
    expect(bottomSketch).toBeTruthy();
    const outlineCalls = bottomSketch!.lineTo.mock.calls.map((call: [number[]]) => call[0]);
    expect(outlineCalls.some((point: number[]) => point[0] === 0)).toBe(true);
    expect(outlineCalls.some((point: number[]) => point[0] === bottom.size.x)).toBe(true);
    expect(shapes.some(shape => shape.cut.mock.calls.length > 0)).toBe(true);
  });

  it('fails the entire export when one body fails', async () => {
    const response = await exportParts({ failPart: true });
    expect(response.type).toBe('failed');
    if (response.type === 'failed') expect(response.message).toContain('broken body');
    expect(mocks.exportSTEP).not.toHaveBeenCalled();
    expect(shapes.every(shape => shape.delete.mock.calls.length > 0)).toBe(true);
  });
  it('rejects a body with an omitted machining operation', async () => {
    const response = await exportParts({ failCut: true });
    expect(response.type).toBe('failed');
    if (response.type !== 'failed') throw new Error('Expected failed STEP export');
    expect(response.diagnostics.some(item => item.code === 'feature-cut-failed')).toBe(true);
    expect(mocks.exportSTEP).not.toHaveBeenCalled();
  });
  it('rejects unavailable explicitly requested bodies', async () => {
    const response = await exportParts({ missing: true });
    expect(response.type).toBe('failed');
    if (response.type !== 'failed') throw new Error('Expected failed STEP export');
    expect(response.diagnostics.some(item => item.code === 'step-body-missing')).toBe(true);
    expect(mocks.exportSTEP).not.toHaveBeenCalled();
  });
  it('rejects invalid fabricated bodies instead of filtering them out', async () => {
    const response = await exportParts({ invalid: true });
    expect(response.type).toBe('failed');
    expect(mocks.exportSTEP).not.toHaveBeenCalled();
  });
  it('releases shapes when STEP serialization fails', async () => {
    expect((await exportParts({ failSerialize: true })).type).toBe('failed');
    expect(shapes.every(shape => shape.delete.mock.calls.length > 0)).toBe(true);
  });
});
