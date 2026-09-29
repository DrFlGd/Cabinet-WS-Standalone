import { describe, expect, it } from 'vitest';
import { buildCabinetDocument } from './cabinetModel';
import { analyzeDesignHealth } from './designHealth';
import {
  buildAssemblyPacketHtml,
  buildCutListReportHtml,
  buildShopDocumentation,
  cutListCsv,
  hardwareCsv,
  stablePartNumber,
} from './shopDocs';
import { utilityStarter } from './utilityStarters';

describe('Phase 10 shop documentation', () => {
  it('assigns deterministic unique part numbers from semantic IDs', () => {
    const document = buildCabinetDocument(utilityStarter('utility_wide_mixed_base').parameters);
    const docs = buildShopDocumentation(document, analyzeDesignHealth(document, { kernelStatus: 'ready' }));
    const numbers = docs.bom.map(row => row.partNumber);

    expect(new Set(numbers).size).toBe(numbers.length);
    expect(docs.bom.find(row => row.partId === 'carcass:left')?.partNumber).toBe('C-L');
    expect(stablePartNumber({ id: 'drawer:2:box:right', category: 'drawer' })).toBe('D-02-BX-R');
    expect(stablePartNumber({ id: 'door:1', category: 'front' })).toBe('F-DR-01');
  });

  it('builds fabricated cut-list rows with finished/blank dimensions, grain, edge banding and machining', () => {
    const parameters = {
      ...utilityStarter('utility_door_base').parameters,
      joineryStyle: 'dado' as const,
      shelfCount: 2,
      shelfStyle: 'adjustable' as const,
      hingeStyle: 'euro_35mm' as const,
    };
    const document = buildCabinetDocument(parameters);
    const docs = buildShopDocumentation(document, analyzeDesignHealth(document, { kernelStatus: 'ready' }));

    const left = docs.bom.find(row => row.partId === 'carcass:left')!;
    const shelf = docs.bom.find(row => row.category === 'shelf')!;
    const door = docs.bom.find(row => row.partId === 'door:1')!;

    expect(left.blank).toEqual(left.finished);
    expect(left.grainDirection).not.toBe('none');
    expect(left.edgeBanding).toContain('front');
    expect(left.machining.length).toBeGreaterThan(0);
    expect(shelf.edgeBanding).toEqual(['front']);
    expect(door.edgeBanding).toEqual(['perimeter']);
    expect(docs.operationCount).toBeGreaterThan(0);
  });

  it('groups materials and includes purchased hardware quantities', () => {
    const document = buildCabinetDocument({
      ...utilityStarter('utility_3_drawer_base').parameters,
      drawerMount: 'metal_slides',
    });
    const docs = buildShopDocumentation(document, analyzeDesignHealth(document, { kernelStatus: 'ready' }));

    expect(docs.materialGroups.length).toBeGreaterThan(0);
    expect(docs.materialGroups.reduce((sum, group) => sum + group.partCount, 0)).toBe(docs.bom.length);
    expect(docs.hardware.some(row => row.quantity >= 2 && row.instanceIds.some(id => id.startsWith('hardware:slide:')))).toBe(true);
  });

  it('creates ordered assembly groups with stable part callouts', () => {
    const document = buildCabinetDocument({
      ...utilityStarter('utility_wide_mixed_base').parameters,
      faceFrameStyle: 'full',
      includeWorktop: true,
    });
    const docs = buildShopDocumentation(document, analyzeDesignHealth(document, { kernelStatus: 'ready' }));

    expect(docs.assemblySteps[0].id).toBe('carcass');
    expect(docs.assemblySteps.some(step => step.id === 'back-frame')).toBe(true);
    expect(docs.assemblySteps.some(step => step.id === 'worktop')).toBe(true);
    for (const step of docs.assemblySteps) {
      expect(step.order).toBeGreaterThan(0);
      expect(step.partNumbers.length).toBe(step.partIds.length);
      expect(step.partNumbers.every(Boolean)).toBe(true);
    }
  });

  it('exports millimeter-native CSV reports with semantic identity', () => {
    const document = buildCabinetDocument(utilityStarter('default').parameters);
    const docs = buildShopDocumentation(document, analyzeDesignHealth(document, { kernelStatus: 'ready' }));
    const cutCsv = cutListCsv(docs);
    const hwCsv = hardwareCsv(docs);

    expect(cutCsv).toContain('PART_NUMBER');
    expect(cutCsv).toContain('SEMANTIC_ID');
    expect(cutCsv).toContain('FINISHED_X_MM');
    expect(cutCsv).toContain('BLANK_X_MM');
    expect(cutCsv).toContain('carcass:left');
    expect(hwCsv).toContain('VERIFICATION');
  });

  it('builds printable BOM and assembly HTML without OpenSCAD report parsing', () => {
    const document = buildCabinetDocument({
      ...utilityStarter('utility_door_base').parameters,
      hingeStyle: 'euro_35mm',
    });
    const health = analyzeDesignHealth(document, { kernelStatus: 'ready' });
    const docs = buildShopDocumentation(document, health);
    const cutHtml = buildCutListReportHtml(document, docs, 'mm');
    const assemblyHtml = buildAssemblyPacketHtml(document, docs, 'mm');

    expect(cutHtml).toContain('BOM & cut list');
    expect(cutHtml).toContain('Material grouping');
    expect(cutHtml).toContain('Machining summary');
    expect(assemblyHtml).toContain('Exploded assembly guide');
    expect(assemblyHtml).toContain('Hardware checklist');
    expect(assemblyHtml).toContain('<svg');
    expect(cutHtml + assemblyHtml).not.toMatch(/ECHO:|OpenSCAD report/);
  });
});
