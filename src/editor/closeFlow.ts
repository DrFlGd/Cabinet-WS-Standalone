import type { CloseDecision } from '../desktop';

export type DesktopCloseOutcome =
  | 'closed-clean'
  | 'closed-saved'
  | 'closed-discarded'
  | 'cancelled'
  | 'save-aborted';

export async function handleDesktopCloseRequest({
  dirty,
  flushRecovery,
  confirmClose,
  save,
  discard,
  approve,
  cancel,
}: {
  dirty: boolean;
  flushRecovery: () => Promise<void>;
  confirmClose: () => Promise<CloseDecision>;
  save: () => Promise<boolean>;
  discard: () => Promise<void>;
  approve: () => Promise<unknown>;
  cancel: () => Promise<unknown>;
}): Promise<DesktopCloseOutcome> {
  if (!dirty) {
    await approve();
    return 'closed-clean';
  }

  await flushRecovery();
  const decision = await confirmClose();

  if (decision === 'cancel') {
    await cancel();
    return 'cancelled';
  }

  if (decision === 'discard') {
    await discard();
    await approve();
    return 'closed-discarded';
  }

  if (await save()) {
    await approve();
    return 'closed-saved';
  }

  await cancel();
  return 'save-aborted';
}
