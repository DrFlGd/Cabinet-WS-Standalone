import { describe, expect, it } from 'vitest';
import { buildBom } from './bom';
import { buildCabinetDocument, stockThickness } from './cabinetModel';
import { UTILITY_STARTERS, utilityStarter } from './utilityStarters';

describe('Utility Cabinet web parity fixtures', () => {
  it('ports the web Utility default values used by the standalone model', () => {
    const p = utilityStarter('default').parameters;
    expect(p).toMatchObject({
      width: 760,
      height: 900,
      depth: 610,
      materialThickness: 18,
      backThickness: 6,
      layoutMode: 'legacy',
      cabinetContents: 'combo',
      drawerCount: 2,
      doorCount: 2,
      topStyle: 'stretchers',
      topStretcherDepth: 90,
      backStyle: 'panel',
      mountStyle: 'floor',
      baseStyle: 'toe_kick',
      toeKickHeight: 100,
      toeKickDepth: 65,
      joineryStyle: 'butt',
      frontMountStyle: 'overlay',
      frontEdgeReveal: 2,
      drawerGap: 3,
      doorGap: 3,
      shelfStyle: 'fixed',
      shelfCount: 1,
    });
  });

  it('ports all currently supported Utility starter configurations', () => {
    expect(UTILITY_STARTERS.map(starter => starter.id)).toEqual([
      'default',
      'utility_3_drawer_base',
      'utility_4_drawer_base',
      'utility_door_base',
      'utility_2_drawer_2_door',
      'utility_1_drawer_2_door',
      'utility_wide_3_section_drawers',
      'utility_wide_4_section_drawers',
      'utility_wide_mixed_base',
      'utility_tall_2_door_storage',
      'utility_2_door_wall',
    ]);

    expect(utilityStarter('utility_wide_3_section_drawers').parameters).toMatchObject({
      width: 1200,
      height: 900,
      depth: 610,
      layoutMode: 'sections',
    });

    expect(utilityStarter('utility_wide_4_section_drawers').parameters).toMatchObject({
      width: 1600,
      layoutMode: 'sections',
    });

    expect(utilityStarter('utility_wide_mixed_base').parameters).toMatchObject({
      width: 1400,
      layoutMode: 'sections',
    });

    expect(utilityStarter('utility_tall_2_door_storage').parameters).toMatchObject({
      width: 900,
      height: 1800,
      depth: 500,
      cabinetContents: 'doors',
      drawerCount: 0,
      doorCount: 2,
      shelfCount: 4,
      shelfStyle: 'adjustable',
    });

    expect(utilityStarter('utility_2_door_wall').parameters).toMatchObject({
      width: 760,
      height: 760,
      depth: 330,
      cabinetContents: 'doors',
      drawerCount: 0,
      doorCount: 2,
      shelfCount: 2,
      topStyle: 'full',
      mountStyle: 'wall',
      baseStyle: 'flat',
    });
  });

  it('uses the same nominal stock conversions as Cabinet Workshop', () => {
    expect(stockThickness('1/8_nominal', 99)).toBeCloseTo(3.175);
    expect(stockThickness('1/2_nominal', 99)).toBeCloseTo(12.7);
    expect(stockThickness('3/4_nominal', 99)).toBeCloseTo(19.05);
    expect(stockThickness('custom_mm', 18.35)).toBeCloseTo(18.35);
  });

  it('produces the expected semantic primary parts for the default Utility cabinet', () => {
    const doc = buildCabinetDocument(utilityStarter('default').parameters);
    const ids = new Set(doc.parts.map(part => part.id));

    for (const id of [
      'carcass:left',
      'carcass:right',
      'carcass:bottom',
      'carcass:top-front',
      'carcass:top-rear',
      'back',
      'toe-kick',
      'shelf:1',
      'drawer:1:front',
      'drawer:2:front',
      'door:1',
      'door:2',
    ]) {
      expect(ids.has(id), id).toBe(true);
    }
  });

  it('generates semantic divider and front bodies for wide section starters', () => {
    const doc = buildCabinetDocument(utilityStarter('utility_wide_3_section_drawers').parameters);
    expect(doc.parts.filter(part => part.category === 'divider')).toHaveLength(2);
    expect(doc.parts.filter(part => part.id.includes(':drawer:') && part.category === 'front')).toHaveLength(12);
    expect(doc.parts.some(part => part.id === 'section:SEC-1-DIV-1')).toBe(true);
    expect(doc.parts.some(part => part.id === 'section:SEC-1-DIV-2')).toBe(true);
  });

  it('groups the two Utility side panels in the prototype BOM', () => {
    const doc = buildCabinetDocument(utilityStarter('default').parameters);
    const bom = buildBom(doc.parts);
    const sideRow = bom.find(row =>
      row.material.startsWith('Carcass stock') &&
      row.size.x === 18 &&
      row.size.y === 610 &&
      row.size.z === 900
    );

    expect(sideRow?.quantity).toBe(2);
    expect(sideRow?.partIds.sort()).toEqual(['carcass:left', 'carcass:right']);
  });

  it('suppresses toe-kick geometry for the ported wall cabinet', () => {
    const doc = buildCabinetDocument(utilityStarter('utility_2_door_wall').parameters);
    expect(doc.parts.some(part => part.id === 'toe-kick')).toBe(false);
    expect(doc.parts.some(part => part.id === 'carcass:top')).toBe(true);
    expect(doc.parts.filter(part => part.category === 'shelf')).toHaveLength(2);
  });
});
