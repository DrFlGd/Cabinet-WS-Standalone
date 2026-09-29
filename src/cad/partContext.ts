import { UTILITY_PARAMETER_SCHEMA, type ParameterDefinition } from './parameterSchema';
import type { CabinetParameters, CadPart, HardwareCategory } from './types';

export type PartSettingsContext = {
  title: string;
  description: string;
  fields: ParameterDefinition[];
  hardwareCategory: HardwareCategory | null;
  sectionNodeId: number | null;
};

const slideKeys: (keyof CabinetParameters)[] = [
  'drawerMount',
  'metalSlideClearancePerSide',
  'metalSlideLength',
  'metalSlideFrontSetback',
  'metalSlideEnvelopeHeight',
  'includeMetalSlideHoles',
  'hardwareDrillingMode',
];

const hingeKeys: (keyof CabinetParameters)[] = [
  'hingeStyle',
  'hingeCupDiameter',
  'hingeCupDepth',
  'hingeCupCenterFromDoorEdge',
  'hingeDoorFixingEnabled',
  'hingeDoorFixingHoleSpacing',
  'hingePlateHolesEnabled',
  'hingePlateCenterFromFront',
  'hingePlateHoleSpacing',
];

export function partSettingsContext(
  part: CadPart,
  parameters: CabinetParameters,
): PartSettingsContext {
  const keys = new Set<keyof CabinetParameters>();
  let title = 'Related settings';
  let description = 'These cabinet parameters directly affect the selected part.';
  let hardwareCategory: HardwareCategory | null = null;

  const add = (...items: (keyof CabinetParameters)[]) => items.forEach(key => keys.add(key));

  if (part.category === 'hardware') {
    hardwareCategory = part.id.startsWith('hardware:slide:') ? 'drawer_slide' : 'hinge';
    if (part.id.startsWith('hardware:slide:')) {
      title = 'Drawer-slide settings';
      description = 'Slide selection, clearance, envelope, and drilling settings for this hardware instance.';
      add(...slideKeys, 'drawerMaterialThickness', 'drawerBottomThickness');
    } else {
      title = 'Hinge settings';
      description = 'Hinge selection, cup geometry, plate drilling, and front construction for this hardware instance.';
      add(...hingeKeys, 'doorThickness', 'frontMountStyle', 'frontEdgeReveal');
    }
  } else if (part.category === 'drawer') {
    title = 'Drawer-box settings';
    description = 'Stock and mounting settings that generate this drawer box.';
    hardwareCategory = 'drawer_slide';
    add(
      'drawerMaterialThickness', 'drawerBottomThickness', 'depth', 'drawerJoineryStyle',
      'drawerBottomStyle', 'drawerBottomGrooveDepth', 'drawerDividerCount', 'drawerDividerRows',
      'drawerFrontRegistration', ...slideKeys,
    );
  } else if (part.category === 'front') {
    const isDoor = typeof part.metadata?.door === 'number' || part.id.includes(':door:') || part.id.startsWith('door:');
    const isDrawer = typeof part.metadata?.drawer === 'number' || part.id.includes(':drawer:');

    if (isDoor) {
      title = 'Door settings';
      description = 'Door stock, reveal/gap, mounting style, and hinge settings for this selected door.';
      hardwareCategory = 'hinge';
      add(
        'width', 'height', 'doorThickness', 'frontMountStyle', 'frontEdgeReveal', 'doorGap', 'doorCount',
        'faceFrameStyle', 'faceFrameThickness', 'faceFrameStileWidth', 'faceFrameRailWidth', 'faceFrameCenterStileWidth',
        ...hingeKeys,
      );
    } else if (isDrawer) {
      title = 'Drawer-front settings';
      description = 'Front stock, reveal/gap, and drawer-slide settings that affect this drawer.';
      hardwareCategory = 'drawer_slide';
      add(
        'width', 'height', 'drawerFrontThickness', 'frontMountStyle', 'frontEdgeReveal', 'drawerGap', 'drawerCount',
        'drawerHeightMode', 'drawerGraduatedStep', 'drawerFrontRegistration', 'faceFrameStyle',
        ...slideKeys,
      );
    } else {
      add('width', 'height', 'frontMountStyle', 'frontEdgeReveal', 'doorGap', 'drawerGap');
    }
  } else if (part.category === 'shelf') {
    title = 'Shelf settings';
    description = 'Shelf stock, depth, style, and joinery settings related to this panel.';
    add('depth', 'carcassStock', 'materialThickness', 'shelfCount', 'shelfStyle', 'joineryStyle', 'dadoDepth', 'dadoFitClearance');
  } else if (part.category === 'divider') {
    title = 'Divider settings';
    description = 'Section-layout, carcass stock, and joinery settings related to this divider.';
    add('layoutMode', 'carcassStock', 'materialThickness', 'depth', 'joineryStyle', 'dadoDepth', 'dadoFitClearance');
  } else if (part.category === 'back') {
    title = 'Back settings';
    description = 'Rear-construction and back-stock parameters that generate this part.';
    add('width', 'height', 'backStyle', 'backStock', 'backThickness', 'backInset', 'backStretcherCount', 'backStretcherHeight');
  } else if (part.category === 'worktop') {
    title = 'Worktop settings';
    description = 'Worktop stock and overhang parameters for the selected work surface.';
    add('width', 'depth', 'includeWorktop', 'worktopThickness', 'worktopSideOverhang', 'worktopFrontOverhang', 'worktopBackOverhang');
  } else if (part.category === 'frame') {
    title = 'Face-frame settings';
    description = 'Frame stock and opening relationships that generate the selected stile or rail.';
    add('faceFrameStyle', 'faceFrameThickness', 'faceFrameStileWidth', 'faceFrameRailWidth', 'faceFrameCenterStileWidth', 'frontMountStyle', 'frontEdgeReveal');
  } else if (part.category === 'carcass') {
    title = 'Carcass settings';
    description = 'Carcass stock, cabinet envelope, construction, and joinery settings related to this panel.';
    add('carcassStock', 'materialThickness', 'width', 'height', 'depth', 'joineryStyle', 'dadoDepth', 'dadoFitClearance');

    if (part.id.includes('bottom')) {
      add('bottomWidthStyle', 'mountStyle', 'baseStyle', 'toeKickHeight');
    }
    if (part.id.includes('top')) {
      add('topStyle', 'topStretcherDepth');
    }
    if (part.id === 'carcass:left' || part.id === 'carcass:right') {
      add('mountStyle', 'baseStyle', 'toeKickHeight', 'toeKickDepth', 'sideToeKickCutout');
    }
  }

  const sectionId = typeof part.metadata?.sectionId === 'number' ? part.metadata.sectionId : 0;
  const sectionNodeId = parameters.layoutMode === 'sections' && sectionId > 0 ? sectionId - 1 : null;

  const fields = UTILITY_PARAMETER_SCHEMA.filter(field =>
    keys.has(field.key) && (!field.visibleWhen || field.visibleWhen(parameters)),
  );

  return {
    title,
    description,
    fields,
    hardwareCategory,
    sectionNodeId,
  };
}
