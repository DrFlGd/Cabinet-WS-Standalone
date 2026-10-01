import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Phase 12 production planning integration', () => {
  it('adds Production as a semantic Shop Docs workflow', () => {
    const panel = readFileSync('src/components/ShopDocsPanel.tsx', 'utf8');
    const productionPanel = readFileSync('src/components/ProductionPlanningPanel.tsx', 'utf8');

    expect(panel).toContain("'manufacturing' | 'production'");
    expect(panel).toContain('>Production</button>');
    expect(panel).toContain('<ProductionPlanningPanel');
    expect(productionPanel).toContain('Sheet nesting & production planning');
    expect(productionPanel).toContain('Production stock material');
    expect(productionPanel).toContain('Nested sheet for selected stock');
    expect(productionPanel).toContain('productionStockSummary');
    expect(productionPanel).toContain('Sheet DXF');
    expect(productionPanel).toContain('Registration');
  });

  it('uses Phase 11 manufacturing semantics instead of renderer geometry', () => {
    const production = readFileSync('src/cad/production.ts', 'utf8');

    expect(production).toContain('ManufacturingModel');
    expect(production).toContain('operationIds: item.part.operations.map');
    expect(production).not.toMatch(/THREE|mesh UUID|tessellat/i);
  });

  it('keeps postprocessing explicitly disabled until verified machine support exists', () => {
    const production = readFileSync('src/cad/production.ts', 'utf8');
    const panel = readFileSync('src/components/ProductionPlanningPanel.tsx', 'utf8');

    expect(production).toContain("canPostprocess: false");
    expect(production).toContain("emitsMachineMotion: false");
    expect(production).not.toMatch(/G0\\s|G1\\s|M3\\s|M5\\s/);
    expect(panel).toContain('no G-code is emitted');
  });
});
