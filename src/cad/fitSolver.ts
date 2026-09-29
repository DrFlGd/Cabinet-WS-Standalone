import { stockThickness } from './cabinetModel';
import type { CabinetParameters } from './types';

export type FitTarget =
  | {
      mode: 'drawer';
      insideWidth: number;
      insideDepth: number;
    }
  | {
      mode: 'equipment';
      equipmentWidth: number;
      equipmentHeight: number;
      equipmentDepth: number;
      sideClearance: number;
      verticalClearance: number;
      depthClearance: number;
    }
  | {
      mode: 'modules';
      axis: 'width' | 'height';
      pitch: number;
      count: number;
      margin: number;
    };

export type FitSolution = {
  mode: FitTarget['mode'];
  title: string;
  feasible: boolean;
  patch: Partial<CabinetParameters>;
  requested: Record<string, number | string>;
  achieved: Record<string, number | string>;
  explanation: string[];
  warnings: string[];
};

export function solveFit(parameters: CabinetParameters, target: FitTarget): FitSolution {
  switch (target.mode) {
    case 'drawer':
      return solveDrawerFit(parameters, target);
    case 'equipment':
      return solveEquipmentFit(parameters, target);
    case 'modules':
      return solveModuleFit(parameters, target);
  }
}

function solveDrawerFit(
  p: CabinetParameters,
  target: Extract<FitTarget, { mode: 'drawer' }>,
): FitSolution {
  const t = stockThickness(p.carcassStock, p.materialThickness);
  const wall = p.drawerMaterialThickness;
  const sideClearance = p.drawerMount === 'metal_slides'
    ? Math.max(3, p.metalSlideClearancePerSide)
    : 10;
  const frameDeduction = p.faceFrameStyle === 'full' ? p.faceFrameCenterStileWidth : 0;
  const requiredBoxWidth = target.insideWidth + 2 * wall;
  const requiredOpeningWidth = requiredBoxWidth + 2 * sideClearance;
  const width = requiredOpeningWidth + 2 * t + frameDeduction;

  const backDepth = p.backStyle === 'structural_panel'
    ? t
    : p.backStyle === 'panel'
      ? stockThickness(p.backStock, p.backThickness) + p.backInset
      : 0;
  const requiredBoxDepth = target.insideDepth + 2 * wall;
  const depth = requiredBoxDepth + backDepth + 44;
  const slideLimit = p.drawerMount === 'metal_slides' ? p.metalSlideLength : Number.POSITIVE_INFINITY;
  const feasible = requiredBoxDepth <= slideLimit + 1e-6;
  const achievedBoxDepth = Math.min(requiredBoxDepth, slideLimit);
  const achievedInsideDepth = Math.max(0, achievedBoxDepth - 2 * wall);

  const warnings: string[] = [];
  if (!feasible) {
    warnings.push(
      `Requested drawer inside depth needs a ${requiredBoxDepth.toFixed(1)} mm box, but the selected slide limits the box to ${slideLimit.toFixed(1)} mm.`,
    );
  }
  if (p.faceFrameStyle === 'full') {
    warnings.push('Width solving includes the current face-frame opening deduction used by the Utility model.');
  }

  return {
    mode: 'drawer',
    title: 'Fitted drawer target',
    feasible,
    patch: feasible ? { width, depth } : { width },
    requested: {
      'Inside width': target.insideWidth,
      'Inside depth': target.insideDepth,
    },
    achieved: {
      'Cabinet width': width,
      'Cabinet depth': feasible ? depth : p.depth,
      'Drawer inside width': target.insideWidth,
      'Drawer inside depth': feasible ? target.insideDepth : achievedInsideDepth,
    },
    explanation: [
      `Drawer box width = target inside width + 2 × ${wall.toFixed(2)} mm box wall.`,
      `Opening width adds 2 × ${sideClearance.toFixed(2)} mm side clearance; cabinet width then adds both carcass sides${frameDeduction ? ' and the active face-frame opening deduction' : ''}.`,
      `Depth solving includes drawer front/back stock, cabinet rear construction, and the Utility model's front/rear depth allowances.`,
    ],
    warnings,
  };
}

function solveEquipmentFit(
  p: CabinetParameters,
  target: Extract<FitTarget, { mode: 'equipment' }>,
): FitSolution {
  const t = stockThickness(p.carcassStock, p.materialThickness);
  const base = p.mountStyle === 'floor' && p.baseStyle === 'toe_kick' ? p.toeKickHeight : 0;
  const backDepth = p.backStyle === 'structural_panel'
    ? t
    : p.backStyle === 'panel'
      ? stockThickness(p.backStock, p.backThickness) + p.backInset
      : 0;
  const frameWidth = p.faceFrameStyle === 'full' ? p.faceFrameCenterStileWidth : 0;
  const frameHeight = p.faceFrameStyle === 'full' ? p.faceFrameRailWidth : 0;

  const requiredClearWidth = target.equipmentWidth + 2 * target.sideClearance;
  const requiredClearHeight = target.equipmentHeight + 2 * target.verticalClearance;
  const requiredClearDepth = target.equipmentDepth + target.depthClearance;

  const width = requiredClearWidth + 2 * t + frameWidth;
  const height = requiredClearHeight + base + 2 * t + frameHeight;
  const depth = requiredClearDepth + backDepth + 20;

  return {
    mode: 'equipment',
    title: 'Equipment stand target',
    feasible: true,
    patch: { width, height, depth },
    requested: {
      'Equipment width': target.equipmentWidth,
      'Equipment height': target.equipmentHeight,
      'Equipment depth': target.equipmentDepth,
      'Side clearance': target.sideClearance,
      'Vertical clearance': target.verticalClearance,
      'Depth clearance': target.depthClearance,
    },
    achieved: {
      'Cabinet width': width,
      'Cabinet height': height,
      'Cabinet depth': depth,
      'Clear width': requiredClearWidth,
      'Clear height': requiredClearHeight,
      'Clear depth': requiredClearDepth,
    },
    explanation: [
      'Outside width is solved from the target equipment envelope, side clearances, carcass sides, and active face-frame opening deduction.',
      'Outside height adds vertical clearances, carcass top/bottom, floor-base height when present, and active face-frame rail deduction.',
      'Outside depth adds requested rear/front clearance, current rear construction, and the Utility model depth allowance.',
    ],
    warnings: p.layoutMode === 'sections'
      ? ['Envelope is solved globally; existing fixed section dimensions are revalidated by Design Health after apply.']
      : [],
  };
}

function solveModuleFit(
  p: CabinetParameters,
  target: Extract<FitTarget, { mode: 'modules' }>,
): FitSolution {
  const t = stockThickness(p.carcassStock, p.materialThickness);
  const count = Math.max(1, Math.round(target.count));
  const pitch = Math.max(1, target.pitch);
  const margin = Math.max(0, target.margin);
  const clearSpan = count * pitch + 2 * margin;

  if (target.axis === 'width') {
    const frame = p.faceFrameStyle === 'full' ? p.faceFrameCenterStileWidth : 0;
    const width = clearSpan + 2 * t + frame;
    return {
      mode: 'modules',
      title: 'Module pitch/count target',
      feasible: true,
      patch: { width },
      requested: { Axis: 'width', Pitch: pitch, Count: count, Margin: margin },
      achieved: { 'Cabinet width': width, 'Clear module span': clearSpan, 'Resolved pitch': pitch },
      explanation: [
        `Clear width = ${count} × ${pitch.toFixed(2)} mm pitch + 2 × ${margin.toFixed(2)} mm margin.`,
        `Outside width adds both carcass sides${frame ? ' and the active face-frame opening deduction' : ''}.`,
      ],
      warnings: [],
    };
  }

  const base = p.mountStyle === 'floor' && p.baseStyle === 'toe_kick' ? p.toeKickHeight : 0;
  const frame = p.faceFrameStyle === 'full' ? p.faceFrameRailWidth : 0;
  const height = clearSpan + base + 2 * t + frame;
  return {
    mode: 'modules',
    title: 'Module pitch/count target',
    feasible: true,
    patch: { height },
    requested: { Axis: 'height', Pitch: pitch, Count: count, Margin: margin },
    achieved: { 'Cabinet height': height, 'Clear module span': clearSpan, 'Resolved pitch': pitch },
    explanation: [
      `Clear height = ${count} × ${pitch.toFixed(2)} mm pitch + 2 × ${margin.toFixed(2)} mm margin.`,
      `Outside height adds carcass top/bottom, the current floor base, and active face-frame rail deduction.`,
    ],
    warnings: [],
  };
}
