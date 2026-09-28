import { describe, expect, it } from 'vitest';
import { formatDimension, fromMillimeters, toMillimeters } from './units';

describe('display units', () => {
  it('converts inches without changing the stored millimeter value', () => {
    expect(fromMillimeters(609.6, 'in')).toBeCloseTo(24, 10);
    expect(toMillimeters(24, 'in')).toBeCloseTo(609.6, 10);
    expect(formatDimension(19.05, 'in')).toBe('0.750');
    expect(formatDimension(19.05, 'mm')).toBe('19.05');
  });
});
