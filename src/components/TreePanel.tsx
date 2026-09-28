import { Eye, EyeOff, Layers3 } from 'lucide-react';
import type { CabinetDocument, CadPart, PartCategory } from '../cad/types';

type Props = {
  document: CabinetDocument;
  selectedId: string | null;
  hiddenIds: Set<string>;
  onSelect: (part: CadPart | null) => void;
  onToggleVisibility: (id: string) => void;
};

const labels: Record<PartCategory, string> = {
  carcass: 'Carcass',
  back: 'Back',
  shelf: 'Shelves',
  front: 'Fronts',
  drawer: 'Drawers',
  hardware: 'Hardware',
};

export default function TreePanel({ document, selectedId, hiddenIds, onSelect, onToggleVisibility }: Props) {
  const categories = [...new Set(document.parts.map(part => part.category))];
  return (
    <aside className="panel tree-panel">
      <div className="panel-heading">
        <Layers3 size={17} />
        <div><strong>Model</strong><span>{document.parts.length} parts</span></div>
      </div>
      <button className={`tree-row root ${selectedId === null ? 'selected' : ''}`} onClick={() => onSelect(null)}>
        <span className="tree-icon">▣</span><span>{document.name}</span>
      </button>
      {categories.map(category => (
        <details key={category} open>
          <summary>{labels[category]}</summary>
          {document.parts.filter(part => part.category === category).map(part => (
            <div className={`tree-row ${selectedId === part.id ? 'selected' : ''}`} key={part.id}>
              <button className="tree-select" onClick={() => onSelect(part)} title={part.id}>
                <span className="tree-icon">◇</span><span>{part.name}</span>
              </button>
              <button className="icon-button subtle" onClick={() => onToggleVisibility(part.id)} aria-label={`${hiddenIds.has(part.id) ? 'Show' : 'Hide'} ${part.name}`}>
                {hiddenIds.has(part.id) ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          ))}
        </details>
      ))}
    </aside>
  );
}
