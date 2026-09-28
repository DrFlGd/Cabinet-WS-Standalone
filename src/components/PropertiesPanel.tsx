import { Box, Ruler, SlidersHorizontal } from 'lucide-react';
import type { CabinetParameters, CadPart } from '../cad/types';

type Props = {
  parameters: CabinetParameters;
  selected: CadPart | null;
  onChange: (key: keyof CabinetParameters, value: number) => void;
};

const dimensionFields: { key: keyof CabinetParameters; label: string; step?: number }[] = [
  { key: 'width', label: 'Cabinet width' },
  { key: 'height', label: 'Cabinet height' },
  { key: 'depth', label: 'Cabinet depth' },
  { key: 'materialThickness', label: 'Panel thickness', step: 0.1 },
  { key: 'backThickness', label: 'Back thickness', step: 0.1 },
  { key: 'toeKickHeight', label: 'Toe kick height' },
  { key: 'toeKickDepth', label: 'Toe kick setback' },
  { key: 'faceGap', label: 'Front gap', step: 0.1 },
];
const countFields: { key: keyof CabinetParameters; label: string }[] = [
  { key: 'shelfCount', label: 'Shelves' },
  { key: 'drawerCount', label: 'Drawer rows' },
  { key: 'doorCount', label: 'Doors' },
];

export default function PropertiesPanel({ parameters, selected, onChange }: Props) {
  return (
    <aside className="panel properties-panel">
      <div className="panel-heading">
        <SlidersHorizontal size={17} />
        <div><strong>Properties</strong><span>{selected ? selected.name : 'Cabinet parameters'}</span></div>
      </div>
      {selected ? <PartProperties part={selected} /> : (
        <div className="properties-scroll">
          <section className="property-section">
            <h3><Ruler size={15} /> Dimensions</h3>
            {dimensionFields.map(field => (
              <NumberField key={field.key} label={field.label} value={parameters[field.key]} step={field.step ?? 1} suffix="mm" onChange={value => onChange(field.key, value)} />
            ))}
          </section>
          <section className="property-section">
            <h3><Box size={15} /> Contents</h3>
            {countFields.map(field => (
              <NumberField key={field.key} label={field.label} value={parameters[field.key]} step={1} min={0} onChange={value => onChange(field.key, value)} />
            ))}
          </section>
        </div>
      )}
    </aside>
  );
}

function NumberField({ label, value, step, suffix, min, onChange }: { label: string; value: number; step: number; suffix?: string; min?: number; onChange: (value: number) => void }) {
  return <label className="property-row"><span>{label}</span><div className="number-input"><input type="number" value={round(value)} min={min} step={step} onChange={event => {
    const next = event.currentTarget.valueAsNumber;
    if (Number.isFinite(next)) onChange(next);
  }} />{suffix && <small>{suffix}</small>}</div></label>;
}

function PartProperties({ part }: { part: CadPart }) {
  return <div className="properties-scroll"><section className="property-section part-card">
    <span className="part-id">{part.id}</span>
    <h2>{part.name}</h2>
    <dl>
      <div><dt>Category</dt><dd>{part.category}</dd></div>
      <div><dt>Material</dt><dd>{part.material}</dd></div>
      <div><dt>Width (X)</dt><dd>{round(part.size.x)} mm</dd></div>
      <div><dt>Depth (Y)</dt><dd>{round(part.size.y)} mm</dd></div>
      <div><dt>Height (Z)</dt><dd>{round(part.size.z)} mm</dd></div>
      <div><dt>Position</dt><dd>{round(part.position.x)}, {round(part.position.y)}, {round(part.position.z)}</dd></div>
    </dl>
    <p className="muted">Prototype solids are parametric panel bodies. The next kernel milestone will replace these boxes with B-Rep bodies while keeping this part identity and UI contract.</p>
  </section></div>;
}

const round = (value: number) => Math.round(value * 100) / 100;
