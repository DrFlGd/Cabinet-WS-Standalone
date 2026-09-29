import { useMemo, useState } from 'react';
import { Columns3, Search, SlidersHorizontal, X } from 'lucide-react';
import { PARAMETER_SECTIONS, UTILITY_PARAMETER_SCHEMA, type ParameterDefinition } from '../cad/parameterSchema';
import { partSettingsContext } from '../cad/partContext';
import { formatDimension, unitLabel, type DisplayUnits } from '../cad/units';
import type { CabinetParameters, CadPart } from '../cad/types';
import type { KernelDiagnostic, KernelSelection } from '../cad/kernel/types';
import DimensionInput from './DimensionInput';
import SelectControl from './SelectControl';

type ParameterValue = CabinetParameters[keyof CabinetParameters];

type Props = {
  parameters: CabinetParameters;
  selected: CadPart | null;
  displayUnits: DisplayUnits;
  onChange: (key: keyof CabinetParameters, value: ParameterValue) => void;
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
  topologySelection,
  kernelDiagnostics,
  onShowCabinetSettings,
  onOpenSection,
}: Props) {
  const [query, setQuery] = useState('');
  const context = selected ? partSettingsContext(selected, parameters) : null;
  const normalizedQuery = query.trim().toLowerCase();

  const applicableFields = useMemo(
    () => UTILITY_PARAMETER_SCHEMA.filter(
      field => field.section !== 'Layout' && (!field.visibleWhen || field.visibleWhen(parameters)),
    ),
    [parameters],
  );

  const searchResults = useMemo(() => {
    if (!normalizedQuery) return [];
    return applicableFields.filter(field => {
      const optionText = field.kind === 'select'
        ? field.options.map(option => option.label).join(' ')
        : '';
      const haystack = [
        field.label,
        field.description,
        field.section,
        String(field.key),
        String(parameters[field.key]),
        optionText,
      ].join(' ').toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [applicableFields, normalizedQuery, parameters]);

  const contextualFields = context
    ? context.fields.filter(field => field.section !== 'Layout')
    : [];

  return (
    <aside className="panel properties-panel">
      <div className="panel-heading">
        <SlidersHorizontal size={17} />
        <div><strong>Properties</strong><span>{selected ? selected.name : 'Utility Cabinet parameters'}</span></div>
      </div>

      <label className="property-search">
        <Search size={13} />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search properties…"
          aria-label="Search properties"
        />
        {query && (
          <button
            type="button"
            className="property-search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear property search"
            title="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </label>

      {normalizedQuery ? (
        <div className="properties-scroll">
          <KernelDiagnostics diagnostics={kernelDiagnostics} />
          {selected && topologySelection?.partId === selected.id && (
            <TopologyCard selection={topologySelection} />
          )}

          <section className="property-section property-search-results">
            <div className="property-search-results-heading">
              <h3>Search results</h3>
              <span>{searchResults.length}</span>
            </div>
            {searchResults.length ? (
              <GroupedParameterFields
                fields={searchResults}
                parameters={parameters}
                displayUnits={displayUnits}
                onChange={onChange}
              />
            ) : (
              <p className="property-search-empty">No applicable properties match “{query.trim()}”.</p>
            )}
          </section>
        </div>
      ) : selected && context ? (
        <div className="properties-scroll">
          <KernelDiagnostics diagnostics={kernelDiagnostics} />
          {topologySelection?.partId === selected.id && (
            <TopologyCard selection={topologySelection} />
          )}

          <div className="part-context-toolbar">
            <button type="button" onClick={onShowCabinetSettings}>All cabinet settings</button>
          </div>

          {context.sectionNodeId !== null && (
            <section className="part-section-link">
              <div>
                <span className="eyebrow">SECTION SOURCE</span>
                <strong>Section {context.sectionNodeId + 1}</strong>
                <p>Count, contents, sizing, and divider placement live in the Manual Layout Editor.</p>
              </div>
              <button type="button" onClick={() => onOpenSection(context.sectionNodeId!)}>
                <Columns3 size={13} /> Edit this section
              </button>
            </section>
          )}

          <section className="property-section contextual-settings">
            <h3>{context.title}</h3>
            <p className="context-description">{context.description}</p>
            <GroupedParameterFields
              fields={contextualFields}
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
          {PARAMETER_SECTIONS
            .filter(section => section !== 'Layout')
            .map(section => {
              const fields = applicableFields.filter(field => field.section === section);
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

function TopologyCard({ selection }: { selection: KernelSelection }) {
  return (
    <section className="kernel-topology-card">
      <span className="eyebrow">SEMANTIC TOPOLOGY</span>
      <strong>{selection.kind === 'face' ? 'Selected face' : 'Selected edge'}</strong>
      <code>{selection.semanticId}</code>
      <p>This identity is cabinet-semantic and does not persist a raw OpenCascade topology index.</p>
    </section>
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
    return <p className="muted">This part is driven by layout geometry or fixed semantic construction rather than a dedicated right-side property.</p>;
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

          {field.kind === 'number' && (
            <div className="number-input count-input">
              <input
                type="number"
                value={parameters[field.key] as number}
                min={field.min}
                max={field.max}
                step={field.step}
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
