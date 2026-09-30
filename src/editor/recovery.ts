import { desktopApi } from '../desktop';

const BROWSER_RECOVERY_KEY = 'cabinet-ws-standalone-recovery-v2';

export async function readRecovery() {
  const desktop = desktopApi();
  if (desktop) return desktop.readRecovery();

  try {
    const raw = localStorage.getItem(BROWSER_RECOVERY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { content?: unknown; updatedAt?: unknown };
    if (typeof parsed.content !== 'string' || typeof parsed.updatedAt !== 'number') return null;
    return { content: parsed.content, updatedAt: parsed.updatedAt };
  } catch {
    return null;
  }
}

export async function writeRecovery(content: string) {
  const desktop = desktopApi();
  if (desktop) return desktop.writeRecovery(content);
  localStorage.setItem(BROWSER_RECOVERY_KEY, JSON.stringify({ content, updatedAt: Date.now() }));
}

export async function clearRecovery() {
  const desktop = desktopApi();
  if (desktop) return desktop.clearRecovery();
  localStorage.removeItem(BROWSER_RECOVERY_KEY);
}


type RecoveryWindowTarget = Pick<Window, 'addEventListener' | 'removeEventListener'>;
type RecoveryDocumentTarget = Pick<Document, 'addEventListener' | 'removeEventListener' | 'visibilityState'>;

export function attachRecoveryLifecycle({
  dirty,
  flush,
  windowTarget = window,
  documentTarget = document,
  blockUnload = true,
}: {
  dirty: boolean;
  flush: () => void;
  windowTarget?: RecoveryWindowTarget;
  documentTarget?: RecoveryDocumentTarget;
  blockUnload?: boolean;
}) {
  const onVisibilityChange = () => {
    if (dirty && documentTarget.visibilityState === 'hidden') flush();
  };
  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!dirty) return;
    flush();
    if (!blockUnload) return;
    event.preventDefault();
    event.returnValue = '';
  };

  documentTarget.addEventListener('visibilitychange', onVisibilityChange);
  if (dirty) windowTarget.addEventListener('beforeunload', onBeforeUnload);

  return () => {
    documentTarget.removeEventListener('visibilitychange', onVisibilityChange);
    if (dirty) windowTarget.removeEventListener('beforeunload', onBeforeUnload);
  };
}
