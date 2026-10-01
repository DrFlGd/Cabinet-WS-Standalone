import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { familyStarter } from '../cad/familyCatalog';
import FamilySettingsPanel from './FamilySettingsPanel';

describe('FamilySettingsPanel browsing', () => {
  const starter = familyStarter('utility', 'default');

  it('renders bounded-category anchors for visible family sections', () => {
    const html = renderToStaticMarkup(
      <FamilySettingsPanel
        family="utility"
        familyValues={starter.values}
        displayUnits="mm"
        query=""
        activeCategory="Cabinet"
        onChange={() => undefined}
        onOpenManualLayout={() => undefined}
      />,
    );

    expect(html).toContain('id="settings-family-');
    expect(html).toContain('schema fields');
  });

  it('handles a long no-match query without dropping the search-empty state', () => {
    const query = 'this-query-intentionally-matches-no-family-setting-1234567890';
    const html = renderToStaticMarkup(
      <FamilySettingsPanel
        family="utility"
        familyValues={starter.values}
        displayUnits="in"
        query={query}
        activeCategory={null}
        onChange={() => undefined}
        onOpenManualLayout={() => undefined}
      />,
    );

    expect(html).toContain('No family settings match the current filters.');
    expect(html).toContain(query);
  });
});
