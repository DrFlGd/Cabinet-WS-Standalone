import { describe, expect, it } from 'vitest';
import { buildCabinetDocument } from './cabinetModel';
import { familyStarter } from './familyCatalog';
import { buildFamilyCabinetDocument } from './familyModel';
import { buildFeatureGraph } from './kernel/featureGraph';
import { utilityStarter } from './utilityStarters';

describe('realtime cabinet rendering features', () => {
  it('builds an actual notched side profile for toe-kick cutouts', () => {
    const source = utilityStarter('default').parameters;
    const document = buildCabinetDocument({
      ...source,
      sideToeKickCutout: 'both',
    });

    for (const id of ['carcass:left', 'carcass:right']) {
      const side = document.parts.find(part => part.id === id);
      expect(side?.geometry?.kind).toBe('extruded-profile');
      expect(side?.geometry?.axis).toBe('x');
      expect(side?.geometry?.outline).toHaveLength(6);
      expect(side?.geometry?.outline).toContainEqual({
        u: source.toeKickDepth,
        v: source.toeKickHeight,
      });
    }
  });

  it('adds real through-hole profiles for adjustable shelf pin drilling', () => {
    const document = buildCabinetDocument({
      ...utilityStarter('utility_door_base').parameters,
      shelfStyle: 'adjustable',
    });
    const side = document.parts.find(part => part.id === 'carcass:left');
    const holes = side?.geometry?.holes ?? [];

    expect(holes.filter(hole => hole.kind === 'circle').length).toBeGreaterThan(8);
  });

  it('models matching tab-slot geometry instead of cutting the mating tab away', () => {
    const screw = buildCabinetDocument({
      ...utilityStarter('default').parameters,
      shelfStyle: 'fixed',
      joineryStyle: 'screw',
    });
    const screwHoles = screw.parts.find(part => part.id === 'carcass:left')?.renderFeatures ?? [];
    expect(screwHoles.filter(hole => hole.kind === 'drill').length).toBeGreaterThan(4);

    const source = utilityStarter('default').parameters;
    const clearance = 0.6;
    const tabSlot = buildCabinetDocument({
      ...source,
      shelfStyle: 'fixed',
      joineryStyle: 'tab_slot',
      dadoFitClearance: clearance,
    });
    const side = tabSlot.parts.find(part => part.id === 'carcass:left')!;
    const bottom = tabSlot.parts.find(part => part.id === 'carcass:bottom')!;
    const slots = (side.renderFeatures ?? []).filter(f => f.semanticRole === 'tab-slot-receiver' && f.sourcePartId === bottom.id);
    expect(slots.length).toBeGreaterThan(0);
    expect(bottom.size.x).toBe(source.width);
    expect(bottom.position.x).toBe(0);
    expect(bottom.renderFeatures?.some(f => f.semanticRole === 'tab-outline')).toBe(true);
    for (const slot of slots) {
      expect(slot.size.y).toBeCloseTo(35 + clearance);
      expect(slot.size.z).toBeCloseTo(side.size.x + clearance);
    }

    const graph = buildFeatureGraph(tabSlot);
    for (const id of ['carcass:left', 'carcass:right']) {
      const receivers = graph.partFeatures[id].filter(feature => feature.semanticRole === 'tab-slot-receiver' && feature.parameters.sourcePartId === bottom.id);
      expect(receivers).toHaveLength(slots.length);
      expect(receivers.every(feature => feature.parameters.sourcePartId === 'carcass:bottom')).toBe(true);
      expect(receivers.every(feature => feature.parameters.clearance === clearance)).toBe(true);
      expect(receivers.every(feature => feature.parameters.machiningDepth === side.size.x)).toBe(true);
    }
    expect(graph.partFeatures['carcass:bottom'].some(feature => feature.semanticRole === 'tab-slot-receiver' && ['carcass:left', 'carcass:right'].includes(String(feature.parameters.sourcePartId)))).toBe(false);
  });

  it('does not invent side slots for the full-width bottom mode', () => {
    const source = utilityStarter('default').parameters;
    const document = buildCabinetDocument({
      ...source,
      joineryStyle: 'tab_slot',
      bottomWidthStyle: 'full_width',
    });
    const side = document.parts.find(part => part.id === 'carcass:left')!;
    const bottom = document.parts.find(part => part.id === 'carcass:bottom')!;

    expect((side.geometry?.holes ?? []).filter(hole => hole.kind === 'rect')).toHaveLength(0);
    expect(bottom.geometry).toBeUndefined();
    expect(bottom.size.x).toBe(source.width);
  });

  it('adds visible dado recess features to both cabinet sides', () => {
    const document = buildCabinetDocument({
      ...utilityStarter('utility_door_base').parameters,
      joineryStyle: 'dado',
      shelfStyle: 'fixed',
    });

    const left = document.parts.find(part => part.id === 'carcass:left');
    const right = document.parts.find(part => part.id === 'carcass:right');

    expect(left?.renderFeatures?.some(feature => feature.kind === 'dado')).toBe(true);
    expect(right?.renderFeatures?.some(feature => feature.kind === 'dado')).toBe(true);
  });

  it('models complete drawer boxes instead of only decorative fronts', () => {
    const document = buildCabinetDocument(utilityStarter('utility_3_drawer_base').parameters);
    const drawerParts = document.parts.filter(part => part.category === 'drawer');

    expect(drawerParts).toHaveLength(15);
    for (let drawer = 1; drawer <= 3; drawer += 1) {
      for (const component of ['left', 'right', 'front', 'back', 'bottom']) {
        expect(document.parts.some(part => part.id === `drawer:${drawer}:box:${component}`)).toBe(true);
      }
    }
  });

  it('keeps screenshot-like open-top frame members physically distinct', () => {
    const utility = buildCabinetDocument(utilityStarter('utility_door_base').parameters);
    expectNoPositiveVolumeOverlap(
      utility.parts.filter(part => ['carcass:left', 'carcass:right', 'carcass:top-front', 'carcass:top-rear'].includes(part.id)),
    );

    const stand = familyStarter('equipment_stand', 'equipment_stand_solid_side_utility_stand');
    const equipment = buildFamilyCabinetDocument(stand.parameters, stand.name, 'mm', {
      family: 'equipment_stand',
      starterId: stand.id,
      familyValues: stand.values,
    });
    const frame = equipment.parts.filter(part =>
      ['carcass:left', 'carcass:right', 'carcass:top-front', 'carcass:top-rear'].includes(part.id)
    );

    expect(frame.map(part => part.id).sort()).toEqual([
      'carcass:left',
      'carcass:right',
      'carcass:top-front',
      'carcass:top-rear',
    ]);
    expectNoPositiveVolumeOverlap(frame);
    expect(new Set(frame.map(part => part.position.z + part.size.z))).toEqual(
      new Set([equipment.parameters.height]),
    );
  });

  it('models drawer boxes for section-driven layouts too', () => {
    const document = buildCabinetDocument(utilityStarter('utility_wide_3_section_drawers').parameters);

    expect(document.parts.some(part => part.id === 'section:2:drawer:1:box:left')).toBe(true);
    expect(document.parts.some(part => part.id === 'section:4:drawer:4:box:bottom')).toBe(true);
  });
});


function expectNoPositiveVolumeOverlap(parts: Array<{
  id: string;
  position: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
}>) {
  for (let a = 0; a < parts.length; a += 1) {
    for (let b = a + 1; b < parts.length; b += 1) {
      const first = parts[a];
      const second = parts[b];
      const overlap = {
        x: Math.min(first.position.x + first.size.x, second.position.x + second.size.x) -
          Math.max(first.position.x, second.position.x),
        y: Math.min(first.position.y + first.size.y, second.position.y + second.size.y) -
          Math.max(first.position.y, second.position.y),
        z: Math.min(first.position.z + first.size.z, second.position.z + second.size.z) -
          Math.max(first.position.z, second.position.z),
      };
      expect(
        overlap.x > 1e-6 && overlap.y > 1e-6 && overlap.z > 1e-6,
        `${first.id} overlaps ${second.id}: ${JSON.stringify(overlap)}`,
      ).toBe(false);
    }
  }
}
