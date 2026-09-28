import { describe, expect, it } from 'vitest';
import { buildCabinetDocument, DEFAULT_PARAMETERS } from './cabinetModel';
import { parseDocument, serializeDocument } from './documentIO';

describe('Cabinet WS project migrations', () => {
  it('migrates schema v1 projects to v2 with millimeter display units', () => {
    const legacy = JSON.stringify({
      version: 1,
      name: 'Legacy cabinet',
      units: 'mm',
      parameters: DEFAULT_PARAMETERS,
    });

    const document = parseDocument(legacy);
    expect(document.version).toBe(2);
    expect(document.displayUnits).toBe('mm');
    expect(document.parameters).toEqual(DEFAULT_PARAMETERS);
  });

  it('round-trips schema v2 display-unit preferences without converting geometry', () => {
    const original = buildCabinetDocument(DEFAULT_PARAMETERS, 'Imperial display', 'in');
    const loaded = parseDocument(serializeDocument(original));

    expect(loaded.displayUnits).toBe('in');
    expect(loaded.parameters.width).toBe(DEFAULT_PARAMETERS.width);
    expect(loaded.parameters.materialThickness).toBe(DEFAULT_PARAMETERS.materialThickness);
  });

  it('rejects malformed parameter types instead of silently normalizing them', () => {
    const malformed = JSON.stringify({
      version: 2,
      name: 'Bad cabinet',
      units: 'mm',
      displayUnits: 'mm',
      parameters: { ...DEFAULT_PARAMETERS, width: 'wide' },
    });

    expect(() => parseDocument(malformed)).toThrow(/width/);
  });
});
