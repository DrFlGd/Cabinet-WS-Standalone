import type { CabinetDocument } from './types';
import type { KernelSelection, TessellatedPart } from './kernel/types';

export type MeasurementMode = 'off' | 'distance' | 'face' | 'angle';
export type MeasurementUnit = 'mm' | 'mm2' | 'deg';

export type MeasurementMetric = {
  label: string;
  value: number;
  unit: MeasurementUnit;
  approximate?: boolean;
};

export type MeasurementResult = {
  title: string;
  primary: MeasurementMetric[];
  secondary?: MeasurementMetric[];
  detail?: string;
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
    const value = distance3(a, b);
    return {
      title: 'Distance',
      primary: [{ label: 'Distance', value, unit: 'mm' }],
      detail: selectionDetail(document, selections[0], selections[1]),
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
      primary: [{ label: 'Angle', value, unit: 'deg' }],
      detail: selectionDetail(document, selections[0], selections[1]),
    };
  }

  const selection = selections[0];
  if (!selection || selection.kind !== 'face') return null;
  return faceMeasurement(document, kernelParts, selection);
}

function faceMeasurement(
  document: CabinetDocument,
  kernelParts: TessellatedPart[],
  selection: KernelSelection,
): MeasurementResult | null {
  const exact = kernelParts.find(candidate => candidate.partId === selection.partId);
  const part = document.parts.find(candidate => candidate.id === selection.partId);
  const face = exact?.semanticFaces.find(candidate => candidate.id === selection.semanticId);
  const group = exact?.faceGroups.find(candidate => candidate.semanticId === selection.semanticId);
  if (!exact || !part || !face || !group) return null;

  const indices = exact.triangles.slice(group.start, group.start + group.count);
  if (indices.length < 3) return null;
  const points = uniquePoints(indices.map(index => [
    exact.vertices[index * 3],
    exact.vertices[index * 3 + 1],
    exact.vertices[index * 3 + 2],
  ] as Point3));
  if (points.length < 3) return null;

  const area = triangleArea(exact.vertices, indices);
  const faceLabel = friendlyFaceLabel(face.role);
  const detail = faceLabel ? `${part.name} · ${faceLabel}` : part.name;
  const normal = normalize3(face.normal);
  const planar = normal !== null && isPlanar(points, normal);

  if (planar && normal) {
    const projection = projectToFacePlane(points, normal);
    const projected = convexHull(projection.points);
    const rectangle = rectangularFaceSides(projected);
    if (rectangle) {
      return {
        title: 'Face dimensions',
        primary: rectangularMetrics(rectangle, projection.u, projection.v),
        secondary: [{ label: 'Area', value: area, unit: 'mm2' }],
        detail,
      };
    }

    const span = maximumDistance2(projected);
    return {
      title: 'Planar face',
      primary: span > 0 ? [{ label: 'Maximum span', value: span, unit: 'mm' }] : [],
      secondary: [{ label: 'Area', value: area, unit: 'mm2' }],
      detail,
    };
  }

  const span = approximateMaximumDistance3(points);
  return {
    title: 'Curved face',
    primary: span > 0 ? [{ label: 'Approx. span', value: span, unit: 'mm', approximate: true }] : [],
    secondary: [{ label: 'Surface area', value: area, unit: 'mm2' }],
    detail,
  };
}

type Point2 = [number, number];
type Point3 = [number, number, number];

function selectionPoint(
  document: CabinetDocument,
  kernelParts: TessellatedPart[],
  selection: KernelSelection,
): Point3 | null {
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

function selectionDetail(
  document: CabinetDocument,
  a: KernelSelection,
  b: KernelSelection,
) {
  const first = document.parts.find(part => part.id === a.partId)?.name ?? 'First selection';
  const second = document.parts.find(part => part.id === b.partId)?.name ?? 'Second selection';
  return first === second ? first : `${first} → ${second}`;
}

function triangleArea(vertices: number[], indices: number[]) {
  let area = 0;
  for (let index = 0; index + 2 < indices.length; index += 3) {
    const a = pointAt(vertices, indices[index]);
    const b = pointAt(vertices, indices[index + 1]);
    const c = pointAt(vertices, indices[index + 2]);
    const ab = subtract3(b, a);
    const ac = subtract3(c, a);
    const cross: Point3 = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ];
    area += Math.hypot(cross[0], cross[1], cross[2]) / 2;
  }
  return area;
}

function pointAt(vertices: number[], index: number): Point3 {
  return [vertices[index * 3], vertices[index * 3 + 1], vertices[index * 3 + 2]];
}

function uniquePoints(points: Point3[]) {
  const seen = new Set<string>();
  return points.filter(point => {
    const key = point.map(value => Math.round(value * 1000)).join(':');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalize3(vector: Point3): Point3 | null {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  if (length < 1e-9) return null;
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function isPlanar(points: Point3[], normal: Point3) {
  const origin = points[0];
  const scale = Math.max(1, approximateMaximumDistance3(points));
  const tolerance = Math.max(0.03, scale * 0.0001);
  return points.every(point => Math.abs(dot3(subtract3(point, origin), normal)) <= tolerance);
}

function projectToFacePlane(points: Point3[], normal: Point3) {
  const reference: Point3 = Math.abs(normal[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0];
  const u = normalize3(cross3(normal, reference)) ?? [0, 0, 1];
  const v = cross3(normal, u);
  const origin = points[0];
  return {
    u,
    v,
    points: points.map(point => {
      const delta = subtract3(point, origin);
      return [dot3(delta, u), dot3(delta, v)] as Point2;
    }),
  };
}

function convexHull(points: Point2[]) {
  const unique = [...new Map(points.map(point => [
    `${Math.round(point[0] * 1000)}:${Math.round(point[1] * 1000)}`,
    point,
  ] as const)).values()].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (unique.length <= 2) return unique;

  const cross = (o: Point2, a: Point2, b: Point2) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Point2[] = [];
  for (const point of unique) {
    while (lower.length >= 2 && cross(lower.at(-2)!, lower.at(-1)!, point) <= 1e-7) lower.pop();
    lower.push(point);
  }
  const upper: Point2[] = [];
  for (const point of [...unique].reverse()) {
    while (upper.length >= 2 && cross(upper.at(-2)!, upper.at(-1)!, point) <= 1e-7) upper.pop();
    upper.push(point);
  }
  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

function rectangularFaceSides(hull: Point2[]) {
  if (hull.length !== 4) return null;
  const vectors = hull.map((point, index) => subtract2(hull[(index + 1) % 4], point));
  const lengths = vectors.map(vector => Math.hypot(vector[0], vector[1]));
  if (lengths.some(length => length < 1e-6)) return null;

  const tolerance = (a: number, b: number) => Math.abs(a - b) <= Math.max(0.05, Math.max(a, b) * 0.002);
  if (!tolerance(lengths[0], lengths[2]) || !tolerance(lengths[1], lengths[3])) return null;

  for (let index = 0; index < 4; index += 1) {
    const a = vectors[index];
    const b = vectors[(index + 1) % 4];
    const cosine = Math.abs((a[0] * b[0] + a[1] * b[1]) / (lengths[index] * lengths[(index + 1) % 4]));
    if (cosine > 0.002) return null;
  }

  return [
    { length: lengths[0], direction: normalize2(vectors[0]) },
    { length: lengths[1], direction: normalize2(vectors[1]) },
  ] as const;
}

function rectangularMetrics(
  sides: readonly [
    { length: number; direction: Point2 },
    { length: number; direction: Point2 },
  ],
  u: Point3,
  v: Point3,
): MeasurementMetric[] {
  const axisLabels = sides.map(side => {
    const worldDirection: Point3 = [
      u[0] * side.direction[0] + v[0] * side.direction[1],
      u[1] * side.direction[0] + v[1] * side.direction[1],
      u[2] * side.direction[0] + v[2] * side.direction[1],
    ];
    const absolute = worldDirection.map(Math.abs);
    const dominant = absolute.indexOf(Math.max(...absolute));
    if (absolute[dominant] < 0.999) return null;
    return dominant === 0 ? 'Width' : dominant === 1 ? 'Depth' : 'Height';
  });

  if (axisLabels[0] && axisLabels[1] && axisLabels[0] !== axisLabels[1]) {
    const metrics = sides.map((side, index) => ({
      label: axisLabels[index]!,
      value: side.length,
      unit: 'mm' as const,
    }));
    const order: Record<string, number> = { Width: 0, Height: 1, Depth: 2 };
    return metrics.sort((a, b) => order[a.label] - order[b.label]);
  }

  const ordered = [...sides].sort((a, b) => b.length - a.length);
  return [
    { label: 'Long side', value: ordered[0].length, unit: 'mm' },
    { label: 'Short side', value: ordered[1].length, unit: 'mm' },
  ];
}

function maximumDistance2(points: Point2[]) {
  let maximum = 0;
  for (let a = 0; a < points.length; a += 1) {
    for (let b = a + 1; b < points.length; b += 1) {
      maximum = Math.max(maximum, Math.hypot(points[b][0] - points[a][0], points[b][1] - points[a][1]));
    }
  }
  return maximum;
}

function approximateMaximumDistance3(points: Point3[]) {
  if (points.length < 2) return 0;
  if (points.length <= 300) {
    let maximum = 0;
    for (let a = 0; a < points.length; a += 1) {
      for (let b = a + 1; b < points.length; b += 1) {
        maximum = Math.max(maximum, distance3(points[a], points[b]));
      }
    }
    return maximum;
  }

  const farthestFrom = (origin: Point3) => points.reduce(
    (best, point) => distance3(origin, point) > distance3(origin, best) ? point : best,
    points[0],
  );
  const a = farthestFrom(points[0]);
  const b = farthestFrom(a);
  return distance3(a, b);
}

function normalize2(vector: Point2): Point2 {
  const length = Math.hypot(vector[0], vector[1]);
  return length > 0 ? [vector[0] / length, vector[1] / length] : [0, 0];
}

function subtract2(a: Point2, b: Point2): Point2 {
  return [a[0] - b[0], a[1] - b[1]];
}

function subtract3(a: Point3, b: Point3): Point3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross3(a: Point3, b: Point3): Point3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot3(a: Point3, b: Point3) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function distance3(a: Point3, b: Point3) {
  return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
}

function friendlyFaceLabel(role: string) {
  const labels: Record<string, string> = {
    front: 'Front face',
    back: 'Back face',
    top: 'Top face',
    bottom: 'Bottom face',
    left: 'Left face',
    right: 'Right face',
    inside: 'Inside face',
    outside: 'Outside face',
  };
  return labels[role] ?? null;
}
