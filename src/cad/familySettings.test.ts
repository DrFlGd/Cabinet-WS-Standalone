import { describe, expect, it } from 'vitest';
import { familyStarter, parametersFromFamilyValues } from './familyCatalog';
import {
  applyFamilyFieldChange,
  completeFamilyValues,
  familyFieldDefinitions,
  familyFieldInactiveReason,
  syncFamilyValuesFromParameters,
} from './familySettings';

describe('v0.14 native family settings', () => {
  it('exposes the complete legacy field schema for all seven families', () => {
    const counts = {
      shop_cart: 310,
      utility: 310,
      benchtop: 222,
      stackable: 277,
      kitchen: 299,
      drawer: 161,
      equipment_stand: 99,
    } as const;

    let total = 0;
    for (const [family, count] of Object.entries(counts)) {
      expect(familyFieldDefinitions(family as keyof typeof counts)).toHaveLength(count);
      total += count;
    }
    expect(total).toBe(1678);
  });

  it('hydrates sparse recipes before editing so old projects do not reset unrelated values', () => {
    const hydrated = completeFamilyValues('utility', { cabinet_width: 913 });
    expect(hydrated.cabinet_width).toBe(913);
    expect(hydrated.cabinet_height).toBeTypeOf('number');
    expect(hydrated.drawer_mount).toBeTypeOf('string');
    expect(hydrated.custom_bottom_above_toe).toBe(hydrated.custom_toe_kick_height);
  });

  it('ports dependency-aware visibility for joinery, hardware, worktops, and family sizing', () => {
    const utility = familyStarter('utility', 'default').values;
    const dado = familyFieldDefinitions('utility').find(field => field.key === 'dado_depth')!;
    const tab = familyFieldDefinitions('utility').find(field => field.key === 'joint_tab_count')!;
    const worktop = familyFieldDefinitions('utility').find(field => field.key === 'worktop_side_overhang')!;
    expect(familyFieldInactiveReason('utility', dado, { ...utility, joinery_style: 'butt' })).toMatch(/dado/i);
    expect(familyFieldInactiveReason('utility', tab, { ...utility, joinery_style: 'butt' })).toMatch(/tab/i);
    expect(familyFieldInactiveReason('utility', worktop, { ...utility, include_worktop: false })).toMatch(/worktop/i);

    const drawer = familyStarter('drawer', 'default').values;
    const inside = familyFieldDefinitions('drawer').find(field => field.key === 'target_box_inside_width')!;
    expect(familyFieldInactiveReason('drawer', inside, { ...drawer, drawer_design_basis: 'enclosure' })).toMatch(/inside-clear/i);

    const stand = familyStarter('equipment_stand', 'default').values;
    const overall = familyFieldDefinitions('equipment_stand').find(field => field.key === 'overall_width')!;
    expect(familyFieldInactiveReason('equipment_stand', overall, { ...stand, sizing_mode: 'equipment' })).toMatch(/manual sizing/i);
  });

  it('recomputes legacy expression-backed fields after source edits', () => {
    const utility = familyStarter('utility', 'default').values;
    const toe = applyFamilyFieldChange('utility', utility, 'custom_toe_kick_height', 123);
    expect(toe.custom_bottom_above_toe).toBe(123);

    const benchtop = familyStarter('benchtop', 'default').values;
    const thin = applyFamilyFieldChange('benchtop', benchtop, 'custom_carcass_thickness', 8);
    expect(thin.target_tab_spacing).toBe(64);
    expect(thin.joint_tab_width).toBeCloseTo(19.2);
  });

  it('makes representative family settings drive canonical geometry parameters', () => {
    const shop = applyFamilyFieldChange('shop_cart', familyStarter('shop_cart', 'default').values, 'cabinet_width', 1111);
    expect(parametersFromFamilyValues('shop_cart', shop).width).toBe(1111);

    const kitchen = applyFamilyFieldChange('kitchen', familyStarter('kitchen', 'default').values, 'front_facing_style', 'none');
    expect(parametersFromFamilyValues('kitchen', kitchen).faceFrameStyle).toBe('none');

    const benchtop = applyFamilyFieldChange('benchtop', familyStarter('benchtop', 'default').values, 'carcass_stock', 'custom');
    const benchtop2 = applyFamilyFieldChange('benchtop', benchtop, 'custom_carcass_thickness', 8.5);
    expect(parametersFromFamilyValues('benchtop', benchtop2).materialThickness).toBeCloseTo(8.5);

    const stackable = applyFamilyFieldChange('stackable', familyStarter('stackable', 'default').values, 'module_type', 'door');
    expect(parametersFromFamilyValues('stackable', stackable).doorCount).toBe(1);

    const drawer = applyFamilyFieldChange('drawer', familyStarter('drawer', 'default').values, 'drawer_design_basis', 'outside_box');
    const drawer2 = applyFamilyFieldChange('drawer', drawer, 'target_box_outside_width', 390);
    expect(parametersFromFamilyValues('drawer', drawer2).width).toBe(390);

    const stand = applyFamilyFieldChange('equipment_stand', familyStarter('equipment_stand', 'default').values, 'sizing_mode', 'manual');
    const stand2 = applyFamilyFieldChange('equipment_stand', stand, 'overall_width', 730);
    expect(parametersFromFamilyValues('equipment_stand', stand2).width).toBe(730);
  });

  it('synchronizes native model edits back into the family recipe', () => {
    const starter = familyStarter('kitchen', 'kitchen_standard_B30');
    const parameters = { ...starter.parameters, width: 801, drawerGap: 4.2 };
    const synced = syncFamilyValuesFromParameters('kitchen', starter.values, parameters);
    expect(synced.cabinet_width).toBe(801);
    expect(synced.drawer_gap).toBe(4.2);
    expect(synced.front_facing_style).toBe('face_frame');
  });

  it('keeps section layout editing owned by Manual Layout', () => {
    const starter = familyStarter('kitchen', 'photo_section_cabinet');
    const field = familyFieldDefinitions('kitchen').find(candidate => candidate.key === 'section_nodes')!;
    expect(familyFieldInactiveReason('kitchen', field, starter.values)).toBe('Use the Manual Layout editor');
  });
});
