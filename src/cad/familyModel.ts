import { buildCabinetDocument, sanitizeParameters } from './cabinetModel';
import { applyHardwareDrilling, buildHardwareInstances, hardwareParts } from './hardware';
import { cloneRecipe } from './familyCatalog';
import type {
  CabinetDocument,
  CabinetFamily,
  CabinetParameters,
  CadPart,
  CadPartGeometry,
  FamilyRecipeValues,
} from './types';
import type { DisplayUnits } from './units';

const wood = '#b98b57';
const lightWood = '#d0aa79';
const darkWood = '#957047';
const backWood = '#a9825c';
const hardwareColor = '#46545a';

export type FamilyBuildContext = {
  family?: CabinetFamily;
  starterId?: string | null;
  familyValues?: FamilyRecipeValues;
};

export function buildFamilyCabinetDocument(
  parameters: CabinetParameters,
  name = 'Utility Cabinet',
  displayUnits: DisplayUnits = 'mm',
  context: FamilyBuildContext = {},
): CabinetDocument {
  const family = context.family ?? 'utility';
  const starterId = context.starterId ?? null;
  const familyValues = cloneRecipe(context.familyValues ?? {});

  if (family === 'drawer') {
    return buildStandaloneDrawer(parameters, name, displayUnits, starterId, familyValues);
  }
  if (family === 'equipment_stand') {
    return buildEquipmentStand(parameters, name, displayUnits, starterId, familyValues);
  }

  const document = buildCabinetDocument(parameters, name, displayUnits);
  document.family = family;
  document.starterId = starterId;
  document.familyValues = familyValues;

  if (family === 'stackable') augmentStackable(document);
  annotateFamily(document);
  return document;
}

function buildStandaloneDrawer(
  parameters: CabinetParameters,
  name: string,
  displayUnits: DisplayUnits,
  starterId: string | null,
  familyValues: FamilyRecipeValues,
): CabinetDocument {
  const p = sanitizeParameters(parameters);
  const values = familyValues as Record<string, unknown>;
  const W = Math.max(40, p.width);
  const H = Math.max(30, p.height);
  const D = Math.max(60, p.depth);
  const t = Math.min(Math.max(3, p.drawerMaterialThickness), Math.min(W / 4, D / 4));
  const bottomT = Math.min(Math.max(2, p.drawerBottomThickness), H / 2);
  const bottomInset = clamp(numberOr(values.drawer_bottom_inset, bottomT), 0, Math.max(0, H - bottomT));
  const boxMaterial = 'Drawer stock (' + round(t) + ' mm)';
  const bottomMaterial = 'Drawer bottom stock (' + round(bottomT) + ' mm)';
  const parts: CadPart[] = [];

  const captured = values.drawer_bottom_joinery === 'dado' || p.drawerBottomStyle === 'captured';
  const grooveDepth = Math.min(
    t - 0.5,
    Math.max(0.5, numberOr(values.drawer_bottom_dado_depth, p.drawerBottomGrooveDepth)),
  );

  const sideGroove = captured ? [{
    kind: 'slot' as const,
    sourcePartId: 'drawer:1:bottom',
    position: { x: 0, y: t, z: bottomInset },
    size: { x: grooveDepth, y: Math.max(1, D - 2 * t), z: bottomT + 0.4 },
  }] : undefined;
  const endGroove = captured ? [{
    kind: 'slot' as const,
    sourcePartId: 'drawer:1:bottom',
    position: { x: 0, y: 0, z: bottomInset },
    size: { x: Math.max(1, W - 2 * t), y: grooveDepth, z: bottomT + 0.4 },
  }] : undefined;

  parts.push(
    nativePart('drawer:1:box:left', 'Left Drawer Side', 'drawer', { x: 0, y: 0, z: 0 }, { x: t, y: D, z: H }, wood, boxMaterial, {
      family: 'drawer',
      role: 'box-side',
      joinery: stringOr(values.drawer_joinery_style, p.drawerJoineryStyle),
    }, undefined, sideGroove),
    nativePart('drawer:1:box:right', 'Right Drawer Side', 'drawer', { x: W - t, y: 0, z: 0 }, { x: t, y: D, z: H }, wood, boxMaterial, {
      family: 'drawer',
      role: 'box-side',
      joinery: stringOr(values.drawer_joinery_style, p.drawerJoineryStyle),
    }, undefined, sideGroove),
    nativePart('drawer:1:box:front', 'Drawer Box Front', 'drawer', { x: t, y: 0, z: 0 }, { x: W - 2 * t, y: t, z: H }, wood, boxMaterial, {
      family: 'drawer',
      role: 'box-front',
    }, undefined, endGroove),
    nativePart('drawer:1:box:back', 'Drawer Box Back', 'drawer', { x: t, y: D - t, z: 0 }, { x: W - 2 * t, y: t, z: H }, wood, boxMaterial, {
      family: 'drawer',
      role: 'box-back',
    }, undefined, endGroove),
    nativePart(
      'drawer:1:bottom',
      'Drawer Bottom',
      'drawer',
      { x: t, y: t, z: bottomInset },
      { x: W - 2 * t, y: D - 2 * t, z: bottomT },
      lightWood,
      bottomMaterial,
      { family: 'drawer', role: 'bottom', captured },
    ),
  );

  if (booleanOr(values.include_drawer_divider_grid, false)) {
    addDrawerDividerGrid(parts, p, values, W, H, D, t, bottomInset + bottomT);
  }

  const faceStyle = stringOr(values.drawer_face_style, 'none');
  if (faceStyle !== 'none') {
    const faceT = Math.max(3, p.drawerFrontThickness);
    const customSize = values.drawer_face_size_mode === 'custom';
    const faceW = customSize ? Math.max(20, numberOr(values.custom_drawer_face_width, W)) : W;
    const faceH = customSize ? Math.max(20, numberOr(values.custom_drawer_face_height, H)) : H;
    const reveal = Math.max(0, numberOr(values.drawer_face_inset_reveal, 0));
    const overlayH = Math.max(0, numberOr(values.drawer_face_overlay_horizontal, 0));
    const overlayV = Math.max(0, numberOr(values.drawer_face_overlay_vertical, 0));
    const actualW = faceStyle === 'inset_flush' ? Math.max(20, faceW - 2 * reveal) : faceW + 2 * overlayH;
    const actualH = faceStyle === 'inset_flush' ? Math.max(20, faceH - 2 * reveal) : faceH + 2 * overlayV;
    parts.push(nativePart(
      'drawer:1:front',
      'Decorative Drawer Front',
      'front',
      { x: (W - actualW) / 2, y: -faceT, z: (H - actualH) / 2 },
      { x: actualW, y: faceT, z: actualH },
      lightWood,
      'Drawer front stock (' + round(faceT) + ' mm)',
      { family: 'drawer', faceStyle },
    ));
  }

  const hardware = buildHardwareInstances(parts, p);
  applyHardwareDrilling(parts, hardware, p);
  parts.push(...hardwareParts(hardware));

  return {
    version: 3,
    id: 'cabinet-root',
    family: 'drawer',
    starterId,
    familyValues,
    name,
    units: 'mm',
    displayUnits,
    parameters: p,
    parts,
    hardware,
  };
}

function addDrawerDividerGrid(
  parts: CadPart[],
  p: CabinetParameters,
  values: Record<string, unknown>,
  W: number,
  H: number,
  D: number,
  wallT: number,
  z: number,
) {
  const columns = clampInt(numberOr(values.drawer_divider_columns, p.drawerDividerCount, 0), 0, 16);
  const rows = clampInt(numberOr(values.drawer_divider_rows, p.drawerDividerRows, 0), 0, 16);
  const dividerT = Math.max(2, numberOr(values.custom_drawer_divider_thickness, 3));
  const dividerH = Math.min(
    Math.max(8, numberOr(values.drawer_divider_height, Math.max(20, H * 0.55))),
    Math.max(8, H - z),
  );
  const insideW = Math.max(1, W - 2 * wallT);
  const insideD = Math.max(1, D - 2 * wallT);
  const material = 'Drawer divider stock (' + round(dividerT) + ' mm)';

  for (let index = 1; index < columns; index += 1) {
    const x = wallT + insideW * index / columns - dividerT / 2;
    parts.push(nativePart(
      'drawer:1:divider:x:' + index,
      'Drawer Divider Column ' + index,
      'divider',
      { x, y: wallT, z },
      { x: dividerT, y: insideD, z: dividerH },
      darkWood,
      material,
      { family: 'drawer', gridAxis: 'x', gridIndex: index },
    ));
  }
  for (let index = 1; index < rows; index += 1) {
    const y = wallT + insideD * index / rows - dividerT / 2;
    parts.push(nativePart(
      'drawer:1:divider:y:' + index,
      'Drawer Divider Row ' + index,
      'divider',
      { x: wallT, y, z },
      { x: insideW, y: dividerT, z: dividerH },
      darkWood,
      material,
      { family: 'drawer', gridAxis: 'y', gridIndex: index },
    ));
  }
}

function buildEquipmentStand(
  parameters: CabinetParameters,
  name: string,
  displayUnits: DisplayUnits,
  starterId: string | null,
  familyValues: FamilyRecipeValues,
): CabinetDocument {
  const p = sanitizeParameters(parameters);
  const values = familyValues as Record<string, unknown>;
  const W = p.width;
  const H = p.height;
  const D = p.depth;
  const t = Math.min(Math.max(6, p.materialThickness), Math.min(W / 5, D / 5));
  const trayT = Math.max(4, numberOr(values.tray_thickness, t));
  const slideGap = values.slide_type === 'fixed_runner' ? 2 : Math.max(2, p.metalSlideClearancePerSide);
  const trayCount = clampInt(numberOr(values.tray_count, 1), 1, 4);
  const baseGap = Math.max(0, numberOr(values.base_gap, 20));
  const topClearance = Math.max(0, numberOr(values.top_clearance, 80));
  const deviceHeight = Math.max(20, numberOr(values.device_height, 510));
  const pitch = trayT + deviceHeight + topClearance + t;
  const trayInset = Math.max(0, numberOr(values.tray_inset, 10));
  const rearClearance = Math.max(0, numberOr(values.rear_clearance, 20));
  const trayDepth = Math.max(40, D - trayInset - rearClearance - t);
  const trayWidth = Math.max(40, W - 2 * t - 2 * slideGap);
  const cheekH = Math.max(0, numberOr(values.tray_cheek_height, 70));
  const lipH = Math.max(0, numberOr(values.tray_lip_height, 20));
  const previewExtension = Math.min(
    Math.max(0, numberOr(values.preview_extension, 0)),
    Math.max(0, numberOr(values.tray_extension, p.metalSlideLength)),
  );
  const material = 'Stand stock (' + round(t) + ' mm)';
  const trayMaterial = 'Tray stock (' + round(trayT) + ' mm)';
  const parts: CadPart[] = [];
  const skeleton = values.side_style === 'skeletonized';

  parts.push(
    nativePart('carcass:left', 'Left Stand Side', 'carcass', { x: 0, y: 0, z: 0 }, { x: t, y: D, z: H }, wood, material, {
      family: 'equipment_stand',
      sideStyle: skeleton ? 'skeletonized' : 'solid',
    }, skeletonizedSideGeometry(D, H, values)),
    nativePart('carcass:right', 'Right Stand Side', 'carcass', { x: W - t, y: 0, z: 0 }, { x: t, y: D, z: H }, wood, material, {
      family: 'equipment_stand',
      sideStyle: skeleton ? 'skeletonized' : 'solid',
    }, skeletonizedSideGeometry(D, H, values)),
    nativePart('carcass:bottom', 'Stand Base', 'carcass', { x: t, y: 0, z: 0 }, { x: W - 2 * t, y: D, z: t }, darkWood, material, {
      family: 'equipment_stand',
    }),
  );

  const topStyle = stringOr(values.top_style, 'panel');
  if (topStyle === 'frame') {
    const rail = Math.min(Math.max(40, numberOr(values.back_rail_height, 70)), D / 2);
    parts.push(
      nativePart('carcass:top-front', 'Front Top Rail', 'carcass', { x: t, y: 0, z: H - t }, { x: W - 2 * t, y: rail, z: t }, darkWood, material, { family: 'equipment_stand' }),
      nativePart('carcass:top-rear', 'Rear Top Rail', 'carcass', { x: t, y: D - rail, z: H - t }, { x: W - 2 * t, y: rail, z: t }, darkWood, material, { family: 'equipment_stand' }),
    );
  } else {
    parts.push(nativePart('carcass:top', 'Stand Top', 'carcass', { x: t, y: 0, z: H - t }, { x: W - 2 * t, y: D, z: t }, darkWood, material, { family: 'equipment_stand' }));
  }

  addEquipmentBack(parts, values, W, H, D, t, material);

  if (booleanOr(values.upper_bay_enabled, false)) {
    const upperH = Math.min(H - 2 * t, Math.max(40, numberOr(values.upper_bay_height, 220)));
    parts.push(nativePart(
      'shelf:upper-bay',
      'Upper Bay Shelf',
      'shelf',
      { x: t, y: 0, z: H - upperH - t },
      { x: W - 2 * t, y: D, z: t },
      lightWood,
      material,
      { family: 'equipment_stand', upperBay: true },
    ));
  }

  for (let index = 0; index < trayCount; index += 1) {
    const z = t + baseGap + index * pitch;
    const y = trayInset - previewExtension;
    const prefix = 'tray:' + (index + 1);
    parts.push(
      nativePart(prefix + ':bottom', 'Pull-Out Tray ' + (index + 1), 'drawer', { x: t + slideGap, y, z }, { x: trayWidth, y: trayDepth, z: trayT }, lightWood, trayMaterial, {
        family: 'equipment_stand',
        trayIndex: index + 1,
        slideType: stringOr(values.slide_type, 'side_mount'),
      }),
    );
    if (cheekH > 0) {
      parts.push(
        nativePart(prefix + ':cheek:left', 'Left Tray Cheek ' + (index + 1), 'drawer', { x: t + slideGap, y, z: z + trayT }, { x: t, y: trayDepth, z: cheekH }, wood, material, { family: 'equipment_stand', trayIndex: index + 1 }),
        nativePart(prefix + ':cheek:right', 'Right Tray Cheek ' + (index + 1), 'drawer', { x: W - t - slideGap - t, y, z: z + trayT }, { x: t, y: trayDepth, z: cheekH }, wood, material, { family: 'equipment_stand', trayIndex: index + 1 }),
      );
    }
    if (lipH > 0) {
      parts.push(nativePart(
        prefix + ':lip',
        'Tray Lip ' + (index + 1),
        'drawer',
        { x: 2 * t + slideGap, y, z: z + trayT },
        { x: Math.max(20, trayWidth - 2 * t), y: t, z: lipH },
        wood,
        material,
        { family: 'equipment_stand', trayIndex: index + 1 },
      ));
    }
  }

  if (stringOr(values.mount_mode, 'freestanding').startsWith('wall')) {
    addFrenchCleats(parts, values, W, H, D, t, material);
  }

  return {
    version: 3,
    id: 'cabinet-root',
    family: 'equipment_stand',
    starterId,
    familyValues,
    name,
    units: 'mm',
    displayUnits,
    parameters: p,
    parts,
    hardware: [],
  };
}

function addEquipmentBack(
  parts: CadPart[],
  values: Record<string, unknown>,
  W: number,
  H: number,
  D: number,
  t: number,
  material: string,
) {
  const raw = stringOr(values.back_style, 'auto');
  const resolved = raw === 'auto'
    ? (stringOr(values.mount_mode, 'freestanding').startsWith('wall') ? 'stretchers' : 'structural_panel')
    : raw;
  if (resolved === 'none') return;

  if (resolved === 'panel') {
    const backT = Math.max(2, numberOr(values.custom_back_thickness, 6));
    parts.push(nativePart('back', 'Applied Back Panel', 'back', { x: 0, y: D - backT, z: 0 }, { x: W, y: backT, z: H }, backWood, 'Back stock (' + round(backT) + ' mm)', {
      family: 'equipment_stand',
      backStyle: resolved,
    }));
    return;
  }

  if (resolved === 'structural_panel') {
    parts.push(nativePart('back', 'Structural Back Panel', 'back', { x: t, y: D - t, z: t }, { x: W - 2 * t, y: t, z: H - 2 * t }, backWood, material, {
      family: 'equipment_stand',
      backStyle: resolved,
    }));
    return;
  }

  const count = clampInt(numberOr(values.back_stretcher_count, 2), 1, 6);
  const railH = Math.min(Math.max(30, numberOr(values.back_stretcher_height, 90)), H / count);
  const margin = Math.max(t, numberOr(values.back_stretcher_edge_margin, 25));
  const travel = Math.max(0, H - 2 * margin - railH);
  for (let index = 0; index < count; index += 1) {
    const z = margin + (count === 1 ? travel / 2 : travel * index / (count - 1));
    parts.push(nativePart(
      'back:stretcher:' + (index + 1),
      'Back Stretcher ' + (index + 1),
      'back',
      { x: t, y: D - t, z },
      { x: W - 2 * t, y: t, z: railH },
      darkWood,
      material,
      { family: 'equipment_stand', backStyle: 'stretchers' },
    ));
  }
}

function addFrenchCleats(
  parts: CadPart[],
  values: Record<string, unknown>,
  W: number,
  H: number,
  D: number,
  t: number,
  material: string,
) {
  const count = clampInt(numberOr(values.cleat_rail_count, 2), 1, 4);
  const cleatH = Math.min(Math.max(30, numberOr(values.cleat_height, 76)), H / 3);
  const topSetback = Math.max(0, numberOr(values.cleat_top_setback, 80));
  const gap = Math.max(cleatH + 20, numberOr(values.cleat_vertical_gap, 220));
  for (let index = 0; index < count; index += 1) {
    const z = Math.max(t, H - topSetback - cleatH - index * gap);
    parts.push(nativePart(
      'mount:cleat:' + (index + 1),
      'French Cleat Rail ' + (index + 1),
      'frame',
      { x: t, y: D - t * 1.5, z },
      { x: W - 2 * t, y: t, z: cleatH },
      darkWood,
      material,
      {
        family: 'equipment_stand',
        mountMode: 'wall_mount_french_cleat',
        cleatAngle: numberOr(values.cleat_angle, 45),
      },
    ));
  }
}

function skeletonizedSideGeometry(D: number, H: number, values: Record<string, unknown>): CadPartGeometry | undefined {
  if (values.side_style !== 'skeletonized') return undefined;
  const count = clampInt(numberOr(values.side_window_count, 2), 1, 6);
  const frame = Math.min(
    Math.max(20, numberOr(values.side_frame_margin, 55)),
    Math.min(D, H) / 3,
  );
  const usableH = Math.max(20, H - frame * 2);
  const gap = Math.max(15, frame * 0.45);
  const windowH = Math.max(15, (usableH - gap * (count - 1)) / count);
  const holes = Array.from({ length: count }, (_, index) => ({
    kind: 'rect' as const,
    u: frame,
    v: frame + index * (windowH + gap),
    width: Math.max(10, D - frame * 2),
    height: windowH,
  }));

  return {
    kind: 'extruded-profile',
    axis: 'x',
    outline: [
      { u: 0, v: 0 },
      { u: D, v: 0 },
      { u: D, v: H },
      { u: 0, v: H },
    ],
    holes,
  };
}

function augmentStackable(document: CabinetDocument) {
  const values = document.familyValues as Record<string, unknown>;
  const p = document.parameters;
  const t = Math.max(3, p.materialThickness);
  const interfaceDepth = Math.min(
    Math.max(4, numberOr(values.stack_interface_depth, 18)),
    Math.max(4, p.height / 4),
  );
  const material = 'Carcass stock (' + round(t) + ' mm)';

  document.parts.push(
    nativePart('stack:interface:front', 'Stack Interface Front', 'frame', { x: t, y: 0, z: 0 }, { x: p.width - 2 * t, y: interfaceDepth, z: t }, darkWood, material, {
      family: 'stackable',
      interface: true,
    }),
    nativePart('stack:interface:rear', 'Stack Interface Rear', 'frame', { x: t, y: p.depth - interfaceDepth, z: 0 }, { x: p.width - 2 * t, y: interfaceDepth, z: t }, darkWood, material, {
      family: 'stackable',
      interface: true,
    }),
  );

  if (booleanOr(values.include_stack_base, true)) {
    const baseH = Math.max(t, numberOr(values.stack_base_height, 70));
    document.parts.push(nativePart(
      'stack:base',
      'Stackable Base',
      'frame',
      { x: t, y: interfaceDepth, z: -baseH },
      { x: p.width - 2 * t, y: Math.max(20, p.depth - 2 * interfaceDepth), z: baseH },
      darkWood,
      material,
      { family: 'stackable', stackBase: true },
    ));
  }
}

function annotateFamily(document: CabinetDocument) {
  const values = document.familyValues as Record<string, unknown>;
  const family = document.family;
  for (const part of document.parts) {
    part.metadata = {
      ...(part.metadata ?? {}),
      family,
      ...(family === 'kitchen' && values.kitchen_model_code ? { kitchenModel: String(values.kitchen_model_code) } : {}),
      ...(family === 'kitchen' && values.kitchen_family ? { kitchenFamily: String(values.kitchen_family) } : {}),
      ...(family === 'stackable' && values.module_type ? { moduleType: String(values.module_type) } : {}),
    };
  }
}

function nativePart(
  id: string,
  name: string,
  category: CadPart['category'],
  position: CadPart['position'],
  size: CadPart['size'],
  color = wood,
  material = 'Sheet stock',
  metadata?: CadPart['metadata'],
  geometry?: CadPart['geometry'],
  renderFeatures?: CadPart['renderFeatures'],
): CadPart {
  return {
    id,
    name,
    category,
    material,
    position,
    size,
    color,
    visible: true,
    metadata,
    geometry,
    renderFeatures,
  };
}

function numberOr(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return 0;
}

function booleanOr(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
