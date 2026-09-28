export type DisplayUnits = 'mm' | 'in';

export const MM_PER_INCH = 25.4;

export function fromMillimeters(value: number, units: DisplayUnits) {
  return units === 'in' ? value / MM_PER_INCH : value;
}

export function toMillimeters(value: number, units: DisplayUnits) {
  return units === 'in' ? value * MM_PER_INCH : value;
}

export function formatDimension(value: number, units: DisplayUnits) {
  const converted = fromMillimeters(value, units);
  return converted.toFixed(units === 'in' ? 3 : 2);
}

export function unitLabel(units: DisplayUnits) {
  return units === 'in' ? 'in' : 'mm';
}
