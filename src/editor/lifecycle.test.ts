import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const {
  createRendererRecoveryHandler,
  rendererFailureDetail,
} = require('../../electron/lifecycle.cjs') as {
  createRendererRecoveryHandler(options: {
    dialog: { showMessageBox: (...args: unknown[]) => Promise<{ response: number }> };
    logger?: { error?: (...args: unknown[]) => void };
    isShuttingDown?: () => boolean;
  }): (win: {
    isDestroyed(): boolean;
    reload(): void;
    close(): void;
  }, details?: { reason?: string; exitCode?: number }) => Promise<string>;
  rendererFailureDetail(details?: { reason?: string; exitCode?: number }): string;
};

function fakeWindow() {
  let destroyed = false;
  return {
    reload: vi.fn(),
    close: vi.fn(() => { destroyed = true; }),
    isDestroyed: vi.fn(() => destroyed),
  };
}

describe('Electron renderer recovery lifecycle', () => {
  it('keeps recovery and reloads after a renderer crash', async () => {
    const win = fakeWindow();
    const dialog = { showMessageBox: vi.fn(async (..._args: unknown[]) => ({ response: 0 })) };
    const logger = { error: vi.fn() };
    const recover = createRendererRecoveryHandler({ dialog, logger });

    const outcome = await recover(win, { reason: 'crashed', exitCode: 101 });

    expect(outcome).toBe('reloaded');
    expect(dialog.showMessageBox).toHaveBeenCalledOnce();
    expect(win.reload).toHaveBeenCalledOnce();
    expect(win.close).not.toHaveBeenCalled();
    const options = dialog.showMessageBox.mock.calls[0]?.[1] as { detail: string };
    expect(options.detail).toContain('recovery copy has been kept');
    expect(options.detail).toContain('crashed');
  });

  it('closes the window when the user declines a crash reload', async () => {
    const win = fakeWindow();
    const dialog = { showMessageBox: vi.fn(async (..._args: unknown[]) => ({ response: 1 })) };
    const recover = createRendererRecoveryHandler({ dialog });

    expect(await recover(win, { reason: 'crashed', exitCode: 11 })).toBe('closed');
    expect(win.close).toHaveBeenCalledOnce();
    expect(win.reload).not.toHaveBeenCalled();
  });

  it('does not interrupt clean exit or application shutdown', async () => {
    const win = fakeWindow();
    const dialog = { showMessageBox: vi.fn(async (..._args: unknown[]) => ({ response: 0 })) };
    const cleanRecover = createRendererRecoveryHandler({ dialog });
    const shuttingDownRecover = createRendererRecoveryHandler({
      dialog,
      isShuttingDown: () => true,
    });

    expect(await cleanRecover(win, { reason: 'clean-exit', exitCode: 0 })).toBe('ignored');
    expect(await shuttingDownRecover(win, { reason: 'crashed', exitCode: 9 })).toBe('ignored');
    expect(dialog.showMessageBox).not.toHaveBeenCalled();
    expect(win.reload).not.toHaveBeenCalled();
  });

  it('falls back to reload if the crash dialog itself fails', async () => {
    const win = fakeWindow();
    const dialog = { showMessageBox: vi.fn(async () => { throw new Error('dialog failed'); }) };
    const logger = { error: vi.fn() };
    const recover = createRendererRecoveryHandler({ dialog, logger });

    expect(await recover(win, { reason: 'oom', exitCode: 137 })).toBe('reloaded-after-dialog-error');
    expect(win.reload).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalled();
  });

  it('includes the renderer reason and exit code in diagnostic text', () => {
    const detail = rendererFailureDetail({ reason: 'integrity-failure', exitCode: 7 });
    expect(detail).toContain('integrity-failure');
    expect(detail).toContain('exit 7');
  });
});
