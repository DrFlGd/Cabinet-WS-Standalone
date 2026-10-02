import { useRef, type ReactNode } from 'react';
import { Calculator, Columns3 } from 'lucide-react';

export type LayoutWorkspaceTab = 'layout' | 'solver';

type Props = {
  activeTab: LayoutWorkspaceTab;
  hasSharedLayout: boolean;
  layout: ReactNode;
  solver: ReactNode;
  health: ReactNode;
  familyLabel: string;
  onTabChange: (tab: LayoutWorkspaceTab) => void;
};

export default function LayoutWorkspace({
  activeTab,
  hasSharedLayout,
  layout,
  solver,
  health,
  familyLabel,
  onTabChange,
}: Props) {
  const layoutTab = useRef<HTMLButtonElement>(null);
  const solverTab = useRef<HTMLButtonElement>(null);

  function moveTab(direction: 'previous' | 'next') {
    const next = nextLayoutWorkspaceTab(activeTab, direction);
    onTabChange(next);
    requestAnimationFrame(() => {
      (next === 'layout' ? layoutTab.current : solverTab.current)?.focus();
    });
  }

  return (
    <div className="layout-primary-column">
      <div className="layout-workspace-tabs" role="tablist" aria-label="Layout workspace">
        <button
          ref={layoutTab}
          type="button"
          role="tab"
          id="layout-workspace-tab-layout"
          aria-controls="layout-workspace-panel-layout"
          aria-selected={activeTab === 'layout'}
          tabIndex={activeTab === 'layout' ? 0 : -1}
          className={activeTab === 'layout' ? 'active' : ''}
          onClick={() => onTabChange('layout')}
          onKeyDown={event => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
              event.preventDefault();
              moveTab('previous');
            } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
              event.preventDefault();
              moveTab('next');
            }
          }}
        >
          <Columns3 size={13} /> Layout
        </button>
        <button
          ref={solverTab}
          type="button"
          role="tab"
          id="layout-workspace-tab-solver"
          aria-controls="layout-workspace-panel-solver"
          aria-selected={activeTab === 'solver'}
          tabIndex={activeTab === 'solver' ? 0 : -1}
          className={activeTab === 'solver' ? 'active' : ''}
          onClick={() => onTabChange('solver')}
          onKeyDown={event => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
              event.preventDefault();
              moveTab('previous');
            } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
              event.preventDefault();
              moveTab('next');
            }
          }}
        >
          <Calculator size={13} /> Fit Solver
        </button>
      </div>

      <div className="layout-workspace-body">
        <div
          id="layout-workspace-panel-layout"
          role="tabpanel"
          aria-labelledby="layout-workspace-tab-layout"
          hidden={activeTab !== 'layout'}
          className="layout-workspace-panel"
        >
          {hasSharedLayout ? layout : (
            <section className="layout-workspace-empty">
              <Columns3 size={18} />
              <div>
                <strong>No shared Manual Layout for {familyLabel}</strong>
                <p>This family uses its dedicated generator. Edit construction in Cabinet Settings, or use Fit Solver from the neighboring tab.</p>
              </div>
            </section>
          )}
        </div>
        <div
          id="layout-workspace-panel-solver"
          role="tabpanel"
          aria-labelledby="layout-workspace-tab-solver"
          hidden={activeTab !== 'solver'}
          className="layout-workspace-panel"
        >
          {solver}
        </div>
      </div>

      {health}
    </div>
  );
}

export function nextLayoutWorkspaceTab(
  current: LayoutWorkspaceTab,
  direction: 'previous' | 'next',
): LayoutWorkspaceTab {
  if (direction === 'next') return current === 'layout' ? 'solver' : 'layout';
  return current === 'solver' ? 'layout' : 'solver';
}
