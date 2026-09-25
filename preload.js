const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow = null;

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New', accelerator: 'Ctrl+N', click: () => broadcastMenuAction('new') },
        { label: 'Open…', accelerator: 'Ctrl+O', click: () => broadcastMenuAction('open') },
        { label: 'Save', accelerator: 'Ctrl+S', click: () => broadcastMenuAction('save') },
        { label: 'Save As…', click: () => broadcastMenuAction('save-as') },
        { type: 'separator' },
        { label: 'Export TXT…', click: () => broadcastMenuAction('export-text') },
        { type: 'separator' },
        { label: 'Print…', accelerator: 'Ctrl+P', click: () => broadcastMenuAction('print') },
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
        { label: 'Zoom In', click: () => broadcastMenuAction('zoom-in') },
        { label: 'Zoom Out', click: () => broadcastMenuAction('zoom-out') },
        { label: 'Reset Zoom', click: () => broadcastMenuAction('zoom-reset') },
        { type: 'separator' },
        { label: 'Toggle Navigation', click: () => broadcastMenuAction('toggle-sidebar') }
      ]
    },
    {
      label: 'Insert',
      submenu: [
        { label: 'Table…', click: () => broadcastMenuAction('insert-table') },
        { label: 'Image…', click: () => broadcastMenuAction('insert-image') },
        { label: 'Hyperlink…', click: () => broadcastMenuAction('insert-link') },
        { label: 'Page Break', click: () => broadcastMenuAction('insert-pagebreak') }
      ]
    },
    {
      label: 'Format',
      submenu: [
        { label: 'Bold', accelerator: 'Ctrl+B', click: () => broadcastMenuAction('format-bold') },
        { label: 'Italic', accelerator: 'Ctrl+I', click: () => broadcastMenuAction('format-italic') },
        { label: 'Underline', accelerator: 'Ctrl+U', click: () => broadcastMenuAction('format-underline') }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function broadcastMenuAction(action) {
  if (mainWindow) {
    mainWindow.webContents.send('app-menu-action', action);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#f5f6f8',
    titleBarStyle: 'hiddenInset',
    autoHideMenuBar: false,
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

ipcMain.handle('app:open-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Nexa documents', extensions: ['nexa', 'txt', 'html', 'htm'] }]
  });

  if (result.canceled) return null;
  return result.filePaths[0] || null;
});

ipcMain.handle('app:save-file', async (_event, options = {}) => {
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

ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close();
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
