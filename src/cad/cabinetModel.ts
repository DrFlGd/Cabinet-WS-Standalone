import type { CabinetDocument, CabinetParameters, CadPart, StockChoice } from './types';
import type { DisplayUnits } from './units';
import { makeUtilityDefaults, UTILITY_STARTERS } from './utilityStarters';

export const DEFAULT_PARAMETERS: CabinetParameters = makeUtilityDefaults();

const wood = '#b98b57';
const lightWood = '#d0aa79';
const darkWood = '#957047';
const backWood = '#a9825c';
const hardwareColor = '#46545a';
const worktopColor = '#d8b079';

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
): CadPart {
  return { id, name, category, position, size, color, material, visible: true, metadata };
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
        toeKickNotch: p.sideToeKickCutout === 'left' || p.sideToeKickCutout === 'both',
      },
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
        toeKickNotch: p.sideToeKickCutout === 'right' || p.sideToeKickCutout === 'both',
      },
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

  const interiorBottom = base + t;
  const interiorTop = H - t;
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

  if (hasDoors && p.shelfCount > 0 && doorZoneHeight > t) {
    const backDepth = p.backStyle === 'structural_panel'
      ? t
      : p.backStyle === 'panel'
        ? appliedBackThickness + p.backInset
        : 0;
    const shelfDepth = Math.max(20, D - backDepth - 16);
    for (let i = 1; i <= p.shelfCount; i += 1) {
      const z = interiorBottom + (doorZoneHeight * i) / (p.shelfCount + 1) - t / 2;
      parts.push(
        part(
          `shelf:${i}`,
          `${p.shelfStyle === 'adjustable' ? 'Adjustable' : 'Fixed'} Shelf ${i}`,
          'shelf',
          { x: t + 2, y: 8, z },
          { x: W - 2 * t - 4, y: shelfDepth, z: t },
          lightWood,
          carcassMaterial,
          { shelfStyle: p.shelfStyle, adjustable: p.shelfStyle === 'adjustable', ...carcassMeta },
        ),
      );
    }
  }

  const openingWidth = Math.max(1, W - 2 * t);
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
    }
  }

  if (hasDoors && p.doorCount > 0 && doorZoneHeight > 0) {
    const gap = p.doorGap;
    const availableWidth = openingWidth - 2 * p.frontEdgeReveal - gap * (p.doorCount - 1);
    const doorWidth = Math.max(1, availableWidth / p.doorCount);
    const doorHeight = Math.max(1, doorZoneHeight - 2 * p.frontEdgeReveal);
    const frontY = p.frontMountStyle === 'overlay' ? -p.doorThickness : 0;

    for (let i = 0; i < p.doorCount; i += 1) {
      parts.push(
        part(
          `door:${i + 1}`,
          `Door ${i + 1}`,
          'front',
          {
            x: t + p.frontEdgeReveal + i * (doorWidth + gap),
            y: frontY,
            z: interiorBottom + p.frontEdgeReveal,
          },
          { x: doorWidth, y: p.doorThickness, z: doorHeight },
          lightWood,
          `Door stock (${round(p.doorThickness)} mm)`,
          { door: i + 1, frontMountStyle: p.frontMountStyle },
        ),
      );
    }
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

export function sanitizeParameters(input: Partial<CabinetParameters>): CabinetParameters {
  const defaults = makeUtilityDefaults();
  const source = { ...defaults, ...input };

  const carcassStock = oneOf(source.carcassStock, stockChoices, defaults.carcassStock);
  const backStock = oneOf(source.backStock, stockChoices, defaults.backStock);
  const width = clampNumber(source.width, 300, 2400, defaults.width);
  const height = clampNumber(source.height, 300, 3000, defaults.height);
  const depth = clampNumber(source.depth, 200, 1200, defaults.depth);

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
