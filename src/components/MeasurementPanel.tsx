import { Ruler, X } from 'lucide-react';
import type { MeasurementMode, MeasurementResult } from '../cad/measurements';
import { formatDimension, unitLabel, type DisplayUnits } from '../cad/units';

type Props = {
  mode: MeasurementMode;
  result: MeasurementResult | null;
  selectionCount: number;
  units: DisplayUnits;
  onMode: (mode: MeasurementMode) => void;
  onClear: () => void;
};

export default function MeasurementPanel({ mode, result, selectionCount, units, onMode, onClear }: Props) {
  const value = result
    ? result.unit === 'deg'
      ? `${result.value.toFixed(2)}°`
      : result.unit === 'mm2'
        ? `${formatArea(result.value, units)} ${unitLabel(units)}²`
        : `${formatDimension(result.value, units)} ${unitLabel(units)}`
    : null;

  return (
    <section className="measurement-panel">
      <div className="measurement-heading">
        <Ruler size={13} />
        <strong>Measure</strong>
        <button type="button" onClick={onClear} title="Clear measurement"><X size={12} /></button>
      </div>
      <div className="measurement-modes">
        {([
          ['distance', 'Distance'],
          ['face', 'Face'],
          ['angle', 'Angle'],
        ] as const).map(([next, label]) => (
          <button
            type="button"
            key={next}
            className={mode === next ? 'active' : ''}
            onClick={() => onMode(mode === next ? 'off' : next)}
          >
            {label}
          </button>
        ))}
      </div>
      {mode !== 'off' && !result && (
        <p>
          {mode === 'face'
            ? 'Select one exact face.'
            : mode === 'angle'
              ? `Select two exact faces · ${selectionCount}/2`
              : `Select two semantic faces or edges · ${selectionCount}/2`}
        </p>
      )}
      {result && (
        <div className="measurement-result">
          <span>{result.title}</span>
          <strong>{value}</strong>
          <small>{result.detail}</small>
        </div>
      )}
    </section>
  );
}

function formatArea(value: number, units: DisplayUnits) {
  const converted = units === 'in' ? value / (25.4 * 25.4) : value;
  return converted >= 100 ? converted.toFixed(1) : converted.toFixed(2);
}
