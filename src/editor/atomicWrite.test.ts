import { createRequire } from 'node:module';
import * as realFs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  createAtomicTextFileOperations,
  createAtomicTextWriter,
} = require('../../electron/atomic-write.cjs') as {
  createAtomicTextFileOperations(options?: {
    fsImpl?: {
      mkdir: (...args: Parameters<typeof realFs.mkdir>) => ReturnType<typeof realFs.mkdir>;
      writeFile: (...args: Parameters<typeof realFs.writeFile>) => ReturnType<typeof realFs.writeFile>;
      rename: (...args: Parameters<typeof realFs.rename>) => ReturnType<typeof realFs.rename>;
      unlink: (...args: Parameters<typeof realFs.unlink>) => ReturnType<typeof realFs.unlink>;
    };
    randomId?: () => string;
  }): {
    write(filePath: string, content: string): Promise<void>;
    clear(filePath: string): Promise<void>;
  };
  createAtomicTextWriter(): (filePath: string, content: string) => Promise<void>;
};

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map(root => realFs.rm(root, { recursive: true, force: true })));
});

describe('atomic text writes', () => {
  it('serializes concurrent writes to the same destination without temp-file collisions', async () => {
    const root = await realFs.mkdtemp(join(tmpdir(), 'cabinet-ws-atomic-write-'));
    tempRoots.push(root);
    const filePath = join(root, 'recovery.cabinetws.json');
    const write = createAtomicTextWriter();
    const payloads = Array.from({ length: 24 }, (_, index) => JSON.stringify({
      version: 3,
      name: `Recovery ${index}`,
    }));

    await Promise.all(payloads.map(payload => write(filePath, payload)));

    await expect(realFs.readFile(filePath, 'utf8')).resolves.toBe(payloads.at(-1));
    const leftovers = (await realFs.readdir(root)).filter(name => name.includes('.tmp-'));
    expect(leftovers).toEqual([]);
  });

  it('orders a clear after an already-pending write so stale recovery is not recreated', async () => {
    const root = await realFs.mkdtemp(join(tmpdir(), 'cabinet-ws-recovery-clear-'));
    tempRoots.push(root);
    const filePath = join(root, 'recovery.cabinetws.json');
    await realFs.writeFile(filePath, 'older-recovery', 'utf8');

    let signalWriteStarted!: () => void;
    let releaseWrite!: () => void;
    const writeStarted = new Promise<void>(resolve => { signalWriteStarted = resolve; });
    const writeMayContinue = new Promise<void>(resolve => { releaseWrite = resolve; });

    const operations = createAtomicTextFileOperations({
      fsImpl: {
        mkdir: realFs.mkdir,
        writeFile: async (...args) => {
          signalWriteStarted();
          await writeMayContinue;
          return realFs.writeFile(...args);
        },
        rename: realFs.rename,
        unlink: realFs.unlink,
      },
      randomId: () => 'pending-write',
    });

    const pendingWrite = operations.write(filePath, 'stale-pending-recovery');
    await writeStarted;
    const pendingClear = operations.clear(filePath);
    releaseWrite();

    await Promise.all([pendingWrite, pendingClear]);

    await expect(realFs.readFile(filePath, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
    const leftovers = (await realFs.readdir(root)).filter(name => name.includes('.tmp-'));
    expect(leftovers).toEqual([]);
  });

  it('preserves operation order when a write follows a clear', async () => {
    const root = await realFs.mkdtemp(join(tmpdir(), 'cabinet-ws-recovery-rewrite-'));
    tempRoots.push(root);
    const filePath = join(root, 'recovery.cabinetws.json');
    await realFs.writeFile(filePath, 'old-recovery', 'utf8');
    const operations = createAtomicTextFileOperations();

    const clear = operations.clear(filePath);
    const write = operations.write(filePath, 'new-recovery');

    await Promise.all([clear, write]);
    await expect(realFs.readFile(filePath, 'utf8')).resolves.toBe('new-recovery');
  });

  it('allows a queued write to proceed after an earlier write fails', async () => {
    const calls: string[] = [];
    let firstRename = true;
    const writer = require('../../electron/atomic-write.cjs').createAtomicTextWriter({
      fsImpl: {
        mkdir: async () => undefined,
        writeFile: async (filePath: string) => { calls.push(`write:${filePath}`); },
        rename: async (from: string) => {
          calls.push(`rename:${from}`);
          if (firstRename) {
            firstRename = false;
            const error = new Error('simulated rename failure') as NodeJS.ErrnoException;
            error.code = 'ENOENT';
            throw error;
          }
        },
        unlink: async (filePath: string) => { calls.push(`unlink:${filePath}`); },
      },
      randomId: (() => {
        let value = 0;
        return () => String(++value);
      })(),
    }) as (filePath: string, content: string) => Promise<void>;

    const first = writer('/tmp/recovery.json', 'first');
    const second = writer('/tmp/recovery.json', 'second');

    await expect(first).rejects.toThrow('simulated rename failure');
    await expect(second).resolves.toBeUndefined();

    expect(calls.filter(call => call.startsWith('write:'))).toHaveLength(2);
    expect(calls.some(call => call.endsWith('.tmp-' + process.pid + '-1'))).toBe(true);
    expect(calls.some(call => call.endsWith('.tmp-' + process.pid + '-2'))).toBe(true);
  });
});
