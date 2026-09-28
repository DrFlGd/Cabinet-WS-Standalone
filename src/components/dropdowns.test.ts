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

  it('keeps Manual Layout primary and the Parts browser secondary/collapsible', () => {
    const sectionSource = readFileSync('src/components/SectionLayoutPanel.tsx', 'utf8');
    const treeSource = readFileSync('src/components/TreePanel.tsx', 'utf8');
    const appSource = readFileSync('src/App.tsx', 'utf8');
    const schemaSource = readFileSync('src/cad/parameterSchema.ts', 'utf8');
    const propertiesSource = readFileSync('src/components/PropertiesPanel.tsx', 'utf8');

    expect(sectionSource).toContain('Manual Layout Editor');
    expect(sectionSource).toContain('ariaLabel="Layout mode"');
    expect(appSource).toContain('parts-browser-expanded');
    expect(appSource).toContain('onLayoutModeChange');
    expect(treeSource).toContain('Open parts browser');
    expect(treeSource).toContain('Collapse parts browser');
    expect(schemaSource).not.toContain("key: 'layoutMode'");
    expect(appSource).toContain('onOpenSection={openSection}');
    expect(propertiesSource).toContain('partSettingsContext');
    expect(propertiesSource).toContain('Edit this section');
  });
});
