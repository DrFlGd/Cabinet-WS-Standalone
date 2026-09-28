import {
  Box,
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
import type { DisplayUnits } from '../cad/units';
import type { ViewPreset } from '../cad/types';
import type { RecentProject } from '../desktop';

type Props = {
  explode: number;
  units: DisplayUnits;
  canUndo: boolean;
  canRedo: boolean;
  recentProjects: RecentProject[];
  onExplode: (value: number) => void;
  onView: (preset: ViewPreset) => void;
  onFit: () => void;
  onNew: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onOpen: () => void;
  onOpenRecent: (path: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onUnits: (units: DisplayUnits) => void;
};

export default function Toolbar({
  explode,
  units,
  canUndo,
  canRedo,
  recentProjects,
  onExplode,
  onView,
  onFit,
  onNew,
  onSave,
  onSaveAs,
  onOpen,
  onOpenRecent,
  onUndo,
  onRedo,
  onUnits,
}: Props) {
  return <div className="toolbar">
    <div className="toolbar-group">
      <button onClick={onNew}><FilePlus2 size={15} /> New</button>
      <button onClick={onOpen}><Upload size={15} /> Open</button>
      {recentProjects.length > 0 && (
        <select className="recent-select" aria-label="Open recent project" value="" onChange={event => {
          if (event.target.value) onOpenRecent(event.target.value);
        }}>
          <option value="">Recent…</option>
          {recentProjects.map(project => <option key={project.path} value={project.path}>{project.name}</option>)}
        </select>
      )}
      <button onClick={onSave}><Save size={15} /> Save</button>
      <button onClick={onSaveAs}><SaveAll size={15} /> Save As</button>
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
    <span className="toolbar-spacer" />
    <label className="units-control"><Ruler size={15} /><span>Units</span><select value={units} onChange={event => onUnits(event.target.value as DisplayUnits)}><option value="mm">mm</option><option value="in">inches</option></select></label>
    <label className="explode-control"><Move3D size={16} /><span>Explode</span><input type="range" min="0" max="180" value={explode} onChange={event => onExplode(Number(event.target.value))} /><output>{explode} mm</output></label>
    <button className="icon-button" onClick={onFit} title="Fit model"><Maximize2 size={16} /></button>
  </div>;
}
