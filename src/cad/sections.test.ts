import { describe, expect, it } from 'vitest';
import { stockThickness } from './cabinetModel';
import {
  collapseSection,
  sectionLayoutErrors,
  sectionRects,
  sectionRoot,
  selectedSectionIds,
  treeErrors,
} from './sections';
import type { SectionNode } from './types';
import { utilityStarter } from './utilityStarters';

describe('section tree parity', () => {
  it('resolves the wide three-bay web starter with matching clear widths', () => {
    const parameters = utilityStarter('utility_wide_3_section_drawers').parameters;
    const t = stockThickness(parameters.carcassStock, parameters.materialThickness);
    const rects = sectionRects(parameters.sectionNodes, sectionRoot(parameters, t), t);

    expect(rects).toHaveLength(4);
    expect(rects.slice(1).map(rect => rect.w)).toEqual([376, 376, 376]);
    expect(rects.slice(1).map(rect => rect.h)).toEqual([764, 764, 764]);
    expect(rects.slice(1).map(rect => rect.x)).toEqual([18, 412, 806]);
  });

  it('supports fixed clear-opening dimensions alongside flexible siblings', () => {
    const nodes: SectionNode[] = [
      [-1, 0, 'x', 'weight', 1, 'open', 0, 'equal', 0.25, [1], 'panel', 0],
      [0, 0, 'leaf', 'mm', 300, 'drawers', 3, 'equal', 0.25, [1, 1, 1], 'panel', 0],
      [0, 1, 'leaf', 'weight', 1, 'doors', 2, 'equal', 0.25, [1, 1], 'panel', 1],
    ];
    const parameters = {
      ...utilityStarter('default').parameters,
      width: 1000,
      layoutMode: 'sections' as const,
      sectionNodes: nodes,
    };
    const t = 18;
    const rects = sectionRects(nodes, sectionRoot(parameters, t), t);

    expect(rects[1].w).toBe(300);
    expect(rects[2].w).toBe(646);
  });

  it('matches bounded-tree validation constraints from the web implementation', () => {
    const invalidVerticalRail: SectionNode[] = [
      [-1, 0, 'x', 'weight', 1, 'open', 0, 'equal', 0.25, [1], 'rail', 0],
      [0, 0, 'leaf', 'weight', 1, 'drawers', 2, 'equal', 0.25, [1, 1], 'panel', 0],
      [0, 1, 'leaf', 'weight', 1, 'doors', 2, 'equal', 0.25, [1, 1], 'panel', 0],
    ];
    expect(treeErrors(invalidVerticalRail)).toEqual(['Vertical splits need a panel or no divider.']);

    const allFixed: SectionNode[] = [
      [-1, 0, 'z', 'weight', 1, 'open', 0, 'equal', 0.25, [1], 'panel', 0],
      [0, 0, 'leaf', 'mm', 200, 'drawers', 2, 'equal', 0.25, [1, 1], 'panel', 0],
      [0, 1, 'leaf', 'mm', 200, 'doors', 2, 'equal', 0.25, [1, 1], 'panel', 0],
    ];
    expect(treeErrors(allFixed)).toEqual(['A split needs at least two children and one flexible size.']);
  });

  it('rejects geometrically undersized openings at the 60 mm parity floor', () => {
    const parameters = utilityStarter('utility_wide_3_section_drawers').parameters;
    const tiny = parameters.sectionNodes.map(node => [...node.slice(0, 9), [...node[9]], ...node.slice(10)] as SectionNode);
    tiny[1][3] = 'mm';
    tiny[1][4] = 20;
    const next = { ...parameters, sectionNodes: tiny };
    const t = stockThickness(next.carcassStock, next.materialThickness);

    expect(sectionLayoutErrors(next, t)[0]).toMatch(/60 mm/);
  });

  it('collapses a nested subtree while preserving stable order for remaining nodes', () => {
    const nodes: SectionNode[] = [
      [-1, 0, 'x', 'weight', 1, 'open', 0, 'equal', 0.25, [1], 'panel', 0],
      [0, 0, 'z', 'weight', 1, 'open', 0, 'equal', 0.25, [1], 'panel', 0],
      [0, 1, 'leaf', 'weight', 1, 'doors', 2, 'equal', 0.25, [1, 1], 'panel', 1],
      [1, 0, 'leaf', 'weight', 1, 'drawers', 2, 'equal', 0.25, [1, 1], 'panel', 0],
      [1, 1, 'leaf', 'weight', 1, 'open', 1, 'equal', 0.25, [1], 'panel', 0],
    ];

    const collapsed = collapseSection(nodes, 1);
    expect(collapsed).toHaveLength(3);
    expect(collapsed[1][2]).toBe('leaf');
    expect(collapsed[2][0]).toBe(0);
    expect([...selectedSectionIds(nodes, 1)].sort((a, b) => a - b)).toEqual([1, 3, 4]);
  });
});
