import { describe, expect, it, vi } from 'vitest';
import { handleDesktopCloseRequest } from './closeFlow';

function callbacks() {
  return {
    flushRecovery: vi.fn(async () => undefined),
    confirmClose: vi.fn(async () => 'cancel' as const),
    save: vi.fn(async () => true),
    discard: vi.fn(async () => undefined),
    approve: vi.fn(async () => true),
    cancel: vi.fn(async () => false),
  };
}

describe('desktop close flow', () => {
  it('closes a clean document without prompting', async () => {
    const calls = callbacks();

    await expect(handleDesktopCloseRequest({ dirty: false, ...calls })).resolves.toBe('closed-clean');

    expect(calls.approve).toHaveBeenCalledOnce();
    expect(calls.confirmClose).not.toHaveBeenCalled();
    expect(calls.flushRecovery).not.toHaveBeenCalled();
  });

  it('flushes recovery and closes only after a successful save', async () => {
    const calls = callbacks();
    calls.confirmClose.mockResolvedValue('save');

    await expect(handleDesktopCloseRequest({ dirty: true, ...calls })).resolves.toBe('closed-saved');

    expect(calls.flushRecovery).toHaveBeenCalledOnce();
    expect(calls.save).toHaveBeenCalledOnce();
    expect(calls.approve).toHaveBeenCalledOnce();
    expect(calls.cancel).not.toHaveBeenCalled();
  });

  it('keeps the window open when save is cancelled or fails', async () => {
    const calls = callbacks();
    calls.confirmClose.mockResolvedValue('save');
    calls.save.mockResolvedValue(false);

    await expect(handleDesktopCloseRequest({ dirty: true, ...calls })).resolves.toBe('save-aborted');

    expect(calls.approve).not.toHaveBeenCalled();
    expect(calls.cancel).toHaveBeenCalledOnce();
  });

  it('clears recovery before approving an explicit discard', async () => {
    const calls = callbacks();
    calls.confirmClose.mockResolvedValue('discard');

    await expect(handleDesktopCloseRequest({ dirty: true, ...calls })).resolves.toBe('closed-discarded');

    expect(calls.discard).toHaveBeenCalledOnce();
    expect(calls.approve).toHaveBeenCalledOnce();
    expect(calls.save).not.toHaveBeenCalled();
  });

  it('retains the dirty document when close is cancelled', async () => {
    const calls = callbacks();

    await expect(handleDesktopCloseRequest({ dirty: true, ...calls })).resolves.toBe('cancelled');

    expect(calls.cancel).toHaveBeenCalledOnce();
    expect(calls.approve).not.toHaveBeenCalled();
    expect(calls.discard).not.toHaveBeenCalled();
  });
});
