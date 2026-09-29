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
import type { CabinetFamily, FamilyRecipeValues } from './types';

type ReferenceFixture = {
  id: string;
  family: CabinetFamily;
  starterId?: string;
  reference: {
    inputs: Record<string, unknown>;
    expected: Record<string, unknown>;
  };
  standaloneExpectation: 'known-gap';
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
      parity: 'known-gap',
    });
    expect(familyCapabilityFor('equipment_stand', 'cleat_angle')).toMatchObject({
      status: 'unsupported',
      parity: 'known-gap',
    });
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

  it('keeps the audited drawer joinery mode collapse visible as a behavioral gap', () => {
    const starter = familyStarter('drawer');
    const dadoValues = recipeWithPatch(starter.values, { drawer_joinery_style: 'dado' });
    const tabValues = recipeWithPatch(starter.values, { drawer_joinery_style: 'tab_slot' });
    const dadoParameters = parametersFromFamilyValues('drawer', dadoValues);
    const tabParameters = parametersFromFamilyValues('drawer', tabValues);

    expect(dadoParameters.drawerJoineryStyle).toBe('rabbet');
    expect(tabParameters.drawerJoineryStyle).toBe('rabbet');

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

    expect(geometrySnapshot(dadoDocument)).toEqual(geometrySnapshot(tabDocument));
    expect(buildFeatureGraph(dadoDocument)).toEqual(buildFeatureGraph(tabDocument));
  });

  it('keeps divider mounting and groove-depth no-op behavior explicit until machining parity lands', () => {
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

    expect(geometrySnapshot(bottomDocument)).toEqual(geometrySnapshot(perimeterDocument));
    expect(buildFeatureGraph(bottomDocument)).toEqual(buildFeatureGraph(perimeterDocument));
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
