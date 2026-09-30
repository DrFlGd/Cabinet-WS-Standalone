import { afterEach, describe, expect, it, vi } from 'vitest';
import { attachRecoveryLifecycle, clearRecovery, readRecovery, writeRecovery } from './recovery';

const originalWindow = globalThis.window;
const originalLocalStorage = globalThis.localStorage;

function restoreGlobal(name: 'window' | 'localStorage', value: unknown) {
  if (value === undefined) {
    delete (globalThis as unknown as Record<string, unknown>)[name];
  } else {
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  }
}

afterEach(() => {
  restoreGlobal('window', originalWindow);
  restoreGlobal('localStorage', originalLocalStorage);
});

describe('project recovery storage', () => {
  it('round-trips and clears the browser recovery copy', async () => {
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, 'window', {
      value: {},
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
      configurable: true,
      writable: true,
    });

    await writeRecovery('{"version":3,"name":"Recovered"}');
    const result = await readRecovery();

    expect(result?.content).toContain('"Recovered"');
    expect(result?.updatedAt).toEqual(expect.any(Number));

    await clearRecovery();
    await expect(readRecovery()).resolves.toBeNull();
  });

  it('uses the desktop recovery bridge without touching browser storage', async () => {
    const readRecoveryBridge = vi.fn(async () => ({ content: 'desktop-copy', updatedAt: 42 }));
    const writeRecoveryBridge = vi.fn(async () => undefined);
    const clearRecoveryBridge = vi.fn(async () => undefined);
    const browserSet = vi.fn();

    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: vi.fn(), setItem: browserSet, removeItem: vi.fn() },
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: {
        cabinetDesktop: {
          readRecovery: readRecoveryBridge,
          writeRecovery: writeRecoveryBridge,
          clearRecovery: clearRecoveryBridge,
        },
      },
      configurable: true,
      writable: true,
    });

    await writeRecovery('desktop-copy');
    await expect(readRecovery()).resolves.toEqual({ content: 'desktop-copy', updatedAt: 42 });
    await clearRecovery();

    expect(writeRecoveryBridge).toHaveBeenCalledWith('desktop-copy');
    expect(readRecoveryBridge).toHaveBeenCalledOnce();
    expect(clearRecoveryBridge).toHaveBeenCalledOnce();
    expect(browserSet).not.toHaveBeenCalled();
  });
});


describe('recovery lifecycle events', () => {
  it('flushes dirty recovery when hidden and before unload, then detaches', () => {
    const windowListeners = new Map<string, EventListener>();
    const documentListeners = new Map<string, EventListener>();
    const flush = vi.fn();
    const windowTarget = {
      addEventListener: vi.fn((name: string, listener: EventListenerOrEventListenerObject) => {
        windowListeners.set(name, listener as EventListener);
      }),
      removeEventListener: vi.fn((name: string) => {
        windowListeners.delete(name);
      }),
    } as unknown as Pick<Window, 'addEventListener' | 'removeEventListener'>;
    const documentTarget = {
      visibilityState: 'hidden',
      addEventListener: vi.fn((name: string, listener: EventListenerOrEventListenerObject) => {
        documentListeners.set(name, listener as EventListener);
      }),
      removeEventListener: vi.fn((name: string) => {
        documentListeners.delete(name);
      }),
    } as unknown as Pick<Document, 'addEventListener' | 'removeEventListener' | 'visibilityState'>;

    const detach = attachRecoveryLifecycle({ dirty: true, flush, windowTarget, documentTarget });

    documentListeners.get('visibilitychange')?.(new Event('visibilitychange'));
    expect(flush).toHaveBeenCalledTimes(1);

    const unload = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    windowListeners.get('beforeunload')?.(unload);
    expect(flush).toHaveBeenCalledTimes(2);
    expect(unload.defaultPrevented).toBe(true);

    detach();
    expect(windowListeners.has('beforeunload')).toBe(false);
    expect(documentListeners.has('visibilitychange')).toBe(false);
  });

  it('does not register a dirty-navigation guard for clean documents', () => {
    const windowTarget = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Pick<Window, 'addEventListener' | 'removeEventListener'>;
    const documentTarget = {
      visibilityState: 'hidden',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Pick<Document, 'addEventListener' | 'removeEventListener' | 'visibilityState'>;

    const detach = attachRecoveryLifecycle({
      dirty: false,
      flush: vi.fn(),
      windowTarget,
      documentTarget,
    });

    expect(windowTarget.addEventListener).not.toHaveBeenCalled();
    detach();
  });
});
