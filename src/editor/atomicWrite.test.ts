import { createRequire } from 'node:module';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { createAtomicTextWriter } = require('../../electron/atomic-write.cjs') as {
  createAtomicTextWriter(): (filePath: string, content: string) => Promise<void>;
};

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map(root => rm(root, { recursive: true, force: true })));
});

describe('atomic text writes', () => {
  it('serializes concurrent writes to the same destination without temp-file collisions', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cabinet-ws-atomic-write-'));
    tempRoots.push(root);
    const filePath = join(root, 'recovery.cabinetws.json');
    const write = createAtomicTextWriter();
    const payloads = Array.from({ length: 24 }, (_, index) => JSON.stringify({
      version: 3,
      name: `Recovery ${index}`,
    }));

    await Promise.all(payloads.map(payload => write(filePath, payload)));

    await expect(readFile(filePath, 'utf8')).resolves.toBe(payloads.at(-1));
    const leftovers = (await readdir(root)).filter(name => name.includes('.tmp-'));
    expect(leftovers).toEqual([]);
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
