import { describe, expect, it } from 'vitest';
import { FAMILY_DEFINITIONS, familyStarter, familyStarters } from './familyCatalog';
import { cabinetSettings, filterCabinetSettings, isLayoutSetting, readSettingsVisibility, SETTINGS_CATEGORIES, supportsLayoutEditor } from './cabinetSettings';
import { recipeLayoutFields } from '../components/FamilyLayoutOptions';
import { familyFieldDefinitions } from './familySettings';

const all = { showAdvanced: true, showUnused: true };
describe('Unified cabinet settings ownership', () => {
  it('gives every family a categorized catalog with unique controls', () => {
    for (const { id } of FAMILY_DEFINITIONS) for (const starter of familyStarters(id)) {
      const rows = cabinetSettings(id, starter.values, starter.parameters);
      expect(new Set(rows.map(row => row.id)).size).toBe(rows.length);
      expect(rows.every(row => SETTINGS_CATEGORIES.includes(row.category))).toBe(true);
      expect(rows.length).toBeGreaterThan(0);
      if (supportsLayoutEditor(id)) {
        expect(rows.some(row => row.source === 'parameter' && row.field.section === 'Layout')).toBe(false);
        expect(rows.some(row => row.source === 'family' && isLayoutSetting(row.field.key))).toBe(false);
      } else expect(rows.every(row => row.source === 'family')).toBe(true);
    }
  });
  it('renders shared dimensions once, preserves nominal kitchen depth and richer family enums', () => {
    const starter = familyStarter('utility', 'default');
    const ids = cabinetSettings('utility', starter.values, starter.parameters).map(row => row.id);
    expect(ids).toContain('parameter:width');
    expect(ids).not.toContain('family:cabinet_width');
    const kitchen = familyStarter('kitchen', 'default');
    const kitchenIds = cabinetSettings('kitchen', kitchen.values, kitchen.parameters).map(row => row.id);
    expect(kitchenIds).toContain('family:front_facing_style');
    expect(kitchenIds).not.toContain('parameter:faceFrameStyle');
    expect(kitchenIds).toContain('family:cabinet_nominal_depth');
    expect(kitchenIds).not.toContain('parameter:depth');
  });
  it('retains recipe-specific layout inputs in Layout, and construction settings on the right', () => {
    expect(recipeLayoutFields('stackable').map(field => field.key)).toContain('module_type');
    for (const key of ['drawer_bank_face_gap', 'drawer_bank_partition_joinery', 'mixed_bay_shelf_styles']) expect(isLayoutSetting(key)).toBe(false);
    for (const { id } of FAMILY_DEFINITIONS.filter(item => supportsLayoutEditor(item.id))) {
      const shared = new Set(['cabinet_layout_mode', 'section_nodes', 'cabinet_contents', 'drawer_count', 'door_count', 'door_shelf_count', 'drawer_height_mode', 'drawer_height_weights', 'drawer_graduated_step']);
      const moved = recipeLayoutFields(id).map(field => field.key);
      for (const field of familyFieldDefinitions(id).filter(field => isLayoutSetting(field.key))) expect(shared.has(field.key) || moved.includes(field.key)).toBe(true);
    }
  });
  it('keeps search subject to both visibility filters', () => {
    const starter = familyStarter('utility', 'default');
    const rows = cabinetSettings('utility', starter.values, { ...starter.parameters, includeWorktop: false });
    expect(filterCabinetSettings(rows, '', all)).toHaveLength(rows.length);
    for (const visibility of [{ showAdvanced: false, showUnused: false }, { showAdvanced: true, showUnused: false }, { showAdvanced: false, showUnused: true }]) {
      const visible = filterCabinetSettings(rows, '', visibility);
      expect(visible.every(row => visibility.showAdvanced || !row.advanced)).toBe(true);
      expect(visible.every(row => visibility.showUnused || !row.inactiveReason)).toBe(true);
      expect(filterCabinetSettings(rows, 'worktop', visibility).every(row => visible.includes(row))).toBe(true);
    }
    expect(filterCabinetSettings(rows, 'worktopThickness', { showAdvanced: true, showUnused: false })).toHaveLength(0);
    expect(filterCabinetSettings(rows, 'worktopThickness', all)).toHaveLength(1);
  });
  it('defaults off and handles unavailable/corrupt stored preferences', () => {
    expect(readSettingsVisibility()).toEqual({ showAdvanced: false, showUnused: false });
    expect(readSettingsVisibility({ getItem: () => '{invalid' })).toEqual(readSettingsVisibility());
    expect(readSettingsVisibility({ getItem: () => { throw new Error('blocked'); } })).toEqual(readSettingsVisibility());
    expect(readSettingsVisibility({ getItem: () => '{"showAdvanced":true,"showUnused":false}' })).toEqual({ showAdvanced: true, showUnused: false });
    expect(readSettingsVisibility({ getItem: () => '{"showAdvanced":"true"}' })).toEqual(readSettingsVisibility());
  });
});
