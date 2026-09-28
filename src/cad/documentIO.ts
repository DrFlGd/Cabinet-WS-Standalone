import { buildCabinetDocument, sanitizeParameters } from './cabinetModel';
import { makeUtilityDefaults } from './utilityStarters';
import type { CabinetDocument, CabinetParameters, StockChoice } from './types';
import type { DisplayUnits } from './units';

type StoredDocumentV2 = {
  version: 2;
  family?: 'utility';
  name: string;
  units: 'mm';
  displayUnits: DisplayUnits;
  parameters: Partial<CabinetParameters> & Record<string, unknown>;
};

export type ImportReport = {
  source: 'standalone' | 'cabinet-workshop';
  warnings: string[];
  ignoredFieldCount: number;
};

export type ParsedProject = {
  document: CabinetDocument;
  report: ImportReport;
};

export function serializeDocument(cadDocument: CabinetDocument) {
  const stored: StoredDocumentV2 = {
    version: 2,
    family: 'utility',
    name: cadDocument.name,
    units: 'mm',
    displayUnits: cadDocument.displayUnits,
    parameters: cadDocument.parameters,
  };
  return JSON.stringify(stored, null, 2);
}

export function parseDocument(text: string): CabinetDocument {
  return parseDocumentWithReport(text).document;
}

export function parseDocumentWithReport(text: string): ParsedProject {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON.');
  }

  if (looksLikeCabinetWorkshopProject(raw)) {
    return importCabinetWorkshopProject(raw);
  }

  return importStandaloneProject(raw);
}

function importStandaloneProject(raw: unknown): ParsedProject {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Unsupported or invalid Cabinet WS document.');
  }

  const record = raw as Record<string, unknown>;
  if (record.version !== 1 && record.version !== 2) {
    throw new Error('Unsupported Cabinet WS document version.');
  }
  if (typeof record.name !== 'string' || !record.name.trim()) {
    throw new Error('Cabinet document name is missing.');
  }
  if (record.units !== undefined && record.units !== 'mm') {
    throw new Error('Cabinet geometry must be stored in millimeters.');
  }

  const displayUnits: DisplayUnits =
    record.version === 2 && record.displayUnits === 'in' ? 'in' : 'mm';

  const parameters = migrateStandaloneParameters(record.parameters);
  return {
    document: buildCabinetDocument(parameters, record.name.slice(0, 120), displayUnits),
    report: {
      source: 'standalone',
      warnings: record.version === 1
        ? ['Migrated Standalone schema v1 to schema v2.']
        : [],
      ignoredFieldCount: 0,
    },
  };
}

function migrateStandaloneParameters(value: unknown): CabinetParameters {
  if (!value || typeof value !== 'object') {
    throw new Error('Cabinet parameters are missing.');
  }

  const source = value as Record<string, unknown>;
  validateKnownStandaloneTypes(source);

  const migrated: Partial<CabinetParameters> = {
    ...source as Partial<CabinetParameters>,
  };

  // v0.1/v0.2 used one faceGap value for both edge reveal and inter-front gaps.
  const oldFaceGap = finiteNumber(source.faceGap);
  if (oldFaceGap !== null) {
    if (source.frontEdgeReveal === undefined) migrated.frontEdgeReveal = oldFaceGap;
    if (source.doorGap === undefined) migrated.doorGap = oldFaceGap;
    if (source.drawerGap === undefined) migrated.drawerGap = oldFaceGap;
  }

  if (source.carcassStock === undefined) migrated.carcassStock = 'custom_mm';
  if (source.backStock === undefined) migrated.backStock = 'custom_mm';

  return sanitizeParameters(migrated);
}

function validateKnownStandaloneTypes(source: Record<string, unknown>) {
  const defaults = makeUtilityDefaults();
  for (const [key, fallback] of Object.entries(defaults)) {
    if (!(key in source)) continue;
    const value = source[key];
    if (typeof fallback === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) {
      throw new Error(`Invalid cabinet parameter: ${key}`);
    }
    if (typeof fallback === 'boolean' && typeof value !== 'boolean') {
      throw new Error(`Invalid cabinet parameter: ${key}`);
    }
    if (typeof fallback === 'string' && typeof value !== 'string') {
      throw new Error(`Invalid cabinet parameter: ${key}`);
    }
  }

  if ('faceGap' in source && finiteNumber(source.faceGap) === null) {
    throw new Error('Invalid cabinet parameter: faceGap');
  }
}

function looksLikeCabinetWorkshopProject(raw: unknown): raw is Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return false;
  const record = raw as Record<string, unknown>;
  return (
    record.engineFamily === 'modular_organization' ||
    ('values' in record && 'family' in record && !('parameters' in record))
  );
}

function importCabinetWorkshopProject(record: Record<string, unknown>): ParsedProject {
  const family = record.family;
  if (family !== 1 && family !== 'utility' && family !== 'utility_cabinet') {
    throw new Error('This Cabinet Workshop project is not a Utility Cabinet. v0.3 imports Utility Cabinet projects only.');
  }

  if (!record.values || typeof record.values !== 'object') {
    throw new Error('Cabinet Workshop project values are missing.');
  }

  const values = record.values as Record<string, unknown>;
  const defaults = makeUtilityDefaults();
  const mapped: Partial<CabinetParameters> = {
    width: numberOr(values.cabinet_width, values.custom_cabinet_width, defaults.width),
    height: numberOr(values.cabinet_height, values.custom_cabinet_height, defaults.height),
    depth: numberOr(values.cabinet_depth, values.custom_cabinet_depth, defaults.depth),

    carcassStock: stockOr(values.carcass_stock, defaults.carcassStock),
    backStock: stockOr(values.back_stock, defaults.backStock),
    materialThickness: numberOr(values.custom_carcass_thickness, defaults.materialThickness),
    backThickness: numberOr(values.custom_back_thickness, defaults.backThickness),
    drawerMaterialThickness: numberOr(values.custom_drawer_material_thickness, defaults.drawerMaterialThickness),
    drawerBottomThickness: numberOr(values.custom_drawer_bottom_thickness, defaults.drawerBottomThickness),
    drawerFrontThickness: numberOr(values.custom_drawer_front_thickness, defaults.drawerFrontThickness),
    doorThickness: numberOr(values.custom_door_thickness, defaults.doorThickness),

    cabinetContents: enumOr(values.cabinet_contents, ['drawers', 'doors', 'combo'] as const, defaults.cabinetContents),
    drawerCount: numberOr(values.drawer_count, values.custom_drawer_count, defaults.drawerCount),
    doorCount: numberOr(values.door_count, values.custom_door_count, defaults.doorCount),
    shelfCount: numberOr(values.door_shelf_count, values.custom_door_shelf_count, defaults.shelfCount),

    topStyle: enumOr(values.top_style, ['full', 'stretchers'] as const, defaults.topStyle),
    topStretcherDepth: numberOr(values.top_stretcher_depth, defaults.topStretcherDepth),
    backStyle: enumOr(values.back_style, ['panel', 'structural_panel', 'stretchers', 'none'] as const, defaults.backStyle),
    backInset: numberOr(values.back_inset, defaults.backInset),
    backStretcherCount: numberOr(values.back_stretcher_count, defaults.backStretcherCount),
    backStretcherHeight: numberOr(values.back_stretcher_height, defaults.backStretcherHeight),

    mountStyle: enumOr(values.cabinet_mount_style, ['floor', 'wall'] as const, defaults.mountStyle),
    baseStyle: enumOr(values.base_style, ['toe_kick', 'flat', 'leveling_feet', 'casters'] as const, defaults.baseStyle),
    toeKickHeight: numberOr(values.custom_toe_kick_height, defaults.toeKickHeight),
    toeKickDepth: numberOr(values.custom_toe_kick_setback, defaults.toeKickDepth),
    sideToeKickCutout: enumOr(values.custom_side_toe_kick_cutout, ['none', 'left', 'right', 'both'] as const, defaults.sideToeKickCutout),
    bottomWidthStyle: enumOr(values.bottom_width_style, ['joined', 'full_width'] as const, defaults.bottomWidthStyle),

    includeWorktop: booleanOr(values.include_worktop, defaults.includeWorktop),
    worktopThickness: numberOr(values.worktop_thickness, defaults.worktopThickness),
    worktopSideOverhang: numberOr(values.worktop_side_overhang, defaults.worktopSideOverhang),
    worktopFrontOverhang: numberOr(values.worktop_front_overhang, defaults.worktopFrontOverhang),
    worktopBackOverhang: numberOr(values.worktop_back_overhang, defaults.worktopBackOverhang),

    joineryStyle: enumOr(values.joinery_style, ['butt', 'screw', 'dado', 'tab_slot'] as const, defaults.joineryStyle),
    dadoDepth: numberOr(values.dado_depth, defaults.dadoDepth),
    dadoFitClearance: numberOr(values.dado_fit_clearance, defaults.dadoFitClearance),

    frontMountStyle: enumOr(values.front_mount_style, ['overlay', 'inset_flush'] as const, defaults.frontMountStyle),
    frontEdgeReveal: numberOr(values.front_edge_reveal, defaults.frontEdgeReveal),
    doorGap: numberOr(values.door_gap, defaults.doorGap),
    drawerGap: numberOr(values.drawer_gap, defaults.drawerGap),
    shelfStyle: enumOr(values.shelf_style, ['fixed', 'adjustable'] as const, defaults.shelfStyle),
  };

  const warnings: string[] = [];
  const layoutMode = typeof values.cabinet_layout_mode === 'string' ? values.cabinet_layout_mode : 'legacy';
  if (layoutMode !== 'legacy') {
    warnings.push(`Layout mode "${layoutMode}" is not yet supported; v0.3 imported the cabinet envelope and basic contents only.`);
  }
  if (values.drawer_height_mode && values.drawer_height_mode !== 'equal') {
    warnings.push('Non-equal drawer-height recipes are not yet supported; drawer fronts were imported as equal rows.');
  }
  if (values.ganging_style && values.ganging_style !== 'none') {
    warnings.push('Cabinet ganging settings are not yet supported.');
  }
  if (values.hinge_style && values.hinge_style !== 'none') {
    warnings.push('Hinge drilling/hardware is deferred to v0.5 and was not imported.');
  }
  if (values.drawer_mount && values.drawer_mount !== 'wood_rails') {
    warnings.push('Drawer-slide hardware is deferred to v0.5 and was not imported.');
  }

  const supportedLegacyKeys = new Set([
    'cabinet_width', 'custom_cabinet_width', 'cabinet_height', 'custom_cabinet_height', 'cabinet_depth', 'custom_cabinet_depth',
    'carcass_stock', 'back_stock', 'custom_carcass_thickness', 'custom_back_thickness',
    'custom_drawer_material_thickness', 'custom_drawer_bottom_thickness', 'custom_drawer_front_thickness', 'custom_door_thickness',
    'cabinet_contents', 'drawer_count', 'custom_drawer_count', 'door_count', 'custom_door_count', 'door_shelf_count', 'custom_door_shelf_count',
    'top_style', 'top_stretcher_depth', 'back_style', 'back_inset', 'back_stretcher_count', 'back_stretcher_height',
    'cabinet_mount_style', 'base_style', 'custom_toe_kick_height', 'custom_toe_kick_setback', 'custom_side_toe_kick_cutout', 'bottom_width_style',
    'include_worktop', 'worktop_thickness', 'worktop_side_overhang', 'worktop_front_overhang', 'worktop_back_overhang',
    'joinery_style', 'dado_depth', 'dado_fit_clearance',
    'front_mount_style', 'front_edge_reveal', 'door_gap', 'drawer_gap', 'shelf_style',
    'design_name', 'cabinet_layout_mode', 'drawer_height_mode', 'ganging_style', 'hinge_style', 'drawer_mount',
  ]);
  const ignoredFieldCount = Object.keys(values).filter(key => !supportedLegacyKeys.has(key) && !key.startsWith('_')).length;

  const name =
    typeof values.design_name === 'string' && values.design_name.trim()
      ? values.design_name.trim()
      : typeof record.name === 'string' && record.name.trim()
        ? record.name.trim()
        : 'Imported Utility Cabinet';

  return {
    document: buildCabinetDocument(sanitizeParameters(mapped), name.slice(0, 120), 'mm'),
    report: {
      source: 'cabinet-workshop',
      warnings,
      ignoredFieldCount,
    },
  };
}

const stockChoices: StockChoice[] = [
  'custom_mm',
  '1/8_nominal',
  '1/4_nominal',
  '3/8_nominal',
  '1/2_nominal',
  '5/8_nominal',
  '3/4_nominal',
  '1_nominal',
];

function stockOr(value: unknown, fallback: StockChoice): StockChoice {
  return typeof value === 'string' && stockChoices.includes(value as StockChoice)
    ? value as StockChoice
    : fallback;
}

function finiteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function numberOr(...values: unknown[]) {
  for (const value of values) {
    const numeric = finiteNumber(value);
    if (numeric !== null) return numeric;
  }
  return 0;
}

function booleanOr(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function enumOr<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? value as T
    : fallback;
}

export function downloadDocument(cadDocument: CabinetDocument) {
  const blob = new Blob([serializeDocument(cadDocument)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = suggestedFileName(cadDocument.name);
  anchor.click();
  URL.revokeObjectURL(url);
}

export function suggestedFileName(name: string) {
  return `${safeName(name)}.cabinetws.json`;
}

function safeName(name: string) {
  return name.trim().replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'cabinet';
}
