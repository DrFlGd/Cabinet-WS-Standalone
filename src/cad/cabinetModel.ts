import type { CabinetDocument, CabinetParameters, CadPart, CadProfileHole, SectionNode, StockChoice } from './types';
import type { DisplayUnits } from './units';
import { makeUtilityDefaults, UTILITY_STARTERS } from './utilityStarters';
import { cloneSectionNodes, sectionLayoutErrors, sectionPanels, sectionRects, sectionRoot, treeErrors } from './sections';
import { applyHardwareDrilling, buildHardwareInstances, hardwareParts } from './hardware';

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

  addFaceFrameParts(parts, p, t, base);

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
  const hardware = buildHardwareInstances(parts, p);
  applyHardwareDrilling(parts, hardware, p);
  parts.push(...hardwareParts(hardware));

  return {
    version: 3,
    id: 'cabinet-root',
    family: 'utility',
    starterId: null,
    familyValues: {},
    name,
    units: 'mm',
    displayUnits,
    parameters: p,
    parts,
    hardware,
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
      const normalized = p.shelfPositions[i - 1] ?? i / (p.shelfCount + 1);
      const centerZ = interiorBottom + doorZoneHeight * normalized;
      const z = centerZ - t / 2;
      parts.push(
        part(
          `shelf:${i}`,
          `${p.shelfStyle === 'adjustable' ? 'Adjustable' : 'Fixed'} Shelf ${i}`,
          'shelf',
          { x: t + 2, y: 8, z },
          { x: p.width - 2 * t - 4, y: shelfDepth, z: t },
          lightWood,
          carcassMaterial,
          {
            shelfStyle: p.shelfStyle,
            adjustable: p.shelfStyle === 'adjustable',
            shelfIndex: i,
            sectionId: 0,
            shelfMinZ: interiorBottom,
            shelfMaxZ: interiorBottom + doorZoneHeight,
            ...carcassMeta,
          },
        ),
      );
    }
  }

  const openingWidth = Math.max(1, p.width - 2 * t);
  if (hasDrawers && p.drawerCount > 0 && drawerZoneHeight > 0) {
    const rawDrawerOpening = {
      x: t,
      z: interiorTop - drawerZoneHeight,
      width: openingWidth,
      height: drawerZoneHeight,
    };
    const drawerOpening = faceFrameOpening(p, rawDrawerOpening);
    const availableHeight = Math.max(1, drawerOpening.height - p.frontEdgeReveal * 2 - p.drawerGap * (p.drawerCount - 1));
    const weights = Array.from({ length: p.drawerCount }, (_, index) =>
      p.drawerHeightMode === 'graduated'
        ? 1 + index * p.drawerGraduatedStep
        : p.drawerHeightMode === 'custom_weights'
          ? p.drawerCustomWeights[index] ?? 1
          : 1,
    );
    const totalWeight = Math.max(0.001, weights.reduce((sum, weight) => sum + weight, 0));
    const frontDepth = p.drawerFrontThickness;
    const frontY = frontPlaneY(p, frontDepth);
    let top = drawerOpening.z + drawerOpening.height - p.frontEdgeReveal;

    for (let i = 0; i < p.drawerCount; i += 1) {
      const rowHeight = availableHeight * weights[i] / totalWeight;
      top -= rowHeight;
      const z = top;
      parts.push(
        part(
          `drawer:${i + 1}:front`,
          `Drawer Front ${i + 1}`,
          'front',
          { x: drawerOpening.x + p.frontEdgeReveal, y: frontY, z },
          { x: Math.max(1, drawerOpening.width - 2 * p.frontEdgeReveal), y: frontDepth, z: rowHeight },
          lightWood,
          `Drawer front stock (${round(frontDepth)} mm)`,
          { drawer: i + 1, drawerHeightMode: p.drawerHeightMode, frontMountStyle: p.frontMountStyle },
        ),
      );
      addDrawerBox(parts, p, {
        idPrefix: `drawer:${i + 1}`,
        namePrefix: `Drawer ${i + 1}`,
        x: drawerOpening.x,
        z,
        width: drawerOpening.width,
        frontHeight: rowHeight,
        depth: interiorDepth,
        sectionId: 0,
        drawerIndex: i + 1,
      });
      top -= p.drawerGap;
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
          sectionDivider: !shelf,
          dividerParentId: panel.sourceParentId ?? -1,
          dividerOrder: panel.sourceOrder ?? -1,
          dividerAxis: panel.axis ?? '',
          sectionId: shelf ? (panel.sourceSectionId ?? 0) + 1 : 0,
          shelfIndex: shelf ? panel.shelfIndex ?? 0 : 0,
          shelfMinZ: shelf && panel.sourceSectionId !== undefined ? rects[panel.sourceSectionId]?.z ?? 0 : 0,
          shelfMaxZ: shelf && panel.sourceSectionId !== undefined ? (rects[panel.sourceSectionId]?.z ?? 0) + (rects[panel.sourceSectionId]?.h ?? 0) : 0,
          ...carcassMeta,
        },
      ),
    );
  }

  for (const rect of rects) {
    const node = p.sectionNodes[rect.id];
    if (node[2] !== 'leaf') continue;

    if (node[5] === 'drawers' && node[6] > 0) {
      const frontRect = faceFrameOpening(p, {
        x: rect.x,
        z: rect.z,
        width: rect.w,
        height: rect.h,
      });
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
        frontRect.height - 2 * p.frontEdgeReveal - p.drawerGap * Math.max(0, node[6] - 1),
      );
      const frontY = frontPlaneY(p, p.drawerFrontThickness);
      let top = frontRect.z + frontRect.height - p.frontEdgeReveal;

      weights.forEach((weight, index) => {
        const height = available * weight / total;
        top -= height;
        parts.push(
          part(
            `section:${rect.id + 1}:drawer:${index + 1}:front`,
            `Section ${rect.id + 1} Drawer Front ${index + 1}`,
            'front',
            { x: frontRect.x + p.frontEdgeReveal, y: frontY, z: top },
            { x: Math.max(1, frontRect.width - 2 * p.frontEdgeReveal), y: p.drawerFrontThickness, z: height },
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
          x: frontRect.x,
          z: top,
          width: frontRect.width,
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
  const opening = faceFrameOpening(p, area);
  const count = Math.max(1, Math.min(2, area.count));
  const centerFrame = p.faceFrameStyle === 'full' && count > 1 ? p.faceFrameCenterStileWidth : 0;
  const availableWidth = Math.max(
    1,
    opening.width - 2 * p.frontEdgeReveal - p.doorGap * (count - 1) - centerFrame,
  );
  const doorWidth = availableWidth / count;
  const doorHeight = Math.max(1, opening.height - 2 * p.frontEdgeReveal);
  const frontY = frontPlaneY(p, p.doorThickness);

  for (let index = 0; index < count; index += 1) {
    parts.push(
      part(
        `${area.idPrefix}:${index + 1}`,
        `Section ${area.sectionId || 1} Door ${index + 1}`,
        'front',
        {
          x: opening.x + p.frontEdgeReveal + index * (doorWidth + p.doorGap + (index > 0 ? centerFrame : 0)),
          y: frontY,
          z: opening.z + p.frontEdgeReveal,
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
  const sideClearance = p.drawerMount === 'metal_slides'
    ? Math.max(3, p.metalSlideClearancePerSide)
    : Math.min(13, Math.max(6, area.width * 0.04));
  const wall = Math.min(p.drawerMaterialThickness, Math.max(6, area.width / 8));
  const width = Math.max(30, area.width - 2 * sideClearance);
  const availableDepth = Math.max(60, area.depth - 24);
  const depth = p.drawerMount === 'metal_slides'
    ? Math.max(60, Math.min(availableDepth, p.metalSlideLength))
    : availableDepth;
  const height = Math.max(18, Math.min(area.frontHeight - 8, 180));
  const bottom = Math.min(p.drawerBottomThickness, Math.max(2, height / 3));
  const x = area.x + sideClearance;
  const y = 12;
  const centeredZ = area.z + Math.max(4, (area.frontHeight - height) / 2);
  const boxZ = p.drawerFrontRegistration === 'flush_top'
    ? area.z + Math.max(4, area.frontHeight - height - 4)
    : p.drawerFrontRegistration === 'flush_bottom'
      ? area.z + 4
      : centeredZ;
  const sideZ = p.drawerBottomStyle === 'applied' ? boxZ + bottom : boxZ;
  const sideHeight = Math.max(12, height - (p.drawerBottomStyle === 'applied' ? bottom : 0));
  const insideWidth = Math.max(12, width - 2 * wall);
  const material = `Drawer box stock (${round(wall)} mm)`;
  const metadata = {
    drawer: area.drawerIndex,
    sectionId: area.sectionId,
    drawerBox: true,
    drawerJoinery: p.drawerJoineryStyle,
    drawerBottomStyle: p.drawerBottomStyle,
    frontRegistration: p.drawerFrontRegistration,
  };

  const left = part(
    `${area.idPrefix}:box:left`, `${area.namePrefix} Left Side`, 'drawer',
    { x, y, z: sideZ }, { x: wall, y: depth, z: sideHeight }, darkWood, material, metadata,
  );
  const right = part(
    `${area.idPrefix}:box:right`, `${area.namePrefix} Right Side`, 'drawer',
    { x: x + width - wall, y, z: sideZ }, { x: wall, y: depth, z: sideHeight }, darkWood, material, metadata,
  );
  const front = part(
    `${area.idPrefix}:box:front`, `${area.namePrefix} Box Front`, 'drawer',
    { x: x + wall, y, z: sideZ }, { x: insideWidth, y: wall, z: sideHeight }, darkWood, material, metadata,
  );
  const back = part(
    `${area.idPrefix}:box:back`, `${area.namePrefix} Box Back`, 'drawer',
    { x: x + wall, y: y + depth - wall, z: sideZ }, { x: insideWidth, y: wall, z: sideHeight }, darkWood, material, metadata,
  );

  if (p.drawerBottomStyle === 'captured') {
    const grooveDepth = Math.min(Math.max(1, p.drawerBottomGrooveDepth), Math.max(1, wall - 1));
    const grooveZ = Math.min(sideHeight - bottom - 2, Math.max(4, sideHeight * 0.12));
    left.renderFeatures = [{ kind: 'slot', sourcePartId: `${area.idPrefix}:box:bottom`, position: { x: Math.max(0, wall - grooveDepth), y: wall, z: grooveZ }, size: { x: grooveDepth, y: Math.max(5, depth - 2 * wall), z: bottom + 0.4 } }];
    right.renderFeatures = [{ kind: 'slot', sourcePartId: `${area.idPrefix}:box:bottom`, position: { x: 0, y: wall, z: grooveZ }, size: { x: grooveDepth, y: Math.max(5, depth - 2 * wall), z: bottom + 0.4 } }];
    front.renderFeatures = [{ kind: 'slot', sourcePartId: `${area.idPrefix}:box:bottom`, position: { x: 0, y: Math.max(0, wall - grooveDepth), z: grooveZ }, size: { x: insideWidth, y: grooveDepth, z: bottom + 0.4 } }];
    back.renderFeatures = [{ kind: 'slot', sourcePartId: `${area.idPrefix}:box:bottom`, position: { x: 0, y: 0, z: grooveZ }, size: { x: insideWidth, y: grooveDepth, z: bottom + 0.4 } }];
  }

  if (p.drawerJoineryStyle !== 'butt') {
    const rabbetDepth = Math.min(Math.max(2, wall * 0.45), Math.max(2, wall - 1));
    const ends = [left, right];
    ends.forEach(side => {
      side.renderFeatures = [
        ...(side.renderFeatures ?? []),
        { kind: 'rabbet', sourcePartId: front.id, position: { x: 0, y: 0, z: 0 }, size: { x: side.size.x, y: rabbetDepth, z: side.size.z } },
        { kind: 'rabbet', sourcePartId: back.id, position: { x: 0, y: side.size.y - rabbetDepth, z: 0 }, size: { x: side.size.x, y: rabbetDepth, z: side.size.z } },
      ];
      if (p.drawerJoineryStyle === 'lock_rabbet') {
        side.renderFeatures.push({ kind: 'slot', sourcePartId: front.id, position: { x: 0, y: rabbetDepth, z: side.size.z * 0.25 }, size: { x: side.size.x, y: Math.min(wall, 4), z: Math.max(3, wall * 0.5) } });
      }
    });
  }

  parts.push(left, right, front, back);

  const bottomPart = p.drawerBottomStyle === 'applied'
    ? part(
        `${area.idPrefix}:box:bottom`, `${area.namePrefix} Applied Bottom`, 'drawer',
        { x, y, z: boxZ }, { x: width, y: depth, z: bottom }, lightWood,
        `Drawer bottom stock (${round(bottom)} mm)`, metadata,
      )
    : part(
        `${area.idPrefix}:box:bottom`, `${area.namePrefix} Captured Bottom`, 'drawer',
        { x: x + wall - Math.min(p.drawerBottomGrooveDepth, wall - 1), y: y + wall - Math.min(p.drawerBottomGrooveDepth, wall - 1), z: sideZ + Math.min(sideHeight - bottom - 2, Math.max(4, sideHeight * 0.12)) },
        { x: Math.max(12, insideWidth + 2 * Math.min(p.drawerBottomGrooveDepth, wall - 1)), y: Math.max(20, depth - 2 * wall + 2 * Math.min(p.drawerBottomGrooveDepth, wall - 1)), z: bottom },
        lightWood, `Drawer bottom stock (${round(bottom)} mm)`, metadata,
      );
  parts.push(bottomPart);

  const organizerThickness = Math.min(9, Math.max(4, wall * 0.65));
  const organizerHeight = Math.max(12, sideHeight * 0.55);
  for (let index = 1; index <= p.drawerDividerCount; index += 1) {
    const dx = insideWidth * index / (p.drawerDividerCount + 1);
    parts.push(part(
      `${area.idPrefix}:organizer:column:${index}`, `${area.namePrefix} Organizer Column ${index}`, 'drawer',
      { x: x + wall + dx - organizerThickness / 2, y: y + wall, z: sideZ + Math.max(2, sideHeight - organizerHeight) },
      { x: organizerThickness, y: Math.max(20, depth - 2 * wall), z: organizerHeight }, lightWood, material,
      { ...metadata, organizer: true, organizerAxis: 'x' },
    ));
  }
  for (let index = 1; index <= p.drawerDividerRows; index += 1) {
    const dy = Math.max(20, depth - 2 * wall) * index / (p.drawerDividerRows + 1);
    parts.push(part(
      `${area.idPrefix}:organizer:row:${index}`, `${area.namePrefix} Organizer Row ${index}`, 'drawer',
      { x: x + wall, y: y + wall + dy - organizerThickness / 2, z: sideZ + Math.max(2, sideHeight - organizerHeight) },
      { x: insideWidth, y: organizerThickness, z: organizerHeight }, lightWood, material,
      { ...metadata, organizer: true, organizerAxis: 'y' },
    ));
  }
}

function faceFrameOpening(
  p: CabinetParameters,
  area: { x: number; z: number; width: number; height: number },
) {
  if (p.faceFrameStyle !== 'full') return { ...area };
  const insetX = Math.min(area.width * 0.2, p.faceFrameCenterStileWidth / 2);
  const insetZ = Math.min(area.height * 0.2, p.faceFrameRailWidth / 2);
  return {
    x: area.x + insetX,
    z: area.z + insetZ,
    width: Math.max(1, area.width - 2 * insetX),
    height: Math.max(1, area.height - 2 * insetZ),
  };
}

function frontPlaneY(p: CabinetParameters, thickness: number) {
  if (p.faceFrameStyle !== 'full') return p.frontMountStyle === 'overlay' ? -thickness : 0;
  return p.frontMountStyle === 'overlay'
    ? -(p.faceFrameThickness + thickness)
    : -p.faceFrameThickness;
}

function addFaceFrameParts(parts: CadPart[], p: CabinetParameters, thickness: number, base: number) {
  if (p.faceFrameStyle !== 'full') return;
  const frameT = p.faceFrameThickness;
  const stile = Math.min(p.faceFrameStileWidth, p.width / 3);
  const rail = Math.min(p.faceFrameRailWidth, Math.max(20, (p.height - base) / 3));
  const center = Math.min(p.faceFrameCenterStileWidth, p.width / 3);
  const y = -frameT;
  const height = Math.max(1, p.height - base);
  const material = `Face-frame stock (${round(frameT)} mm)`;
  const meta = { faceFrame: true, frameThickness: frameT };

  parts.push(
    part('frame:left-stile', 'Face Frame Left Stile', 'frame', { x: 0, y, z: base }, { x: stile, y: frameT, z: height }, darkWood, material, { ...meta, frameRole: 'stile' }),
    part('frame:right-stile', 'Face Frame Right Stile', 'frame', { x: p.width - stile, y, z: base }, { x: stile, y: frameT, z: height }, darkWood, material, { ...meta, frameRole: 'stile' }),
    part('frame:bottom-rail', 'Face Frame Bottom Rail', 'frame', { x: stile, y, z: base }, { x: Math.max(1, p.width - 2 * stile), y: frameT, z: rail }, darkWood, material, { ...meta, frameRole: 'rail' }),
    part('frame:top-rail', 'Face Frame Top Rail', 'frame', { x: stile, y, z: p.height - rail }, { x: Math.max(1, p.width - 2 * stile), y: frameT, z: rail }, darkWood, material, { ...meta, frameRole: 'rail' }),
  );

  const verticals = new Set<number>();
  const horizontals = new Set<number>();
  if (p.layoutMode === 'sections' && !sectionLayoutErrors(p, thickness).length) {
    const rects = sectionRects(p.sectionNodes, sectionRoot(p, thickness), thickness);
    for (const panel of sectionPanels(p.sectionNodes, rects, thickness, p.depth)) {
      if (panel.sourceParentId === undefined || panel.sourceOrder === undefined || !panel.axis) continue;
      if (panel.axis === 'x') verticals.add(round(panel.x + panel.w / 2));
      else horizontals.add(round(panel.z + panel.h / 2));
    }
  } else {
    const interiorBottom = base + thickness;
    const interiorTop = p.height - thickness;
    const interiorHeight = Math.max(0, interiorTop - interiorBottom);
    const hasDrawers = p.cabinetContents === 'drawers' || p.cabinetContents === 'combo';
    const hasDoors = p.cabinetContents === 'doors' || p.cabinetContents === 'combo';
    const drawerZoneHeight = hasDrawers ? (p.cabinetContents === 'drawers' ? interiorHeight : Math.min(interiorHeight * 0.42, 330)) : 0;
    if (hasDrawers && hasDoors) horizontals.add(round(interiorTop - drawerZoneHeight));
    if (hasDoors && p.doorCount === 2) verticals.add(round(p.width / 2));
  }

  [...verticals].forEach((x, index) => parts.push(part(
    `frame:center-stile:${index + 1}`, `Face Frame Center Stile ${index + 1}`, 'frame',
    { x: x - center / 2, y, z: base + rail }, { x: center, y: frameT, z: Math.max(1, height - 2 * rail) },
    darkWood, material, { ...meta, frameRole: 'center-stile', openingBoundary: x },
  )));
  [...horizontals].forEach((z, index) => parts.push(part(
    `frame:center-rail:${index + 1}`, `Face Frame Center Rail ${index + 1}`, 'frame',
    { x: stile, y, z: z - rail / 2 }, { x: Math.max(1, p.width - 2 * stile), y: frameT, z: rail },
    darkWood, material, { ...meta, frameRole: 'center-rail', openingBoundary: z },
  )));
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
      sourcePartId: candidate.id,
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
  const width = clampNumber(source.width, 40, 3000, defaults.width);
  const height = clampNumber(source.height, 30, 3000, defaults.height);
  const depth = clampNumber(source.depth, 40, 1600, defaults.depth);
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
    drawerHeightMode: oneOf(source.drawerHeightMode, ['equal', 'graduated', 'custom_weights'] as const, defaults.drawerHeightMode),
    drawerGraduatedStep: clampNumber(source.drawerGraduatedStep, 0.05, 2, defaults.drawerGraduatedStep),
    drawerCustomWeights: numberArray(source.drawerCustomWeights, defaults.drawerCustomWeights, 0.05, 20),
    shelfPositions: numberArray(source.shelfPositions, defaults.shelfPositions, 0.03, 0.97),

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
    drawerJoineryStyle: oneOf(source.drawerJoineryStyle, ['butt', 'rabbet', 'lock_rabbet'] as const, defaults.drawerJoineryStyle),
    drawerBottomStyle: oneOf(source.drawerBottomStyle, ['captured', 'applied'] as const, defaults.drawerBottomStyle),
    drawerBottomGrooveDepth: clampNumber(source.drawerBottomGrooveDepth, 1, 10, defaults.drawerBottomGrooveDepth),
    drawerDividerCount: clampInteger(source.drawerDividerCount, 0, 4, defaults.drawerDividerCount),
    drawerDividerRows: clampInteger(source.drawerDividerRows, 0, 4, defaults.drawerDividerRows),
    drawerFrontRegistration: oneOf(source.drawerFrontRegistration, ['centered', 'flush_top', 'flush_bottom'] as const, defaults.drawerFrontRegistration),

    faceFrameStyle: oneOf(source.faceFrameStyle, ['none', 'full'] as const, defaults.faceFrameStyle),
    faceFrameThickness: clampNumber(source.faceFrameThickness, 8, 40, defaults.faceFrameThickness),
    faceFrameStileWidth: clampNumber(source.faceFrameStileWidth, 20, 120, defaults.faceFrameStileWidth),
    faceFrameRailWidth: clampNumber(source.faceFrameRailWidth, 20, 120, defaults.faceFrameRailWidth),
    faceFrameCenterStileWidth: clampNumber(source.faceFrameCenterStileWidth, 20, 120, defaults.faceFrameCenterStileWidth),

    drawerMount: oneOf(source.drawerMount, ['wood_rails', 'metal_slides'] as const, defaults.drawerMount),
    drawerSlideId: safeString(source.drawerSlideId, defaults.drawerSlideId),
    metalSlideClearancePerSide: clampNumber(source.metalSlideClearancePerSide, 3, 40, defaults.metalSlideClearancePerSide),
    metalSlideLength: clampNumber(source.metalSlideLength, 100, 2000, defaults.metalSlideLength),
    metalSlideFrontSetback: clampNumber(source.metalSlideFrontSetback, 0, 50, defaults.metalSlideFrontSetback),
    metalSlideEnvelopeHeight: clampNumber(source.metalSlideEnvelopeHeight, 10, 120, defaults.metalSlideEnvelopeHeight),
    includeMetalSlideHoles: Boolean(source.includeMetalSlideHoles),
    hardwareDrillingMode: oneOf(source.hardwareDrillingMode, ['off', 'recommended'] as const, defaults.hardwareDrillingMode),
    metalSlideCabinetHolesX: numberArray(source.metalSlideCabinetHolesX, defaults.metalSlideCabinetHolesX, 0, 2000),
    metalSlideDrawerHolesX: numberArray(source.metalSlideDrawerHolesX, defaults.metalSlideDrawerHolesX, 0, 2000),
    metalSlideCabinetHoleDiameter: clampNumber(source.metalSlideCabinetHoleDiameter, 1, 20, defaults.metalSlideCabinetHoleDiameter),
    metalSlideDrawerHoleDiameter: clampNumber(source.metalSlideDrawerHoleDiameter, 1, 20, defaults.metalSlideDrawerHoleDiameter),
    metalSlideCabinetHoleZFromDrawerBottom: clampNumber(source.metalSlideCabinetHoleZFromDrawerBottom, 0, 150, defaults.metalSlideCabinetHoleZFromDrawerBottom),
    metalSlideDrawerHoleZFromDrawerBottom: clampNumber(source.metalSlideDrawerHoleZFromDrawerBottom, 0, 150, defaults.metalSlideDrawerHoleZFromDrawerBottom),

    hingeStyle: oneOf(source.hingeStyle, ['none', 'euro_35mm'] as const, defaults.hingeStyle),
    hingeId: safeString(source.hingeId, defaults.hingeId),
    hingeCupDiameter: clampNumber(source.hingeCupDiameter, 20, 50, defaults.hingeCupDiameter),
    hingeCupDepth: clampNumber(source.hingeCupDepth, 4, 25, defaults.hingeCupDepth),
    hingeCupCenterFromDoorEdge: clampNumber(source.hingeCupCenterFromDoorEdge, 10, 40, defaults.hingeCupCenterFromDoorEdge),
    hingeDoorFixingEnabled: Boolean(source.hingeDoorFixingEnabled),
    hingeDoorFixingHoleDiameter: clampNumber(source.hingeDoorFixingHoleDiameter, 1, 10, defaults.hingeDoorFixingHoleDiameter),
    hingeDoorFixingHoleSpacing: clampNumber(source.hingeDoorFixingHoleSpacing, 10, 80, defaults.hingeDoorFixingHoleSpacing),
    hingePlateHolesEnabled: Boolean(source.hingePlateHolesEnabled),
    hingePlateHoleDiameter: clampNumber(source.hingePlateHoleDiameter, 1, 10, defaults.hingePlateHoleDiameter),
    hingePlateCenterFromFront: clampNumber(source.hingePlateCenterFromFront, 5, Math.max(5, depth - 5), defaults.hingePlateCenterFromFront),
    hingePlateHoleSpacing: clampNumber(source.hingePlateHoleSpacing, 10, 80, defaults.hingePlateHoleSpacing),
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

function safeString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.length <= 160 ? value : fallback;
}

function numberArray(value: unknown, fallback: number[], min: number, max: number) {
  if (!Array.isArray(value)) return [...fallback];
  const numbers = value
    .filter(item => typeof item === 'number' && Number.isFinite(item))
    .map(item => Math.min(max, Math.max(min, item)))
    .slice(0, 64);
  return numbers.length ? numbers : [...fallback];
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export const PRESETS: Record<string, CabinetParameters> = Object.fromEntries(
  UTILITY_STARTERS.map(starter => [starter.name, { ...starter.parameters }]),
);
