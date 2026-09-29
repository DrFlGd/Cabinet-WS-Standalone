import type { CabinetParameters, SectionNode } from './types';

export type SectionRect = { id: number; x: number; z: number; w: number; h: number };
export type SectionPanel = {
  id: string;
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  divider: 'panel' | 'rail';
  sourceParentId?: number;
  sourceOrder?: number;
  axis?: 'x' | 'z';
  sourceSectionId?: number;
  shelfIndex?: number;
};

export const sectionLeaf = (
  parent = -1,
  order = 0,
  contents: SectionNode[5] = 'drawers',
  count = 3,
): SectionNode => [
  parent,
  order,
  'leaf',
  'weight',
  1,
  contents,
  count,
  'equal',
  0.25,
  Array(Math.max(1, count)).fill(1),
  'panel',
  0,
  [],
];

export function cloneSectionNodes(nodes: SectionNode[]) {
  return nodes.map(node => {
    const legacy = [
      node[0], node[1], node[2], node[3], node[4], node[5], node[6],
      node[7], node[8], [...node[9]], node[10], node[11],
    ] as SectionNode;
    return node[12] === undefined
      ? legacy
      : [...legacy, [...node[12]]] as SectionNode;
  });
}

export function treeErrors(value: unknown): string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 31) {
    return ['Use between 1 and 31 section nodes.'];
  }

  const nodes = value as SectionNode[];
  if (nodes.some(node => !Array.isArray(node) || (node.length !== 12 && node.length !== 13))) {
    return ['Each section must contain twelve legacy fields plus an optional shelf-position field.'];
  }

  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (
      !Number.isInteger(node[0]) ||
      (i === 0 ? node[0] !== -1 : node[0] < 0 || node[0] >= i) ||
      !Number.isInteger(node[1]) ||
      node[1] < 0 ||
      !['leaf', 'x', 'z'].includes(node[2]) ||
      !['weight', 'mm'].includes(node[3]) ||
      !Number.isFinite(node[4]) ||
      node[4] <= 0 ||
      !['drawers', 'doors', 'open'].includes(node[5]) ||
      !Number.isInteger(node[6]) ||
      node[6] < 0 ||
      node[6] > 8 ||
      !['equal', 'graduated', 'custom_weights'].includes(node[7]) ||
      !Number.isFinite(node[8]) ||
      node[8] < 0 ||
      !Array.isArray(node[9]) ||
      node[9].length > 8 ||
      node[9].some(weight => !Number.isFinite(weight) || weight <= 0) ||
      !['panel', 'rail', 'none'].includes(node[10]) ||
      !Number.isInteger(node[11]) ||
      node[11] < 0 ||
      node[11] > 8 ||
      (node[12] !== undefined && (
        !Array.isArray(node[12]) ||
        node[12].length > 8 ||
        node[12].some(position => !Number.isFinite(position) || position <= 0.03 || position >= 0.97)
      ))
    ) {
      return [`Invalid section ${i + 1}.`];
    }

    if (node[2] === 'x' && node[10] === 'rail') {
      return ['Vertical splits need a panel or no divider.'];
    }

    const children = childEntries(nodes, i);
    if (node[2] === 'leaf' ? children.length !== 0 : children.length < 2 || children.every(entry => entry.node[3] === 'mm')) {
      return ['A split needs at least two children and one flexible size.'];
    }

    if (children.some((_, order) => children.filter(entry => entry.node[1] === order).length !== 1)) {
      return ['Section order must be consecutive.'];
    }

    let parent = i;
    let depth = 0;
    while (parent > 0) {
      parent = nodes[parent][0];
      if (++depth > 8) return ['Use no more than eight nesting levels.'];
    }

    if (
      node[2] === 'leaf' &&
      (
        (node[5] === 'doors' && (node[6] < 1 || node[6] > 2)) ||
        (node[5] === 'drawers' && (node[6] < 1 || (node[7] === 'custom_weights' && node[9].length < node[6])))
      )
    ) {
      return [`Check the drawer/door count and height weights for section ${i + 1}.`];
    }
  }

  return [];
}

export function sectionRoot(parameters: CabinetParameters, thickness: number): Omit<SectionRect, 'id'> {
  const base =
    parameters.mountStyle !== 'wall' && parameters.baseStyle === 'toe_kick'
      ? parameters.toeKickHeight
      : 0;

  return {
    x: thickness,
    z: base + thickness,
    w: parameters.width - 2 * thickness,
    h: parameters.height - base - 2 * thickness,
  };
}

export function sectionRects(nodes: SectionNode[], root: Omit<SectionRect, 'id'>, thickness: number): SectionRect[] {
  if (treeErrors(nodes).length) return [];

  const out: SectionRect[] = [{ ...root, id: 0 }];
  for (let i = 1; i < nodes.length; i += 1) {
    const node = nodes[i];
    const parentRect = out[node[0]];
    const parentNode = nodes[node[0]];
    const children = childEntries(nodes, node[0]);
    const gap = parentNode[10] === 'none' ? 0 : thickness;
    const available =
      (parentNode[2] === 'x' ? parentRect.w : parentRect.h) - gap * (children.length - 1);
    const fixed = children
      .filter(entry => entry.node[3] === 'mm')
      .reduce((sum, entry) => sum + entry.node[4], 0);
    const totalWeight = children
      .filter(entry => entry.node[3] === 'weight')
      .reduce((sum, entry) => sum + entry.node[4], 0);

    const span = (candidate: SectionNode) =>
      candidate[3] === 'mm'
        ? candidate[4]
        : totalWeight > 0
          ? (available - fixed) * candidate[4] / totalWeight
          : 0;

    const size = span(node);
    const offset = children
      .filter(entry => entry.node[1] < node[1])
      .reduce((sum, entry) => sum + span(entry.node) + gap, 0);

    out[i] =
      parentNode[2] === 'x'
        ? { id: i, x: parentRect.x + offset, z: parentRect.z, w: size, h: parentRect.h }
        : {
            id: i,
            x: parentRect.x,
            z: parentRect.z + parentRect.h - offset - size,
            w: parentRect.w,
            h: size,
          };
  }

  return out;
}

export function sectionPanels(
  nodes: SectionNode[],
  rects: SectionRect[],
  thickness: number,
  depth: number,
): SectionPanel[] {
  const panels: SectionPanel[] = [];

  rects.forEach((rect, id) => {
    const node = nodes[id];
    if (id > 0) {
      const parentNode = nodes[node[0]];
      const parentRect = rects[node[0]];
      if (node[1] > 0 && parentNode[10] !== 'none') {
        if (parentNode[2] === 'x') {
          panels.push({
            id: `SEC-${node[0] + 1}-DIV-${node[1]}`,
            x: rect.x - thickness,
            z: parentRect.z,
            w: thickness,
            h: parentRect.h,
            d: depth,
            divider: 'panel',
            sourceParentId: node[0],
            sourceOrder: node[1],
            axis: 'x',
          });
        } else {
          panels.push({
            id: `SEC-${node[0] + 1}-DIV-${node[1]}`,
            x: parentRect.x,
            z: rect.z + rect.h,
            w: parentRect.w,
            h: thickness,
            d: parentNode[10] === 'rail' ? Math.min(80, depth) : depth,
            divider: parentNode[10] === 'rail' ? 'rail' : 'panel',
            sourceParentId: node[0],
            sourceOrder: node[1],
            axis: 'z',
          });
        }
      }
    }

    if (node[2] === 'leaf' && node[5] !== 'drawers') {
      const count = node[5] === 'open' ? node[6] : node[11];
      for (let shelf = 1; shelf <= count; shelf += 1) {
        const normalized = node[12]?.[shelf - 1] ?? shelf / (count + 1);
        panels.push({
          id: `SEC-${id + 1}-SH-${shelf}`,
          x: rect.x,
          z: rect.z + rect.h * normalized - thickness / 2,
          w: rect.w,
          h: thickness,
          d: Math.max(20, depth - 10),
          divider: 'panel',
          sourceSectionId: id,
          shelfIndex: shelf,
        });
      }
    }
  });

  return panels;
}

export function simpleLayoutToSections(parameters: Pick<CabinetParameters, 'cabinetContents' | 'drawerCount' | 'doorCount' | 'shelfCount'>): SectionNode[] {
  if (parameters.cabinetContents === 'combo') {
    const root = sectionLeaf();
    root[2] = 'z';
    const top = sectionLeaf(0, 0, 'drawers', Math.max(1, parameters.drawerCount));
    const bottom = sectionLeaf(0, 1, 'doors', Math.max(1, Math.min(2, parameters.doorCount)));
    top[4] = 1;
    bottom[4] = 2;
    bottom[11] = parameters.shelfCount;
    return [root, top, bottom];
  }

  if (parameters.cabinetContents === 'doors') {
    const root = sectionLeaf(-1, 0, 'doors', Math.max(1, Math.min(2, parameters.doorCount)));
    root[11] = parameters.shelfCount;
    return [root];
  }

  return [sectionLeaf(-1, 0, 'drawers', Math.max(1, parameters.drawerCount))];
}

export function sectionsFromWebValues(values: Record<string, unknown>, fallback: CabinetParameters): SectionNode[] {
  if (values.cabinet_layout_mode === 'sections' && !treeErrors(values.section_nodes).length) {
    return cloneSectionNodes(values.section_nodes as SectionNode[]);
  }

  if (values.cabinet_layout_mode === 'mixed_bays') {
    const count = clampInt(values.mixed_bay_count, 1, 4, 1);
    const types = arrayValue(values.mixed_bay_types);
    const weights = arrayValue(values.mixed_bay_width_weights);
    const drawerCounts = arrayValue(values.mixed_bay_drawer_counts);
    const shelfCounts = arrayValue(values.mixed_bay_shelf_counts);
    const doorCounts = arrayValue(values.mixed_bay_door_counts);
    const drawerModes = arrayValue(values.mixed_bay_drawer_height_modes);
    const graduatedSteps = arrayValue(values.mixed_bay_drawer_graduated_steps);
    const customWeightSets = arrayValue(values.mixed_bay_drawer_height_weights);
    const root = sectionLeaf();
    root[2] = 'x';
    root[10] = values.include_mixed_bay_partitions === false ? 'none' : 'panel';
    const nodes: SectionNode[] = [root];

    for (let i = 0; i < count; i += 1) {
      const rawType = String(types[i] ?? 'open');
      const contents: SectionNode[5] =
        rawType.includes('door') ? 'doors' : rawType.includes('drawer') ? 'drawers' : 'open';
      const countValue =
        contents === 'drawers'
          ? clampInt(drawerCounts[i], 1, 8, 4)
          : contents === 'doors'
            ? clampInt(doorCounts[i], 1, 2, 1)
            : clampInt(shelfCounts[i], 0, 8, 0);
      const node = sectionLeaf(0, i, contents, countValue);
      node[4] = positiveNumber(weights[i], 1);
      node[7] = drawerModes[i] === 'graduated' || drawerModes[i] === 'custom_weights'
        ? drawerModes[i] as SectionNode[7]
        : 'equal';
      node[8] = nonNegativeNumber(graduatedSteps[i], 0.35);
      const customWeights = arrayValue(customWeightSets[i])
        .slice(0, countValue)
        .map(weight => positiveNumber(weight, 1));
      if (node[7] === 'custom_weights' && customWeights.length === countValue) {
        node[9] = customWeights;
      } else {
        node[9] = Array(Math.max(1, countValue)).fill(1);
      }
      node[11] = clampInt(shelfCounts[i], 0, 8, 0);
      nodes.push(node);
    }

    if (count === 1) {
      nodes[1][0] = -1;
      nodes[1][1] = 0;
      return [nodes[1]];
    }

    return nodes;
  }

  return simpleLayoutToSections(fallback);
}

export function collapseSection(nodes: SectionNode[], id: number): SectionNode[] {
  const remove = new Set<number>();
  nodes.forEach((node, index) => {
    if (index !== id && (node[0] === id || remove.has(node[0]))) remove.add(index);
  });
  const kept = nodes.map((_, index) => index).filter(index => !remove.has(index));
  const map = new Map(kept.map((oldIndex, newIndex) => [oldIndex, newIndex]));

  return kept.map(oldIndex => {
    const node = cloneSectionNodes([nodes[oldIndex]])[0];
    node[0] = node[0] === -1 ? -1 : map.get(node[0]) ?? -1;
    if (oldIndex === id) node[2] = 'leaf';
    return node;
  });
}

export function selectedSectionIds(nodes: SectionNode[], id: number): Set<number> {
  const selected = new Set<number>();
  if (id >= 0 && id < nodes.length) {
    selected.add(id);
    nodes.forEach((node, index) => {
      if (selected.has(node[0])) selected.add(index);
    });
  }
  return selected;
}

export function sectionLayoutErrors(parameters: CabinetParameters, thickness: number) {
  const errors = treeErrors(parameters.sectionNodes);
  if (errors.length) return errors;

  const rects = sectionRects(parameters.sectionNodes, sectionRoot(parameters, thickness), thickness);
  if (rects.some(rect => !Number.isFinite(rect.w) || !Number.isFinite(rect.h) || rect.w < 60 || rect.h < 60)) {
    return ['Each section needs at least 60 mm clear width and height; reduce fixed sizes or enlarge the cabinet.'];
  }

  return [];
}

function childEntries(nodes: SectionNode[], parent: number) {
  return nodes
    .map((node, index) => ({ node, index }))
    .filter(entry => entry.node[0] === parent)
    .sort((a, b) => a.node[1] - b.node[1]);
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function positiveNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function nonNegativeNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.max(min, Math.min(max, numeric));
}
