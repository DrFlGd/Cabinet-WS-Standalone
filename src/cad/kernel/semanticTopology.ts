import type { CadPart } from '../types';
import type { SemanticEdge, SemanticFace } from './types';

const EPSILON = 1.5;

export function semanticFaceId(
  part: CadPart,
  rawFaceId: number,
  center: [number, number, number],
  normal: [number, number, number],
): SemanticFace {
  const role = classifyFaceRole(part, center, normal);
  return {
    id: `face:${part.id}:${role}`,
    partId: part.id,
    rawFaceId,
    role,
    center,
    normal,
  };
}

export function semanticEdgeId(
  part: CadPart,
  rawEdgeId: number,
  start: [number, number, number],
  end: [number, number, number],
): SemanticEdge {
  const role = classifyEdgeRole(part, start, end);
  return {
    id: `edge:${part.id}:${role}`,
    partId: part.id,
    rawEdgeId,
    role,
    start,
    end,
  };
}

export function classifyFaceRole(
  part: CadPart,
  center: [number, number, number],
  normal: [number, number, number],
) {
  const [nx, ny, nz] = normal;
  const abs = [Math.abs(nx), Math.abs(ny), Math.abs(nz)];
  const dominant = abs.indexOf(Math.max(...abs));
  const axis = dominant === 0 ? 'x' : dominant === 1 ? 'y' : 'z';
  const positive = normal[dominant] >= 0;

  if (axis === 'y') return positive ? 'back' : 'front';
  if (axis === 'z') return positive ? 'top' : 'bottom';

  if (part.id === 'carcass:left') return positive ? 'inside' : 'outside';
  if (part.id === 'carcass:right') return positive ? 'outside' : 'inside';

  if (part.category === 'divider') {
    return positive ? 'right' : 'left';
  }

  const xMid = part.size.x / 2;
  if (Math.abs(center[0] - xMid) < EPSILON && abs[0] < 0.7) {
    return positive ? 'side-positive' : 'side-negative';
  }
  return positive ? 'right' : 'left';
}

export function classifyEdgeRole(
  part: CadPart,
  start: [number, number, number],
  end: [number, number, number],
) {
  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  ];

  const nearMinX = near(midpoint[0], 0);
  const nearMaxX = near(midpoint[0], part.size.x);
  const nearMinY = near(midpoint[1], 0);
  const nearMaxY = near(midpoint[1], part.size.y);
  const nearMinZ = near(midpoint[2], 0);
  const nearMaxZ = near(midpoint[2], part.size.z);

  if (nearMinY && nearMaxZ) return 'front-top';
  if (nearMinY && nearMinZ) return 'front-bottom';
  if (nearMaxY && nearMaxZ) return 'back-top';
  if (nearMaxY && nearMinZ) return 'back-bottom';

  if (nearMinX && nearMinY) return sideAware(part, 'outside-front', 'inside-front');
  if (nearMaxX && nearMinY) return sideAware(part, 'inside-front', 'outside-front');
  if (nearMinX && nearMaxY) return sideAware(part, 'outside-back', 'inside-back');
  if (nearMaxX && nearMaxY) return sideAware(part, 'inside-back', 'outside-back');

  if (nearMinX && nearMaxZ) return sideAware(part, 'outside-top', 'inside-top');
  if (nearMaxX && nearMaxZ) return sideAware(part, 'inside-top', 'outside-top');
  if (nearMinX && nearMinZ) return sideAware(part, 'outside-bottom', 'inside-bottom');
  if (nearMaxX && nearMinZ) return sideAware(part, 'inside-bottom', 'outside-bottom');

  return `edge-${rawCoordinateRole(midpoint, part)}`;
}

function sideAware(part: CadPart, leftRole: string, rightRole: string) {
  if (part.id === 'carcass:right') return leftRole;
  if (part.id === 'carcass:left') return rightRole;
  return leftRole.replace('outside', 'left').replace('inside', 'right');
}

function rawCoordinateRole(point: [number, number, number], part: CadPart) {
  const normalized = [
    part.size.x ? point[0] / part.size.x : 0,
    part.size.y ? point[1] / part.size.y : 0,
    part.size.z ? point[2] / part.size.z : 0,
  ].map(value => Math.round(value * 20) / 20);
  return normalized.join('-').replaceAll('.', '_');
}

function near(value: number, target: number) {
  return Math.abs(value - target) <= EPSILON;
}
