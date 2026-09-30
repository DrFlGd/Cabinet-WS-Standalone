import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

type Props = {
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
};

type State = {
  error: Error | null;
};

function normalizeError(value: unknown) {
  return value instanceof Error ? value : new Error(String(value));
}

export function WorkspaceFailure({
  error,
  onReload,
}: {
  error: Error;
  onReload?: () => void;
}) {
  const reload = onReload ?? (() => window.location.reload());

  return <main className="workspace-error-shell" role="alert">
    <section className="workspace-error-card" aria-labelledby="workspace-error-title">
      <span className="workspace-error-icon"><AlertTriangle size={28} /></span>
      <div>
        <span className="eyebrow">WORKSPACE RECOVERY</span>
        <h1 id="workspace-error-title">The modeling workspace hit an error</h1>
        <p>
          The latest autosave/recovery copy is kept. Reload the workspace to restart the renderer;
          if the recovery copy contains unsaved changes, Cabinet WS will offer to restore it.
        </p>
      </div>
      <button className="workspace-error-reload" onClick={reload} autoFocus>
        <RefreshCw size={16} /> Reload workspace
      </button>
      <details>
        <summary>Error details</summary>
        <pre>{error.name}: {error.message}</pre>
      </details>
    </section>
  </main>;
}

export default class WorkspaceErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: normalizeError(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Cabinet WS workspace error', error, info);
    try {
      this.props.onError?.(error, info);
    } catch (recoveryError) {
      console.error('Cabinet WS recovery flush after workspace error failed', recoveryError);
    }
  }

  render() {
    if (this.state.error) return <WorkspaceFailure error={this.state.error} />;
    return this.props.children;
  }
}
