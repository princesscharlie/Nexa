const editor = document.querySelector('#editor');
const state = { title: 'Untitled document', zoom: 1, dirty: false, theme: localStorage.getItem('nexa-theme') || 'light', currentPath: null };
const $ = (s) => document.querySelector(s);
const desktop = window.nexaDesktop;

function markDirty() { state.dirty = true; $('#saved-state').textContent = 'Unsaved changes'; updateCounts(); updateHeadings(); }
function exec(command, value = null) { editor.focus(); document.execCommand(command, false, value); markDirty(); }
function updateCounts() { const text = editor.innerText.trim(); const words = text ? text.split(/\s+/).length : 0; $('#word-count').textContent = `${words.toLocaleString()} words`; $('#char-count').textContent = `${text.length.toLocaleString()} characters`; $('#page-count').textContent = `Page ${Math.max(1, Math.ceil(text.length / 2200))} of ${Math.max(1, Math.ceil(text.length / 2200))}`; }
function updateHeadings() { const target = $('#headings'); const headings = [...editor.querySelectorAll('h1,h2,h3')]; target.innerHTML = headings.length ? '' : '<p class="muted">Headings will appear here</p>'; headings.forEach((heading, index) => { heading.id = `heading-${index}`; const button = document.createElement('button'); button.textContent = heading.textContent || 'Untitled heading'; button.style.paddingLeft = `${8 + (Number(heading.tagName[1]) - 1) * 12}px`; button.onclick = () => heading.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.append(button); }); }

async function saveDocument() {
  const payload = { version: 1, title: state.title, html: editor.innerHTML, savedAt: new Date().toISOString() };
  const content = JSON.stringify(payload, null, 2);

  try {
    if (desktop && desktop.isElectron) {
      const filePath = state.currentPath || await desktop.saveFileDialog({ defaultPath: `${state.title || 'Untitled document'}.nexa` });
      if (!filePath) return;
      state.currentPath = filePath;
      await desktop.writeFile({ filePath, content });
      localStorage.setItem('nexa-autosave', JSON.stringify(payload));
      state.dirty = false;
      $('#saved-state').textContent = 'Saved';
      $('#document-title').textContent = state.title;
      return;
    }

    const blob = new Blob([content], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${state.title || 'Untitled document'}.nexa`;
    link.click();
    URL.revokeObjectURL(link.href);
    localStorage.setItem('nexa-autosave', JSON.stringify(payload));
    state.dirty = false;
    $('#saved-state').textContent = 'Saved';
  } catch (err) {
    alert('Nexa could not save the file. Please try again.');
  }
}

async function openDocument(filePath) {
  try {
    const fileContent = filePath ? await desktop.readFile(filePath) : null;
    if (!fileContent) return;

    const data = JSON.parse(fileContent);
    state.title = data.title || 'Untitled document';
    state.currentPath = filePath;
    editor.innerHTML = data.html || '<p><br></p>';
    $('#document-title').textContent = state.title;
    state.dirty = false;
    $('#saved-state').textContent = 'Saved';
    updateCounts();
    updateHeadings();
  } catch {
    alert('Nexa could not open this file. The document may be invalid or corrupted.');
  }
}

function exportText() {
  if (desktop && desktop.isElectron) {
    const content = editor.innerText;
    const fileName = `${state.title || 'Untitled document'}.txt`;
    desktop.saveFileDialog({ defaultPath: fileName, filters: [{ name: 'Text files', extensions: ['txt'] }] }).then((filePath) => {
      if (!filePath) return;
      desktop.writeFile({ filePath, content }).catch(() => alert('Export failed.'));
    });
    return;
  }

  const blob = new Blob([editor.innerText], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${state.title || 'Untitled document'}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value; return div.innerHTML; }
function insertTable() { const rows = Number(prompt('Number of rows', '3')); const cols = Number(prompt('Number of columns', '3')); if (!rows || !cols || rows > 20 || cols > 12) return; let html = '<table><tbody>'; for (let r = 0; r < rows; r++) { html += '<tr>'; for (let c = 0; c < cols; c++) html += '<td><br></td>'; html += '</tr>'; } editor.focus(); document.execCommand('insertHTML', false, html + '</tbody></table><p><br></p>'); markDirty(); }
function insertLink() { const url = prompt('Enter a website or email address'); if (url) exec('createLink', /^https?:\/\//.test(url) || url.startsWith('mailto:') ? url : `https://${url}`); }
function applyStyle(tag) { exec('formatBlock', tag === 'p' ? 'p' : tag); }
function showMenu(name, anchor) { const menu = $('#menu-popover'); const items = { file:[['New document','new'],['Open…','open','Ctrl+O'],['Save document','save','Ctrl+S'],['Export text…','export'],['Print','print','Ctrl+P']], edit:[['Undo','undo','Ctrl+Z'],['Redo','redo','Ctrl+Y'],['Find','find','Ctrl+F'],['Replace','replace','Ctrl+H']], view:[['Navigation pane','sidebar'],['Zoom in','zoomIn'],['Zoom out','zoomOut'],['Reset zoom','zoomReset']], insert:[['Page break','pagebreak'],['Table…','table'],['Image…','image'],['Hyperlink…','link']], format:[['Bold','bold','Ctrl+B'],['Italic','italic','Ctrl+I'],['Underline','underline','Ctrl+U'],['Clear formatting','clear']], tools:[['Word count','count']] }; menu.innerHTML = (items[name] || []).map(([label, action, key]) => `<button data-action="${action}">${label}<kbd>${key || ''}</kbd></button>`).join(''); menu.hidden = false; const rect = anchor.getBoundingClientRect(); menu.style.left = `${rect.left}px`; menu.style.top = `${rect.bottom + 4}px`; }
function action(action) { const actions = { new: () => { if (state.dirty && !confirm('Discard unsaved changes?')) return; state.title = 'Untitled document'; state.currentPath = null; editor.innerHTML = '<h1>Untitled document</h1><p><br></p>'; $('#document-title').textContent = state.title; state.dirty = false; $('#saved-state').textContent = 'Saved'; }, open: async () => { if (desktop && desktop.isElectron) { const filePath = await desktop.openFileDialog(); if (filePath) await openDocument(filePath); return; } $('#open-input').click(); }, save: saveDocument, export: exportText, print: () => window.print(), undo: () => exec('undo'), redo: () => exec('redo'), find: () => findText(), replace: () => replaceText(), sidebar: () => $('#sidebar').toggleAttribute('hidden'), zoomIn: () => setZoom(state.zoom + .1), zoomOut: () => setZoom(state.zoom - .1), zoomReset: () => setZoom(1), pagebreak: () => exec('insertHTML', '<div style="break-after:page;height:1px"></div>'), table: insertTable, image: () => $('#image-input').click(), link: insertLink, bold: () => exec('bold'), italic: () => exec('italic'), underline: () => exec('underline'), clear: () => exec('removeFormat'), count: () => alert(`${$('#word-count').textContent}\n${$('#char-count').textContent}`) }; if (actions[action]) actions[action](); $('#menu-popover').hidden = true; updateCounts(); updateHeadings(); }
function findText() { const query = prompt('Find text'); if (!query) return; const found = window.find(query); if (!found) alert('No matches found.'); }
function replaceText() { const from = prompt('Find text'); if (!from) return; const to = prompt('Replace with', ''); if (to === null) return; editor.innerHTML = editor.innerHTML.split(from).join(escapeHtml(to)); markDirty(); }
function setZoom(value) { state.zoom = Math.min(1.5, Math.max(.6, value)); $('.page').style.transform = `scale(${state.zoom})`; $('#zoom-level').textContent = `${Math.round(state.zoom * 100)}%`; }

$$('[data-command]').forEach((b) => b.onclick = () => exec(b.dataset.command));
function $$(s) { return [...document.querySelectorAll(s)]; }
$$('[data-menu]').forEach((b) => b.onclick = () => showMenu(b.dataset.menu, b));
$('#menu-popover').onclick = (e) => { const b = e.target.closest('[data-action]'); if (b) action(b.dataset.action); };
$('#style-select').onchange = (e) => applyStyle(e.target.value);
$('#font-select').onchange = (e) => exec('fontName', e.target.value);
$('#size-select').onchange = (e) => exec('fontSize', Math.min(7, Math.max(1, Math.round(Number(e.target.value) / 3))));
$('#insert-table').onclick = insertTable;
$('#insert-link').onclick = insertLink;
$('#insert-image').onclick = () => $('#image-input').click();
$('#image-input').onchange = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { exec('insertImage', reader.result); markDirty(); }; reader.readAsDataURL(file); };
$('#open-input').onchange = (e) => { if (e.target.files[0]) openDocument(e.target.files[0]); };
$('#undo').onclick = () => exec('undo');
$('#redo').onclick = () => exec('redo');
$('#zoom-in').onclick = () => setZoom(state.zoom + .1);
$('#zoom-out').onclick = () => setZoom(state.zoom - .1);
$('#close-sidebar').onclick = () => $('#sidebar').setAttribute('hidden', '');
$('#theme-toggle').onclick = () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; document.body.classList.toggle('dark', state.theme === 'dark'); localStorage.setItem('nexa-theme', state.theme); };
$('#help-button').onclick = () => alert('Shortcuts: Ctrl+N new, Ctrl+O open, Ctrl+S save, Ctrl+F find, Ctrl+H replace, Ctrl+B bold, Ctrl+I italic, Ctrl+Z undo.');
editor.addEventListener('input', markDirty);
editor.addEventListener('keyup', updateCounts);
document.addEventListener('click', (e) => { if (!e.target.closest('.menu-bar') && !e.target.closest('.menu-popover')) $('#menu-popover').hidden = true; });
document.addEventListener('keydown', (e) => { if (!(e.ctrlKey || e.metaKey)) return; const key = e.key.toLowerCase(); if (key === 's') { e.preventDefault(); saveDocument(); } if (key === 'o') { e.preventDefault(); action('open'); } if (key === 'n') { e.preventDefault(); action('new'); } if (key === 'f') { e.preventDefault(); findText(); } if (key === 'h') { e.preventDefault(); replaceText(); } if (key === 'p') { e.preventDefault(); window.print(); } });
window.addEventListener('beforeunload', (e) => { if (state.dirty) { e.preventDefault(); e.returnValue = ''; } });

if (desktop && desktop.isElectron) {
  const emit = (name) => app.emit(name);
  // The app shell already emits OS-level actions through the Electron menu.
  // The renderer subscribes to those events through the global window object for fallback wiring.
  window.nexaDesktop.onAppEvent = window.nexaDesktop.onAppEvent || (() => {});
  window.addEventListener('nexa:new-document', () => action('new'));
  window.addEventListener('nexa:open-document', () => action('open'));
  window.addEventListener('nexa:save-document', () => saveDocument());
  window.addEventListener('nexa:save-document-as', () => { state.currentPath = null; saveDocument(); });
  window.addEventListener('nexa:export-text', () => exportText());
  window.addEventListener('nexa:print-document', () => window.print());
  window.addEventListener('nexa:zoom-in', () => setZoom(state.zoom + .1));
  window.addEventListener('nexa:zoom-out', () => setZoom(state.zoom - .1));
  window.addEventListener('nexa:zoom-reset', () => setZoom(1));
  window.addEventListener('nexa:toggle-sidebar', () => $('#sidebar').toggleAttribute('hidden'));
  window.addEventListener('nexa:insert-table', () => insertTable());
  window.addEventListener('nexa:insert-image', () => $('#image-input').click());
  window.addEventListener('nexa:insert-link', () => insertLink());
  window.addEventListener('nexa:insert-pagebreak', () => exec('insertHTML', '<div style="break-after:page;height:1px"></div>'));
  window.addEventListener('nexa:format-bold', () => exec('bold'));
  window.addEventListener('nexa:format-italic', () => exec('italic'));
  window.addEventListener('nexa:format-underline', () => exec('underline'));
}

document.body.classList.toggle('dark', state.theme === 'dark');
updateCounts();
updateHeadings();
