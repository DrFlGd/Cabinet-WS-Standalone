import type { CabinetDocument, CabinetParameters, CadPart } from './types';
import type { DisplayUnits } from './units';

export const DEFAULT_PARAMETERS: CabinetParameters = {
  width: 762,
  height: 876,
  depth: 610,
  materialThickness: 19.05,
  backThickness: 6.35,
  shelfCount: 1,
  doorCount: 2,
  drawerCount: 2,
  toeKickHeight: 102,
  toeKickDepth: 76,
  faceGap: 3,
};

const wood = '#b98b57';
const lightWood = '#d0aa79';
const darkWood = '#957047';
const backWood = '#a9825c';

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

export function buildCabinetDocument(
  parameters: CabinetParameters,
  name = 'Base Cabinet Prototype',
  displayUnits: DisplayUnits = 'mm',
): CabinetDocument {
  const p = sanitizeParameters(parameters);
  const { width: W, height: H, depth: D, materialThickness: t, backThickness: bt } = p;
  const parts: CadPart[] = [];

  parts.push(
    part('carcass:left', 'Left Side', 'carcass', { x: 0, y: 0, z: 0 }, { x: t, y: D, z: H }),
    part('carcass:right', 'Right Side', 'carcass', { x: W - t, y: 0, z: 0 }, { x: t, y: D, z: H }),
    part('carcass:bottom', 'Bottom', 'carcass', { x: t, y: 0, z: p.toeKickHeight }, { x: W - 2 * t, y: D, z: t }),
    part('carcass:top-front', 'Top Front Stretcher', 'carcass', { x: t, y: 0, z: H - t }, { x: W - 2 * t, y: 90, z: t }, darkWood),
    part('carcass:top-rear', 'Top Rear Stretcher', 'carcass', { x: t, y: D - 90, z: H - t }, { x: W - 2 * t, y: 90, z: t }, darkWood),
    part('back', 'Back Panel', 'back', { x: t, y: D - bt, z: p.toeKickHeight + t }, { x: W - 2 * t, y: bt, z: H - p.toeKickHeight - 2 * t }, backWood, 'Back stock'),
    part('toe-kick', 'Toe Kick', 'carcass', { x: t, y: p.toeKickDepth, z: 0 }, { x: W - 2 * t, y: t, z: p.toeKickHeight }, darkWood),
  );

  const interiorBottom = p.toeKickHeight + t;
  const interiorTop = H - t;
  const interiorHeight = interiorTop - interiorBottom;

  for (let i = 1; i <= p.shelfCount; i += 1) {
    const z = interiorBottom + (interiorHeight * i) / (p.shelfCount + 1) - t / 2;
    parts.push(
      part(
        `shelf:${i}`,
        `Adjustable Shelf ${i}`,
        'shelf',
        { x: t + 2, y: 8, z },
        { x: W - 2 * t - 4, y: D - bt - 16, z: t },
        lightWood,
        'Shelf stock',
        { adjustable: true },
      ),
    );
  }

  const openingWidth = W - 2 * t;
  const frontZoneHeight = Math.min(interiorHeight * 0.42, 330);
  const drawerRows = Math.max(0, p.drawerCount);
  if (drawerRows > 0) {
    const rowHeight = (frontZoneHeight - p.faceGap * Math.max(0, drawerRows - 1)) / drawerRows;
    for (let i = 0; i < drawerRows; i += 1) {
      const z = interiorTop - (i + 1) * rowHeight - i * p.faceGap;
      parts.push(
        part(
          `drawer:${i + 1}:front`,
          `Drawer Front ${i + 1}`,
          'front',
          { x: t + p.faceGap, y: -t, z },
          { x: openingWidth - 2 * p.faceGap, y: t, z: rowHeight - p.faceGap },
          lightWood,
          'Front stock',
          { drawer: i + 1 },
        ),
      );
    }
  }

  const doorTop = interiorTop - (drawerRows ? frontZoneHeight + p.faceGap : 0);
  const doorBottom = interiorBottom + p.faceGap;
  const doorHeight = Math.max(80, doorTop - doorBottom - p.faceGap);
  const doors = Math.max(0, p.doorCount);
  if (doors > 0) {
    const totalGap = p.faceGap * (doors + 1);
    const doorWidth = (openingWidth - totalGap) / doors;
    for (let i = 0; i < doors; i += 1) {
      parts.push(
        part(
          `door:${i + 1}`,
          `Door ${i + 1}`,
          'front',
          { x: t + p.faceGap + i * (doorWidth + p.faceGap), y: -t, z: doorBottom },
          { x: doorWidth, y: t, z: doorHeight },
          lightWood,
          'Front stock',
          { door: i + 1 },
        ),
      );
    }
  }

  return {
    version: 2,
    id: 'cabinet-root',
    name,
    units: 'mm',
    displayUnits,
    parameters: p,
    parts,
  };
}

export function sanitizeParameters(input: Partial<CabinetParameters>): CabinetParameters {
  const source = { ...DEFAULT_PARAMETERS, ...input };
  return {
    width: clamp(source.width, 300, 2400),
    height: clamp(source.height, 300, 3000),
    depth: clamp(source.depth, 200, 1200),
    materialThickness: clamp(source.materialThickness, 6, 50),
    backThickness: clamp(source.backThickness, 2, 25),
    shelfCount: Math.round(clamp(source.shelfCount, 0, 12)),
    doorCount: Math.round(clamp(source.doorCount, 0, 4)),
    drawerCount: Math.round(clamp(source.drawerCount, 0, 8)),
    toeKickHeight: clamp(source.toeKickHeight, 0, Math.max(0, source.height * 0.35)),
    toeKickDepth: clamp(source.toeKickDepth, 0, Math.max(0, source.depth - 40)),
    faceGap: clamp(source.faceGap, 1, 12),
  };
}

function clamp(value: number, min: number, max: number) {
  const finite = Number.isFinite(value) ? value : min;
  return Math.min(max, Math.max(min, finite));
}

export const PRESETS: Record<string, CabinetParameters> = {
  'Base 30': { ...DEFAULT_PARAMETERS },
  'Base 36': { ...DEFAULT_PARAMETERS, width: 914.4, doorCount: 2, drawerCount: 1 },
  'Wall 30': {
    ...DEFAULT_PARAMETERS,
    width: 762,
    height: 762,
    depth: 330,
    toeKickHeight: 0,
    toeKickDepth: 0,
    drawerCount: 0,
    doorCount: 2,
    shelfCount: 2,
  },
  'Tall Utility': {
    ...DEFAULT_PARAMETERS,
    width: 762,
    height: 2134,
    depth: 610,
    toeKickHeight: 102,
    drawerCount: 0,
    doorCount: 2,
    shelfCount: 5,
  },
};
