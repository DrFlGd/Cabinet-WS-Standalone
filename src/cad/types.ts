import type { DisplayUnits } from './units';

export type PartCategory = 'carcass' | 'back' | 'shelf' | 'front' | 'drawer' | 'hardware' | 'worktop' | 'divider';

export type Vec3 = { x: number; y: number; z: number };

export type CadProfilePoint = { u: number; v: number };

export type CadProfileHole =
  | { kind: 'circle'; u: number; v: number; radius: number }
  | { kind: 'rect'; u: number; v: number; width: number; height: number };

export type CadPartGeometry = {
  kind: 'extruded-profile';
  axis: 'x' | 'z';
  outline: CadProfilePoint[];
  holes?: CadProfileHole[];
};

export type CadRenderFeature = {
  kind: 'dado' | 'rabbet' | 'slot' | 'drill';
  position: Vec3;
  size: Vec3;
  color?: string;
  opacity?: number;
};

export type CadPart = {
  id: string;
  name: string;
  category: PartCategory;
  material: string;
  position: Vec3;
  size: Vec3;
  color: string;
  visible: boolean;
  geometry?: CadPartGeometry;
  renderFeatures?: CadRenderFeature[];
  metadata?: Record<string, string | number | boolean>;
};

export type StockChoice =
  | 'custom_mm'
  | '1/8_nominal'
  | '1/4_nominal'
  | '3/8_nominal'
  | '1/2_nominal'
  | '5/8_nominal'
  | '3/4_nominal'
  | '1_nominal';

export type CabinetContents = 'drawers' | 'doors' | 'combo';
export type TopStyle = 'full' | 'stretchers';
export type BackStyle = 'panel' | 'structural_panel' | 'stretchers' | 'none';
export type MountStyle = 'floor' | 'wall';
export type BaseStyle = 'toe_kick' | 'flat' | 'leveling_feet' | 'casters';
export type SideToeKickCutout = 'none' | 'left' | 'right' | 'both';
export type BottomWidthStyle = 'joined' | 'full_width';
export type JoineryStyle = 'butt' | 'screw' | 'dado' | 'tab_slot';
export type FrontMountStyle = 'overlay' | 'inset_flush';
export type ShelfStyle = 'fixed' | 'adjustable';
export type LayoutMode = 'legacy' | 'sections';

export type SectionNode = [
  parent: number,
  order: number,
  kind: 'leaf' | 'x' | 'z',
  sizeMode: 'weight' | 'mm',
  sizeValue: number,
  contents: 'drawers' | 'doors' | 'open',
  count: number,
  drawerHeightMode: 'equal' | 'graduated' | 'custom_weights',
  graduatedStep: number,
  customWeights: number[],
  divider: 'panel' | 'rail' | 'none',
  shelfCount: number,
];

export type CabinetParameters = {
  width: number;
  height: number;
  depth: number;

  carcassStock: StockChoice;
  backStock: StockChoice;
  materialThickness: number;
  backThickness: number;
  drawerMaterialThickness: number;
  drawerBottomThickness: number;
  drawerFrontThickness: number;
  doorThickness: number;

  layoutMode: LayoutMode;
  sectionNodes: SectionNode[];
  cabinetContents: CabinetContents;
  drawerCount: number;
  doorCount: number;
  shelfCount: number;

  topStyle: TopStyle;
  topStretcherDepth: number;
  backStyle: BackStyle;
  backInset: number;
  backStretcherCount: number;
  backStretcherHeight: number;

  mountStyle: MountStyle;
  baseStyle: BaseStyle;
  toeKickHeight: number;
  toeKickDepth: number;
  sideToeKickCutout: SideToeKickCutout;
  bottomWidthStyle: BottomWidthStyle;

  includeWorktop: boolean;
  worktopThickness: number;
  worktopSideOverhang: number;
  worktopFrontOverhang: number;
  worktopBackOverhang: number;

  joineryStyle: JoineryStyle;
  dadoDepth: number;
  dadoFitClearance: number;

  frontMountStyle: FrontMountStyle;
  frontEdgeReveal: number;
  doorGap: number;
  drawerGap: number;
  shelfStyle: ShelfStyle;
};

export type CabinetDocument = {
  version: 2;
  id: string;
  family: 'utility';
  name: string;
  units: 'mm';
  displayUnits: DisplayUnits;
  parameters: CabinetParameters;
  parts: CadPart[];
};

export type ViewPreset = 'iso' | 'front' | 'right' | 'top';
