import type { CabinetDocument, CabinetParameters, CadPart, CadProfileHole, SectionNode, StockChoice } from './types';
import type { DisplayUnits } from './units';
import { makeUtilityDefaults, UTILITY_STARTERS } from './utilityStarters';
import { cloneSectionNodes, sectionLayoutErrors, sectionPanels, sectionRects, sectionRoot, treeErrors } from './sections';

export const DEFAULT_PARAMETERS: CabinetParameters = makeUtilityDefaults();

const wood = '#b98b57';
const lightWood = '#d0aa79';
const darkWood = '#957047';
const backWood = '#a9825c';
const hardwareColor = '#46545a';
const worktopColor = '#d8b079';
const dividerColor = '#ad8252';

const nominalStock: Record<Exclude<StockChoice, 'custom_mm'>, number> = {
  '1/8_nominal': 3.175,
  '1/4_nominal': 6.35,
  '3/8_nominal': 9.525,
  '1/2_nominal': 12.7,
  '5/8_nominal': 15.875,
  '3/4_nominal': 19.05,
  '1_nominal': 25.4,
};

function part(
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
  return { id, name, category, position, size, color, material, visible: true, metadata, geometry, renderFeatures };
}

export function stockThickness(choice: StockChoice, measured: number) {
  return choice === 'custom_mm' ? measured : nominalStock[choice];
}

export function buildCabinetDocument(
  parameters: CabinetParameters,
  name = 'Utility Cabinet',
  displayUnits: DisplayUnits = 'mm',
): CabinetDocument {
  const p = sanitizeParameters(parameters);
  const W = p.width;
  const H = p.height;
  const D = p.depth;
  const t = stockThickness(p.carcassStock, p.materialThickness);
  const appliedBackThickness = stockThickness(p.backStock, p.backThickness);
  const base = p.mountStyle === 'floor' && p.baseStyle === 'toe_kick' ? p.toeKickHeight : 0;
  const parts: CadPart[] = [];

  const carcassMaterial = `Carcass stock (${round(t)} mm)`;
  const backMaterial = `Back stock (${round(appliedBackThickness)} mm)`;
  const carcassMeta = {
    joinery: p.joineryStyle,
    dadoDepth: p.dadoDepth,
    dadoFitClearance: p.dadoFitClearance,
  };

  const leftNotch = p.sideToeKickCutout === 'left' || p.sideToeKickCutout === 'both';
  const rightNotch = p.sideToeKickCutout === 'right' || p.sideToeKickCutout === 'both';
  parts.push(
    part(
      'carcass:left',
      'Left Side',
      'carcass',
      { x: 0, y: 0, z: 0 },
      { x: t, y: D, z: H },
      wood,
      carcassMaterial,
      {
        ...carcassMeta,
        toeKickNotch: leftNotch,
        profileCutouts: sidePanelHoles(p, base, D, H).length,
      },
      sidePanelGeometry(p, base, D, H, leftNotch),
    ),
    part(
      'carcass:right',
      'Right Side',
      'carcass',
      { x: W - t, y: 0, z: 0 },
      { x: t, y: D, z: H },
      wood,
      carcassMaterial,
      {
        ...carcassMeta,
        toeKickNotch: rightNotch,
        profileCutouts: sidePanelHoles(p, base, D, H).length,
      },
      sidePanelGeometry(p, base, D, H, rightNotch),
    ),
  );

  const bottomX = p.bottomWidthStyle === 'full_width' ? 0 : t;
  const bottomWidth = p.bottomWidthStyle === 'full_width' ? W : W - 2 * t;
  parts.push(
    part(
      'carcass:bottom',
      'Bottom',
      'carcass',
      { x: bottomX, y: 0, z: base },
      { x: bottomWidth, y: D, z: t },
      wood,
      carcassMaterial,
      { ...carcassMeta, bottomWidthStyle: p.bottomWidthStyle },
    ),
  );

  if (p.topStyle === 'full') {
    parts.push(
      part(
        'carcass:top',
        'Top',
        'carcass',
        { x: t, y: 0, z: H - t },
        { x: W - 2 * t, y: D, z: t },
        darkWood,
        carcassMaterial,
        carcassMeta,
      ),
    );
  } else {
    const stretcherDepth = Math.min(p.topStretcherDepth, D / 2);
    parts.push(
      part(
        'carcass:top-front',
        'Top Front Stretcher',
        'carcass',
        { x: t, y: 0, z: H - t },
        { x: W - 2 * t, y: stretcherDepth, z: t },
        darkWood,
        carcassMaterial,
        carcassMeta,
      ),
      part(
        'carcass:top-rear',
        'Top Rear Stretcher',
        'carcass',
        { x: t, y: D - stretcherDepth, z: H - t },
        { x: W - 2 * t, y: stretcherDepth, z: t },
        darkWood,
        carcassMaterial,
        carcassMeta,
      ),
    );
  }

  const rearOpeningHeight = Math.max(0, H - base - 2 * t);
  if (p.backStyle === 'panel' && rearOpeningHeight > 0) {
    parts.push(
      part(
        'back',
        'Applied Back Panel',
        'back',
        { x: t, y: D - appliedBackThickness - p.backInset, z: base + t },
        { x: W - 2 * t, y: appliedBackThickness, z: rearOpeningHeight },
        backWood,
        backMaterial,
        { backStyle: p.backStyle, inset: p.backInset },
      ),
    );
  } else if (p.backStyle === 'structural_panel' && rearOpeningHeight > 0) {
    parts.push(
      part(
        'back',
        'Structural Back Panel',
        'back',
        { x: t, y: D - t, z: base + t },
        { x: W - 2 * t, y: t, z: rearOpeningHeight },
        backWood,
        carcassMaterial,
        { backStyle: p.backStyle, ...carcassMeta },
      ),
    );
  } else if (p.backStyle === 'stretchers' && rearOpeningHeight > 0) {
    const count = p.backStretcherCount;
    const railHeight = Math.min(p.backStretcherHeight, rearOpeningHeight / count);
    const travel = Math.max(0, rearOpeningHeight - railHeight);
    for (let index = 0; index < count; index += 1) {
      const z = base + t + (count === 1 ? travel / 2 : travel * index / (count - 1));
      parts.push(
        part(
          `back:stretcher:${index + 1}`,
          `Back Stretcher ${index + 1}`,
          'back',
          { x: t, y: D - t, z },
          { x: W - 2 * t, y: t, z: railHeight },
          darkWood,
          carcassMaterial,
          { backStyle: p.backStyle, ...carcassMeta },
        ),
      );
    }
  }

  if (p.mountStyle === 'floor' && p.baseStyle === 'toe_kick' && base > 0) {
    parts.push(
      part(
        'toe-kick',
        'Toe Kick',
        'carcass',
        { x: t, y: p.toeKickDepth, z: 0 },
        { x: W - 2 * t, y: t, z: base },
        darkWood,
        carcassMaterial,
        { setback: p.toeKickDepth },
      ),
    );
  }

  if (p.mountStyle === 'floor' && (p.baseStyle === 'leveling_feet' || p.baseStyle === 'casters')) {
    const hardwareHeight = p.baseStyle === 'casters' ? 100 : 30;
    const hardwareSize = p.baseStyle === 'casters'
      ? { x: 35, y: 45, z: 70 }
      : { x: 40, y: 40, z: 30 };
    const insetX = Math.min(55, W / 4);
    const insetY = Math.min(55, D / 4);
    for (const [ix, x] of [insetX, W - insetX - hardwareSize.x].entries()) {
      for (const [iy, y] of [insetY, D - insetY - hardwareSize.y].entries()) {
        parts.push(
          part(
            `base:hardware:${ix + 1}:${iy + 1}`,
            p.baseStyle === 'casters' ? 'Caster' : 'Leveling Foot',
            'hardware',
            { x, y, z: -hardwareHeight },
            hardwareSize,
            hardwareColor,
            p.baseStyle === 'casters' ? 'Caster hardware' : 'Leveling hardware',
            { baseStyle: p.baseStyle },
          ),
        );
      }
    }
  }

  if (p.layoutMode === 'sections') {
    addSectionLayoutParts(parts, p, t, appliedBackThickness, carcassMaterial, carcassMeta);
  } else {
    addLegacyLayoutParts(parts, p, t, appliedBackThickness, carcassMaterial, carcassMeta);
  }

  if (p.includeWorktop) {
    parts.push(
      part(
        'worktop',
        'Worktop',
        'worktop',
        {
          x: -p.worktopSideOverhang,
          y: -p.worktopFrontOverhang,
          z: H,
        },
        {
          x: W + 2 * p.worktopSideOverhang,
          y: D + p.worktopFrontOverhang + p.worktopBackOverhang,
          z: p.worktopThickness,
        },
        worktopColor,
        `Worktop stock (${round(p.worktopThickness)} mm)`,
        { separateWorktop: true },
      ),
    );
  }

  applyJoineryRenderFeatures(parts, p, t, base);

  return {
    version: 2,
    id: 'cabinet-root',
    family: 'utility',
    name,
    units: 'mm',
    displayUnits,
    parameters: p,
    parts,
  };
}

function addLegacyLayoutParts(
  parts: CadPart[],
  p: CabinetParameters,
  t: number,
  appliedBackThickness: number,
  carcassMaterial: string,
  carcassMeta: CadPart['metadata'],
) {
  const base = p.mountStyle === 'floor' && p.baseStyle === 'toe_kick' ? p.toeKickHeight : 0;
  const interiorBottom = base + t;
  const interiorTop = p.height - t;
  const interiorHeight = Math.max(0, interiorTop - interiorBottom);
  const hasDrawers = p.cabinetContents === 'drawers' || p.cabinetContents === 'combo';
  const hasDoors = p.cabinetContents === 'doors' || p.cabinetContents === 'combo';
  const drawerZoneHeight = hasDrawers
    ? p.cabinetContents === 'drawers'
      ? interiorHeight
      : Math.min(interiorHeight * 0.42, 330)
    : 0;
  const doorZoneTop = interiorTop - (hasDrawers && hasDoors ? drawerZoneHeight + p.frontEdgeReveal : 0);
  const doorZoneHeight = hasDoors ? Math.max(0, doorZoneTop - interiorBottom) : 0;
  const backDepth = p.backStyle === 'structural_panel'
    ? t
    : p.backStyle === 'panel'
      ? appliedBackThickness + p.backInset
      : 0;
  const interiorDepth = Math.max(80, p.depth - backDepth - 20);

  if (hasDoors && p.shelfCount > 0 && doorZoneHeight > t) {
    const shelfDepth = Math.max(20, p.depth - backDepth - 16);
    for (let i = 1; i <= p.shelfCount; i += 1) {
      const z = interiorBottom + (doorZoneHeight * i) / (p.shelfCount + 1) - t / 2;
      parts.push(
        part(
          `shelf:${i}`,
          `${p.shelfStyle === 'adjustable' ? 'Adjustable' : 'Fixed'} Shelf ${i}`,
          'shelf',
          { x: t + 2, y: 8, z },
          { x: p.width - 2 * t - 4, y: shelfDepth, z: t },
          lightWood,
          carcassMaterial,
          { shelfStyle: p.shelfStyle, adjustable: p.shelfStyle === 'adjustable', ...carcassMeta },
        ),
      );
    }
  }

  const openingWidth = Math.max(1, p.width - 2 * t);
  if (hasDrawers && p.drawerCount > 0 && drawerZoneHeight > 0) {
    const availableHeight = Math.max(1, drawerZoneHeight - p.frontEdgeReveal * 2 - p.drawerGap * (p.drawerCount - 1));
    const rowHeight = availableHeight / p.drawerCount;
    const frontDepth = p.drawerFrontThickness;
    const frontY = p.frontMountStyle === 'overlay' ? -frontDepth : 0;

    for (let i = 0; i < p.drawerCount; i += 1) {
      const z = interiorTop - p.frontEdgeReveal - (i + 1) * rowHeight - i * p.drawerGap;
      parts.push(
        part(
          `drawer:${i + 1}:front`,
          `Drawer Front ${i + 1}`,
          'front',
          { x: t + p.frontEdgeReveal, y: frontY, z },
          { x: openingWidth - 2 * p.frontEdgeReveal, y: frontDepth, z: rowHeight },
          lightWood,
          `Drawer front stock (${round(frontDepth)} mm)`,
          { drawer: i + 1, frontMountStyle: p.frontMountStyle },
        ),
      );
      addDrawerBox(parts, p, {
        idPrefix: `drawer:${i + 1}`,
        namePrefix: `Drawer ${i + 1}`,
        x: t,
        z,
        width: openingWidth,
        frontHeight: rowHeight,
        depth: interiorDepth,
        sectionId: 0,
        drawerIndex: i + 1,
      });
    }
  }

  if (hasDoors && p.doorCount > 0 && doorZoneHeight > 0) {
    addDoorFronts(parts, p, {
      idPrefix: 'door',
      x: t,
      z: interiorBottom,
      width: openingWidth,
      height: doorZoneHeight,
      count: p.doorCount,
      sectionId: 0,
    });
  }
}

function addSectionLayoutParts(
  parts: CadPart[],
  p: CabinetParameters,
  t: number,
  appliedBackThickness: number,
  carcassMaterial: string,
  carcassMeta: CadPart['metadata'],
) {
  if (sectionLayoutErrors(p, t).length) return;

  const root = sectionRoot(p, t);
  const rects = sectionRects(p.sectionNodes, root, t);
  const backDepth = p.backStyle === 'structural_panel'
    ? t
    : p.backStyle === 'panel'
      ? appliedBackThickness + p.backInset
      : 0;
  const interiorDepth = Math.max(20, p.depth - backDepth);

  for (const panel of sectionPanels(p.sectionNodes, rects, t, interiorDepth)) {
    const shelf = panel.id.includes('-SH-');
    parts.push(
      part(
        `section:${panel.id}`,
        shelf ? 'Section Shelf' : panel.divider === 'rail' ? 'Section Support Rail' : 'Section Divider',
        shelf ? 'shelf' : 'divider',
        { x: panel.x, y: 0, z: panel.z },
        { x: panel.w, y: panel.d, z: panel.h },
        shelf ? lightWood : dividerColor,
        carcassMaterial,
        {
          sectionFeature: true,
          divider: panel.divider,
          shelfStyle: p.shelfStyle,
          ...carcassMeta,
        },
      ),
    );
  }

  for (const rect of rects) {
    const node = p.sectionNodes[rect.id];
    if (node[2] !== 'leaf') continue;

    if (node[5] === 'drawers' && node[6] > 0) {
      const weights = Array.from({ length: node[6] }, (_, index) =>
        node[7] === 'graduated'
          ? 1 + index * node[8]
          : node[7] === 'custom_weights'
            ? node[9][index] ?? 1
            : 1,
      );
      const total = weights.reduce((sum, weight) => sum + weight, 0);
      const available = Math.max(
        1,
        rect.h - 2 * p.frontEdgeReveal - p.drawerGap * Math.max(0, node[6] - 1),
      );
      const frontY = p.frontMountStyle === 'overlay' ? -p.drawerFrontThickness : 0;
      let top = rect.z + rect.h - p.frontEdgeReveal;

      weights.forEach((weight, index) => {
        const height = available * weight / total;
        top -= height;
        parts.push(
          part(
            `section:${rect.id + 1}:drawer:${index + 1}:front`,
            `Section ${rect.id + 1} Drawer Front ${index + 1}`,
            'front',
            { x: rect.x + p.frontEdgeReveal, y: frontY, z: top },
            { x: Math.max(1, rect.w - 2 * p.frontEdgeReveal), y: p.drawerFrontThickness, z: height },
            lightWood,
            `Drawer front stock (${round(p.drawerFrontThickness)} mm)`,
            {
              sectionId: rect.id + 1,
              drawer: index + 1,
              drawerHeightMode: node[7],
              frontMountStyle: p.frontMountStyle,
            },
          ),
        );
        addDrawerBox(parts, p, {
          idPrefix: `section:${rect.id + 1}:drawer:${index + 1}`,
          namePrefix: `Section ${rect.id + 1} Drawer ${index + 1}`,
          x: rect.x,
          z: top,
          width: rect.w,
          frontHeight: height,
          depth: interiorDepth,
          sectionId: rect.id + 1,
          drawerIndex: index + 1,
        });
        top -= p.drawerGap;
      });
    }

    if (node[5] === 'doors' && node[6] > 0) {
      addDoorFronts(parts, p, {
        idPrefix: `section:${rect.id + 1}:door`,
        x: rect.x,
        z: rect.z,
        width: rect.w,
        height: rect.h,
        count: node[6],
        sectionId: rect.id + 1,
      });
    }
  }
}

function addDoorFronts(
  parts: CadPart[],
  p: CabinetParameters,
  area: {
    idPrefix: string;
    x: number;
    z: number;
    width: number;
    height: number;
    count: number;
    sectionId: number;
  },
) {
  const count = Math.max(1, Math.min(2, area.count));
  const availableWidth = Math.max(
    1,
    area.width - 2 * p.frontEdgeReveal - p.doorGap * (count - 1),
  );
  const doorWidth = availableWidth / count;
  const doorHeight = Math.max(1, area.height - 2 * p.frontEdgeReveal);
  const frontY = p.frontMountStyle === 'overlay' ? -p.doorThickness : 0;

  for (let index = 0; index < count; index += 1) {
    parts.push(
      part(
        `${area.idPrefix}:${index + 1}`,
        `Section ${area.sectionId || 1} Door ${index + 1}`,
        'front',
        {
          x: area.x + p.frontEdgeReveal + index * (doorWidth + p.doorGap),
          y: frontY,
          z: area.z + p.frontEdgeReveal,
        },
        { x: doorWidth, y: p.doorThickness, z: doorHeight },
        lightWood,
        `Door stock (${round(p.doorThickness)} mm)`,
        {
          sectionId: area.sectionId,
          door: index + 1,
          frontMountStyle: p.frontMountStyle,
        },
      ),
    );
  }
}

function addDrawerBox(
  parts: CadPart[],
  p: CabinetParameters,
  area: {
    idPrefix: string;
    namePrefix: string;
    x: number;
    z: number;
    width: number;
    frontHeight: number;
    depth: number;
    sectionId: number;
    drawerIndex: number;
  },
) {
  const sideClearance = Math.min(13, Math.max(6, area.width * 0.04));
  const wall = Math.min(p.drawerMaterialThickness, Math.max(6, area.width / 8));
  const width = Math.max(30, area.width - 2 * sideClearance);
  const depth = Math.max(60, area.depth - 24);
  const height = Math.max(4, Math.min(area.frontHeight - 8, 180));
  const bottom = Math.min(p.drawerBottomThickness, Math.max(2, height / 3));
  const x = area.x + sideClearance;
  const y = 12;
  const z = area.z + Math.max(8, Math.min(16, (area.frontHeight - height) / 2));
  const insideWidth = Math.max(12, width - 2 * wall);
  const material = `Drawer box stock (${round(wall)} mm)`;
  const metadata = {
    drawer: area.drawerIndex,
    sectionId: area.sectionId,
    drawerBox: true,
  };

  parts.push(
    part(
      `${area.idPrefix}:box:left`,
      `${area.namePrefix} Left Side`,
      'drawer',
      { x, y, z },
      { x: wall, y: depth, z: height },
      darkWood,
      material,
      metadata,
    ),
    part(
      `${area.idPrefix}:box:right`,
      `${area.namePrefix} Right Side`,
      'drawer',
      { x: x + width - wall, y, z },
      { x: wall, y: depth, z: height },
      darkWood,
      material,
      metadata,
    ),
    part(
      `${area.idPrefix}:box:front`,
      `${area.namePrefix} Box Front`,
      'drawer',
      { x: x + wall, y, z },
      { x: insideWidth, y: wall, z: height },
      darkWood,
      material,
      metadata,
    ),
    part(
      `${area.idPrefix}:box:back`,
      `${area.namePrefix} Box Back`,
      'drawer',
      { x: x + wall, y: y + depth - wall, z },
      { x: insideWidth, y: wall, z: height },
      darkWood,
      material,
      metadata,
    ),
    part(
      `${area.idPrefix}:box:bottom`,
      `${area.namePrefix} Bottom`,
      'drawer',
      { x: x + wall, y: y + wall, z: z + Math.min(10, height / 4) },
      { x: insideWidth, y: Math.max(20, depth - 2 * wall), z: bottom },
      lightWood,
      `Drawer bottom stock (${round(bottom)} mm)`,
      metadata,
    ),
  );
}

function sidePanelGeometry(
  p: CabinetParameters,
  base: number,
  depth: number,
  height: number,
  toeKickNotch: boolean,
): CadPart['geometry'] {
  const notchDepth = toeKickNotch && p.mountStyle === 'floor' && p.baseStyle === 'toe_kick'
    ? Math.min(Math.max(0, p.toeKickDepth), Math.max(0, depth - 20))
    : 0;
  const notchHeight = toeKickNotch ? Math.min(base, Math.max(0, height - 20)) : 0;
  const outline = notchDepth > 0 && notchHeight > 0
    ? [
        { u: notchDepth, v: 0 },
        { u: depth, v: 0 },
        { u: depth, v: height },
        { u: 0, v: height },
        { u: 0, v: notchHeight },
        { u: notchDepth, v: notchHeight },
      ]
    : [
        { u: 0, v: 0 },
        { u: depth, v: 0 },
        { u: depth, v: height },
        { u: 0, v: height },
      ];

  return {
    kind: 'extruded-profile',
    axis: 'x',
    outline,
    holes: sidePanelHoles(p, base, depth, height),
  };
}

function sidePanelHoles(
  p: CabinetParameters,
  base: number,
  depth: number,
  height: number,
): CadProfileHole[] {
  const holes: CadProfileHole[] = [];
  const interiorBottom = base + stockThickness(p.carcassStock, p.materialThickness);
  const interiorTop = height - stockThickness(p.carcassStock, p.materialThickness);

  if (p.shelfStyle === 'adjustable') {
    const columns = [Math.min(55, depth * 0.18), Math.max(65, depth - Math.min(55, depth * 0.18))];
    for (let z = interiorBottom + 48; z <= interiorTop - 48; z += 32) {
      for (const y of columns) holes.push({ kind: 'circle', u: y, v: z, radius: 2.5 });
    }
  }

  if (p.joineryStyle === 'screw') {
    const ys = [Math.min(70, depth * 0.2), Math.max(80, depth - Math.min(70, depth * 0.2))];
    const zs = [Math.max(12, base + stockThickness(p.carcassStock, p.materialThickness) / 2), Math.max(20, height - stockThickness(p.carcassStock, p.materialThickness) / 2)];
    for (const y of ys) for (const z of zs) holes.push({ kind: 'circle', u: y, v: z, radius: 3 });
  }

  if (p.joineryStyle === 'tab_slot') {
    const slotWidth = Math.min(36, Math.max(18, depth * 0.08));
    const slotHeight = stockThickness(p.carcassStock, p.materialThickness) + p.dadoFitClearance;
    const ys = [depth * 0.25, depth * 0.65];
    for (const y of ys) {
      holes.push({
        kind: 'rect',
        u: Math.max(2, y - slotWidth / 2),
        v: Math.max(2, base - p.dadoFitClearance / 2),
        width: slotWidth,
        height: Math.max(4, slotHeight),
      });
    }
  }

  return holes;
}

function applyJoineryRenderFeatures(
  parts: CadPart[],
  p: CabinetParameters,
  thickness: number,
  base: number,
) {
  if (p.joineryStyle !== 'dado') return;

  const left = parts.find(candidate => candidate.id === 'carcass:left');
  const right = parts.find(candidate => candidate.id === 'carcass:right');
  if (!left || !right) return;

  const candidates = parts.filter(candidate =>
    candidate.id === 'carcass:bottom' ||
    candidate.category === 'shelf' ||
    (candidate.category === 'divider' && candidate.size.z <= thickness * 1.5)
  );
  const depth = Math.min(Math.max(0.5, p.dadoDepth), Math.max(0.5, thickness - 0.5));
  const clearance = Math.max(0, p.dadoFitClearance);

  for (const candidate of candidates) {
    if (candidate.position.z < base - 1 || candidate.position.z > p.height - thickness + 1) continue;
    const featureDepth = Math.min(p.depth, Math.max(20, candidate.size.y));
    const z = Math.max(0, candidate.position.z - clearance / 2);
    const h = Math.max(1, candidate.size.z + clearance);
    const feature = {
      kind: 'dado' as const,
      position: { x: Math.max(0, thickness - depth - 0.4), y: Math.max(0, candidate.position.y), z },
      size: { x: depth + 0.8, y: featureDepth, z: h },
      color: '#51351f',
      opacity: 0.78,
    };
    left.renderFeatures = [...(left.renderFeatures ?? []), feature];
    right.renderFeatures = [
      ...(right.renderFeatures ?? []),
      {
        ...feature,
        position: { ...feature.position, x: -0.4 },
      },
    ];
  }
}

export function sanitizeParameters(input: Partial<CabinetParameters>): CabinetParameters {
  const defaults = makeUtilityDefaults();
  const source = { ...defaults, ...input };

  const carcassStock = oneOf(source.carcassStock, stockChoices, defaults.carcassStock);
  const backStock = oneOf(source.backStock, stockChoices, defaults.backStock);
  const width = clampNumber(source.width, 300, 2400, defaults.width);
  const height = clampNumber(source.height, 300, 3000, defaults.height);
  const depth = clampNumber(source.depth, 200, 1200, defaults.depth);
  const layoutMode = oneOf(source.layoutMode, ['legacy', 'sections'] as const, defaults.layoutMode);
  const sectionNodes = Array.isArray(source.sectionNodes) && !treeErrors(source.sectionNodes).length
    ? cloneSectionNodes(source.sectionNodes as SectionNode[])
    : cloneSectionNodes(defaults.sectionNodes);

  return {
    width,
    height,
    depth,

    carcassStock,
    backStock,
    materialThickness: clampNumber(source.materialThickness, 6, 50, defaults.materialThickness),
    backThickness: clampNumber(source.backThickness, 2, 25, defaults.backThickness),
    drawerMaterialThickness: clampNumber(source.drawerMaterialThickness, 6, 30, defaults.drawerMaterialThickness),
    drawerBottomThickness: clampNumber(source.drawerBottomThickness, 2, 20, defaults.drawerBottomThickness),
    drawerFrontThickness: clampNumber(source.drawerFrontThickness, 6, 40, defaults.drawerFrontThickness),
    doorThickness: clampNumber(source.doorThickness, 6, 40, defaults.doorThickness),

    layoutMode,
    sectionNodes,
    cabinetContents: oneOf(source.cabinetContents, ['drawers', 'doors', 'combo'] as const, defaults.cabinetContents),
    drawerCount: clampInteger(source.drawerCount, 0, 8, defaults.drawerCount),
    doorCount: clampInteger(source.doorCount, 0, 4, defaults.doorCount),
    shelfCount: clampInteger(source.shelfCount, 0, 6, defaults.shelfCount),

    topStyle: oneOf(source.topStyle, ['full', 'stretchers'] as const, defaults.topStyle),
    topStretcherDepth: clampNumber(source.topStretcherDepth, 30, Math.max(30, depth / 2), defaults.topStretcherDepth),
    backStyle: oneOf(source.backStyle, ['panel', 'structural_panel', 'stretchers', 'none'] as const, defaults.backStyle),
    backInset: clampNumber(source.backInset, 0, 100, defaults.backInset),
    backStretcherCount: clampInteger(source.backStretcherCount, 1, 4, defaults.backStretcherCount),
    backStretcherHeight: clampNumber(source.backStretcherHeight, 30, 300, defaults.backStretcherHeight),

    mountStyle: oneOf(source.mountStyle, ['floor', 'wall'] as const, defaults.mountStyle),
    baseStyle: oneOf(source.baseStyle, ['toe_kick', 'flat', 'leveling_feet', 'casters'] as const, defaults.baseStyle),
    toeKickHeight: clampNumber(source.toeKickHeight, 0, Math.max(0, height * 0.35), defaults.toeKickHeight),
    toeKickDepth: clampNumber(source.toeKickDepth, 0, Math.max(0, depth - 40), defaults.toeKickDepth),
    sideToeKickCutout: oneOf(source.sideToeKickCutout, ['none', 'left', 'right', 'both'] as const, defaults.sideToeKickCutout),
    bottomWidthStyle: oneOf(source.bottomWidthStyle, ['joined', 'full_width'] as const, defaults.bottomWidthStyle),

    includeWorktop: Boolean(source.includeWorktop),
    worktopThickness: clampNumber(source.worktopThickness, 6, 100, defaults.worktopThickness),
    worktopSideOverhang: clampNumber(source.worktopSideOverhang, 0, 300, defaults.worktopSideOverhang),
    worktopFrontOverhang: clampNumber(source.worktopFrontOverhang, 0, 300, defaults.worktopFrontOverhang),
    worktopBackOverhang: clampNumber(source.worktopBackOverhang, 0, 300, defaults.worktopBackOverhang),

    joineryStyle: oneOf(source.joineryStyle, ['butt', 'screw', 'dado', 'tab_slot'] as const, defaults.joineryStyle),
    dadoDepth: clampNumber(source.dadoDepth, 2, 18, defaults.dadoDepth),
    dadoFitClearance: clampNumber(source.dadoFitClearance, 0, 2, defaults.dadoFitClearance),

    frontMountStyle: oneOf(source.frontMountStyle, ['overlay', 'inset_flush'] as const, defaults.frontMountStyle),
    frontEdgeReveal: clampNumber(source.frontEdgeReveal, 0, 20, defaults.frontEdgeReveal),
    doorGap: clampNumber(source.doorGap, 0.5, 20, defaults.doorGap),
    drawerGap: clampNumber(source.drawerGap, 0.5, 20, defaults.drawerGap),
    shelfStyle: oneOf(source.shelfStyle, ['fixed', 'adjustable'] as const, defaults.shelfStyle),
  };
}

const stockChoices = [
  'custom_mm',
  '1/8_nominal',
  '1/4_nominal',
  '3/8_nominal',
  '1/2_nominal',
  '5/8_nominal',
  '3/4_nominal',
  '1_nominal',
] as const;

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? value as T
    : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const finite = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, finite));
}

function clampInteger(value: unknown, min: number, max: number, fallback: number) {
  return Math.round(clampNumber(value, min, max, fallback));
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export const PRESETS: Record<string, CabinetParameters> = Object.fromEntries(
  UTILITY_STARTERS.map(starter => [starter.name, { ...starter.parameters }]),
);
