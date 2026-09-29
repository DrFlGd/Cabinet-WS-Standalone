const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cabinetDesktop', {
  platform: process.platform,
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
