import rawCatalog from './data/legacyFamilyStarters.json';
import { sanitizeParameters, stockThickness } from './cabinetModel';
import { makeUtilityDefaults } from './utilityStarters';
import { bestHardwareMatch } from './hardwareCatalog';
import { sectionLeaf, sectionsFromWebValues } from './sections';
import type {
  CabinetFamily,
  CabinetParameters,
  FamilyRecipeValues,
  SectionNode,
  StockChoice,
} from './types';

export type FamilyDefinition = {
  id: CabinetFamily;
  name: string;
  shortCode: string;
  description: string;
};

export type FamilyStarter = {
  family: CabinetFamily;
  id: string;
  name: string;
  group: string | null;
  description: string;
  values: FamilyRecipeValues;
  parameters: CabinetParameters;
};

type RawStarter = {
  id: string;
  name: string;
  group: string | null;
  values: FamilyRecipeValues;
};

type RawFamily = {
  index: number;
  id: CabinetFamily;
  defaultStarter: string;
  starters: RawStarter[];
};

const catalog = rawCatalog as RawFamily[];

export const FAMILY_DEFINITIONS: FamilyDefinition[] = [
  { id: 'shop_cart', name: 'Shop cart', shortCode: 'SC', description: 'Mobile storage, work carts, and multi-bay workbenches.' },
  { id: 'utility', name: 'Utility cabinet', shortCode: 'UC', description: 'General floor and wall cabinets; the original Standalone reference family.' },
  { id: 'benchtop', name: 'Benchtop drawers', shortCode: 'BT', description: 'Compact drawer cabinets for small parts and bench-top storage.' },
  { id: 'stackable', name: 'Stackable cabinet', shortCode: 'ST', description: 'Interlocking drawer, door, and open storage modules.' },
  { id: 'kitchen', name: 'Kitchen cabinet', shortCode: 'KC', description: 'US nominal base, drawer-base, sink-base, wall, and pantry cabinets.' },
  { id: 'drawer', name: 'Standalone drawer', shortCode: 'DR', description: 'Replacement/custom drawers sized from enclosure, box, inside-clear, or modular-grid targets.' },
  { id: 'equipment_stand', name: 'Equipment stand', shortCode: 'ES', description: 'Printer/equipment stands with trays, runners/slides, upper bays, and wall-cleat variants.' },
];

const familyById = new Map(FAMILY_DEFINITIONS.map(item => [item.id, item]));

export function familyDefinition(family: CabinetFamily) {
  return familyById.get(family) ?? FAMILY_DEFINITIONS[1];
}

export function familyCatalog() {
  return catalog;
}

export function familyStarters(family: CabinetFamily): FamilyStarter[] {
  const source = catalog.find(item => item.id === family);
  if (!source) return [];
  return source.starters.map(starter => toFamilyStarter(family, starter));
}

export function allFamilyStarters() {
  return catalog.flatMap(source => source.starters.map(starter => toFamilyStarter(source.id, starter)));
}

export function familyStarter(family: CabinetFamily, starterId?: string | null): FamilyStarter {
  const source = catalog.find(item => item.id === family) ?? catalog.find(item => item.id === 'utility')!;
  const raw = source.starters.find(starter => starter.id === starterId)
    ?? source.starters.find(starter => starter.id === source.defaultStarter)
    ?? source.starters[0];
  return toFamilyStarter(source.id, raw);
}

export function defaultStarterId(family: CabinetFamily) {
  return catalog.find(item => item.id === family)?.defaultStarter ?? 'default';
}

function toFamilyStarter(family: CabinetFamily, starter: RawStarter): FamilyStarter {
  return {
    family,
    id: starter.id,
    name: starter.name,
    group: starter.group,
    description: starter.group
      ? starter.group + ' recipe ported from Cabinet Workshop.'
      : 'Default ' + familyDefinition(family).name + ' recipe ported from Cabinet Workshop.',
    values: cloneRecipe(starter.values),
    parameters: parametersFromFamilyValues(family, starter.values),
  };
}

export function parametersFromFamilyValues(
  family: CabinetFamily,
  values: FamilyRecipeValues,
): CabinetParameters {
  const defaults = makeUtilityDefaults();
  const v = values as Record<string, unknown>;
  const mapped: Partial<CabinetParameters> = {
    width: numberOr(v.cabinet_width, v.custom_cabinet_width, v.overall_width, defaults.width),
    height: numberOr(v.cabinet_height, v.custom_cabinet_height, v.overall_height, defaults.height),
    depth: numberOr(v.cabinet_depth, v.custom_cabinet_depth, v.overall_depth, defaults.depth),

    carcassStock: canonicalStock(v.carcass_stock, defaults.carcassStock),
    backStock: canonicalStock(v.back_stock, defaults.backStock),
    materialThickness: numberOr(v.custom_carcass_thickness, v.material_thickness, defaults.materialThickness),
    backThickness: numberOr(v.custom_back_thickness, defaults.backThickness),
    drawerMaterialThickness: thicknessFromValues(v, 'drawer_stock', 'custom_drawer_material_thickness', defaults.drawerMaterialThickness),
    drawerBottomThickness: thicknessFromValues(v, 'drawer_bottom_stock', 'custom_drawer_bottom_thickness', defaults.drawerBottomThickness),
    drawerFrontThickness: thicknessFromValues(v, 'drawer_front_stock', 'custom_drawer_front_thickness', defaults.drawerFrontThickness),
    doorThickness: thicknessFromValues(v, 'door_stock', 'custom_door_thickness', defaults.doorThickness),

    cabinetContents: contentOr(v.cabinet_contents, defaults.cabinetContents),
    drawerCount: intOr(v.drawer_count, v.custom_drawer_count, defaults.drawerCount),
    doorCount: intOr(v.door_count, v.custom_door_count, defaults.doorCount),
    shelfCount: intOr(v.door_shelf_count, v.custom_door_shelf_count, defaults.shelfCount),

    topStyle: enumOr(v.top_style, ['full', 'stretchers'] as const, defaults.topStyle),
    topStretcherDepth: numberOr(v.top_stretcher_depth, v.back_rail_height, defaults.topStretcherDepth),
    backStyle: backStyleOr(v.back_style, defaults.backStyle),
    backInset: numberOr(v.back_inset, defaults.backInset),
    backStretcherCount: intOr(v.back_stretcher_count, defaults.backStretcherCount),
    backStretcherHeight: numberOr(v.back_stretcher_height, v.back_rail_height, defaults.backStretcherHeight),

    mountStyle: mountStyleOr(v.cabinet_mount_style, v.mount_mode, defaults.mountStyle),
    baseStyle: baseStyleOr(v.base_style, family, defaults.baseStyle),
    toeKickHeight: numberOr(v.custom_toe_kick_height, defaults.toeKickHeight),
    toeKickDepth: numberOr(v.custom_toe_kick_setback, defaults.toeKickDepth),
    sideToeKickCutout: enumOr(v.custom_side_toe_kick_cutout, ['none', 'left', 'right', 'both'] as const, defaults.sideToeKickCutout),
    bottomWidthStyle: enumOr(v.bottom_width_style, ['joined', 'full_width'] as const, defaults.bottomWidthStyle),

    includeWorktop: booleanOr(v.include_worktop, family === 'shop_cart'),
    worktopThickness: numberOr(v.worktop_thickness, defaults.worktopThickness),
    worktopSideOverhang: numberOr(v.worktop_side_overhang, defaults.worktopSideOverhang),
    worktopFrontOverhang: numberOr(v.worktop_front_overhang, defaults.worktopFrontOverhang),
    worktopBackOverhang: numberOr(v.worktop_back_overhang, defaults.worktopBackOverhang),

    joineryStyle: enumOr(v.joinery_style, ['butt', 'screw', 'dado', 'tab_slot'] as const, defaults.joineryStyle),
    dadoDepth: numberOr(v.dado_depth, v.custom_dado_depth, defaults.dadoDepth),
    dadoFitClearance: numberOr(
      v.joinery_style === 'tab_slot' ? v.joint_fit_clearance : undefined,
      v.dado_fit_clearance,
      defaults.dadoFitClearance,
    ),

    frontMountStyle: enumOr(v.front_mount_style, ['overlay', 'inset_flush'] as const, defaults.frontMountStyle),
    frontEdgeReveal: numberOr(v.front_edge_reveal, defaults.frontEdgeReveal),
    doorGap: numberOr(v.door_gap, defaults.doorGap),
    drawerGap: numberOr(v.drawer_gap, v.drawer_bank_face_gap, defaults.drawerGap),
    shelfStyle: enumOr(v.shelf_style, ['fixed', 'adjustable'] as const, defaults.shelfStyle),
    drawerHeightMode: enumOr(v.drawer_height_mode, ['equal', 'graduated', 'custom_weights'] as const, defaults.drawerHeightMode),
    drawerGraduatedStep: numberOr(v.drawer_graduated_step, defaults.drawerGraduatedStep),
    drawerCustomWeights: numberArrayOr(v.drawer_height_weights, defaults.drawerCustomWeights),

    drawerJoineryStyle: drawerJoineryOr(v.drawer_joinery_style, defaults.drawerJoineryStyle),
    drawerBottomStyle: v.drawer_bottom_joinery === 'dado' ? 'captured' : defaults.drawerBottomStyle,
    drawerBottomGrooveDepth: numberOr(v.drawer_bottom_dado_depth, v.drawer_bottom_inset, defaults.drawerBottomGrooveDepth),
    drawerDividerCount: booleanOr(v.include_drawer_divider_grid, false)
      ? Math.max(0, intOr(v.drawer_divider_columns, 1) - 1)
      : 0,
    drawerDividerRows: booleanOr(v.include_drawer_divider_grid, false)
      ? Math.max(0, intOr(v.drawer_divider_rows, 1) - 1)
      : 0,
    drawerFrontRegistration: defaults.drawerFrontRegistration,

    faceFrameStyle: v.front_facing_style === 'face_frame' ? 'full' : 'none',
    faceFrameThickness: thicknessFromValues(v, 'face_frame_stock', 'custom_face_frame_thickness', defaults.faceFrameThickness),
    faceFrameStileWidth: numberOr(v.face_frame_side_stile_width, defaults.faceFrameStileWidth),
    faceFrameRailWidth: numberOr(v.face_frame_top_rail_width, defaults.faceFrameRailWidth),
    faceFrameCenterStileWidth: numberOr(v.face_frame_center_stile_width, defaults.faceFrameCenterStileWidth),

    drawerMount: v.drawer_mount === 'metal_slides' ? 'metal_slides' : 'wood_rails',
    metalSlideClearancePerSide: numberOr(v.metal_slide_clearance_per_side, defaults.metalSlideClearancePerSide),
    metalSlideLength: numberOr(v.metal_slide_length, defaults.metalSlideLength),
    metalSlideFrontSetback: numberOr(v.metal_slide_front_setback, v.front_setback, defaults.metalSlideFrontSetback),
    metalSlideEnvelopeHeight: numberOr(v.metal_slide_envelope_height, defaults.metalSlideEnvelopeHeight),
    includeMetalSlideHoles: booleanOr(v.include_metal_slide_holes, defaults.includeMetalSlideHoles),
    hardwareDrillingMode: enumOr(v.hardware_drilling_mode, ['off', 'recommended'] as const, defaults.hardwareDrillingMode),
    metalSlideCabinetHolesX: numberArrayOr(v.metal_slide_cabinet_holes_x, defaults.metalSlideCabinetHolesX),
    metalSlideDrawerHolesX: numberArrayOr(v.metal_slide_drawer_holes_x, defaults.metalSlideDrawerHolesX),
    metalSlideCabinetHoleDiameter: numberOr(v.metal_slide_cabinet_hole_diameter, defaults.metalSlideCabinetHoleDiameter),
    metalSlideDrawerHoleDiameter: numberOr(v.metal_slide_drawer_hole_diameter, defaults.metalSlideDrawerHoleDiameter),
    metalSlideCabinetHoleZFromDrawerBottom: numberOr(v.metal_slide_cabinet_hole_z_from_drawer_bottom, defaults.metalSlideCabinetHoleZFromDrawerBottom),
    metalSlideDrawerHoleZFromDrawerBottom: numberOr(v.metal_slide_drawer_hole_z_from_drawer_bottom, defaults.metalSlideDrawerHoleZFromDrawerBottom),

    hingeStyle: enumOr(v.hinge_style, ['none', 'euro_35mm'] as const, defaults.hingeStyle),
    hingeCupDiameter: numberOr(v.hinge_cup_diameter, defaults.hingeCupDiameter),
    hingeCupDepth: numberOr(v.hinge_cup_depth, defaults.hingeCupDepth),
    hingeCupCenterFromDoorEdge: numberOr(v.hinge_cup_center_from_door_edge, defaults.hingeCupCenterFromDoorEdge),
    hingeDoorFixingEnabled: booleanOr(v.hinge_door_fixing_enabled, defaults.hingeDoorFixingEnabled),
    hingeDoorFixingHoleDiameter: numberOr(v.hinge_door_fixing_hole_diameter, defaults.hingeDoorFixingHoleDiameter),
    hingeDoorFixingHoleSpacing: numberOr(v.hinge_door_fixing_hole_spacing, defaults.hingeDoorFixingHoleSpacing),
    hingePlateHolesEnabled: booleanOr(v.hinge_plate_holes_enabled, defaults.hingePlateHolesEnabled),
    hingePlateHoleDiameter: numberOr(v.hinge_plate_hole_diameter, defaults.hingePlateHoleDiameter),
    hingePlateCenterFromFront: numberOr(v.hinge_plate_center_from_front, defaults.hingePlateCenterFromFront),
    hingePlateHoleSpacing: numberOr(v.hinge_plate_hole_spacing, defaults.hingePlateHoleSpacing),
  };

  if (family === 'kitchen') applyKitchenDimensions(mapped, v);
  if (family === 'drawer') applyStandaloneDrawerDimensions(mapped, v);
  if (family === 'equipment_stand') applyEquipmentDimensions(mapped, v);
  if (family === 'benchtop') {
    mapped.mountStyle = 'floor';
    mapped.baseStyle = 'flat';
    mapped.cabinetContents = 'drawers';
    mapped.doorCount = 0;
    mapped.shelfCount = 0;
    mapped.includeWorktop = false;
  }
  if (family === 'shop_cart') {
    mapped.mountStyle = 'floor';
    mapped.baseStyle = baseStyleOr(v.base_style, family, 'casters');
  }
  if (family === 'stackable') {
    const moduleType = stringOr(v.module_type, 'drawers');
    mapped.mountStyle = 'floor';
    mapped.baseStyle = 'flat';
    mapped.includeWorktop = false;
    mapped.topStyle = 'stretchers';
    mapped.cabinetContents = moduleType === 'drawers' ? 'drawers' : 'doors';
    mapped.drawerCount = moduleType === 'drawers' ? intOr(v.drawer_count, 2) : 0;
    mapped.doorCount = moduleType === 'door' || moduleType === 'doors' ? 1 : 0;
    mapped.shelfCount = moduleType === 'drawers' ? 0 : intOr(v.door_shelf_count, 1);
  }

  if (mapped.drawerMount === 'metal_slides') {
    mapped.drawerSlideId = bestHardwareMatch('drawer_slide', mapped)?.id ?? '';
  }
  if (mapped.hingeStyle === 'euro_35mm') {
    mapped.hingeId = bestHardwareMatch('hinge', mapped)?.id ?? '';
  }

  const fallback = sanitizeParameters({ ...defaults, ...mapped, layoutMode: 'legacy' });
  const rawLayout = stringOr(v.cabinet_layout_mode, 'legacy');
  if (family === 'shop_cart' || family === 'utility' || family === 'kitchen') {
    mapped.layoutMode = rawLayout === 'mixed_bays' || rawLayout === 'sections' ? 'sections' : 'legacy';
    mapped.sectionNodes = mapped.layoutMode === 'sections'
      ? sectionsFromWebValues(v, fallback)
      : fallback.sectionNodes;
  } else if ((family === 'benchtop' || family === 'stackable') && intOr(v.drawer_bank_count, 1) > 1) {
    mapped.layoutMode = 'sections';
    mapped.sectionNodes = drawerBankSections(v);
  } else {
    mapped.layoutMode = 'legacy';
    mapped.sectionNodes = fallback.sectionNodes;
  }

  return sanitizeParameters({ ...defaults, ...mapped });
}

function applyKitchenDimensions(mapped: Partial<CabinetParameters>, v: Record<string, unknown>) {
  const nominal = numberOr(v.cabinet_nominal_depth, mapped.depth, 609.6);
  if (v.front_facing_style === 'face_frame') {
    const frame = thicknessFromValues(v, 'face_frame_stock', 'custom_face_frame_thickness', 19.05);
    const dado = v.face_frame_construction === 'segmented_back_dado'
      ? Math.min(
          Math.max(0.5, numberOr(v.face_frame_back_dado_depth, 6)),
          Math.max(0.5, frame - 0.5),
        )
      : 0;
    mapped.depth = Math.max(50, nominal - frame + dado);
  } else {
    mapped.depth = nominal;
  }
}

function applyStandaloneDrawerDimensions(mapped: Partial<CabinetParameters>, v: Record<string, unknown>) {
  const t = thicknessFromValues(v, 'drawer_stock', 'custom_drawer_material_thickness', 12);
  const bt = thicknessFromValues(v, 'drawer_bottom_stock', 'custom_drawer_bottom_thickness', 6);
  const mount = stringOr(v.drawer_mount, 'metal_slides');
  const clearance = mount === 'metal_slides'
    ? numberOr(v.metal_slide_clearance_per_side, 12.7)
    : mount === 'wood_rails'
      ? numberOr(v.wood_rail_thickness, 12) + numberOr(v.wood_rail_side_clearance, 1)
      : numberOr(v.drawer_free_fit_clearance_per_side, 1);
  const faceStyle = stringOr(v.drawer_face_style, 'none');
  const frontThickness = thicknessFromValues(v, 'drawer_front_stock', 'custom_drawer_front_thickness', 18);
  const setback = faceStyle === 'inset_flush'
    ? Math.max(
        numberOr(v.front_setback, 0),
        frontThickness + Math.max(0, numberOr(v.drawer_face_back_clearance, 0)),
      )
    : numberOr(v.front_setback, 0);
  const basis = stringOr(v.drawer_design_basis, 'enclosure');

  const width = basis === 'enclosure'
    ? numberOr(v.enclosure_opening_width, 450) - 2 * clearance
    : basis === 'inside_clear'
      ? numberOr(v.target_box_inside_width, 400) + 2 * t
      : basis === 'modular_grid'
        ? numberOr(v.drawer_module_pitch_x, 42) * Math.max(1, Math.round(numberOr(v.drawer_module_count_x, 10)))
          + 2 * Math.max(0, numberOr(v.drawer_module_edge_clearance_x, 0)) + 2 * t
        : numberOr(v.target_box_outside_width, 424.6);

  const depth = basis === 'enclosure'
    ? numberOr(v.enclosure_usable_depth, 500) - setback - numberOr(v.drawer_back_clearance, 0)
    : basis === 'inside_clear'
      ? numberOr(v.target_box_inside_depth, 456) + 2 * t
      : basis === 'modular_grid'
        ? numberOr(v.drawer_module_pitch_y, 42) * Math.max(1, Math.round(numberOr(v.drawer_module_count_y, 8)))
          + 2 * Math.max(0, numberOr(v.drawer_module_edge_clearance_y, 0)) + 2 * t
        : numberOr(v.target_box_outside_depth, 480);

  const height = basis === 'outside_box'
    ? numberOr(v.target_box_outside_height, 120)
    : basis === 'inside_clear'
      ? numberOr(v.target_box_inside_height, 100) + numberOr(v.drawer_bottom_inset, 6) + bt
      : basis === 'modular_grid'
        ? numberOr(v.drawer_module_inside_height, 85) + numberOr(v.drawer_bottom_inset, 6) + bt
        : stringOr(v.enclosure_height_mode, 'target_box') === 'fill_opening'
          ? numberOr(v.enclosure_opening_height, 160) - 2 * Math.max(0, numberOr(v.drawer_vertical_clearance, 2))
          : stringOr(v.enclosure_height_mode, 'target_box') === 'inside_clear'
            ? numberOr(v.enclosure_target_inside_height, 100) + numberOr(v.drawer_bottom_inset, 6) + bt
            : numberOr(v.enclosure_target_box_height, v.target_box_outside_height, 120);

  mapped.width = Math.max(20, width);
  mapped.depth = Math.max(20, depth);
  mapped.height = Math.max(20, height);
  mapped.drawerMaterialThickness = t;
  mapped.drawerBottomThickness = bt;
  mapped.drawerFrontThickness = frontThickness;
  mapped.drawerMount = mount === 'metal_slides' ? 'metal_slides' : 'wood_rails';
  mapped.cabinetContents = 'drawers';
  mapped.drawerCount = 1;
  mapped.doorCount = 0;
  mapped.shelfCount = 0;
  mapped.mountStyle = 'floor';
  mapped.baseStyle = 'flat';
  mapped.includeWorktop = false;
}

function applyEquipmentDimensions(mapped: Partial<CabinetParameters>, v: Record<string, unknown>) {
  const t = numberOr(v.material_thickness, 18);
  const trayThickness = numberOr(v.tray_thickness, 18);
  const slideGap = v.slide_type === 'fixed_runner' ? 2 : numberOr(v.metal_slide_clearance_per_side, 12.7);
  const pitch = trayThickness + numberOr(v.device_height, 510) + numberOr(v.top_clearance, 80) + t;
  const equipmentMode = v.sizing_mode !== 'manual';

  mapped.width = equipmentMode
    ? numberOr(v.device_width, 430) + 2 * numberOr(v.side_clearance, 20) + 4 * t + 2 * slideGap
    : numberOr(v.overall_width, 600);
  mapped.depth = equipmentMode
    ? numberOr(v.tray_inset, 10)
      + Math.max(
          numberOr(v.device_depth, 470)
            + (numberOr(v.tray_lip_height, 20) > 0 ? t : 0)
            + (booleanOr(v.rear_cable_opening, false) ? numberOr(v.cable_opening_depth, 0) : 0),
          numberOr(v.metal_slide_length, 450) + numberOr(v.metal_slide_front_setback, 0),
        )
      + numberOr(v.rear_clearance, 20)
      + t
    : numberOr(v.overall_depth, 620);
  mapped.height = equipmentMode
    ? t
      + numberOr(v.base_gap, 20)
      + Math.max(1, intOr(v.tray_count, 1)) * pitch
      + (booleanOr(v.upper_bay_enabled, false) ? numberOr(v.upper_bay_height, 220) + t : 0)
    : numberOr(v.overall_height, 750);

  mapped.materialThickness = t;
  mapped.mountStyle = stringOr(v.mount_mode, 'freestanding').startsWith('wall') ? 'wall' : 'floor';
  mapped.baseStyle = 'flat';
  mapped.topStyle = v.top_style === 'frame' ? 'stretchers' : 'full';
  mapped.backStyle = backStyleOr(v.back_style, 'stretchers');
  mapped.cabinetContents = 'doors';
  mapped.drawerCount = 0;
  mapped.doorCount = 0;
  mapped.shelfCount = 0;
  mapped.includeWorktop = false;
}

function drawerBankSections(v: Record<string, unknown>): SectionNode[] {
  const count = clampInt(intOr(v.drawer_bank_count, 1), 1, 8);
  const root = sectionLeaf();
  root[2] = 'x';
  root[10] = 'panel';
  const weights = numberArrayOr(v.drawer_bank_width_weights, Array(count).fill(1));
  const drawerCounts = numberArrayOr(v.drawer_bank_drawer_counts, Array(count).fill(intOr(v.drawer_count, 4)));
  const modes = stringArray(v.drawer_bank_height_modes);
  const steps = numberArrayOr(v.drawer_bank_graduated_steps, Array(count).fill(0.35));
  const customWeights = Array.isArray(v.drawer_bank_height_weights) ? v.drawer_bank_height_weights : [];

  const nodes: SectionNode[] = [root];
  for (let index = 0; index < count; index += 1) {
    const node = sectionLeaf(0, index, 'drawers', Math.max(1, Math.round(drawerCounts[index] ?? intOr(v.drawer_count, 4))));
    node[4] = Math.max(0.1, weights[index] ?? 1);
    const mode = modes[index];
    node[7] = mode === 'graduated' || mode === 'custom_weights' ? mode : 'equal';
    node[8] = steps[index] ?? 0.35;
    const rawWeights = Array.isArray(customWeights[index]) ? customWeights[index] : [];
    node[9] = rawWeights.filter((item: unknown): item is number => typeof item === 'number' && Number.isFinite(item));
    nodes.push(node);
  }
  return nodes;
}

export function cloneRecipe(values: FamilyRecipeValues): FamilyRecipeValues {
  return JSON.parse(JSON.stringify(values)) as FamilyRecipeValues;
}

const stockChoices: StockChoice[] = [
  'custom_mm',
  '1/8_nominal',
  '1/4_nominal',
  '3/8_nominal',
  '1/2_nominal',
  '5/8_nominal',
  '3/4_nominal',
  '1_nominal',
];

function canonicalStock(value: unknown, fallback: StockChoice): StockChoice {
  if (value === 'custom') return 'custom_mm';
  return typeof value === 'string' && stockChoices.includes(value as StockChoice)
    ? value as StockChoice
    : fallback;
}

function thicknessFromValues(
  values: Record<string, unknown>,
  stockKey: string,
  customKey: string,
  fallback: number,
) {
  const raw = values[stockKey];
  const custom = numberOr(values[customKey], fallback);
  if (raw === 'custom' || raw === 'custom_mm' || raw === undefined || raw === null) return custom;
  if (raw === 'same_as_carcass') {
    return thicknessFromValues(values, 'carcass_stock', 'custom_carcass_thickness', custom);
  }
  if (raw === 'same_as_drawer') {
    return thicknessFromValues(values, 'drawer_stock', 'custom_drawer_material_thickness', custom);
  }
  const stock = canonicalStock(raw, 'custom_mm');
  return stockThickness(stock, custom);
}

function contentOr(value: unknown, fallback: CabinetParameters['cabinetContents']) {
  if (value === 'drawer') return 'drawers';
  if (value === 'door') return 'doors';
  return enumOr(value, ['drawers', 'doors', 'combo'] as const, fallback);
}

function backStyleOr(value: unknown, fallback: CabinetParameters['backStyle']): CabinetParameters['backStyle'] {
  if (value === 'auto') return 'stretchers';
  return enumOr(value, ['panel', 'structural_panel', 'stretchers', 'none'] as const, fallback);
}

function mountStyleOr(
  cabinetMount: unknown,
  standMount: unknown,
  fallback: CabinetParameters['mountStyle'],
): CabinetParameters['mountStyle'] {
  if (typeof standMount === 'string' && standMount.startsWith('wall')) return 'wall';
  return enumOr(cabinetMount, ['floor', 'wall'] as const, fallback);
}

function baseStyleOr(
  value: unknown,
  family: CabinetFamily,
  fallback: CabinetParameters['baseStyle'],
): CabinetParameters['baseStyle'] {
  if (family === 'shop_cart' && value === undefined) return 'casters';
  return enumOr(value, ['toe_kick', 'flat', 'leveling_feet', 'casters'] as const, fallback);
}

function drawerJoineryOr(value: unknown, fallback: CabinetParameters['drawerJoineryStyle']) {
  if (value === 'dado' || value === 'tab_slot' || value === 'screw') return 'rabbet';
  return enumOr(value, ['butt', 'rabbet', 'lock_rabbet'] as const, fallback);
}

function numberOr(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return 0;
}

function intOr(...values: unknown[]) {
  return Math.round(numberOr(...values));
}

function booleanOr(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function enumOr<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? value as T
    : fallback;
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}

function numberArrayOr(value: unknown, fallback: number[]) {
  if (!Array.isArray(value)) return [...fallback];
  const numbers = value.filter(item => typeof item === 'number' && Number.isFinite(item)) as number[];
  return numbers.length ? numbers : [...fallback];
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string') as string[] : [];
}

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}
