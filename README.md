# Nexa

Nexa is now a Windows desktop application shell built with Electron, using the editor UI and document workflow that were already built into the repository.

## What changed

- Added a real desktop app entry point (`main.js`)
- Added Electron package configuration (`package.json`)
- Added a secure preload bridge (`preload.js`)
- Kept the polished rich-text editor interface and local document features

## Run it on Windows

1. Install Node.js 20+ if it is not already installed.
2. In the project folder run:

```bash
npm install
npm start
```

## Build a Windows installer

```bash
npm run dist
```

This produces a Windows installer using `electron-builder`.

## Current status

This version is the desktop-app foundation for Nexa. It gives the editor a proper Windows presence and desktop packaging, while keeping the existing browser-based editing logic intact.

The next production phases would be:

- real DOCX/ODT parsing and export
- file picker integration for native OS dialogs
- Windows menu/toolbar polish
- installer branding and app icon
- native print settings and window controls
- deeper document model separation for production-grade editing
