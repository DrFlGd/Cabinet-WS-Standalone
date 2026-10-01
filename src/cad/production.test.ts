import { describe, expect, it } from 'vitest';
import { buildCabinetDocument } from './cabinetModel';
import { analyzeDesignHealth } from './designHealth';
import { buildManufacturingModel } from './manufacturing';
import {
  buildProductionPlan,
  buildToolpathPlan,
  createDefaultProductionConfiguration,
  productionPlanJson,
} from './production';
import { buildShopDocumentation } from './shopDocs';
import { utilityStarter } from './utilityStarters';

function fixture(starterId = 'default') {
  const document = buildCabinetDocument(utilityStarter(starterId).parameters);
  const health = analyzeDesignHealth(document, { kernelStatus: 'ready' });
  const docs = buildShopDocumentation(document, health);
  const manufacturing = buildManufacturingModel(document, docs, health);
  const configuration = createDefaultProductionConfiguration(docs);
  return { document, health, docs, manufacturing, configuration };
}

describe('Phase 12 production planning', () => {
  it('creates explicit sheet stock definitions for semantic material groups', () => {
    const { docs, configuration } = fixture();

    const compatibilityKeys = new Set(docs.materialGroups.map(group =>
      group.material + '|' + group.thickness.toFixed(4)
    ));
    expect(configuration.stocks.length).toBe(compatibilityKeys.size);
    expect(new Set(configuration.stocks.map(stock =>
      stock.material + '|' + stock.thicknessMm.toFixed(4)
    )).size).toBe(configuration.stocks.length);
    expect(configuration.stocks.every(stock => stock.widthMm > 0 && stock.heightMm > 0)).toBe(true);
    expect(configuration.stocks.every(stock => stock.marginMm >= 0)).toBe(true);
    expect(configuration.stocks.some(stock => stock.grainAxis === 'x')).toBe(true);
    expect(configuration.postprocessor.emitsMachineMotion).toBe(false);
  });

  it('produces deterministic grain-aware placements with semantic registration', () => {
    const { docs, manufacturing, configuration } = fixture();
    const first = buildProductionPlan(manufacturing, docs, configuration);
    const second = buildProductionPlan(manufacturing, docs, configuration);

    expect(first.signature).toBe(second.signature);
    expect(first.placementCount).toBe(manufacturing.parts.length);
    expect(first.unplaced).toEqual([]);
    expect(first.sheets.length).toBeGreaterThan(0);

    const placement = first.sheets.flatMap(sheet => sheet.placements)
      .find(candidate => candidate.partId === 'carcass:left')!;
    const part = manufacturing.parts.find(candidate => candidate.partId === 'carcass:left')!;

    expect(placement.partNumber).toBe(part.partNumber);
    expect(placement.operationIds).toEqual(part.operations.map(operation => operation.id));
    expect(placement.rotationDeg).toBe(90);
  });

  it('blocks a grain-required 90 degree orientation when rotation is disabled', () => {
    const { docs, manufacturing, configuration } = fixture();
    configuration.settings.allowRotation = false;
    const plan = buildProductionPlan(manufacturing, docs, configuration);

    expect(plan.unplaced.some(part =>
      part.partId === 'carcass:left'
      && part.reason.toLowerCase().includes('grain')
    )).toBe(true);
  });

  it('prefers available remnants before full sheets', () => {
    const { docs, manufacturing, configuration } = fixture();
    const stock = configuration.stocks[0];
    stock.remnants.push({
      id: 'remnant:test-large',
      label: 'Test large remnant',
      widthMm: stock.widthMm,
      heightMm: stock.heightMm,
    });
    configuration.settings.preferRemnants = true;

    const plan = buildProductionPlan(manufacturing, docs, configuration);
    expect(plan.sheets.some(sheet => sheet.source === 'remnant')).toBe(true);
    expect(plan.remnantCount).toBeGreaterThan(0);
  });

  it('uses multiple sheets when stock capacity requires it', () => {
    const { docs, manufacturing, configuration } = fixture('utility_4_drawer_base');
    for (const stock of configuration.stocks) {
      stock.widthMm = 1000;
      stock.heightMm = 700;
      stock.marginMm = 8;
      stock.quantity = null;
    }

    const plan = buildProductionPlan(manufacturing, docs, configuration);
    expect(plan.sheetCount).toBeGreaterThan(1);
    expect(plan.placementCount + plan.unplaced.length).toBe(manufacturing.parts.length);
  });

  it('reserves at least the largest spacing, kerf or tool-diameter clearance between placed rectangles', () => {
    const { docs, manufacturing, configuration } = fixture('utility_4_drawer_base');
    configuration.settings.partSpacingMm = 4;
    configuration.settings.kerfMm = 3.2;
    configuration.settings.toolDiameterMm = 12;
    const clearance = 12;

    const plan = buildProductionPlan(manufacturing, docs, configuration);
    for (const sheet of plan.sheets) {
      for (let i = 0; i < sheet.placements.length; i += 1) {
        for (let j = i + 1; j < sheet.placements.length; j += 1) {
          const a = sheet.placements[i];
          const b = sheet.placements[j];
          const horizontalGap = Math.max(b.xMm - (a.xMm + a.widthMm), a.xMm - (b.xMm + b.widthMm));
          const verticalGap = Math.max(b.yMm - (a.yMm + a.heightMm), a.yMm - (b.yMm + b.heightMm));
          expect(horizontalGap >= clearance - 0.01 || verticalGap >= clearance - 0.01).toBe(true);
        }
      }
    }
  });

  it('exports true-scale sheet SVG/DXF with labels and operation registration', () => {
    const { docs, manufacturing, configuration } = fixture();
    const plan = buildProductionPlan(manufacturing, docs, configuration);
    const sheet = plan.sheets[0];

    expect(sheet.svg).toContain('data-units="mm"');
    expect(sheet.svg).toContain('data-scale="1"');
    expect(sheet.svg).toContain('data-operation-id=');
    expect(sheet.svg).toContain('part-label');
    expect(sheet.dxf).toContain('$INSUNITS');
    expect(sheet.dxf).toContain('\r\n70\r\n4\r\n');
    expect(sheet.dxf).toContain('LABELS');

    const registration = JSON.parse(sheet.registrationJson);
    expect(registration.schema).toBe('cabinet-ws-sheet-registration-v1');
    expect(registration.placements[0].partId).toBeTruthy();
    expect(registration.placements[0].operationIds.length).toBeGreaterThan(0);
  });

  it('keeps plan JSON compact while preserving stock and placement transforms', () => {
    const { docs, manufacturing, configuration } = fixture();
    const plan = buildProductionPlan(manufacturing, docs, configuration);
    const parsed = JSON.parse(productionPlanJson(plan));

    expect(parsed.manufacturingSignature).toBe(manufacturing.signature);
    expect(parsed.summary.placementCount).toBe(plan.placementCount);
    expect(parsed.sheets[0].placements[0]).toEqual(expect.objectContaining({
      partId: expect.any(String),
      xMm: expect.any(Number),
      yMm: expect.any(Number),
      rotationDeg: expect.any(Number),
      operationIds: expect.any(Array),
    }));
    expect(parsed.sheets[0].svg).toBeUndefined();
    expect(parsed.sheets[0].dxf).toBeUndefined();
  });

  it('builds downstream tool/compensation registration without emitting G-code', () => {
    const { docs, manufacturing, configuration } = fixture();
    const plan = buildProductionPlan(manufacturing, docs, configuration);
    const toolpaths = buildToolpathPlan(plan, manufacturing, configuration);

    expect(toolpaths.canPostprocess).toBe(false);
    expect(toolpaths.postprocessor.emitsMachineMotion).toBe(false);
    expect(toolpaths.operations.length).toBeGreaterThan(0);
    expect(toolpaths.operations.some(operation => operation.compensation === 'outside')).toBe(true);
    expect(toolpaths.operations.some(operation => operation.compensation === 'inside')).toBe(true);
    expect(toolpaths.message).toMatch(/does not emit G-code/i);
  });
});
