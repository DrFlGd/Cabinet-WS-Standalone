import { describe, expect, it } from 'vitest';
import { shouldShowViewportHandle } from './viewportInteraction';

describe('viewport interaction helpers', () => {
  it('keeps cabinet envelope handles out of ordinary viewing', () => {
    expect(shouldShowViewportHandle('envelope', undefined, null, false)).toBe(false);
    expect(shouldShowViewportHandle('envelope', undefined, 'carcass:left', false)).toBe(false);
    expect(shouldShowViewportHandle('envelope', undefined, null, true)).toBe(true);
  });

  it('shows shelf and divider handles only for the selected editable part', () => {
    expect(shouldShowViewportHandle('shelf', 'shelf:1', null, false)).toBe(false);
    expect(shouldShowViewportHandle('shelf', 'shelf:1', 'shelf:2', false)).toBe(false);
    expect(shouldShowViewportHandle('shelf', 'shelf:1', 'shelf:1', false)).toBe(true);
    expect(shouldShowViewportHandle('divider', 'divider:3', 'divider:3', false)).toBe(true);
  });
});
