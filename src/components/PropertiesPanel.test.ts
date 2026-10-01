import { describe, expect, it } from 'vitest';
import {
  nextSettingsCategoryIndex,
  settingsBrowseAfterSelection,
  settingsBrowseForCategory,
  settingsCategoryTargetId,
  type SettingsBrowseState,
} from './PropertiesPanel';

describe('PropertiesPanel settings browsing state', () => {
  it('lets explicit category browsing take precedence without clearing selected-part context', () => {
    const selectedPartState: SettingsBrowseState = {
      surface: 'selection',
      explicitBrowse: false,
      activeCategory: null,
    };

    const browsing = settingsBrowseForCategory(
      selectedPartState,
      'family',
      'Construction',
      true,
    );

    expect(browsing).toEqual({
      surface: 'family',
      explicitBrowse: true,
      activeCategory: 'Construction',
    });
    expect(settingsBrowseAfterSelection(browsing, true)).toEqual(browsing);
  });

  it('returns contextual browsing when selection changes unless category browsing is explicit', () => {
    const passiveModelBrowse: SettingsBrowseState = {
      surface: 'model',
      explicitBrowse: false,
      activeCategory: 'Cabinet',
    };

    expect(settingsBrowseAfterSelection(passiveModelBrowse, true).surface).toBe('selection');
    expect(settingsBrowseAfterSelection({
      surface: 'selection',
      explicitBrowse: false,
      activeCategory: null,
    }, false)).toEqual({
      surface: 'family',
      explicitBrowse: false,
      activeCategory: null,
    });
  });

  it('supports wrapped arrow navigation plus Home and End', () => {
    expect(nextSettingsCategoryIndex(0, 'ArrowUp', 4)).toBe(3);
    expect(nextSettingsCategoryIndex(3, 'ArrowDown', 4)).toBe(0);
    expect(nextSettingsCategoryIndex(1, 'ArrowRight', 4)).toBe(2);
    expect(nextSettingsCategoryIndex(2, 'ArrowLeft', 4)).toBe(1);
    expect(nextSettingsCategoryIndex(2, 'Home', 4)).toBe(0);
    expect(nextSettingsCategoryIndex(1, 'End', 4)).toBe(3);
    expect(nextSettingsCategoryIndex(1, 'Enter', 4)).toBe(1);
  });

  it('builds stable scroll targets for family and native categories', () => {
    expect(settingsCategoryTargetId('family', 'Drawer / Construction')).toBe(
      'settings-family-drawer-construction',
    );
    expect(settingsCategoryTargetId('model', 'Face Frame')).toBe(
      'settings-model-face-frame',
    );
  });
});
