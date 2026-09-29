import type { DesignHealthReport } from './designHealth';
import { buildFeatureGraph } from './kernel/featureGraph';
import type { CadFeature } from './kernel/types';
import type { CabinetDocument, CadPart, HardwareInstance, PartCategory, Vec3 } from './types';
import { formatDimension, unitLabel, type DisplayUnits } from './units';

export type PartDimensions = { x: number; y: number; z: number };

export type BomRow = {
  partNumber: string;
  partId: string;
  name: string;
  category: PartCategory;
  material: string;
  quantity: number;
  finished: PartDimensions;
  blank: PartDimensions;
  thicknessAxis: 'x' | 'y' | 'z';
  grainDirection: 'x' | 'y' | 'z' | 'none';
  edgeBanding: string[];
  machining: string[];
  notes: string[];
  profiled: boolean;
};

export type MaterialGroup = {
  key: string;
  material: string;
  thickness: number;
  thicknessAxis: 'x' | 'y' | 'z';
  partCount: number;
  partNumbers: string[];
  blankAreaMm2: number;
};

export type HardwareChecklistRow = {
  key: string;
  partNumber: string;
  label: string;
  manufacturer: string;
  model: string;
  quantity: number;
  verificationStatus: string;
  instanceIds: string[];
  mountingPartIds: string[];
  notes: string[];
};

export type AssemblyStep = {
  id: string;
  order: number;
  title: string;
  instruction: string;
  partIds: string[];
  partNumbers: string[];
  hardwareIds: string[];
};

export type ShopDocumentation = {
  bom: BomRow[];
  materialGroups: MaterialGroup[];
  hardware: HardwareChecklistRow[];
  assemblySteps: AssemblyStep[];
  featureCount: number;
  operationCount: number;
  designHealthStatus: DesignHealthReport['status'];
  manufacturingReadiness: DesignHealthReport['readiness'];
};

const axes = ['x', 'y', 'z'] as const;

const categoryPrefixes: Record<Exclude<PartCategory, 'hardware'>, string> = {
  carcass: 'C',
  back: 'B',
  shelf: 'SH',
  front: 'F',
  drawer: 'D',
  worktop: 'WT',
  divider: 'DV',
  frame: 'FF',
};

const tokenAliases: Record<string, string> = {
  carcass: '', left: 'L', right: 'R', bottom: 'BTM', top: 'TOP', front: 'FR', rear: 'RR', back: 'BK',
  stretcher: 'ST', shelf: 'SH', adjustable: 'ADJ', fixed: 'FIX', door: 'DR', drawer: 'D', box: 'BX',
  face: 'FACE', frame: '', stile: 'ST', rail: 'RL', center: 'CTR', divider: 'DV', section: 'SEC',
  organizer: 'ORG', column: 'COL', row: 'ROW', worktop: '',
};

export function buildShopDocumentation(document: CabinetDocument, designHealth: DesignHealthReport): ShopDocumentation {
  const graph = buildFeatureGraph(document);
  const bom = document.parts
    .filter(part => part.category !== 'hardware')
    .map(part => bomRowForPart(part, graph.partFeatures[part.id] ?? []))
    .sort(compareBomRows);

  const materialGroups = buildMaterialGroups(bom);
  const hardware = buildHardwareChecklist(document);
  const assemblySteps = buildAssemblySteps(document, bom, hardware);
  const operationCount = Object.values(graph.partFeatures)
    .flat()
    .filter(feature => !['panel-blank', 'assembly-transform', 'hardware-reference'].includes(feature.kind))
    .length;

  return {
    bom,
    materialGroups,
    hardware,
    assemblySteps,
    featureCount: graph.featureCount,
    operationCount,
    designHealthStatus: designHealth.status,
    manufacturingReadiness: designHealth.readiness,
  };
}

export function stablePartNumber(part: Pick<CadPart, 'id' | 'category'>) {
  if (part.category === 'hardware') return hardwarePartNumber(part.id);
  const prefix = categoryPrefixes[part.category];
  const rawTokens = part.id.split(':');
  if (rawTokens[0] === part.category) rawTokens.shift();
  const tokens = rawTokens.flatMap(token => token.split(/[-_]/g)).map(normalizeToken).filter(Boolean);
  return tokens.length ? [prefix, ...tokens].join('-').replace(/-+/g, '-') : prefix;
}

function hardwarePartNumber(id: string) {
  const tokens = id.replace(/^hardware:/, '').split(/[:_-]/g).map(normalizeToken).filter(Boolean);
  return ['HW', ...tokens].join('-');
}

function normalizeToken(token: string) {
  const normalized = token.trim().toLowerCase();
  if (!normalized) return '';
  if (/^\d+$/.test(normalized)) return normalized.padStart(2, '0');
  return tokenAliases[normalized] ?? normalized.toUpperCase().replace(/[^A-Z0-9]+/g, '');
}

function bomRowForPart(part: CadPart, features: CadFeature[]): BomRow {
  const thicknessAxis = inferThicknessAxis(part);
  const blankFeature = features.find(feature => feature.kind === 'panel-blank');
  const blank = blankFeature?.size ? { ...blankFeature.size } : { ...part.size };
  const profiled = Boolean(part.geometry?.outline && part.geometry.outline.length > 4)
    || features.some(feature => ['pocket', 'dado', 'rabbet', 'groove', 'hole', 'hole-pattern'].includes(feature.kind));
  const machining = summarizeMachining(features);
  const notes: string[] = [];
  if (part.geometry?.outline && part.geometry.outline.length > 4) notes.push('Profile-cut part; blank dimensions are rectangular envelope.');
  if (part.geometry?.holes?.length) notes.push(`${part.geometry.holes.length} profile-registered cut/drill feature${part.geometry.holes.length === 1 ? '' : 's'}.`);
  if (profiled && !machining.length) notes.push('Finished profile differs from rectangular blank envelope.');

  return {
    partNumber: stablePartNumber(part), partId: part.id, name: part.name, category: part.category,
    material: part.material, quantity: 1, finished: { ...part.size }, blank, thicknessAxis,
    grainDirection: inferGrainDirection(part, thicknessAxis), edgeBanding: inferEdgeBanding(part),
    machining, notes, profiled,
  };
}

function inferThicknessAxis(part: CadPart): 'x' | 'y' | 'z' {
  if (part.geometry?.axis === 'x') return 'x';
  if (part.geometry?.axis === 'z') return 'z';
  return axes.map(axis => ({ axis, value: Math.abs(part.size[axis]) })).sort((a, b) => a.value - b.value)[0].axis;
}

function inferGrainDirection(part: CadPart, thicknessAxis: 'x' | 'y' | 'z'): 'x' | 'y' | 'z' | 'none' {
  const material = part.material.toLowerCase();
  if (!/(stock|ply|wood|worktop|carcass|back)/.test(material)) return 'none';
  return axes.filter(axis => axis !== thicknessAxis).sort((a, b) => part.size[b] - part.size[a])[0] ?? 'none';
}

function inferEdgeBanding(part: CadPart) {
  if (part.category === 'front') return ['perimeter'];
  if (part.category === 'shelf' || part.category === 'divider') return ['front'];
  if (part.category === 'worktop') return ['front', 'left', 'right'];
  if (part.category === 'carcass' && /^carcass:(left|right|top|bottom)$/.test(part.id)) return ['front'];
  return [];
}

function summarizeMachining(features: CadFeature[]) {
  const counts = new Map<string, number>();
  for (const feature of features) {
    if (feature.kind === 'panel-blank' || feature.kind === 'assembly-transform' || feature.kind === 'hardware-reference') continue;
    const count = feature.kind === 'hole-pattern' ? Number(feature.parameters.count ?? 0) : 0;
    const label = count > 0 ? `${feature.label} (${count} holes)` : feature.label || feature.kind.replace('-', ' ');
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, count]) => `${count}× ${label}`);
}

function buildMaterialGroups(rows: BomRow[]): MaterialGroup[] {
  const groups = new Map<string, MaterialGroup>();
  for (const row of rows) {
    const thickness = row.blank[row.thicknessAxis];
    const key = `${row.material}|${thickness.toFixed(4)}|${row.thicknessAxis}`;
    const planeAxes = axes.filter(axis => axis !== row.thicknessAxis);
    const blankArea = row.blank[planeAxes[0]] * row.blank[planeAxes[1]];
    const existing = groups.get(key);
    if (existing) {
      existing.partCount += row.quantity;
      existing.partNumbers.push(row.partNumber);
      existing.blankAreaMm2 += blankArea * row.quantity;
    } else {
      groups.set(key, { key, material: row.material, thickness, thicknessAxis: row.thicknessAxis, partCount: row.quantity, partNumbers: [row.partNumber], blankAreaMm2: blankArea * row.quantity });
    }
  }
  return [...groups.values()].sort((a, b) => a.material.localeCompare(b.material) || a.thickness - b.thickness);
}

function buildHardwareChecklist(document: CabinetDocument): HardwareChecklistRow[] {
  const groups = new Map<string, HardwareChecklistRow>();
  for (const instance of document.hardware) {
    const key = `instance:${instance.definitionId}:${instance.manufacturer}:${instance.model}`;
    const existing = groups.get(key);
    if (existing) {
      existing.quantity += 1;
      existing.instanceIds.push(instance.id);
      if (!existing.mountingPartIds.includes(instance.mountingReference.partId)) existing.mountingPartIds.push(instance.mountingReference.partId);
    } else {
      groups.set(key, {
        key,
        partNumber: `HW-${normalizeToken(instance.category)}-${normalizeToken(instance.definitionId)}`,
        label: instance.label,
        manufacturer: instance.manufacturer,
        model: instance.model,
        quantity: 1,
        verificationStatus: instance.verificationStatus,
        instanceIds: [instance.id],
        mountingPartIds: [instance.mountingReference.partId],
        notes: hardwareInstanceNotes(instance),
      });
    }
  }

  const modeledInstanceIds = new Set(document.hardware.map(instance => instance.id));
  for (const part of document.parts.filter(candidate => candidate.category === 'hardware' && !modeledInstanceIds.has(candidate.id))) {
    const key = `part:${part.name}:${part.material}`;
    const existing = groups.get(key);
    if (existing) {
      existing.quantity += 1;
      existing.instanceIds.push(part.id);
    } else {
      groups.set(key, {
        key,
        partNumber: hardwarePartNumber(part.id),
        label: part.name,
        manufacturer: String(part.metadata?.manufacturer ?? 'Configured'),
        model: String(part.metadata?.model ?? part.material),
        quantity: 1,
        verificationStatus: String(part.metadata?.verification ?? 'project'),
        instanceIds: [part.id],
        mountingPartIds: [],
        notes: [],
      });
    }
  }
  return [...groups.values()].sort((a, b) => a.partNumber.localeCompare(b.partNumber));
}

function hardwareInstanceNotes(instance: HardwareInstance) {
  return [
    `Mounts to ${instance.mountingReference.partId} (${instance.mountingReference.face} face).`,
    instance.drilling.enabled ? 'Registered drilling is enabled for this configured instance.' : 'Automatic drilling is not encoded/enabled; verify manufacturer hole selection.',
  ];
}

function buildAssemblySteps(document: CabinetDocument, bom: BomRow[], hardware: HardwareChecklistRow[]): AssemblyStep[] {
  const byId = new Map(bom.map(row => [row.partId, row]));
  const steps: AssemblyStep[] = [];
