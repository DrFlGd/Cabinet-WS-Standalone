import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import LayoutWorkspace, { nextLayoutWorkspaceTab } from './LayoutWorkspace';

describe('LayoutWorkspace', () => {
  it('keeps both shared workspace surfaces mounted while only one tab is active', () => {
    const html = renderToStaticMarkup(
      <LayoutWorkspace
        activeTab="layout"
        hasSharedLayout
        familyLabel="Utility Cabinet"
        onTabChange={() => undefined}
        layout={<div>layout-state-sentinel</div>}
        solver={<div>solver-state-sentinel</div>}
        health={<div>health-sentinel</div>}
      />,
    );

    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('layout-state-sentinel');
    expect(html).toContain('solver-state-sentinel');
    expect(html).toContain('health-sentinel');
    expect(html).toContain('layout-workspace-panel-solver');
    expect(html).toContain('hidden');
  });

  it('gives dedicated-generator families a useful Layout tab without duplicating an editor', () => {
    const html = renderToStaticMarkup(
      <LayoutWorkspace
        activeTab="layout"
        hasSharedLayout={false}
        familyLabel="Standalone Drawer"
        onTabChange={() => undefined}
        layout={<div>shared-layout-should-not-render</div>}
        solver={<div>solver-still-mounted</div>}
        health={<div>health-still-visible</div>}
      />,
    );

    expect(html).toContain('No shared Manual Layout for Standalone Drawer');
    expect(html).not.toContain('shared-layout-should-not-render');
    expect(html).toContain('solver-still-mounted');
    expect(html).toContain('health-still-visible');
  });

  it('cycles tabs for arrow-key navigation', () => {
    expect(nextLayoutWorkspaceTab('layout', 'next')).toBe('solver');
    expect(nextLayoutWorkspaceTab('solver', 'next')).toBe('layout');
    expect(nextLayoutWorkspaceTab('solver', 'previous')).toBe('layout');
    expect(nextLayoutWorkspaceTab('layout', 'previous')).toBe('solver');
  });
});
