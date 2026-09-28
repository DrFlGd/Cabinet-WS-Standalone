import type { CabinetParameters } from './types';

export type ParameterSection =
  | 'Envelope'
  | 'Materials'
  | 'Layout'
  | 'Carcass'
  | 'Base'
  | 'Fronts'
  | 'Shelves'
  | 'Worktop'
  | 'Joinery';

type BaseDefinition<K extends keyof CabinetParameters> = {
  key: K;
  label: string;
  description: string;
  section: ParameterSection;
  advanced?: boolean;
  visibleWhen?: (parameters: CabinetParameters) => boolean;
};

export type DimensionDefinition<K extends keyof CabinetParameters = keyof CabinetParameters> =
  BaseDefinition<K> & {
    kind: 'dimension';
    min: number;
    max: number;
    step: number;
  };

export type CountDefinition<K extends keyof CabinetParameters = keyof CabinetParameters> =
  BaseDefinition<K> & {
    kind: 'count';
    min: number;
    max: number;
  };

export type SelectDefinition<K extends keyof CabinetParameters = keyof CabinetParameters> =
  BaseDefinition<K> & {
    kind: 'select';
    options: readonly { value: CabinetParameters[K]; label: string }[];
  };

export type BooleanDefinition<K extends keyof CabinetParameters = keyof CabinetParameters> =
  BaseDefinition<K> & {
    kind: 'boolean';
  };

export type ParameterDefinition =
  | DimensionDefinition
  | CountDefinition
  | SelectDefinition
  | BooleanDefinition;

export const PARAMETER_SECTIONS: ParameterSection[] = [
  'Envelope',
  'Materials',
  'Layout',
  'Carcass',
  'Base',
  'Fronts',
  'Shelves',
  'Worktop',
  'Joinery',
];

const stockOptions = [
  { value: 'custom_mm', label: 'Measured stock' },
  { value: '1/8_nominal', label: '1/8 in nominal' },
  { value: '1/4_nominal', label: '1/4 in nominal' },
  { value: '3/8_nominal', label: '3/8 in nominal' },
  { value: '1/2_nominal', label: '1/2 in nominal' },
  { value: '5/8_nominal', label: '5/8 in nominal' },
  { value: '3/4_nominal', label: '3/4 in nominal' },
  { value: '1_nominal', label: '1 in nominal' },
] as const;

export const UTILITY_PARAMETER_SCHEMA: ParameterDefinition[] = [
  { key: 'width', kind: 'dimension', label: 'Cabinet width', description: 'Outside cabinet width.', section: 'Envelope', min: 300, max: 2400, step: 1 },
  { key: 'height', kind: 'dimension', label: 'Cabinet height', description: 'Outside cabinet height.', section: 'Envelope', min: 300, max: 3000, step: 1 },
  { key: 'depth', kind: 'dimension', label: 'Cabinet depth', description: 'Outside cabinet depth.', section: 'Envelope', min: 200, max: 1200, step: 1 },

  { key: 'carcassStock', kind: 'select', label: 'Carcass stock', description: 'Nominal or measured carcass sheet thickness.', section: 'Materials', options: stockOptions },
  { key: 'materialThickness', kind: 'dimension', label: 'Measured carcass', description: 'Used when carcass stock is Measured stock.', section: 'Materials', min: 6, max: 50, step: 0.01, visibleWhen: p => p.carcassStock === 'custom_mm' },
  { key: 'backStock', kind: 'select', label: 'Back stock', description: 'Nominal or measured applied-back thickness.', section: 'Materials', options: stockOptions },
  { key: 'backThickness', kind: 'dimension', label: 'Measured back', description: 'Used when back stock is Measured stock.', section: 'Materials', min: 2, max: 25, step: 0.01, visibleWhen: p => p.backStock === 'custom_mm' },
  { key: 'drawerMaterialThickness', kind: 'dimension', label: 'Drawer box stock', description: 'Reserved for the drawer-box parity milestone.', section: 'Materials', min: 6, max: 30, step: 0.01, advanced: true },
  { key: 'drawerBottomThickness', kind: 'dimension', label: 'Drawer bottom stock', description: 'Reserved for the drawer-box parity milestone.', section: 'Materials', min: 2, max: 20, step: 0.01, advanced: true },
  { key: 'drawerFrontThickness', kind: 'dimension', label: 'Drawer front stock', description: 'Decorative drawer-front thickness.', section: 'Materials', min: 6, max: 40, step: 0.01 },
  { key: 'doorThickness', kind: 'dimension', label: 'Door stock', description: 'Decorative door thickness.', section: 'Materials', min: 6, max: 40, step: 0.01 },

  { key: 'cabinetContents', kind: 'select', label: 'Contents', description: 'Primary Utility Cabinet front layout.', section: 'Layout', options: [
    { value: 'drawers', label: 'Drawers' },
    { value: 'doors', label: 'Doors' },
    { value: 'combo', label: 'Drawers + doors' },
  ] },
  { key: 'drawerCount', kind: 'count', label: 'Drawer rows', description: 'Number of decorative drawer-front rows.', section: 'Layout', min: 0, max: 8, visibleWhen: p => p.cabinetContents !== 'doors' },
  { key: 'doorCount', kind: 'count', label: 'Doors', description: 'Number of decorative doors.', section: 'Layout', min: 0, max: 4, visibleWhen: p => p.cabinetContents !== 'drawers' },

  { key: 'topStyle', kind: 'select', label: 'Top construction', description: 'Full cabinet top or front/rear stretchers.', section: 'Carcass', options: [
    { value: 'full', label: 'Full panel' },
    { value: 'stretchers', label: 'Stretchers' },
  ] },
  { key: 'topStretcherDepth', kind: 'dimension', label: 'Top stretcher depth', description: 'Front-to-back depth of top stretchers.', section: 'Carcass', min: 30, max: 250, step: 1, visibleWhen: p => p.topStyle === 'stretchers' },
  { key: 'backStyle', kind: 'select', label: 'Rear construction', description: 'Applied back, structural back, stretchers, or open.', section: 'Carcass', options: [
    { value: 'panel', label: 'Applied panel' },
    { value: 'structural_panel', label: 'Structural panel' },
    { value: 'stretchers', label: 'Stretchers' },
    { value: 'none', label: 'Open back' },
  ] },
  { key: 'backInset', kind: 'dimension', label: 'Back inset', description: 'Applied-panel inset from cabinet rear.', section: 'Carcass', min: 0, max: 100, step: 1, visibleWhen: p => p.backStyle === 'panel' },
  { key: 'backStretcherCount', kind: 'count', label: 'Back stretchers', description: 'Number of structural rear rails.', section: 'Carcass', min: 1, max: 4, visibleWhen: p => p.backStyle === 'stretchers' },
  { key: 'backStretcherHeight', kind: 'dimension', label: 'Back stretcher height', description: 'Vertical height of each rear stretcher.', section: 'Carcass', min: 30, max: 300, step: 1, visibleWhen: p => p.backStyle === 'stretchers' },
  { key: 'bottomWidthStyle', kind: 'select', label: 'Bottom width', description: 'Joined bottom fits between sides; full-width bottom carries side loads.', section: 'Carcass', options: [
    { value: 'joined', label: 'Joined between sides' },
    { value: 'full_width', label: 'Full cabinet width' },
  ] },

  { key: 'mountStyle', kind: 'select', label: 'Mount context', description: 'Wall mounting suppresses floor base geometry.', section: 'Base', options: [
    { value: 'floor', label: 'Floor' },
    { value: 'wall', label: 'Wall' },
  ] },
  { key: 'baseStyle', kind: 'select', label: 'Base style', description: 'Floor-base construction.', section: 'Base', visibleWhen: p => p.mountStyle === 'floor', options: [
    { value: 'toe_kick', label: 'Toe kick' },
    { value: 'flat', label: 'Flat' },
    { value: 'leveling_feet', label: 'Leveling feet' },
    { value: 'casters', label: 'Casters' },
  ] },
  { key: 'toeKickHeight', kind: 'dimension', label: 'Toe-kick height', description: 'Vertical floor-base height.', section: 'Base', min: 0, max: 350, step: 1, visibleWhen: p => p.mountStyle === 'floor' && p.baseStyle === 'toe_kick' },
  { key: 'toeKickDepth', kind: 'dimension', label: 'Toe-kick setback', description: 'Front setback of toe-kick rail.', section: 'Base', min: 0, max: 300, step: 1, visibleWhen: p => p.mountStyle === 'floor' && p.baseStyle === 'toe_kick' },
  { key: 'sideToeKickCutout', kind: 'select', label: 'Side toe-kick notch', description: 'Semantic side-panel notch intent; exact notch arrives with the B-Rep kernel.', section: 'Base', visibleWhen: p => p.mountStyle === 'floor' && p.baseStyle === 'toe_kick', options: [
    { value: 'none', label: 'None' },
    { value: 'left', label: 'Left side' },
    { value: 'right', label: 'Right side' },
    { value: 'both', label: 'Both sides' },
  ] },

  { key: 'frontMountStyle', kind: 'select', label: 'Front mounting', description: 'Overlay fronts sit proud; inset fronts occupy the opening.', section: 'Fronts', options: [
    { value: 'overlay', label: 'Overlay' },
    { value: 'inset_flush', label: 'Inset flush' },
  ] },
  { key: 'frontEdgeReveal', kind: 'dimension', label: 'Edge reveal', description: 'Reveal from carcass opening edges.', section: 'Fronts', min: 0, max: 20, step: 0.1 },
  { key: 'drawerGap', kind: 'dimension', label: 'Drawer gap', description: 'Gap between adjacent drawer fronts.', section: 'Fronts', min: 0.5, max: 20, step: 0.1, visibleWhen: p => p.cabinetContents !== 'doors' },
  { key: 'doorGap', kind: 'dimension', label: 'Door gap', description: 'Gap between adjacent doors.', section: 'Fronts', min: 0.5, max: 20, step: 0.1, visibleWhen: p => p.cabinetContents !== 'drawers' },

  { key: 'shelfCount', kind: 'count', label: 'Shelf panels', description: 'Number of shelves supplied in the door/open region.', section: 'Shelves', min: 0, max: 6, visibleWhen: p => p.cabinetContents !== 'drawers' },
  { key: 'shelfStyle', kind: 'select', label: 'Shelf style', description: 'Fixed shelves or adjustable shelf-pin shelves.', section: 'Shelves', visibleWhen: p => p.cabinetContents !== 'drawers' && p.shelfCount > 0, options: [
    { value: 'fixed', label: 'Fixed' },
    { value: 'adjustable', label: 'Adjustable' },
  ] },

  { key: 'includeWorktop', kind: 'boolean', label: 'Add worktop', description: 'Separate work surface above the carcass.', section: 'Worktop' },
  { key: 'worktopThickness', kind: 'dimension', label: 'Worktop thickness', description: 'Work-surface stock thickness.', section: 'Worktop', min: 6, max: 100, step: 0.1, visibleWhen: p => p.includeWorktop },
  { key: 'worktopSideOverhang', kind: 'dimension', label: 'Side overhang', description: 'Overhang on each cabinet side.', section: 'Worktop', min: 0, max: 300, step: 1, visibleWhen: p => p.includeWorktop },
  { key: 'worktopFrontOverhang', kind: 'dimension', label: 'Front overhang', description: 'Worktop extension beyond cabinet front.', section: 'Worktop', min: 0, max: 300, step: 1, visibleWhen: p => p.includeWorktop },
  { key: 'worktopBackOverhang', kind: 'dimension', label: 'Back overhang', description: 'Worktop extension beyond cabinet rear.', section: 'Worktop', min: 0, max: 300, step: 1, visibleWhen: p => p.includeWorktop },

  { key: 'joineryStyle', kind: 'select', label: 'Carcass joinery', description: 'Semantic carcass joinery intent ported from the web engine.', section: 'Joinery', options: [
    { value: 'butt', label: 'Butt' },
    { value: 'screw', label: 'Screw' },
    { value: 'dado', label: 'Dado' },
    { value: 'tab_slot', label: 'Tab + slot' },
  ] },
  { key: 'dadoDepth', kind: 'dimension', label: 'Dado depth', description: 'Blind dado depth into cabinet sides.', section: 'Joinery', min: 2, max: 18, step: 0.5, visibleWhen: p => p.joineryStyle === 'dado' },
  { key: 'dadoFitClearance', kind: 'dimension', label: 'Dado fit clearance', description: 'Added width clearance around the mating panel.', section: 'Joinery', min: 0, max: 2, step: 0.05, visibleWhen: p => p.joineryStyle === 'dado' },
];

export function visibleParameters(parameters: CabinetParameters) {
  return UTILITY_PARAMETER_SCHEMA.filter(field => !field.visibleWhen || field.visibleWhen(parameters));
}
