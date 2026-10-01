import { describe, expect, it } from 'vitest';
import { analyzeDesignHealth } from './designHealth';
import { buildFamilyCabinetDocument } from './familyModel';
import { familyStarter, parametersFromFamilyValues } from './familyCatalog';
import { buildFeatureGraph } from './kernel/featureGraph';
import { buildManufacturingModel } from './manufacturing';
import { buildShopDocumentation } from './shopDocs';
import { drawerScrewHeights, effectiveDrawerDadoDepth } from './drawerJoinery';

describe('drawer corner joinery parity', () => {
  it('preserves reference drawer modes and independent machining controls', () => {
    const starter = familyStarter('drawer');
    const values = {
      ...starter.values,
      drawer_joinery_style: 'dado',
      drawer_dado_depth: 3.5,
      drawer_dado_fit_clearance: 0.35,
      drawer_joint_fit_clearance: 0.45,
      drawer_screw_hole_diameter: 3.2,
      drawer_screw_edge_margin: 17,
    };
    const parameters = parametersFromFamilyValues('drawer', values);

    expect(parameters.drawerJoineryStyle).toBe('dado');
    expect(parameters.drawerDadoDepth).toBe(3.5);
    expect(parameters.drawerDadoFitClearance).toBe(0.35);
    expect(parameters.drawerJointFitClearance).toBe(0.45);
    expect(parameters.drawerScrewHoleDiameter).toBe(3.2);
    expect(parameters.drawerScrewEdgeMargin).toBe(17);

    for (const style of ['screw', 'tab_slot'] as const) {
      expect(parametersFromFamilyValues('drawer', {
        ...starter.values,
        drawer_joinery_style: style,
      }).drawerJoineryStyle).toBe(style);
    }
  });

  it('matches reference drawer dado receiver depth, clearance, and mating-panel extension', () => {
    expect(effectiveDrawerDadoDepth(9, 0)).toBe(0.1);
    expect(effectiveDrawerDadoDepth(9, 20)).toBe(8.5);

    const starter = familyStarter('drawer');
    const values = {
      ...starter.values,
      drawer_stock: 'custom_mm',
      custom_drawer_material_thickness: 9,
      drawer_joinery_style: 'dado',
      drawer_dado_depth: 3.5,
      drawer_dado_fit_clearance: 0.4,
    };
    const parameters = parametersFromFamilyValues('drawer', values);
    const document = buildFamilyCabinetDocument(parameters, 'Drawer dado parity', 'mm', {
      family: 'drawer',
      starterId: null,
      familyValues: values,
    });

    const left = document.parts.find(part => part.id === 'drawer:1:box:left')!;
    const right = document.parts.find(part => part.id === 'drawer:1:box:right')!;
    const front = document.parts.find(part => part.id === 'drawer:1:box:front')!;
    const dadoFeatures = left.renderFeatures?.filter(feature => feature.kind === 'dado') ?? [];

    expect(left.size.x).toBe(9);
    expect(dadoFeatures).toHaveLength(2);
    expect(dadoFeatures[0]).toMatchObject({
      sourcePartId: 'drawer:1:box:front',
      position: { x: 5.5, y: -0.2, z: -0.2 },
      size: { x: 3.5, y: 9.4 },
    });
    expect(right.renderFeatures?.filter(feature => feature.kind === 'dado')[0].position.x).toBe(0);
    expect(front.position.x).toBe(5.5);
    expect(front.size.x).toBeCloseTo(parameters.width - 2 * 9 + 2 * 3.5, 6);

    const graph = buildFeatureGraph(document);
    const graphDados = graph.partFeatures[left.id].filter(feature => feature.kind === 'dado');
    expect(graphDados).toHaveLength(2);
    expect(graphDados.every(feature => feature.size?.x === 3.5)).toBe(true);

    const health = analyzeDesignHealth(document);
    const docs = buildShopDocumentation(document, health);
    const manufacturing = buildManufacturingModel(document, docs, health);
    const leftManufacturing = manufacturing.parts.find(part => part.partId === left.id)!;
    const dadoOps = leftManufacturing.operations.filter(operation => operation.kind === 'DADO_GROOVE' && operation.sourceKind === 'dado');
    expect(dadoOps).toHaveLength(2);
    expect(dadoOps.every(operation => operation.depthMm === 3.5 && !operation.through)).toBe(true);
  });

  it('uses reference screw-guide placement and exports true through drilling', () => {
    expect(drawerScrewHeights({
      boxHeight: 60,
      edgeMargin: 15,
      diameter: 3,
      bottomCaptured: true,
      bottomGrooveZ: 6,
      bottomThickness: 6,
    })).toEqual([15.5, 45]);

    const starter = familyStarter('drawer');
    const values = {
      ...starter.values,
      drawer_stock: 'custom_mm',
      custom_drawer_material_thickness: 9,
      drawer_bottom_stock: 'custom_mm',
      custom_drawer_bottom_thickness: 6,
      drawer_joinery_style: 'screw',
      drawer_screw_hole_diameter: 3,
      drawer_screw_edge_margin: 15,
      drawer_bottom_joinery: 'dado',
      drawer_bottom_inset: 6,
    };
    const parameters = parametersFromFamilyValues('drawer', values);
    const document = buildFamilyCabinetDocument(parameters, 'Drawer screw parity', 'mm', {
      family: 'drawer',
      starterId: null,
      familyValues: values,
    });
    const left = document.parts.find(part => part.id === 'drawer:1:box:left')!;
    const cornerDrills = left.renderFeatures?.filter(feature =>
      feature.kind === 'drill' &&
      (feature.sourcePartId === 'drawer:1:box:front' || feature.sourcePartId === 'drawer:1:box:back')
    ) ?? [];

    expect(cornerDrills.length).toBeGreaterThanOrEqual(2);
    expect(new Set(cornerDrills.map(feature => feature.position.y + feature.size.y / 2))).toEqual(
      new Set([4.5, parameters.depth - 4.5]),
    );
    expect(cornerDrills.every(feature => feature.size.x === 9 && feature.size.y === 3 && feature.size.z === 3)).toBe(true);

    const graph = buildFeatureGraph(document);
    const cornerHoles = graph.partFeatures[left.id].filter(feature =>
      feature.kind === 'hole' &&
      (feature.parameters.sourcePartId === 'drawer:1:box:front' ||
        feature.parameters.sourcePartId === 'drawer:1:box:back')
    );
    expect(cornerHoles).toHaveLength(cornerDrills.length);
    expect(cornerHoles.every(feature => feature.axis === 'x')).toBe(true);

    const health = analyzeDesignHealth(document);
    const docs = buildShopDocumentation(document, health);
    const manufacturing = buildManufacturingModel(document, docs, health);
    const leftManufacturing = manufacturing.parts.find(part => part.partId === left.id)!;
    const cornerFeatureIds = new Set(cornerHoles.map(feature => feature.id));
    const drillOps = leftManufacturing.operations.filter(operation =>
      operation.kind === 'DRILL' &&
      operation.featureId !== undefined &&
      cornerFeatureIds.has(operation.featureId)
    );
    expect(drillOps).toHaveLength(cornerDrills.length);
    expect(drillOps.every(operation =>
      operation.sourceKind === 'hole' && operation.through && operation.depthMm === 9
    )).toBe(true);
  });

  it('reports reference-invalid screw margins instead of relocating guides', () => {
    const starter = familyStarter('drawer');
    const values = {
      ...starter.values,
      drawer_joinery_style: 'screw',
      drawer_screw_hole_diameter: 8,
      drawer_screw_edge_margin: 5,
    };
    const parameters = parametersFromFamilyValues('drawer', values);
    const document = buildFamilyCabinetDocument(parameters, 'Invalid screw margin', 'mm', {
      family: 'drawer',
      starterId: null,
      familyValues: values,
    });

    expect(analyzeDesignHealth(document).checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'drawer-screw-margin-drawer:1:box:left',
        severity: 'error',
        category: 'manufacturing',
      }),
      expect.objectContaining({
        id: 'drawer-screw-margin-drawer:1:box:right',
        severity: 'error',
        category: 'manufacturing',
      }),
    ]));
  });

  it('applies the same dado corner construction to shared-cabinet drawer boxes', () => {
    const starter = familyStarter('utility');
    const parameters = {
      ...starter.parameters,
      drawerJoineryStyle: 'dado' as const,
      drawerDadoDepth: 3,
      drawerDadoFitClearance: 0.25,
      drawerMaterialThickness: 10,
    };
    const document = buildFamilyCabinetDocument(parameters, 'Utility dado drawer', 'mm', {
      family: 'utility',
      starterId: null,
      familyValues: starter.values,
    });
    const left = document.parts.find(part => /:box:left$/.test(part.id))!;
    const front = document.parts.find(part => part.id === left.id.replace(/left$/, 'front'))!;

    expect(left).toBeTruthy();
    expect(front).toBeTruthy();
    expect(left.renderFeatures?.filter(feature => feature.kind === 'dado')).toHaveLength(2);
    expect(front.size.x).toBeGreaterThan(
      document.parts.find(part => part.id === left.id.replace(/left$/, 'right'))!.position.x - left.position.x - 10,
    );
  });

  it('models mating drawer tabs and slots without substituting rabbet geometry', () => {
    const starter = familyStarter('drawer');
    const values = {
      ...starter.values,
      drawer_joinery_style: 'tab_slot',
      drawer_joint_fit_clearance: 0.55,
    };
    const parameters = parametersFromFamilyValues('drawer', values);
    const document = buildFamilyCabinetDocument(parameters, 'Drawer tab-slot pending', 'mm', {
      family: 'drawer',
      starterId: null,
      familyValues: values,
    });
    const left = document.parts.find(part => part.id === 'drawer:1:box:left')!;

    expect(parameters.drawerJoineryStyle).toBe('tab_slot');
    expect(parameters.drawerJointFitClearance).toBe(0.55);
    expect(left.renderFeatures?.some(feature => feature.kind === 'rabbet')).toBe(false);
    expect(left.renderFeatures?.some(feature => feature.semanticRole === 'tab-slot-receiver')).toBe(true);
    expect(analyzeDesignHealth(document).checks.some(check => check.id === 'drawer-tab-slot-not-modeled')).toBe(false);
  });
});
