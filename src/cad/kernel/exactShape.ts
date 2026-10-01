import { draw, makeBox, makeCylinder } from 'replicad';
import type { CadPart, Vec3 } from '../types';
import type { CadFeature, KernelDiagnostic } from './types';

export function buildExactShape(
  part: CadPart,
  features: CadFeature[],
  diagnostics: KernelDiagnostic[],
) {
  let shape = buildBlank(part);

  for (const feature of features) {
    if (
      feature.kind === 'panel-blank' ||
      feature.kind === 'hardware-reference' ||
      feature.kind === 'assembly-transform' ||
      feature.kind === 'edge-treatment' ||
      feature.kind === 'chamfer' ||
      (feature.kind === 'pocket' && feature.semanticRole === 'toe-kick')
    ) {
      continue;
    }

    try {
      const tools = cuttingTools(part, feature);
      try {
        for (const tool of tools) {
          const next = shape.cut(tool);
          safeDelete(shape);
          shape = next;
        }
      } finally {
        tools.forEach(safeDelete);
      }
    } catch (error) {
      diagnostics.push({
        severity: 'warning',
        code: 'feature-cut-failed',
        partId: part.id,
        featureId: feature.id,
        message: `Skipped exact ${feature.label}: ${errorMessage(error)}`,
      });
    }
  }

  return shape;
}

function buildBlank(part: CadPart) {
  if (!part.geometry || part.geometry.kind !== 'extruded-profile' || part.geometry.outline.length < 3) {
    return makeBox([0, 0, 0], [part.size.x, part.size.y, part.size.z]);
  }

  const first = part.geometry.outline[0];
  let profile: any = draw().movePointerTo([first.u, first.v]);
  for (const point of part.geometry.outline.slice(1)) {
    profile = profile.lineTo([point.u, point.v]);
  }
  profile = profile.close();

  const plane = part.geometry.axis === 'x' ? 'YZ' : 'XY';
  const depth = part.geometry.axis === 'x' ? part.size.x : part.size.z;
  return profile.sketchOnPlane(plane).extrude(depth);
}

function cuttingTools(part: CadPart, feature: CadFeature) {
  if (feature.kind === 'hole-pattern') {
    const centersU = numberList(feature.parameters.centersU);
    const centersV = numberList(feature.parameters.centersV);
    const radii = numberList(feature.parameters.radii);
    const count = Math.min(centersU.length, centersV.length, radii.length);
    return Array.from({ length: count }, (_, index) =>
      throughCylinder(part, feature.axis ?? 'z', centersU[index], centersV[index], radii[index]),
    );
  }

  if (feature.kind === 'hole') {
    if (feature.size && feature.position) {
      return [featureCylinder(feature.position, feature.size, feature.axis ?? inferSmallAxis(feature.size))];
    }
    const radius = numberValue(feature.parameters.radius, 1);
    const position = feature.position ?? { x: 0, y: 0, z: 0 };
    if (feature.axis === 'x') return [makeCylinder(radius, part.size.x + 2, [-1, position.y, position.z], [1, 0, 0])];
    if (feature.axis === 'y') return [makeCylinder(radius, part.size.y + 2, [position.x, -1, position.z], [0, 1, 0])];
    return [makeCylinder(radius, part.size.z + 2, [position.x, position.y, -1], [0, 0, 1])];
  }

  if (feature.kind === 'pocket' || feature.kind === 'dado' || feature.kind === 'rabbet' || feature.kind === 'groove') {
    if (feature.size && feature.position) {
      return [boxTool(feature.position, feature.size)];
    }

    if (feature.position && feature.axis) {
      const width = numberValue(feature.parameters.width, 1);
      const height = numberValue(feature.parameters.height, 1);
      if (feature.axis === 'x') {
        return [makeBox(
          [-1, feature.position.y, feature.position.z],
          [part.size.x + 1, feature.position.y + width, feature.position.z + height],
        )];
      }
      if (feature.axis === 'z') {
        return [makeBox(
          [feature.position.x, feature.position.y, -1],
          [feature.position.x + width, feature.position.y + height, part.size.z + 1],
        )];
      }
    }
  }

  return [];
}

function boxTool(position: Vec3, size: Vec3) {
  return makeBox(
    [position.x, position.y, position.z],
    [position.x + size.x, position.y + size.y, position.z + size.z],
  );
}

function throughCylinder(
  part: CadPart,
  axis: 'x' | 'y' | 'z',
  u: number,
  v: number,
  radius: number,
) {
  if (axis === 'x') return makeCylinder(radius, part.size.x + 2, [-1, u, v], [1, 0, 0]);
  if (axis === 'y') return makeCylinder(radius, part.size.y + 2, [u, -1, v], [0, 1, 0]);
  return makeCylinder(radius, part.size.z + 2, [u, v, -1], [0, 0, 1]);
}

function featureCylinder(position: Vec3, size: Vec3, axis: 'x' | 'y' | 'z') {
  if (axis === 'x') {
    return makeCylinder(
      Math.max(0.1, Math.min(size.y, size.z) / 2),
      size.x,
      [position.x, position.y + size.y / 2, position.z + size.z / 2],
      [1, 0, 0],
    );
  }
  if (axis === 'y') {
    return makeCylinder(
      Math.max(0.1, Math.min(size.x, size.z) / 2),
      size.y,
      [position.x + size.x / 2, position.y, position.z + size.z / 2],
      [0, 1, 0],
    );
  }
  return makeCylinder(
    Math.max(0.1, Math.min(size.x, size.y) / 2),
    size.z,
    [position.x + size.x / 2, position.y + size.y / 2, position.z],
    [0, 0, 1],
  );
}

function inferSmallAxis(size: Vec3): 'x' | 'y' | 'z' {
  if (size.x <= size.y && size.x <= size.z) return 'x';
  if (size.y <= size.x && size.y <= size.z) return 'y';
  return 'z';
}

function numberList(value: unknown) {
  return Array.isArray(value)
    ? value.filter(item => typeof item === 'number' && Number.isFinite(item)) as number[]
    : [];
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function safeDelete(value: any) {
  try {
    value?.delete?.();
  } catch {
    // OpenCascade cleanup should never mask a modeling result.
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
