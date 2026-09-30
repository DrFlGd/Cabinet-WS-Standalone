import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AboutDialog from './AboutDialog';

describe('AboutDialog', () => {
  it('renders runtime version and packaging information', () => {
    const markup = renderToStaticMarkup(<AboutDialog
      info={{
        name: 'Cabinet WS Standalone',
        version: '0.14.1',
        platform: 'win32',
        electron: '44.4.3',
        chromium: '142.0',
        isPackaged: true,
      }}
      onClose={() => undefined}
    />);

    expect(markup).toContain('Version 0.14.1');
    expect(markup).toContain('Electron 44.4.3');
    expect(markup).toContain('Chromium 142.0');
    expect(markup).toContain('Packaged desktop application');
  });
});
