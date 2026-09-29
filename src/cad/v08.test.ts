import { describe, expect, it } from 'vitest';
import { buildCabinetDocument, sanitizeParameters } from './cabinetModel';
import { featuresForPart } from './kernel/featureGraph';
import { utilityStarter } from './utilityStarters';
import type { SectionNode } from './types';

describe('v0.8 cabinet construction depth', () => {
  it('migrates older parameter sets through v0.8 defaults without a schema break', () => {
    const source = utilityStarter('default').parameters;
    const legacy = { ...source } as Record<string, unknown>;
    for (const key of [
      'drawerHeightMode',
      'drawerGraduatedStep',
      'drawerCustomWeights',
      'shelfPositions',
      'drawerJoineryStyle',
      'drawerBottomStyle',
      'drawerBottomGrooveDepth',
      'drawerDividerCount',
      'drawerDividerRows',
      'drawerFrontRegistration',
      'faceFrameStyle',
      'faceFrameThickness',
      'faceFrameStileWidth',
      'faceFrameRailWidth',
      'faceFrameCenterStileWidth',
    ]) delete legacy[key];

    expect(sanitizeParameters(legacy)).toMatchObject({
      drawerHeightMode: 'equal',
      drawerJoineryStyle: 'butt',
      drawerBottomStyle: 'captured',
      drawerFrontRegistration: 'centered',
      faceFrameStyle: 'none',
    });
  });

  it('supports graduated and custom-weighted drawer fronts in Simple layout', () => {
    const graduated = buildCabinetDocument({
      ...utilityStarter('utility_4_drawer_base').parameters,
      drawerHeightMode: 'graduated',
      drawerGraduatedStep: 0.5,
    });
    const heights = graduated.parts
      .filter(part => /^drawer:\d+:front$/.test(part.id))
      .map(part => part.size.z);
    expect(heights).toHaveLength(4);
    expect(heights[0]).toBeLessThan(heights[3]);

    const custom = buildCabinetDocument({
      ...utilityStarter('utility_3_drawer_base').parameters,
      drawerHeightMode: 'custom_weights',
      drawerCustomWeights: [1, 2, 1],
    });
    const customHeights = custom.parts
      .filter(part => /^drawer:\d+:front$/.test(part.id))
      .map(part => part.size.z);
    expect(customHeights[1]).toBeCloseTo(customHeights[0] * 2, 4);
  });

  it('models captured drawer bottoms as exact groove intent and supports applied bottoms', () => {
    const captured = buildCabinetDocument({
      ...utilityStarter('utility_3_drawer_base').parameters,
      drawerJoineryStyle: 'lock_rabbet',
      drawerBottomStyle: 'captured',
    });
    const left = captured.parts.find(part => part.id === 'drawer:1:box:left');
    const graph = left ? featuresForPart(captured, left) : [];
    expect(left?.renderFeatures?.some(feature => feature.kind === 'slot')).toBe(true);
    expect(left?.renderFeatures?.some(feature => feature.kind === 'rabbet')).toBe(true);
    expect(graph.some(feature => feature.kind === 'pocket')).toBe(true);
    expect(graph.some(feature => feature.kind === 'rabbet')).toBe(true);

    const applied = buildCabinetDocument({
      ...utilityStarter('utility_3_drawer_base').parameters,
      drawerBottomStyle: 'applied',
    });
    const bottom = applied.parts.find(part => part.id === 'drawer:1:box:bottom');
    const side = applied.parts.find(part => part.id === 'drawer:1:box:left');
    expect(bottom?.name).toContain('Applied');
    expect(bottom && side && bottom.position.z < side.position.z).toBe(true);
  });

  it('generates internal drawer organizer grids', () => {
    const document = buildCabinetDocument({
      ...utilityStarter('utility_3_drawer_base').parameters,
      drawerDividerCount: 2,
      drawerDividerRows: 1,
    });
    const firstDrawer = document.parts.filter(part => part.id.startsWith('drawer:1:organizer:'));
    expect(firstDrawer.filter(part => part.id.includes(':column:'))).toHaveLength(2);
    expect(firstDrawer.filter(part => part.id.includes(':row:'))).toHaveLength(1);
  });

  it('builds semantic face-frame stiles/rails and registers fronts to the frame plane', () => {
    const document = buildCabinetDocument({
      ...utilityStarter('default').parameters,
      faceFrameStyle: 'full',
      faceFrameThickness: 19,
      faceFrameCenterStileWidth: 38,
    });
    expect(document.parts.some(part => part.id === 'frame:left-stile' && part.category === 'frame')).toBe(true);
    expect(document.parts.some(part => part.id === 'frame:top-rail')).toBe(true);
    expect(document.parts.some(part => part.id.startsWith('frame:center-'))).toBe(true);
    const door = document.parts.find(part => part.id === 'door:1');
    expect(door?.position.y).toBe(-(19 + document.parameters.doorThickness));
  });

  it('persists moved shelf positions in Simple and Sections layouts', () => {
    const simple = buildCabinetDocument({
      ...utilityStarter('utility_door_base').parameters,
      shelfPositions: [0.72],
    });
    const shelf = simple.parts.find(part => part.id === 'shelf:1');
    const min = Number(shelf?.metadata?.shelfMinZ);
    const max = Number(shelf?.metadata?.shelfMaxZ);
    expect(shelf && shelf.position.z + shelf.size.z / 2).toBeCloseTo(min + (max - min) * 0.72, 4);

    const starter = utilityStarter('utility_wide_mixed_base').parameters;
    const nodes = starter.sectionNodes.map(node => [...node.slice(0, 9), [...node[9]], ...node.slice(10)] as SectionNode);
    const doorNode = nodes.find(node => node[5] === 'doors')!;
    doorNode[12] = [0.2, 0.8];
    const sections = buildCabinetDocument({ ...starter, sectionNodes: nodes });
    const shelves = sections.parts.filter(part => part.category === 'shelf' && Number(part.metadata?.sectionId) > 0);
    expect(shelves).toHaveLength(2);
    expect(shelves[0].position.z).toBeLessThan(shelves[1].position.z);
  });
});
