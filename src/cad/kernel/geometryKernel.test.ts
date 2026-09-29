import { describe, expect, it, vi } from 'vitest';
import type { KernelResponse } from './types';
import { buildCabinetDocument, DEFAULT_PARAMETERS } from '../cabinetModel';

const worker = vi.hoisted(() => ({ listeners: new Map<string, (event: unknown) => void>(), requests: [] as any[] }));
vi.mock('./geometry.worker?worker', () => ({ default: class {
  addEventListener(name: string, handler: (event: unknown) => void) { worker.listeners.set(name, handler); }
  removeEventListener(name: string) { worker.listeners.delete(name); }
  postMessage(request: unknown) { worker.requests.push(request); }
  terminate() {}
} }));
import { KernelExecutionError, WorkerGeometryKernel } from './geometryKernel';

it.each(['error', 'warning'] as const)('does not resolve STEP bytes with incomplete diagnostics (%s)', async severity => {
  const kernel = new WorkerGeometryKernel();
  const rebuilding = kernel.rebuild(buildCabinetDocument(DEFAULT_PARAMETERS));
  const rebuiltId = worker.requests.at(-1).requestId;
  worker.listeners.get('message')!({ data: { type: 'rebuilt', requestId: rebuiltId, result: { parts: [], diagnostics: [] } } });
  await rebuilding;
  const promise = kernel.exportStep();
  const response: KernelResponse = { type: 'step-exported', requestId: worker.requests.at(-1).requestId, bytes: new ArrayBuffer(3), diagnostics: [{ severity, code: severity === 'warning' ? 'feature-cut-failed' : 'step-part-failed', message: 'Left side failed', partId: 'carcass:left' }] };
  worker.listeners.get('message')!({ data: response });
  await expect(promise).rejects.toBeInstanceOf(KernelExecutionError);
  kernel.dispose();
});
