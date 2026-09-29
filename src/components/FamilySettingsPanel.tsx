import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff, FunctionSquare, SlidersHorizontal } from 'lucide-react';
import {
  FAMILY_SETTINGS_SECTION_ORDER,
  familyFieldDefinitions,
  familyFieldInactiveReason,
  familyFieldIsComputed,
  familyFieldIsSectionTree,
  familyFieldLabel,
  familyFieldValue,
  familySectionName,
  familySectionRoot,
  type FamilyFieldDefinition,
} from '../cad/familySettings';
import { fromMillimeters, toMillimeters, unitLabel, type DisplayUnits } from '../cad/units';
import type { CabinetFamily, FamilyRecipeValues, JsonValue } from '../cad/types';
import SelectControl from './SelectControl';

type Props = {
  family: CabinetFamily;
  familyValues: FamilyRecipeValues;
  displayUnits: DisplayUnits;
  query: string;
  onChange: (key: string, value: JsonValue) => void;
  onOpenManualLayout: () => void;
};

export default function FamilySettingsPanel({
  family,
  familyValues,
  displayUnits,
  query,
  onChange,
  onOpenManualLayout,
}: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [collapsedRoots, setCollapsedRoots] = useState<Set<string>>(
    () => new Set(['Machining', 'Output', 'System']),
  );

  const normalizedQuery = query.trim().toLowerCase();
  const fields = useMemo(() => familyFieldDefinitions(family), [family]);

  const rows = useMemo(
    () => fields.map(field => {
      const value = familyFieldValue(familyValues, field);
      const inactiveReason = familyFieldInactiveReason(family, field, familyValues);
      const haystack = [
        familyFieldLabel(field.key),
        field.key,
        field.section,
        field.description,
        field.options ? field.options.join(' ') : '',
        stringifyValue(value),
      ].join(' ').toLowerCase();
      return { field, value, inactiveReason, matches: !normalizedQuery || haystack.includes(normalizedQuery) };
    }),
    [family, familyValues, fields, normalizedQuery],
  );

  const visibleRows = rows.filter(row => {
    if (!row.matches) return false;
    if (!normalizedQuery && row.field.advanced && !showAdvanced) return false;
    if (!normalizedQuery && row.inactiveReason && !showInactive) return false;
    return true;
  });

  const roots = FAMILY_SETTINGS_SECTION_ORDER.filter(root =>
    visibleRows.some(row => familySectionRoot(row.field) === root),
  );

  const activeCount = rows.filter(row => !row.inactiveReason && !row.field.expression).length;
  const hiddenInactiveCount = rows.filter(row => row.inactiveReason).length;
  const hiddenAdvancedCount = rows.filter(row => row.field.advanced && !row.inactiveReason).length;

  function toggleRoot(root: string) {
    setCollapsedRoots(current => {
      const next = new Set(current);
      if (next.has(root)) next.delete(root);
      else next.add(root);
      return next;
    });
  }

  return (
    <div className="family-settings-panel">
      <section className="family-settings-summary">
        <div>
          <span className="eyebrow">NATIVE FAMILY SETTINGS</span>
          <strong>{fields.length} schema fields</strong>
          <p>{activeCount} currently editable for this configuration. Dependency rules hide settings that do not affect the active design.</p>
        </div>
        <div className="family-settings-actions">
          <button
            type="button"
            className={showAdvanced ? 'active' : ''}
            onClick={() => setShowAdvanced(current => !current)}
            title="Show advanced construction and machining settings"
          >
            <SlidersHorizontal size={12} />
            {showAdvanced ? 'Advanced on' : 'Advanced (' + hiddenAdvancedCount + ')'}
          </button>
          <button
            type="button"
            className={showInactive ? 'active' : ''}
            onClick={() => setShowInactive(current => !current)}
            title="Show settings disabled by current dependency choices"
          >
            {showInactive ? <EyeOff size={12} /> : <Eye size={12} />}
            {showInactive ? 'Hide inactive' : 'Inactive (' + hiddenInactiveCount + ')'}
          </button>
        </div>
      </section>

      {normalizedQuery && (
        <div className="family-settings-search-count">
          {visibleRows.length} family setting{visibleRows.length === 1 ? '' : 's'} match “{query.trim()}”
        </div>
      )}

      {roots.map(root => {
        const rootRows = visibleRows.filter(row => familySectionRoot(row.field) === root);
        const collapsed = !normalizedQuery && collapsedRoots.has(root);
        const subSections = [...new Set(rootRows.map(row => familySectionName(row.field)))];

        return (
          <section className="family-settings-root" key={root}>
            <button type="button" className="family-settings-root-heading" onClick={() => toggleRoot(root)}>
              {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
              <strong>{root}</strong>
              <span>{rootRows.length}</span>
            </button>
            {!collapsed && subSections.map(section => {
              const sectionRows = rootRows.filter(row => familySectionName(row.field) === section);
              return (
                <div className="family-settings-section" key={section}>
                  {section !== root && <h4>{section.replace(root + ' / ', '')}</h4>}
                  {sectionRows.map(({ field, value, inactiveReason }) => (
                    <FamilyFieldControl
                      key={field.key}
                      field={field}
                      value={value}
                      inactiveReason={inactiveReason}
                      displayUnits={displayUnits}
                      onChange={next => onChange(field.key, next)}
                      onOpenManualLayout={onOpenManualLayout}
                    />
                  ))}
                </div>
              );
            })}
          </section>
        );
      })}

      {!visibleRows.length && (
        <p className="property-search-empty">No family settings match the current filters.</p>
      )}
    </div>
  );
}

function FamilyFieldControl({
  field,
  value,
  inactiveReason,
  displayUnits,
  onChange,
  onOpenManualLayout,
}: {
  field: FamilyFieldDefinition;
  value: JsonValue | null;
  inactiveReason: string | null;
  displayUnits: DisplayUnits;
  onChange: (value: JsonValue) => void;
  onOpenManualLayout: () => void;
}) {
  const computed = familyFieldIsComputed(field);
  const sectionTree = familyFieldIsSectionTree(field);
  const disabled = Boolean(inactiveReason) || computed || sectionTree;
  const description = field.description || defaultDescription(field);
  const type = inferControlType(field, value);

  return (
    <div
      className={'family-field-control' + (disabled ? ' disabled' : '') + (field.advanced ? ' advanced' : '')}
      title={inactiveReason || description}
    >
      <div className="family-field-label">
        <span>{familyFieldLabel(field.key)}</span>
        <div className="family-field-badges">
          {computed && <small title={'Computed: ' + field.expression}><FunctionSquare size={10} /> FX</small>}
          {field.advanced && <small>ADV</small>}
        </div>
      </div>

      {sectionTree ? (
        <button type="button" className="family-manual-layout-link" onClick={onOpenManualLayout}>
          Edit in Manual Layout
        </button>
      ) : computed ? (
        <ReadOnlyValue value={value} field={field} displayUnits={displayUnits} />
      ) : type === 'select' ? (
        <SelectControl
          className="parameter-select"
          ariaLabel={familyFieldLabel(field.key)}
          value={typeof value === 'string' ? value : String(field.value || '')}
          options={(field.options || []).map(option => ({ value: option, label: humanizeOption(option) }))}
          onChange={onChange}
          disabled={Boolean(inactiveReason)}
        />
      ) : type === 'boolean' ? (
        <label className="toggle-control">
          <input
            type="checkbox"
            checked={Boolean(value)}
            disabled={Boolean(inactiveReason)}
            onChange={event => onChange(event.target.checked)}
          />
          <span>{value ? 'On' : 'Off'}</span>
        </label>
      ) : type === 'number' ? (
        <FamilyNumberInput
          value={typeof value === 'number' ? value : numberFallback(field)}
          field={field}
          displayUnits={displayUnits}
          disabled={Boolean(inactiveReason)}
          onChange={onChange}
        />
      ) : type === 'array' ? (
        <FamilyArrayInput
          value={Array.isArray(value) ? value : []}
          field={field}
          displayUnits={displayUnits}
          disabled={Boolean(inactiveReason)}
          onChange={onChange}
        />
      ) : (
        <input
          className="family-text-input"
          type="text"
          value={typeof value === 'string' ? value : ''}
          disabled={Boolean(inactiveReason)}
          onChange={event => onChange(event.currentTarget.value)}
        />
      )}

      {inactiveReason && <small className="family-field-inactive-reason">{inactiveReason}</small>}
      {!inactiveReason && description && <small className="family-field-description">{description}</small>}
    </div>
  );
}

function FamilyNumberInput({
  value,
  field,
  displayUnits,
  disabled,
  onChange,
}: {
  value: number;
  field: FamilyFieldDefinition;
  displayUnits: DisplayUnits;
  disabled: boolean;
  onChange: (value: JsonValue) => void;
}) {
  const isDimension = field.unit === 'mm';
  const shown = isDimension ? fromMillimeters(value, displayUnits) : value;
  const bounds = field.bounds || [];
  const min = typeof bounds[0] === 'number'
    ? isDimension ? fromMillimeters(bounds[0], displayUnits) : bounds[0]
    : undefined;
  const max = typeof bounds[1] === 'number'
    ? isDimension ? fromMillimeters(bounds[1], displayUnits) : bounds[1]
    : undefined;
  const rawStep = field.step !== null ? field.step : (typeof bounds[2] === 'number' ? bounds[2] : null);
  const step = rawStep !== null
    ? isDimension ? fromMillimeters(rawStep, displayUnits) : rawStep
    : isCountLike(field.key) ? 1 : isDimension && displayUnits === 'in' ? 0.01 : 0.1;

  return (
    <div className="number-input family-number-input">
      <input
        type="number"
        value={Number.isFinite(shown) ? roundInput(shown) : ''}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={event => {
          const next = event.currentTarget.valueAsNumber;
          if (!Number.isFinite(next)) return;
          const native = isDimension ? toMillimeters(next, displayUnits) : next;
          onChange(isCountLike(field.key) ? Math.round(native) : native);
        }}
      />
      {isDimension && <small>{unitLabel(displayUnits)}</small>}
    </div>
  );
}

function FamilyArrayInput({
  value,
  field,
  displayUnits,
  disabled,
  onChange,
}: {
  value: JsonValue[];
  field: FamilyFieldDefinition;
  displayUnits: DisplayUnits;
  disabled: boolean;
  onChange: (value: JsonValue) => void;
}) {
  const nested = value.some(item => Array.isArray(item) || (item !== null && typeof item === 'object'));
  const numericArray = value.every(item => typeof item === 'number');
  const dimensionArray = field.unit === 'mm' && numericArray;

  if (nested) {
    return (
      <textarea
        className="family-array-input family-json-input"
        value={JSON.stringify(value)}
        disabled={disabled}
        rows={Math.min(5, Math.max(2, value.length))}
        onChange={event => {
          try {
            const parsed = JSON.parse(event.currentTarget.value) as unknown;
            if (Array.isArray(parsed)) onChange(parsed as JsonValue[]);
          } catch {
            return;
          }
        }}
      />
    );
  }

  const shown = value.map(item => {
    if (dimensionArray && typeof item === 'number') return roundInput(fromMillimeters(item, displayUnits));
    return String(item);
  }).join(', ');

  return (
    <input
      className="family-text-input family-array-input"
      type="text"
      value={shown}
      disabled={disabled}
      placeholder="comma-separated values"
      onChange={event => {
        const tokens = event.currentTarget.value.split(',').map(token => token.trim()).filter(Boolean);
        if (!tokens.length) {
          onChange([]);
          return;
        }

        if (numericArray || (!value.length && field.unit === 'mm')) {
          const numbers = tokens.map(Number);
          if (numbers.every(Number.isFinite)) {
            onChange(numbers.map(item => dimensionArray || field.unit === 'mm' ? toMillimeters(item, displayUnits) : item));
          }
          return;
        }

        if (value.every(item => typeof item === 'boolean')) {
          onChange(tokens.map(token => {
            const normalized = token.toLowerCase();
            return normalized === 'true' || normalized === '1';
          }));
          return;
        }

        onChange(tokens);
      }}
    />
  );
}

function ReadOnlyValue({
  value,
  field,
  displayUnits,
}: {
  value: JsonValue | null;
  field: FamilyFieldDefinition;
  displayUnits: DisplayUnits;
}) {
  let label = stringifyValue(value);
  if (field.unit === 'mm' && typeof value === 'number') {
    label = roundInput(fromMillimeters(value, displayUnits)) + ' ' + unitLabel(displayUnits);
  }
  return <div className="family-readonly-value">{label || '—'}</div>;
}

function inferControlType(field: FamilyFieldDefinition, value: JsonValue | null) {
  if (field.options && field.options.length) return 'select';
  if (typeof value === 'boolean' || typeof field.value === 'boolean') return 'boolean';
  if (typeof value === 'number' || typeof field.value === 'number') return 'number';
  if (Array.isArray(value) || Array.isArray(field.value)) return 'array';
  return 'text';
}

function numberFallback(field: FamilyFieldDefinition) {
  return typeof field.value === 'number' ? field.value : 0;
}

function isCountLike(key: string) {
  return /(^|_)(count|columns|rows|preview_count|rail_count|window_count)$/.test(key)
    || /_count_/.test(key)
    || key.endsWith('_count');
}

function defaultDescription(field: FamilyFieldDefinition) {
  if (field.expression) return 'Computed from ' + field.expression + '.';
  if (field.options && field.options.length) return 'Choose one of the family-supported values.';
  if (field.unit === 'mm') return 'Family-specific dimensional setting.';
  return '';
}

function stringifyValue(value: JsonValue | null) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function humanizeOption(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\bcnc\b/gi, 'CNC')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function roundInput(value: number) {
  return Math.round(value * 10000) / 10000;
}
