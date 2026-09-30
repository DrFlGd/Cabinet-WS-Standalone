import type { DesignHealthReport } from './designHealth';
import { buildFeatureGraph } from './kernel/featureGraph';
import type { CadFeature } from './kernel/types';
import type { ShopDocumentation, BomRow } from './shopDocs';
import type { CabinetDocument, CadPart } from './types';

export type ManufacturingOperationKind =
  | 'CUT'
  | 'POCKET'
  | 'DADO_GROOVE'
  | 'DRILL'
  | 'ENGRAVE'
  | 'EDGE';

export type Point2 = { x: number; y: number };

export type ManufacturingGeometry =
  | { type: 'polyline'; points: Point2[]; closed: boolean }
  | { type: 'rect'; x: number; y: number; width: number; height: number }
  | { type: 'circle'; cx: number; cy: number; radius: number }
  | { type: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { type: 'text'; x: number; y: number; height: number; text: string };

export type ManufacturingPlane = {
  uAxis: 'x' | 'y' | 'z';
  vAxis: 'x' | 'y' | 'z';
  thicknessAxis: 'x' | 'y' | 'z';
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  origin: 'part-local-min';
};

export type MachiningFace = {
  axis: 'x' | 'y' | 'z';
  side: 'min' | 'max' | 'through' | 'internal' | 'edge';
  semanticId: string;
};

export type ManufacturingOperation = {
  id: string;
  featureId?: string;
  partId: string;
  partNumber: string;
  kind: ManufacturingOperationKind;
  label: string;
  sourceKind: string;
  face: MachiningFace;
  depthMm: number | null;
  through: boolean;
  geometry: ManufacturingGeometry[];
  notes: string[];
};

export type ManufacturingPart = {
  partId: string;
  partNumber: string;
  name: string;
  material: string;
  plane: ManufacturingPlane;
  operations: ManufacturingOperation[];
  operationCounts: Record<ManufacturingOperationKind, number>;
  dxf: string;
  svg: string;
  drillingCsv: string;
  metadata: {
    units: 'mm';
    scale: 1;
    coordinateSystem: 'part-local';
    origin: 'part-local-min';
    uAxis: 'x' | 'y' | 'z';
    vAxis: 'x' | 'y' | 'z';
    thicknessAxis: 'x' | 'y' | 'z';
  };
};

export type ManufacturingIssue = {
  severity: 'error' | 'warning';
  title: string;
  message: string;
  partIds: string[];
  featureIds: string[];
};

export type ManufacturingModel = {
  version: 1;
  documentId: string;
  documentName: string;
  units: 'mm';
  scale: 1;
  signature: string;
  readiness: DesignHealthReport['readiness'];
  designHealthStatus: DesignHealthReport['status'];
  issues: ManufacturingIssue[];
  parts: ManufacturingPart[];
  operationCounts: Record<ManufacturingOperationKind, number>;
};

export type ManufacturingPackageEntry = {
  path: string;
  data: string;
};

const allKinds: ManufacturingOperationKind[] = ['CUT', 'POCKET', 'DADO_GROOVE', 'DRILL', 'ENGRAVE', 'EDGE'];
const axes = ['x', 'y', 'z'] as const;

export function buildManufacturingModel(
  document: CabinetDocument,
  docs: ShopDocumentation,
  health: DesignHealthReport,
): ManufacturingModel {
  const graph = buildFeatureGraph(document);
  const bomById = new Map(docs.bom.map(row => [row.partId, row]));
  const parts = document.parts
    .filter(part => part.category !== 'hardware')
    .flatMap(part => {
      const row = bomById.get(part.id);
      if (!row) return [];
      return [buildManufacturingPart(part, row, graph.partFeatures[part.id] ?? [])];
    })
    .sort((a, b) => a.partNumber.localeCompare(b.partNumber, undefined, { numeric: true }));

  const operationCounts = emptyCounts();
  for (const part of parts) {
    for (const kind of allKinds) operationCounts[kind] += part.operationCounts[kind];
  }

  const issues: ManufacturingIssue[] = health.checks
    .filter(check => check.severity === 'error' || check.severity === 'warning')
    .map(check => ({
      severity: check.severity as 'error' | 'warning',
      title: check.title,
      message: check.message,
      partIds: [...(check.partIds ?? [])],
      featureIds: [...(check.featureIds ?? [])],
    }));

  const signature = fnv1a(JSON.stringify({
    documentId: document.id,
    readiness: health.readiness,
    parts: parts.map(part => ({
      id: part.partId,
      plane: part.plane,
      operations: part.operations.map(operation => ({
        id: operation.id,
        kind: operation.kind,
        face: operation.face,
        depthMm: operation.depthMm,
        geometry: operation.geometry,
      })),
    })),
  }));

  return {
    version: 1,
    documentId: document.id,
    documentName: document.name,
    units: 'mm',
    scale: 1,
    signature,
    readiness: health.readiness,
    designHealthStatus: health.status,
    issues,
    parts,
    operationCounts,
  };
}

function buildManufacturingPart(part: CadPart, row: BomRow, features: CadFeature[]): ManufacturingPart {
  const plane = planeForPart(part, row);
  const operations: ManufacturingOperation[] = [];

  operations.push(cutProfileOperation(part, row, plane));

  for (const feature of features) {
    const operation = operationFromFeature(part, row, plane, feature);
    if (operation) operations.push(operation);
  }

  const engraving = registrationEngraving(part, row, plane);
  operations.push(engraving);

  for (const edge of row.edgeBanding) {
    operations.push(edgeOperation(part, row, plane, edge));
  }

  const operationCounts = emptyCounts();
  for (const operation of operations) operationCounts[operation.kind] += 1;

  const base: Omit<ManufacturingPart, 'dxf' | 'svg' | 'drillingCsv'> = {
    partId: part.id,
    partNumber: row.partNumber,
    name: part.name,
    material: part.material,
    plane,
    operations,
    operationCounts,
    metadata: {
      units: 'mm',
      scale: 1,
      coordinateSystem: 'part-local',
      origin: 'part-local-min',
      uAxis: plane.uAxis,
      vAxis: plane.vAxis,
      thicknessAxis: plane.thicknessAxis,
    },
  };

  return {
    ...base,
    dxf: dxfForOperations(base as ManufacturingPart, operations),
    svg: svgForOperations(base as ManufacturingPart, operations),
    drillingCsv: drillingMapCsv(base as ManufacturingPart),
  };
}

function planeForPart(part: CadPart, row: BomRow): ManufacturingPlane {
  let uAxis: 'x' | 'y' | 'z';
  let vAxis: 'x' | 'y' | 'z';

  if (part.geometry?.axis === 'x') {
    uAxis = 'y';
    vAxis = 'z';
  } else if (part.geometry?.axis === 'z') {
    uAxis = 'x';
    vAxis = 'y';
  } else {
    const remaining = axes.filter(axis => axis !== row.thicknessAxis);
    uAxis = remaining[0];
    vAxis = remaining[1];
  }

  return {
    uAxis,
    vAxis,
    thicknessAxis: row.thicknessAxis,
    widthMm: part.size[uAxis],
    heightMm: part.size[vAxis],
    thicknessMm: part.size[row.thicknessAxis],
    origin: 'part-local-min',
  };
}

function cutProfileOperation(part: CadPart, row: BomRow, plane: ManufacturingPlane): ManufacturingOperation {
  const points = part.geometry?.outline?.length
    ? part.geometry.outline.map(point => ({ x: point.u, y: point.v }))
    : [
        { x: 0, y: 0 },
        { x: plane.widthMm, y: 0 },
        { x: plane.widthMm, y: plane.heightMm },
        { x: 0, y: plane.heightMm },
      ];

  return {
    id: 'manufacturing:' + part.id + ':cut-profile',
    partId: part.id,
    partNumber: row.partNumber,
    kind: 'CUT',
    label: part.geometry?.outline?.length && part.geometry.outline.length > 4 ? 'Finished profile' : 'Panel perimeter',
    sourceKind: 'panel-profile',
    face: throughFace(part, plane),
    depthMm: plane.thicknessMm,
    through: true,
    geometry: [{ type: 'polyline', points, closed: true }],
    notes: ['True-scale finished outer profile in part-local millimeter coordinates.'],
  };
}

function operationFromFeature(
  part: CadPart,
  row: BomRow,
  plane: ManufacturingPlane,
  feature: CadFeature,
): ManufacturingOperation | null {
  if (feature.kind === 'panel-blank' || feature.kind === 'assembly-transform' || feature.kind === 'hardware-reference') return null;
  if (feature.semanticRole === 'toe-kick') return null;

  if (feature.kind === 'hole-pattern') {
    const centersU = numberArray(feature.parameters.centersU);
    const centersV = numberArray(feature.parameters.centersV);
    const radii = numberArray(feature.parameters.radii);
    const geometry: ManufacturingGeometry[] = [];
    const count = Math.min(centersU.length, centersV.length);
    for (let index = 0; index < count; index += 1) {
      geometry.push({
        type: 'circle',
        cx: centersU[index],
        cy: centersV[index],
        radius: radii[index] ?? radii[0] ?? 1.5,
      });
    }
    return {
      id: 'manufacturing:' + feature.id,
      featureId: feature.id,
      partId: part.id,
      partNumber: row.partNumber,
      kind: 'DRILL',
      label: feature.label,
      sourceKind: feature.kind,
      face: featureFace(part, plane, feature, true),
      depthMm: plane.thicknessMm,
      through: true,
      geometry,
      notes: ['Hole pattern centers and diameters are exported in the part machining plane.'],
    };
  }

  if (feature.kind === 'hole') {
    const geometry = holeGeometry(plane, feature);
    const depth = featureDepth(plane, feature);
    const through = isThrough(plane, feature, depth);
    return {
      id: 'manufacturing:' + feature.id,
      featureId: feature.id,
      partId: part.id,
      partNumber: row.partNumber,
      kind: 'DRILL',
      label: feature.label,
      sourceKind: feature.kind,
      face: featureFace(part, plane, feature, through),
      depthMm: depth,
      through,
      geometry,
      notes: [],
    };
  }

  if (feature.kind === 'dado' || feature.kind === 'rabbet' || feature.kind === 'groove'
      || (feature.kind === 'pocket' && feature.semanticRole === 'slot')) {
    const depth = featureDepth(plane, feature);
    const through = isThrough(plane, feature, depth);
    return {
      id: 'manufacturing:' + feature.id,
      featureId: feature.id,
      partId: part.id,
      partNumber: row.partNumber,
      kind: 'DADO_GROOVE',
      label: feature.label,
      sourceKind: feature.kind,
      face: featureFace(part, plane, feature, through),
      depthMm: depth,
      through,
      geometry: featureGeometry(plane, feature),
      notes: feature.kind === 'rabbet' ? ['Rabbet is exported on the registered machining face.'] : [],
    };
  }

  if (feature.kind === 'pocket') {
    const throughCutout = feature.semanticRole === 'through-cutout' || feature.semanticRole === 'tab-slot-receiver';
    const depth = throughCutout ? plane.thicknessMm : featureDepth(plane, feature);
    return {
      id: 'manufacturing:' + feature.id,
      featureId: feature.id,
      partId: part.id,
      partNumber: row.partNumber,
      kind: throughCutout ? 'CUT' : 'POCKET',
      label: feature.label,
      sourceKind: feature.kind,
      face: featureFace(part, plane, feature, throughCutout),
      depthMm: depth,
      through: throughCutout,
      geometry: featureGeometry(plane, feature),
      notes: throughCutout ? ['Registered through-cutout included on the CUT layer.'] : [],
    };
  }

  if (feature.kind === 'edge-treatment') {
    return {
      id: 'manufacturing:' + feature.id,
      featureId: feature.id,
      partId: part.id,
      partNumber: row.partNumber,
      kind: 'EDGE',
      label: feature.label,
      sourceKind: feature.kind,
      face: { axis: plane.thicknessAxis, side: 'edge', semanticId: feature.id },
      depthMm: null,
      through: false,
      geometry: featureGeometry(plane, feature),
      notes: [],
    };
  }

  if (feature.kind === 'chamfer') {
    return {
      id: 'manufacturing:' + feature.id,
      featureId: feature.id,
      partId: part.id,
      partNumber: row.partNumber,
      kind: 'EDGE',
      label: feature.label,
      sourceKind: feature.kind,
      face: { axis: plane.thicknessAxis, side: 'edge', semanticId: feature.id },
      depthMm: null,
      through: false,
      geometry: featureGeometry(plane, feature),
      notes: ['Chamfer is represented as edge-treatment intent; CAM geometry is not synthesized.'],
    };
  }

  return null;
}

function registrationEngraving(part: CadPart, row: BomRow, plane: ManufacturingPlane): ManufacturingOperation {
  const height = Math.max(3, Math.min(8, Math.min(plane.widthMm, plane.heightMm) * 0.04));
  return {
    id: 'manufacturing:' + part.id + ':engrave-label',
    partId: part.id,
    partNumber: row.partNumber,
    kind: 'ENGRAVE',
    label: 'Part identification',
    sourceKind: 'semantic-label',
    face: { axis: plane.thicknessAxis, side: 'min', semanticId: 'face:' + part.id + ':' + plane.thicknessAxis + '-min' },
    depthMm: null,
    through: false,
    geometry: [{
      type: 'text',
      x: Math.max(5, plane.widthMm * 0.04),
      y: Math.max(5, plane.heightMm * 0.05),
      height,
      text: row.partNumber,
    }],
    notes: ['Identification engraving is registration/label intent, not a CNC toolpath.'],
  };
}

function edgeOperation(part: CadPart, row: BomRow, plane: ManufacturingPlane, edge: string): ManufacturingOperation {
  return {
    id: 'manufacturing:' + part.id + ':edge:' + edge,
    partId: part.id,
    partNumber: row.partNumber,
    kind: 'EDGE',
    label: 'Edge treatment · ' + edge,
    sourceKind: 'edge-banding-requirement',
    face: { axis: plane.thicknessAxis, side: 'edge', semanticId: 'edge:' + part.id + ':' + edge },
    depthMm: null,
    through: false,
    geometry: edgeGeometry(plane, edge),
    notes: ['Edge requirement comes from semantic exposed-edge rules; material/thickness is not yet specified.'],
  };
}

function featureGeometry(plane: ManufacturingPlane, feature: CadFeature): ManufacturingGeometry[] {
  if (!feature.position || !feature.size) {
    const width = numberValue(feature.parameters.width);
    const height = numberValue(feature.parameters.height);
    if (feature.position && width !== null && height !== null) {
      const p = projectPoint(plane, feature.position);
      return [{ type: 'rect', x: p.x, y: p.y, width, height }];
    }
    return [];
  }

  const p = projectPoint(plane, feature.position);
  return [{
    type: 'rect',
    x: p.x,
    y: p.y,
    width: feature.size[plane.uAxis],
    height: feature.size[plane.vAxis],
  }];
}

function holeGeometry(plane: ManufacturingPlane, feature: CadFeature): ManufacturingGeometry[] {
  if (!feature.position) return [];
  const p = projectPoint(plane, feature.position);
  const radius = numberValue(feature.parameters.radius);
  if (radius !== null) return [{ type: 'circle', cx: p.x, cy: p.y, radius }];

  if (feature.size) {
    const width = feature.size[plane.uAxis];
    const height = feature.size[plane.vAxis];
    const diameter = Math.max(0.01, Math.min(width, height));
    return [{ type: 'circle', cx: p.x + width / 2, cy: p.y + height / 2, radius: diameter / 2 }];
  }
  return [];
}

function edgeGeometry(plane: ManufacturingPlane, edge: string): ManufacturingGeometry[] {
  if (edge === 'perimeter') {
    return [
      { type: 'line', x1: 0, y1: 0, x2: plane.widthMm, y2: 0 },
      { type: 'line', x1: plane.widthMm, y1: 0, x2: plane.widthMm, y2: plane.heightMm },
      { type: 'line', x1: plane.widthMm, y1: plane.heightMm, x2: 0, y2: plane.heightMm },
      { type: 'line', x1: 0, y1: plane.heightMm, x2: 0, y2: 0 },
    ];
  }
  if (edge === 'front') return boundaryForGlobalAxis(plane, 'y', 'min');
  if (edge === 'left') return boundaryForGlobalAxis(plane, 'x', 'min');
  if (edge === 'right') return boundaryForGlobalAxis(plane, 'x', 'max');
  return [];
}

function boundaryForGlobalAxis(
  plane: ManufacturingPlane,
  axis: 'x' | 'y' | 'z',
  side: 'min' | 'max',
): ManufacturingGeometry[] {
  if (axis === plane.uAxis) {
    const x = side === 'min' ? 0 : plane.widthMm;
    return [{ type: 'line', x1: x, y1: 0, x2: x, y2: plane.heightMm }];
  }
  if (axis === plane.vAxis) {
    const y = side === 'min' ? 0 : plane.heightMm;
    return [{ type: 'line', x1: 0, y1: y, x2: plane.widthMm, y2: y }];
  }
  return [];
}

function projectPoint(plane: ManufacturingPlane, point: { x: number; y: number; z: number }): Point2 {
  return { x: point[plane.uAxis], y: point[plane.vAxis] };
}

function featureDepth(plane: ManufacturingPlane, feature: CadFeature) {
  if (feature.size) return Math.min(plane.thicknessMm, Math.abs(feature.size[plane.thicknessAxis]));
  const explicit = numberValue(feature.parameters.depth);
  return explicit === null ? null : Math.min(plane.thicknessMm, Math.abs(explicit));
}

function isThrough(plane: ManufacturingPlane, feature: CadFeature, depth: number | null) {
  if (feature.semanticRole === 'through-cutout' || feature.semanticRole === 'tab-slot-receiver') return true;
  return depth !== null && depth >= plane.thicknessMm - 0.01;
}

function featureFace(
  part: CadPart,
  plane: ManufacturingPlane,
  feature: CadFeature,
  through: boolean,
): MachiningFace {
  if (through) return throughFace(part, plane);
  if (!feature.position || !feature.size) {
    return {
      axis: plane.thicknessAxis,
      side: 'internal',
      semanticId: 'face:' + part.id + ':' + plane.thicknessAxis + '-internal',
    };
  }

  const start = feature.position[plane.thicknessAxis];
  const end = start + feature.size[plane.thicknessAxis];
  const tolerance = 0.05;
  const side = start <= tolerance ? 'min' : end >= plane.thicknessMm - tolerance ? 'max' : 'internal';
  return {
    axis: plane.thicknessAxis,
    side,
    semanticId: 'face:' + part.id + ':' + plane.thicknessAxis + '-' + side,
  };
}

function throughFace(part: CadPart, plane: ManufacturingPlane): MachiningFace {
  return {
    axis: plane.thicknessAxis,
    side: 'through',
    semanticId: 'face:' + part.id + ':' + plane.thicknessAxis + '-through',
  };
}

function emptyCounts(): Record<ManufacturingOperationKind, number> {
  return { CUT: 0, POCKET: 0, DADO_GROOVE: 0, DRILL: 0, ENGRAVE: 0, EDGE: 0 };
}

function numberArray(value: unknown) {
  return Array.isArray(value) ? value.filter(item => typeof item === 'number' && Number.isFinite(item)) as number[] : [];
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function dxfForOperations(part: ManufacturingPart, operations: ManufacturingOperation[] = part.operations) {
  const lines: string[] = [
    '0','SECTION','2','HEADER',
    '9','$ACADVER','1','AC1015',
    '9','$INSUNITS','70','4',
    '0','ENDSEC',
    '0','SECTION','2','ENTITIES',
  ];

  for (const operation of operations) {
    const layer = dxfLayer(operation.kind);
    for (const geometry of operation.geometry) appendDxfGeometry(lines, geometry, layer);
  }

  lines.push('0','ENDSEC','0','EOF');
  return lines.join('\r\n') + '\r\n';
}

export function operationLayerDxf(part: ManufacturingPart, kind: ManufacturingOperationKind) {
  return dxfForOperations(part, part.operations.filter(operation => operation.kind === kind));
}

function appendDxfGeometry(lines: string[], geometry: ManufacturingGeometry, layer: string) {
  if (geometry.type === 'circle') {
    lines.push('0','CIRCLE','8',layer,'10',num(geometry.cx),'20',num(geometry.cy),'30','0','40',num(geometry.radius));
    return;
  }
  if (geometry.type === 'line') {
    lines.push('0','LINE','8',layer,'10',num(geometry.x1),'20',num(geometry.y1),'30','0','11',num(geometry.x2),'21',num(geometry.y2),'31','0');
    return;
  }
  if (geometry.type === 'text') {
    lines.push('0','TEXT','8',layer,'10',num(geometry.x),'20',num(geometry.y),'30','0','40',num(geometry.height),'1',dxfText(geometry.text));
    return;
  }
  const points = geometry.type === 'rect'
    ? [
        { x: geometry.x, y: geometry.y },
        { x: geometry.x + geometry.width, y: geometry.y },
        { x: geometry.x + geometry.width, y: geometry.y + geometry.height },
        { x: geometry.x, y: geometry.y + geometry.height },
      ]
    : geometry.points;
  lines.push('0','LWPOLYLINE','8',layer,'90',String(points.length),'70',geometry.type === 'rect' || geometry.closed ? '1' : '0');
  for (const point of points) lines.push('10',num(point.x),'20',num(point.y));
}

function dxfLayer(kind: ManufacturingOperationKind) {
  return kind === 'DADO_GROOVE' ? 'DADO-GROOVE' : kind;
}

function dxfText(value: string) {
  return value.replace(/[^\x20-\x7E]/g, '?').slice(0, 120);
}

export function svgForOperations(part: ManufacturingPart, operations: ManufacturingOperation[] = part.operations) {
  const width = Math.max(1, part.plane.widthMm);
  const height = Math.max(1, part.plane.heightMm);
  const body = operations.map(operation => {
    const geometry = operation.geometry.map(item => svgGeometry(item, height)).join('');
    return '<g class="op op-' + cssToken(operation.kind) + '" data-operation-id="' + xml(operation.id) + '">' + geometry + '</g>';
  }).join('');

  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + num(width) + 'mm" height="' + num(height) +
    'mm" viewBox="0 0 ' + num(width) + ' ' + num(height) + '" data-units="mm" data-scale="1">' +
    '<style>.op{fill:none;stroke-width:.6;vector-effect:non-scaling-stroke}.op-CUT{stroke:#d9e2e5}.op-POCKET{stroke:#e5b96a;stroke-dasharray:4 2}.op-DADO_GROOVE{stroke:#c99ce8}.op-DRILL{stroke:#69c9e6}.op-ENGRAVE{stroke:#9ba8ae;fill:#9ba8ae}.op-EDGE{stroke:#79d8a8;stroke-width:1.2}.label{font-family:monospace}</style>' +
    '<rect x="0" y="0" width="' + num(width) + '" height="' + num(height) + '" fill="#171c20"/>' +
    body + '</svg>';
}

export function operationLayerSvg(part: ManufacturingPart, kind: ManufacturingOperationKind) {
  return svgForOperations(part, part.operations.filter(operation => operation.kind === kind));
}

function svgGeometry(geometry: ManufacturingGeometry, height: number) {
  if (geometry.type === 'circle') {
    return '<circle cx="' + num(geometry.cx) + '" cy="' + num(height - geometry.cy) + '" r="' + num(geometry.radius) + '"/>';
  }
  if (geometry.type === 'line') {
    return '<line x1="' + num(geometry.x1) + '" y1="' + num(height - geometry.y1) + '" x2="' + num(geometry.x2) + '" y2="' + num(height - geometry.y2) + '"/>';
  }
  if (geometry.type === 'rect') {
    return '<rect x="' + num(geometry.x) + '" y="' + num(height - geometry.y - geometry.height) + '" width="' + num(geometry.width) + '" height="' + num(geometry.height) + '"/>';
  }
  if (geometry.type === 'text') {
    return '<text class="label" x="' + num(geometry.x) + '" y="' + num(height - geometry.y) + '" font-size="' + num(geometry.height) + '">' + xml(geometry.text) + '</text>';
  }
  const points = geometry.points.map(point => num(point.x) + ',' + num(height - point.y)).join(' ');
  return geometry.closed
    ? '<polygon points="' + points + '" fill="none"/>'
    : '<polyline points="' + points + '" fill="none"/>';
}

export function drillingMapCsv(part: ManufacturingPart) {
  const rows = [['PART_NUMBER','PART_ID','OPERATION_ID','U_MM','V_MM','DIAMETER_MM','FACE','DEPTH_MM','THROUGH']];
  for (const operation of part.operations.filter(item => item.kind === 'DRILL')) {
    for (const geometry of operation.geometry) {
      if (geometry.type !== 'circle') continue;
      rows.push([
        part.partNumber,
        part.partId,
        operation.id,
        num(geometry.cx),
        num(geometry.cy),
        num(geometry.radius * 2),
        operation.face.semanticId,
        operation.depthMm === null ? '' : num(operation.depthMm),
        operation.through ? 'true' : 'false',
      ]);
    }
  }
  return csv(rows);
}

export function manufacturingPackageEntries(
  model: ManufacturingModel,
  reviewedAt: string,
): ManufacturingPackageEntry[] {
  const entries: ManufacturingPackageEntry[] = [];
  entries.push({
    path: 'manifest.json',
    data: JSON.stringify({
      product: 'Cabinet WS Standalone',
      packageVersion: 1,
      manufacturingModelVersion: model.version,
      documentId: model.documentId,
      documentName: model.documentName,
      signature: model.signature,
      reviewedAt,
      units: model.units,
      scale: model.scale,
      readiness: model.readiness,
      designHealthStatus: model.designHealthStatus,
      partCount: model.parts.length,
      operationCounts: model.operationCounts,
      note: 'Manufacturing geometry only. DXF/SVG layers are not CNC toolpaths or postprocessed machine code.',
    }, null, 2),
  });
  entries.push({ path: 'reports/manufacturing.json', data: JSON.stringify(model, null, 2) });
  entries.push({ path: 'reports/issues.json', data: JSON.stringify(model.issues, null, 2) });

  for (const part of model.parts) {
    const root = 'parts/' + safeFile(part.partNumber) + '/';
    entries.push({ path: root + safeFile(part.partNumber) + '.dxf', data: part.dxf });
    entries.push({ path: root + safeFile(part.partNumber) + '.svg', data: part.svg });
    entries.push({ path: root + 'drilling.csv', data: part.drillingCsv });
    entries.push({ path: root + 'metadata.json', data: JSON.stringify({
      partId: part.partId,
      partNumber: part.partNumber,
      name: part.name,
      material: part.material,
      plane: part.plane,
      metadata: part.metadata,
      operations: part.operations,
    }, null, 2) });

    for (const kind of allKinds) {
      if (!part.operationCounts[kind]) continue;
      entries.push({ path: root + 'layers/' + dxfLayer(kind).toLowerCase() + '.dxf', data: operationLayerDxf(part, kind) });
      entries.push({ path: root + 'layers/' + dxfLayer(kind).toLowerCase() + '.svg', data: operationLayerSvg(part, kind) });
    }
  }

  entries.push({
    path: 'README.txt',
    data: [
      model.documentName,
      'Cabinet WS Standalone v0.11 manufacturing geometry package',
      '',
      'All DXF and SVG coordinates are part-local millimeters at scale 1:1.',
      'DXF $INSUNITS is millimeters (4). SVG width/height use mm and data-scale=1.',
      'CUT = finished profile / through cutouts.',
      'POCKET = registered non-through pockets.',
      'DADO-GROOVE = dado, groove, rabbet, and registered slot intent.',
      'DRILL = registered holes and hole patterns.',
      'ENGRAVE = part identification/registration marking.',
      'EDGE = semantic exposed-edge treatment requirements.',
      '',
      'This package is manufacturing geometry, not CNC toolpaths. Phase 12 owns nesting, kerf/tool diameter, machine profiles, and postprocessed G-code.',
    ].join('\r\n') + '\r\n',
  });

  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

export function reviewedManufacturingZip(model: ManufacturingModel, reviewedAt: string) {
  if (model.readiness === 'blocked') throw new Error('Manufacturing export is blocked by Design Health errors.');
  return zipStore(manufacturingPackageEntries(model, reviewedAt));
}

export function zipStore(entries: ManufacturingPackageEntry[]) {
  const encoder = new TextEncoder();
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.path);
    const data = encoder.encode(entry.data);
    const crc = crc32(data);
    const localHeader = new Uint8Array(30 + name.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, name.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(name, 30);
    localChunks.push(localHeader, data);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    central.set(name, 46);
    centralChunks.push(central);

    offset += localHeader.length + data.length;
  }

  const centralSize = centralChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  return concatBytes([...localChunks, ...centralChunks, end]);
}

function concatBytes(chunks: Uint8Array[]) {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
  return value >>> 0;
});

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function csv(rows: string[][]) {
  return rows.map(row => row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(',')).join('\r\n') + '\r\n';
}

function num(value: number) {
  return Number(value.toFixed(4)).toString();
}

function safeFile(value: string) {
  return value.replace(/[^a-z0-9._-]+/gi, '-');
}

function cssToken(value: string) {
  return value.replace(/[^A-Z0-9_-]+/gi, '-');
}

function xml(value: string) {
  const escapes: Record<string, string> = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
  return String(value).replace(/[&<>"']/g, character => escapes[character] ?? character);
}

function fnv1a(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
