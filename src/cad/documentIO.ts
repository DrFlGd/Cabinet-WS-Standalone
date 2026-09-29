import { sanitizeParameters } from './cabinetModel';
import { familyDefinition, familyStarters, parametersFromFamilyValues } from './familyCatalog';
import { buildFamilyCabinetDocument } from './familyModel';
import { cloneSectionNodes, treeErrors } from './sections';
import { makeUtilityDefaults } from './utilityStarters';
import type {
  CabinetDocument,
  CabinetFamily,
  CabinetParameters,
  FamilyRecipeValues,
} from './types';
import type { DisplayUnits } from './units';

type StoredDocumentV3 = {
  version: 3;
  family: CabinetFamily;
  starterId: string | null;
  familyValues: FamilyRecipeValues;
  name: string;
  units: 'mm';
  displayUnits: DisplayUnits;
  parameters: CabinetParameters;
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

const families: CabinetFamily[] = [
  'shop_cart',
  'utility',
  'benchtop',
  'stackable',
  'kitchen',
  'drawer',
  'equipment_stand',
];

export function serializeDocument(cadDocument: CabinetDocument) {
  const stored: StoredDocumentV3 = {
    version: 3,
    family: cadDocument.family,
    starterId: cadDocument.starterId,
    familyValues: cloneJsonObject(cadDocument.familyValues),
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
  if (record.version !== 1 && record.version !== 2 && record.version !== 3) {
    throw new Error('Unsupported Cabinet WS document version.');
  }
  if (typeof record.name !== 'string' || !record.name.trim()) {
    throw new Error('Cabinet document name is missing.');
  }
  if (record.units !== undefined && record.units !== 'mm') {
    throw new Error('Cabinet geometry must be stored in millimeters.');
  }

  const displayUnits: DisplayUnits =
    (record.version === 2 || record.version === 3) && record.displayUnits === 'in'
      ? 'in'
      : 'mm';

  const family = record.version === 3
    ? familyOr(record.family, 'utility')
    : 'utility';
  const starterId = record.version === 3 && (typeof record.starterId === 'string' || record.starterId === null)
    ? record.starterId
    : null;
  const familyValues = record.version === 3
    ? jsonObjectOr(record.familyValues, {})
    : {};
  const parameters = migrateStandaloneParameters(record.parameters);

  const warnings: string[] = [];
  if (record.version === 1) {
    warnings.push('Migrated Standalone schema v1 to schema v3.');
  } else if (record.version === 2) {
    warnings.push('Migrated Standalone schema v2 to schema v3.');
  }

  return {
    document: buildFamilyCabinetDocument(
      parameters,
      record.name.slice(0, 120),
      displayUnits,
      { family, starterId, familyValues },
    ),
    report: {
      source: 'standalone',
      warnings,
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

  const oldFaceGap = finiteNumber(source.faceGap);
  if (oldFaceGap !== null) {
    if (source.frontEdgeReveal === undefined) migrated.frontEdgeReveal = oldFaceGap;
    if (source.doorGap === undefined) migrated.doorGap = oldFaceGap;
    if (source.drawerGap === undefined) migrated.drawerGap = oldFaceGap;
  }

  if (source.carcassStock === undefined) migrated.carcassStock = 'custom_mm';
  if (source.backStock === undefined) migrated.backStock = 'custom_mm';
  if (source.layoutMode === undefined) migrated.layoutMode = 'legacy';
  if (source.sectionNodes === undefined) migrated.sectionNodes = cloneSectionNodes(makeUtilityDefaults().sectionNodes);

  return sanitizeParameters(migrated);
}

function validateKnownStandaloneTypes(source: Record<string, unknown>) {
  const defaults = makeUtilityDefaults();
  for (const [key, fallback] of Object.entries(defaults)) {
    if (!(key in source)) continue;
    const value = source[key];
    if (typeof fallback === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) {
      throw new Error('Invalid cabinet parameter: ' + key);
    }
    if (typeof fallback === 'boolean' && typeof value !== 'boolean') {
      throw new Error('Invalid cabinet parameter: ' + key);
    }
    if (typeof fallback === 'string' && typeof value !== 'string') {
      throw new Error('Invalid cabinet parameter: ' + key);
    }
  }

  if ('faceGap' in source && finiteNumber(source.faceGap) === null) {
    throw new Error('Invalid cabinet parameter: faceGap');
  }
  if ('sectionNodes' in source && treeErrors(source.sectionNodes).length) {
    throw new Error('Invalid cabinet parameter: sectionNodes (' + treeErrors(source.sectionNodes)[0] + ')');
  }
  for (const key of ['metalSlideCabinetHolesX', 'metalSlideDrawerHolesX', 'drawerCustomWeights', 'shelfPositions']) {
    if (!(key in source)) continue;
    const value = source[key];
    if (!Array.isArray(value) || value.some(item => typeof item !== 'number' || !Number.isFinite(item))) {
      throw new Error('Invalid cabinet parameter: ' + key);
    }
  }
}

function looksLikeCabinetWorkshopProject(raw: unknown): raw is Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return false;
  const record = raw as Record<string, unknown>;
  return (
    record.engineFamily === 'modular_organization'
    || ('values' in record && 'family' in record && !('parameters' in record))
  );
}

function importCabinetWorkshopProject(record: Record<string, unknown>): ParsedProject {
  if (!record.values || typeof record.values !== 'object' || Array.isArray(record.values)) {
    throw new Error('Cabinet Workshop project values are missing.');
  }

  const family = legacyFamily(record.family);
  const values = cloneJsonObject(record.values);
  const parameters = parametersFromFamilyValues(family, values);
  const valueRecord = values as Record<string, unknown>;
  const requestedStarter = typeof valueRecord._starter === 'string' ? valueRecord._starter : null;
  const starterId = requestedStarter && familyStarters(family).some(starter => starter.id === requestedStarter)
    ? requestedStarter
    : null;

  const name =
    typeof valueRecord.design_name === 'string' && valueRecord.design_name.trim()
      ? valueRecord.design_name.trim()
      : typeof record.name === 'string' && record.name.trim()
        ? record.name.trim()
        : 'Imported ' + familyDefinition(family).name;

  const warnings: string[] = [];
  if (valueRecord.cabinet_layout_mode === 'sections' && treeErrors(valueRecord.section_nodes).length) {
    warnings.push(
      'The saved section tree was invalid (' + treeErrors(valueRecord.section_nodes)[0] + '). '
      + 'The family adapter generated a safe fallback layout.',
    );
  }

  return {
    document: buildFamilyCabinetDocument(
      parameters,
      name.slice(0, 120),
      'mm',
      { family, starterId, familyValues: values },
    ),
    report: {
      source: 'cabinet-workshop',
      warnings,
      ignoredFieldCount: 0,
    },
  };
}

function legacyFamily(value: unknown): CabinetFamily {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < families.length) {
    return families[value];
  }

  if (typeof value === 'string') {
    const normalized = value.toLowerCase().replace(/[\s-]+/g, '_');
    const aliases: Record<string, CabinetFamily> = {
      shop_cart: 'shop_cart',
      shopcart: 'shop_cart',
      utility: 'utility',
      utility_cabinet: 'utility',
      benchtop: 'benchtop',
      benchtop_drawers: 'benchtop',
      stackable: 'stackable',
      stackable_cabinet: 'stackable',
      kitchen: 'kitchen',
      kitchen_cabinet: 'kitchen',
      drawer: 'drawer',
      standalone_drawer: 'drawer',
      equipment_stand: 'equipment_stand',
      equipmentstand: 'equipment_stand',
    };
    const family = aliases[normalized];
    if (family) return family;
  }

  throw new Error('Unsupported Cabinet Workshop cabinet family.');
}

function familyOr(value: unknown, fallback: CabinetFamily): CabinetFamily {
  return typeof value === 'string' && families.includes(value as CabinetFamily)
    ? value as CabinetFamily
    : fallback;
}

function jsonObjectOr(value: unknown, fallback: FamilyRecipeValues): FamilyRecipeValues {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return cloneJsonObject(fallback);
  return cloneJsonObject(value);
}

function cloneJsonObject(value: unknown): FamilyRecipeValues {
  try {
    const serialized = JSON.stringify(value ?? {});
    const parsed = JSON.parse(serialized) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as FamilyRecipeValues
      : {};
  } catch {
    return {};
  }
}

function finiteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
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
  return safeName(name) + '.cabinetws.json';
}

function safeName(name: string) {
  return name.trim().replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'cabinet';
}
