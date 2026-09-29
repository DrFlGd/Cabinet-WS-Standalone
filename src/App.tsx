import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, CheckCircle2, Cpu, Database, MousePointer2 } from 'lucide-react';
import { buildCabinetDocument, DEFAULT_PARAMETERS, sanitizeParameters, stockThickness } from './cad/cabinetModel';
import CadViewport, {
  type CadViewportHandle,
  type ViewportDisplayMode,
  type ViewportProjection,
} from './cad/CadViewport';
import {
  downloadDocument,
  parseDocument,
  parseDocumentWithReport,
  serializeDocument,
  suggestedFileName,
  type ImportReport,
} from './cad/documentIO';
import { formatDimension, unitLabel, type DisplayUnits } from './cad/units';
import { cloneSectionNodes, sectionRects, sectionRoot, simpleLayoutToSections } from './cad/sections';
import { computeMeasurement, requiredMeasurementSelections, type MeasurementMode } from './cad/measurements';
import { analyzeDesignHealth } from './cad/designHealth';
import type { FitSolution } from './cad/fitSolver';
import { hardwareDefinition } from './cad/hardwareCatalog';
import { useGeometryKernel } from './cad/kernel/useGeometryKernel';
import type { KernelSelection } from './cad/kernel/types';
import { UTILITY_STARTERS, utilityStarter } from './cad/utilityStarters';
import type { CabinetDocument, CabinetParameters, CadPart, SectionNode } from './cad/types';
import HardwareDrawer from './components/HardwareDrawer';
import PropertiesPanel from './components/PropertiesPanel';
import SectionLayoutPanel from './components/SectionLayoutPanel';
import SelectControl from './components/SelectControl';
import DimensionInput from './components/DimensionInput';
import Toolbar from './components/Toolbar';
import TreePanel from './components/TreePanel';
import MeasurementPanel from './components/MeasurementPanel';
import DesignHealthPanel from './components/DesignHealthPanel';
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [kernelSelection, setKernelSelection] = useState<KernelSelection | null>(null);
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>('off');
  const [measurementSelections, setMeasurementSelections] = useState<KernelSelection[]>([]);
  const [displayMode, setDisplayMode] = useState<ViewportDisplayMode>('shaded-edges');
  const [projection, setProjection] = useState<ViewportProjection>('perspective');
  const [clipEnabled, setClipEnabled] = useState(false);
  const [clipZ, setClipZ] = useState(INITIAL_EDITOR.parameters.height);
  const [hardwareCatalogExpanded, setHardwareCatalogExpanded] = useState(false);
  const [partBrowserExpanded, setPartBrowserExpanded] = useState(false);
  const [sectionSelectedId, setSectionSelectedId] = useState(0);
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
  const hardwareCount = cadDocument.hardware.length;
  const kernel = useGeometryKernel(cadDocument);
  const measurementResult = useMemo(
    () => computeMeasurement(cadDocument, kernel.result?.parts ?? [], measurementMode, measurementSelections),
    [cadDocument, kernel.result?.parts, measurementMode, measurementSelections],
  );
  const designHealth = useMemo(
    () => analyzeDesignHealth(cadDocument, {
      kernelDiagnostics: kernel.diagnostics,
      kernelStatus: kernel.status,
    }),
    [cadDocument, kernel.diagnostics, kernel.status],
  );

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
    setSelectedIds(current => {
      const next = new Set([...current].filter(id => cadDocument.parts.some(part => part.id === id)));
      return next.size === current.size ? current : next;
    });
  }, [cadDocument.parts, selectedId]);

  useEffect(() => {
    if (!clipEnabled) setClipZ(editor.parameters.height);
    else setClipZ(current => Math.min(current, editor.parameters.height));
  }, [clipEnabled, editor.parameters.height]);

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

    if (key === 'layoutMode' && value === 'sections') {
      setSectionSelectedId(0);
    }
    setNotice(`Updated ${humanize(String(key))}`);
  }

  function applyHardware(profileId: string) {
    const profile = hardwareDefinition(profileId);
    if (!profile) return;
    history.edit(current => ({
      ...current,
      parameters: sanitizeParameters({
        ...current.parameters,
        ...profile.parameterPatch,
      }),
    }), `hardware:${profile.category}`);
    setNotice(`Applied ${profile.label}`);
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
    setSelectedIds(new Set());
    setSectionSelectedId(0);
    setHiddenIds(new Set());
    setExplode(0);
    setClipEnabled(false);
    setNotice(`Loaded ${starter.name}`);
    requestAnimationFrame(() => viewport.current?.fit());
  }

  function select(part: CadPart | null, additive = false) {
    if (!part) {
      setSelectedId(null);
      setSelectedIds(new Set());
      setKernelSelection(null);
      setNotice('Cabinet selected');
      return;
    }

    if (!additive) {
      setSelectedIds(new Set([part.id]));
      setSelectedId(part.id);
    } else {
      setSelectedIds(current => {
        const next = new Set(current);
        if (next.has(part.id)) next.delete(part.id);
        else next.add(part.id);
        setSelectedId(next.has(part.id) ? part.id : [...next].at(-1) ?? null);
        return next;
      });
    }
    setKernelSelection(null);
    setNotice(additive
      ? 'Selection updated · Ctrl-click to add/remove parts'
      : `Selected ${part.name} · related settings shown at right`);
  }

  function hideSelected() {
    if (!selectedIds.size) return;
    setHiddenIds(current => new Set([...current, ...selectedIds]));
    setNotice(`Hidden ${selectedIds.size} selected part${selectedIds.size === 1 ? '' : 's'}`);
  }

  function isolateSelected() {
    if (!selectedIds.size) return;
    setHiddenIds(new Set(cadDocument.parts.filter(part => !selectedIds.has(part.id)).map(part => part.id)));
    setNotice(`Isolated ${selectedIds.size} selected part${selectedIds.size === 1 ? '' : 's'}`);
  }

  function showAllParts() {
    setHiddenIds(new Set());
    setNotice('Showing all parts');
  }

  function selectTopology(selection: KernelSelection | null) {
    setKernelSelection(selection);
    if (!selection) return;

    if (measurementMode !== 'off') {
      const valid = measurementMode === 'distance'
        || (measurementMode === 'face' && selection.kind === 'face')
        || (measurementMode === 'angle' && selection.kind === 'face');
      if (valid) {
        setMeasurementSelections(current => {
          const required = requiredMeasurementSelections(measurementMode);
          if (required <= 1) return [selection];
          if (current.length >= required) return [selection];
          if (current.some(item => item.partId === selection.partId && item.kind === selection.kind && item.semanticId === selection.semanticId)) return current;
          return [...current, selection];
        });
      }
    }
    setNotice(`Selected ${selection.kind} · ${selection.semanticId}`);
  }

  function changeMeasurementMode(mode: MeasurementMode) {
    setMeasurementMode(mode);
    setMeasurementSelections([]);
    if (mode !== 'off') setNotice(`Measure ${mode} · select semantic geometry in the viewport`);
  }

  function clearMeasurement() {
    setMeasurementSelections([]);
    setMeasurementMode('off');
  }

  function applyFitSolution(solution: FitSolution) {
    if (!solution.feasible) return;
    history.edit(current => ({
      ...current,
      parameters: sanitizeParameters({
        ...current.parameters,
        ...solution.patch,
      }),
    }));
    setNotice(`Applied ${solution.title} · Undo restores the previous cabinet`);
    requestAnimationFrame(() => viewport.current?.fit());
  }

  function updateShelfPosition(partId: string, nextZ: number) {
    const part = cadDocument.parts.find(candidate => candidate.id === partId);
    if (!part) return;
    const shelfIndex = Number(part.metadata?.shelfIndex ?? 0) - 1;
    const minZ = Number(part.metadata?.shelfMinZ ?? NaN);
    const maxZ = Number(part.metadata?.shelfMaxZ ?? NaN);
    if (shelfIndex < 0 || !Number.isFinite(minZ) || !Number.isFinite(maxZ) || maxZ <= minZ) return;
    const normalized = Math.max(0.03, Math.min(0.97, (nextZ + part.size.z / 2 - minZ) / (maxZ - minZ)));
    const sectionId = Number(part.metadata?.sectionId ?? 0);

    history.edit(current => {
      if (sectionId > 0 && current.parameters.layoutMode === 'sections') {
        const nodes = cloneSectionNodes(current.parameters.sectionNodes);
        const nodeIndex = sectionId - 1;
        const node = nodes[nodeIndex];
        if (!node) return current;
        const count = node[5] === 'open' ? node[6] : node[11];
        const positions = Array.from({ length: count }, (_, index) => node[12]?.[index] ?? (index + 1) / (count + 1));
        positions[shelfIndex] = normalized;
        node[12] = positions;
        return { ...current, parameters: sanitizeParameters({ ...current.parameters, sectionNodes: nodes }) };
      }

      const count = current.parameters.shelfCount;
      const positions = Array.from({ length: count }, (_, index) => current.parameters.shelfPositions[index] ?? (index + 1) / (count + 1));
      positions[shelfIndex] = normalized;
      return { ...current, parameters: sanitizeParameters({ ...current.parameters, shelfPositions: positions }) };
    }, `shelf-position:${partId}`);
    setNotice(`Moved ${part.name}`);
  }

  function updateSectionDivider(partId: string, delta: number) {
    const part = cadDocument.parts.find(candidate => candidate.id === partId);
    const parentId = Number(part?.metadata?.dividerParentId ?? -1);
    const order = Number(part?.metadata?.dividerOrder ?? -1);
    const axis = part?.metadata?.dividerAxis;
    if (!part || parentId < 0 || order <= 0 || (axis !== 'x' && axis !== 'z')) return;

    history.edit(current => {
      if (current.parameters.layoutMode !== 'sections') return current;
      const nodes = cloneSectionNodes(current.parameters.sectionNodes);
      const thickness = stockThickness(current.parameters.carcassStock, current.parameters.materialThickness);
      const rects = sectionRects(nodes, sectionRoot(current.parameters, thickness), thickness);
      const children = nodes
        .map((node, index) => ({ node, index }))
        .filter(entry => entry.node[0] === parentId)
        .sort((a, b) => a.node[1] - b.node[1]);
      const previous = children.find(entry => entry.node[1] === order - 1);
      const currentChild = children.find(entry => entry.node[1] === order);
      if (!previous || !currentChild) return current;

      const span = (id: number) => axis === 'x' ? rects[id]?.w ?? 0 : rects[id]?.h ?? 0;
      for (const entry of children) {
        if (entry.node[3] === 'weight') entry.node[4] = Math.max(1, span(entry.index));
      }
      const previousSpan = span(previous.index);
      const currentSpan = span(currentChild.index);
      const previousDelta = axis === 'x' ? delta : -delta;
      const nextPrevious = Math.max(60, Math.min(previousSpan + currentSpan - 60, previousSpan + previousDelta));
      const nextCurrent = previousSpan + currentSpan - nextPrevious;
      previous.node[3] = 'weight';
      currentChild.node[3] = 'weight';
      previous.node[4] = nextPrevious;
      currentChild.node[4] = nextCurrent;
      return { ...current, parameters: sanitizeParameters({ ...current.parameters, sectionNodes: nodes }) };
    }, `section-divider:${parentId}:${order}`);
    setSectionSelectedId(parentId);
    setNotice('Moved section divider from 3D viewport');
  }

  async function exportStep() {
    try {
      setNotice('Building exact STEP assembly…');
      const bytes = await kernel.exportStep();
      const suggestedName = `${safeBaseName(editor.name)}.step`;
      const desktop = desktopApi();

      if (desktop) {
        const result = await desktop.saveStep({ bytes, suggestedName });
        if (result.canceled) {
          setNotice('STEP export canceled');
          return;
        }
        setNotice(`Exported STEP · ${result.name ?? suggestedName}`);
        return;
      }

      const blob = new Blob([bytes], { type: 'application/STEP' });
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = suggestedName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(href);
      setNotice(`Exported STEP · ${suggestedName}`);
    } catch (error) {
      setNotice(error instanceof Error ? `STEP export failed: ${error.message}` : 'STEP export failed');
    }
  }

  function openSection(sectionNodeId: number) {
    setSectionSelectedId(sectionNodeId);
    setNotice(`Editing Section ${sectionNodeId + 1} in Manual Layout Editor`);
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
    setSelectedIds(new Set());
    setSectionSelectedId(0);
    setHiddenIds(new Set());
    setExplode(0);
    setClipEnabled(false);
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
    setSelectedIds(new Set());
    setSectionSelectedId(0);
    setHiddenIds(new Set());
    setExplode(0);
    setClipEnabled(false);
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
      <div className="brand"><span className="brand-mark"><Box size={22} /></span><div><strong>Cabinet WS</strong><small>Utility CAD · v0.9.0</small></div></div>
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
      canExportStep={kernel.status === 'ready' || Boolean(kernel.result?.parts.length)}
      onExportStep={() => { void exportStep(); }}
      onOpen={() => { void openDocument(); }}
      onOpenRecent={path => { void openRecent(path); }}
      onUndo={() => { history.undo(); setNotice('Undo'); }}
      onRedo={() => { history.redo(); setNotice('Redo'); }}
      onUnits={updateDisplayUnits}
      displayMode={displayMode}
      projection={projection}
      clipEnabled={clipEnabled}
      clipZ={clipZ}
      clipMax={editor.parameters.height}
      hasSelection={selectedIds.size > 0}
      onDisplayMode={setDisplayMode}
      onProjection={setProjection}
      onClipEnabled={setClipEnabled}
      onClipZ={setClipZ}
      onHideSelected={hideSelected}
      onIsolateSelected={isolateSelected}
      onShowAll={showAllParts}
    />
    <input ref={fileInput} hidden type="file" accept=".json,.cabinetws.json,.cabinet.json" onChange={event => { void openBrowserFile(event.target.files?.[0]); }} />

    <div className={`workspace ${hardwareCatalogExpanded ? 'hardware-browser-expanded' : ''} ${partBrowserExpanded ? 'parts-browser-expanded' : ''}`}>
      <div className="left-stack">
        <section className="panel preset-panel">
          <span className="eyebrow">UTILITY CABINET STARTERS</span>
          <SelectControl
            ariaLabel="Utility Cabinet starter"
            value=""
            placeholder="Choose a starter…"
            options={UTILITY_STARTERS.map(starter => ({ value: starter.id, label: starter.name }))}
            onChange={applyStarter}
          />
          <p>Starter recipes set cabinet construction and can seed either simple or manual section layouts.</p>
        </section>
        <div className={`layout-navigation-row ${hardwareCatalogExpanded ? 'hardware-open' : 'hardware-collapsed'} ${partBrowserExpanded ? 'parts-open' : 'parts-collapsed'}`}>
          <HardwareDrawer
            parameters={editor.parameters}
            expanded={hardwareCatalogExpanded}
            onToggle={() => setHardwareCatalogExpanded(current => !current)}
            onApply={applyHardware}
          />
          <SectionLayoutPanel
            parameters={editor.parameters}
            thickness={stockThickness(editor.parameters.carcassStock, editor.parameters.materialThickness)}
            units={editor.displayUnits}
            selectedSectionId={sectionSelectedId}
            onParameterChange={updateParameter}
            onSelectedSectionChange={setSectionSelectedId}
            onChange={updateSections}
          />
          <TreePanel
            document={cadDocument}
            selectedId={selectedId}
            selectedIds={selectedIds}
            hiddenIds={hiddenIds}
            expanded={partBrowserExpanded}
            onToggle={() => setPartBrowserExpanded(current => !current)}
            onSelect={select}
            onToggleVisibility={toggleVisibility}
          />
        </div>
      </div>

      <section className="viewport-panel">
        <div className="viewport-badges">
          <span><Cpu size={14} /> {kernelBadge(kernel.status, kernel.result?.stats.bodyCount ?? 0)}</span>
          <span><MousePointer2 size={14} /> Click face · Shift-click edge · Ctrl-click multi-select</span>
          {selectedIds.size > 0 && <span className="selection-breadcrumb">{selectedIds.size} selected · {selected?.id ?? [...selectedIds][0]}</span>}
        </div>
        <ViewportDimensionEditor
          parameters={editor.parameters}
          units={editor.displayUnits}
          onChange={(key, value) => updateParameter(key, value)}
        />
        <MeasurementPanel
          mode={measurementMode}
          result={measurementResult}
          selectionCount={measurementSelections.length}
          units={editor.displayUnits}
          onMode={changeMeasurementMode}
          onClear={clearMeasurement}
        />
        <DesignHealthPanel
          report={designHealth}
          parameters={editor.parameters}
          units={editor.displayUnits}
          onApplySolution={applyFitSolution}
        />
        <CadViewport
          ref={viewport}
          document={cadDocument}
          selectedId={selectedId}
          selectedIds={selectedIds}
          hiddenIds={hiddenIds}
          explode={explode}
          displayMode={displayMode}
          projection={projection}
          clipEnabled={clipEnabled}
          clipZ={clipZ}
          kernelParts={kernel.result?.parts}
          kernelSelection={kernelSelection}
          onSelect={select}
          onTopologySelect={selectTopology}
          onDimensionChange={(key, value) => updateParameter(key, value)}
          onShelfPositionChange={updateShelfPosition}
          onSectionDividerChange={updateSectionDivider}
          onHideSelected={hideSelected}
          onIsolateSelected={isolateSelected}
          onShowAll={showAllParts}
        />
        <div className="viewport-footer">
          <DimensionBadge label="W" value={editor.parameters.width} units={editor.displayUnits} />
          <DimensionBadge label="H" value={editor.parameters.height} units={editor.displayUnits} />
          <DimensionBadge label="D" value={editor.parameters.depth} units={editor.displayUnits} />
          <div><Database size={14} /><strong>{bodyCount}</strong><small>modeled bodies</small></div>
          <div><strong>{hardwareCount}</strong><small>hardware instances</small></div>
          <p>{kernelFooter(kernel.status, kernel.result?.stats.featureCount ?? 0, kernel.diagnostics.length)}</p>
        </div>
      </section>

      <PropertiesPanel
        parameters={editor.parameters}
        selected={selected}
        displayUnits={editor.displayUnits}
        onChange={updateParameter}
        topologySelection={kernelSelection}
        kernelDiagnostics={kernel.diagnostics}
        onShowCabinetSettings={() => select(null)}
        onOpenSection={openSection}
      />
    </div>
  </main>;
}

function ViewportDimensionEditor({
  parameters,
  units,
  onChange,
}: {
  parameters: CabinetParameters;
  units: DisplayUnits;
  onChange: (key: 'width' | 'height' | 'depth', value: number) => void;
}) {
  return <div className="viewport-dimension-editor" aria-label="Direct cabinet dimensions">
    {([
      ['W', 'width'],
      ['H', 'height'],
      ['D', 'depth'],
    ] as const).map(([label, key]) => (
      <label key={key}>
        <span>{label}</span>
        <DimensionInput value={parameters[key]} units={units} min={50} onChange={value => onChange(key, value)} />
      </label>
    ))}
  </div>;
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


function safeBaseName(value: string) {
  const cleaned = value.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-');
  return cleaned || 'cabinet';
}

function kernelBadge(status: 'idle' | 'loading' | 'ready' | 'error', bodyCount: number) {
  if (status === 'ready') return `Exact CAD · ${bodyCount} OpenCascade bodies`;
  if (status === 'error') return `Exact CAD partial · preview fallback active`;
  if (status === 'loading') return 'Building exact CAD…';
  return 'Exact CAD idle';
}

function kernelFooter(status: 'idle' | 'loading' | 'ready' | 'error', featureCount: number, diagnosticCount: number) {
  if (status === 'ready') return `Utility v0.9.0 · exact B-Rep · ${featureCount} semantic features · Design Health · STEP`;
  if (status === 'error') return `Utility v0.9.0 · exact kernel diagnostics: ${diagnosticCount} · Design Health review`;
  return 'Utility v0.9.0 · OpenCascade worker initializing…';
}
