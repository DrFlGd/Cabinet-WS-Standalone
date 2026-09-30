const { contextBridge, ipcRenderer } = require('electron');

let closeRequestedListener = null;

contextBridge.exposeInMainWorld('cabinetDesktop', {
  platform: process.platform,
  getAppInfo: () => ipcRenderer.invoke('app:info'),
  confirmClose: (options) => ipcRenderer.invoke('app:confirm-close', options),
  resolveClose: (resolution) => ipcRenderer.invoke('app:resolve-close', resolution),
  onCloseRequested: (callback) => {
    if (closeRequestedListener) {
      ipcRenderer.removeListener('app:close-requested', closeRequestedListener);
    }
    closeRequestedListener = () => callback();
    ipcRenderer.on('app:close-requested', closeRequestedListener);
  },
  offCloseRequested: () => {
    if (!closeRequestedListener) return;
    ipcRenderer.removeListener('app:close-requested', closeRequestedListener);
    closeRequestedListener = null;
  },
  openDocument: () => ipcRenderer.invoke('document:open'),
  openRecent: (path) => ipcRenderer.invoke('document:open-recent', path),
  saveDocument: (options) => ipcRenderer.invoke('document:save', options),
  saveStep: (options) => ipcRenderer.invoke('export:step', options),
  saveText: (options) => ipcRenderer.invoke('export:text', options),
  saveBinary: (options) => ipcRenderer.invoke('export:binary', options),
  listRecent: () => ipcRenderer.invoke('recent:list'),
  readRecovery: () => ipcRenderer.invoke('recovery:read'),
  writeRecovery: (content) => ipcRenderer.invoke('recovery:write', content),
  clearRecovery: () => ipcRenderer.invoke('recovery:clear'),
});
