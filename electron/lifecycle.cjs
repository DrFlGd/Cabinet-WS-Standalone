function rendererFailureDetail(details = {}) {
  const reason = typeof details.reason === 'string' ? details.reason : 'unknown';
  const exitCode = Number.isInteger(details.exitCode) ? details.exitCode : null;
  const exitText = exitCode === null ? '' : ` (exit ${exitCode})`;
  return [
    `Renderer reason: ${reason}${exitText}.`,
    'The most recent recovery copy has been kept.',
    'Reloading restarts the modeling workspace and will offer recovery if unsaved changes were captured.',
  ].join('\n\n');
}

function createRendererRecoveryHandler({
  dialog,
  logger = console,
  isShuttingDown = () => false,
}) {
  if (!dialog || typeof dialog.showMessageBox !== 'function') {
    throw new Error('A dialog implementation is required.');
  }

  const recovering = new WeakSet();

  return async function recoverRenderer(win, details = {}) {
    if (!win || typeof win.isDestroyed !== 'function' || win.isDestroyed()) return 'ignored';
    if (isShuttingDown() || details.reason === 'clean-exit') return 'ignored';
    if (recovering.has(win)) return 'already-recovering';

    recovering.add(win);
    try {
      logger.error?.('Cabinet WS renderer stopped unexpectedly.', details);
      const result = await dialog.showMessageBox(win, {
        type: 'error',
        title: 'Cabinet WS workspace stopped',
        message: 'The modeling workspace stopped unexpectedly.',
        detail: rendererFailureDetail(details),
        buttons: ['Reload workspace', 'Close'],
        defaultId: 0,
        cancelId: 1,
        noLink: true,
      });

      if (win.isDestroyed()) return 'destroyed';
      if (result?.response === 0) {
        win.reload();
        return 'reloaded';
      }

      win.close();
      return 'closed';
    } catch (error) {
      logger.error?.('Could not show renderer recovery dialog.', error);
      if (!win.isDestroyed()) {
        win.reload();
        return 'reloaded-after-dialog-error';
      }
      return 'destroyed';
    } finally {
      recovering.delete(win);
    }
  };
}

module.exports = {
  createRendererRecoveryHandler,
  rendererFailureDetail,
};
