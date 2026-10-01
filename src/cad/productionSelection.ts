import type { NestedSheet, ProductionPlan, SheetStockDefinition, UnplacedPart } from './production';

export type ProductionViewSelection = {
  stockId: string;
  sheetId: string;
};

export type ProductionStockSummary = {
  stock: SheetStockDefinition;
  sheets: NestedSheet[];
  unplaced: UnplacedPart[];
  placementCount: number;
  fullSheetCount: number;
  remnantCount: number;
  totalUsedAreaMm2: number;
  totalUsableAreaMm2: number;
  utilization: number;
};

export function sheetsForStock(plan: ProductionPlan, stockId: string) {
  return plan.sheets.filter(sheet => sheet.stockDefinitionId === stockId);
}

export function reconcileProductionSelection(
  plan: ProductionPlan,
  current: ProductionViewSelection,
): ProductionViewSelection {
  if (!plan.stocks.length) return { stockId: '', sheetId: '' };

  const retainedStock = plan.stocks.some(stock => stock.id === current.stockId);
  const stockId = retainedStock
    ? current.stockId
    : plan.sheets[0]?.stockDefinitionId ?? plan.stocks[0].id;
  const sheets = sheetsForStock(plan, stockId);
  const retainedSheet = sheets.some(sheet => sheet.id === current.sheetId);

  return {
    stockId,
    sheetId: retainedSheet ? current.sheetId : sheets[0]?.id ?? '',
  };
}

export function productionStockSummary(
  plan: ProductionPlan,
  stockId: string,
): ProductionStockSummary | null {
  const stock = plan.stocks.find(candidate => candidate.id === stockId);
  if (!stock) return null;

  const sheets = sheetsForStock(plan, stockId);
  const unplaced = plan.unplaced.filter(part => part.stockDefinitionId === stockId);
  const totalUsedAreaMm2 = sheets.reduce((sum, sheet) => sum + sheet.usedAreaMm2, 0);
  const totalUsableAreaMm2 = sheets.reduce((sum, sheet) => sum + sheet.usableAreaMm2, 0);

  return {
    stock,
    sheets,
    unplaced,
    placementCount: sheets.reduce((sum, sheet) => sum + sheet.placements.length, 0),
    fullSheetCount: sheets.filter(sheet => sheet.source === 'sheet').length,
    remnantCount: sheets.filter(sheet => sheet.source === 'remnant').length,
    totalUsedAreaMm2,
    totalUsableAreaMm2,
    utilization: totalUsableAreaMm2 > 0 ? totalUsedAreaMm2 / totalUsableAreaMm2 : 0,
  };
}
