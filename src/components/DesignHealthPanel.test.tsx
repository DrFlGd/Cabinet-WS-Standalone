import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { makeUtilityDefaults } from '../cad/utilityStarters';
import type { DesignHealthReport } from '../cad/designHealth';
import DesignHealthPanel from './DesignHealthPanel';

const report: DesignHealthReport = {
  status: 'warning',
  readiness: 'review',
  checks: [{
    id: 'clearance',
    severity: 'warning',
    category: 'geometry',
    title: 'Clearance needs review',
    message: 'A representative opening is tight.',
    suggestion: 'Increase the opening before manufacturing.',
  }],
  errors: [],
  warnings: [{
    id: 'clearance',
    severity: 'warning',
    category: 'geometry',
    title: 'Clearance needs review',
    message: 'A representative opening is tight.',
    suggestion: 'Increase the opening before manufacturing.',
  }],
  coverage: [{
    id: 'geometry',
    label: 'Geometry',
    status: 'checked',
    detail: 'Representative geometry checks are active.',
  }],
  summary: {
    errorCount: 0,
    warningCount: 1,
    infoCount: 0,
    checkedCategories: 1,
  },
};

describe('DesignHealthPanel', () => {
  it('keeps significant issue counts visible in its collapsible summary', () => {
    const markup = renderToStaticMarkup(
      <DesignHealthPanel
        report={report}
        parameters={makeUtilityDefaults()}
        units="mm"
        onApplySolution={() => undefined}
      />,
    );

    expect(markup).toContain('aria-expanded="true"');
    expect(markup).toContain('Design Health · WARNING');
    expect(markup).toContain('0 errors · 1 warnings · manufacturing review');
    expect(markup).toContain('Clearance needs review');
  });
});
