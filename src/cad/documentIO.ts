import { buildCabinetDocument, sanitizeParameters } from './cabinetModel';
import type { CabinetDocument, CabinetParameters } from './types';
import type { DisplayUnits } from './units';

type StoredDocumentV1 = {
  version: 1;
  name: string;
  units?: 'mm';
  parameters: CabinetParameters;
};

type StoredDocumentV2 = {
  version: 2;
  name: string;
  units: 'mm';
  displayUnits: DisplayUnits;
  parameters: CabinetParameters;
};

const numericKeys: (keyof CabinetParameters)[] = [
  'width',
  'height',
  'depth',
  'materialThickness',
  'backThickness',
  'shelfCount',
  'doorCount',
  'drawerCount',
  'toeKickHeight',
  'toeKickDepth',
  'faceGap',
];

export function serializeDocument(cadDocument: CabinetDocument) {
  const stored: StoredDocumentV2 = {
    version: 2,
    name: cadDocument.name,
    units: 'mm',
    displayUnits: cadDocument.displayUnits,
    parameters: cadDocument.parameters,
  };
  return JSON.stringify(stored, null, 2);
}

export function parseDocument(text: string): CabinetDocument {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON.');
  }

  const migrated = migrateDocument(raw);
  return buildCabinetDocument(
    sanitizeParameters(migrated.parameters),
    migrated.name.slice(0, 120),
    migrated.displayUnits,
  );
}

export function migrateDocument(raw: unknown): StoredDocumentV2 {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Unsupported or invalid Cabinet WS document.');
  }

  const record = raw as Record<string, unknown>;
  if (typeof record.name !== 'string' || !record.name.trim()) {
    throw new Error('Cabinet document name is missing.');
  }

  const parameters = validateParameters(record.parameters);

  if (record.version === 1) {
    const legacy = record as unknown as StoredDocumentV1;
    if (legacy.units !== undefined && legacy.units !== 'mm') {
      throw new Error('Legacy documents must store geometry in millimeters.');
    }
    return {
      version: 2,
      name: record.name,
      units: 'mm',
      displayUnits: 'mm',
      parameters,
    };
  }

  if (record.version === 2) {
    if (record.units !== 'mm') {
      throw new Error('Cabinet geometry must be stored in millimeters.');
    }
    if (record.displayUnits !== 'mm' && record.displayUnits !== 'in') {
      throw new Error('Invalid display units.');
    }
    return {
      version: 2,
      name: record.name,
      units: 'mm',
      displayUnits: record.displayUnits,
      parameters,
    };
  }

  throw new Error('Unsupported Cabinet WS document version.');
}

function validateParameters(value: unknown): CabinetParameters {
  if (!value || typeof value !== 'object') {
    throw new Error('Cabinet parameters are missing.');
  }

  const source = value as Record<string, unknown>;
  for (const key of numericKeys) {
    const candidate = source[key];
    if (typeof candidate !== 'number' || !Number.isFinite(candidate)) {
      throw new Error(`Invalid cabinet parameter: ${key}`);
    }
  }

  return sanitizeParameters(source as Partial<CabinetParameters>);
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
