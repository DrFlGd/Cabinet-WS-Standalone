import { useEffect, useRef, useState } from 'react';
import { FunctionSquare } from 'lucide-react';
import { familyFieldIsComputed, familyFieldIsSectionTree, familyFieldLabel, type FamilyFieldDefinition } from '../cad/familySettings';
import { fromMillimeters, toMillimeters, unitLabel, type DisplayUnits } from '../cad/units';
import type { JsonValue } from '../cad/types';
import SelectControl from './SelectControl';

export default function FamilyFieldControl({
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
      {(type !== 'boolean' || computed || sectionTree) && <div className="family-field-label">
        <span>{familyFieldLabel(field.key)}</span>
        <div className="family-field-badges">
          {computed && <small title={'Computed: ' + field.expression}><FunctionSquare size={10} /> FX</small>}
          {field.advanced && <small>ADV</small>}
        </div>
      </div>}

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
          <span>{familyFieldLabel(field.key)}</span>
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
          aria-label={familyFieldLabel(field.key)}
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
        aria-label={familyFieldLabel(field.key)}
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
  const focused = useRef(false);
  const nested = value.some(item => Array.isArray(item) || (item !== null && typeof item === 'object'));
  const numericArray = value.every(item => typeof item === 'number');
  const dimensionArray = field.unit === 'mm' && numericArray;
  const formatted = formatArrayDraft(value, field, displayUnits);
  const [draft, setDraft] = useState(formatted);

  useEffect(() => {
    if (!focused.current) setDraft(formatted);
  }, [formatted]);

  function commit(nextDraft: string) {
    if (nested) {
      try {
        const parsed = JSON.parse(nextDraft) as unknown;
        if (Array.isArray(parsed)) onChange(parsed as JsonValue[]);
      } catch {
        setDraft(formatted);
      }
      return;
    }

    const tokens = nextDraft.split(',').map(token => token.trim()).filter(Boolean);
    if (!tokens.length) {
      onChange([]);
      return;
    }

    if (numericArray || (!value.length && field.unit === 'mm')) {
      const numbers = tokens.map(Number);
      if (numbers.every(Number.isFinite)) {
        onChange(numbers.map(item => dimensionArray || field.unit === 'mm' ? toMillimeters(item, displayUnits) : item));
      } else {
        setDraft(formatted);
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
  }

  if (nested) {
    return (
      <textarea
        className="family-array-input family-json-input"
        value={draft}
        disabled={disabled}
        rows={Math.min(5, Math.max(2, value.length))}
        onFocus={() => { focused.current = true; }}
        onChange={event => setDraft(event.currentTarget.value)}
        onBlur={() => {
          focused.current = false;
          commit(draft);
        }}
        onKeyDown={event => {
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') {
            setDraft(formatted);
            event.currentTarget.blur();
          }
        }}
      />
    );
  }

  return (
    <input
      className="family-text-input family-array-input"
      type="text"
          aria-label={familyFieldLabel(field.key)}
      value={draft}
      disabled={disabled}
      placeholder="comma-separated values"
      onFocus={() => { focused.current = true; }}
      onChange={event => setDraft(event.currentTarget.value)}
      onBlur={() => {
        focused.current = false;
        commit(draft);
      }}
      onKeyDown={event => {
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') {
          setDraft(formatted);
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function formatArrayDraft(
  value: JsonValue[],
  field: FamilyFieldDefinition,
  displayUnits: DisplayUnits,
) {
  const nested = value.some(item => Array.isArray(item) || (item !== null && typeof item === 'object'));
  if (nested) return JSON.stringify(value);

  const numericArray = value.every(item => typeof item === 'number');
  const dimensionArray = field.unit === 'mm' && numericArray;
  return value.map(item => {
    if (dimensionArray && typeof item === 'number') return roundInput(fromMillimeters(item, displayUnits));
    return String(item);
  }).join(', ');
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
