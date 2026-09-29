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
  const [selectedSheetId, setSelectedSheetId] = useState(plan.sheets[0]?.id ?? '');

  useEffect(() => {
    setConfiguration(createDefaultProductionConfiguration(docs));
  }, [manufacturing.signature, docs]);

  useEffect(() => {
    if (!plan.sheets.some(sheet => sheet.id === selectedSheetId)) {
      setSelectedSheetId(plan.sheets[0]?.id ?? '');
    }
  }, [plan.sheets, selectedSheetId]);

  const selectedSheet = plan.sheets.find(sheet => sheet.id === selectedSheetId) ?? plan.sheets[0] ?? null;
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
      <div className="production-stock-grid">{configuration.stocks.map((stock, stockIndex) => <article key={stock.id}>
        <header><div><strong>{stock.material}</strong><span>{formatDimension(stock.thicknessMm, units)} {unitLabel(units)} stock</span></div><small>{stock.quantity === null ? 'unlimited planning sheets' : stock.quantity + ' sheets max'}</small></header>
        <div className="production-stock-fields">
          <label><span>Sheet width</span><DimensionInput value={stock.widthMm} units={units} min={100} onChange={value => updateStock(stockIndex, { widthMm: value })} /></label>
          <label><span>Sheet height</span><DimensionInput value={stock.heightMm} units={units} min={100} onChange={value => updateStock(stockIndex, { heightMm: value })} /></label>
          <label><span>Margin</span><DimensionInput value={stock.marginMm} units={units} min={0} onChange={value => updateStock(stockIndex, { marginMm: value })} /></label>
          <label><span>Sheet grain</span><SelectControl
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
        </div>
        <div className="production-remnants">
          <div className="production-remnant-heading"><strong>Remnants</strong><button type="button" onClick={() => addRemnant(stockIndex)}><Plus size={12} /> Add remnant</button></div>
          {stock.remnants.map((remnant, remnantIndex) => <div className="production-remnant-row" key={remnant.id}>
            <span>{remnant.label}</span>
            <DimensionInput value={remnant.widthMm} units={units} min={50} onChange={value => updateRemnant(stockIndex, remnantIndex, { widthMm: value })} />
            <span>×</span>
            <DimensionInput value={remnant.heightMm} units={units} min={50} onChange={value => updateRemnant(stockIndex, remnantIndex, { heightMm: value })} />
            <button type="button" aria-label={'Remove ' + remnant.label} onClick={() => removeRemnant(stockIndex, remnantIndex)}><Trash2 size={12} /></button>
          </div>)}
          {!stock.remnants.length && <small>No remnants entered. Add only stock that is actually available.</small>}
        </div>
      </article>)}</div>
    </section>

    <section className="production-summary-grid">
      <article><strong>{plan.placementCount}</strong><span>placed parts</span></article>
      <article><strong>{plan.sheetCount}</strong><span>full sheets</span></article>
      <article><strong>{plan.remnantCount}</strong><span>remnants used</span></article>
      <article><strong>{(plan.overallUtilization * 100).toFixed(1)}%</strong><span>usable-area utilization</span></article>
      <article className={plan.unplaced.length ? 'warning' : ''}><strong>{plan.unplaced.length}</strong><span>unplaced parts</span></article>
    </section>

    {plan.unplaced.length > 0 && <section className="production-unplaced">
      <h3>Unplaced parts</h3>
      {plan.unplaced.map(part => <button type="button" key={part.partId} onClick={() => onSelectPart(part.partId)}>
        <strong>{part.partNumber}</strong><span>{part.reason}</span>
      </button>)}
    </section>}

    <section className="production-sheet-toolbar">
      <SelectControl
        ariaLabel="Nested sheet"
        value={selectedSheet?.id ?? ''}
        options={plan.sheets.map(sheet => ({
          value: sheet.id,
          label: sheet.label + ' · ' + (sheet.utilization * 100).toFixed(1) + '%',
        }))}
        onChange={setSelectedSheetId}
        disabled={!plan.sheets.length}
      />
      <button type="button" onClick={() => onExportText(productionPlanJson(plan), 'production-plan.json', 'json')}><Download size={13} /> Plan JSON</button>
      {selectedSheet && <>
        <button type="button" onClick={() => onExportText(selectedSheet.dxf, safeName(selectedSheet.label) + '.dxf', 'dxf')}><Download size={13} /> Sheet DXF</button>
        <button type="button" onClick={() => onExportText(selectedSheet.svg, safeName(selectedSheet.label) + '.svg', 'svg')}><Download size={13} /> Sheet SVG</button>
        <button type="button" onClick={() => onExportText(selectedSheet.registrationJson, safeName(selectedSheet.label) + '-registration.json', 'json')}><Download size={13} /> Registration</button>
      </>}
    </section>

    {selectedSheet ? <div className="production-sheet-review">
      <section className="production-sheet-preview">
        <header><div><strong>{selectedSheet.label}</strong><span>{selectedSheet.material} · {formatDimension(selectedSheet.thicknessMm, units)} {unitLabel(units)} · {selectedSheet.source}</span></div><small>{selectedSheet.placements.length} parts · {(selectedSheet.utilization * 100).toFixed(1)}% usable area</small></header>
        <img src={svgDataUri(selectedSheet.svg)} alt={'Nested sheet preview for ' + selectedSheet.label} />
      </section>
      <section className="production-placement-list">
        <h3>Semantic placements</h3>
        {selectedSheet.placements.map(placement => <button type="button" key={placement.id} onClick={() => onSelectPart(placement.partId)}>
          <div><strong>{placement.partNumber}</strong><span>{placement.partId}</span></div>
          <small>{formatDimension(placement.xMm, units)}, {formatDimension(placement.yMm, units)} {unitLabel(units)} · {placement.rotationDeg}° · {placement.operationIds.length} ops</small>
        </button>)}
      </section>
    </div> : <p className="shop-empty">No valid sheet placements are available for the current stock definitions.</p>}

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
