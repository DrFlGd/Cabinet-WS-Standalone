import { describe, expect, it } from 'vitest';
import { buildCabinetDocument } from './cabinetModel';
import { analyzeDesignHealth } from './designHealth';
import { buildManufacturingModel } from './manufacturing';
import { buildProductionPlan, createDefaultProductionConfiguration } from './production';
import {
  productionStockSummary,
  reconcileProductionSelection,
  sheetsForStock,
} from './productionSelection';
import { buildShopDocumentation } from './shopDocs';
import { utilityStarter } from './utilityStarters';

function multiStockFixture() {
  const document = buildCabinetDocument(utilityStarter('default').parameters);
  const health = analyzeDesignHealth(document, { kernelStatus: 'ready' });
  const docs = buildShopDocumentation(document, health);
  const manufacturing = buildManufacturingModel(document, docs, health);
  const configuration = createDefaultProductionConfiguration(docs);
  const plan = buildProductionPlan(manufacturing, docs, configuration);
  expect(plan.stocks.length).toBeGreaterThanOrEqual(2);
  return { plan, configuration, docs, manufacturing };
}

describe('production stock selection', () => {
  it('switches between distinct material/thickness stocks without crossing sheet groups', () => {
    const { plan } = multiStockFixture();
    const firstStock = plan.stocks[0];
    const secondStock = plan.stocks[1];

    const first = reconcileProductionSelection(plan, { stockId: firstStock.id, sheetId: '' });
    const second = reconcileProductionSelection(plan, { stockId: secondStock.id, sheetId: first.sheetId });

    expect(first.stockId).toBe(firstStock.id);
    expect(second.stockId).toBe(secondStock.id);
    expect(sheetsForStock(plan, second.stockId).every(sheet => sheet.stockDefinitionId === secondStock.id)).toBe(true);
    if (second.sheetId) {
      expect(plan.sheets.find(sheet => sheet.id === second.sheetId)?.stockDefinitionId).toBe(secondStock.id);
    }
  });

  it('keeps an empty selected stock instead of falling back to another material layout', () => {
    const { plan } = multiStockFixture();
    const emptyStock = plan.stocks[1];
    const withoutSelectedSheets = {
      ...plan,
      sheets: plan.sheets.filter(sheet => sheet.stockDefinitionId !== emptyStock.id),
    };

    const selection = reconcileProductionSelection(withoutSelectedSheets, {
      stockId: emptyStock.id,
      sheetId: plan.sheets[0]?.id ?? '',
    });

    expect(selection).toEqual({ stockId: emptyStock.id, sheetId: '' });
    expect(sheetsForStock(withoutSelectedSheets, selection.stockId)).toEqual([]);
  });

  it('moves to a valid stock when the selected stock is removed during replanning', () => {
    const { plan } = multiStockFixture();
    const removed = plan.stocks[0];
    const remainingStocks = plan.stocks.slice(1);
    const replanned = {
      ...plan,
      stocks: remainingStocks,
      sheets: plan.sheets.filter(sheet => sheet.stockDefinitionId !== removed.id),
      unplaced: plan.unplaced.filter(part => part.stockDefinitionId !== removed.id),
    };

    const selection = reconcileProductionSelection(replanned, {
      stockId: removed.id,
      sheetId: plan.sheets.find(sheet => sheet.stockDefinitionId === removed.id)?.id ?? '',
    });

    expect(remainingStocks.some(stock => stock.id === selection.stockId)).toBe(true);
    expect(selection.sheetId
      ? replanned.sheets.find(sheet => sheet.id === selection.sheetId)?.stockDefinitionId
      : selection.stockId
    ).toBe(selection.stockId);
  });

  it('reports selected-stock placements, sheets, utilization, and unplaced parts from the same stock id', () => {
    const { plan } = multiStockFixture();
    const stock = plan.stocks.find(candidate => sheetsForStock(plan, candidate.id).length > 0)!;
    const summary = productionStockSummary(plan, stock.id)!;

    expect(summary.stock.id).toBe(stock.id);
    expect(summary.sheets.every(sheet => sheet.stockDefinitionId === stock.id)).toBe(true);
    expect(summary.placementCount).toBe(summary.sheets.reduce((sum, sheet) => sum + sheet.placements.length, 0));
    expect(summary.fullSheetCount).toBe(summary.sheets.filter(sheet => sheet.source === 'sheet').length);
    expect(summary.remnantCount).toBe(summary.sheets.filter(sheet => sheet.source === 'remnant').length);
    expect(summary.unplaced.every(part => part.stockDefinitionId === stock.id)).toBe(true);
  });

  it('does not combine incompatible material or thickness definitions', () => {
    const { docs, manufacturing, configuration } = multiStockFixture();
    const first = configuration.stocks[0];
    configuration.stocks = [{ ...first, material: first.material + ' incompatible' }];

    const plan = buildProductionPlan(manufacturing, docs, configuration);

    expect(plan.sheets.every(sheet => sheet.stockDefinitionId === first.id)).toBe(true);
    expect(plan.sheets.every(sheet => sheet.material === first.material + ' incompatible')).toBe(true);
    expect(plan.unplaced.some(part => part.material === first.material && part.stockDefinitionId === null)).toBe(true);
  });
});
