import { Columns3, SlidersHorizontal } from 'lucide-react';
import { PARAMETER_SECTIONS, UTILITY_PARAMETER_SCHEMA, type ParameterDefinition } from '../cad/parameterSchema';
import { partSettingsContext } from '../cad/partContext';
import { formatDimension, unitLabel, type DisplayUnits } from '../cad/units';
import type { CabinetParameters, CadPart } from '../cad/types';
import type { KernelDiagnostic, KernelSelection } from '../cad/kernel/types';
import DimensionInput from './DimensionInput';
import SelectControl from './SelectControl';
import HardwarePicker from './HardwarePicker';

type ParameterValue = CabinetParameters[keyof CabinetParameters];

type Props = {
  parameters: CabinetParameters;
  selected: CadPart | null;
  displayUnits: DisplayUnits;
  onChange: (key: keyof CabinetParameters, value: ParameterValue) => void;
  onApplyHardware: (profileId: string) => void;
  topologySelection: KernelSelection | null;
  kernelDiagnostics: KernelDiagnostic[];
  onShowCabinetSettings: () => void;
  onOpenSection: (sectionNodeId: number) => void;
};

export default function PropertiesPanel({
  parameters,
  selected,
  displayUnits,
  onChange,
  onApplyHardware,
  topologySelection,
  kernelDiagnostics,
  onShowCabinetSettings,
  onOpenSection,
}: Props) {
  const context = selected ? partSettingsContext(selected, parameters) : null;

  return (
    <aside className="panel properties-panel">
      <div className="panel-heading">
        <SlidersHorizontal size={17} />
        <div><strong>Properties</strong><span>{selected ? selected.name : 'Utility Cabinet parameters'}</span></div>
      </div>

      {selected && context ? (
        <div className="properties-scroll">
          <KernelDiagnostics diagnostics={kernelDiagnostics} />
          {topologySelection?.partId === selected.id && (
            <section className="kernel-topology-card">
              <span className="eyebrow">SEMANTIC TOPOLOGY</span>
              <strong>{topologySelection.kind === 'face' ? 'Selected face' : 'Selected edge'}</strong>
              <code>{topologySelection.semanticId}</code>
              <p>This identity is cabinet-semantic and does not persist a raw OpenCascade topology index.</p>
            </section>
          )}
          <div className="part-context-toolbar">
            <button type="button" onClick={onShowCabinetSettings}>All cabinet settings</button>
          </div>

          {context.sectionNodeId !== null && (
            <section className="part-section-link">
              <div>
                <span className="eyebrow">SECTION SOURCE</span>
                <strong>Section {context.sectionNodeId + 1}</strong>
                <p>Count, contents, sizing, and divider placement live in the Section Layout editor.</p>
              </div>
              <button type="button" onClick={() => onOpenSection(context.sectionNodeId!)}>
                <Columns3 size={13} /> Edit this section
              </button>
            </section>
          )}

          <section className="property-section contextual-settings">
            <h3>{context.title}</h3>
            <p className="context-description">{context.description}</p>
            {context.hardwareCategory && (
              <HardwarePicker
                parameters={parameters}
                category={context.hardwareCategory}
                onApply={onApplyHardware}
              />
            )}
            <GroupedParameterFields
              fields={context.fields}
              parameters={parameters}
              displayUnits={displayUnits}
              onChange={onChange}
            />
          </section>

          <PartProperties part={selected} displayUnits={displayUnits} />
        </div>
      ) : (
        <div className="properties-scroll">
          <KernelDiagnostics diagnostics={kernelDiagnostics} />
          <HardwarePicker parameters={parameters} onApply={onApplyHardware} />
          {PARAMETER_SECTIONS.map(section => {
            const fields = UTILITY_PARAMETER_SCHEMA.filter(
              field => field.section === section && (!field.visibleWhen || field.visibleWhen(parameters)),
            );
            if (!fields.length) return null;

            return (
              <section className="property-section" key={section}>
                <h3>{section}</h3>
                <ParameterFields
                  fields={fields}
                  parameters={parameters}
                  displayUnits={displayUnits}
                  onChange={onChange}
                />
              </section>
            );
          })}
        </div>
      )}
    </aside>
  );
}

function KernelDiagnostics({ diagnostics }: { diagnostics: KernelDiagnostic[] }) {
  if (!diagnostics.length) return null;
  const visible = diagnostics.slice(0, 6);
  const errors = diagnostics.filter(item => item.severity === 'error').length;
  const warnings = diagnostics.filter(item => item.severity === 'warning').length;

  return (
    <section className="kernel-diagnostics">
      <div className="kernel-diagnostics-heading">
        <strong>Exact CAD diagnostics</strong>
        <span>{errors ? `${errors} error${errors === 1 ? '' : 's'}` : ''}{errors && warnings ? ' · ' : ''}{warnings ? `${warnings} warning${warnings === 1 ? '' : 's'}` : ''}</span>
      </div>
      {visible.map((diagnostic, index) => (
        <p key={`${diagnostic.code}-${diagnostic.partId ?? 'document'}-${index}`} className={diagnostic.severity}>
          {diagnostic.partId ? `${diagnostic.partId}: ` : ''}{diagnostic.message}
        </p>
      ))}
      {diagnostics.length > visible.length && <small>+{diagnostics.length - visible.length} more diagnostics</small>}
    </section>
  );
}

function GroupedParameterFields({
  fields,
  parameters,
  displayUnits,
  onChange,
}: {
  fields: ParameterDefinition[];
  parameters: CabinetParameters;
  displayUnits: DisplayUnits;
  onChange: Props['onChange'];
}) {
  const sections = [...new Set(fields.map(field => field.section))];

  if (!fields.length) {
    return <p className="muted">This part is currently driven by section geometry or fixed semantic construction rather than a dedicated cabinet parameter.</p>;
  }

  return (
    <div className="context-groups">
      {sections.map(section => (
        <div className="context-group" key={section}>
          <h4>{section}</h4>
          <ParameterFields
            fields={fields.filter(field => field.section === section)}
            parameters={parameters}
            displayUnits={displayUnits}
            onChange={onChange}
          />
        </div>
      ))}
    </div>
  );
}

function ParameterFields({
  fields,
  parameters,
  displayUnits,
  onChange,
}: {
  fields: ParameterDefinition[];
  parameters: CabinetParameters;
  displayUnits: DisplayUnits;
  onChange: Props['onChange'];
}) {
  return (
    <>
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
    </>
  );
}

function PartProperties({ part, displayUnits }: { part: CadPart; displayUnits: DisplayUnits }) {
  const units = unitLabel(displayUnits);
  const dimension = (value: number) => `${formatDimension(value, displayUnits)} ${units}`;

  return <section className="property-section part-card">
    <h3>Generated part</h3>
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
    <p className="muted">Generated dimensions are read-only here; edit the related settings above to rebuild this part.</p>
  </section>;
}

function humanize(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, char => char.toUpperCase());
}
