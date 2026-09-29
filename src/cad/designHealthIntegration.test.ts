import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Phase 9 integration boundaries', () => {
  it('runs Design Health from the semantic document and exact-kernel diagnostics', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    const health = readFileSync('src/cad/designHealth.ts', 'utf8');

    expect(app).toContain('analyzeDesignHealth(cadDocument');
    expect(app).toContain('kernelDiagnostics: kernel.diagnostics');
    expect(app).toContain('kernelStatus: kernel.status');
    expect(health).toContain('buildFeatureGraph(document)');
    expect(health).toContain('hardwareCompatibility');
    expect(health).toContain('sectionLayoutErrors');
    expect(health).not.toMatch(/OpenSCAD|ECHO:/);
  });

  it('applies solved targets through one undoable editor-history operation', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    const panel = readFileSync('src/components/DesignHealthPanel.tsx', 'utf8');

    expect(app).toContain('function applyFitSolution(solution: FitSolution)');
    expect(app).toContain('history.edit(current => ({');
    expect(app).toContain('...solution.patch');
    expect(panel).toContain('Apply solved result');
    expect(panel).toContain('How this result was calculated');
    expect(panel).toContain('one undoable operation');
  });
});
