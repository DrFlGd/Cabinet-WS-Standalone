import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, CheckCircle2, Cpu, Database, MousePointer2 } from 'lucide-react';
import packageMetadata from '../package.json';
import { DEFAULT_PARAMETERS, sanitizeParameters, stockThickness } from './cad/cabinetModel';
import { buildFamilyCabinetDocument } from './cad/familyModel';
import { FAMILY_DEFINITIONS, familyDefinition, familyStarter, familyStarters } from './cad/familyCatalog';
import { editFamilySetting, syncFamilyValuesFromParameters } from './cad/familySettings';
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
import {
  buildManufacturingModel,
  operationLayerDxf,
  reviewedManufacturingZip,
  type ManufacturingOperationKind,
} from './cad/manufacturing';
import {
  buildAssemblyPacketHtml,
  buildCutListReportHtml,
  buildShopDocumentation,
  cutListCsv,
  hardwareCsv,
} from './cad/shopDocs';
import { hardwareDefinition } from './cad/hardwareCatalog';
import { useGeometryKernel } from './cad/kernel/useGeometryKernel';
import type { KernelSelection } from './cad/kernel/types';
import { utilityStarter } from './cad/utilityStarters';
import type { CabinetDocument, CabinetFamily, CabinetParameters, CadPart, JsonValue, SectionNode } from './cad/types';
import HardwareDrawer from './components/HardwareDrawer';
import PropertiesPanel from './components/PropertiesPanel';
import SectionLayoutPanel from './components/SectionLayoutPanel';
import SelectControl from './components/SelectControl';
import DimensionInput from './components/DimensionInput';
import Toolbar from './components/Toolbar';
import TreePanel from './components/TreePanel';
import MeasurementPanel from './components/MeasurementPanel';
import DesignHealthPanel from './components/DesignHealthPanel';
import ShopDocsPanel from './components/ShopDocsPanel';
import AboutDialog from './components/AboutDialog';
import WorkspaceErrorBoundary from './components/WorkspaceErrorBoundary';
import { desktopApi, type AppInfo, type RecentProject } from './desktop';
import { attachRecoveryLifecycle, clearRecovery, readRecovery, writeRecovery } from './editor/recovery';
import { handleDesktopCloseRequest } from './editor/closeFlow';
import type { EditorDocument } from './editor/history';
import { useDocumentHistory } from './editor/useDocumentHistory';

type ParameterValue = CabinetParameters[keyof CabinetParameters];

const APP_VERSION = packageMetadata.version;
const FALLBACK_APP_INFO: AppInfo = {
  name: 'Cabinet WS Standalone',
  version: APP_VERSION,
  platform: 'browser',
  isPackaged: false,
};

const defaultStarter = familyStarter('utility', 'default');
const INITIAL_EDITOR: EditorDocument = {
  family: defaultStarter.family,
  starterId: defaultStarter.id,
  familyValues: defaultStarter.values,
  name: defaultStarter.name,
  displayUnits: 'mm',
  parameters: { ...defaultStarter.parameters },
};

function toCadDocument(editor: EditorDocument) {
  return buildFamilyCabinetDocument(editor.parameters, editor.name, editor.displayUnits, {
    family: editor.family,
    starterId: editor.starterId,
    familyValues: editor.familyValues,
  });
}

function fromCadDocument(document: CabinetDocument): EditorDocument {
  return {
    family: document.family,
    starterId: document.starterId,
    familyValues: document.familyValues,
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
  const [shopDocsOpen, setShopDocsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [appInfo, setAppInfo] = useState<AppInfo>(FALLBACK_APP_INFO);
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
  const hasSharedLayout = editor.family !== 'drawer' && editor.family !== 'equipment_stand';
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
  const shopDocs = useMemo(
    () => buildShopDocumentation(cadDocument, designHealth),
    [cadDocument, designHealth],
  );
  const manufacturing = useMemo(
    () => buildManufacturingModel(cadDocument, shopDocs, designHealth),
    [cadDocument, shopDocs, designHealth],
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
    const desktop = desktopApi();
    if (!desktop) return;
    let active = true;
    void desktop.getAppInfo()
      .then(info => {
        if (active) setAppInfo(info);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
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

    const persistRecovery = () => {
      if (dirty) {
        void writeRecovery(serialized).catch(() => setNotice('Recovery autosave failed'));
      } else {
        void clearRecovery().catch(() => setNotice('Recovery cleanup failed'));
      }
    };
    const flushDirtyRecovery = () => {
      if (!dirty) return;
      void writeRecovery(serialized).catch(error => {
        console.error('Could not flush recovery during a lifecycle transition.', error);
      });
    };

    const timer = window.setTimeout(persistRecovery, 650);
    const detachLifecycle = attachRecoveryLifecycle({
      dirty,
      flush: flushDirtyRecovery,
      blockUnload: !desktopApi(),
    });
    return () => {
      window.clearTimeout(timer);
      detachLifecycle();
    };
  }, [dirty, recoveryReady, serialized]);

  useEffect(() => {
    const desktop = desktopApi();
    if (!desktop) return;

    return desktop.onCloseRequested(() => {
      void handleDesktopCloseRequest({
        dirty,
        flushRecovery: async () => {
          if (!dirty) return;
          try {
            await writeRecovery(serialized);
          } catch (error) {
            console.error('Could not flush recovery before close.', error);
          }
        },
        confirmClose: () => desktop.confirmClose({ documentName: editor.name }),
        save: () => saveDocument(false),
        discard: async () => {
          try {
            await clearRecovery();
          } catch (error) {
            console.error('Could not clear recovery after explicit discard.', error);
          }
        },
        approve: () => desktop.resolveClose('approve'),
        cancel: () => desktop.resolveClose('cancel'),
      }).catch(error => {
        console.error('Could not complete the desktop close flow.', error);
        setNotice('Could not complete close request');
        void desktop.resolveClose('cancel').catch(() => undefined);
      });
    });
  }, [dirty, editor.name, currentPath, serialized]);

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

  function canonicalDocumentEdit(
    current: EditorDocument,
    nextParameters: Partial<CabinetParameters>,
  ): EditorDocument {
    const parameters = sanitizeParameters(nextParameters);
    return {
      ...current,
      starterId: null,
      familyValues: syncFamilyValuesFromParameters(current.family, current.familyValues, parameters),
      parameters,
    };
  }

  function updateParameter(key: keyof CabinetParameters, value: ParameterValue) {
    history.edit(current => {
      const next = { ...current.parameters, [key]: value } as Partial<CabinetParameters>;
      if (key === 'layoutMode' && value === 'sections' && current.parameters.layoutMode !== 'sections') {
        next.sectionNodes = simpleLayoutToSections(current.parameters);
      }
      return canonicalDocumentEdit(current, next);
    }, `parameter:${String(key)}`);

    if (key === 'layoutMode' && value === 'sections') {
      setSectionSelectedId(0);
    }
    setNotice(`Updated ${humanize(String(key))}`);
  }

  function updateFamilyValue(key: string, value: JsonValue) {
    history.edit(current => {
      const { familyValues, parameters } = editFamilySetting(current.family, current.familyValues, current.parameters, key, value);
      return {
        ...current,
        starterId: null,
        familyValues,
        parameters,
        ...(key === 'design_name' && typeof value === 'string' && value.trim()
          ? { name: value.trim().slice(0, 120) }
          : {}),
      };
    }, `family:${key}`);
    setNotice(`Updated ${humanize(key.replaceAll('_', ' '))}`);
  }

  function applyHardware(profileId: string) {
    const profile = hardwareDefinition(profileId);
    if (!profile) return;
    history.edit(current => canonicalDocumentEdit(current, {
      ...current.parameters,
      ...profile.parameterPatch,
    }), `hardware:${profile.category}`);
    setNotice(`Applied ${profile.label}`);
  }

  function updateSections(nodes: SectionNode[]) {
    history.edit(current => canonicalDocumentEdit(current, {
      ...current.parameters,
      layoutMode: 'sections',
      sectionNodes: nodes,
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
    const starter = familyStarter(editor.family, starterId);
    history.edit(current => ({
      family: starter.family,
      starterId: starter.id,
      familyValues: starter.values,
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
    setNotice(`Loaded ${familyDefinition(starter.family).name} · ${starter.name}`);
    requestAnimationFrame(() => viewport.current?.fit());
  }

  function applyFamily(family: CabinetFamily) {
    const starter = familyStarter(family);
    history.edit(current => ({
      family: starter.family,
      starterId: starter.id,
      familyValues: starter.values,
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
    setNotice(`Switched to ${familyDefinition(family).name}`);
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

  function selectPartById(partId: string) {
    const part = cadDocument.parts.find(candidate => candidate.id === partId);
    if (part) select(part);
  }

  function selectPartIds(partIds: string[]) {
    const valid = partIds.filter(id => cadDocument.parts.some(part => part.id === id));
    setSelectedIds(new Set(valid));
    setSelectedId(valid.at(-1) ?? null);
    setKernelSelection(null);
    if (valid.length) setNotice(`Highlighted ${valid.length} assembly part${valid.length === 1 ? '' : 's'}`);
  }

  function explodeAssemblyView() {
    setHiddenIds(new Set());
    setExplode(110);
    setProjection('perspective');
    viewport.current?.setView('iso');
    requestAnimationFrame(() => viewport.current?.fit());
    setNotice('Exploded assembly view');
  }

  function resetAssemblyView() {
    setHiddenIds(new Set());
    setExplode(0);
    setSelectedIds(new Set());
    setSelectedId(null);
    viewport.current?.setView('iso');
    requestAnimationFrame(() => viewport.current?.fit());
    setNotice('Assembly view reset');
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
    history.edit(current => canonicalDocumentEdit(current, {
      ...current.parameters,
      ...solution.patch,
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
        return canonicalDocumentEdit(current, { ...current.parameters, sectionNodes: nodes });
      }

      const count = current.parameters.shelfCount;
      const positions = Array.from({ length: count }, (_, index) => current.parameters.shelfPositions[index] ?? (index + 1) / (count + 1));
      positions[shelfIndex] = normalized;
      return canonicalDocumentEdit(current, { ...current.parameters, shelfPositions: positions });
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
      return canonicalDocumentEdit(current, { ...current.parameters, sectionNodes: nodes });
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

  async function saveTextExport(content: string, suggestedName: string, kind: 'csv' | 'html' | 'dxf' | 'svg' | 'json') {
    const desktop = desktopApi();
    if (desktop) {
      const result = await desktop.saveText({ content, suggestedName, kind });
      if (result.canceled) {
        setNotice('Shop documentation export canceled');
        return;
      }
      setNotice(`Exported ${result.name ?? suggestedName}`);
      return;
    }

    const mime = {
      csv: 'text/csv;charset=utf-8',
      html: 'text/html;charset=utf-8',
      dxf: 'application/dxf;charset=utf-8',
      svg: 'image/svg+xml;charset=utf-8',
      json: 'application/json;charset=utf-8',
    }[kind];
    const blob = new Blob([content], { type: mime });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = suggestedName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
    setNotice(`Downloaded ${suggestedName}`);
  }

  function exportCutListCsv() {
    void saveTextExport(cutListCsv(shopDocs), `${safeBaseName(editor.name)}-cut-list.csv`, 'csv');
  }

  function exportHardwareCsv() {
    void saveTextExport(hardwareCsv(shopDocs), `${safeBaseName(editor.name)}-hardware.csv`, 'csv');
  }

  function exportCutListReport() {
    void saveTextExport(
      buildCutListReportHtml(cadDocument, shopDocs, editor.displayUnits),
      `${safeBaseName(editor.name)}-bom-cut-list.html`,
      'html',
    );
  }

  function exportAssemblyPacket() {
    void saveTextExport(
      buildAssemblyPacketHtml(cadDocument, shopDocs, editor.displayUnits),
      `${safeBaseName(editor.name)}-assembly-packet.html`,
      'html',
    );
  }

  function exportManufacturingPart(partId: string, kind: 'dxf' | 'svg' | 'drilling' | 'metadata') {
    const part = manufacturing.parts.find(candidate => candidate.partId === partId);
    if (!part) return;
    const base = safeBaseName(part.partNumber);
    if (kind === 'dxf') {
      void saveTextExport(part.dxf, base + '.dxf', 'dxf');
      return;
    }
    if (kind === 'svg') {
      void saveTextExport(part.svg, base + '.svg', 'svg');
      return;
    }
    if (kind === 'drilling') {
      void saveTextExport(part.drillingCsv, base + '-drilling.csv', 'csv');
      return;
    }
    void saveTextExport(JSON.stringify({
      partId: part.partId,
      partNumber: part.partNumber,
      name: part.name,
      material: part.material,
      plane: part.plane,
      metadata: part.metadata,
      operations: part.operations,
    }, null, 2), base + '-manufacturing.json', 'json');
  }

  function exportManufacturingLayer(partId: string, kind: ManufacturingOperationKind) {
    const part = manufacturing.parts.find(candidate => candidate.partId === partId);
    if (!part) return;
    void saveTextExport(
      operationLayerDxf(part, kind),
      safeBaseName(part.partNumber) + '-' + kind.toLowerCase().replace('_', '-') + '.dxf',
      'dxf',
    );
  }

  async function exportManufacturingPackage(reviewedAt: string) {
    try {
      const bytes = reviewedManufacturingZip(manufacturing, reviewedAt);
      const suggestedName = safeBaseName(editor.name) + '-manufacturing-v0.14.zip';
      const desktop = desktopApi();
      const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

      if (desktop) {
        const result = await desktop.saveBinary({ bytes: arrayBuffer, suggestedName, kind: 'zip' });
        if (result.canceled) {
          setNotice('Manufacturing package export canceled');
          return;
        }
        setNotice(`Exported reviewed manufacturing package · ${result.name ?? suggestedName}`);
        return;
      }

      const blob = new Blob([arrayBuffer], { type: 'application/zip' });
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = suggestedName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(href);
      setNotice(`Downloaded reviewed manufacturing package · ${suggestedName}`);
    } catch (error) {
      setNotice(error instanceof Error ? `Manufacturing export failed: ${error.message}` : 'Manufacturing export failed');
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

    const starter = familyStarter(editor.family);
    const next: EditorDocument = {
      family: starter.family,
      starterId: starter.id,
      familyValues: starter.values,
      name: starter.name,
      displayUnits: editor.displayUnits,
      parameters: { ...starter.parameters },
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
    setNotice(`New ${familyDefinition(starter.family).name}`);
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
      setNotice(`Imported web ${familyDefinition(document.family).name} · native family controls ready${warningText}`);
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

  async function saveDocument(saveAs = false): Promise<boolean> {
    const desktop = desktopApi();

    try {
      if (desktop) {
        const result = await desktop.saveDocument({
          content: serialized,
          path: currentPath,
          suggestedName: suggestedFileName(editor.name),
          saveAs,
        });
        if (result.canceled) return false;

        setCurrentPath(result.path ?? currentPath);
        setSavedContent(serialized);
        try {
          await clearRecovery();
        } catch (error) {
          console.error('Saved the project but could not clear its recovery copy.', error);
        }
        await refreshRecent();
        setNotice(`Saved ${result.name ?? editor.name}`);
        return true;
      }

      downloadDocument(cadDocument);
      setSavedContent(serialized);
      try {
        await clearRecovery();
      } catch (error) {
        console.error('Downloaded the project but could not clear its recovery copy.', error);
      }
      setNotice('Downloaded cabinet document');
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not save document');
      return false;
    }
  }

  return <WorkspaceErrorBoundary onError={() => {
    if (recoveryReady && dirty) {
      void writeRecovery(serialized).catch(error => {
        console.error('Could not flush recovery after workspace error.', error);
      });
    }
  }}>
  <main className="app-shell">
    <header className="app-header">
      <div className="brand"><span className="brand-mark"><Box size={22} /></span><div><strong>Cabinet WS</strong><small>{familyDefinition(editor.family).shortCode} CAD · v{APP_VERSION}</small></div></div>
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
      onOpenShopDocs={() => setShopDocsOpen(true)}
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
      onAbout={() => setAboutOpen(true)}
    />
    <input ref={fileInput} hidden type="file" accept=".json,.cabinetws.json,.cabinet.json" onChange={event => { void openBrowserFile(event.target.files?.[0]); }} />

    <div className={`workspace ${hardwareCatalogExpanded ? 'hardware-browser-expanded' : ''} ${partBrowserExpanded ? 'parts-browser-expanded' : ''}`}>
      <div className="left-stack">
        <section className="panel preset-panel family-starter-panel">
          <span className="eyebrow">CABINET FAMILY</span>
          <SelectControl
            ariaLabel="Cabinet family"
            value={editor.family}
            options={FAMILY_DEFINITIONS.map(family => ({ value: family.id, label: family.shortCode + ' · ' + family.name }))}
            onChange={value => applyFamily(value as CabinetFamily)}
          />
          <span className="eyebrow family-starter-eyebrow">EXAMPLE CABINET</span>
          <SelectControl
            ariaLabel={familyDefinition(editor.family).name + ' starter'}
            value={editor.starterId ?? ''}
            placeholder="Choose an example…"
            options={familyStarters(editor.family).map(starter => ({
              value: starter.id,
              label: starter.group ? starter.group + ' · ' + starter.name : starter.name,
            }))}
            onChange={applyStarter}
          />
          <p>{familyDefinition(editor.family).description} {familyStarters(editor.family).length} shipped examples are available for this family.</p>
        </section>
        <div className={`layout-navigation-row ${hardwareCatalogExpanded ? 'hardware-open' : 'hardware-collapsed'} ${partBrowserExpanded ? 'parts-open' : 'parts-collapsed'}`}>
          <HardwareDrawer
            parameters={editor.parameters}
            expanded={hardwareCatalogExpanded}
            onToggle={() => setHardwareCatalogExpanded(current => !current)}
            onApply={applyHardware}
          />
          <div className={`layout-primary-column ${hasSharedLayout ? 'shared-layout' : 'dedicated-layout'}`}>
            {hasSharedLayout && <SectionLayoutPanel
              parameters={editor.parameters}
              thickness={stockThickness(editor.parameters.carcassStock, editor.parameters.materialThickness)}
              units={editor.displayUnits}
              selectedSectionId={sectionSelectedId}
              onParameterChange={updateParameter}
              onSelectedSectionChange={setSectionSelectedId}
              onChange={updateSections}
            />}
            <DesignHealthPanel
              report={designHealth}
              parameters={editor.parameters}
              units={editor.displayUnits}
              onApplySolution={applyFitSolution}
            />
          </div>
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
          <p>{kernelFooter(kernel.status, kernel.result?.stats.featureCount ?? 0, kernel.diagnostics.length, familyDefinition(editor.family).name)}</p>
        </div>
      </section>

      <PropertiesPanel
        parameters={editor.parameters}
        family={editor.family}
        familyValues={editor.familyValues}
        familyLabel={familyDefinition(editor.family).name}
        selected={selected}
        displayUnits={editor.displayUnits}
        onChange={updateParameter}
        onFamilyValueChange={updateFamilyValue}
        topologySelection={kernelSelection}
        kernelDiagnostics={kernel.diagnostics}
        onShowCabinetSettings={() => select(null)}
        onOpenSection={openSection}
      />
    </div>

    {aboutOpen && <AboutDialog info={appInfo} onClose={() => setAboutOpen(false)} />}

    {shopDocsOpen && <ShopDocsPanel
      document={cadDocument}
      docs={shopDocs}
      manufacturing={manufacturing}
      units={editor.displayUnits}
      selectedId={selectedId}
      onClose={() => setShopDocsOpen(false)}
      onSelectPart={selectPartById}
      onSelectParts={selectPartIds}
      onExplodeAssembly={explodeAssemblyView}
      onResetAssembly={resetAssemblyView}
      onExportCutListCsv={exportCutListCsv}
      onExportHardwareCsv={exportHardwareCsv}
      onExportCutListReport={exportCutListReport}
      onExportAssemblyPacket={exportAssemblyPacket}
      onExportManufacturingPart={exportManufacturingPart}
      onExportManufacturingLayer={exportManufacturingLayer}
      onExportManufacturingPackage={exportManufacturingPackage}
      onExportProductionText={(content, suggestedName, kind) => { void saveTextExport(content, suggestedName, kind); }}
    />}
  </main>
  </WorkspaceErrorBoundary>;
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

function kernelFooter(
  status: 'idle' | 'loading' | 'ready' | 'error',
  featureCount: number,
  diagnosticCount: number,
  familyName: string,
) {
  if (status === 'ready') return `${familyName} · v${APP_VERSION} · exact B-Rep · ${featureCount} semantic features · STEP`;
  if (status === 'error') return `${familyName} · v${APP_VERSION} · exact kernel diagnostics: ${diagnosticCount}`;
  return `${familyName} · v${APP_VERSION} · OpenCascade worker initializing…`;
}

