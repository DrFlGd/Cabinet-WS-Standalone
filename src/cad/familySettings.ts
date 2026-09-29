import rawSchema from './data/legacyFamilySchema.json';
import { stockThickness } from './cabinetModel';
import type { CabinetFamily, FamilyRecipeValues, JsonValue, StockChoice } from './types';

export type FamilyFieldDefinition = {
  key: string;
  value: JsonValue | null;
  expression: string | null;
  section: string;
  description: string;
  options: string[] | null;
  bounds: number[] | null;
  step: number | null;
  unit: string;
  visibleIf: Record<string, JsonValue> | null;
  advanced: boolean;
};

type FamilySchemaRecord = {
  index: number;
  id: CabinetFamily;
  fields: FamilyFieldDefinition[];
};

const schema = rawSchema as FamilySchemaRecord[];

export const FAMILY_SETTINGS_SECTION_ORDER = [
  'Materials',
  'Machining',
  'Sizing',
  'Structure',
  'Fronts',
  'Doors',
  'Shelves',
  'Drawers',
  'Dividers',
  'Trays',
  'Mounting',
  'Hardware',
  'Output',
  'System',
] as const;

export function familySettingsSchema(family: CabinetFamily) {
  return schema.find(item => item.id === family) ?? schema.find(item => item.id === 'utility')!;
}

export function familyFieldDefinitions(family: CabinetFamily) {
  return familySettingsSchema(family).fields;
}

export function familyFieldValue(values: FamilyRecipeValues, field: FamilyFieldDefinition): JsonValue | null {
  return Object.prototype.hasOwnProperty.call(values, field.key)
    ? values[field.key] ?? null
    : field.value;
}

export function familySectionName(field: FamilyFieldDefinition) {
  if (['cabinet_mount_style', 'mount_mode'].includes(field.key)) return 'Mounting / Mount Style';
  if (field.section === 'Structure / Back and Braces') return 'Mounting / Rear Mounting';
  return field.section;
}

export function familySectionRoot(field: FamilyFieldDefinition) {
  return familySectionName(field).split(' / ')[0];
}

export function familyFieldLabel(key: string) {
  const acronyms: Record<string, string> = {
    cnc: 'CNC',
    id: 'ID',
    x: 'X',
    y: 'Y',
    z: 'Z',
  };
  return key
    .split('_')
    .map((token, index) => {
      const known = acronyms[token.toLowerCase()];
      if (known) return known;
      if (/^\d+$/.test(token)) return token;
      return index === 0
        ? token.charAt(0).toUpperCase() + token.slice(1)
        : token;
    })
    .join(' ');
}

export function familyFieldIsComputed(field: FamilyFieldDefinition) {
  return Boolean(field.expression);
}

export function familyFieldIsSectionTree(field: FamilyFieldDefinition) {
  return field.key === 'section_nodes';
}

export function familyFieldInactiveReason(
  family: CabinetFamily,
  field: FamilyFieldDefinition,
  values: FamilyRecipeValues,
): string | null {
  const v: Record<string, any> = { ...values, _family: familySettingsSchema(family).index };
  const k = field.key;
  const s = familySectionRoot(field);
  const sections = v._family === 4 && v.cabinet_layout_mode === 'sections';
  const mixed = v._family !== 3 && ['mixed_bays', 'sections'].includes(v.cabinet_layout_mode);

  if (k === 'section_nodes') return 'Use the Manual Layout editor';
  if (
    sections &&
    (
      k.startsWith('mixed_') ||
      k === 'include_mixed_bay_partitions' ||
      k.startsWith('drawer_bank_') ||
      [
        'cabinet_contents', 'drawer_count', 'door_count', 'door_shelf_count',
        'drawer_height_mode', 'drawer_height_weights', 'drawer_graduated_step',
        'include_drawer_separators', 'shelf_style', 'width_basis', 'depth_basis',
        'include_door_hinge_partitions', 'face_frame_mid_rail_mode',
        'face_frame_custom_mid_rail_z', 'include_face_frame_center_stile',
        'face_frame_center_stile_width', 'fronts_cover_bottom_lip', 'overlay_width_style',
      ].includes(k)
    )
  ) return 'Controlled by Manual Layout';

  const drawerTypes = sections
    ? (v.section_nodes ?? []).filter((n: any[]) => n[2] === 'leaf').map((n: any[]) => n[5])
    : v._family === 3
      ? [v.module_type]
      : mixed
        ? (v.mixed_bay_types ?? []).slice(0, v.mixed_bay_count)
        : [v.custom_cabinet_contents ?? v.cabinet_contents ?? v.module_type ?? 'drawers'];

  if (v._family === 3) {
    if (k.startsWith('mixed_bay_')) return 'Stackable modules use module and drawer-bank controls';
    if (k === 'door_shelf_count' && v.module_type === 'drawers') return 'Select an open or door module';
  }

  const hasDrawers = v._family === 5 || drawerTypes.some((x: string) => /drawer|combo/.test(x));
  const hasDoors = drawerTypes.some((x: string) => /door|combo/.test(x));

  if (
    !hasDrawers &&
    v._family !== 6 &&
    (
      field.section === 'Machining / Drawer Joints' ||
      field.section === 'Structure / Drawer Joinery' ||
      field.section === 'Hardware / Drawer Fasteners' ||
      field.section === 'Hardware / Face Registration'
    )
  ) return 'Add drawers to this layout';

  if (k === 'drawer_count' && (mixed || !hasDrawers || v.drawer_bank_layout_mode === 'independent')) return 'Drawer counts are set in the active bays or banks';
  if (k === 'door_count' && (mixed || !hasDoors)) return 'Door counts are set in the active door bays';
  if (k === 'cabinet_contents' && mixed) return 'Contents are set per bay';
  if (['shelf_style', 'door_shelf_count'].includes(k) && mixed) return 'Shelves are set per bay';
  if (k === 'shelf_style' && !mixed && Number(v.door_shelf_count ?? 0) === 0) return 'Add shelves first';
  if (k === 'inset_front_back_clearance' && v.front_mount_style !== 'inset_flush') return 'Select inset fronts';
  if (k === 'overlay_width_style' && v.front_mount_style === 'inset_flush') return 'Select overlay fronts';
  if (k === 'drawer_gap' && !hasDrawers) return 'Add drawers first';
  if (k === 'door_gap' && !hasDoors) return 'Add doors first';

  if (
    k.startsWith('custom_toe_kick_') ||
    ['custom_bottom_above_toe', 'custom_side_toe_kick_cutout'].includes(k)
  ) {
    if (v.base_style !== 'toe_kick' || v.cabinet_mount_style === 'wall') return 'Select a floor-mounted toe-kick base';
  }

  if (['drawer_bank_face_gap', 'drawer_bank_partition_rear_clearance', 'drawer_bank_partition_joinery'].includes(k) && Number(v.drawer_bank_count) <= 1) return 'Requires multiple drawer banks';
  if (k === 'base_style' && v.cabinet_mount_style === 'wall') return 'Floor bases are disabled for wall mounting';
  if (k.startsWith('base_mounting_plate_') && !v.include_base_mounting_plate) return 'Enable the base mounting plate';
  if (k === 'include_drawer_face_registration_holes' && !v.include_drawer_faces) return 'Enable drawer faces';
  if (k.startsWith('drawer_face_registration_') && !v.include_drawer_faces) return 'Enable drawer faces';

  const tabs = v.joinery_style === 'tab_slot';
  const metal = v._family === 6 ? v.slide_type !== 'fixed_runner' : v.drawer_mount === 'metal_slides';
  const wood = v.drawer_mount === 'wood_rails';

  if (
    /^(tab_count_mode|joint_tab_|target_tab_spacing|max_auto_tab_count|minimum_joint_web)|^(top|bottom|shelf|separator)_tab_/.test(k) &&
    !tabs
  ) return 'Requires tab-and-slot carcass joinery';
  if (k === 'joint_tab_count' && v.tab_count_mode !== 'fixed') return 'Choose fixed tab count';
  if (['target_tab_spacing', 'max_auto_tab_count'].includes(k) && v.tab_count_mode !== 'adaptive') return 'Choose adaptive tab count';
  if (['dado_depth', 'dado_fit_clearance'].includes(k) && v.joinery_style !== 'dado') return 'Requires dado carcass joinery';
  if (k === 'drawer_dado_depth' && v.drawer_joinery_style !== 'dado') return 'Requires dado drawer joinery';
  if (k === 'drawer_dado_fit_clearance' && v.drawer_joinery_style !== 'dado' && v.drawer_bottom_joinery !== 'dado') return 'Requires dado drawer joints or a dado bottom';
  if (k === 'joint_fit_clearance' && !tabs) return 'Requires tab-and-slot carcass joints';
  if (k === 'drawer_joint_fit_clearance' && v.drawer_joinery_style !== 'tab_slot') return 'Requires tab-and-slot drawer joints';
  if (k === 'drawer_bottom_dado_depth' && v.drawer_bottom_joinery !== 'dado') return 'Requires a dado drawer bottom';
  if (/^drawer_screw_/.test(k) && (!hasDrawers || v.drawer_joinery_style !== 'screw')) return 'Requires screw drawer joinery';

  const reliefPart = k.match(/^(carcass|drawer_bottom|drawer|divider)_(slot_corner_relief|cnc_tool_diameter)$/);
  if (reliefPart) {
    const part = reliefPart[1];
    if (part === 'carcass' && !tabs) return 'Select tab-and-slot carcass joinery';
    if (part === 'drawer' && (!hasDrawers || v.drawer_joinery_style !== 'tab_slot')) return 'Select tab-and-slot drawer joinery';
    if (['divider', 'drawer_bottom'].includes(part) && (!hasDrawers || !v.include_drawer_divider_grid)) return 'Enable drawer dividers';
    if (part === 'drawer_bottom' && v.drawer_divider_mounting === 'freestanding') return 'Enable bottom capture for drawer dividers';
    const mode = v[part + '_slot_corner_relief'];
    if (
      reliefPart[2] === 'cnc_tool_diameter' &&
      (mode === 'none' || (mode === 'inherit' && v.slot_corner_relief === 'none'))
    ) return 'Select dogbone or T-bone relief';
  }

  if (k === 'hardware_drilling_mode' && v._family !== 6 && !hasDrawers && !hasDoors) return 'This layout has no drawer or door hardware';
  if (k === 'kerf' && !v.apply_kerf_compensation) return 'Enable kerf compensation';
  if (k === 'top_stretcher_depth' && v.top_style !== 'stretchers') return 'Requires top stretchers';
  if (k.startsWith('back_stretcher_') && !['stretchers', 'auto'].includes(v.back_style)) return 'Requires back stretchers';
  if (k === 'back_inset' && v.back_style !== 'panel') return 'Requires an applied back panel';
  if (k.startsWith('upper_bay_') && k !== 'upper_bay_enabled' && !v.upper_bay_enabled) return 'Enable the upper bay';
  if (k.startsWith('drawer_separator_') && !v.include_drawer_separators) return 'Enable drawer separators';
  if (k === 'drawer_separator_stretcher_depth' && v.drawer_separator_style !== 'stretchers') return 'Requires stretcher separators';

  const independent = !mixed && v.drawer_bank_layout_mode === 'independent';
  const bayModes = (v.mixed_bay_drawer_height_modes ?? [])
    .slice(0, v.mixed_bay_count)
    .filter((_: unknown, i: number) => /drawer/.test(drawerTypes[i] ?? ''));
  const bankModes = (v.drawer_bank_height_modes ?? []).slice(0, v.drawer_bank_count);

  if (['drawer_height_mode', 'drawer_height_weights', 'drawer_graduated_step'].includes(k) && (mixed || independent)) return 'Height modes are set per bay or bank';
  if (k === 'drawer_height_weights' && v.drawer_height_mode !== 'custom_weights') return 'Choose custom-weight drawer heights';
  if (k === 'drawer_graduated_step' && v.drawer_height_mode !== 'graduated') return 'Choose graduated drawer heights';
  if (k === 'mixed_bay_drawer_graduated_steps' && !bayModes.includes('graduated')) return 'Choose graduated heights for a drawer bay';
  if (k === 'mixed_bay_drawer_height_weights' && !bayModes.includes('custom_weights')) return 'Choose custom-weight heights for a drawer bay';
  if (k.startsWith('drawer_bank_') && v._family === 3 && v.module_type !== 'drawers') return 'Select a drawer module';
  if (k.startsWith('drawer_bank_') && mixed) return 'Independent bays control drawer banks';
  if (
    ['drawer_bank_drawer_counts', 'drawer_bank_height_modes', 'drawer_bank_graduated_steps', 'drawer_bank_height_weights'].includes(k) &&
    !independent
  ) return 'Choose independent drawer banks';
  if (k === 'drawer_bank_graduated_steps' && !bankModes.includes('graduated')) return 'Choose graduated heights for a drawer bank';
  if (k === 'drawer_bank_height_weights' && !bankModes.includes('custom_weights')) return 'Choose custom-weight heights for a drawer bank';
  if (k === 'drawer_bank_width_weights' && Number(v.drawer_bank_count) <= 1) return 'Requires multiple drawer banks';

  if (s === 'Hardware' && v._family !== 6) {
    if (/^(drawer_|metal_slide_|wood_|standalone_.*wood|include_(metal_slide|wood_slide|drawer_))/.test(k) && !hasDrawers) return 'This layout has no drawers';
    if ((k.startsWith('hinge_') || k === 'single_door_hinge_side' || k === 'mixed_bay_door_hinge_sides') && !hasDoors) return 'This layout has no doors';
  }

  if ((k.startsWith('metal_slide_') || k === 'include_metal_slide_holes' || k === 'show_metal_slide_envelopes') && !metal) return 'Select metal drawer slides';
  if ((k.startsWith('wood_') || k === 'include_wood_slide_registration_holes') && !wood) return 'Select wood drawer runners';
  if (field.section === 'Hardware / Slide Drilling' && k !== 'include_metal_slide_holes' && k !== 'hardware_drilling_mode' && !v.include_metal_slide_holes) return 'Enable slide drilling';
  if (k.startsWith('wood_slide_registration_') && !v.include_wood_slide_registration_holes) return 'Enable wood-slide registration holes';
  if (k.startsWith('hinge_') && k !== 'hinge_style' && v.hinge_style === 'none') return 'Select a hinge style';
  if (k.startsWith('hinge_cup_') && v.hinge_style !== 'euro_35mm') return 'Select a European cup hinge';
  if (k.startsWith('hinge_door_fixing_') && k !== 'hinge_door_fixing_enabled' && !v.hinge_door_fixing_enabled) return 'Enable hinge fixing holes';
  if (k.startsWith('hinge_plate_') && k !== 'hinge_plate_holes_enabled' && !v.hinge_plate_holes_enabled) return 'Enable hinge plate holes';
  if (k.startsWith('door_handle_') && !v.include_door_handle_holes) return 'Enable door handle holes';
  if (k.startsWith('drawer_handle_') && !v.include_drawer_handle_holes) return 'Enable drawer handle holes';
  if (k.startsWith('handle_hole_') && !v.include_door_handle_holes && !v.include_drawer_handle_holes) return 'Enable handle holes';
  if (k === 'handle_hole_spacing' && v.handle_hole_pattern !== 'two_hole') return 'Select a two-hole handle';

  for (const [prefix, enable] of [
    ['butt_registration_', 'include_butt_registration_holes'],
    ['drawer_face_registration_', 'include_drawer_face_registration_holes'],
    ['worktop_registration_', 'include_worktop_registration_holes'],
  ] as const) {
    if (k.startsWith(prefix) && !v[enable]) return 'Enable the corresponding registration holes';
  }

  if (k.startsWith('runner_') && v._family === 6 && v.slide_type !== 'fixed_runner') return 'Select fixed runners';
  if (k.startsWith('caster_') && v.base_style !== 'casters') return 'Select a caster base';
  if (k.startsWith('leveler_') && v.base_style !== 'leveling_feet') return 'Select leveling feet';

  if (k.startsWith('adjustable_shelf_')) {
    const adjustable = mixed
      ? (v.mixed_bay_shelf_styles ?? [])
          .slice(0, v.mixed_bay_count)
          .some((x: string, i: number) => x === 'adjustable' && Number(v.mixed_bay_shelf_counts?.[i]) > 0)
      : v.shelf_style === 'adjustable' && Number(v.door_shelf_count ?? v.custom_door_shelf_count) > 0;
    if (!adjustable) return 'Add adjustable shelves';
    if (k === 'adjustable_shelf_hole_depth' && v.adjustable_shelf_hole_type === 'through') return 'Select blind shelf holes';
  }

  if (field.visibleIf) {
    const unmet = Object.entries(field.visibleIf).filter(([key, value]) =>
      Array.isArray(value) ? !value.includes(v[key]) : v[key] !== value
    );
    if (unmet.length) {
      return 'Requires ' + unmet
        .map(([key, value]) => key.replaceAll('_', ' ') + ' = ' + String(value))
        .join(', ');
    }
  }

  if (v._family === 6) {
    if (k.startsWith('overall_') && v.sizing_mode !== 'manual') return 'Used for manual sizing';
    if (/^(device_|side_clearance|top_clearance)/.test(k) && v.sizing_mode !== 'equipment') return 'Used for equipment sizing';
    if (k.startsWith('cleat_') && v.mount_mode !== 'wall_mount_french_cleat') return 'Requires French-cleat mounting';
    if (/^(side_frame_margin|minimum_rib_width|cutout_corner_radius|side_window_count|brace_style)$/.test(k) && v.side_style !== 'skeletonized') return 'Requires skeletonized sides';
  }

  if (k.startsWith('custom_') && k.includes('thickness')) {
    const stockKey = k === 'custom_carcass_thickness'
      ? 'carcass_stock'
      : k === 'custom_drawer_material_thickness'
        ? 'drawer_stock'
        : k.replace(/^custom_/, '').replace(/_thickness$/, '_stock');
    if (v[stockKey] && !['custom_mm', 'custom'].includes(v[stockKey])) {
      return 'Choose measured stock to use this thickness';
    }
  }

  const types = sections
    ? drawerTypes
    : v._family === 3
      ? [v.module_type]
      : mixed
        ? (v.mixed_bay_types ?? []).slice(0, v.mixed_bay_count)
        : [v.custom_cabinet_contents ?? v.cabinet_contents ?? v.module_type ?? 'drawers'];

  if (v._family === 5) {
    const basis = v.drawer_design_basis;
    if (k.startsWith('enclosure_') && basis !== 'enclosure') return 'Only used for enclosure sizing';
    if (k.startsWith('target_box_outside_') && basis !== 'outside_box') return 'Only used for outside-box sizing';
    if (k.startsWith('target_box_inside_') && basis !== 'inside_clear') return 'Only used for inside-clear sizing';
    if (k.startsWith('drawer_module_') && basis !== 'modular_grid') return 'Only used for modular-grid sizing';
  }

  const drawers = types.some((x: string) => /drawer|combo/.test(x));
  const doors = types.some((x: string) => /door|combo/.test(x));
  if (s === 'Drawers' && !drawers) return 'This layout has no drawers';
  if (s === 'Doors' && !doors) return 'This layout has no doors';
  if (k.startsWith('mixed_') && k !== 'mixed_bay_count' && !mixed) return 'Independent bays are disabled';
  if (k.startsWith('worktop_') && !v.include_worktop) return 'Worktop is disabled';
  if (k.startsWith('face_frame_') && v.front_facing_style !== 'face_frame') return 'Face frame is disabled';
  if (
    v._family !== 5 &&
    k !== 'target_tab_spacing' &&
    k.startsWith('target_') &&
    !['width_basis', 'depth_basis'].some(x => v[x] === 'drawer_inside')
  ) return 'Drawer-interior sizing is disabled';
  if (/^target_module_|^target_edge_clearance/.test(k) && v.target_dimension_mode !== 'modular_grid') return 'Modular grid sizing is disabled';
  if (/^target_drawer_inside_/.test(k) && v.target_dimension_mode === 'modular_grid') return 'Dimensions are calculated from the grid';
  if (k.startsWith('toe_kick_') && v.base_style !== 'toe_kick') return 'Toe kick is disabled';

  return null;
}

export function applyFamilyFieldChange(
  family: CabinetFamily,
  values: FamilyRecipeValues,
  key: string,
  value: JsonValue,
) {
  const next: FamilyRecipeValues = JSON.parse(JSON.stringify(values)) as FamilyRecipeValues;
  next[key] = normalizeFieldValue(family, key, value);
  return recomputeFamilyExpressions(family, next);
}

export function recomputeFamilyExpressions(
  family: CabinetFamily,
  values: FamilyRecipeValues,
): FamilyRecipeValues {
  const next: FamilyRecipeValues = JSON.parse(JSON.stringify(values)) as FamilyRecipeValues;
  const fields = familyFieldDefinitions(family).filter(field => field.expression);

  for (let pass = 0; pass < 3; pass += 1) {
    for (const field of fields) {
      const value = evaluateKnownExpression(field.expression!, next);
      if (value !== null && Number.isFinite(value)) next[field.key] = value;
    }
  }
  return next;
}

function normalizeFieldValue(
  family: CabinetFamily,
  key: string,
  value: JsonValue,
): JsonValue {
  const field = familyFieldDefinitions(family).find(candidate => candidate.key === key);
  if (!field) return value;

  if (typeof value === 'number') {
    const bounds = field.bounds;
    if (bounds?.length >= 2) {
      return Math.max(bounds[0], Math.min(bounds[1], value));
    }
    return value;
  }

  if (typeof value === 'string' && field.options?.length) {
    return field.options.includes(value) ? value : field.value ?? field.options[0];
  }

  return value;
}

function evaluateKnownExpression(expression: string, values: FamilyRecipeValues): number | null {
  const number = (key: string, fallback = 0) => {
    const value = values[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  };

  switch (expression) {
    case 'custom_toe_kick_height':
      return number('custom_toe_kick_height');
    case 'drawer_gap':
      return number('drawer_gap');
    case 'material_thickness':
      return effectiveMaterialThickness(values);
    case 'wood_rail_thickness':
      return number('wood_rail_thickness', effectiveMaterialThickness(values));
    case 'cabinet_depth - 70':
      return Math.max(0, number('cabinet_depth') - 70);
    case 'wood_rail_depth':
      return number('wood_rail_depth');
    case 'wood_rail_front_setback':
      return number('wood_rail_front_setback');
    case 'max(45,min(90,material_thickness*8))': {
      const t = effectiveMaterialThickness(values);
      return Math.max(45, Math.min(90, t * 8));
    }
    case 'max(12,min(25,material_thickness*2.4))': {
      const t = effectiveMaterialThickness(values);
      return Math.max(12, Math.min(25, t * 2.4));
    }
    case 'max(6,min(12,material_thickness*1.2))': {
      const t = effectiveMaterialThickness(values);
      return Math.max(6, Math.min(12, t * 1.2));
    }
    case 'max(10,min(20,material_thickness*1.8))': {
      const t = effectiveMaterialThickness(values);
      return Math.max(10, Math.min(20, t * 1.8));
    }
    case 'custom_wood_rail_depth':
      return number('custom_wood_rail_depth');
    case 'cabinet_height/2':
      return number('cabinet_height') / 2;
    case 'cabinet_nominal_depth - 70':
      return Math.max(0, number('cabinet_nominal_depth') - 70);
    default:
      return null;
  }
}

function effectiveMaterialThickness(values: FamilyRecipeValues) {
  const stock = typeof values.carcass_stock === 'string' ? values.carcass_stock : 'custom_mm';
  const custom = typeof values.custom_carcass_thickness === 'number'
    ? values.custom_carcass_thickness
    : typeof values.material_thickness === 'number'
      ? values.material_thickness
      : 18;

  if (stock === 'custom' || stock === 'custom_mm') return custom;
  if (stock === 'same_as_carcass') return custom;

  const supported: StockChoice[] = [
    'custom_mm', '1/8_nominal', '1/4_nominal', '3/8_nominal',
    '1/2_nominal', '5/8_nominal', '3/4_nominal', '1_nominal',
  ];
  if (supported.includes(stock as StockChoice)) {
    return stockThickness(stock as StockChoice, custom);
  }
  return custom;
}


export function syncFamilyValuesFromParameters(
  family: CabinetFamily,
  values: FamilyRecipeValues,
  parameters: import('./types').CabinetParameters,
): FamilyRecipeValues {
  const next: FamilyRecipeValues = JSON.parse(JSON.stringify(values)) as FamilyRecipeValues;
  const set = (key: string, value: JsonValue) => {
    if (familyFieldDefinitions(family).some(field => field.key === key)) next[key] = value;
  };

  if (family === 'equipment_stand') {
    set('overall_width', parameters.width);
    set('overall_height', parameters.height);
    set('overall_depth', parameters.depth);
    set('material_thickness', parameters.materialThickness);
  } else if (family === 'drawer') {
    const basis = typeof next.drawer_design_basis === 'string' ? next.drawer_design_basis : 'outside_box';
    if (basis === 'outside_box') {
      set('target_box_outside_width', parameters.width);
      set('target_box_outside_height', parameters.height);
      set('target_box_outside_depth', parameters.depth);
    } else if (basis === 'enclosure') {
      const clearance = parameters.drawerMount === 'metal_slides'
        ? parameters.metalSlideClearancePerSide
        : 0;
      set('enclosure_opening_width', parameters.width + 2 * clearance);
      set('enclosure_target_box_height', parameters.height);
      set('enclosure_usable_depth', parameters.depth + parameters.metalSlideFrontSetback);
    }
  } else {
    set('cabinet_width', parameters.width);
    set('cabinet_height', parameters.height);
    if (family === 'kitchen') set('cabinet_nominal_depth', parameters.depth + (parameters.faceFrameStyle === 'full' ? parameters.faceFrameThickness : 0));
    else set('cabinet_depth', parameters.depth);
  }

  set('carcass_stock', parameters.carcassStock);
  set('back_stock', parameters.backStock);
  set('custom_carcass_thickness', parameters.materialThickness);
  set('custom_back_thickness', parameters.backThickness);
  set('custom_drawer_material_thickness', parameters.drawerMaterialThickness);
  set('custom_drawer_bottom_thickness', parameters.drawerBottomThickness);
  set('custom_drawer_front_thickness', parameters.drawerFrontThickness);
  set('custom_door_thickness', parameters.doorThickness);

  set('cabinet_contents', parameters.cabinetContents);
  set('drawer_count', parameters.drawerCount);
  set('door_count', parameters.doorCount);
  set('door_shelf_count', parameters.shelfCount);
  set('drawer_height_mode', parameters.drawerHeightMode);
  set('drawer_graduated_step', parameters.drawerGraduatedStep);
  set('drawer_height_weights', [...parameters.drawerCustomWeights]);

  set('top_style', parameters.topStyle);
  set('top_stretcher_depth', parameters.topStretcherDepth);
  set('back_style', parameters.backStyle);
  set('back_inset', parameters.backInset);
  set('back_stretcher_count', parameters.backStretcherCount);
  set('back_stretcher_height', parameters.backStretcherHeight);

  set('cabinet_mount_style', parameters.mountStyle);
  if (family === 'equipment_stand') set('mount_mode', parameters.mountStyle === 'wall' ? 'wall_mount_french_cleat' : 'freestanding');
  set('base_style', parameters.baseStyle);
  set('custom_toe_kick_height', parameters.toeKickHeight);
  set('custom_toe_kick_setback', parameters.toeKickDepth);
  set('custom_side_toe_kick_cutout', parameters.sideToeKickCutout);
  set('bottom_width_style', parameters.bottomWidthStyle);

  set('include_worktop', parameters.includeWorktop);
  set('worktop_thickness', parameters.worktopThickness);
  set('worktop_side_overhang', parameters.worktopSideOverhang);
  set('worktop_front_overhang', parameters.worktopFrontOverhang);
  set('worktop_back_overhang', parameters.worktopBackOverhang);

  set('joinery_style', parameters.joineryStyle);
  set('dado_depth', parameters.dadoDepth);
  set('custom_dado_depth', parameters.dadoDepth);
  set('dado_fit_clearance', parameters.dadoFitClearance);

  set('front_mount_style', parameters.frontMountStyle);
  set('front_edge_reveal', parameters.frontEdgeReveal);
  set('door_gap', parameters.doorGap);
  set('drawer_gap', parameters.drawerGap);
  set('shelf_style', parameters.shelfStyle);

  set('drawer_joinery_style', parameters.drawerJoineryStyle);
  set('drawer_bottom_joinery', parameters.drawerBottomStyle === 'captured' ? 'dado' : 'applied');
  set('drawer_bottom_dado_depth', parameters.drawerBottomGrooveDepth);
  set('drawer_divider_columns', parameters.drawerDividerCount);
  set('drawer_divider_rows', parameters.drawerDividerRows);

  set('front_facing_style', parameters.faceFrameStyle === 'full' ? 'face_frame' : 'none');
  set('custom_face_frame_thickness', parameters.faceFrameThickness);
  set('face_frame_side_stile_width', parameters.faceFrameStileWidth);
  set('face_frame_top_rail_width', parameters.faceFrameRailWidth);
  set('face_frame_center_stile_width', parameters.faceFrameCenterStileWidth);

  set('drawer_mount', parameters.drawerMount);
  set('metal_slide_clearance_per_side', parameters.metalSlideClearancePerSide);
  set('metal_slide_length', parameters.metalSlideLength);
  set('metal_slide_front_setback', parameters.metalSlideFrontSetback);
  set('metal_slide_envelope_height', parameters.metalSlideEnvelopeHeight);
  set('include_metal_slide_holes', parameters.includeMetalSlideHoles);
  set('hardware_drilling_mode', parameters.hardwareDrillingMode);
  set('metal_slide_cabinet_holes_x', [...parameters.metalSlideCabinetHolesX]);
  set('metal_slide_drawer_holes_x', [...parameters.metalSlideDrawerHolesX]);
  set('metal_slide_cabinet_hole_diameter', parameters.metalSlideCabinetHoleDiameter);
  set('metal_slide_drawer_hole_diameter', parameters.metalSlideDrawerHoleDiameter);
  set('metal_slide_cabinet_hole_z_from_drawer_bottom', parameters.metalSlideCabinetHoleZFromDrawerBottom);
  set('metal_slide_drawer_hole_z_from_drawer_bottom', parameters.metalSlideDrawerHoleZFromDrawerBottom);

  set('hinge_style', parameters.hingeStyle);
  set('hinge_cup_diameter', parameters.hingeCupDiameter);
  set('hinge_cup_depth', parameters.hingeCupDepth);
  set('hinge_cup_center_from_door_edge', parameters.hingeCupCenterFromDoorEdge);
  set('hinge_door_fixing_enabled', parameters.hingeDoorFixingEnabled);
  set('hinge_door_fixing_hole_diameter', parameters.hingeDoorFixingHoleDiameter);
  set('hinge_door_fixing_hole_spacing', parameters.hingeDoorFixingHoleSpacing);
  set('hinge_plate_holes_enabled', parameters.hingePlateHolesEnabled);
  set('hinge_plate_hole_diameter', parameters.hingePlateHoleDiameter);
  set('hinge_plate_center_from_front', parameters.hingePlateCenterFromFront);
  set('hinge_plate_hole_spacing', parameters.hingePlateHoleSpacing);

  if (parameters.layoutMode === 'sections') {
    set('cabinet_layout_mode', 'sections');
    set('section_nodes', JSON.parse(JSON.stringify(parameters.sectionNodes)) as JsonValue);
  }

  return recomputeFamilyExpressions(family, next);
}

export function activeFamilyFieldCount(family: CabinetFamily, values: FamilyRecipeValues) {
  return familyFieldDefinitions(family)
    .filter(field => !familyFieldInactiveReason(family, field, values))
    .length;
}
