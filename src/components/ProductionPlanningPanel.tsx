import { useEffect, useMemo, useState } from 'react';
import { Cpu, Download, LayoutGrid, Plus, Trash2 } from 'lucide-react';
import type { ManufacturingModel } from '../cad/manufacturing';
import {
  buildProductionPlan,
  buildToolpathPlan,
  createDefaultProductionConfiguration,
  productionPlanJson,
  type ProductionConfiguration,
  type SheetGrainAxis,
} from '../cad/production';
import {
  productionStockSummary,
  reconcileProductionSelection,
  type ProductionViewSelection,
} from '../cad/productionSelection';
import type { ShopDocumentation } from '../cad/shopDocs';
import { formatDimension, unitLabel, type DisplayUnits } from '../cad/units';
import DimensionInput from './DimensionInput';
import SelectControl from './SelectControl';

type ExportKind = 'csv' | 'html' | 'dxf' | 'svg' | 'json';

type Props = {
  docs: ShopDocumentation;
  manufacturing: ManufacturingModel;
  units: DisplayUnits;
  onSelectPart: (partId: string) => void;
  onExportText: (content: string, suggestedName: string, kind: ExportKind) => void;
};

export default function ProductionPlanningPanel({
  docs,
  manufacturing,
  units,
  onSelectPart,
  onExportText,
}: Props) {
  const defaults = useMemo(() => createDefaultProductionConfiguration(docs), [docs]);
  const [configuration, setConfiguration] = useState<ProductionConfiguration>(defaults);
  const plan = useMemo(
    () => buildProductionPlan(manufacturing, docs, configuration),
    [manufacturing, docs, configuration],
  );
  const toolpathPlan = useMemo(
    () => buildToolpathPlan(plan, manufacturing, configuration),
    [plan, manufacturing, configuration],
  );
  const [selection, setSelection] = useState<ProductionViewSelection>(() =>
    reconcileProductionSelection(plan, { stockId: plan.stocks[0]?.id ?? '', sheetId: '' })
  );

  useEffect(() => {
    setConfiguration(createDefaultProductionConfiguration(docs));
  }, [manufacturing.signature, docs]);

  useEffect(() => {
    setSelection(current => reconcileProductionSelection(plan, current));
  }, [plan]);

  const selectedSummary = productionStockSummary(plan, selection.stockId);
  const selectedStock = selectedSummary?.stock ?? null;
  const selectedSheets = selectedSummary?.sheets ?? [];
  const selectedSheet = selectedSheets.find(sheet => sheet.id === selection.sheetId) ?? selectedSheets[0] ?? null;
  const unassignedParts = plan.unplaced.filter(part => part.stockDefinitionId === null);
  const clearance = Math.max(
    configuration.settings.partSpacingMm,
    configuration.settings.kerfMm,
    configuration.settings.toolDiameterMm,
  );

  function updateSettings(patch: Partial<ProductionConfiguration['settings']>) {
    setConfiguration(current => ({
      ...current,
      settings: { ...current.settings, ...patch },
    }));
  }

  function updateToolDiameter(value: number) {
    setConfiguration(current => ({
      ...current,
      settings: { ...current.settings, toolDiameterMm: value },
      toolLibrary: current.toolLibrary.map((tool, index) =>
        index === 0 ? { ...tool, diameterMm: value } : tool
      ),
    }));
  }

  function updateStock(index: number, patch: Partial<ProductionConfiguration['stocks'][number]>) {
    setConfiguration(current => ({
      ...current,
      stocks: current.stocks.map((stock, candidate) => candidate === index ? { ...stock, ...patch } : stock),
    }));
  }

  function selectStock(stockId: string) {
    setSelection(reconcileProductionSelection(plan, { stockId, sheetId: '' }));
  }

  function addRemnant(stockIndex: number) {
    setConfiguration(current => ({
      ...current,
      stocks: current.stocks.map((stock, candidate) => {
        if (candidate !== stockIndex) return stock;
        const sequence = stock.remnants.length + 1;
        return {
          ...stock,
          remnants: [...stock.remnants, {
            id: stock.id + ':remnant:' + sequence,
            label: 'Remnant ' + sequence,
            widthMm: Math.max(100, stock.widthMm / 2),
            heightMm: Math.max(100, stock.heightMm / 2),
          }],
        };
      }),
    }));
  }

  function updateRemnant(stockIndex: number, remnantIndex: number, patch: { widthMm?: number; heightMm?: number }) {
    setConfiguration(current => ({
      ...current,
      stocks: current.stocks.map((stock, candidate) => candidate === stockIndex ? {
        ...stock,
        remnants: stock.remnants.map((remnant, index) => index === remnantIndex ? { ...remnant, ...patch } : remnant),
      } : stock),
    }));
  }

  function removeRemnant(stockIndex: number, remnantIndex: number) {
    setConfiguration(current => ({
      ...current,
      stocks: current.stocks.map((stock, candidate) => candidate === stockIndex ? {
        ...stock,
        remnants: stock.remnants.filter((_remnant, index) => index !== remnantIndex),
      } : stock),
    }));
  }

  return <div className="production-planning-view">
    <section className="production-assumptions">
      <div><LayoutGrid size={17} /><div><strong>Sheet nesting & production planning</strong><p>Phase 12 nests Phase 11 nominal manufacturing geometry. Stock/tool values below are editable planning inputs and are not persisted into the cabinet file yet.</p></div></div>
      <span>deterministic heuristic · not claimed globally optimal</span>
    </section>

    <section className="production-settings-grid">
      <label><span>Part spacing</span><DimensionInput value={configuration.settings.partSpacingMm} units={units} min={0} onChange={value => updateSettings({ partSpacingMm: value })} /></label>
      <label><span>Kerf allowance</span><DimensionInput value={configuration.settings.kerfMm} units={units} min={0} onChange={value => updateSettings({ kerfMm: value })} /></label>
      <label><span>Primary tool Ø</span><DimensionInput value={configuration.settings.toolDiameterMm} units={units} min={0.1} onChange={updateToolDiameter} /></label>
      <label className="production-toggle"><input type="checkbox" checked={configuration.settings.allowRotation} onChange={event => updateSettings({ allowRotation: event.target.checked })} /><span>Allow 90° rotation when grain permits</span></label>
      <label className="production-toggle"><input type="checkbox" checked={configuration.settings.preferRemnants} onChange={event => updateSettings({ preferRemnants: event.target.checked })} /><span>Prefer remnants before full sheets</span></label>
      <div className="production-clearance"><strong>{formatDimension(clearance, units)} {unitLabel(units)}</strong><span>effective nesting clearance</span></div>
    </section>

    <section className="production-stock-section">
      <h3>Sheet stock definitions</h3>
      {configuration.stocks.length ? <div className="production-stock-table-wrap">
        <div className="production-stock-table" role="table" aria-label="Sheet stock definitions">
          <div className="production-stock-columns" role="row">
            <span role="columnheader">Stock / material</span>
            <span role="columnheader">Width</span>
            <span role="columnheader">Height</span>
            <span role="columnheader">Margin</span>
            <span role="columnheader">Grain</span>
            <span role="columnheader">Qty</span>
            <span role="columnheader">Remnants</span>
          </div>
          {configuration.stocks.map((stock, stockIndex) => <article
            className={'production-stock-row' + (selection.stockId === stock.id ? ' selected' : '')}
            key={stock.id}
            role="rowgroup"
          >
            <div className="production-stock-row-main" role="row">
              <button
                type="button"
                className="production-stock-identity"
                onClick={() => selectStock(stock.id)}
                aria-pressed={selection.stockId === stock.id}
              >
                <strong>{stock.material}</strong>
                <span>{formatDimension(stock.thicknessMm, units)} {unitLabel(units)} stock</span>
                <small>{stock.quantity === null ? 'Unlimited sheets' : stock.quantity + ' sheets max'}</small>
              </button>
              <label><span>Width</span><DimensionInput value={stock.widthMm} units={units} min={100} onChange={value => updateStock(stockIndex, { widthMm: value })} /></label>
              <label><span>Height</span><DimensionInput value={stock.heightMm} units={units} min={100} onChange={value => updateStock(stockIndex, { heightMm: value })} /></label>
              <label><span>Margin</span><DimensionInput value={stock.marginMm} units={units} min={0} onChange={value => updateStock(stockIndex, { marginMm: value })} /></label>
              <label><span>Grain</span><SelectControl
                ariaLabel={'Sheet grain for ' + stock.material}
                value={stock.grainAxis}
                options={[
                  { value: 'x', label: 'Along sheet width (X)' },
                  { value: 'y', label: 'Along sheet height (Y)' },
                  { value: 'none', label: 'No directional grain' },
                ]}
                onChange={value => updateStock(stockIndex, { grainAxis: value as SheetGrainAxis })}
              /></label>
              <label><span>Quantity</span><input className="production-quantity" type="number" min="0" value={stock.quantity ?? ''} placeholder="∞" onChange={event => updateStock(stockIndex, { quantity: event.target.value === '' ? null : Math.max(0, Math.floor(Number(event.target.value) || 0)) })} /></label>
              <div className="production-stock-actions">
                <button type="button" onClick={() => addRemnant(stockIndex)}><Plus size={13} /> Add remnant</button>
              </div>
            </div>
            <div className="production-remnants">
              {stock.remnants.map((remnant, remnantIndex) => <div className="production-remnant-row" key={remnant.id}>
                <span>{remnant.label}</span>
                <DimensionInput value={remnant.widthMm} units={units} min={50} onChange={value => updateRemnant(stockIndex, remnantIndex, { widthMm: value })} />
                <span>×</span>
                <DimensionInput value={remnant.heightMm} units={units} min={50} onChange={value => updateRemnant(stockIndex, remnantIndex, { heightMm: value })} />
                <button type="button" aria-label={'Remove ' + remnant.label} onClick={() => removeRemnant(stockIndex, remnantIndex)}><Trash2 size={13} /></button>
              </div>)}
              {!stock.remnants.length && <small>No remnants entered. Add only stock that is actually available.</small>}
            </div>
          </article>)}
        </div>
      </div> : <p className="shop-empty">No fabricated material groups are available for sheet planning.</p>}
    </section>

    <p className="production-plan-total">
      Overall plan: {plan.placementCount} placed parts across {plan.sheetCount} full sheets and {plan.remnantCount} remnants · {plan.unplaced.length} unplaced.
    </p>

    <section className="production-sheet-toolbar">
      <label className="production-sheet-filter">
        <span>Stock / material</span>
        <SelectControl
          ariaLabel="Production stock material"
          value={selectedStock?.id ?? ''}
          options={plan.stocks.map(stock => ({
            value: stock.id,
            label: stock.material + ' · ' + formatDimension(stock.thicknessMm, units) + ' ' + unitLabel(units),
          }))}
          onChange={selectStock}
          disabled={!plan.stocks.length}
        />
      </label>
      <label className="production-sheet-filter">
        <span>Sheet</span>
        <SelectControl
          ariaLabel="Nested sheet for selected stock"
          value={selectedSheet?.id ?? ''}
          options={selectedSheets.map(sheet => ({
            value: sheet.id,
            label: sheet.label + ' · ' + (sheet.utilization * 100).toFixed(1) + '%',
          }))}
          onChange={sheetId => setSelection(current => ({ ...current, sheetId }))}
          disabled={!selectedSheets.length}
        />
      </label>
      <div className="production-sheet-actions">
        <button type="button" onClick={() => onExportText(productionPlanJson(plan), 'production-plan.json', 'json')}><Download size={13} /> Plan JSON</button>
        {selectedSheet && <>
          <button type="button" onClick={() => onExportText(selectedSheet.dxf, safeName(selectedSheet.label) + '.dxf', 'dxf')}><Download size={13} /> Sheet DXF</button>
          <button type="button" onClick={() => onExportText(selectedSheet.svg, safeName(selectedSheet.label) + '.svg', 'svg')}><Download size={13} /> Sheet SVG</button>
          <button type="button" onClick={() => onExportText(selectedSheet.registrationJson, safeName(selectedSheet.label) + '-registration.json', 'json')}><Download size={13} /> Registration</button>
        </>}
      </div>
    </section>

    {selectedSummary && <section className="production-selected-stock-summary" aria-live="polite">
      <header>
        <div><strong>{selectedSummary.stock.material}</strong><span>{formatDimension(selectedSummary.stock.thicknessMm, units)} {unitLabel(units)} stock</span></div>
        <small>{selectedSummary.sheets.length ? selectedSummary.sheets.length + ' used stock piece' + (selectedSummary.sheets.length === 1 ? '' : 's') : 'No placed sheets for this stock'}</small>
      </header>
      <div className="production-summary-grid">
        <article><strong>{selectedSummary.placementCount}</strong><span>placed parts</span></article>
        <article><strong>{selectedSummary.fullSheetCount}</strong><span>full sheets</span></article>
        <article><strong>{selectedSummary.remnantCount}</strong><span>remnants used</span></article>
        <article><strong>{(selectedSummary.utilization * 100).toFixed(1)}%</strong><span>usable-area utilization</span></article>
        <article className={selectedSummary.unplaced.length ? 'warning' : ''}><strong>{selectedSummary.unplaced.length}</strong><span>unplaced for stock</span></article>
      </div>
    </section>}

    {!!selectedSummary?.unplaced.length && <section className="production-unplaced">
      <h3>Unplaced for selected stock</h3>
      {selectedSummary.unplaced.map(part => <button type="button" key={part.partId} onClick={() => onSelectPart(part.partId)}>
        <strong>{part.partNumber}</strong><span>{part.reason}</span>
      </button>)}
    </section>}

    {!!unassignedParts.length && <section className="production-unplaced">
      <h3>Parts without compatible stock</h3>
      {unassignedParts.map(part => <button type="button" key={part.partId} onClick={() => onSelectPart(part.partId)}>
        <strong>{part.partNumber}</strong><span>{part.material} · {formatDimension(part.thicknessMm, units)} {unitLabel(units)} · {part.reason}</span>
      </button>)}
    </section>}

    {selectedSheet ? <div className="production-sheet-review">
      <section className="production-sheet-preview">
        <header><div><strong>{selectedSheet.label}</strong><span>{selectedSheet.material} · {formatDimension(selectedSheet.thicknessMm, units)} {unitLabel(units)} · {selectedSheet.source}</span></div><small>{selectedSheet.placements.length} parts · {(selectedSheet.utilization * 100).toFixed(1)}% usable area</small></header>
        <img src={svgDataUri(selectedSheet.svg)} alt={'Nested sheet preview for ' + selectedSheet.label} />
      </section>
      <section className="production-placement-list">
        <h3>Placements</h3>
        {selectedSheet.placements.map(placement => <button type="button" key={placement.id} onClick={() => onSelectPart(placement.partId)}>
          <div><strong>{placement.partNumber}</strong><span>{placement.partId}</span></div>
          <small>{formatDimension(placement.xMm, units)}, {formatDimension(placement.yMm, units)} {unitLabel(units)} · {placement.rotationDeg}° · {placement.operationIds.length} ops</small>
        </button>)}
      </section>
    </div> : selectedStock
      ? <p className="production-stock-empty">No sheet placements are available for {selectedStock.material} at {formatDimension(selectedStock.thicknessMm, units)} {unitLabel(units)}. Review its quantity, size, margin, grain, and unplaced parts above.</p>
      : <p className="shop-empty">No valid stock definitions are available for production planning.</p>}

    <section className="production-machine-boundary">
      <div><Cpu size={18} /><div><strong>{configuration.machineProfile.label}</strong><p>{toolpathPlan.message}</p></div></div>
      <div className="production-machine-facts">
        <span>{toolpathPlan.operations.length} registered toolpath operations</span>
        <span>{toolpathPlan.unsupportedOperationIds.length} not postprocessable</span>
        <span>post: {configuration.postprocessor.label}</span>
      </div>
      <p>Tool assignments and inside/outside/center compensation intent are registered downstream of nesting, but no G-code is emitted in this slice. A verified machine/postprocessor and real compensated path generator are still required.</p>
    </section>
  </div>;
}

function svgDataUri(svg: string) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function safeName(value: string) {
  return value.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-') || 'sheet';
}
