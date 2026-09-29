import { ChevronLeft, ChevronRight, Eye, EyeOff, Layers3 } from 'lucide-react';
import type { CabinetDocument, CadPart, PartCategory } from '../cad/types';

type Props = {
  document: CabinetDocument;
  selectedId: string | null;
  selectedIds: Set<string>;
  hiddenIds: Set<string>;
  expanded: boolean;
  onToggle: () => void;
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
  worktop: 'Worktops',
  divider: 'Section Dividers',
  frame: 'Face Frame',
};

export default function TreePanel({
  document,
  selectedId,
  selectedIds,
  hiddenIds,
  expanded,
  onToggle,
  onSelect,
  onToggleVisibility,
}: Props) {
  const categories = [...new Set(document.parts.map(part => part.category))];

  if (!expanded) {
    return (
      <aside className="panel tree-panel collapsed">
        <button
          type="button"
          className="parts-drawer-toggle collapsed"
          onClick={onToggle}
          aria-label="Open parts browser"
          title="Open parts browser"
        >
          <Layers3 size={17} />
          <span>Parts</span>
          <ChevronRight size={14} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="panel tree-panel expanded">
      <div className="panel-heading parts-drawer-heading">
        <Layers3 size={17} />
        <div><strong>Parts</strong><span>{document.parts.length} generated parts</span></div>
        <button
          type="button"
          className="icon-button subtle parts-drawer-collapse"
          onClick={onToggle}
          aria-label="Collapse parts browser"
          title="Collapse parts browser"
        >
          <ChevronLeft size={14} />
        </button>
      </div>
      <div className="tree-scroll">
        <button className={`tree-row root ${selectedId === null ? 'selected' : ''}`} onClick={() => onSelect(null)}>
          <span className="tree-icon">▣</span><span>{document.name}</span>
        </button>
        {categories.map(category => (
          <details key={category} open>
            <summary>{labels[category]}</summary>
            {document.parts.filter(part => part.category === category).map(part => (
              <div className={`tree-row ${selectedIds.has(part.id) ? 'selected' : ''}`} key={part.id}>
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
      </div>
    </aside>
  );
}
