import { describe, expect, it } from 'vitest';
import { computeMeasurement } from './measurements';
import type { CabinetDocument } from './types';
import type { TessellatedPart } from './kernel/types';
import { buildCabinetDocument } from './cabinetModel';
import { utilityStarter } from './utilityStarters';

const document: CabinetDocument = buildCabinetDocument(utilityStarter('default').parameters);
const partId = 'carcass:left';

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

function faceFixture(
  vertices: number[],
  triangles: number[],
  normal: [number, number, number] = [0, 0, 1],
): TessellatedPart {
  return {
    ...exact,
    signature: 'face-fixture',
    vertices,
    normals: Array.from({ length: vertices.length / 3 }, () => normal).flat(),
    triangles,
    faceGroups: [{ start: 0, count: triangles.length, rawFaceId: 1, semanticId: 'face:test:front' }],
    semanticFaces: [
      { id: 'face:test:front', partId, rawFaceId: 1, role: 'front', center: [0,0,0], normal },
      ...exact.semanticFaces.slice(1),
    ],
  };
}

describe('semantic measurements', () => {
  it('measures rectangular planar face sides in the face plane rather than from a world bounding box', () => {
    const c = Math.SQRT1_2;
    const rotated = faceFixture([
      0, 0, 0,
      100 * c, 100 * c, 0,
      100 * c - 200 * c, 100 * c + 200 * c, 0,
      -200 * c, 200 * c, 0,
    ], [0,1,2, 0,2,3]);

    const result = computeMeasurement(document, [rotated], 'face', [
      { partId, kind: 'face', semanticId: 'face:test:front' },
    ]);

    expect(result?.primary.map(metric => metric.label)).toEqual(['Long side', 'Short side']);
    expect(result?.primary[0].value).toBeCloseTo(200, 5);
    expect(result?.primary[1].value).toBeCloseTo(100, 5);
    expect(result?.secondary?.[0]).toMatchObject({ label: 'Area', unit: 'mm2' });
    expect(result?.secondary?.[0].value).toBeCloseTo(20_000);
  });

  it('uses cabinet axes for applicable planar face width and height labels', () => {
    const frontFace = faceFixture([
      0,0,0,
      100,0,0,
      100,0,200,
      0,0,200,
    ], [0,1,2, 0,2,3], [0,1,0]);

    const result = computeMeasurement(document, [frontFace], 'face', [
      { partId, kind: 'face', semanticId: 'face:test:front' },
    ]);

    expect(result?.primary.map(metric => metric.label)).toEqual(['Width', 'Height']);
    expect(result?.primary[0].value).toBeCloseTo(100);
    expect(result?.primary[1].value).toBeCloseTo(200);
  });

  it('uses an intrinsic span for non-rectangular planar faces and keeps area secondary', () => {
    const triangle = faceFixture([
      0,0,0,
      80,0,0,
      20,60,0,
    ], [0,1,2]);

    const result = computeMeasurement(document, [triangle], 'face', [
      { partId, kind: 'face', semanticId: 'face:test:front' },
    ]);

    expect(result?.primary[0]).toMatchObject({ label: 'Maximum span', unit: 'mm' });
    expect(result?.primary[0].value).toBeCloseTo(84.85, 2);
    expect(result?.secondary?.[0]).toMatchObject({ label: 'Area', unit: 'mm2' });
  });

  it('labels non-planar face span as approximate instead of presenting box dimensions as exact', () => {
    const curvedSample = faceFixture([
      0,0,0,
      100,0,0,
      100,100,20,
      0,100,0,
    ], [0,1,2, 0,2,3]);

    const result = computeMeasurement(document, [curvedSample], 'face', [
      { partId, kind: 'face', semanticId: 'face:test:front' },
    ]);

    expect(result?.title).toBe('Curved face');
    expect(result?.primary[0]).toMatchObject({ label: 'Approx. span', unit: 'mm', approximate: true });
    expect(result?.secondary?.[0]).toMatchObject({ label: 'Surface area', unit: 'mm2' });
  });

  it('measures distance between selected reference centers', () => {
    const result = computeMeasurement(document, [exact], 'distance', [
      { partId, kind: 'edge', semanticId: 'edge:test:a' },
      { partId, kind: 'edge', semanticId: 'edge:test:b' },
    ]);
    expect(result?.primary[0].value).toBeCloseTo(200);
  });

  it('measures face-normal angle', () => {
    const result = computeMeasurement(document, [exact], 'angle', [
      { partId, kind: 'face', semanticId: 'face:test:front' },
      { partId, kind: 'face', semanticId: 'face:test:right' },
    ]);
    expect(result?.primary[0].value).toBeCloseTo(90);
  });
});
