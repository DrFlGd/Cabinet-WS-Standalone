import type { CabinetParameters } from './types';

export type ParameterSection =
  | 'Envelope'
  | 'Materials'
  | 'Layout'
  | 'Carcass'
  | 'Base'
  | 'Fronts'
  | 'Face Frame'
  | 'Shelves'
  | 'Worktop'
  | 'Joinery'
  | 'Hardware';

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

export type NumberDefinition<K extends keyof CabinetParameters = keyof CabinetParameters> =
  BaseDefinition<K> & {
    kind: 'number';
    min: number;
    max: number;
    step: number;
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
  | NumberDefinition
  | SelectDefinition
  | BooleanDefinition;

export const PARAMETER_SECTIONS: ParameterSection[] = [
  'Envelope',
  'Materials',
  'Layout',
  'Carcass',
  'Base',
  'Fronts',
  'Face Frame',
  'Shelves',
  'Worktop',
  'Joinery',
  'Hardware',
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
  { key: 'width', kind: 'dimension', label: 'Envelope width', description: 'Outside family/model width.', section: 'Envelope', min: 40, max: 3000, step: 1 },
  { key: 'height', kind: 'dimension', label: 'Envelope height', description: 'Outside family/model height.', section: 'Envelope', min: 30, max: 3000, step: 1 },
  { key: 'depth', kind: 'dimension', label: 'Envelope depth', description: 'Outside family/model depth.', section: 'Envelope', min: 40, max: 1600, step: 1 },

  { key: 'carcassStock', kind: 'select', label: 'Carcass stock', description: 'Nominal or measured carcass sheet thickness.', section: 'Materials', options: stockOptions },
  { key: 'materialThickness', kind: 'dimension', label: 'Measured carcass', description: 'Used when carcass stock is Measured stock.', section: 'Materials', min: 6, max: 50, step: 0.01, visibleWhen: p => p.carcassStock === 'custom_mm' },
  { key: 'backStock', kind: 'select', label: 'Back stock', description: 'Nominal or measured applied-back thickness.', section: 'Materials', options: stockOptions },
  { key: 'backThickness', kind: 'dimension', label: 'Measured back', description: 'Used when back stock is Measured stock.', section: 'Materials', min: 2, max: 25, step: 0.01, visibleWhen: p => p.backStock === 'custom_mm' },
  { key: 'drawerMaterialThickness', kind: 'dimension', label: 'Drawer box stock', description: 'Thickness used by rendered drawer sides, fronts, and backs.', section: 'Materials', min: 6, max: 30, step: 0.01, advanced: true },
  { key: 'drawerBottomThickness', kind: 'dimension', label: 'Drawer bottom stock', description: 'Thickness used by rendered drawer bottoms.', section: 'Materials', min: 2, max: 20, step: 0.01, advanced: true },
  { key: 'drawerFrontThickness', kind: 'dimension', label: 'Drawer front stock', description: 'Decorative drawer-front thickness.', section: 'Materials', min: 6, max: 40, step: 0.01 },
  { key: 'doorThickness', kind: 'dimension', label: 'Door stock', description: 'Decorative door thickness.', section: 'Materials', min: 6, max: 40, step: 0.01 },

  { key: 'cabinetContents', kind: 'select', label: 'Contents', description: 'Primary front layout for the active family adapter.', section: 'Layout', visibleWhen: p => p.layoutMode === 'legacy', options: [
    { value: 'drawers', label: 'Drawers' },
    { value: 'doors', label: 'Doors' },
    { value: 'combo', label: 'Drawers + doors' },
  ] },
  { key: 'drawerCount', kind: 'count', label: 'Drawer rows', description: 'Number of decorative drawer-front rows.', section: 'Layout', min: 0, max: 8, visibleWhen: p => p.layoutMode === 'legacy' && p.cabinetContents !== 'doors' },
  { key: 'drawerHeightMode', kind: 'select', label: 'Drawer heights', description: 'Equal, graduated, or custom-weighted drawer-front heights in Simple layout.', section: 'Layout', visibleWhen: p => p.layoutMode === 'legacy' && p.cabinetContents !== 'doors' && p.drawerCount > 1, options: [
    { value: 'equal', label: 'Equal' },
    { value: 'graduated', label: 'Graduated' },
    { value: 'custom_weights', label: 'Custom weights' },
  ] },
  { key: 'drawerGraduatedStep', kind: 'number', label: 'Graduated step', description: 'Relative growth per successive drawer row.', section: 'Layout', min: 0.05, max: 2, step: 0.05, visibleWhen: p => p.layoutMode === 'legacy' && p.drawerHeightMode === 'graduated' },
  { key: 'doorCount', kind: 'count', label: 'Doors', description: 'Number of decorative doors.', section: 'Layout', min: 0, max: 4, visibleWhen: p => p.layoutMode === 'legacy' && p.cabinetContents !== 'drawers' },

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
  { key: 'sideToeKickCutout', kind: 'select', label: 'Side toe-kick notch', description: 'Cuts the selected side-panel profile back to the toe-kick rail.', section: 'Base', visibleWhen: p => p.mountStyle === 'floor' && p.baseStyle === 'toe_kick', options: [
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
  { key: 'drawerGap', kind: 'dimension', label: 'Drawer gap', description: 'Gap between adjacent drawer fronts.', section: 'Fronts', min: 0.5, max: 20, step: 0.1, visibleWhen: p => hasDrawers(p) },
  { key: 'drawerFrontRegistration', kind: 'select', label: 'Drawer-box registration', description: 'Vertical relationship between each drawer box and its decorative front.', section: 'Fronts', visibleWhen: hasDrawers, options: [
    { value: 'centered', label: 'Centered' },
    { value: 'flush_top', label: 'Flush to front top' },
    { value: 'flush_bottom', label: 'Flush to front bottom' },
  ] },
  { key: 'doorGap', kind: 'dimension', label: 'Door gap', description: 'Gap between adjacent doors.', section: 'Fronts', min: 0.5, max: 20, step: 0.1, visibleWhen: hasDoors },

  { key: 'faceFrameStyle', kind: 'select', label: 'Face frame', description: 'Add a semantic hardwood face frame around cabinet openings.', section: 'Face Frame', options: [
    { value: 'none', label: 'Frameless' },
    { value: 'full', label: 'Full face frame' },
  ] },
  { key: 'faceFrameThickness', kind: 'dimension', label: 'Frame thickness', description: 'Front-to-back stock thickness for stiles and rails.', section: 'Face Frame', min: 8, max: 40, step: 0.1, visibleWhen: p => p.faceFrameStyle === 'full' },
  { key: 'faceFrameStileWidth', kind: 'dimension', label: 'Outer stile width', description: 'Width of left and right face-frame stiles.', section: 'Face Frame', min: 20, max: 120, step: 1, visibleWhen: p => p.faceFrameStyle === 'full' },
  { key: 'faceFrameRailWidth', kind: 'dimension', label: 'Rail width', description: 'Width of top/bottom and horizontal opening rails.', section: 'Face Frame', min: 20, max: 120, step: 1, visibleWhen: p => p.faceFrameStyle === 'full' },
  { key: 'faceFrameCenterStileWidth', kind: 'dimension', label: 'Center stile width', description: 'Width used at vertical opening boundaries and paired-door center stiles.', section: 'Face Frame', min: 20, max: 120, step: 1, visibleWhen: p => p.faceFrameStyle === 'full' },

  { key: 'shelfCount', kind: 'count', label: 'Shelf panels', description: 'Number of shelves supplied in the door/open region.', section: 'Layout', min: 0, max: 6, visibleWhen: p => p.layoutMode === 'legacy' && p.cabinetContents !== 'drawers' },
  { key: 'shelfStyle', kind: 'select', label: 'Shelf style', description: 'Fixed shelves or adjustable shelf-pin shelves. In Sections mode this applies to generated shelf panels.', section: 'Shelves', visibleWhen: p => p.layoutMode === 'sections' || (p.cabinetContents !== 'drawers' && p.shelfCount > 0), options: [
    { value: 'fixed', label: 'Fixed' },
    { value: 'adjustable', label: 'Adjustable' },
  ] },

  { key: 'includeWorktop', kind: 'boolean', label: 'Add worktop', description: 'Separate work surface above the carcass.', section: 'Worktop' },
  { key: 'worktopThickness', kind: 'dimension', label: 'Worktop thickness', description: 'Work-surface stock thickness.', section: 'Worktop', min: 6, max: 100, step: 0.1, visibleWhen: p => p.includeWorktop },
  { key: 'worktopSideOverhang', kind: 'dimension', label: 'Side overhang', description: 'Overhang on each cabinet side.', section: 'Worktop', min: 0, max: 300, step: 1, visibleWhen: p => p.includeWorktop },
  { key: 'worktopFrontOverhang', kind: 'dimension', label: 'Front overhang', description: 'Worktop extension beyond cabinet front.', section: 'Worktop', min: 0, max: 300, step: 1, visibleWhen: p => p.includeWorktop },
  { key: 'worktopBackOverhang', kind: 'dimension', label: 'Back overhang', description: 'Worktop extension beyond cabinet rear.', section: 'Worktop', min: 0, max: 300, step: 1, visibleWhen: p => p.includeWorktop },

  { key: 'joineryStyle', kind: 'select', label: 'Carcass joinery', description: 'Renders visible screw drilling, dado recesses, or tab/slot cutouts on supported carcass joints.', section: 'Joinery', options: [
    { value: 'butt', label: 'Butt' },
    { value: 'screw', label: 'Screw' },
    { value: 'dado', label: 'Dado' },
    { value: 'tab_slot', label: 'Tab + slot' },
  ] },
  { key: 'dadoDepth', kind: 'dimension', label: 'Dado depth', description: 'Blind dado depth into cabinet sides.', section: 'Joinery', min: 2, max: 18, step: 0.5, visibleWhen: p => p.joineryStyle === 'dado' },
  { key: 'dadoFitClearance', kind: 'dimension', label: 'Dado fit clearance', description: 'Added width clearance around the mating panel.', section: 'Joinery', min: 0, max: 2, step: 0.05, visibleWhen: p => p.joineryStyle === 'dado' },
  { key: 'drawerJoineryStyle', kind: 'select', label: 'Drawer joinery', description: 'Construction for drawer box corners.', section: 'Joinery', visibleWhen: hasDrawers, options: [
    { value: 'butt', label: 'Butt' },
    { value: 'rabbet', label: 'Rabbet' },
    { value: 'lock_rabbet', label: 'Lock rabbet' },
  ] },
  { key: 'drawerBottomStyle', kind: 'select', label: 'Drawer bottom', description: 'Captured bottom uses a groove; applied bottom sits beneath the box.', section: 'Joinery', visibleWhen: hasDrawers, options: [
    { value: 'captured', label: 'Captured in groove' },
    { value: 'applied', label: 'Applied underneath' },
  ] },
  { key: 'drawerBottomGrooveDepth', kind: 'dimension', label: 'Bottom groove depth', description: 'Groove depth for captured drawer bottoms.', section: 'Joinery', min: 1, max: 10, step: 0.5, visibleWhen: p => hasDrawers(p) && p.drawerBottomStyle === 'captured' },
  { key: 'drawerDividerCount', kind: 'count', label: 'Drawer divider columns', description: 'Internal organizer divider columns generated inside every drawer box.', section: 'Joinery', min: 0, max: 4, visibleWhen: hasDrawers },
  { key: 'drawerDividerRows', kind: 'count', label: 'Drawer divider rows', description: 'Internal organizer divider rows generated inside every drawer box.', section: 'Joinery', min: 0, max: 4, visibleWhen: hasDrawers },
  { key: 'drawerMount', kind: 'select', label: 'Drawer mounting', description: 'Wood runners or selected metal drawer-slide hardware.', section: 'Hardware', visibleWhen: hasDrawers, options: [
    { value: 'wood_rails', label: 'Wood runners' },
    { value: 'metal_slides', label: 'Metal slides' },
  ] },
  { key: 'metalSlideClearancePerSide', kind: 'dimension', label: 'Slide side clearance', description: 'Required clearance on each drawer side. Selected hardware presets update this value.', section: 'Hardware', min: 3, max: 40, step: 0.1, visibleWhen: p => hasDrawers(p) && p.drawerMount === 'metal_slides' },
  { key: 'metalSlideLength', kind: 'dimension', label: 'Slide length', description: 'Nominal slide length; also limits rendered drawer-box depth.', section: 'Hardware', min: 100, max: 1200, step: 1, visibleWhen: p => hasDrawers(p) && p.drawerMount === 'metal_slides' },
  { key: 'metalSlideFrontSetback', kind: 'dimension', label: 'Slide front setback', description: 'Slide setback from the cabinet/drawer front reference.', section: 'Hardware', min: 0, max: 50, step: 0.1, advanced: true, visibleWhen: p => hasDrawers(p) && p.drawerMount === 'metal_slides' },
  { key: 'metalSlideEnvelopeHeight', kind: 'dimension', label: 'Slide envelope height', description: 'Simplified slide envelope used for reference geometry and keepout.', section: 'Hardware', min: 10, max: 120, step: 0.1, advanced: true, visibleWhen: p => hasDrawers(p) && p.drawerMount === 'metal_slides' },
  { key: 'includeMetalSlideHoles', kind: 'boolean', label: 'Slide drilling', description: 'Enable cabinet/drawer drilling only when the selected profile provides an encoded pattern.', section: 'Hardware', visibleWhen: p => hasDrawers(p) && p.drawerMount === 'metal_slides' },
  { key: 'hardwareDrillingMode', kind: 'select', label: 'Hardware drilling mode', description: 'Recommended uses the encoded profile drilling; Off preserves hardware envelopes without drilling.', section: 'Hardware', advanced: true, visibleWhen: p => hasDrawers(p) && p.drawerMount === 'metal_slides' && p.includeMetalSlideHoles, options: [
    { value: 'off', label: 'Off' },
    { value: 'recommended', label: 'Recommended profile drilling' },
  ] },

  { key: 'hingeStyle', kind: 'select', label: 'Door hinges', description: 'Enable concealed 35 mm cup hinges or leave door hardware unassigned.', section: 'Hardware', visibleWhen: hasDoors, options: [
    { value: 'none', label: 'No hinge assigned' },
    { value: 'euro_35mm', label: '35 mm concealed hinge' },
  ] },
  { key: 'hingeCupDiameter', kind: 'dimension', label: 'Hinge cup diameter', description: 'Door cup diameter from the selected hinge profile.', section: 'Hardware', min: 20, max: 50, step: 0.1, visibleWhen: p => hasDoors(p) && p.hingeStyle === 'euro_35mm' },
  { key: 'hingeCupDepth', kind: 'dimension', label: 'Hinge cup depth', description: 'Blind hinge-cup drilling depth. Compatibility warns before breakthrough.', section: 'Hardware', min: 4, max: 25, step: 0.1, visibleWhen: p => hasDoors(p) && p.hingeStyle === 'euro_35mm' },
  { key: 'hingeCupCenterFromDoorEdge', kind: 'dimension', label: 'Cup center from edge', description: 'Distance from hinged door edge to cup center.', section: 'Hardware', min: 10, max: 40, step: 0.1, advanced: true, visibleWhen: p => hasDoors(p) && p.hingeStyle === 'euro_35mm' },
  { key: 'hingeDoorFixingEnabled', kind: 'boolean', label: 'Door fixing drilling', description: 'Profile-controlled fixing-hole intent. Manufacturer-partial presets may disable this intentionally.', section: 'Hardware', advanced: true, visibleWhen: p => hasDoors(p) && p.hingeStyle === 'euro_35mm' },
  { key: 'hingeDoorFixingHoleSpacing', kind: 'dimension', label: 'Door fixing spacing', description: 'Center-to-center spacing for encoded door fixing holes.', section: 'Hardware', min: 10, max: 80, step: 0.1, advanced: true, visibleWhen: p => hasDoors(p) && p.hingeStyle === 'euro_35mm' && p.hingeDoorFixingEnabled },
  { key: 'hingePlateHolesEnabled', kind: 'boolean', label: 'Mounting plate drilling', description: 'Enable encoded cabinet mounting-plate drilling.', section: 'Hardware', advanced: true, visibleWhen: p => hasDoors(p) && p.hingeStyle === 'euro_35mm' },
  { key: 'hingePlateCenterFromFront', kind: 'dimension', label: 'Plate line from front', description: 'Cabinet-side system line for mounting-plate drilling.', section: 'Hardware', min: 5, max: 150, step: 0.1, advanced: true, visibleWhen: p => hasDoors(p) && p.hingeStyle === 'euro_35mm' && p.hingePlateHolesEnabled },
  { key: 'hingePlateHoleSpacing', kind: 'dimension', label: 'Plate hole spacing', description: 'Center-to-center mounting-plate hole spacing.', section: 'Hardware', min: 10, max: 80, step: 0.1, advanced: true, visibleWhen: p => hasDoors(p) && p.hingeStyle === 'euro_35mm' && p.hingePlateHolesEnabled },
];

function hasDrawers(parameters: CabinetParameters) {
  if (parameters.layoutMode === 'sections') {
    return parameters.sectionNodes.some(node => node[2] === 'leaf' && node[5] === 'drawers' && node[6] > 0);
  }
  return parameters.cabinetContents !== 'doors' && parameters.drawerCount > 0;
}

function hasDoors(parameters: CabinetParameters) {
  if (parameters.layoutMode === 'sections') {
    return parameters.sectionNodes.some(node => node[2] === 'leaf' && node[5] === 'doors' && node[6] > 0);
  }
  return parameters.cabinetContents !== 'drawers' && parameters.doorCount > 0;
}

export function visibleParameters(parameters: CabinetParameters) {
  return UTILITY_PARAMETER_SCHEMA.filter(field => !field.visibleWhen || field.visibleWhen(parameters));
}
