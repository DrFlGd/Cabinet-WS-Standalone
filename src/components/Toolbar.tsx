import { Box, Focus, Maximize2, Move3D, PanelTop, Save, Upload, View, Rotate3D } from 'lucide-react';
import type { ViewPreset } from '../cad/types';

type Props = {
  explode: number;
  onExplode: (value: number) => void;
  onView: (preset: ViewPreset) => void;
  onFit: () => void;
  onSave: () => void;
  onOpen: () => void;
};

export default function Toolbar({ explode, onExplode, onView, onFit, onSave, onOpen }: Props) {
  return <div className="toolbar">
    <div className="toolbar-group">
      <button onClick={onOpen}><Upload size={15} /> Open</button>
      <button onClick={onSave}><Save size={15} /> Save</button>
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
    <label className="explode-control"><Move3D size={16} /><span>Explode</span><input type="range" min="0" max="180" value={explode} onChange={event => onExplode(Number(event.target.value))} /><output>{explode} mm</output></label>
    <button className="icon-button" onClick={onFit} title="Fit model"><Maximize2 size={16} /></button>
  </div>;
}
