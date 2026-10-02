import { UTILITY_PARAMETER_SCHEMA, type ParameterDefinition } from './parameterSchema';
import { familyFieldDefinitions, familyFieldInactiveReason, familyFieldLabel, familyFieldValue, familySectionRoot, type FamilyFieldDefinition } from './familySettings';
import type { CabinetFamily, CabinetParameters, FamilyRecipeValues } from './types';

// Only actual aliases belong here. Dedicated family sizing inputs (inside-clear,
// nominal Kitchen depth, equipment sizing, etc.) retain their own semantics.
const aliases: Partial<Record<keyof CabinetParameters, string[]>> = {
  width: ['cabinet_width'], height: ['cabinet_height'], depth: ['cabinet_depth'],
  carcassStock: ['carcass_stock'], materialThickness: ['custom_carcass_thickness'],
  backStock: ['back_stock'], backThickness: ['custom_back_thickness'],
  drawerMaterialThickness: ['custom_drawer_material_thickness'], drawerBottomThickness: ['custom_drawer_bottom_thickness'],
  drawerFrontThickness: ['custom_drawer_front_thickness'], doorThickness: ['custom_door_thickness'],
  topStyle: ['top_style'], topStretcherDepth: ['top_stretcher_depth'], backStyle: ['back_style'], backInset: ['back_inset'],
  backStretcherCount: ['back_stretcher_count'], backStretcherHeight: ['back_stretcher_height'],
  mountStyle: ['cabinet_mount_style'], baseStyle: ['base_style'], toeKickHeight: ['custom_toe_kick_height'],
  toeKickDepth: ['custom_toe_kick_setback'], sideToeKickCutout: ['custom_side_toe_kick_cutout'], bottomWidthStyle: ['bottom_width_style'],
  includeWorktop: ['include_worktop'], worktopThickness: ['worktop_thickness'], worktopSideOverhang: ['worktop_side_overhang'],
  worktopFrontOverhang: ['worktop_front_overhang'], worktopBackOverhang: ['worktop_back_overhang'],
  joineryStyle: ['joinery_style'], dadoDepth: ['dado_depth', 'custom_dado_depth'], dadoFitClearance: ['dado_fit_clearance', 'joint_fit_clearance'],
  frontMountStyle: ['front_mount_style'], frontEdgeReveal: ['front_edge_reveal'], drawerGap: ['drawer_gap'], doorGap: ['door_gap'],
  shelfStyle: ['shelf_style'], drawerJoineryStyle: ['drawer_joinery_style'], drawerDadoDepth: ['drawer_dado_depth'],
  drawerDadoFitClearance: ['drawer_dado_fit_clearance'], drawerJointFitClearance: ['drawer_joint_fit_clearance'],
  drawerScrewHoleDiameter: ['drawer_screw_hole_diameter'], drawerScrewEdgeMargin: ['drawer_screw_edge_margin'],
  drawerBottomStyle: ['drawer_bottom_joinery'], drawerBottomGrooveDepth: ['drawer_bottom_dado_depth'],
  faceFrameStyle: ['front_facing_style'], faceFrameThickness: ['custom_face_frame_thickness'],
  faceFrameStileWidth: ['face_frame_side_stile_width'], faceFrameRailWidth: ['face_frame_top_rail_width'],
  faceFrameCenterStileWidth: ['face_frame_center_stile_width'], drawerMount: ['drawer_mount'],
  metalSlideClearancePerSide: ['metal_slide_clearance_per_side'], metalSlideLength: ['metal_slide_length'],
  metalSlideFrontSetback: ['metal_slide_front_setback'], metalSlideEnvelopeHeight: ['metal_slide_envelope_height'],
  includeMetalSlideHoles: ['include_metal_slide_holes'], hardwareDrillingMode: ['hardware_drilling_mode'],
  hingeStyle: ['hinge_style'], hingeCupDiameter: ['hinge_cup_diameter'], hingeCupDepth: ['hinge_cup_depth'],
  hingeCupCenterFromDoorEdge: ['hinge_cup_center_from_door_edge'], hingeDoorFixingEnabled: ['hinge_door_fixing_enabled'],
  hingeDoorFixingHoleSpacing: ['hinge_door_fixing_hole_spacing'], hingePlateHolesEnabled: ['hinge_plate_holes_enabled'],
  hingePlateCenterFromFront: ['hinge_plate_center_from_front'], hingePlateHoleSpacing: ['hinge_plate_hole_spacing'],
};

export const SETTINGS_CATEGORIES = ['Sizing', 'Materials', 'Structure', 'Fronts', 'Doors', 'Shelves', 'Drawers', 'Dividers', 'Trays', 'Mounting', 'Hardware', 'Machining', 'Output', 'System'];
export const supportsLayoutEditor = (family: CabinetFamily) => family !== 'drawer' && family !== 'equipment_stand';

export function isLayoutSetting(key: string) {
  return ['cabinet_layout_mode', 'section_nodes', 'cabinet_contents', 'custom_cabinet_contents', 'module_type',
    'drawer_count', 'door_count', 'door_shelf_count', 'drawer_height_mode', 'drawer_height_weights', 'drawer_graduated_step',
    'include_mixed_bay_partitions'].includes(key) || /^(mixed_bay_|drawer_bank_)/.test(key) && !['drawer_bank_face_gap', 'drawer_bank_partition_rear_clearance', 'drawer_bank_partition_joinery', 'mixed_bay_door_hinge_sides', 'mixed_bay_shelf_styles'].includes(key);
}

type CommonRow = { id: string; category: string; label: string; advanced: boolean; inactiveReason: string | null; searchText: string };
export type CabinetSetting = CommonRow & (
  { source: 'parameter'; field: ParameterDefinition } |
  { source: 'family'; field: FamilyFieldDefinition }
);

const nativeCategory = (f: ParameterDefinition) => (({ Envelope: 'Sizing', Carcass: 'Structure', Base: 'Mounting',
  'Face Frame': 'Fronts', Worktop: 'Structure', Joinery: f.key.startsWith('drawer') ? 'Drawers' : 'Structure' } as Partial<Record<ParameterDefinition['section'], string>>)[f.section] ?? f.section);

export function cabinetSettings(family: CabinetFamily, values: FamilyRecipeValues, parameters: CabinetParameters): CabinetSetting[] {
  const fields = familyFieldDefinitions(family);
  const replaced = new Set<string>();
  const rows: CabinetSetting[] = [];
  const dedicated = !supportsLayoutEditor(family);
  for (const field of UTILITY_PARAMETER_SCHEMA) {
    if (field.section === 'Layout' || dedicated) continue;
    // The family sizing basis owns these values, and divider controls use
    // compartment counts instead of the native internal-divider counts.
    if (family === 'kitchen' && field.key === 'depth') continue;
    if (field.key === 'drawerDividerCount' || field.key === 'drawerDividerRows') continue;
    const equivalent = fields.filter(f => aliases[field.key]?.includes(f.key) && !f.expression);
    if (field.key === 'dadoFitClearance' && equivalent.length) continue;
    // Preserve richer family enums, including construction/sizing modes that
    // cannot be represented by the reduced shared parameter enum.
    if (field.kind === 'select' && equivalent.some(f => f.options?.some(option =>
      !field.options.some(o => o.value === option)))) continue;
    equivalent.forEach(f => replaced.add(f.key));
    const reason = field.visibleWhen ? (field.visibleWhen(parameters) ? null : 'Not used by the current cabinet configuration.')
      : equivalent.length && equivalent.every(f => familyFieldInactiveReason(family, f, values))
        ? familyFieldInactiveReason(family, equivalent[0], values) : null;
    const label = field.label.replace('Envelope ', 'Cabinet ');
    rows.push({ id: 'parameter:' + field.key, source: 'parameter', field, category: equivalent.length ? familySectionRoot(equivalent[0]) : nativeCategory(field),
      label, advanced: Boolean(field.advanced || equivalent.some(f => f.advanced)), inactiveReason: reason,
      searchText: [label, field.description, field.section, field.key, ...equivalent.map(f => f.key)].join(' ').toLowerCase() });
  }
  for (const field of fields) {
    if (replaced.has(field.key) || (supportsLayoutEditor(family) && isLayoutSetting(field.key))) continue;
    const label = familyFieldLabel(field.key);
    const category = familySectionRoot(field);
    rows.push({ id: 'family:' + field.key, source: 'family', field, category, label,
      advanced: field.advanced || Boolean(field.expression) || ['Output', 'System'].includes(category),
      inactiveReason: familyFieldInactiveReason(family, field, values),
      searchText: [label, field.key, field.description, field.section, ...(field.options ?? []), JSON.stringify(familyFieldValue(values, field))].join(' ').toLowerCase() });
  }
  return rows;
}

export type SettingsVisibility = { showAdvanced: boolean; showUnused: boolean };
export const SETTINGS_VISIBILITY_KEY = 'cabinet-ws.settings-visibility';
export function readSettingsVisibility(storage?: Pick<Storage, 'getItem'>): SettingsVisibility {
  try {
    const value = JSON.parse(storage?.getItem(SETTINGS_VISIBILITY_KEY) ?? '{}');
    return { showAdvanced: value?.showAdvanced === true, showUnused: value?.showUnused === true };
  } catch { return { showAdvanced: false, showUnused: false }; }
}
export function filterCabinetSettings(rows: CabinetSetting[], query: string, visibility: SettingsVisibility) {
  const search = query.trim().toLowerCase();
  return rows.filter(row => (!row.advanced || visibility.showAdvanced) && (!row.inactiveReason || visibility.showUnused) &&
    (!search || row.searchText.includes(search)));
}
