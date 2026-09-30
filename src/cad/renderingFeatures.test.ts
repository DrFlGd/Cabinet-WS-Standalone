import { describe, expect, it } from 'vitest';
import { buildCabinetDocument } from './cabinetModel';
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
    const screwHoles = screw.parts.find(part => part.id === 'carcass:left')?.geometry?.holes ?? [];
    expect(screwHoles.filter(hole => hole.kind === 'circle')).toHaveLength(4);

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
    const slots = (side.geometry?.holes ?? []).filter(hole => hole.kind === 'rect');
    expect(slots).toHaveLength(2);

    expect(bottom.geometry?.kind).toBe('extruded-profile');
    expect(bottom.geometry?.axis).toBe('z');
    expect(bottom.size.x).toBe(source.width);
    expect(bottom.geometry?.outline.some(point => point.u === 0)).toBe(true);
    expect(bottom.geometry?.outline.some(point => point.u === source.width)).toBe(true);

    const tabWidth = Number(bottom.metadata?.tabWidth);
    expect(tabWidth).toBeGreaterThan(0);
    for (const slot of slots) {
      if (slot.kind !== 'rect') throw new Error('Expected rectangular tab-slot receiver');
      expect(slot.width).toBeCloseTo(tabWidth + clearance);
      expect(slot.height).toBeCloseTo(source.materialThickness + clearance);
    }

    const graph = buildFeatureGraph(tabSlot);
    for (const id of ['carcass:left', 'carcass:right']) {
      const receivers = graph.partFeatures[id].filter(feature => feature.semanticRole === 'tab-slot-receiver');
      expect(receivers).toHaveLength(2);
      expect(receivers.every(feature => feature.parameters.sourcePartId === 'carcass:bottom')).toBe(true);
      expect(receivers.every(feature => feature.parameters.clearance === clearance)).toBe(true);
      expect(receivers.every(feature => feature.parameters.machiningDepth === source.materialThickness)).toBe(true);
    }
    expect(graph.partFeatures['carcass:bottom'].some(feature => feature.semanticRole === 'tab-slot-receiver')).toBe(false);
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

  it('models drawer boxes for section-driven layouts too', () => {
    const document = buildCabinetDocument(utilityStarter('utility_wide_3_section_drawers').parameters);

    expect(document.parts.some(part => part.id === 'section:2:drawer:1:box:left')).toBe(true);
    expect(document.parts.some(part => part.id === 'section:4:drawer:4:box:bottom')).toBe(true);
  });
});
