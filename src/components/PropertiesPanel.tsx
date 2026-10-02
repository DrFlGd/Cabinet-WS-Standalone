import { useEffect, useMemo, useRef, useState } from 'react';
import { Columns3, Search, SlidersHorizontal, X } from 'lucide-react';
import type { ParameterDefinition } from '../cad/parameterSchema';
import { cabinetSettings, filterCabinetSettings, readSettingsVisibility, SETTINGS_CATEGORIES, SETTINGS_VISIBILITY_KEY, supportsLayoutEditor } from '../cad/cabinetSettings';
import { familyFieldValue } from '../cad/familySettings';
import { partSettingsContext } from '../cad/partContext';
import { formatDimension, unitLabel, type DisplayUnits } from '../cad/units';
import type { CabinetFamily, CabinetParameters, CadPart, FamilyRecipeValues, JsonValue } from '../cad/types';
import type { KernelDiagnostic } from '../cad/kernel/types';
import DimensionInput from './DimensionInput';
import SelectControl from './SelectControl';
import FamilyFieldControl from './FamilyFieldControl';
type ParameterValue = CabinetParameters[keyof CabinetParameters];
type Props = {
  parameters: CabinetParameters;
  family: CabinetFamily;
  familyValues: FamilyRecipeValues;
  familyLabel?: string;
  selected: CadPart | null;
  displayUnits: DisplayUnits;
  onChange: (key: keyof CabinetParameters, value: ParameterValue) => void;
  onFamilyValueChange: (key: string, value: JsonValue) => void;
  kernelDiagnostics: KernelDiagnostic[];
  onOpenSection: (sectionNodeId: number) => void;
};

export default function PropertiesPanel({ parameters, family, familyValues, familyLabel = 'Utility Cabinet', selected,
  displayUnits, onChange, onFamilyValueChange, kernelDiagnostics, onOpenSection }: Props) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [visibility, setVisibility] = useState(() => {
    try { return readSettingsVisibility(window.localStorage); } catch { return readSettingsVisibility(); }
  });
  useEffect(() => {
    try { window.localStorage.setItem(SETTINGS_VISIBILITY_KEY, JSON.stringify(visibility)); } catch { /* Storage may be unavailable. */ }
  }, [visibility]);
  const rows = useMemo(() => cabinetSettings(family, familyValues, parameters), [family, familyValues, parameters]);
  const visible = filterCabinetSettings(rows, query, visibility);
  const categories = SETTINGS_CATEGORIES.filter(category => visible.some(row => row.category === category));
  const context = selected ? partSettingsContext(selected, parameters) : null;
  const hiddenMatches = query.trim() ? filterCabinetSettings(rows, query, { showAdvanced: true, showUnused: true }).length - visible.length : 0;
  function selectCategory(category: string) {
    setQuery(''); setActiveCategory(category);
    requestAnimationFrame(() => document.getElementById(settingsCategoryTargetId(category))?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  }
  return <aside className="panel properties-panel">
    <div className="properties-navigation">
      <div className="panel-heading"><SlidersHorizontal size={17} /><div><strong>Cabinet Settings</strong><span>{familyLabel}</span></div></div>
      <label className="property-search"><Search size={13} />
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search settings…" aria-label="Search properties" />
        {query && <button type="button" className="property-search-clear" onClick={() => setQuery('')} aria-label="Clear property search"><X size={12} /></button>}
      </label>
      <div className="settings-visibility">
        <label><input type="checkbox" checked={visibility.showUnused} onChange={event => setVisibility(current => ({ ...current, showUnused: event.target.checked }))} />Show unused options</label>
        <label><input type="checkbox" checked={visibility.showAdvanced} onChange={event => setVisibility(current => ({ ...current, showAdvanced: event.target.checked }))} />Show advanced settings</label>
      </div>
      {query.trim() && <p className="settings-search-scope"><span className="settings-search-count">{visible.length} matching settings.</span> {hiddenMatches > 0 && `${hiddenMatches} hidden by visibility filters.`}</p>}
    </div>
    <div className="properties-content-shell settings-surface">
      <SettingsCategoryNav categories={categories} activeCategory={categories.includes(activeCategory ?? '') ? activeCategory : categories[0] ?? null} searching={Boolean(query.trim())} onSelect={selectCategory} />
      <div className="properties-scroll">
        <KernelDiagnostics diagnostics={kernelDiagnostics} />
        {supportsLayoutEditor(family) && !query.trim() && <section className="part-section-link">
          <p>Set door/drawer counts, bays, and arrangements in the Layout editor.</p>
          <button type="button" onClick={() => onOpenSection(context?.sectionNodeId ?? 0)}><Columns3 size={13} />Open Layout editor</button>
        </section>}
        {selected && !query.trim() && <details className="selected-part-details"><summary>Selected part · {selected.name}</summary><PartProperties part={selected} displayUnits={displayUnits} /></details>}
        {!visible.length && <p className="property-search-empty">No settings match the current filters.</p>}
        {categories.map(category => <section className="property-section" id={settingsCategoryTargetId(category)} key={category}>
          <h3>{category}</h3>
          {visible.filter(row => row.category === category).map(row => <div key={row.id} data-setting-id={row.id}>
            {row.source === 'family' ? <FamilyFieldControl field={row.field} value={familyFieldValue(familyValues, row.field)} inactiveReason={row.inactiveReason}
              displayUnits={displayUnits} onChange={value => onFamilyValueChange(row.field.key, value)} onOpenManualLayout={() => onOpenSection(0)} /> : <>
              <ParameterFields fields={[{ ...row.field, label: row.label }]} parameters={parameters} displayUnits={displayUnits} onChange={onChange} disabled={Boolean(row.inactiveReason)} />
              {row.inactiveReason && <small className="family-field-inactive-reason">{row.inactiveReason}</small>}
            </>}
          </div>)}
        </section>)}
      </div>
    </div>
  </aside>;
}

function SettingsCategoryNav({
  categories,
  activeCategory,
  searching,
  onSelect,
}: {
  categories: string[];
  activeCategory: string | null;
  searching: boolean;
  onSelect: (category: string) => void;
}) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  return (
    <nav className={`settings-category-nav ${searching ? 'searching' : ''}`} aria-label="Cabinet setting categories">
      {categories.map((category, index) => (
        <button
          ref={element => { buttons.current[index] = element; }}
          type="button"
          key={category}
          className={!searching && category === activeCategory ? 'active' : ''}
          aria-current={!searching && category === activeCategory ? 'true' : undefined}
          title={category}
          onClick={() => onSelect(category)}
          onKeyDown={event => {
            const next = nextSettingsCategoryIndex(index, event.key, categories.length);
            if (next === index) return;
            event.preventDefault();
            buttons.current[next]?.focus();
            onSelect(categories[next]);
          }}
        >
          <span>{category}</span>
        </button>
      ))}
    </nav>
  );
}

export function nextSettingsCategoryIndex(
  current: number,
  key: string,
  count: number,
) {
  if (count <= 0) return current;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  if (key === 'ArrowDown' || key === 'ArrowRight') return (current + 1) % count;
  if (key === 'ArrowUp' || key === 'ArrowLeft') return (current - 1 + count) % count;
  return current;
}

export function settingsCategoryTargetId(category: string) {
  const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `settings-cabinet-${slug || 'category'}`;
}

function KernelDiagnostics({ diagnostics }: { diagnostics: KernelDiagnostic[] }) {
  if (!diagnostics.length) return null;
  const visible = diagnostics.slice(0, 6);
  const errors = diagnostics.filter(item => item.severity === 'error').length;
  const warnings = diagnostics.filter(item => item.severity === 'warning').length;

  return (
    <section className="kernel-diagnostics">
      <div className="kernel-diagnostics-heading">
        <strong>Geometry issues</strong>
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

function ParameterFields({
  fields,
  parameters,
  displayUnits,
  onChange,
  disabled = false,
}: {
  fields: ParameterDefinition[];
  parameters: CabinetParameters;
  displayUnits: DisplayUnits;
  onChange: Props['onChange'];
  disabled?: boolean;
}) {
  return (
    <>
      {fields.map(field => (
        <div className="parameter-control" key={field.key} title={field.description}>
          {field.kind !== 'boolean' && <div className="parameter-label">
            <span>{field.label}</span>
            {field.advanced && <small>ADV</small>}
          </div>}

          {field.kind === 'dimension' && (
            <DimensionInput
              ariaLabel={field.label}
              disabled={disabled}
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
                aria-label={field.label}
                disabled={disabled}
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
                aria-label={field.label}
                disabled={disabled}
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
              disabled={disabled}
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
                disabled={disabled}
                checked={Boolean(parameters[field.key])}
                onChange={event => onChange(field.key, event.target.checked)}
              />
              <span>{field.label}</span>
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
