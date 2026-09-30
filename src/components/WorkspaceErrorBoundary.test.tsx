import type { ErrorInfo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import WorkspaceErrorBoundary, { WorkspaceFailure } from './WorkspaceErrorBoundary';

describe('WorkspaceErrorBoundary', () => {
  it('renders actionable recovery guidance with the original error', () => {
    const markup = renderToStaticMarkup(
      <WorkspaceFailure error={new Error('geometry panel failed')} onReload={() => undefined} />,
    );

    expect(markup).toContain('The modeling workspace hit an error');
    expect(markup).toContain('latest autosave/recovery copy is kept');
    expect(markup).toContain('Reload workspace');
    expect(markup).toContain('geometry panel failed');
  });

  it('normalizes thrown values and reports caught errors to the recovery callback', () => {
    const state = WorkspaceErrorBoundary.getDerivedStateFromError('render failed');
    expect(state.error?.message).toBe('render failed');

    const onError = vi.fn();
    const boundary = new WorkspaceErrorBoundary({ children: null, onError });
    const error = new Error('boom');
    const info = { componentStack: '\n at Test' } as ErrorInfo;
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    boundary.componentDidCatch(error, info);

    expect(onError).toHaveBeenCalledWith(error, info);
    consoleError.mockRestore();
  });
});
