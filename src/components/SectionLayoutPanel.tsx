import { useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Columns3, GripVertical, Rows3 } from 'lucide-react';
import {
  cloneSectionNodes,
  collapseSection,
  sectionLeaf,
  sectionLayoutErrors,
  sectionRects,
  sectionRoot,
  selectedSectionIds,
} from '../cad/sections';
import type { CabinetParameters, SectionNode } from '../cad/types';
import { formatDimension, type DisplayUnits } from '../cad/units';
import DimensionInput from './DimensionInput';
import SelectControl from './SelectControl';

type Props = {
  parameters: CabinetParameters;
  thickness: number;
  units: DisplayUnits;
  expanded: boolean;
  selectedSectionId: number;
  onToggle: () => void;
  onSelectedSectionChange: (sectionId: number) => void;
  onChange: (nodes: SectionNode[]) => void;
};

type DragState = {
  current: number;
  previous: number;
  axis: 'x' | 'z';
  startClient: number;
  scale: number;
  nodes: SectionNode[];
  rects: ReturnType<typeof sectionRects>;
};

export default function SectionLayoutPanel({
  parameters,
  thickness,
  units,
  expanded,
  selectedSectionId,
  onToggle,
  onSelectedSectionChange,
  onChange,
}: Props) {
  const [draft, setDraft] = useState<SectionNode[] | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const nodes = draft ?? parameters.sectionNodes;
  const root = useMemo(() => sectionRoot(parameters, thickness), [parameters, thickness]);
  const rects = useMemo(() => sectionRects(nodes, root, thickness), [nodes, root, thickness]);
  const errors = useMemo(
    () => sectionLayoutErrors({ ...parameters, sectionNodes: nodes }, thickness),
    [nodes, parameters, thickness],
  );

  const selectedId = Math.min(Math.max(0, selectedSectionId), Math.max(0, nodes.length - 1));
  const node = nodes[selectedId];
  const rect = rects[selectedId];
  const highlighted = errors.length ? new Set<number>() : selectedSectionIds(nodes, selectedId);

  function commit(next: SectionNode[]) {
    setDraft(null);
    onChange(cloneSectionNodes(next));
  }

  function editField(index: number, value: SectionNode[number]) {
    const next = cloneSectionNodes(nodes);
    (next[selectedId] as unknown as Array<SectionNode[number]>)[index] = value;
    commit(next);
  }

  function split(axis: 'x' | 'z', count: 2 | 3) {
    if (!node || node[2] !== 'leaf' || nodes.length + count > 31) return;
    const next = cloneSectionNodes(nodes);
    next[selectedId][2] = axis;
    next[selectedId][10] = 'panel';
    for (let order = 0; order < count; order += 1) {
      const child = sectionLeaf(selectedId, order, node[5], node[6]);
      child[7] = node[7];
      child[8] = node[8];
      child[9] = [...node[9]];
      child[11] = node[11];
      next.push(child);
    }
    commit(next);
  }

  function startDrag(
    event: React.PointerEvent<SVGLineElement>,
    current: number,
    previous: number,
    axis: 'x' | 'z',
  ) {
    event.preventDefault();
    event.stopPropagation();

    const svg = svgRef.current;
    if (!svg) return;
    const bounds = svg.getBoundingClientRect();
    const scale = axis === 'x'
      ? root.w / Math.max(1, bounds.width)
      : root.h / Math.max(1, bounds.height);

    dragRef.current = {
      current,
      previous,
      axis,
      startClient: axis === 'x' ? event.clientX : event.clientY,
      scale,
      nodes: cloneSectionNodes(nodes),
      rects,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelectedSectionChange(nodes[current][0]);
  }

  function moveDrag(event: React.PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    if (!drag) return;

    const client = drag.axis === 'x' ? event.clientX : event.clientY;
    const delta = (client - drag.startClient) * drag.scale;
    const size = (id: number) =>
      drag.axis === 'x' ? drag.rects[id]?.w ?? 0 : drag.rects[id]?.h ?? 0;
    const before = size(drag.previous);
    const after = size(drag.current);
    const movement = Math.max(60 - before, Math.min(after - 60, delta));

    const next = cloneSectionNodes(drag.nodes);
    const parent = next[drag.current][0];

    next.forEach((candidate, index) => {
      if (candidate[0] === parent && candidate[3] === 'weight') {
        candidate[4] = Math.max(0.1, size(index));
      }
    });

    next[drag.previous][3] = 'weight';
    next[drag.current][3] = 'weight';
    next[drag.previous][4] = Math.max(0.1, before + movement);
    next[drag.current][4] = Math.max(0.1, after - movement);
    setDraft(next);
  }

  function finishDrag(cancel = false) {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (!cancel && draft) commit(draft);
    else setDraft(null);
  }

  const format = (value: number) => `${formatDimension(value, units)} ${units}`;

  return (
    <section className={`panel section-layout-panel ${expanded ? 'expanded' : 'collapsed'}`}>
      <button
        type="button"
        className="section-layout-heading section-layout-toggle"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div>
          <span className="eyebrow">SECTION LAYOUT</span>
          <strong>Front elevation editor</strong>
        </div>
        <span className="section-layout-toggle-status">
          {nodes.length}/31 nodes
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {expanded && <div className="section-layout-content">
      {errors.length ? (
        <div className="section-error" role="alert">{errors[0]}</div>
      ) : (
        <svg
          ref={svgRef}
          className="section-layout-svg"
          viewBox={`0 0 ${root.w} ${root.h}`}
          onPointerMove={moveDrag}
          onPointerUp={() => finishDrag()}
          onPointerCancel={() => finishDrag(true)}
          aria-label="Utility Cabinet section layout"
        >
          <rect width={root.w} height={root.h} className="section-frame" />
          {rects
            .filter(sectionRect => nodes[sectionRect.id][2] === 'leaf')
            .map(sectionRect => {
              const sectionNode = nodes[sectionRect.id];
              const x = sectionRect.x - root.x;
              const y = root.h - (sectionRect.z - root.z) - sectionRect.h;
              const label =
                sectionNode[5] === 'drawers'
                  ? `${sectionNode[6]} drawer${sectionNode[6] === 1 ? '' : 's'}`
                  : sectionNode[5] === 'doors'
                    ? `${sectionNode[6]} door${sectionNode[6] === 1 ? '' : 's'}`
                    : sectionNode[6]
                      ? `${sectionNode[6]} shelves`
                      : 'Open';

              return (
                <g
                  key={sectionRect.id}
                  className={highlighted.has(sectionRect.id) ? 'section-leaf selected' : 'section-leaf'}
                  onPointerDown={event => {
                    event.stopPropagation();
                    onSelectedSectionChange(sectionRect.id);
                  }}
                >
                  <rect x={x + 1} y={y + 1} width={Math.max(1, sectionRect.w - 2)} height={Math.max(1, sectionRect.h - 2)} />
                  <text x={x + sectionRect.w / 2} y={y + sectionRect.h / 2 - 7}>{label}</text>
                  <text className="section-size-text" x={x + sectionRect.w / 2} y={y + sectionRect.h / 2 + 12}>
                    {Math.round(sectionRect.w)} × {Math.round(sectionRect.h)}
                  </text>
                </g>
              );
            })}

          {rects
            .filter(sectionRect => sectionRect.id > 0 && nodes[sectionRect.id][1] > 0)
            .map(sectionRect => {
              const child = nodes[sectionRect.id];
              const parent = nodes[child[0]];
              const parentRect = rects[child[0]];
              const axis = parent[2] as 'x' | 'z';
              const gap = parent[10] === 'none' ? 0 : thickness;
              const previous = nodes.findIndex(
                candidate => candidate[0] === child[0] && candidate[1] === child[1] - 1,
              );

              if (previous < 0) return null;

              const x = axis === 'x'
                ? sectionRect.x - root.x - gap / 2
                : parentRect.x - root.x;
              const y = axis === 'z'
                ? root.h - (sectionRect.z - root.z + sectionRect.h + gap / 2)
                : root.h - (parentRect.z - root.z + parentRect.h);

              return (
                <line
                  key={`handle-${sectionRect.id}`}
                  className={`section-divider-handle ${axis}`}
                  x1={x}
                  x2={axis === 'x' ? x : x + parentRect.w}
                  y1={y}
                  y2={axis === 'x' ? y + parentRect.h : y}
                  onPointerDown={event => startDrag(event, sectionRect.id, previous, axis)}
                />
              );
            })}
        </svg>
      )}

      {node && (
        <div className="section-layout-controls">
          <label>
            Selected
            <SelectControl
              ariaLabel="Selected section"
              value={String(selectedId)}
              options={nodes.map((candidate, index) => ({
                value: String(index),
                label: `Section ${index + 1} · ${candidate[2] === 'leaf' ? candidate[5] : candidate[2] === 'x' ? 'left/right split' : 'top/bottom split'}`,
              }))}
              onChange={value => onSelectedSectionChange(Number(value))}
            />
          </label>

          {rect && <p className="section-current-size">{format(rect.w)} wide × {format(rect.h)} high</p>}

          {selectedId !== 0 && (
            <div className="section-control-grid">
              <label>
                Size mode
                <SelectControl
                  ariaLabel="Section size mode"
                  value={node[3]}
                  options={[
                    { value: 'weight', label: 'Proportional' },
                    { value: 'mm', label: 'Fixed opening' },
                  ]}
                  onChange={value => {
                    const next = cloneSectionNodes(nodes);
                    const parent = next[node[0]];
                    const axis = parent[2];
                    const currentSize = axis === 'x' ? rect?.w : rect?.h;
                    next[selectedId][3] = value as SectionNode[3];
                    next[selectedId][4] = currentSize ?? node[4];
                    commit(next);
                  }}
                />
              </label>

              {node[3] === 'mm' ? (
                <label>
                  Clear size
                  <DimensionInput
                    value={node[4]}
                    units={units}
                    min={60}
                    step={1}
                    onChange={value => editField(4, Math.max(60, value))}
                  />
                </label>
              ) : (
                <label>
                  Weight
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={node[4]}
                    onChange={event => editField(4, Math.max(0.1, event.currentTarget.valueAsNumber || 0.1))}
                  />
                </label>
              )}
            </div>
          )}

          {node[2] === 'leaf' ? (
            <>
              <div className="section-control-grid">
                <label>
                  Contents
                  <SelectControl
                    ariaLabel="Section contents"
                    value={node[5]}
                    options={[
                      { value: 'drawers', label: 'Drawers' },
                      { value: 'doors', label: 'Doors' },
                      { value: 'open', label: 'Open / shelves' },
                    ]}
                    onChange={value => {
                      const next = cloneSectionNodes(nodes);
                      const nextType = value as SectionNode[5];
                      next[selectedId][5] = nextType;
                      next[selectedId][6] = nextType === 'open' ? 0 : nextType === 'doors' ? 2 : 3;
                      next[selectedId][9] = Array(Math.max(1, next[selectedId][6])).fill(1);
                      commit(next);
                    }}
                  />
                </label>

                <label>
                  {node[5] === 'drawers' ? 'Drawer count' : node[5] === 'doors' ? 'Door count' : 'Shelf count'}
                  <input
                    type="number"
                    min={node[5] === 'open' ? 0 : 1}
                    max={node[5] === 'doors' ? 2 : 8}
                    value={node[6]}
                    onChange={event => {
                      const next = cloneSectionNodes(nodes);
                      const max = node[5] === 'doors' ? 2 : 8;
                      const count = Math.max(node[5] === 'open' ? 0 : 1, Math.min(max, event.currentTarget.valueAsNumber || 0));
                      next[selectedId][6] = count;
                      while (next[selectedId][9].length < Math.max(1, count)) next[selectedId][9].push(1);
                      commit(next);
                    }}
                  />
                </label>
              </div>

              {node[5] === 'doors' && (
                <label>
                  Shelves behind doors
                  <input
                    type="number"
                    min={0}
                    max={8}
                    value={node[11]}
                    onChange={event => editField(11, Math.max(0, Math.min(8, event.currentTarget.valueAsNumber || 0)))}
                  />
                </label>
              )}

              {node[5] === 'drawers' && (
                <div className="section-control-grid">
                  <label>
                    Drawer heights
                    <SelectControl
                      ariaLabel="Drawer height mode"
                      value={node[7]}
                      options={[
                        { value: 'equal', label: 'Equal' },
                        { value: 'graduated', label: 'Graduated' },
                        { value: 'custom_weights', label: 'Custom weights' },
                      ]}
                      onChange={value => editField(7, value as SectionNode[7])}
                    />
                  </label>
                  {node[7] === 'graduated' && (
                    <label>
                      Growth
                      <input type="number" min={0} step={0.05} value={node[8]} onChange={event => editField(8, Math.max(0, event.currentTarget.valueAsNumber || 0))} />
                    </label>
                  )}
                </div>
              )}

              {node[5] === 'drawers' && node[7] === 'custom_weights' && (
                <div className="section-weight-list">
                  {node[9].slice(0, node[6]).map((weight, index) => (
                    <label key={index}>
                      D{index + 1}
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={weight}
                        onChange={event => {
                          const next = cloneSectionNodes(nodes);
                          next[selectedId][9][index] = Math.max(0.1, event.currentTarget.valueAsNumber || 0.1);
                          commit(next);
                        }}
                      />
                    </label>
                  ))}
                </div>
              )}

              <div className="section-actions">
                <button type="button" onClick={() => split('x', 2)} disabled={nodes.length > 29}><Columns3 size={13} /> Split L/R</button>
                <button type="button" onClick={() => split('z', 2)} disabled={nodes.length > 29}><Rows3 size={13} /> Split T/B</button>
                <button type="button" onClick={() => split('x', 3)} disabled={nodes.length > 28}>3 columns</button>
              </div>
            </>
          ) : (
            <>
              <label>
                Divider construction
                <SelectControl
                  ariaLabel="Divider construction"
                  value={node[10]}
                  options={[
                    { value: 'panel', label: 'Full-depth panel' },
                    ...(node[2] === 'z' ? [{ value: 'rail', label: 'Front support rail' }] : []),
                    { value: 'none', label: 'Layout boundary only' },
                  ]}
                  onChange={value => editField(10, value as SectionNode[10])}
                />
              </label>
              <button
                type="button"
                className="section-collapse"
                onClick={() => {
                  const next = collapseSection(nodes, selectedId);
                  commit(next);
                  onSelectedSectionChange(Math.min(selectedId, next.length - 1));
                }}
              >
                Replace subtree with one opening
              </button>
            </>
          )}
        </div>
      )}

      <div className="section-layout-tip"><GripVertical size={12} /> Drag divider lines directly in the front view. Fixed sizes remain exact; dragged neighbors become proportional.</div>
      </div>}
    </section>
  );
}
