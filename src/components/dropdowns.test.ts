import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const interfaceFiles = [
  'src/App.tsx',
  'src/components/Toolbar.tsx',
  'src/components/PropertiesPanel.tsx',
  'src/components/SectionLayoutPanel.tsx',
];

describe('desktop dropdown controls', () => {
  it('does not rely on native select popups in primary editor surfaces', () => {
    for (const file of interfaceFiles) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).not.toContain('<select');
      expect(source, file).toContain('SelectControl');
    }
  });

  it('renders dropdown menus through a document-level portal above the CAD viewport', () => {
    const source = readFileSync('src/components/SelectControl.tsx', 'utf8');
    expect(source).toContain('createPortal');
    expect(source).toContain('document.body');
    expect(source).toContain('role="listbox"');
    expect(source).toContain('aria-expanded={open}');
  });

  it('keeps the section editor collapsible and routes selected parts to contextual settings', () => {
    const sectionSource = readFileSync('src/components/SectionLayoutPanel.tsx', 'utf8');
    const appSource = readFileSync('src/App.tsx', 'utf8');
    const propertiesSource = readFileSync('src/components/PropertiesPanel.tsx', 'utf8');

    expect(sectionSource).toContain('aria-expanded={expanded}');
    expect(sectionSource).toContain("expanded ? 'expanded' : 'collapsed'");
    expect(appSource).toContain('section-editor-expanded');
    expect(appSource).toContain('onOpenSection={openSection}');
    expect(propertiesSource).toContain('partSettingsContext');
    expect(propertiesSource).toContain('Edit this section');
  });
});
