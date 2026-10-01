import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { makeUtilityDefaults } from '../cad/utilityStarters';
import FitSolverPanel from './FitSolverPanel';

describe('FitSolverPanel', () => {
  it('renders solver inputs, result, and apply action as one persistent workspace surface', () => {
    const html = renderToStaticMarkup(
      <FitSolverPanel
        parameters={makeUtilityDefaults()}
        units="mm"
        onApplySolution={() => undefined}
      />,
    );

    expect(html).toContain('Fit Solver');
    expect(html).toContain('Inside width');
    expect(html).toContain('Inside depth');
    expect(html).toContain('Apply solved result');
    expect(html).toContain('undoable');
  });
});
