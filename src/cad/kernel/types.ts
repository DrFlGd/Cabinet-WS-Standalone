import type { CabinetDocument, CadPart, Vec3 } from '../types';

export type CadFeatureKind =
  | 'panel-blank'
  | 'dado'
  | 'rabbet'
  | 'groove'
  | 'pocket'
  | 'hole'
  | 'hole-pattern'
  | 'chamfer'
  | 'edge-treatment'
  | 'hardware-reference'
  | 'assembly-transform';

export type CadFeature = {
  id: string;
  partId: string;
  kind: CadFeatureKind;
  label: string;
  parameters: Record<string, string | number | boolean | number[]>;
  position?: Vec3;
  size?: Vec3;
  axis?: 'x' | 'y' | 'z';
  semanticRole?: string;
};

export type FeatureGraph = {
  documentId: string;
  partFeatures: Record<string, CadFeature[]>;
  featureCount: number;
};

export type SemanticFace = {
  id: string;
  partId: string;
  rawFaceId: number;
  role: string;
  center: [number, number, number];
  normal: [number, number, number];
};

export type SemanticEdge = {
  id: string;
  partId: string;
  rawEdgeId: number;
  role: string;
  start: [number, number, number];
  end: [number, number, number];
};

export type KernelFaceGroup = {
  start: number;
  count: number;
  rawFaceId: number;
  semanticId: string;
};

export type KernelEdgeGroup = {
  start: number;
  count: number;
  rawEdgeId: number;
  semanticId: string;
};

export type TessellatedPart = {
  partId: string;
  signature: string;
  vertices: number[];
  normals: number[];
  triangles: number[];
  faceGroups: KernelFaceGroup[];
  lines: number[];
  edgeGroups: KernelEdgeGroup[];
  semanticFaces: SemanticFace[];
  semanticEdges: SemanticEdge[];
};

export type KernelDiagnostic = {
  severity: 'info' | 'warning' | 'error';
  code: string;
  message: string;
  partId?: string;
  featureId?: string;
};

export type KernelStats = {
  durationMs: number;
  bodyCount: number;
  featureCount: number;
  rebuiltPartCount: number;
  cacheHitCount: number;
};

export type KernelResult = {
  requestId: number;
  parts: TessellatedPart[];
  diagnostics: KernelDiagnostic[];
  stats: KernelStats;
};

export type KernelSelection = {
  partId: string;
  kind: 'face' | 'edge';
  semanticId: string;
};

export type KernelRebuildPayload = {
  document: CabinetDocument;
  graph: FeatureGraph;
  dirtyPartIds: string[];
};

export type KernelRequest =
  | { type: 'rebuild'; requestId: number; payload: KernelRebuildPayload }
  | { type: 'export-step'; requestId: number; payload: KernelRebuildPayload; bodyIds?: string[] };

export type KernelResponse =
  | { type: 'rebuilt'; requestId: number; result: KernelResult }
  | { type: 'step-exported'; requestId: number; bytes: ArrayBuffer; diagnostics: KernelDiagnostic[] }
  | { type: 'failed'; requestId: number; message: string; diagnostics: KernelDiagnostic[] };

export type KernelStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface GeometryKernel {
  rebuild(document: CabinetDocument, dirtyIds?: string[]): Promise<KernelResult>;
  tessellate(bodyIds?: string[]): TessellatedPart[];
  exportStep(bodyIds?: string[]): Promise<ArrayBuffer>;
  dispose(): void;
}

export function isKernelEligiblePart(part: CadPart) {
  return part.visible && part.size.x > 0 && part.size.y > 0 && part.size.z > 0;
}
