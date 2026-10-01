import opencascade from 'replicad-opencascadejs';
import opencascadeWasm from 'replicad-opencascadejs/wasm?url';
import {
  exportSTEP,
  setOC,
} from 'replicad';
import type { CabinetDocument, CadPart } from '../types';
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
import { buildExactShape, safeDelete } from './exactShape';

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
  const diagnostics: KernelDiagnostic[] = [];
  const shapeEntries: { shape: any; name: string; color: string }[] = [];
  try {
    await started;
    const requested = request.bodyIds?.length ? new Set(request.bodyIds) : null;

    for (const part of request.payload.document.parts) {
      if (part.category === 'hardware' || !part.visible || (requested && !requested.has(part.id))) continue;
      let shape: any = null;
      try {
        if (!isKernelEligiblePart(part) || !Object.values(part.size).every(Number.isFinite)) throw new Error('Invalid body dimensions');
        shape = buildExactShape(part, request.payload.graph.partFeatures[part.id] ?? [], diagnostics);
        shape = shape.translate([part.position.x, part.position.y, part.position.z]);
        shapeEntries.push({ shape, name: part.id, color: part.color });
        shape = null; // Ownership transfers to shapeEntries.
      } catch (error) {
        safeDelete(shape);
        diagnostics.push({
          severity: 'error',
          code: 'step-part-failed',
          partId: part.id,
          message: `Could not build ${part.name} for STEP: ${errorMessage(error)}`,
        });
      }
      await yieldToMessages();
    }

    if (requested) {
      for (const id of requested) {
        if (!shapeEntries.some(entry => entry.name === id)) diagnostics.push({
          severity: 'error', code: 'step-body-missing', partId: id,
          message: `Requested STEP body is unavailable: ${id}`,
        });
      }
    }
    const incomplete = diagnostics.filter(item => item.severity === 'error' || item.code === 'feature-cut-failed');
    if (incomplete.length) {
      throw new Error('Incomplete STEP assembly: ' + incomplete.map(item => item.message).join('; '));
    }
    if (!shapeEntries.length) {
      throw new Error('No exact bodies were available for STEP export.');
    }

    const blob = exportSTEP(shapeEntries, { unit: 'MM', modelUnit: 'MM' });
    const bytes = await blob.arrayBuffer();
    scope.postMessage(
      { type: 'step-exported', requestId: request.requestId, bytes, diagnostics },
      [bytes],
    );
  } catch (error) {
    scope.postMessage({
      type: 'failed',
      requestId: request.requestId,
      message: errorMessage(error),
      diagnostics: [...diagnostics, {
        severity: 'error',
        code: 'step-export-failed',
        message: errorMessage(error),
      }],
    });
  } finally {
    shapeEntries.forEach(entry => safeDelete(entry.shape));
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

function collectSemanticFaces(part: CadPart, shape: any) {
  const faces = shape.faces as any[];
  return faces.map(face => {
    try {
      const centerVector = face.center;
      const normalVector = face.normalAt();
      const center = centerVector.toTuple() as [number, number, number];
      const normal = normalVector.normalize().toTuple() as [number, number, number];
      const rawFaceId = Number(face.hashCode);
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
  return edges.map(edge => {
    try {
      const startVector = edge.startPoint;
      const endVector = edge.endPoint;
      const start = startVector.toTuple() as [number, number, number];
      const end = endVector.toTuple() as [number, number, number];
      const rawEdgeId = Number(edge.hashCode);
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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function yieldToMessages() {
  return new Promise<void>(resolve => setTimeout(resolve, 0));
}

