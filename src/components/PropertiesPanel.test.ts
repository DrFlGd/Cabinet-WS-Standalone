import { describe, expect, it } from 'vitest';
import { nextSettingsCategoryIndex, settingsCategoryTargetId } from './PropertiesPanel';
describe('Settings category navigation', () => {
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
    expect(settingsCategoryTargetId('Drawer / Construction')).toBe(
      'settings-cabinet-drawer-construction',
    );
    expect(settingsCategoryTargetId('Face Frame')).toBe(
      'settings-cabinet-face-frame',
    );
  });
});
