const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { atomicWriteText, clearAtomicText } = require('./atomic-write.cjs');
const { createRendererRecoveryHandler, createWindowCloseController } = require('./lifecycle.cjs');

const MAX_DOCUMENT_BYTES = 2_000_000;
const MAX_STEP_BYTES = 250_000_000;
const MAX_TEXT_EXPORT_BYTES = 20_000_000;
const MAX_BINARY_EXPORT_BYTES = 250_000_000;
const approvedPaths = new Set();
const closeControllers = new WeakMap();
const rendererCloseListeners = new WeakSet();
let isQuitting = false;
const recoverRenderer = createRendererRecoveryHandler({
  dialog,
  isShuttingDown: () => isQuitting,
  beforeClose: win => closeControllers.get(win)?.approve(),
});

function markRendererCloseUnavailable(win) {
  if (!win) return;
  rendererCloseListeners.delete(win);
  closeControllers.get(win)?.rendererUnavailable();
}

function userFile(name) {
  return path.join(app.getPath('userData'), name);
}

function isCabinetFile(filePath) {
  return typeof filePath === 'string' && /\.json$/i.test(filePath);
}

async function readJsonFile(filePath) {
  const stat = await fs.stat(filePath);
  if (!stat.isFile() || stat.size > MAX_DOCUMENT_BYTES) {
    throw new Error('Cabinet document is too large or is not a regular file.');
  }
  return fs.readFile(filePath, 'utf8');
}

async function readRecent() {
  try {
    const parsed = JSON.parse(await fs.readFile(userFile('recent-projects.json'), 'utf8'));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(item => item && typeof item.path === 'string' && typeof item.name === 'string')
      .filter(item => fsSync.existsSync(item.path))
      .slice(0, 10);
  } catch {
    return [];
  }
}

async function writeRecent(items) {
  await fs.mkdir(app.getPath('userData'), { recursive: true });
  await fs.writeFile(userFile('recent-projects.json'), JSON.stringify(items.slice(0, 10), null, 2), 'utf8');
}

async function addRecent(filePath) {
  const existing = await readRecent();
  const next = [
    { path: filePath, name: path.basename(filePath), updatedAt: Date.now() },
    ...existing.filter(item => item.path !== filePath),
  ].slice(0, 10);
  await writeRecent(next);
  approvedPaths.add(filePath);
  return next;
}

async function atomicWrite(filePath, content) {
  if (typeof content !== 'string' || Buffer.byteLength(content, 'utf8') > MAX_DOCUMENT_BYTES) {
    throw new Error('Cabinet document is too large.');
  }
  await atomicWriteText(filePath, content);
}

function registerIpc() {
  ipcMain.handle('app:info', async () => ({
    name: 'Cabinet WS Standalone',
    version: app.getVersion(),
    platform: process.platform,
    electron: process.versions.electron,
    chromium: process.versions.chrome,
    isPackaged: app.isPackaged,
  }));

  ipcMain.on('app:close-listener-state', (event, ready) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isDestroyed()) return;

    if (ready === true) {
      rendererCloseListeners.add(win);
      return;
    }

    markRendererCloseUnavailable(win);
  });

  ipcMain.handle('app:confirm-close', async (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const documentName = typeof options?.documentName === 'string' && options.documentName.trim()
      ? options.documentName.trim()
      : 'Untitled cabinet';
    const prompt = {
      type: 'warning',
      title: 'Unsaved cabinet changes',
      message: 'Save changes before closing?',
      detail: `${documentName} has unsaved changes. Save them, discard them, or cancel closing.`,
      buttons: ['Save', 'Discard', 'Cancel'],
      defaultId: 0,
      cancelId: 2,
      noLink: true,
    };
    const result = win
      ? await dialog.showMessageBox(win, prompt)
      : await dialog.showMessageBox(prompt);
    if (result.response === 0) return 'save';
    if (result.response === 1) return 'discard';
    return 'cancel';
  });

  ipcMain.handle('app:resolve-close', async (event, resolution) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const controller = win ? closeControllers.get(win) : null;
    if (!win || !controller || win.isDestroyed()) return false;

    if (resolution === 'approve') {
      controller.approve();
      win.close();
      return true;
    }

    controller.cancel();
    return false;
  });

  ipcMain.handle('document:open', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Open Cabinet WS project',
      properties: ['openFile'],
      filters: [
        { name: 'Cabinet WS projects', extensions: ['json'] },
      ],
    });
    if (result.canceled || !result.filePaths[0]) return null;

    const filePath = result.filePaths[0];
    const content = await readJsonFile(filePath);
    await addRecent(filePath);
    return { path: filePath, name: path.basename(filePath), content };
  });

  ipcMain.handle('document:open-recent', async (_event, filePath) => {
    const recent = await readRecent();
    if (!recent.some(item => item.path === filePath) || !isCabinetFile(filePath)) {
      throw new Error('That recent project is no longer available.');
    }
    const content = await readJsonFile(filePath);
    await addRecent(filePath);
    return { path: filePath, name: path.basename(filePath), content };
  });

  ipcMain.handle('document:save', async (_event, options) => {
    const content = options?.content;
    const requestedPath = typeof options?.path === 'string' ? options.path : null;
    const saveAs = Boolean(options?.saveAs);
    let filePath = !saveAs && requestedPath && approvedPaths.has(requestedPath)
      ? requestedPath
      : null;

    if (!filePath) {
      const result = await dialog.showSaveDialog({
        title: 'Save Cabinet WS project',
        defaultPath: String(options?.suggestedName || 'cabinet.cabinetws.json'),
        filters: [
          { name: 'Cabinet WS projects', extensions: ['json'] },
        ],
      });
      if (result.canceled || !result.filePath) return { canceled: true };
      filePath = result.filePath;
      if (!/\.json$/i.test(filePath)) filePath += '.cabinetws.json';
    }

    await atomicWrite(filePath, content);
    await addRecent(filePath);
    return { canceled: false, path: filePath, name: path.basename(filePath) };
  });

  ipcMain.handle('export:step', async (_event, options) => {
    const bytes = options?.bytes;
    const buffer = bytes instanceof ArrayBuffer
      ? Buffer.from(bytes)
      : ArrayBuffer.isView(bytes)
        ? Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
        : null;
    if (!buffer || buffer.byteLength <= 0 || buffer.byteLength > MAX_STEP_BYTES) {
      throw new Error('STEP export is empty or too large.');
    }

    const result = await dialog.showSaveDialog({
      title: 'Export STEP assembly',
      defaultPath: String(options?.suggestedName || 'cabinet.step'),
      filters: [
        { name: 'STEP CAD assembly', extensions: ['step', 'stp'] },
      ],
    });
    if (result.canceled || !result.filePath) return { canceled: true };

    let filePath = result.filePath;
    if (!/\.(step|stp)$/i.test(filePath)) filePath += '.step';
    await fs.writeFile(filePath, buffer);
    return { canceled: false, path: filePath, name: path.basename(filePath) };
  });

  ipcMain.handle('export:text', async (_event, options) => {
    const content = typeof options?.content === 'string' ? options.content : '';
    if (!content || Buffer.byteLength(content, 'utf8') > MAX_TEXT_EXPORT_BYTES) {
      throw new Error('Text export is empty or too large.');
    }
    const kinds = {
      csv: { title: 'Export CSV report', extension: '.csv', filter: { name: 'CSV spreadsheet', extensions: ['csv'] } },
      html: { title: 'Export printable report', extension: '.html', filter: { name: 'Printable HTML report', extensions: ['html'] } },
      dxf: { title: 'Export DXF manufacturing geometry', extension: '.dxf', filter: { name: 'DXF manufacturing geometry', extensions: ['dxf'] } },
      svg: { title: 'Export SVG manufacturing preview', extension: '.svg', filter: { name: 'SVG manufacturing geometry', extensions: ['svg'] } },
      json: { title: 'Export manufacturing metadata', extension: '.json', filter: { name: 'JSON metadata', extensions: ['json'] } },
    };
    const kind = Object.prototype.hasOwnProperty.call(kinds, options?.kind) ? options.kind : 'html';
    const config = kinds[kind];
    const suggestedName = String(options?.suggestedName || ('cabinet' + config.extension));
    const result = await dialog.showSaveDialog({
      title: config.title,
      defaultPath: suggestedName,
      filters: [config.filter],
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    let filePath = result.filePath;
    if (!filePath.toLowerCase().endsWith(config.extension)) filePath += config.extension;
    await fs.writeFile(filePath, content, 'utf8');
    return { canceled: false, path: filePath, name: path.basename(filePath) };
  });

  ipcMain.handle('export:binary', async (_event, options) => {
    const bytes = options?.bytes;
    const buffer = bytes instanceof ArrayBuffer
      ? Buffer.from(bytes)
      : ArrayBuffer.isView(bytes)
        ? Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
        : null;
    if (!buffer || buffer.byteLength <= 0 || buffer.byteLength > MAX_BINARY_EXPORT_BYTES) {
      throw new Error('Binary export is empty or too large.');
    }

    const kind = options?.kind === 'zip' ? 'zip' : null;
    if (!kind) throw new Error('Unsupported binary export kind.');
    const result = await dialog.showSaveDialog({
      title: 'Export reviewed manufacturing package',
      defaultPath: String(options?.suggestedName || 'cabinet-manufacturing.zip'),
      filters: [{ name: 'ZIP manufacturing package', extensions: ['zip'] }],
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    let filePath = result.filePath;
    if (!filePath.toLowerCase().endsWith('.zip')) filePath += '.zip';
    await fs.writeFile(filePath, buffer);
    return { canceled: false, path: filePath, name: path.basename(filePath) };
  });

  ipcMain.handle('recent:list', async () => readRecent());

  ipcMain.handle('recovery:read', async () => {
    const filePath = userFile('recovery.cabinetws.json');
    try {
      const stat = await fs.stat(filePath);
      if (stat.size > MAX_DOCUMENT_BYTES) return null;
      return { content: await fs.readFile(filePath, 'utf8'), updatedAt: stat.mtimeMs };
    } catch {
      return null;
    }
  });

  ipcMain.handle('recovery:write', async (_event, content) => {
    await atomicWrite(userFile('recovery.cabinetws.json'), content);
  });

  ipcMain.handle('recovery:clear', async () => {
    await clearAtomicText(userFile('recovery.cabinetws.json'));
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1500,
    height: 940,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#171a1d',
    title: 'Cabinet WS Standalone',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    const devUrl = process.env.VITE_DEV_SERVER_URL;
    if ((devUrl && url.startsWith(devUrl)) || url.startsWith('file:')) return;
    event.preventDefault();
    if (url.startsWith('https://')) shell.openExternal(url);
  });

  const closeController = createWindowCloseController({
    requestClose: () => {
      if (!win.isDestroyed()) win.webContents.send('app:close-requested');
    },
    canRequestClose: () => rendererCloseListeners.has(win),
    onCancel: () => {
      isQuitting = false;
    },
  });
  closeControllers.set(win, closeController);

  win.on('close', event => {
    try {
      closeController.handleClose(event);
    } catch (error) {
      console.error('Could not request a safe Cabinet WS close.', error);
    }
  });
  win.on('closed', () => {
    rendererCloseListeners.delete(win);
    closeControllers.delete(win);
  });

  win.webContents.on('did-start-loading', () => {
    markRendererCloseUnavailable(win);
  });
  win.webContents.on('render-process-gone', (_event, details) => {
    markRendererCloseUnavailable(win);
    void recoverRenderer(win, details);
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) win.loadURL(devUrl);
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.on('before-quit', () => {
  isQuitting = true;
});

app.whenReady().then(() => {
  registerIpc();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
