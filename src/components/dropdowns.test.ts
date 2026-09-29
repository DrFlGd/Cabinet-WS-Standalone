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

  it('keeps Hardware / Manual Layout / Parts as the left workspace hierarchy', () => {
    const sectionSource = readFileSync('src/components/SectionLayoutPanel.tsx', 'utf8');
    const hardwareDrawerSource = readFileSync('src/components/HardwareDrawer.tsx', 'utf8');
    const treeSource = readFileSync('src/components/TreePanel.tsx', 'utf8');
    const appSource = readFileSync('src/App.tsx', 'utf8');
    const schemaSource = readFileSync('src/cad/parameterSchema.ts', 'utf8');
    const propertiesSource = readFileSync('src/components/PropertiesPanel.tsx', 'utf8');

    expect(sectionSource).toContain('Manual Layout Editor');
    expect(sectionSource).toContain('ariaLabel="Layout mode"');
    expect(sectionSource).toContain('ariaLabel="Cabinet contents"');
    expect(sectionSource).toContain('Drawer rows');
    expect(sectionSource).toContain('Doors');
    expect(sectionSource).toContain('Shelf panels');
    expect(sectionSource).toContain('onParameterChange');

    expect(hardwareDrawerSource).toContain('Open hardware catalog');
    expect(hardwareDrawerSource).toContain('Collapse hardware catalog');
    expect(hardwareDrawerSource).toContain('<HardwarePicker');

    expect(appSource).toContain('hardware-browser-expanded');
    expect(appSource).toContain('parts-browser-expanded');
    expect(appSource.indexOf('<HardwareDrawer')).toBeLessThan(appSource.indexOf('<SectionLayoutPanel'));
    expect(appSource.indexOf('<SectionLayoutPanel')).toBeLessThan(appSource.indexOf('<TreePanel'));

    expect(treeSource).toContain('Open parts browser');
    expect(treeSource).toContain('Collapse parts browser');
    expect(schemaSource).not.toContain("key: 'layoutMode'");

    expect(propertiesSource).toContain('aria-label="Search properties"');
    expect(propertiesSource).toContain("field.section !== 'Layout'");
    expect(propertiesSource).not.toContain("import HardwarePicker");
    expect(propertiesSource).toContain('partSettingsContext');
    expect(propertiesSource).toContain('Edit this section');
  });

  it('keeps exact CAD worker, STEP export, and semantic topology wired into the desktop shell', () => {
    const appSource = readFileSync('src/App.tsx', 'utf8');
    const viewportSource = readFileSync('src/cad/CadViewport.tsx', 'utf8');
    const workerSource = readFileSync('src/cad/kernel/geometry.worker.ts', 'utf8');
    const desktopSource = readFileSync('electron/main.cjs', 'utf8');

    expect(appSource).toContain('useGeometryKernel');
    expect(appSource).toContain('onExportStep');
    expect(viewportSource).toContain('kernelFaceGroups');
    expect(viewportSource).toContain('semanticEdgeId');
    expect(workerSource).toContain("replicad-opencascadejs/wasm?url");
    expect(workerSource).toContain('exportSTEP');
    expect(workerSource).toContain('meshCache');
    expect(desktopSource).toContain("ipcMain.handle('export:step'");
  });
});
