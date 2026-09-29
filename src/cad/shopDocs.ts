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
