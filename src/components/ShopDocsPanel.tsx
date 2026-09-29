import { useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardList, Download, ExternalLink, Layers3, PackageCheck, X } from 'lucide-react';
import type { CabinetDocument } from '../cad/types';
import type { ShopDocumentation } from '../cad/shopDocs';
import { formatDimension, unitLabel, type DisplayUnits } from '../cad/units';

type Props = {
  document: CabinetDocument;
  docs: ShopDocumentation;
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
};

type Tab = 'bom' | 'assembly';

export default function ShopDocsPanel({
  document,
  docs,
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
}: Props) {
  const [tab, setTab] = useState<Tab>('bom');
  const [query, setQuery] = useState('');
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs.bom;
    return docs.bom.filter(row => [row.partNumber, row.partId, row.name, row.category, row.material, row.machining.join(' ')]
      .join(' ').toLowerCase().includes(q));
  }, [docs.bom, query]);

  useEffect(() => {
    if (tab !== 'bom' || !selectedId) return;
    rowRefs.current.get(selectedId)?.scrollIntoView({ block: 'nearest' });
  }, [selectedId, tab]);

  const hardwareUnits = docs.hardware.reduce((sum, row) => sum + row.quantity, 0);

  return <div className="shop-docs-backdrop" role="presentation" onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="shop-docs-dialog" role="dialog" aria-modal="true" aria-label="Shop documentation">
      <header className="shop-docs-header">
        <ClipboardList size={18} />
        <div><strong>Shop Documentation</strong><span>{document.name} · Phase 10 semantic reports</span></div>
        <div className={`shop-readiness ${docs.manufacturingReadiness}`}>{docs.manufacturingReadiness}</div>
        <button type="button" onClick={onClose} aria-label="Close shop documentation"><X size={17} /></button>
      </header>

      <div className="shop-docs-summary">
        <div><strong>{docs.bom.length}</strong><span>fabricated parts</span></div>
        <div><strong>{docs.materialGroups.length}</strong><span>material groups</span></div>
        <div><strong>{hardwareUnits}</strong><span>hardware units</span></div>
        <div><strong>{docs.operationCount}</strong><span>machining features</span></div>
      </div>

      <nav className="shop-docs-tabs" aria-label="Shop documentation views">
        <button type="button" className={tab === 'bom' ? 'active' : ''} onClick={() => setTab('bom')}>BOM / Cut List</button>
        <button type="button" className={tab === 'assembly' ? 'active' : ''} onClick={() => setTab('assembly')}>Assembly</button>
      </nav>

      {tab === 'bom' ? <div className="shop-docs-body bom-view">
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
      </div> : <div className="shop-docs-body assembly-view">
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
    </section>
  </div>;
}

function dims(value: { x: number; y: number; z: number }, units: DisplayUnits) {
  return `${formatDimension(value.x, units)} × ${formatDimension(value.y, units)} × ${formatDimension(value.z, units)} ${unitLabel(units)}`;
}
