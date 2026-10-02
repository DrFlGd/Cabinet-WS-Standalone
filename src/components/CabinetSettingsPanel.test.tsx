import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { familyStarter } from '../cad/familyCatalog';
import { familyFieldDefinitions } from '../cad/familySettings';
import PropertiesPanel from './PropertiesPanel';
import FamilyFieldControl from './FamilyFieldControl';

describe('Cabinet settings presentation', () => {
  it('renders one settings browser and unchecked visibility preferences', () => {
    const starter = familyStarter('utility', 'default');
    const html = renderToStaticMarkup(<PropertiesPanel family="utility" familyValues={starter.values} parameters={starter.parameters}
      selected={null} displayUnits="mm" onChange={() => undefined} onFamilyValueChange={() => undefined} kernelDiagnostics={[]} onOpenSection={() => undefined} />);
    expect(html).toContain('Cabinet Settings');
    expect(html).not.toContain('Native model');
    expect(html).not.toContain('property-mode-tabs');
    expect(html).toContain('Show unused options');
    expect(html).toContain('Show advanced settings');
    expect(html).toContain('Open Layout editor');
    expect(html).toContain('id="settings-cabinet-sizing"');
    expect(html).not.toMatch(/>On<|>Off</);
  });
  it('keeps the boolean label stable and exposes disabled unused inputs', () => {
    const field = familyFieldDefinitions('utility').find(field => typeof field.value === 'boolean')!;
    const render = (value: boolean) => renderToStaticMarkup(<FamilyFieldControl field={field} value={value} inactiveReason="Enable parent option" displayUnits="mm" onChange={() => undefined} onOpenManualLayout={() => undefined} />);
    expect(render(true).replace(' checked=""', '')).toBe(render(false));
    expect(render(false)).toContain('disabled=""');
    expect(render(false)).not.toMatch(/>On<|>Off</);
  });
});
