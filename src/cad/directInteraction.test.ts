import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('v0.7 direct CAD interaction shell', () => {
  it('keeps direct envelope editing connected to semantic cabinet parameters', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    const viewport = readFileSync('src/cad/CadViewport.tsx', 'utf8');

    expect(app).toContain('ViewportDimensionEditor');
    expect(app).toContain('onDimensionChange={(key, value) => updateParameter(key, value)}');
    expect(viewport).toContain("dimensionKey");
    expect(viewport).toContain("latest.current.onDimensionChange");
    expect(viewport).toContain("key: 'width' | 'height' | 'depth'");
  });

  it('supports multi-selection and viewport part actions without renderer-owned cabinet identity', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    const viewport = readFileSync('src/cad/CadViewport.tsx', 'utf8');
    const tree = readFileSync('src/components/TreePanel.tsx', 'utf8');

    expect(app).toContain('selectedIds');
    expect(app).toContain('isolateSelected');
    expect(app).toContain('hideSelected');
    expect(viewport).toContain("event.ctrlKey || event.metaKey");
    expect(viewport).toContain("addEventListener('contextmenu'");
    expect(viewport).toContain('part.id === id');
    expect(tree).toContain('selectedIds.has(part.id)');
  });

  it('provides clipping, display modes, and orthographic projection as viewport concerns', () => {
    const viewport = readFileSync('src/cad/CadViewport.tsx', 'utf8');
    const toolbar = readFileSync('src/components/Toolbar.tsx', 'utf8');

    expect(viewport).toContain('THREE.OrthographicCamera');
    expect(viewport).toContain("wireframe: displayMode === 'wireframe'");
    expect(viewport).toContain('clippingPlanes: clipEnabled');
    expect(toolbar).toContain('Viewport display mode');
    expect(toolbar).toContain('Camera projection');
    expect(toolbar).toContain('Clip');
  });


  it('keeps ordinary viewing free of persistent helper and topology jargon', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    const viewport = readFileSync('src/cad/CadViewport.tsx', 'utf8');
    const properties = readFileSync('src/components/PropertiesPanel.tsx', 'utf8');
    const toolbar = readFileSync('src/components/Toolbar.tsx', 'utf8');

    expect(viewport).toContain('shouldShowViewportHandle');
    expect(viewport).not.toContain('cad-direct-hint');
    expect(app).not.toContain('Click face · Shift-click edge');
    expect(app).not.toContain('Exact CAD ·');
    expect(properties).not.toContain('SEMANTIC TOPOLOGY');
    expect(toolbar).toContain('Viewer Help');
  });

  it('keeps v0.8 shelf/divider dragging and semantic measurement document-owned', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    const viewport = readFileSync('src/cad/CadViewport.tsx', 'utf8');
    const measurement = readFileSync('src/cad/measurements.ts', 'utf8');

    expect(viewport).toContain('onShelfPositionChange');
    expect(viewport).toContain('onSectionDividerChange');
    expect(viewport).toContain("directHandleKind = 'shelf'");
    expect(viewport).toContain("directHandleKind = 'divider'");
    expect(viewport).toContain('renderer.domElement.getBoundingClientRect()');
    expect(viewport).not.toContain('const setPointerFromEvent = (event: PointerEvent | MouseEvent) => {\n      setPointerFromEvent(event);');
    expect(app).toContain('updateShelfPosition');
    expect(app).toContain('updateSectionDivider');
    expect(app).toContain('computeMeasurement');
    expect(measurement).toContain('semanticFaces');
    expect(measurement).toContain('semanticEdges');
  });
});
