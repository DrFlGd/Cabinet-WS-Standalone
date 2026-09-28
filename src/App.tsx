import { useMemo, useRef, useState } from 'react';
import { Box, CheckCircle2, Cpu, Database, MousePointer2 } from 'lucide-react';
import { buildCabinetDocument, DEFAULT_PARAMETERS, PRESETS } from './cad/cabinetModel';
import CadViewport, { type CadViewportHandle } from './cad/CadViewport';
import { downloadDocument, parseDocument } from './cad/documentIO';
import type { CabinetParameters, CadPart } from './cad/types';
import PropertiesPanel from './components/PropertiesPanel';
import Toolbar from './components/Toolbar';
import TreePanel from './components/TreePanel';

export default function App() {
  const [parameters, setParameters] = useState<CabinetParameters>(DEFAULT_PARAMETERS);
  const [name, setName] = useState('Base Cabinet Prototype');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [explode, setExplode] = useState(0);
  const [notice, setNotice] = useState('Ready');
  const fileInput = useRef<HTMLInputElement>(null);
  const viewport = useRef<CadViewportHandle>(null);

  const cadDocument = useMemo(() => buildCabinetDocument(parameters, name), [parameters, name]);
  const selected = selectedId ? cadDocument.parts.find(part => part.id === selectedId) ?? null : null;
  const panelCount = cadDocument.parts.filter(part => part.category !== 'front').length;

  function updateParameter(key: keyof CabinetParameters, value: number) {
    setParameters(current => ({ ...current, [key]: value }));
    setNotice(`Updated ${humanize(key)}`);
  }

  function applyPreset(presetName: string) {
    const preset = PRESETS[presetName];
    if (!preset) return;
    setParameters({ ...preset });
    setName(`${presetName} Cabinet`);
    setSelectedId(null);
    setHiddenIds(new Set());
    setExplode(0);
    setNotice(`Loaded ${presetName} preset`);
    requestAnimationFrame(() => viewport.current?.fit());
  }

  function select(part: CadPart | null) {
    setSelectedId(part?.id ?? null);
    setNotice(part ? `Selected ${part.name}` : 'Cabinet selected');
  }

  function toggleVisibility(id: string) {
    setHiddenIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function openFile(file?: File) {
    if (!file) return;
    try {
      const loaded = parseDocument(await file.text());
      setParameters(loaded.parameters);
      setName(loaded.name);
      setSelectedId(null);
      setHiddenIds(new Set());
      setExplode(0);
      setNotice(`Opened ${file.name}`);
      requestAnimationFrame(() => viewport.current?.fit());
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not open document');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return <main className="app-shell">
    <header className="app-header">
      <div className="brand"><span className="brand-mark"><Box size={22} /></span><div><strong>Cabinet WS</strong><small>Standalone CAD Prototype</small></div></div>
      <div className="document-name"><input aria-label="Document name" value={name} onChange={event => setName(event.target.value)} /><span>● Parametric cabinet document</span></div>
      <div className="header-status"><CheckCircle2 size={15} /><span>{notice}</span></div>
    </header>

    <Toolbar
      explode={explode}
      onExplode={setExplode}
      onView={preset => viewport.current?.setView(preset)}
      onFit={() => viewport.current?.fit()}
      onSave={() => { downloadDocument(cadDocument); setNotice('Saved cabinet document'); }}
      onOpen={() => fileInput.current?.click()}
    />
    <input ref={fileInput} hidden type="file" accept=".json,.cabinetws.json" onChange={event => openFile(event.target.files?.[0])} />

    <div className="workspace">
      <div className="left-stack">
        <section className="panel preset-panel">
          <span className="eyebrow">STARTING DESIGN</span>
          <select aria-label="Cabinet preset" defaultValue="Base 30" onChange={event => applyPreset(event.target.value)}>
            {Object.keys(PRESETS).map(preset => <option key={preset}>{preset}</option>)}
          </select>
          <p>Start from a cabinet archetype, then edit dimensions in real time.</p>
        </section>
        <TreePanel document={cadDocument} selectedId={selectedId} hiddenIds={hiddenIds} onSelect={select} onToggleVisibility={toggleVisibility} />
      </div>

      <section className="viewport-panel">
        <div className="viewport-badges">
          <span><Cpu size={14} /> Realtime solid viewport</span>
          <span><MousePointer2 size={14} /> Click parts to select</span>
        </div>
        <CadViewport ref={viewport} document={cadDocument} selectedId={selectedId} hiddenIds={hiddenIds} explode={explode} onSelect={select} />
        <div className="viewport-footer">
          <div><span>W</span><strong>{round(parameters.width)}</strong><small>mm</small></div>
          <div><span>H</span><strong>{round(parameters.height)}</strong><small>mm</small></div>
          <div><span>D</span><strong>{round(parameters.depth)}</strong><small>mm</small></div>
          <div><Database size={14} /><strong>{panelCount}</strong><small>physical bodies</small></div>
          <p>Prototype kernel: semantic parametric panel solids. OpenCascade/B-Rep is the next geometry layer.</p>
        </div>
      </section>

      <PropertiesPanel parameters={parameters} selected={selected} onChange={updateParameter} />
    </div>
  </main>;
}

function humanize(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, char => char.toUpperCase());
}
const round = (value: number) => Math.round(value * 100) / 100;
