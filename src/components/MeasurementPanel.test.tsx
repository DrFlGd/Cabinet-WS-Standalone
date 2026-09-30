import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import MeasurementPanel from './MeasurementPanel';

describe('MeasurementPanel', () => {
  it('renders face width and height before secondary area in display units', () => {
    const html = renderToStaticMarkup(
      <MeasurementPanel
        mode="off"
        selectionCount={0}
        units="in"
        onMode={() => undefined}
        onClear={() => undefined}
        result={{
          title: 'Face dimensions',
          primary: [
            { label: 'Width', value: 203.2, unit: 'mm' },
            { label: 'Height', value: 101.6, unit: 'mm' },
          ],
          secondary: [{ label: 'Area', value: 20_645.12, unit: 'mm2' }],
          detail: 'Side panel · Inside face',
        }}
      />,
    );

    expect(html).toContain('Width');
    expect(html).toContain('8.000 in');
    expect(html).toContain('Height');
    expect(html).toContain('4.000 in');
    expect(html).toContain('Area');
    expect(html).toContain('32.00 in²');
    expect(html.indexOf('Width')).toBeLessThan(html.indexOf('Area'));
    expect(html.indexOf('Height')).toBeLessThan(html.indexOf('Area'));
  });
});
