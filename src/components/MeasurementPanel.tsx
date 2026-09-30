import { Ruler, X } from 'lucide-react';
import type { MeasurementMetric, MeasurementMode, MeasurementResult } from '../cad/measurements';
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
  return (
    <section className="measurement-panel">
      <div className="measurement-heading">
        <Ruler size={13} />
        <strong>Measure</strong>
        <button type="button" onClick={onClear} title="Clear measurement" aria-label="Clear measurement"><X size={12} /></button>
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
            ? 'Select one face.'
            : mode === 'angle'
              ? `Select two faces · ${selectionCount}/2`
              : `Select two faces or edges · ${selectionCount}/2`}
        </p>
      )}
      {result && (
        <div className="measurement-result">
          <span>{result.title}</span>
          <div className="measurement-primary">
            {result.primary.map(metric => (
              <MetricValue key={metric.label} metric={metric} units={units} primary />
            ))}
          </div>
          {!!result.secondary?.length && (
            <div className="measurement-secondary">
              {result.secondary.map(metric => (
                <MetricValue key={metric.label} metric={metric} units={units} />
              ))}
            </div>
          )}
          {result.detail && <small>{result.detail}</small>}
        </div>
      )}
    </section>
  );
}

function MetricValue({
  metric,
  units,
  primary = false,
}: {
  metric: MeasurementMetric;
  units: DisplayUnits;
  primary?: boolean;
}) {
  return <div className={primary ? 'primary' : undefined}>
    <span>{metric.label}</span>
    <strong>{metric.approximate ? '≈ ' : ''}{formatMetric(metric, units)}</strong>
  </div>;
}

function formatMetric(metric: MeasurementMetric, units: DisplayUnits) {
  if (metric.unit === 'deg') return `${metric.value.toFixed(2)}°`;
  if (metric.unit === 'mm2') return `${formatArea(metric.value, units)} ${unitLabel(units)}²`;
  return `${formatDimension(metric.value, units)} ${unitLabel(units)}`;
}

function formatArea(value: number, units: DisplayUnits) {
  const converted = units === 'in' ? value / (25.4 * 25.4) : value;
  return converted >= 100 ? converted.toFixed(1) : converted.toFixed(2);
}
