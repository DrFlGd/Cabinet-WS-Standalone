import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const {
  createRendererRecoveryHandler,
  createWindowCloseController,
  rendererFailureDetail,
} = require('../../electron/lifecycle.cjs') as {
  createRendererRecoveryHandler(options: {
    dialog: { showMessageBox: (...args: unknown[]) => Promise<{ response: number }> };
    logger?: { error?: (...args: unknown[]) => void };
    isShuttingDown?: () => boolean;
    beforeClose?: (win: unknown) => void;
  }): (win: {
    isDestroyed(): boolean;
    reload(): void;
    close(): void;
  }, details?: { reason?: string; exitCode?: number }) => Promise<string>;
  createWindowCloseController(options: {
    requestClose: () => void;
    canRequestClose?: () => boolean;
    onCancel?: () => void;
  }): {
    handleClose(event: { preventDefault(): void }): string;
    approve(): string;
    cancel(): string;
    rendererUnavailable(): string;
    isApproved(): boolean;
    isPending(): boolean;
  };
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
    const beforeClose = vi.fn();
    const recover = createRendererRecoveryHandler({ dialog, beforeClose });

    expect(await recover(win, { reason: 'crashed', exitCode: 11 })).toBe('closed');
    expect(beforeClose).toHaveBeenCalledWith(win);
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


describe('Electron window close requests', () => {
  it('prevents the first native close and requests one renderer decision', () => {
    const requestClose = vi.fn();
    const controller = createWindowCloseController({ requestClose });
    const first = { preventDefault: vi.fn() };
    const repeated = { preventDefault: vi.fn() };

    expect(controller.handleClose(first)).toBe('requested');
    expect(controller.handleClose(repeated)).toBe('pending');

    expect(first.preventDefault).toHaveBeenCalledOnce();
    expect(repeated.preventDefault).toHaveBeenCalledOnce();
    expect(requestClose).toHaveBeenCalledOnce();
    expect(controller.isPending()).toBe(true);
  });

  it('allows the approved retry to close without another prompt', () => {
    const requestClose = vi.fn();
    const controller = createWindowCloseController({ requestClose });
    const first = { preventDefault: vi.fn() };
    const approved = { preventDefault: vi.fn() };

    controller.handleClose(first);
    expect(controller.approve()).toBe('approved');
    expect(controller.handleClose(approved)).toBe('approved');

    expect(approved.preventDefault).not.toHaveBeenCalled();
    expect(requestClose).toHaveBeenCalledOnce();
    expect(controller.isApproved()).toBe(true);
  });

  it('allows native close immediately when no renderer close listener is registered', () => {
    const requestClose = vi.fn();
    const event = { preventDefault: vi.fn() };
    const controller = createWindowCloseController({
      requestClose,
      canRequestClose: () => false,
    });

    expect(controller.handleClose(event)).toBe('fallback-approved');
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(requestClose).not.toHaveBeenCalled();
    expect(controller.isApproved()).toBe(true);
    expect(controller.isPending()).toBe(false);
  });

  it('releases a pending request if the renderer listener disappears', () => {
    let rendererReady = true;
    const requestClose = vi.fn();
    const onCancel = vi.fn();
    const controller = createWindowCloseController({
      requestClose,
      canRequestClose: () => rendererReady,
      onCancel,
    });

    const first = { preventDefault: vi.fn() };
    expect(controller.handleClose(first)).toBe('requested');
    expect(controller.isPending()).toBe(true);

    rendererReady = false;
    expect(controller.rendererUnavailable()).toBe('cancelled');
    expect(controller.isPending()).toBe(false);
    expect(onCancel).toHaveBeenCalledOnce();

    const retry = { preventDefault: vi.fn() };
    expect(controller.handleClose(retry)).toBe('fallback-approved');
    expect(retry.preventDefault).not.toHaveBeenCalled();
    expect(requestClose).toHaveBeenCalledOnce();
    expect(controller.isApproved()).toBe(true);
  });

  it('resets a cancelled request so a later X or Exit can prompt again', () => {
    const requestClose = vi.fn();
    const onCancel = vi.fn();
    const controller = createWindowCloseController({ requestClose, onCancel });

    controller.handleClose({ preventDefault: vi.fn() });
    expect(controller.cancel()).toBe('cancelled');
    expect(controller.isPending()).toBe(false);
    expect(onCancel).toHaveBeenCalledOnce();

    expect(controller.handleClose({ preventDefault: vi.fn() })).toBe('requested');
    expect(requestClose).toHaveBeenCalledTimes(2);
  });
});
