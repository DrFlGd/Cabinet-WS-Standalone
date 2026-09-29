import { describe, expect, it } from 'vitest';
import { computeMeasurement } from './measurements';
import type { CabinetDocument } from './types';
import type { TessellatedPart } from './kernel/types';
import { buildCabinetDocument } from './cabinetModel';
import { utilityStarter } from './utilityStarters';

const document: CabinetDocument = buildCabinetDocument(utilityStarter('default').parameters);
const partId = 'carcass:left';
const part = document.parts.find(candidate => candidate.id === partId)!;

const exact: TessellatedPart = {
  partId,
  signature: 'measurement-fixture',
  vertices: [0,0,0, 100,0,0, 100,200,0, 0,200,0],
  normals: [0,0,1, 0,0,1, 0,0,1, 0,0,1],
  triangles: [0,1,2, 0,2,3],
  faceGroups: [{ start: 0, count: 6, rawFaceId: 1, semanticId: 'face:test:front' }],
  lines: [0,0,0, 100,0,0, 0,200,0, 100,200,0],
  edgeGroups: [
    { start: 0, count: 2, rawEdgeId: 1, semanticId: 'edge:test:a' },
    { start: 2, count: 2, rawEdgeId: 2, semanticId: 'edge:test:b' },
  ],
  semanticFaces: [
    { id: 'face:test:front', partId, rawFaceId: 1, role: 'front', center: [50,100,0], normal: [0,0,1] },
    { id: 'face:test:right', partId, rawFaceId: 2, role: 'right', center: [100,100,50], normal: [1,0,0] },
  ],
  semanticEdges: [
    { id: 'edge:test:a', partId, rawEdgeId: 1, role: 'a', start: [0,0,0], end: [100,0,0] },
    { id: 'edge:test:b', partId, rawEdgeId: 2, role: 'b', start: [0,200,0], end: [100,200,0] },
  ],
};

describe('semantic measurements', () => {
  it('measures exact planar face extents and area from tessellation groups', () => {
    const result = computeMeasurement(document, [exact], 'face', [
      { partId, kind: 'face', semanticId: 'face:test:front' },
    ]);
    expect(result?.value).toBeCloseTo(20_000);
    expect(result?.detail).toContain('200.00 × 100.00');
  });

  it('measures distance between semantic reference centers', () => {
    const result = computeMeasurement(document, [exact], 'distance', [
      { partId, kind: 'edge', semanticId: 'edge:test:a' },
      { partId, kind: 'edge', semanticId: 'edge:test:b' },
    ]);
    expect(result?.value).toBeCloseTo(200);
  });

  it('measures face-normal angle', () => {
    const result = computeMeasurement(document, [exact], 'angle', [
      { partId, kind: 'face', semanticId: 'face:test:front' },
      { partId, kind: 'face', semanticId: 'face:test:right' },
    ]);
    expect(result?.value).toBeCloseTo(90);
  });
});
