import type { CabinetParameters } from './types';

export type UtilityStarter = {
  id: string;
  name: string;
  description: string;
  parameters: CabinetParameters;
};

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
  };
}

const defaults = makeUtilityDefaults();
const withDefaults = (patch: Partial<CabinetParameters>): CabinetParameters => ({ ...defaults, ...patch });

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
