import { useEffect, useMemo, useRef, useState } from 'react';
import { Columns3, Search, SlidersHorizontal, X } from 'lucide-react';
import { PARAMETER_SECTIONS, UTILITY_PARAMETER_SCHEMA, type ParameterDefinition } from '../cad/parameterSchema';
import {
  FAMILY_SETTINGS_SECTION_ORDER,
  familyFieldDefinitions,
  familySectionRoot,
} from '../cad/familySettings';
import { partSettingsContext } from '../cad/partContext';
import { formatDimension, unitLabel, type DisplayUnits } from '../cad/units';
import type { CabinetFamily, CabinetParameters, CadPart, FamilyRecipeValues, JsonValue } from '../cad/types';
import type { KernelDiagnostic } from '../cad/kernel/types';
import DimensionInput from './DimensionInput';
import SelectControl from './SelectControl';
import FamilySettingsPanel from './FamilySettingsPanel';

type ParameterValue = CabinetParameters[keyof CabinetParameters];
export type SettingsSurface = 'selection' | 'family' | 'model';

export type SettingsBrowseState = {
  surface: SettingsSurface;
  explicitBrowse: boolean;
  activeCategory: string | null;
};

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

export default function PropertiesPanel({
  parameters,
  family,
  familyValues,
  familyLabel = 'Utility Cabinet',
  selected,
  displayUnits,
  onChange,
  onFamilyValueChange,
  kernelDiagnostics,
  onOpenSection,
}: Props) {
  const [query, setQuery] = useState('');
  const [browse, setBrowse] = useState<SettingsBrowseState>(() => ({
    surface: selected ? 'selection' : 'family',
    explicitBrowse: false,
    activeCategory: null,
  }));
  const previousSelection = useRef(selected?.id ?? null);
  const context = selected ? partSettingsContext(selected, parameters) : null;
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    const nextSelection = selected?.id ?? null;
    if (previousSelection.current === nextSelection) return;
    previousSelection.current = nextSelection;
    setBrowse(current => settingsBrowseAfterSelection(current, Boolean(selected)));
  }, [selected]);

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

  const familyCategories = useMemo<string[]>(() => {
    const fields = familyFieldDefinitions(family);
    return FAMILY_SETTINGS_SECTION_ORDER.filter(root =>
      fields.some(field => familySectionRoot(field) === root),
    );
  }, [family]);

  const modelCategories = useMemo<string[]>(
    () => PARAMETER_SECTIONS.filter(
      section => section !== 'Layout' && applicableFields.some(field => field.section === section),
    ),
    [applicableFields],
  );

  const contextualFields = context
    ? context.fields.filter(field => field.section !== 'Layout')
    : [];

  const activeCategories = browse.surface === 'family'
    ? familyCategories
    : browse.surface === 'model'
      ? modelCategories
      : [];
  const activeCategory = activeCategories.includes(browse.activeCategory ?? '')
    ? browse.activeCategory
    : activeCategories[0] ?? null;

  const panelContextLabel = browse.surface === 'selection' && selected
    ? selected.name
    : browse.surface === 'family'
      ? familyLabel + ' family settings'
      : 'Native model settings';

  function selectSurface(surface: 'family' | 'model') {
    const categories = surface === 'family' ? familyCategories : modelCategories;
    const category = categories.includes(browse.activeCategory ?? '')
      ? browse.activeCategory
      : categories[0] ?? null;
    const next = settingsBrowseForCategory(
      browse,
      surface,
      category,
      Boolean(selected),
    );
    setBrowse(next);
    if (category) scrollToCategory(surface, category);
  }

  function selectCategory(category: string) {
    if (browse.surface !== 'family' && browse.surface !== 'model') return;
    setQuery('');
    setBrowse(current => settingsBrowseForCategory(current, browse.surface as 'family' | 'model', category, Boolean(selected)));
    scrollToCategory(browse.surface, category);
  }

  function showSelectedPart() {
    if (!selected) return;
    setQuery('');
    setBrowse(current => ({
      ...current,
      surface: 'selection',
      explicitBrowse: false,
    }));
  }

  function scrollToCategory(surface: 'family' | 'model', category: string) {
    requestAnimationFrame(() => {
      document.getElementById(settingsCategoryTargetId(surface, category))?.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      });
    });
  }

  return (
    <aside className="panel properties-panel">
      <div className="properties-navigation">
        <div className="panel-heading">
          <SlidersHorizontal size={17} />
          <div><strong>Properties</strong><span>{panelContextLabel}</span></div>
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

        <div className="property-mode-tabs" role="group" aria-label="Property surface">
          <button
            type="button"
            aria-pressed={browse.surface === 'family'}
            className={browse.surface === 'family' ? 'active' : ''}
            onClick={() => selectSurface('family')}
          >
            Family settings
          </button>
          <button
            type="button"
            aria-pressed={browse.surface === 'model'}
            className={browse.surface === 'model' ? 'active' : ''}
            onClick={() => selectSurface('model')}
          >
            Native model
          </button>
        </div>

        {selected && browse.surface !== 'selection' && (
          <button type="button" className="selected-context-return" onClick={showSelectedPart}>
            Return to selected part · {selected.name}
          </button>
        )}

        {normalizedQuery && browse.surface !== 'selection' && (
          <div className="settings-search-scope">
            Searching all {browse.surface === 'family' ? 'family' : 'native model'} settings. Choosing a category clears the search and jumps to that section.
          </div>
        )}
      </div>

      <div className={`properties-content-shell ${browse.surface === 'selection' ? 'selection-surface' : 'settings-surface'}`}>
        {browse.surface !== 'selection' && (
          <SettingsCategoryNav
            surface={browse.surface}
            categories={activeCategories}
            activeCategory={activeCategory}
            searching={Boolean(normalizedQuery)}
            onSelect={selectCategory}
          />
        )}

        {browse.surface === 'family' ? (
          <div className="properties-scroll family-properties-scroll">
            <KernelDiagnostics diagnostics={kernelDiagnostics} />
            <FamilySettingsPanel
              family={family}
              familyValues={familyValues}
              displayUnits={displayUnits}
              query={query}
              activeCategory={activeCategory}
              onChange={onFamilyValueChange}
              onOpenManualLayout={() => onOpenSection(0)}
            />
          </div>
        ) : normalizedQuery ? (
          <div className="properties-scroll">
            <KernelDiagnostics diagnostics={kernelDiagnostics} />
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
        ) : browse.surface === 'selection' && selected && context ? (
          <div className="properties-scroll">
            <KernelDiagnostics diagnostics={kernelDiagnostics} />
            <div className="part-context-toolbar">
              <button type="button" onClick={() => selectSurface('model')}>Browse native settings</button>
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
                  <section
                    className="property-section"
                    id={settingsCategoryTargetId('model', section)}
                    key={section}
                  >
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
      </div>
    </aside>
  );
}

function SettingsCategoryNav({
  surface,
  categories,
  activeCategory,
  searching,
  onSelect,
}: {
  surface: 'family' | 'model';
  categories: string[];
  activeCategory: string | null;
  searching: boolean;
  onSelect: (category: string) => void;
}) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  return (
    <nav className={`settings-category-nav ${searching ? 'searching' : ''}`} aria-label={surface === 'family' ? 'Family setting categories' : 'Native model categories'}>
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

export function settingsBrowseAfterSelection(
  current: SettingsBrowseState,
  hasSelection: boolean,
): SettingsBrowseState {
  if (hasSelection && !current.explicitBrowse) {
    return { ...current, surface: 'selection' };
  }
  if (!hasSelection && current.surface === 'selection') {
    return { ...current, surface: 'family', explicitBrowse: false };
  }
  return current;
}

export function settingsBrowseForCategory(
  current: SettingsBrowseState,
  surface: 'family' | 'model',
  category: string | null,
  hasSelection: boolean,
): SettingsBrowseState {
  return {
    ...current,
    surface,
    explicitBrowse: hasSelection,
    activeCategory: category,
  };
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

export function settingsCategoryTargetId(surface: 'family' | 'model', category: string) {
  const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `settings-${surface}-${slug || 'category'}`;
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
