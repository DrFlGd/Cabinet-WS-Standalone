const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

function createAtomicTextWriter({
  fsImpl = fs,
  randomId = randomUUID,
} = {}) {
  const pendingByPath = new Map();

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

  return function atomicWriteText(filePath, content) {
    const previous = pendingByPath.get(filePath) ?? Promise.resolve();
    const write = previous
      .catch(() => undefined)
      .then(() => writeOnce(filePath, content));

    pendingByPath.set(filePath, write);
    return write.finally(() => {
      if (pendingByPath.get(filePath) === write) {
        pendingByPath.delete(filePath);
      }
    });
  };
}

const atomicWriteText = createAtomicTextWriter();

module.exports = {
  atomicWriteText,
  createAtomicTextWriter,
};
