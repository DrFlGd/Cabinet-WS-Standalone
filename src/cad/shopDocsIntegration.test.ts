import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Phase 10 workspace integration', () => {
  it('links CAD selection and BOM rows by semantic part ID', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    const panel = readFileSync('src/components/ShopDocsPanel.tsx', 'utf8');

    expect(app).toContain('onSelectPart={selectPartById}');
    expect(app).toContain('onSelectParts={selectPartIds}');
    expect(panel).toContain("className={selectedId === row.partId ? 'selected' : ''}");
    expect(panel).toContain('onClick={() => onSelectPart(row.partId)}');
    expect(panel).toContain('scrollIntoView');
  });

  it('reuses the semantic viewport for exploded assembly review', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    const panel = readFileSync('src/components/ShopDocsPanel.tsx', 'utf8');

    expect(app).toContain('function explodeAssemblyView()');
    expect(app).toContain('setExplode(110)');
    expect(app).toContain("viewport.current?.setView('iso')");
    expect(panel).toContain('Exploded viewport');
    expect(panel).toContain('Highlight step');
  });

  it('routes CSV and printable reports through the desktop save bridge', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    const preload = readFileSync('electron/preload.cjs', 'utf8');
    const main = readFileSync('electron/main.cjs', 'utf8');

    expect(app).toContain('desktop.saveText');
    expect(preload).toContain("ipcRenderer.invoke('export:text'");
    expect(main).toContain("ipcMain.handle('export:text'");
    expect(main).toContain('Export CSV report');
    expect(main).toContain('Export printable report');
  });
});
