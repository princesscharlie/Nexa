# Nexa

Nexa is a lightweight, keyboard-friendly rich document editor foundation. It runs in any modern browser and is structured so the document model and desktop shell can be expanded without putting application logic into a single UI component.

## Current capabilities

- Paginated A4-style writing canvas with ruler, zoom and status bar
- Rich editing through a contenteditable document model: headings, quote, font, size, bold, italic, underline, strike-through, colors, alignment, lists and indentation
- Tables, images, hyperlinks and page breaks
- New/open/save native `.nexa` JSON documents, plain-text export and HTML import
- Autosave state in local storage, unsaved-change warning, undo/redo and common keyboard shortcuts
- Navigation pane with live heading index, word/character counts and print command
- Light/dark appearance with system-friendly typography and responsive layout

## Running locally

Open `index.html` in a modern browser, or serve the repository with any static file server. No build step is required.

## Architecture direction

The current repository was empty apart from its README, so Nexa starts with a dependency-free shell that is easy to run and audit. The next production steps should introduce a typed document model and adapter layer for DOCX/ODT conversion, then move the shell into a Windows desktop host (WebView2/Tauri/Electron) once the conversion and pagination engines are selected. The UI intentionally does not expose unsupported DOCX/ODT controls or non-functional placeholder buttons.
