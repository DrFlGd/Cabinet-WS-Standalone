import { describe, expect, it } from 'vitest';
import { buildCabinetDocument, DEFAULT_PARAMETERS } from './cabinetModel';
import { parseDocument, parseDocumentWithReport, serializeDocument } from './documentIO';

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
    expect(document.family).toBe('utility');
    expect(document.displayUnits).toBe('mm');
    expect(document.parameters).toEqual(DEFAULT_PARAMETERS);
  });

  it('migrates early standalone faceGap projects into separate front controls', () => {
    const oldV2 = JSON.stringify({
      version: 2,
      name: 'v0.2 cabinet',
      units: 'mm',
      displayUnits: 'mm',
      parameters: {
        width: 762,
        height: 876,
        depth: 610,
        materialThickness: 19.05,
        backThickness: 6.35,
        shelfCount: 1,
        doorCount: 2,
        drawerCount: 2,
        toeKickHeight: 102,
        toeKickDepth: 76,
        faceGap: 4,
      },
    });

    const document = parseDocument(oldV2);
    expect(document.parameters.frontEdgeReveal).toBe(4);
    expect(document.parameters.doorGap).toBe(4);
    expect(document.parameters.drawerGap).toBe(4);
    expect(document.parameters.carcassStock).toBe('custom_mm');
  });

  it('round-trips schema v2 display-unit preferences without converting geometry', () => {
    const original = buildCabinetDocument(DEFAULT_PARAMETERS, 'Imperial display', 'in');
    const loaded = parseDocument(serializeDocument(original));

    expect(loaded.displayUnits).toBe('in');
    expect(loaded.parameters.width).toBe(DEFAULT_PARAMETERS.width);
    expect(loaded.parameters.materialThickness).toBe(DEFAULT_PARAMETERS.materialThickness);
  });

  it('imports a Cabinet Workshop Utility project into supported v0.3 parameters', () => {
    const webProject = JSON.stringify({
      version: 2,
      engine: 5,
      engineFamily: 'modular_organization',
      family: 1,
      values: {
        design_name: 'Imported Web Utility',
        cabinet_width: 900,
        cabinet_height: 1800,
        cabinet_depth: 500,
        carcass_stock: '3/4_nominal',
        back_stock: '1/4_nominal',
        custom_carcass_thickness: 18,
        custom_back_thickness: 6,
        cabinet_contents: 'doors',
        drawer_count: 0,
        door_count: 2,
        door_shelf_count: 4,
        shelf_style: 'adjustable',
        top_style: 'stretchers',
        top_stretcher_depth: 90,
        back_style: 'panel',
        cabinet_mount_style: 'floor',
        base_style: 'toe_kick',
        custom_toe_kick_height: 100,
        custom_toe_kick_setback: 65,
        bottom_width_style: 'joined',
        include_worktop: false,
        joinery_style: 'dado',
        dado_depth: 6,
        dado_fit_clearance: 0.2,
        front_mount_style: 'overlay',
        front_edge_reveal: 2,
        door_gap: 3,
        drawer_gap: 3,
        cabinet_layout_mode: 'legacy',
        hinge_style: 'none',
        drawer_mount: 'wood_rails',
        output_mode: 'assembly',
      },
    });

    const parsed = parseDocumentWithReport(webProject);
    expect(parsed.report.source).toBe('cabinet-workshop');
    expect(parsed.document.name).toBe('Imported Web Utility');
    expect(parsed.document.parameters).toMatchObject({
      width: 900,
      height: 1800,
      depth: 500,
      carcassStock: '3/4_nominal',
      backStock: '1/4_nominal',
      cabinetContents: 'doors',
      shelfCount: 4,
      shelfStyle: 'adjustable',
      joineryStyle: 'dado',
      dadoDepth: 6,
    });
    expect(parsed.report.ignoredFieldCount).toBeGreaterThan(0);
  });

  it('warns when importing a web Utility layout that depends on future Sections support', () => {
    const parsed = parseDocumentWithReport(JSON.stringify({
      version: 2,
      engineFamily: 'modular_organization',
      family: 1,
      values: {
        design_name: 'Mixed bay source',
        cabinet_width: 1200,
        cabinet_height: 900,
        cabinet_depth: 610,
        cabinet_layout_mode: 'mixed_bays',
        cabinet_contents: 'drawers',
      },
    }));

    expect(parsed.report.warnings.join(' ')).toMatch(/mixed_bays/);
  });

  it('rejects non-Utility Cabinet Workshop projects in v0.3', () => {
    expect(() => parseDocument(JSON.stringify({
      version: 2,
      engineFamily: 'modular_organization',
      family: 4,
      values: {},
    }))).toThrow(/Utility Cabinet/);
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
