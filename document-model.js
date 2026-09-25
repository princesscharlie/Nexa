const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nexaDesktop', {
  platform: process.platform,
  version: process.versions.electron,
  isElectron: true,
  openFileDialog: () => ipcRenderer.invoke('app:open-file'),
  saveFileDialog: (options = {}) => ipcRenderer.invoke('app:save-file', options),
  readFile: (filePath) => ipcRenderer.invoke('fs:read-file', filePath),
  writeFile: ({ filePath, content }) => ipcRenderer.invoke('fs:write-file', { filePath, content }),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  onAppMenuAction: (handler) => {
    ipcRenderer.on('app-menu-action', (_event, action) => handler(action));
  }
});
