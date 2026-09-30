import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HelpDialog from './HelpDialog';

describe('HelpDialog', () => {
  it('documents supported viewer interaction without implementation jargon', () => {
    const html = renderToStaticMarkup(<HelpDialog onClose={() => undefined} />);
    expect(html).toContain('Model viewer controls');
    expect(html).toContain('Left-drag');
    expect(html).toContain('Ctrl-click');
    expect(html).toContain('Hold Alt');
    expect(html).toContain('select two faces or edges');
    expect(html).toContain('Escape');
    expect(html).not.toContain('OpenCascade');
    expect(html).not.toContain('semantic topology');
  });

  it('exposes an accessible modal label and close control', () => {
    const html = renderToStaticMarkup(<HelpDialog onClose={() => undefined} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby="help-title"');
    expect(html).toContain('aria-label="Close Help"');
  });
});
