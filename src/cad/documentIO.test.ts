import { describe, expect, it } from 'vitest';
import { buildCabinetDocument, DEFAULT_PARAMETERS } from './cabinetModel';
import { parseDocument, parseDocumentWithReport, serializeDocument } from './documentIO';

describe('Cabinet WS project migrations', () => {
  it('migrates schema v1 projects to v3 with millimeter display units', () => {
    const legacy = JSON.stringify({
      version: 1,
      name: 'Legacy cabinet',
      units: 'mm',
      parameters: DEFAULT_PARAMETERS,
    });

    const document = parseDocument(legacy);
    expect(document.version).toBe(3);
    expect(document.family).toBe('utility');
    expect(document.displayUnits).toBe('mm');
    expect(document.parameters).toEqual(DEFAULT_PARAMETERS);
  });

  it('migrates early standalone faceGap projects into separate front controls and legacy layout mode', () => {
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
    expect(document.parameters.layoutMode).toBe('legacy');
  });

  it('round-trips schema v3 section layouts without converting geometry', () => {
    const original = buildCabinetDocument({
      ...DEFAULT_PARAMETERS,
      layoutMode: 'sections',
    }, 'Section cabinet', 'in');
    const loaded = parseDocument(serializeDocument(original));

    expect(loaded.displayUnits).toBe('in');
    expect(loaded.parameters.width).toBe(DEFAULT_PARAMETERS.width);
    expect(loaded.parameters.sectionNodes).toEqual(DEFAULT_PARAMETERS.sectionNodes);
  });

  it('imports a Cabinet Workshop Utility project into supported standalone parameters', () => {
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
      layoutMode: 'legacy',
      cabinetContents: 'doors',
      shelfCount: 4,
      shelfStyle: 'adjustable',
      joineryStyle: 'dado',
      dadoDepth: 6,
    });
    expect(parsed.report.ignoredFieldCount).toBeGreaterThan(0);
  });

  it('converts Cabinet Workshop mixed bays into the v0.4 section tree', () => {
    const parsed = parseDocumentWithReport(JSON.stringify({
      version: 2,
      engineFamily: 'modular_organization',
      family: 1,
      values: {
        design_name: 'Mixed bay source',
        cabinet_width: 1400,
        cabinet_height: 900,
        cabinet_depth: 610,
        cabinet_layout_mode: 'mixed_bays',
        mixed_bay_count: 3,
        mixed_bay_types: ['drawers', 'drawers', 'door', 'open'],
        mixed_bay_width_weights: [1, 1, 1.2, 1],
        mixed_bay_drawer_counts: [4, 3, 0, 0],
        mixed_bay_shelf_counts: [0, 0, 2, 0],
        mixed_bay_door_counts: [1, 1, 1, 1],
        include_mixed_bay_partitions: true,
        cabinet_contents: 'combo',
      },
    }));

    expect(parsed.document.parameters.layoutMode).toBe('sections');
    expect(parsed.document.parameters.sectionNodes).toHaveLength(4);
    expect(parsed.document.parameters.sectionNodes[0][2]).toBe('x');
    expect(parsed.document.parameters.sectionNodes[3][5]).toBe('doors');
    expect(parsed.document.parameters.sectionNodes[3][11]).toBe(2);
    expect(parsed.report.warnings.join(' ')).not.toMatch(/mixed_bays/);
  });

  it('preserves custom drawer-height weights when converting web mixed bays', () => {
    const parsed = parseDocumentWithReport(JSON.stringify({
      version: 2,
      engineFamily: 'modular_organization',
      family: 1,
      values: {
        cabinet_width: 1200,
        cabinet_height: 900,
        cabinet_depth: 610,
        cabinet_layout_mode: 'mixed_bays',
        mixed_bay_count: 2,
        mixed_bay_types: ['drawers', 'drawers'],
        mixed_bay_width_weights: [1, 2],
        mixed_bay_drawer_counts: [3, 2],
        mixed_bay_drawer_height_modes: ['custom_weights', 'graduated'],
        mixed_bay_drawer_graduated_steps: [0.35, 0.5],
        mixed_bay_drawer_height_weights: [[0.75, 1, 1.5], [1, 1]],
        include_mixed_bay_partitions: true,
      },
    }));

    const nodes = parsed.document.parameters.sectionNodes;
    expect(nodes[1][7]).toBe('custom_weights');
    expect(nodes[1][9]).toEqual([0.75, 1, 1.5]);
    expect(nodes[2][7]).toBe('graduated');
    expect(nodes[2][8]).toBe(0.5);
  });

  it('imports a valid web section tree without rewriting it', () => {
    const sectionNodes = [
      [-1, 0, 'x', 'weight', 1, 'open', 0, 'equal', 0.25, [1], 'panel', 0],
      [0, 0, 'leaf', 'weight', 1, 'drawers', 3, 'equal', 0.25, [1, 1, 1], 'panel', 0],
      [0, 1, 'leaf', 'mm', 320, 'doors', 2, 'equal', 0.25, [1, 1], 'panel', 2],
    ];

    const parsed = parseDocumentWithReport(JSON.stringify({
      version: 2,
      engineFamily: 'modular_organization',
      family: 1,
      values: {
        cabinet_width: 1000,
        cabinet_height: 900,
        cabinet_depth: 610,
        cabinet_layout_mode: 'sections',
        section_nodes: sectionNodes,
      },
    }));

    expect(parsed.document.parameters.layoutMode).toBe('sections');
    expect(parsed.document.parameters.sectionNodes).toEqual(sectionNodes);
    expect(parsed.report.warnings).toEqual([]);
  });

  it('imports non-Utility Cabinet Workshop families into schema v3', () => {
    const kitchen = parseDocument(JSON.stringify({
      version: 2,
      engineFamily: 'modular_organization',
      family: 4,
      values: {
        design_name: 'Kitchen import',
        cabinet_width: 762,
        cabinet_height: 876.3,
        cabinet_nominal_depth: 609.6,
        cabinet_contents: 'combo',
        drawer_count: 1,
        door_count: 2,
        door_shelf_count: 1,
        front_facing_style: 'face_frame',
        custom_face_frame_thickness: 19.05,
      },
    }));
    expect(kitchen.version).toBe(3);
    expect(kitchen.family).toBe('kitchen');
    expect(kitchen.name).toBe('Kitchen import');
    expect(kitchen.parameters.width).toBe(762);
    expect(kitchen.familyValues.cabinet_nominal_depth).toBe(609.6);
  });

  it('round-trips family identity, starter identity, and retained recipe values', () => {
    const parsed = parseDocumentWithReport(JSON.stringify({
      version: 2,
      engineFamily: 'modular_organization',
      family: 5,
      values: {
        _starter: 'drawer_42_mm_grid_10_x_8',
        design_name: 'Grid drawer',
        drawer_design_basis: 'modular_grid',
        drawer_module_pitch_x: 42,
        drawer_module_count_x: 10,
        drawer_module_pitch_y: 42,
        drawer_module_count_y: 8,
        drawer_module_inside_height: 85,
        custom_drawer_material_thickness: 12,
        custom_drawer_bottom_thickness: 6,
      },
    }));
    const loaded = parseDocument(serializeDocument(parsed.document));
    expect(loaded.family).toBe('drawer');
    expect(loaded.starterId).toBe('drawer_42_mm_grid_10_x_8');
    expect(loaded.familyValues.drawer_design_basis).toBe('modular_grid');
    expect(loaded.parts.some(part => part.id === 'drawer:1:bottom')).toBe(true);
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
