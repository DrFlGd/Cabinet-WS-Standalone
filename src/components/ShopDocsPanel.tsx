import { useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardCheck, ClipboardList, Download, ExternalLink, Layers3, PackageCheck, X } from 'lucide-react';
import type { ManufacturingModel, ManufacturingOperationKind } from '../cad/manufacturing';
import { operationLayerSvg } from '../cad/manufacturing';
import type { ShopDocumentation } from '../cad/shopDocs';
import type { CabinetDocument } from '../cad/types';
import { formatDimension, unitLabel, type DisplayUnits } from '../cad/units';
import SelectControl from './SelectControl';

type Props = {
  document: CabinetDocument;
  docs: ShopDocumentation;
  manufacturing: ManufacturingModel;
  units: DisplayUnits;
  selectedId: string | null;
  onClose: () => void;
  onSelectPart: (partId: string) => void;
  onSelectParts: (partIds: string[]) => void;
  onExplodeAssembly: () => void;
  onResetAssembly: () => void;
  onExportCutListCsv: () => void;
  onExportHardwareCsv: () => void;
  onExportCutListReport: () => void;
  onExportAssemblyPacket: () => void;
  onExportManufacturingPart: (partId: string, kind: 'dxf' | 'svg' | 'drilling' | 'metadata') => void;
  onExportManufacturingLayer: (partId: string, kind: ManufacturingOperationKind) => void;
  onExportManufacturingPackage: (reviewedAt: string) => void;
};

type Tab = 'bom' | 'assembly' | 'manufacturing';
type LayerChoice = 'all' | ManufacturingOperationKind;

const layerChoices: LayerChoice[] = ['all', 'CUT', 'POCKET', 'DADO_GROOVE', 'DRILL', 'ENGRAVE', 'EDGE'];

export default function ShopDocsPanel({
  document,
  docs,
  manufacturing,
  units,
  selectedId,
  onClose,
  onSelectPart,
  onSelectParts,
  onExplodeAssembly,
  onResetAssembly,
  onExportCutListCsv,
  onExportHardwareCsv,
  onExportCutListReport,
  onExportAssemblyPacket,
  onExportManufacturingPart,
  onExportManufacturingLayer,
  onExportManufacturingPackage,
}: Props) {
  const [tab, setTab] = useState<Tab>('bom');
  const [query, setQuery] = useState('');
  const [manufacturingPartId, setManufacturingPartId] = useState(manufacturing.parts[0]?.partId ?? '');
  const [layer, setLayer] = useState<LayerChoice>('all');
  const [reviewedSignature, setReviewedSignature] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs.bom;
    return docs.bom.filter(row => [row.partNumber, row.partId, row.name, row.category, row.material, row.machining.join(' ')]
      .join(' ').toLowerCase().includes(q));
  }, [docs.bom, query]);

  const selectedManufacturingPart = useMemo(() =>
    manufacturing.parts.find(part => part.partId === manufacturingPartId) ?? manufacturing.parts[0] ?? null,
  [manufacturing.parts, manufacturingPartId]);

  useEffect(() => {
    setReviewedSignature(null);
  }, [manufacturing.signature]);

  useEffect(() => {
    if (!selectedId) return;
    if (tab === 'bom') rowRefs.current.get(selectedId)?.scrollIntoView({ block: 'nearest' });
    if (tab === 'manufacturing' && manufacturing.parts.some(part => part.partId === selectedId)) {
      setManufacturingPartId(selectedId);
    }
  }, [selectedId, tab, manufacturing.parts]);

  const hardwareUnits = docs.hardware.reduce((sum, row) => sum + row.quantity, 0);
  const reviewed = reviewedSignature === manufacturing.signature;
  const packageBlocked = manufacturing.readiness === 'blocked';
  const previewSvg = selectedManufacturingPart
    ? layer === 'all'
      ? selectedManufacturingPart.svg
      : operationLayerSvg(selectedManufacturingPart, layer)
    : '';

  return <div className="shop-docs-backdrop" role="presentation" onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="shop-docs-dialog" role="dialog" aria-modal="true" aria-label="Shop documentation">
      <header className="shop-docs-header">
        <ClipboardList size={18} />
        <div><strong>Shop Documentation</strong><span>{document.name} · Phase 11 semantic manufacturing</span></div>
        <div className={'shop-readiness ' + manufacturing.readiness}>{manufacturing.readiness}</div>
        <button type="button" onClick={onClose} aria-label="Close shop documentation"><X size={17} /></button>
      </header>

      <div className="shop-docs-summary">
        <div><strong>{docs.bom.length}</strong><span>fabricated parts</span></div>
        <div><strong>{docs.materialGroups.length}</strong><span>material groups</span></div>
        <div><strong>{hardwareUnits}</strong><span>hardware units</span></div>
        <div><strong>{Object.values(manufacturing.operationCounts).reduce((sum, count) => sum + count, 0)}</strong><span>manufacturing operations</span></div>
      </div>

      <nav className="shop-docs-tabs" aria-label="Shop documentation views">
        <button type="button" className={tab === 'bom' ? 'active' : ''} onClick={() => setTab('bom')}>BOM / Cut List</button>
        <button type="button" className={tab === 'assembly' ? 'active' : ''} onClick={() => setTab('assembly')}>Assembly</button>
        <button type="button" className={tab === 'manufacturing' ? 'active' : ''} onClick={() => setTab('manufacturing')}>Manufacturing</button>
      </nav>

      {tab === 'bom' && <div className="shop-docs-body bom-view">
        <div className="shop-docs-actions">
          <label className="shop-search"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search part number, material, machining…" /></label>
          <button type="button" onClick={onExportCutListCsv}><Download size={13} /> Cut list CSV</button>
          <button type="button" onClick={onExportHardwareCsv}><Download size={13} /> Hardware CSV</button>
          <button type="button" className="primary" onClick={onExportCutListReport}><ExternalLink size={13} /> Printable report</button>
        </div>

        <section className="material-groups">
          <h3>Material grouping</h3>
          <div>{docs.materialGroups.map(group => <article key={group.key}>
            <strong>{group.partCount} × {group.material}</strong>
            <span>{formatDimension(group.thickness, units)} {unitLabel(units)} · {(group.blankAreaMm2 / 1_000_000).toFixed(3)} m² blank area</span>
            <small>{group.partNumbers.join(', ')}</small>
          </article>)}</div>
        </section>

        <section className="bom-table-wrap">
          <table className="bom-table"><thead><tr><th>Part</th><th>Name</th><th>Material</th><th>Finished X × Y × Z</th><th>Blank X × Y × Z</th><th>Grain</th><th>Edge band</th><th>Machining</th></tr></thead>
            <tbody>{filtered.map(row => <tr
              key={row.partId}
              ref={element => { if (element) rowRefs.current.set(row.partId, element); else rowRefs.current.delete(row.partId); }}
              className={selectedId === row.partId ? 'selected' : ''}
              aria-current={selectedId === row.partId ? 'true' : undefined}
              onClick={() => onSelectPart(row.partId)}
            >
              <td><strong>{row.partNumber}</strong><small>{row.partId}</small></td>
              <td>{row.name}</td>
              <td>{row.material}</td>
              <td>{dims(row.finished, units)}</td>
              <td>{dims(row.blank, units)}</td>
              <td>{row.grainDirection === 'none' ? '—' : row.grainDirection.toUpperCase()}</td>
              <td>{row.edgeBanding.join(', ') || 'none'}</td>
              <td>{row.machining.join('; ') || 'none'}</td>
            </tr>)}</tbody>
          </table>
          {!filtered.length && <p className="shop-empty">No cut-list rows match that search.</p>}
        </section>

        <section className="hardware-table-wrap">
          <h3>Purchased hardware</h3>
          <table className="hardware-table"><thead><tr><th>Part</th><th>Qty</th><th>Hardware</th><th>Manufacturer / model</th><th>Verification</th><th>Mounts</th></tr></thead><tbody>
            {docs.hardware.map(row => <tr key={row.key} className={row.instanceIds.includes(selectedId ?? '') ? 'selected' : ''} onClick={() => row.instanceIds[0] && onSelectPart(row.instanceIds[0])}>
              <td><strong>{row.partNumber}</strong></td><td>{row.quantity}</td><td>{row.label}</td><td>{row.manufacturer} · {row.model}</td><td>{row.verificationStatus}</td><td>{row.mountingPartIds.join(', ') || 'configured base'}</td>
            </tr>)}
            {!docs.hardware.length && <tr><td colSpan={6}>No purchased hardware configured.</td></tr>}
          </tbody></table>
        </section>
      </div>}

      {tab === 'assembly' && <div className="shop-docs-body assembly-view">
        <div className="shop-docs-actions">
          <button type="button" onClick={onExplodeAssembly}><Layers3 size={13} /> Exploded viewport</button>
          <button type="button" onClick={onResetAssembly}>Reset viewport</button>
          <button type="button" className="primary" onClick={onExportAssemblyPacket}><PackageCheck size={13} /> Printable assembly packet</button>
        </div>
        <p className="shop-helper">Use an assembly step to highlight its semantic parts in the live CAD viewport. The printable packet includes the same stable callouts and a schematic exploded guide.</p>
        <div className="assembly-step-list">{docs.assemblySteps.map(step => <article key={step.id}>
          <div className="assembly-step-number">{step.order}</div>
          <div><strong>{step.title}</strong><p>{step.instruction}</p><div className="assembly-callouts">{step.partNumbers.map(number => <span key={number}>{number}</span>)}</div></div>
          <button type="button" onClick={() => { onSelectParts([...step.partIds, ...step.hardwareIds]); onExplodeAssembly(); }}>Highlight step</button>
        </article>)}</div>
        <section className="assembly-hardware-checklist"><h3>Hardware checklist</h3>{docs.hardware.map(row => <label key={row.key}><input type="checkbox" /> <span><strong>{row.quantity} × {row.partNumber}</strong>{row.label} · {row.manufacturer} {row.model}</span></label>)}</section>
      </div>}

      {tab === 'manufacturing' && <div className="shop-docs-body manufacturing-view">
        <div className="manufacturing-toolbar">
          <SelectControl
            ariaLabel="Manufacturing part"
            value={selectedManufacturingPart?.partId ?? ''}
            options={manufacturing.parts.map(part => ({ value: part.partId, label: part.partNumber + ' · ' + part.name }))}
            onChange={value => {
              setManufacturingPartId(value);
              onSelectPart(value);
            }}
          />
          <SelectControl
            ariaLabel="Manufacturing operation layer"
            value={layer}
            options={layerChoices.map(value => ({ value, label: value === 'all' ? 'All operation layers' : value.replace('_', ' / ') }))}
            onChange={value => setLayer(value as LayerChoice)}
          />
          {selectedManufacturingPart && <>
            <button type="button" onClick={() => onExportManufacturingPart(selectedManufacturingPart.partId, 'dxf')}><Download size={13} /> Part DXF</button>
            <button type="button" onClick={() => onExportManufacturingPart(selectedManufacturingPart.partId, 'svg')}><Download size={13} /> SVG</button>
            <button type="button" onClick={() => onExportManufacturingPart(selectedManufacturingPart.partId, 'drilling')}><Download size={13} /> Drill map</button>
            <button type="button" onClick={() => onExportManufacturingPart(selectedManufacturingPart.partId, 'metadata')}><Download size={13} /> Metadata</button>
            <button type="button" disabled={layer === 'all'} onClick={() => layer !== 'all' && onExportManufacturingLayer(selectedManufacturingPart.partId, layer)}><Download size={13} /> Layer DXF</button>
          </>}
        </div>

        <section className="manufacturing-status-grid">
          {(['CUT','POCKET','DADO_GROOVE','DRILL','ENGRAVE','EDGE'] as ManufacturingOperationKind[]).map(kind =>
            <article key={kind}><strong>{manufacturing.operationCounts[kind]}</strong><span>{kind.replace('_', ' / ')}</span></article>
          )}
        </section>

        {selectedManufacturingPart && <div className="manufacturing-review-grid">
          <section className="manufacturing-preview">
            <header><div><strong>{selectedManufacturingPart.partNumber}</strong><span>{selectedManufacturingPart.name} · {selectedManufacturingPart.material}</span></div><small>1:1 mm · {selectedManufacturingPart.plane.uAxis.toUpperCase()}×{selectedManufacturingPart.plane.vAxis.toUpperCase()} machining plane · T={selectedManufacturingPart.plane.thicknessAxis.toUpperCase()}</small></header>
            <img src={svgDataUri(previewSvg)} alt={'Manufacturing operation preview for ' + selectedManufacturingPart.partNumber} />
            <p>Preview is scaled to fit this window. Exported SVG and DXF remain true-scale millimeter geometry. These are manufacturing layers, not CNC toolpaths.</p>
          </section>

          <section className="manufacturing-operations">
            <h3>Registered operations</h3>
            <div>{selectedManufacturingPart.operations
              .filter(operation => layer === 'all' || operation.kind === layer)
              .map(operation => <article key={operation.id}>
                <div><strong>{operation.kind.replace('_', ' / ')}</strong><span>{operation.label}</span></div>
                <small>{operation.face.semanticId}</small>
                <small>{operation.depthMm === null ? 'depth: metadata/edge operation' : 'depth: ' + formatDimension(operation.depthMm, units) + ' ' + unitLabel(units)}{operation.through ? ' · through' : ''}</small>
                {operation.notes.map(note => <p key={note}>{note}</p>)}
              </article>)}</div>
          </section>
        </div>}

        <section className="manufacturing-issues">
          <h3>Manufacturing readiness · {manufacturing.readiness}</h3>
          {manufacturing.issues.length
            ? manufacturing.issues.map((issue, index) => <article key={issue.title + index} className={issue.severity}>
                <strong>{issue.severity.toUpperCase()} · {issue.title}</strong><p>{issue.message}</p>
              </article>)
            : <p>No Design Health warnings or errors are attached to this manufacturing snapshot.</p>}
        </section>

        <section className={'manufacturing-package ' + (packageBlocked ? 'blocked' : reviewed ? 'reviewed' : '')}>
          <div>
            <ClipboardCheck size={18} />
            <div><strong>Reviewed manufacturing package</strong><p>{packageBlocked
              ? 'Design Health errors block export. Resolve the errors and review the regenerated manufacturing geometry.'
              : reviewed
                ? 'This manufacturing snapshot is marked reviewed and is ready to package.'
                : 'Inspect the operation previews, depths/faces, warnings, and part files, then mark this exact snapshot reviewed.'}</p></div>
          </div>
          <div>
            <button type="button" disabled={packageBlocked} onClick={() => setReviewedSignature(manufacturing.signature)}>{reviewed ? 'Reviewed ✓' : 'Mark reviewed'}</button>
            <button type="button" className="primary" disabled={packageBlocked || !reviewed} onClick={() => onExportManufacturingPackage(new Date().toISOString())}><PackageCheck size={13} /> Export reviewed ZIP</button>
          </div>
        </section>
      </div>}
    </section>
  </div>;
}

function dims(value: { x: number; y: number; z: number }, units: DisplayUnits) {
  return formatDimension(value.x, units) + ' × ' + formatDimension(value.y, units) + ' × ' + formatDimension(value.z, units) + ' ' + unitLabel(units);
}

function svgDataUri(svg: string) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
