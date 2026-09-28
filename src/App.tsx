import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, CheckCircle2, Cpu, Database, MousePointer2 } from 'lucide-react';
import { buildCabinetDocument, DEFAULT_PARAMETERS, sanitizeParameters, stockThickness } from './cad/cabinetModel';
import CadViewport, { type CadViewportHandle } from './cad/CadViewport';
import {
  downloadDocument,
  parseDocument,
  parseDocumentWithReport,
  serializeDocument,
  suggestedFileName,
  type ImportReport,
} from './cad/documentIO';
import { formatDimension, unitLabel, type DisplayUnits } from './cad/units';
import { simpleLayoutToSections } from './cad/sections';
import { UTILITY_STARTERS, utilityStarter } from './cad/utilityStarters';
import type { CabinetDocument, CabinetParameters, CadPart, SectionNode } from './cad/types';
import PropertiesPanel from './components/PropertiesPanel';
import SectionLayoutPanel from './components/SectionLayoutPanel';
import Toolbar from './components/Toolbar';
import TreePanel from './components/TreePanel';
import { desktopApi, type RecentProject } from './desktop';
import { clearRecovery, readRecovery, writeRecovery } from './editor/recovery';
import type { EditorDocument } from './editor/history';
import { useDocumentHistory } from './editor/useDocumentHistory';

type ParameterValue = CabinetParameters[keyof CabinetParameters];

const defaultStarter = utilityStarter('default');
const INITIAL_EDITOR: EditorDocument = {
  name: defaultStarter.name,
  displayUnits: 'mm',
  parameters: { ...defaultStarter.parameters },
};

function toCadDocument(editor: EditorDocument) {
  return buildCabinetDocument(editor.parameters, editor.name, editor.displayUnits);
}

function fromCadDocument(document: CabinetDocument): EditorDocument {
  return {
    name: document.name,
    displayUnits: document.displayUnits,
    parameters: { ...document.parameters },
  };
}

const INITIAL_SAVED_CONTENT = serializeDocument(toCadDocument(INITIAL_EDITOR));

export default function App() {
  const history = useDocumentHistory(INITIAL_EDITOR);
  const editor = history.document;
  const [savedContent, setSavedContent] = useState(INITIAL_SAVED_CONTENT);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [explode, setExplode] = useState(0);
  const [notice, setNotice] = useState('Ready');
  const [recoveryReady, setRecoveryReady] = useState(false);
  const recoveryAttempted = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const viewport = useRef<CadViewportHandle>(null);

  const cadDocument = useMemo(() => toCadDocument(editor), [editor]);
  const serialized = useMemo(() => serializeDocument(cadDocument), [cadDocument]);
  const dirty = serialized !== savedContent;
  const selected = selectedId
    ? cadDocument.parts.find(part => part.id === selectedId) ?? null
    : null;
  const bodyCount = cadDocument.parts.filter(part => part.category !== 'hardware').length;

  async function refreshRecent() {
    const desktop = desktopApi();
    if (!desktop) return;
    try {
      setRecentProjects(await desktop.listRecent());
    } catch {
      setRecentProjects([]);
    }
  }

  useEffect(() => {
    void refreshRecent();
  }, []);

  useEffect(() => {
    if (selectedId && !cadDocument.parts.some(part => part.id === selectedId)) {
      setSelectedId(null);
    }
  }, [cadDocument.parts, selectedId]);

  useEffect(() => {
    document.title = `${dirty ? '* ' : ''}${editor.name || 'Untitled'} — Cabinet WS Standalone`;
  }, [dirty, editor.name]);

  useEffect(() => {
    if (recoveryAttempted.current) return;
    recoveryAttempted.current = true;

    void (async () => {
      try {
        const recovery = await readRecovery();
        if (recovery) {
          const recovered = parseDocument(recovery.content);
          const recoveredContent = serializeDocument(recovered);
          if (recoveredContent !== INITIAL_SAVED_CONTENT) {
            const timestamp = new Date(recovery.updatedAt).toLocaleString();
            if (window.confirm(`A recovery copy from ${timestamp} is available. Restore it?`)) {
              history.reset(fromCadDocument(recovered));
              setSavedContent('');
              setCurrentPath(null);
              setNotice('Recovered unsaved cabinet changes');
            } else {
              await clearRecovery();
            }
          } else {
            await clearRecovery();
          }
        }
      } catch {
        await clearRecovery();
      } finally {
        setRecoveryReady(true);
      }
    })();
  }, [history.reset]);

  useEffect(() => {
    if (!recoveryReady) return;
    const timer = window.setTimeout(() => {
      if (dirty) {
        void writeRecovery(serialized).catch(() => setNotice('Recovery autosave failed'));
      } else {
        void clearRecovery();
      }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [dirty, recoveryReady, serialized]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (!modifier) return;

      if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          if (history.canRedo) {
            history.redo();
            setNotice('Redo');
          }
        } else if (history.canUndo) {
          history.undo();
          setNotice('Undo');
        }
        return;
      }

      if (event.key.toLowerCase() === 'y' && history.canRedo) {
        event.preventDefault();
        history.redo();
        setNotice('Redo');
        return;
      }

      if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        void saveDocument(event.shiftKey);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  function updateParameter(key: keyof CabinetParameters, value: ParameterValue) {
    history.edit(current => {
      const next = { ...current.parameters, [key]: value } as Partial<CabinetParameters>;
      if (key === 'layoutMode' && value === 'sections' && current.parameters.layoutMode !== 'sections') {
        next.sectionNodes = simpleLayoutToSections(current.parameters);
      }
      return {
        ...current,
        parameters: sanitizeParameters(next),
      };
    }, `parameter:${String(key)}`);
    setNotice(`Updated ${humanize(String(key))}`);
  }

  function updateSections(nodes: SectionNode[]) {
    history.edit(current => ({
      ...current,
      parameters: sanitizeParameters({
        ...current.parameters,
        layoutMode: 'sections',
        sectionNodes: nodes,
      }),
    }), 'sections');
    setNotice('Updated section layout');
  }

  function updateDisplayUnits(units: DisplayUnits) {
    history.edit(current => ({ ...current, displayUnits: units }), 'display-units');
    setNotice(`Display units: ${units === 'in' ? 'inches' : 'millimeters'}`);
  }

  function updateName(name: string) {
    history.edit(current => ({ ...current, name: name.slice(0, 120) }), 'document-name');
  }

  function applyStarter(starterId: string) {
    const starter = utilityStarter(starterId);
    history.edit(current => ({
      name: starter.name,
      displayUnits: current.displayUnits,
      parameters: { ...starter.parameters },
    }));

    setSelectedId(null);
    setHiddenIds(new Set());
    setExplode(0);
    setNotice(`Loaded ${starter.name}`);
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

  function allowDestructiveAction(action: string) {
    return !dirty || window.confirm(`This cabinet has unsaved changes. Discard them and ${action}?`);
  }

  async function newDocument() {
    if (!allowDestructiveAction('create a new cabinet')) return;

    const next: EditorDocument = {
      name: defaultStarter.name,
      displayUnits: editor.displayUnits,
      parameters: { ...DEFAULT_PARAMETERS },
    };
    history.reset(next);
    setSavedContent(serializeDocument(toCadDocument(next)));
    setCurrentPath(null);
    setSelectedId(null);
    setHiddenIds(new Set());
    setExplode(0);
    await clearRecovery();
    setNotice('New Utility Cabinet');
    requestAnimationFrame(() => viewport.current?.fit());
  }

  async function loadDocument(
    document: CabinetDocument,
    sourcePath: string | null,
    label: string,
    report?: ImportReport,
  ) {
    history.reset(fromCadDocument(document));
    setSavedContent(serializeDocument(document));
    setCurrentPath(sourcePath);
    setSelectedId(null);
    setHiddenIds(new Set());
    setExplode(0);
    await clearRecovery();
    await refreshRecent();

    if (report?.source === 'cabinet-workshop') {
      const warningText = report.warnings.length
        ? ` · ${report.warnings.join(' ')}`
        : '';
      setNotice(`Imported web Utility Cabinet · ${report.ignoredFieldCount} unsupported fields retained only in source file${warningText}`);
    } else if (report?.warnings.length) {
      setNotice(`${label} · ${report.warnings.join(' ')}`);
    } else {
      setNotice(label);
    }

    requestAnimationFrame(() => viewport.current?.fit());
  }

  async function openDocument() {
    if (!allowDestructiveAction('open another project')) return;

    const desktop = desktopApi();
    if (!desktop) {
      fileInput.current?.click();
      return;
    }

    try {
      const result = await desktop.openDocument();
      if (!result) return;
      const parsed = parseDocumentWithReport(result.content);
      await loadDocument(parsed.document, result.path, `Opened ${result.name}`, parsed.report);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not open document');
    }
  }

  async function openRecent(path: string) {
    if (!allowDestructiveAction('open another project')) return;
    const desktop = desktopApi();
    if (!desktop) return;

    try {
      const result = await desktop.openRecent(path);
      if (!result) return;
      const parsed = parseDocumentWithReport(result.content);
      await loadDocument(parsed.document, result.path, `Opened ${result.name}`, parsed.report);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not open recent document');
      await refreshRecent();
    }
  }

  async function openBrowserFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error('Cabinet document is too large.');
      const parsed = parseDocumentWithReport(await file.text());
      await loadDocument(parsed.document, null, `Opened ${file.name}`, parsed.report);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not open document');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function saveDocument(saveAs = false) {
    const desktop = desktopApi();

    try {
      if (desktop) {
        const result = await desktop.saveDocument({
          content: serialized,
          path: currentPath,
          suggestedName: suggestedFileName(editor.name),
          saveAs,
        });
        if (result.canceled) return;

        setCurrentPath(result.path ?? currentPath);
        setSavedContent(serialized);
        await clearRecovery();
        await refreshRecent();
        setNotice(`Saved ${result.name ?? editor.name}`);
        return;
      }

      downloadDocument(cadDocument);
      setSavedContent(serialized);
      await clearRecovery();
      setNotice('Downloaded cabinet document');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not save document');
    }
  }

  return <main className="app-shell">
    <header className="app-header">
      <div className="brand"><span className="brand-mark"><Box size={22} /></span><div><strong>Cabinet WS</strong><small>Utility CAD · v0.4.1</small></div></div>
      <div className="document-name">
        <input aria-label="Document name" value={editor.name} onChange={event => updateName(event.target.value)} />
        <span className={dirty ? 'dirty-label' : ''}>{dirty ? '● Modified' : '✓ Saved'} · {currentPath ? fileName(currentPath) : 'Unsaved project'}</span>
      </div>
      <div className="header-status"><CheckCircle2 size={15} /><span>{notice}</span></div>
    </header>

    <Toolbar
      explode={explode}
      units={editor.displayUnits}
      canUndo={history.canUndo}
      canRedo={history.canRedo}
      recentProjects={recentProjects}
      onExplode={setExplode}
      onView={preset => viewport.current?.setView(preset)}
      onFit={() => viewport.current?.fit()}
      onNew={() => { void newDocument(); }}
      onSave={() => { void saveDocument(false); }}
      onSaveAs={() => { void saveDocument(true); }}
      onOpen={() => { void openDocument(); }}
      onOpenRecent={path => { void openRecent(path); }}
      onUndo={() => { history.undo(); setNotice('Undo'); }}
      onRedo={() => { history.redo(); setNotice('Redo'); }}
      onUnits={updateDisplayUnits}
    />
    <input ref={fileInput} hidden type="file" accept=".json,.cabinetws.json,.cabinet.json" onChange={event => { void openBrowserFile(event.target.files?.[0]); }} />

    <div className="workspace">
      <div className={`left-stack ${editor.parameters.layoutMode === 'sections' ? 'sections-enabled' : ''}`}>
        <section className="panel preset-panel">
          <span className="eyebrow">UTILITY CABINET STARTERS</span>
          <select aria-label="Utility Cabinet starter" value="" onChange={event => applyStarter(event.target.value)}>
            <option value="" disabled>Choose a starter…</option>
            {UTILITY_STARTERS.map(starter => <option key={starter.id} value={starter.id}>{starter.name}</option>)}
          </select>
          <p>Ported from the web Utility Cabinet engine. Wide mixed-bay starters now use the standalone v0.4 section tree.</p>
        </section>
        {editor.parameters.layoutMode === 'sections' && (
          <SectionLayoutPanel
            parameters={editor.parameters}
            thickness={stockThickness(editor.parameters.carcassStock, editor.parameters.materialThickness)}
            units={editor.displayUnits}
            onChange={updateSections}
          />
        )}
        <TreePanel document={cadDocument} selectedId={selectedId} hiddenIds={hiddenIds} onSelect={select} onToggleVisibility={toggleVisibility} />
      </div>

      <section className="viewport-panel">
        <div className="viewport-badges">
          <span><Cpu size={14} /> Realtime Utility Cabinet model</span>
          <span><MousePointer2 size={14} /> Click parts to inspect semantics</span>
        </div>
        <CadViewport ref={viewport} document={cadDocument} selectedId={selectedId} hiddenIds={hiddenIds} explode={explode} onSelect={select} />
        <div className="viewport-footer">
          <DimensionBadge label="W" value={editor.parameters.width} units={editor.displayUnits} />
          <DimensionBadge label="H" value={editor.parameters.height} units={editor.displayUnits} />
          <DimensionBadge label="D" value={editor.parameters.depth} units={editor.displayUnits} />
          <div><Database size={14} /><strong>{bodyCount}</strong><small>modeled bodies</small></div>
          <p>Utility v0.4.1 · cutouts · drilling · joinery preview · drawer boxes.</p>
        </div>
      </section>

      <PropertiesPanel
        parameters={editor.parameters}
        selected={selected}
        displayUnits={editor.displayUnits}
        onChange={updateParameter}
      />
    </div>
  </main>;
}

function DimensionBadge({ label, value, units }: { label: string; value: number; units: DisplayUnits }) {
  return <div><span>{label}</span><strong>{formatDimension(value, units)}</strong><small>{unitLabel(units)}</small></div>;
}

function humanize(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, char => char.toUpperCase());
}

function fileName(filePath: string) {
  return filePath.split(/[\\/]/).at(-1) ?? filePath;
}
