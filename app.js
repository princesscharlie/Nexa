const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nexaDesktop', {
  platform: process.platform,
  version: process.versions.electron,
  isElectron: true,
  openFileDialog: (options = {}) => ipcRenderer.invoke('dialog:open-file', options),
  saveFileDialog: (options = {}) => ipcRenderer.invoke('dialog:save-file', options),
  readFile: (filePath) => ipcRenderer.invoke('fs:read-file', filePath),
  writeFile: ({ filePath, content }) => ipcRenderer.invoke('fs:write-file', { filePath, content }),
  onAppEvent: (eventName, handler) => {
    ipcRenderer.on(eventName, (_event, value) => handler(value));
  }
});
