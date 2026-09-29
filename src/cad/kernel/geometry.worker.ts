import opencascade from 'replicad-opencascadejs';
import opencascadeWasm from 'replicad-opencascadejs/wasm?url';
import {
  draw,
  exportSTEP,
  makeBox,
  makeCylinder,
  setOC,
} from 'replicad';
import type { CabinetDocument, CadPart, Vec3 } from '../types';
import { semanticEdgeId, semanticFaceId } from './semanticTopology';
import type {
  CadFeature,
  KernelDiagnostic,
  KernelRequest,
  KernelResponse,
  KernelRebuildPayload,
  KernelResult,
  TessellatedPart,
} from './types';
import { isKernelEligiblePart } from './types';

type ReplicadFaceGroup = { start: number; count: number; faceId: number };
type ReplicadEdgeGroup = { start: number; count: number; edgeId: number };

type WorkerScope = {
  onmessage: ((event: MessageEvent<KernelRequest>) => void) | null;
  postMessage(message: KernelResponse, transfer?: Transferable[]): void;
};

const scope = self as unknown as WorkerScope;
const meshCache = new Map<string, TessellatedPart>();
let latestRebuildRequestId = 0;
let loaded = false;

const started = (async () => {
  if (loaded) return;
  const OC = await opencascade({
    locateFile: () => opencascadeWasm,
  });
  setOC(OC);
  loaded = true;
})();

scope.onmessage = event => {
  const request = event.data;
  if (request.type === 'rebuild') {
    latestRebuildRequestId = Math.max(latestRebuildRequestId, request.requestId);
    void handleRebuild(request);
    return;
  }
  void handleStepExport(request);
};

async function handleRebuild(request: Extract<KernelRequest, { type: 'rebuild' }>) {
  try {
    await started;
    const result = await rebuild(request.requestId, request.payload);
    if (!result || request.requestId !== latestRebuildRequestId) return;
    scope.postMessage({ type: 'rebuilt', requestId: request.requestId, result });
  } catch (error) {
    if (request.requestId !== latestRebuildRequestId) return;
    scope.postMessage({
      type: 'failed',
      requestId: request.requestId,
      message: errorMessage(error),
      diagnostics: [{
        severity: 'error',
        code: 'kernel-rebuild-failed',
        message: errorMessage(error),
      }],
    });
  }
}

async function handleStepExport(request: Extract<KernelRequest, { type: 'export-step' }>) {
  try {
    await started;
    const diagnostics: KernelDiagnostic[] = [];
    const requested = request.bodyIds?.length ? new Set(request.bodyIds) : null;
    const shapeEntries: { shape: any; name: string; color: string }[] = [];

    for (const part of request.payload.document.parts) {
      if (!isKernelEligiblePart(part) || (requested && !requested.has(part.id))) continue;
      try {
        let shape = buildExactShape(part, request.payload.graph.partFeatures[part.id] ?? [], diagnostics);
        shape = shape.translate([part.position.x, part.position.y, part.position.z]);
        shapeEntries.push({ shape, name: part.id, color: part.color });
      } catch (error) {
        diagnostics.push({
          severity: 'error',
          code: 'step-part-failed',
          partId: part.id,
          message: `Could not build ${part.name} for STEP: ${errorMessage(error)}`,
        });
      }
      await yieldToMessages();
    }

    if (!shapeEntries.length) {
      throw new Error('No exact bodies were available for STEP export.');
    }

    const blob = exportSTEP(shapeEntries, { unit: 'MM', modelUnit: 'MM' });
    const bytes = await blob.arrayBuffer();
    shapeEntries.forEach(entry => safeDelete(entry.shape));
    scope.postMessage(
      { type: 'step-exported', requestId: request.requestId, bytes, diagnostics },
      [bytes],
    );
  } catch (error) {
    scope.postMessage({
      type: 'failed',
      requestId: request.requestId,
      message: errorMessage(error),
      diagnostics: [{
        severity: 'error',
        code: 'step-export-failed',
        message: errorMessage(error),
      }],
    });
  }
}

async function rebuild(requestId: number, payload: KernelRebuildPayload): Promise<KernelResult | null> {
  const startedAt = performance.now();
  const dirty = new Set(payload.dirtyPartIds);
  const parts: TessellatedPart[] = [];
  const diagnostics: KernelDiagnostic[] = [];
  let rebuiltPartCount = 0;
  let cacheHitCount = 0;

  for (const part of payload.document.parts) {
    if (requestId !== latestRebuildRequestId) return null;
    if (!isKernelEligiblePart(part)) continue;

    const features = payload.graph.partFeatures[part.id] ?? [];
    const signature = partSignature(part, features);
    const cached = !dirty.has(part.id) ? meshCache.get(signature) : undefined;

    if (cached) {
      cacheHitCount += 1;
      parts.push(cached);
    } else {
      try {
        const exact = tessellatePart(part, features, diagnostics, signature);
        meshCache.set(signature, exact);
        parts.push(exact);
        rebuiltPartCount += 1;
      } catch (error) {
        diagnostics.push({
          severity: 'error',
          code: 'part-rebuild-failed',
          partId: part.id,
          message: `Exact rebuild failed for ${part.name}; preview geometry remains available. ${errorMessage(error)}`,
        });
      }
    }

    await yieldToMessages();
  }

  return {
    requestId,
    parts,
    diagnostics,
    stats: {
      durationMs: Math.round((performance.now() - startedAt) * 10) / 10,
      bodyCount: parts.length,
      featureCount: payload.graph.featureCount,
      rebuiltPartCount,
      cacheHitCount,
    },
  };
}

function tessellatePart(
  part: CadPart,
  features: CadFeature[],
  diagnostics: KernelDiagnostic[],
  signature: string,
): TessellatedPart {
  const shape = buildExactShape(part, features, diagnostics);
  try {
    const faces = shape.mesh({ tolerance: 0.15, angularTolerance: 0.2 });
    const edges = shape.meshEdges({ tolerance: 0.15, angularTolerance: 0.2 });
    const semanticFaces = collectSemanticFaces(part, shape);
    const semanticEdges = collectSemanticEdges(part, shape);

    const faceMap = new Map(semanticFaces.map(face => [face.rawFaceId, face.id]));
    const edgeMap = new Map(semanticEdges.map(edge => [edge.rawEdgeId, edge.id]));

    return {
      partId: part.id,
      signature,
      vertices: faces.vertices,
      normals: faces.normals,
      triangles: faces.triangles,
      faceGroups: faces.faceGroups.map((group: ReplicadFaceGroup) => ({
        ...group,
        rawFaceId: group.faceId,
        semanticId: faceMap.get(group.faceId) ?? `face:${part.id}:kernel-${group.faceId}`,
      })),
      lines: edges.lines,
      edgeGroups: edges.edgeGroups.map((group: ReplicadEdgeGroup) => ({
        ...group,
        rawEdgeId: group.edgeId,
        semanticId: edgeMap.get(group.edgeId) ?? `edge:${part.id}:kernel-${group.edgeId}`,
      })),
      semanticFaces,
      semanticEdges,
    };
  } finally {
    safeDelete(shape);
  }
}

function buildExactShape(
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
      for (const tool of tools) {
        const next = shape.cut(tool);
        safeDelete(shape);
        safeDelete(tool);
        shape = next;
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

  if ((feature.kind === 'pocket' || feature.kind === 'dado' || feature.kind === 'rabbet' || feature.kind === 'groove')) {
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

function collectSemanticFaces(part: CadPart, shape: any) {
  const faces = shape.faces as any[];
  return faces.map((face, rawFaceId) => {
    try {
      const centerVector = face.center;
      const normalVector = face.normalAt();
      const center = centerVector.toTuple() as [number, number, number];
      const normal = normalVector.normalize().toTuple() as [number, number, number];
      safeDelete(centerVector);
      safeDelete(normalVector);
      return semanticFaceId(part, rawFaceId, center, normal);
    } finally {
      safeDelete(face);
    }
  });
}

function collectSemanticEdges(part: CadPart, shape: any) {
  const edges = shape.edges as any[];
  return edges.map((edge, rawEdgeId) => {
    try {
      const startVector = edge.startPoint;
      const endVector = edge.endPoint;
      const start = startVector.toTuple() as [number, number, number];
      const end = endVector.toTuple() as [number, number, number];
      safeDelete(startVector);
      safeDelete(endVector);
      return semanticEdgeId(part, rawEdgeId, start, end);
    } finally {
      safeDelete(edge);
    }
  });
}

function partSignature(part: CadPart, features: CadFeature[]) {
  return JSON.stringify({
    id: part.id,
    size: part.size,
    geometry: part.geometry,
    features,
  });
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

function safeDelete(value: any) {
  try {
    value?.delete?.();
  } catch {
    // OpenCascade cleanup should never mask a modeling result.
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function yieldToMessages() {
  return new Promise<void>(resolve => setTimeout(resolve, 0));
}
