import KernelWorker from './geometry.worker?worker';
import type { CabinetDocument } from '../types';
import { buildFeatureGraph } from './featureGraph';
import type {
  FeatureGraph,
  GeometryKernel,
  KernelRequest,
  KernelResponse,
  KernelResult,
  KernelRebuildPayload,
  TessellatedPart,
} from './types';

type PendingRequest = {
  kind: 'rebuild' | 'export-step';
  resolve: (value: any) => void;
  reject: (error: Error) => void;
};

export class WorkerGeometryKernel implements GeometryKernel {
  private worker = new KernelWorker();
  private requestId = 0;
  private latestRebuildId = 0;
  private pending = new Map<number, PendingRequest>();
  private lastPayload: KernelRebuildPayload | null = null;
  private lastResult: KernelResult | null = null;
  private signatures = new Map<string, string>();

  constructor() {
    this.worker.addEventListener('message', this.handleMessage);
    this.worker.addEventListener('error', this.handleWorkerError);
  }

  rebuild(document: CabinetDocument, dirtyIds?: string[]) {
    const graph = buildFeatureGraph(document);
    const computedDirty = dirtyIds ?? this.computeDirtyIds(document, graph);
    const payload: KernelRebuildPayload = {
      document,
      graph,
      dirtyPartIds: computedDirty,
    };
    this.lastPayload = payload;

    const requestId = ++this.requestId;
    this.latestRebuildId = requestId;

    for (const [id, pending] of this.pending) {
      if (pending.kind !== 'rebuild' || id >= requestId) continue;
      pending.reject(new KernelRequestSupersededError());
      this.pending.delete(id);
    }

    const request: KernelRequest = { type: 'rebuild', requestId, payload };
    const promise = new Promise<KernelResult>((resolve, reject) => {
      this.pending.set(requestId, { kind: 'rebuild', resolve, reject });
    });
    this.worker.postMessage(request);
    return promise;
  }

  tessellate(bodyIds?: string[]): TessellatedPart[] {
    const parts = this.lastResult?.parts ?? [];
    if (!bodyIds?.length) return parts;
    const requested = new Set(bodyIds);
    return parts.filter(part => requested.has(part.partId));
  }

  exportStep(bodyIds?: string[]) {
    if (!this.lastPayload) {
      return Promise.reject(new Error('Exact geometry has not been built yet.'));
    }

    const requestId = ++this.requestId;
    const request: KernelRequest = {
      type: 'export-step',
      requestId,
      payload: this.lastPayload,
      bodyIds,
    };
    const promise = new Promise<ArrayBuffer>((resolve, reject) => {
      this.pending.set(requestId, { kind: 'export-step', resolve, reject });
    });
    this.worker.postMessage(request);
    return promise;
  }

  dispose() {
    this.worker.removeEventListener('message', this.handleMessage);
    this.worker.removeEventListener('error', this.handleWorkerError);
    this.worker.terminate();
    for (const pending of this.pending.values()) {
      pending.reject(new Error('Geometry kernel disposed.'));
    }
    this.pending.clear();
  }

  private handleMessage = (event: MessageEvent<KernelResponse>) => {
    const response = event.data;
    const pending = this.pending.get(response.requestId);
    if (!pending) return;
    this.pending.delete(response.requestId);

    if (response.type === 'failed') {
      pending.reject(new KernelExecutionError(response.message, response.diagnostics));
      return;
    }

    if (response.type === 'rebuilt') {
      if (response.requestId !== this.latestRebuildId) {
        pending.reject(new KernelRequestSupersededError());
        return;
      }
      this.lastResult = response.result;
      pending.resolve(response.result);
      return;
    }

    pending.resolve(response.bytes);
  };

  private handleWorkerError = (event: ErrorEvent) => {
    const error = new Error(event.message || 'Geometry worker failed.');
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
  };

  private computeDirtyIds(document: CabinetDocument, graph: FeatureGraph) {
    const next = new Map<string, string>();
    const dirty: string[] = [];

    for (const part of document.parts) {
      const signature = JSON.stringify({
        size: part.size,
        geometry: part.geometry,
        features: graph.partFeatures[part.id] ?? [],
      });
      next.set(part.id, signature);
      if (this.signatures.get(part.id) !== signature) dirty.push(part.id);
    }

    for (const existingId of this.signatures.keys()) {
      if (!next.has(existingId)) dirty.push(existingId);
    }

    this.signatures = next;
    return dirty;
  }
}

export class KernelRequestSupersededError extends Error {
  constructor() {
    super('Geometry rebuild superseded by a newer edit.');
    this.name = 'KernelRequestSupersededError';
  }
}

export class KernelExecutionError extends Error {
  constructor(
    message: string,
    public readonly diagnostics: { severity: string; code: string; message: string }[],
  ) {
    super(message);
    this.name = 'KernelExecutionError';
  }
}
