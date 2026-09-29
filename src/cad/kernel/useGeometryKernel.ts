import { useCallback, useEffect, useRef, useState } from 'react';
import type { CabinetDocument } from '../types';
import {
  KernelExecutionError,
  KernelRequestSupersededError,
  WorkerGeometryKernel,
} from './geometryKernel';
import type { KernelDiagnostic, KernelResult, KernelStatus } from './types';

export type GeometryKernelState = {
  status: KernelStatus;
  result: KernelResult | null;
  diagnostics: KernelDiagnostic[];
  exportStep: (bodyIds?: string[]) => Promise<ArrayBuffer>;
};

export function useGeometryKernel(document: CabinetDocument): GeometryKernelState {
  const kernel = useRef<WorkerGeometryKernel | null>(null);
  if (!kernel.current) kernel.current = new WorkerGeometryKernel();

  const [status, setStatus] = useState<KernelStatus>('loading');
  const [result, setResult] = useState<KernelResult | null>(null);
  const [diagnostics, setDiagnostics] = useState<KernelDiagnostic[]>([]);

  useEffect(() => {
    const current = kernel.current!;
    let active = true;
    // Never display stale exact geometry while a document edit is rebuilding.
    // The analytical model remains the immediate interaction preview.
    setStatus('loading');
    setResult(null);
    setDiagnostics([]);

    current.rebuild(document)
      .then(next => {
        if (!active) return;
        setResult(next);
        setDiagnostics(next.diagnostics);
        setStatus(next.diagnostics.some(item => item.severity === 'error') ? 'error' : 'ready');
      })
      .catch(error => {
        if (!active || error instanceof KernelRequestSupersededError) return;
        setDiagnostics(
          error instanceof KernelExecutionError
            ? error.diagnostics as KernelDiagnostic[]
            : [{ severity: 'error', code: 'kernel-client-error', message: error instanceof Error ? error.message : String(error) }],
        );
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [document]);

  useEffect(() => () => {
    kernel.current?.dispose();
    kernel.current = null;
  }, []);

  const exportStep = useCallback((bodyIds?: string[]) => {
    return kernel.current!.exportStep(bodyIds);
  }, []);

  return { status, result, diagnostics, exportStep };
}
