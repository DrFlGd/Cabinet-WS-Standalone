import { Box, Ruler, SlidersHorizontal } from 'lucide-react';
import { formatDimension, unitLabel, type DisplayUnits } from '../cad/units';
import type { CabinetParameters, CadPart } from '../cad/types';
import DimensionInput from './DimensionInput';

type Props = {
  parameters: CabinetParameters;
  selected: CadPart | null;
  displayUnits: DisplayUnits;
  onChange: (key: keyof CabinetParameters, value: number) => void;
};

const dimensionFields: { key: keyof CabinetParameters; label: string }[] = [
  { key: 'width', label: 'Cabinet width' },
  { key: 'height', label: 'Cabinet height' },
  { key: 'depth', label: 'Cabinet depth' },
  { key: 'materialThickness', label: 'Panel thickness' },
  { key: 'backThickness', label: 'Back thickness' },
  { key: 'toeKickHeight', label: 'Toe kick height' },
  { key: 'toeKickDepth', label: 'Toe kick setback' },
  { key: 'faceGap', label: 'Front gap' },
];

const countFields: { key: keyof CabinetParameters; label: string }[] = [
  { key: 'shelfCount', label: 'Shelves' },
  { key: 'drawerCount', label: 'Drawer rows' },
  { key: 'doorCount', label: 'Doors' },
];

export default function PropertiesPanel({ parameters, selected, displayUnits, onChange }: Props) {
  return (
    <aside className="panel properties-panel">
      <div className="panel-heading">
        <SlidersHorizontal size={17} />
        <div><strong>Properties</strong><span>{selected ? selected.name : 'Cabinet parameters'}</span></div>
      </div>
      {selected ? <PartProperties part={selected} displayUnits={displayUnits} /> : (
        <div className="properties-scroll">
          <section className="property-section">
            <h3><Ruler size={15} /> Dimensions</h3>
            {dimensionFields.map(field => (
              <label className="property-row" key={field.key}>
                <span>{field.label}</span>
                <DimensionInput
                  value={parameters[field.key]}
                  units={displayUnits}
                  onChange={value => onChange(field.key, value)}
                />
              </label>
            ))}
          </section>
          <section className="property-section">
            <h3><Box size={15} /> Contents</h3>
            {countFields.map(field => (
              <CountField
                key={field.key}
                label={field.label}
                value={parameters[field.key]}
                onChange={value => onChange(field.key, value)}
              />
            ))}
          </section>
        </div>
      )}
    </aside>
  );
}

function CountField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="property-row">
      <span>{label}</span>
      <div className="number-input count-input">
        <input
          type="number"
          value={Math.round(value)}
          min={0}
          step={1}
          onChange={event => {
            const next = event.currentTarget.valueAsNumber;
            if (Number.isFinite(next)) onChange(next);
          }}
        />
      </div>
    </label>
  );
}

function PartProperties({ part, displayUnits }: { part: CadPart; displayUnits: DisplayUnits }) {
  const units = unitLabel(displayUnits);
  const dimension = (value: number) => `${formatDimension(value, displayUnits)} ${units}`;

  return <div className="properties-scroll"><section className="property-section part-card">
    <span className="part-id">{part.id}</span>
    <h2>{part.name}</h2>
    <dl>
      <div><dt>Category</dt><dd>{part.category}</dd></div>
      <div><dt>Material</dt><dd>{part.material}</dd></div>
      <div><dt>Width (X)</dt><dd>{dimension(part.size.x)}</dd></div>
      <div><dt>Depth (Y)</dt><dd>{dimension(part.size.y)}</dd></div>
      <div><dt>Height (Z)</dt><dd>{dimension(part.size.z)}</dd></div>
      <div><dt>Position</dt><dd>{dimension(part.position.x)}, {dimension(part.position.y)}, {dimension(part.position.z)}</dd></div>
    </dl>
    <p className="muted">Geometry remains millimeter-native. Display-unit changes never round-trip or rewrite the underlying cabinet dimensions.</p>
  </section></div>;
}
