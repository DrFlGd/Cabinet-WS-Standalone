import {
  Box,
  ClipboardList,
  FileDown,
  FilePlus2,
  Focus,
  Maximize2,
  Move3D,
  PanelTop,
  Redo2,
  Rotate3D,
  Ruler,
  Save,
  SaveAll,
  Undo2,
  Upload,
  View,
} from 'lucide-react';
import { formatDimension, unitLabel, type DisplayUnits } from '../cad/units';
import type { ViewPreset } from '../cad/types';
import type { ViewportDisplayMode, ViewportProjection } from '../cad/CadViewport';
import type { RecentProject } from '../desktop';
import SelectControl from './SelectControl';

type Props = {
  explode: number;
  units: DisplayUnits;
  canUndo: boolean;
  canRedo: boolean;
  canExportStep: boolean;
  recentProjects: RecentProject[];
  displayMode: ViewportDisplayMode;
  projection: ViewportProjection;
  clipEnabled: boolean;
  clipZ: number;
  clipMax: number;
  hasSelection: boolean;
  onExplode: (value: number) => void;
  onView: (preset: ViewPreset) => void;
  onFit: () => void;
  onNew: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExportStep: () => void;
  onOpenShopDocs: () => void;
  onOpen: () => void;
  onOpenRecent: (path: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onUnits: (units: DisplayUnits) => void;
  onDisplayMode: (mode: ViewportDisplayMode) => void;
  onProjection: (projection: ViewportProjection) => void;
  onClipEnabled: (enabled: boolean) => void;
  onClipZ: (value: number) => void;
  onHideSelected: () => void;
  onIsolateSelected: () => void;
  onShowAll: () => void;
};

export default function Toolbar({
  explode,
  units,
  canUndo,
  canRedo,
  canExportStep,
  recentProjects,
  displayMode,
  projection,
  clipEnabled,
  clipZ,
  clipMax,
  hasSelection,
  onExplode,
  onView,
  onFit,
  onNew,
  onSave,
  onSaveAs,
  onExportStep,
  onOpenShopDocs,
  onOpen,
  onOpenRecent,
  onUndo,
  onRedo,
  onUnits,
  onDisplayMode,
  onProjection,
  onClipEnabled,
  onClipZ,
  onHideSelected,
  onIsolateSelected,
  onShowAll,
}: Props) {
  return <div className="toolbar">
    <div className="toolbar-group">
      <button onClick={onNew}><FilePlus2 size={15} /> New</button>
      <button onClick={onOpen}><Upload size={15} /> Open</button>
      {recentProjects.length > 0 && (
        <SelectControl
          className="recent-select"
          ariaLabel="Open recent project"
          value=""
          placeholder="Recent…"
          options={recentProjects.map(project => ({ value: project.path, label: project.name }))}
          onChange={value => {
            if (value) onOpenRecent(value);
          }}
        />
      )}
      <button onClick={onSave}><Save size={15} /> Save</button>
      <button onClick={onSaveAs}><SaveAll size={15} /> Save As</button>
      <button onClick={onExportStep} disabled={!canExportStep} title="Export exact OpenCascade assembly as STEP">
        <FileDown size={15} /> STEP
      </button>
      <button onClick={onOpenShopDocs} title="Open BOM, cut list, and assembly documentation">
        <ClipboardList size={15} /> Shop Docs
      </button>
    </div>
    <span className="toolbar-divider" />
    <div className="toolbar-group">
      <button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)"><Undo2 size={15} /> Undo</button>
      <button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)"><Redo2 size={15} /> Redo</button>
    </div>
    <span className="toolbar-divider" />
    <div className="toolbar-group view-buttons">
      <button onClick={() => onView('iso')} title="Isometric"><Rotate3D size={16} /> Iso</button>
      <button onClick={() => onView('front')} title="Front view"><PanelTop size={16} /> Front</button>
      <button onClick={() => onView('right')} title="Right view"><View size={16} /> Right</button>
      <button onClick={() => onView('top')} title="Top view"><Box size={16} /> Top</button>
      <button onClick={onFit} title="Fit model"><Focus size={16} /> Fit</button>
    </div>
    <span className="toolbar-divider" />
    <div className="toolbar-group selection-actions">
      <button onClick={onIsolateSelected} disabled={!hasSelection} title="Isolate selected parts">Isolate</button>
      <button onClick={onHideSelected} disabled={!hasSelection} title="Hide selected parts">Hide</button>
      <button onClick={onShowAll} title="Show all hidden parts">Show all</button>
    </div>
    <span className="toolbar-spacer" />
    <div className="viewport-mode-controls">
      <SelectControl
        ariaLabel="Viewport display mode"
        value={displayMode}
        options={[
          { value: 'shaded-edges', label: 'Shaded + edges' },
          { value: 'shaded', label: 'Shaded' },
          { value: 'wireframe', label: 'Wireframe' },
        ]}
        onChange={value => onDisplayMode(value as ViewportDisplayMode)}
      />
      <SelectControl
        ariaLabel="Camera projection"
        value={projection}
        options={[
          { value: 'perspective', label: 'Perspective' },
          { value: 'orthographic', label: 'Orthographic' },
        ]}
        onChange={value => onProjection(value as ViewportProjection)}
      />
    </div>
    <label className="clip-control" title="Clip the model above this Z height">
      <input type="checkbox" checked={clipEnabled} onChange={event => onClipEnabled(event.target.checked)} />
      <span>Clip</span>
      <input
        type="range"
        min="0"
        max={Math.max(1, clipMax)}
        step="1"
        value={Math.min(clipZ, clipMax)}
        disabled={!clipEnabled}
        onChange={event => onClipZ(Number(event.target.value))}
      />
      <output>{formatDimension(clipZ, units)}</output>
    </label>
    <div className="units-control"><Ruler size={15} /><span>Units</span><SelectControl ariaLabel="Display units" value={units} options={[{ value: 'mm', label: 'mm' }, { value: 'in', label: 'inches' }]} onChange={value => onUnits(value as DisplayUnits)} /></div>
    <label className="explode-control"><Move3D size={16} /><span>Explode</span><input type="range" min="0" max="180" value={explode} onChange={event => onExplode(Number(event.target.value))} /><output>{formatDimension(explode, units)} {unitLabel(units)}</output></label>
    <button className="icon-button" onClick={onFit} title="Fit model"><Maximize2 size={16} /></button>
  </div>;
}
