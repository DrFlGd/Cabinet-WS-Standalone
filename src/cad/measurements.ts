import type { CabinetDocument } from './types';
import type { KernelSelection, TessellatedPart } from './kernel/types';

export type MeasurementMode = 'off' | 'distance' | 'face' | 'angle';

export type MeasurementResult = {
  title: string;
  value: number;
  unit: 'mm' | 'mm2' | 'deg';
  detail: string;
};

export function requiredMeasurementSelections(mode: MeasurementMode) {
  if (mode === 'face') return 1;
  if (mode === 'distance' || mode === 'angle') return 2;
  return 0;
}

export function computeMeasurement(
  document: CabinetDocument,
  kernelParts: TessellatedPart[],
  mode: MeasurementMode,
  selections: KernelSelection[],
): MeasurementResult | null {
  if (mode === 'off') return null;

  if (mode === 'distance') {
    if (selections.length < 2) return null;
    const a = selectionPoint(document, kernelParts, selections[0]);
    const b = selectionPoint(document, kernelParts, selections[1]);
    if (!a || !b) return null;
    const value = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    return {
      title: 'Semantic distance',
      value,
      unit: 'mm',
      detail: `${selections[0].semanticId} → ${selections[1].semanticId}`,
    };
  }

  if (mode === 'angle') {
    if (selections.length < 2 || selections[0].kind !== 'face' || selections[1].kind !== 'face') return null;
    const a = semanticFace(kernelParts, selections[0]);
    const b = semanticFace(kernelParts, selections[1]);
    if (!a || !b) return null;
    const dot = Math.max(-1, Math.min(1, a.normal[0] * b.normal[0] + a.normal[1] * b.normal[1] + a.normal[2] * b.normal[2]));
    const value = Math.acos(Math.abs(dot)) * 180 / Math.PI;
    return {
      title: 'Face angle',
      value,
      unit: 'deg',
      detail: `${selections[0].semanticId} ↔ ${selections[1].semanticId}`,
    };
  }

  const selection = selections[0];
  if (!selection || selection.kind !== 'face') return null;
  const exact = kernelParts.find(part => part.partId === selection.partId);
  const part = document.parts.find(candidate => candidate.id === selection.partId);
  const face = exact?.semanticFaces.find(candidate => candidate.id === selection.semanticId);
  const group = exact?.faceGroups.find(candidate => candidate.semanticId === selection.semanticId);
  if (!exact || !part || !face || !group) return null;

  const indices = exact.triangles.slice(group.start, group.start + group.count);
  if (!indices.length) return null;
  const points = indices.map(index => [
    exact.vertices[index * 3] + part.position.x,
    exact.vertices[index * 3 + 1] + part.position.y,
    exact.vertices[index * 3 + 2] + part.position.z,
  ] as [number, number, number]);
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const point of points) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], point[axis]);
      max[axis] = Math.max(max[axis], point[axis]);
    }
  }
  const spans = max.map((value, axis) => Math.max(0, value - min[axis]));
  const dominant = face.normal
    .map((value, axis) => ({ axis, value: Math.abs(value) }))
    .sort((a, b) => b.value - a.value)[0].axis;
  const planar = spans.filter((_, axis) => axis !== dominant).sort((a, b) => b - a);
  const area = planar[0] * planar[1];

  return {
    title: 'Face size',
    value: area,
    unit: 'mm2',
    detail: `${planar[0].toFixed(2)} × ${planar[1].toFixed(2)} mm · ${selection.semanticId}`,
  };
}

function selectionPoint(
  document: CabinetDocument,
  kernelParts: TessellatedPart[],
  selection: KernelSelection,
): [number, number, number] | null {
  const part = document.parts.find(candidate => candidate.id === selection.partId);
  const exact = kernelParts.find(candidate => candidate.partId === selection.partId);
  if (!part || !exact) return null;

  if (selection.kind === 'face') {
    const face = exact.semanticFaces.find(candidate => candidate.id === selection.semanticId);
    return face
      ? [face.center[0] + part.position.x, face.center[1] + part.position.y, face.center[2] + part.position.z]
      : null;
  }

  const edge = exact.semanticEdges.find(candidate => candidate.id === selection.semanticId);
  return edge
    ? [
        (edge.start[0] + edge.end[0]) / 2 + part.position.x,
        (edge.start[1] + edge.end[1]) / 2 + part.position.y,
        (edge.start[2] + edge.end[2]) / 2 + part.position.z,
      ]
    : null;
}

function semanticFace(kernelParts: TessellatedPart[], selection: KernelSelection) {
  return kernelParts
    .find(part => part.partId === selection.partId)
    ?.semanticFaces.find(face => face.id === selection.semanticId) ?? null;
}
