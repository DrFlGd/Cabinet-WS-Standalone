import { describe, expect, it } from 'vitest';
import { buildCabinetDocument } from './cabinetModel';
import { partSettingsContext } from './partContext';
import { utilityStarter } from './utilityStarters';

describe('selected part contextual settings', () => {
  it('shows drawer stock and slide settings for drawer-box parts', () => {
    const document = buildCabinetDocument(utilityStarter('utility_3_drawer_base').parameters);
    const part = document.parts.find(candidate => candidate.id === 'drawer:1:box:left')!;
    const context = partSettingsContext(part, document.parameters);
    const keys = context.fields.map(field => field.key);

    expect(context.title).toBe('Drawer-box settings');
    expect(context.hardwareCategory).toBe('drawer_slide');
    expect(keys).toContain('drawerMaterialThickness');
    expect(keys).toContain('drawerBottomThickness');
    expect(keys).toContain('drawerMount');
    expect(keys).not.toContain('hingeStyle');
  });

  it('shows door and hinge settings for door fronts', () => {
    const document = buildCabinetDocument(utilityStarter('utility_door_base').parameters);
    const part = document.parts.find(candidate => candidate.id === 'door:1')!;
    const context = partSettingsContext(part, document.parameters);
    const keys = context.fields.map(field => field.key);

    expect(context.title).toBe('Door settings');
    expect(context.hardwareCategory).toBe('hinge');
    expect(keys).toContain('doorThickness');
    expect(keys).toContain('frontMountStyle');
    expect(keys).toContain('hingeStyle');
    expect(keys).not.toContain('drawerMount');
  });

  it('shows worktop-specific controls for the selected worktop', () => {
    const source = utilityStarter('default').parameters;
    const document = buildCabinetDocument({ ...source, includeWorktop: true });
    const part = document.parts.find(candidate => candidate.category === 'worktop')!;
    const keys = partSettingsContext(part, document.parameters).fields.map(field => field.key);

    expect(keys).toContain('worktopThickness');
    expect(keys).toContain('worktopSideOverhang');
    expect(keys).toContain('worktopFrontOverhang');
    expect(keys).toContain('worktopBackOverhang');
    expect(keys).not.toContain('hingeStyle');
  });

  it('maps section-generated drawer parts back to the zero-based section node', () => {
    const document = buildCabinetDocument(utilityStarter('utility_wide_3_section_drawers').parameters);
    const part = document.parts.find(candidate => candidate.id === 'section:2:drawer:1:box:left')!;
    const context = partSettingsContext(part, document.parameters);

    expect(part.metadata?.sectionId).toBe(2);
    expect(context.sectionNodeId).toBe(1);
  });
});
