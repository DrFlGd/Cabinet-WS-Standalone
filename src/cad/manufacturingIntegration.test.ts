import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Phase 11 manufacturing integration', () => {
  it('integrates manufacturing review into Shop Docs and app state', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    const panel = readFileSync('src/components/ShopDocsPanel.tsx', 'utf8');

    expect(app).toContain('buildManufacturingModel(cadDocument, shopDocs, designHealth)');
    expect(app).toContain('manufacturing={manufacturing}');
    expect(panel).toContain("type Tab = 'bom' | 'assembly' | 'manufacturing'");
    expect(panel).toContain('Manufacturing</button>');
    expect(panel).toContain('Registered operations');
    expect(panel).toContain('Mark reviewed');
    expect(panel).toContain('Export reviewed ZIP');
  });

  it('routes DXF SVG metadata and ZIP through native desktop save dialogs', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    const preload = readFileSync('electron/preload.cjs', 'utf8');
    const main = readFileSync('electron/main.cjs', 'utf8');
    const desktop = readFileSync('src/desktop.ts', 'utf8');

    expect(app).toContain("saveTextExport(part.dxf");
    expect(app).toContain("saveBinary({ bytes: arrayBuffer");
    expect(preload).toContain("ipcRenderer.invoke('export:binary'");
    expect(main).toContain("DXF manufacturing geometry");
    expect(main).toContain("SVG manufacturing geometry");
    expect(main).toContain("ZIP manufacturing package");
    expect(desktop).toContain("kind: 'csv' | 'html' | 'dxf' | 'svg' | 'json'");
    expect(desktop).toContain("kind: 'zip'");
  });

  it('preserves the explicit no-toolpath boundary', () => {
    const manufacturing = readFileSync('src/cad/manufacturing.ts', 'utf8');
    const panel = readFileSync('src/components/ShopDocsPanel.tsx', 'utf8');

    expect(manufacturing).toContain('not CNC toolpaths');
    expect(panel).toContain('not CNC toolpaths');
    expect(manufacturing).not.toMatch(/G0\\s|G1\\s|postprocessor/i);
  });
});
