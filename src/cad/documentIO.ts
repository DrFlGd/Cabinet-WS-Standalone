import { buildCabinetDocument, sanitizeParameters } from './cabinetModel';
import type { CabinetDocument } from './types';

export function serializeDocument(cadDocument: CabinetDocument) {
  return JSON.stringify({
    version: 1,
    name: cadDocument.name,
    units: 'mm',
    parameters: cadDocument.parameters,
  }, null, 2);
}

export function parseDocument(text: string): CabinetDocument {
  const raw = JSON.parse(text) as Partial<CabinetDocument>;
  if (raw.version !== 1 || !raw.parameters || typeof raw.name !== 'string') {
    throw new Error('Unsupported or invalid Cabinet WS document.');
  }
  return buildCabinetDocument(sanitizeParameters(raw.parameters), raw.name.slice(0, 120));
}

export function downloadDocument(cadDocument: CabinetDocument) {
  const blob = new Blob([serializeDocument(cadDocument)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${safeName(cadDocument.name)}.cabinetws.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function safeName(name: string) {
  return name.trim().replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'cabinet';
}
