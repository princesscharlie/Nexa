const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New', accelerator: 'Ctrl+N', click: () => app.emit('nexa:new-document') },
        { label: 'Open…', accelerator: 'Ctrl+O', click: () => app.emit('nexa:open-document') },
        { label: 'Save', accelerator: 'Ctrl+S', click: () => app.emit('nexa:save-document') },
        { label: 'Save As…', click: () => app.emit('nexa:save-document-as') },
        { type: 'separator' },
        { label: 'Export TXT…', click: () => app.emit('nexa:export-text') },
        { type: 'separator' },
        { label: 'Print…', accelerator: 'Ctrl+P', click: () => app.emit('nexa:print-document') },
        { type: 'separator' },
        { label: 'Quit', role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Ctrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Ctrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', role: 'cut' },
        { label: 'Copy', role: 'copy' },
        { label: 'Paste', role: 'paste' },
        { label: 'Select All', accelerator: 'Ctrl+A', role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Zoom In', click: () => app.emit('nexa:zoom-in') },
        { label: 'Zoom Out', click: () => app.emit('nexa:zoom-out') },
        { label: 'Reset Zoom', click: () => app.emit('nexa:zoom-reset') },
        { type: 'separator' },
        { label: 'Toggle Navigation', click: () => app.emit('nexa:toggle-sidebar') }
      ]
    },
    {
      label: 'Insert',
      submenu: [
        { label: 'Table…', click: () => app.emit('nexa:insert-table') },
        { label: 'Image…', click: () => app.emit('nexa:insert-image') },
        { label: 'Hyperlink…', click: () => app.emit('nexa:insert-link') },
        { label: 'Page Break', click: () => app.emit('nexa:insert-pagebreak') }
      ]
    },
    {
      label: 'Format',
      submenu: [
        { label: 'Bold', accelerator: 'Ctrl+B', click: () => app.emit('nexa:format-bold') },
        { label: 'Italic', accelerator: 'Ctrl+I', click: () => app.emit('nexa:format-italic') },
        { label: 'Underline', accelerator: 'Ctrl+U', click: () => app.emit('nexa:format-underline') }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#f5f6f8',
    titleBarStyle: 'hiddenInset',
    autoHideMenuBar: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));

  if (process.argv.includes('--dev')) {
    win.webContents.openDevTools();
  }

  win.once('ready-to-show', () => win.show());
  return win;
}

ipcMain.handle('dialog:open-file', async (_event, options = {}) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Nexa documents', extensions: ['nexa', 'txt', 'html', 'htm'] }],
    ...options
  });

  if (result.canceled) return null;
  return result.filePaths[0] || null;
});

ipcMain.handle('dialog:save-file', async (_event, options = {}) => {
  const result = await dialog.showSaveDialog({
    title: 'Save document',
    defaultPath: options.defaultPath || 'Untitled.nexa',
    filters: [{ name: 'Nexa document', extensions: ['nexa'] }],
    ...options
  });

  if (result.canceled) return null;
  return result.filePath || null;
});

ipcMain.handle('fs:read-file', async (_event, filePath) => {
  if (!filePath) return null;
  return fs.readFileSync(filePath, 'utf8');
});

ipcMain.handle('fs:write-file', async (_event, { filePath, content }) => {
  if (!filePath) return false;
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
});

app.whenReady().then(() => {
  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
