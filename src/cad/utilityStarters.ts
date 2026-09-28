import { sectionLeaf } from './sections';
import type { CabinetParameters, SectionNode } from './types';

export type UtilityStarter = {
  id: string;
  name: string;
  description: string;
  parameters: CabinetParameters;
};

function defaultSectionNodes(): SectionNode[] {
  const root = sectionLeaf();
  root[2] = 'z';
  const top = sectionLeaf(0, 0, 'drawers', 2);
  const bottom = sectionLeaf(0, 1, 'doors', 2);
  top[4] = 1;
  bottom[4] = 2;
  bottom[11] = 1;
  return [root, top, bottom];
}

export function makeUtilityDefaults(): CabinetParameters {
  return {
    width: 760,
    height: 900,
    depth: 610,

    carcassStock: 'custom_mm',
    backStock: 'custom_mm',
    materialThickness: 18,
    backThickness: 6,
    drawerMaterialThickness: 12,
    drawerBottomThickness: 6,
    drawerFrontThickness: 18,
    doorThickness: 18,

    layoutMode: 'legacy',
    sectionNodes: defaultSectionNodes(),
    cabinetContents: 'combo',
    drawerCount: 2,
    doorCount: 2,
    shelfCount: 1,

    topStyle: 'stretchers',
    topStretcherDepth: 90,
    backStyle: 'panel',
    backInset: 0,
    backStretcherCount: 2,
    backStretcherHeight: 100,

    mountStyle: 'floor',
    baseStyle: 'toe_kick',
    toeKickHeight: 100,
    toeKickDepth: 65,
    sideToeKickCutout: 'none',
    bottomWidthStyle: 'joined',

    includeWorktop: false,
    worktopThickness: 38,
    worktopSideOverhang: 15,
    worktopFrontOverhang: 25,
    worktopBackOverhang: 0,

    joineryStyle: 'butt',
    dadoDepth: 6,
    dadoFitClearance: 0.2,

    frontMountStyle: 'overlay',
    frontEdgeReveal: 2,
    doorGap: 3,
    drawerGap: 3,
    shelfStyle: 'fixed',

    drawerMount: 'wood_rails',
    drawerSlideId: '',
    metalSlideClearancePerSide: 12.7,
    metalSlideLength: 450,
    metalSlideFrontSetback: 3,
    metalSlideEnvelopeHeight: 45,
    includeMetalSlideHoles: false,
    hardwareDrillingMode: 'off',
    metalSlideCabinetHolesX: [37, 133, 229, 325],
    metalSlideDrawerHolesX: [37, 133, 229, 325],
    metalSlideCabinetHoleDiameter: 5,
    metalSlideDrawerHoleDiameter: 5,
    metalSlideCabinetHoleZFromDrawerBottom: 22.5,
    metalSlideDrawerHoleZFromDrawerBottom: 22.5,

    hingeStyle: 'none',
    hingeId: '',
    hingeCupDiameter: 35,
    hingeCupDepth: 12,
    hingeCupCenterFromDoorEdge: 22.5,
    hingeDoorFixingEnabled: false,
    hingeDoorFixingHoleDiameter: 3,
    hingeDoorFixingHoleSpacing: 45,
    hingePlateHolesEnabled: false,
    hingePlateHoleDiameter: 5,
    hingePlateCenterFromFront: 37,
    hingePlateHoleSpacing: 32,
  };
}

const defaults = makeUtilityDefaults();
const withDefaults = (patch: Partial<CabinetParameters>): CabinetParameters => ({
  ...defaults,
  ...patch,
  sectionNodes: patch.sectionNodes
    ? patch.sectionNodes.map(node => [...node.slice(0, 9), [...node[9]], ...node.slice(10)] as SectionNode)
    : defaultSectionNodes(),
});

function wideDrawerSections(count: 3 | 4): SectionNode[] {
  const root = sectionLeaf();
  root[2] = 'x';
  root[10] = 'panel';
  const nodes: SectionNode[] = [root];

  for (let index = 0; index < count; index += 1) {
    const node = sectionLeaf(0, index, 'drawers', 4);
    node[4] = 1;
    nodes.push(node);
  }
  return nodes;
}

function wideMixedSections(): SectionNode[] {
  const root = sectionLeaf();
  root[2] = 'x';
  root[10] = 'panel';

  const left = sectionLeaf(0, 0, 'drawers', 4);
  left[4] = 1;

  const middle = sectionLeaf(0, 1, 'drawers', 3);
  middle[4] = 1;

  const right = sectionLeaf(0, 2, 'doors', 1);
  right[4] = 1.2;
  right[11] = 2;

  return [root, left, middle, right];
}

export const UTILITY_STARTERS: UtilityStarter[] = [
  {
    id: 'default',
    name: 'Default configuration',
    description: 'Web Utility Cabinet default: two drawers over two doors.',
    parameters: withDefaults({}),
  },
  {
    id: 'utility_3_drawer_base',
    name: '3 Drawer Base',
    description: 'Three equal drawer fronts on a toe-kick base.',
    parameters: withDefaults({ cabinetContents: 'drawers', drawerCount: 3, doorCount: 0 }),
  },
  {
    id: 'utility_4_drawer_base',
    name: '4 Drawer Base',
    description: 'Four equal drawer fronts on a toe-kick base.',
    parameters: withDefaults({ cabinetContents: 'drawers', drawerCount: 4, doorCount: 0 }),
  },
  {
    id: 'utility_door_base',
    name: 'Door Base',
    description: 'Two-door base cabinet with one adjustable shelf.',
    parameters: withDefaults({ cabinetContents: 'doors', drawerCount: 0, doorCount: 2, shelfCount: 1, shelfStyle: 'adjustable' }),
  },
  {
    id: 'utility_2_drawer_2_door',
    name: '2 Drawer / 2 Door',
    description: 'The primary combination Utility Cabinet configuration.',
    parameters: withDefaults({ cabinetContents: 'combo', drawerCount: 2, doorCount: 2 }),
  },
  {
    id: 'utility_1_drawer_2_door',
    name: '1 Drawer / 2 Door',
    description: 'Single upper drawer row with a two-door lower compartment.',
    parameters: withDefaults({ cabinetContents: 'combo', drawerCount: 1, doorCount: 2 }),
  },
  {
    id: 'utility_wide_3_section_drawers',
    name: 'Wide 3-Section Drawers',
    description: 'Three equal drawer bays using the v0.4 section tree.',
    parameters: withDefaults({
      width: 1200,
      layoutMode: 'sections',
      sectionNodes: wideDrawerSections(3),
      cabinetContents: 'drawers',
    }),
  },
  {
    id: 'utility_wide_4_section_drawers',
    name: 'Wide 4-Section Drawers',
    description: 'Four equal drawer bays using the v0.4 section tree.',
    parameters: withDefaults({
      width: 1600,
      layoutMode: 'sections',
      sectionNodes: wideDrawerSections(4),
      cabinetContents: 'drawers',
    }),
  },
  {
    id: 'utility_wide_mixed_base',
    name: 'Wide Mixed Base',
    description: 'Two drawer bays plus a wider door/shelf bay.',
    parameters: withDefaults({
      width: 1400,
      layoutMode: 'sections',
      sectionNodes: wideMixedSections(),
      cabinetContents: 'combo',
    }),
  },
  {
    id: 'utility_tall_2_door_storage',
    name: 'Tall 2-Door Storage',
    description: 'Tall floor cabinet with two doors and four adjustable shelves.',
    parameters: withDefaults({
      width: 900,
      height: 1800,
      depth: 500,
      cabinetContents: 'doors',
      drawerCount: 0,
      doorCount: 2,
      shelfCount: 4,
      shelfStyle: 'adjustable',
    }),
  },
  {
    id: 'utility_2_door_wall',
    name: '2-Door Wall',
    description: 'Shallow wall cabinet with a full top and two adjustable shelves.',
    parameters: withDefaults({
      width: 760,
      height: 760,
      depth: 330,
      cabinetContents: 'doors',
      drawerCount: 0,
      doorCount: 2,
      shelfCount: 2,
      shelfStyle: 'adjustable',
      topStyle: 'full',
      mountStyle: 'wall',
      baseStyle: 'flat',
    }),
  },
];

export function utilityStarter(id: string) {
  return UTILITY_STARTERS.find(starter => starter.id === id) ?? UTILITY_STARTERS[0];
}
