import { describe, expect, it } from 'vitest';
import rawFixtures from './data/familyParityReferenceFixtures.json';
import { FAMILY_DEFINITIONS, familyStarter, parametersFromFamilyValues } from './familyCatalog';
import {
  FAMILY_CAPABILITY_REFERENCE_COMMIT,
  FAMILY_CAPABILITY_STANDALONE_BASE,
  familyCapabilityFor,
  familyCapabilityRows,
  familyCapabilitySummary,
} from './familyParityAudit';
import { familyFieldDefinitions } from './familySettings';
import { buildFamilyCabinetDocument } from './familyModel';
import { buildFeatureGraph } from './kernel/featureGraph';
import { sectionLeaf } from './sections';
import type { CabinetFamily, FamilyRecipeValues, SectionNode } from './types';

type ReferenceFixture = {
  id: string;
  family: CabinetFamily;
  starterId?: string;
  reference: {
    inputs: Record<string, unknown>;
    expected: Record<string, unknown>;
  };
  standaloneExpectation: 'known-gap' | 'focused-implemented';
};

const fixtures = (rawFixtures as { fixtures: ReferenceFixture[] }).fixtures;

function fixture(id: string) {
  const found = fixtures.find(candidate => candidate.id === id);
  if (!found) throw new Error('Missing family parity fixture: ' + id);
  return found;
}

function recipeWithPatch(base: FamilyRecipeValues, patch: Record<string, unknown>): FamilyRecipeValues {
  return { ...base, ...patch } as FamilyRecipeValues;
}

function geometrySnapshot(document: ReturnType<typeof buildFamilyCabinetDocument>) {
  return document.parts.map(part => ({
    id: part.id,
    position: part.position,
    size: part.size,
    geometry: part.geometry ?? null,
    renderFeatures: part.renderFeatures ?? [],
  }));
}

describe('family parity audit', () => {
  it('covers every family setting exactly once without treating coverage as parity', () => {
    expect(FAMILY_CAPABILITY_STANDALONE_BASE).toBe('5a03133fac30644e0d7cb035f2d8a7b147e1bef3');
    expect(FAMILY_CAPABILITY_REFERENCE_COMMIT).toBe('2255216ef7808895ec404bf34a0fb8f8a7b8abe4');
    expect(familyCapabilityRows()).toHaveLength(1678);

    for (const family of FAMILY_DEFINITIONS) {
      const schemaKeys = familyFieldDefinitions(family.id).map(field => field.key).sort();
      const auditRows = familyCapabilityRows(family.id);
      expect(auditRows.map(row => row.key).sort(), family.id).toEqual(schemaKeys);
      expect(new Set(auditRows.map(row => row.key)).size, family.id).toBe(schemaKeys.length);
      expect(familyCapabilitySummary(family.id).total, family.id).toBe(schemaKeys.length);
    }

    expect(familyCapabilityFor('utility', 'output_mode')?.status).toBe('compatibility-only');
    expect(familyCapabilityFor('utility', 'target_dimension_mode')).toMatchObject({
      status: 'unsupported',
      parity: 'known-gap',
    });
    expect(familyCapabilityFor('drawer', 'drawer_joinery_style')).toMatchObject({
      status: 'geometry-driving',
      parity: 'unverified',
    });
    expect(familyCapabilityFor('equipment_stand', 'cleat_angle')).toMatchObject({
      status: 'unsupported',
      parity: 'known-gap',
    });
  });

  it('records proven shared-cabinet tab-slot clearance ownership without closing broader parity gaps', () => {
    const families: CabinetFamily[] = ['shop_cart', 'utility', 'benchtop', 'stackable', 'kitchen'];
    for (const family of families) {
      expect(familyCapabilityFor(family, 'joint_fit_clearance'), family).toMatchObject({
        status: 'geometry-driving',
        owner: 'family-adapter+native-generator',
        parity: 'unverified',
      });
      expect(familyCapabilityFor(family, 'joinery_style'), family).toMatchObject({
        status: 'geometry-driving',
        parity: 'known-gap',
      });
    }

    const starter = familyStarter('utility');
    const values = recipeWithPatch(starter.values, {
      joinery_style: 'tab_slot',
      joint_fit_clearance: 0.55,
    });
    const parameters = parametersFromFamilyValues('utility', values);
    const document = buildFamilyCabinetDocument(parameters, 'Tab-slot audit', 'mm', {
      family: 'utility',
      starterId: null,
      familyValues: values,
    });
    const graph = buildFeatureGraph(document);
    const receivers = graph.partFeatures['carcass:left'].filter(feature => feature.semanticRole === 'tab-slot-receiver');

    expect(receivers.length).toBeGreaterThan(2);
    expect(receivers.every(feature => feature.parameters.clearance === 0.55)).toBe(true);
    expect(document.parts.find(part => part.id === 'carcass:bottom')?.metadata?.tabSlotMatingTabs).toBe(true);
  });

  it('keeps Equipment Stand windows distinct from new joint receivers', () => {
    const starter = familyStarter('equipment_stand', 'equipment_stand_tab_slot_full_back_stand');
    const document = buildFamilyCabinetDocument(starter.parameters, starter.name, 'mm', {
      family: starter.family,
      starterId: starter.id,
      familyValues: starter.values,
    });
    const graph = buildFeatureGraph(document);

    const left = document.parts.find(part => part.id === 'carcass:left')!;
    expect((left.geometry?.holes ?? []).some(hole => hole.kind === 'rect')).toBe(true);
    expect(graph.partFeatures['carcass:left'].some(feature => feature.semanticRole === 'through-cutout')).toBe(true);
    expect(graph.partFeatures['carcass:left'].some(feature => feature.semanticRole === 'tab-slot-receiver')).toBe(true);
    expect(document.parts.find(part => part.id === 'carcass:bottom')?.metadata?.tabSlotMatingTabs).toBe(true);
    expect(familyCapabilityFor('equipment_stand', 'joinery_style')).toMatchObject({
      parity: 'known-gap',
    });
  });

  it('classifies helper-resolved drawer stock and measured thickness as geometry-driving', () => {
    const families: CabinetFamily[] = ['shop_cart', 'utility', 'benchtop', 'stackable', 'kitchen', 'drawer'];
    const keys = [
      'drawer_stock',
      'drawer_bottom_stock',
      'drawer_front_stock',
      'custom_drawer_material_thickness',
      'custom_drawer_bottom_thickness',
      'custom_drawer_front_thickness',
    ];

    for (const family of families) {
      const schemaKeys = new Set(familyFieldDefinitions(family).map(field => field.key));
      for (const key of keys.filter(candidate => schemaKeys.has(candidate))) {
        expect(familyCapabilityFor(family, key), family + ':' + key).toMatchObject({
          status: 'geometry-driving',
          owner: 'family-adapter',
        });
      }
    }

    const starter = familyStarter('drawer');
    const values = recipeWithPatch(starter.values, {
      drawer_stock: 'custom_mm',
      custom_drawer_material_thickness: 9,
      drawer_bottom_stock: 'custom_mm',
      custom_drawer_bottom_thickness: 4,
      drawer_front_stock: 'custom_mm',
      custom_drawer_front_thickness: 13,
      drawer_face_style: 'overlay',
    });
    const parameters = parametersFromFamilyValues('drawer', values);
    expect(parameters.drawerMaterialThickness).toBe(9);
    expect(parameters.drawerBottomThickness).toBe(4);
    expect(parameters.drawerFrontThickness).toBe(13);

    const document = buildFamilyCabinetDocument(parameters, 'Measured drawer stock audit', 'mm', {
      family: 'drawer',
      starterId: starter.id,
      familyValues: values,
    });
    expect(document.parts.find(part => part.id === 'drawer:1:box:left')?.size.x).toBe(9);
    expect(document.parts.find(part => part.id === 'drawer:1:bottom')?.size.z).toBe(4);
    expect(document.parts.find(part => part.id === 'drawer:1:front')?.size.y).toBe(13);
  });

  it('classifies Kitchen section_nodes as layout-driving and applies the supplied section tree', () => {
    expect(familyCapabilityFor('kitchen', 'section_nodes')).toMatchObject({
      status: 'geometry-driving',
      owner: 'layout-converter',
    });

    const starter = familyStarter('kitchen', 'photo_section_cabinet');
    const root = sectionLeaf();
    root[2] = 'x';
    root[10] = 'panel';
    const drawers = sectionLeaf(0, 0, 'drawers', 2);
    drawers[4] = 1;
    const doors = sectionLeaf(0, 1, 'doors', 1);
    doors[4] = 2;
    doors[11] = 1;
    const sectionNodes: SectionNode[] = [root, drawers, doors];
    const values = recipeWithPatch(starter.values, {
      cabinet_layout_mode: 'sections',
      section_nodes: sectionNodes,
    });

    const parameters = parametersFromFamilyValues('kitchen', values);
    expect(parameters.layoutMode).toBe('sections');
    expect(parameters.sectionNodes).toEqual(sectionNodes);

    const document = buildFamilyCabinetDocument(parameters, 'Kitchen section-node audit', 'mm', {
      family: 'kitchen',
      starterId: starter.id,
      familyValues: values,
    });
    expect(document.parts.filter(part => /section:\d+:drawer:\d+:front/.test(part.id))).toHaveLength(2);
    expect(document.parts.filter(part => /section:\d+:door:\d+/.test(part.id))).toHaveLength(1);
    expect(document.parts.some(part => part.metadata?.sectionDivider === true)).toBe(true);
  });

  it('records the independent Utility modular-grid target oracle and the current unresolved behavior', () => {
    const auditFixture = fixture('utility-modular-fit-target');
    const starter = familyStarter('utility');
    const parameters = parametersFromFamilyValues(
      'utility',
      recipeWithPatch(starter.values, auditFixture.reference.inputs),
    );
    const expected = auditFixture.reference.expected as {
      cabinetOutsideMm: { width: number; depth: number; height: number };
      drawerInsideClearMm: { width: number; depth: number; height: number };
    };

    expect(expected.cabinetOutsideMm).toEqual({ width: 520, depth: 384, height: 900 });
    expect(expected.drawerInsideClearMm).toEqual({ width: 422, depth: 338, height: 116.8 });

    // Cabinet Workshop's recorded oracle solves the envelope to 520 x 384.
    // Standalone currently preserves the ordinary Utility envelope because
    // target_dimension_* / target_module_* are retained recipe data only.
    expect(parameters.width).toBe(starter.parameters.width);
    expect(parameters.depth).toBe(starter.parameters.depth);
    expect(parameters.width).not.toBe(expected.cabinetOutsideMm.width);
    expect(parameters.depth).not.toBe(expected.cabinetOutsideMm.depth);
  });

  it('preserves distinct drawer joinery intent and no longer maps reference modes to rabbet', () => {
    const starter = familyStarter('drawer');
    const dadoValues = recipeWithPatch(starter.values, {
      drawer_joinery_style: 'dado',
      drawer_dado_depth: 3.5,
      drawer_dado_fit_clearance: 0.4,
    });
    const tabValues = recipeWithPatch(starter.values, {
      drawer_joinery_style: 'tab_slot',
      drawer_joint_fit_clearance: 0.55,
    });
    const dadoParameters = parametersFromFamilyValues('drawer', dadoValues);
    const tabParameters = parametersFromFamilyValues('drawer', tabValues);

    expect(dadoParameters.drawerJoineryStyle).toBe('dado');
    expect(tabParameters.drawerJoineryStyle).toBe('tab_slot');

    const dadoDocument = buildFamilyCabinetDocument(dadoParameters, 'Dado audit', 'mm', {
      family: 'drawer',
      starterId: null,
      familyValues: dadoValues,
    });
    const tabDocument = buildFamilyCabinetDocument(tabParameters, 'Tab audit', 'mm', {
      family: 'drawer',
      starterId: null,
      familyValues: tabValues,
    });

    expect(geometrySnapshot(dadoDocument)).not.toEqual(geometrySnapshot(tabDocument));
    expect(
      buildFeatureGraph(dadoDocument).partFeatures['drawer:1:box:left']
        .filter(feature => feature.kind === 'dado'),
    ).toHaveLength(2);
    expect(
      buildFeatureGraph(tabDocument).partFeatures['drawer:1:box:left']
        .some(feature => feature.kind === 'rabbet'),
    ).toBe(false);
  });

  it('applies independent divider bottom and perimeter groove depths', () => {
    const starter = familyStarter('drawer', 'drawer_450_mm_opening_4x3_divider_grid');
    const bottomOnly = recipeWithPatch(starter.values, {
      drawer_divider_mounting: 'bottom_only',
      drawer_divider_bottom_groove_depth: 1.25,
      drawer_divider_perimeter_groove_depth: 1.5,
    });
    const perimeter = recipeWithPatch(starter.values, {
      drawer_divider_mounting: 'bottom_and_perimeter',
      drawer_divider_bottom_groove_depth: 4.5,
      drawer_divider_perimeter_groove_depth: 5,
    });

    const bottomDocument = buildFamilyCabinetDocument(
      parametersFromFamilyValues('drawer', bottomOnly),
      'Bottom only divider audit',
      'mm',
      { family: 'drawer', starterId: starter.id, familyValues: bottomOnly },
    );
    const perimeterDocument = buildFamilyCabinetDocument(
      parametersFromFamilyValues('drawer', perimeter),
      'Perimeter divider audit',
      'mm',
      { family: 'drawer', starterId: starter.id, familyValues: perimeter },
    );

    expect(geometrySnapshot(bottomDocument)).not.toEqual(geometrySnapshot(perimeterDocument));
    expect(buildFeatureGraph(bottomDocument)).not.toEqual(buildFeatureGraph(perimeterDocument));
  });

  it('keeps French-cleat angle metadata separate from the still-rectangular Standalone geometry', () => {
    const starter = familyStarter('equipment_stand', 'equipment_stand_skeletonized_wall_stand');
    const shallowValues = recipeWithPatch(starter.values, { cleat_angle: 30 });
    const steepValues = recipeWithPatch(starter.values, { cleat_angle: 55 });

    const shallow = buildFamilyCabinetDocument(
      parametersFromFamilyValues('equipment_stand', shallowValues),
      '30 degree cleat audit',
      'mm',
      { family: 'equipment_stand', starterId: starter.id, familyValues: shallowValues },
    );
    const steep = buildFamilyCabinetDocument(
      parametersFromFamilyValues('equipment_stand', steepValues),
      '55 degree cleat audit',
      'mm',
      { family: 'equipment_stand', starterId: starter.id, familyValues: steepValues },
    );

    const cleatShape = (document: typeof shallow) => document.parts
      .filter(part => part.id.startsWith('mount:cleat:'))
      .map(part => ({ id: part.id, position: part.position, size: part.size, geometry: part.geometry ?? null }));

    expect(cleatShape(shallow)).toEqual(cleatShape(steep));
    expect(shallow.parts.find(part => part.id.startsWith('mount:cleat:'))?.metadata?.cleatAngle).toBe(30);
    expect(steep.parts.find(part => part.id.startsWith('mount:cleat:'))?.metadata?.cleatAngle).toBe(55);
    expect(shallow.hardware).toHaveLength(0);
    expect(steep.hardware).toHaveLength(0);
  });
});
