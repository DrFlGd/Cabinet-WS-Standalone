const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

function createAtomicTextFileOperations({
  fsImpl = fs,
  randomId = randomUUID,
} = {}) {
  const pendingByPath = new Map();

  function enqueue(filePath, operation) {
    const previous = pendingByPath.get(filePath) ?? Promise.resolve();
    const current = previous
      .catch(() => undefined)
      .then(operation);

    pendingByPath.set(filePath, current);
    return current.finally(() => {
      if (pendingByPath.get(filePath) === current) {
        pendingByPath.delete(filePath);
      }
    });
  }

  async function writeOnce(filePath, content) {
    await fsImpl.mkdir(path.dirname(filePath), { recursive: true });
    const temporary = `${filePath}.tmp-${process.pid}-${randomId()}`;
    let temporaryExists = false;

    try {
      await fsImpl.writeFile(temporary, content, 'utf8');
      temporaryExists = true;
      await fsImpl.rename(temporary, filePath);
      temporaryExists = false;
    } finally {
      if (temporaryExists) {
        try {
          await fsImpl.unlink(temporary);
        } catch {
          // Preserve the original write/rename error; stale temp cleanup is best effort.
        }
      }
    }
  }

  async function clearOnce(filePath) {
    try {
      await fsImpl.unlink(filePath);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }

  return {
    write(filePath, content) {
      return enqueue(filePath, () => writeOnce(filePath, content));
    },
    clear(filePath) {
      return enqueue(filePath, () => clearOnce(filePath));
    },
  };
}

function createAtomicTextWriter(options) {
  return createAtomicTextFileOperations(options).write;
}

const atomicTextFiles = createAtomicTextFileOperations();
const atomicWriteText = atomicTextFiles.write;
const clearAtomicText = atomicTextFiles.clear;

module.exports = {
  atomicWriteText,
  clearAtomicText,
  createAtomicTextFileOperations,
  createAtomicTextWriter,
};
