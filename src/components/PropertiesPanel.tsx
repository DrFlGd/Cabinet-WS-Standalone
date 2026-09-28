import { SlidersHorizontal } from 'lucide-react';
import { PARAMETER_SECTIONS, UTILITY_PARAMETER_SCHEMA } from '../cad/parameterSchema';
import { formatDimension, unitLabel, type DisplayUnits } from '../cad/units';
import type { CabinetParameters, CadPart } from '../cad/types';
import DimensionInput from './DimensionInput';
import SelectControl from './SelectControl';

type ParameterValue = CabinetParameters[keyof CabinetParameters];

type Props = {
  parameters: CabinetParameters;
  selected: CadPart | null;
  displayUnits: DisplayUnits;
  onChange: (key: keyof CabinetParameters, value: ParameterValue) => void;
};

export default function PropertiesPanel({ parameters, selected, displayUnits, onChange }: Props) {
  return (
    <aside className="panel properties-panel">
      <div className="panel-heading">
        <SlidersHorizontal size={17} />
        <div><strong>Properties</strong><span>{selected ? selected.name : 'Utility Cabinet parameters'}</span></div>
      </div>
      {selected
        ? <PartProperties part={selected} displayUnits={displayUnits} />
        : (
          <div className="properties-scroll">
            {PARAMETER_SECTIONS.map(section => {
              const fields = UTILITY_PARAMETER_SCHEMA.filter(
                field => field.section === section && (!field.visibleWhen || field.visibleWhen(parameters)),
              );
              if (!fields.length) return null;

              return (
                <section className="property-section" key={section}>
                  <h3>{section}</h3>
                  {fields.map(field => (
                    <div className="parameter-control" key={field.key} title={field.description}>
                      <div className="parameter-label">
                        <span>{field.label}</span>
                        {field.advanced && <small>ADV</small>}
                      </div>
                      {field.kind === 'dimension' && (
                        <DimensionInput
                          value={parameters[field.key] as number}
                          units={displayUnits}
                          step={field.step}
                          min={field.min}
                          onChange={value => onChange(field.key, value)}
                        />
                      )}
                      {field.kind === 'count' && (
                        <div className="number-input count-input">
                          <input
                            type="number"
                            value={parameters[field.key] as number}
                            min={field.min}
                            max={field.max}
                            step={1}
                            onChange={event => {
                              const next = event.currentTarget.valueAsNumber;
                              if (Number.isFinite(next)) onChange(field.key, next);
                            }}
                          />
                        </div>
                      )}
                      {field.kind === 'select' && (
                        <SelectControl
                          className="parameter-select"
                          ariaLabel={field.label}
                          value={String(parameters[field.key])}
                          options={field.options.map(option => ({
                            value: String(option.value),
                            label: option.label,
                          }))}
                          onChange={value => onChange(field.key, value as ParameterValue)}
                        />
                      )}
                      {field.kind === 'boolean' && (
                        <label className="toggle-control">
                          <input
                            type="checkbox"
                            checked={Boolean(parameters[field.key])}
                            onChange={event => onChange(field.key, event.target.checked)}
                          />
                          <span>{parameters[field.key] ? 'On' : 'Off'}</span>
                        </label>
                      )}
                    </div>
                  ))}
                </section>
              );
            })}
          </div>
        )}
    </aside>
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
    {part.metadata && (
      <>
        <h3 className="metadata-heading">Semantic metadata</h3>
        <dl>
          {Object.entries(part.metadata).map(([key, value]) => (
            <div key={key}><dt>{humanize(key)}</dt><dd>{String(value)}</dd></div>
          ))}
        </dl>
      </>
    )}
    <p className="muted">These semantic part and construction attributes are preserved independently of the future B-Rep kernel.</p>
  </section></div>;
}

function humanize(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, char => char.toUpperCase());
}
