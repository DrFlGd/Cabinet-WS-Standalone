import { useEffect, useRef, useState } from 'react';
import { formatDimension, toMillimeters, unitLabel, type DisplayUnits } from '../cad/units';

type Props = {
  value: number;
  ariaLabel?: string;
  disabled?: boolean;
  units: DisplayUnits;
  step?: number;
  min?: number;
  onChange: (millimeters: number) => void;
};

export default function DimensionInput({ value, units, step, min, onChange, ariaLabel, disabled }: Props) {
  const focused = useRef(false);
  const [draft, setDraft] = useState(() => formatDimension(value, units));

  useEffect(() => {
    if (!focused.current) setDraft(formatDimension(value, units));
  }, [value, units]);

  return (
    <div className="number-input">
      <input
        type="number"
        aria-label={ariaLabel}
        disabled={disabled}
        value={draft}
        min={min}
        step={step ?? (units === 'in' ? 0.01 : 1)}
        onFocus={() => { focused.current = true; }}
        onChange={event => {
          const nextDraft = event.currentTarget.value;
          setDraft(nextDraft);
          const numeric = Number(nextDraft);
          if (nextDraft.trim() && Number.isFinite(numeric)) {
            onChange(toMillimeters(numeric, units));
          }
        }}
        onBlur={() => {
          focused.current = false;
          setDraft(formatDimension(value, units));
        }}
        onKeyDown={event => {
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') {
            setDraft(formatDimension(value, units));
            event.currentTarget.blur();
          }
        }}
      />
      <small>{unitLabel(units)}</small>
    </div>
  );
}
