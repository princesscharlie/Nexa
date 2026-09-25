const editor = document.querySelector('#editor');
const state = {
  title: 'Untitled document',
  zoom: 1,
  dirty: false,
  theme: localStorage.getItem('nexa-theme') || 'light',
  currentPath: null,
  documentModel: window.NexaDocumentModel || null
};

const $ = (s) => document.querySelector(s);
const desktop = window.nexaDesktop || null;

function getModel() {
  return state.documentModel || window.NexaDocumentModel;
}

function markDirty() {
  state.dirty = true;
  $('#saved-state').textContent = 'Unsaved changes';
  updateCounts();
  updateHeadings();
}

function exec(command, value = null) {
  editor.focus();
  document.execCommand(command, false, value);
  markDirty();
}

function updateCounts() {
  const model = getModel();
  const rawHtml = editor.innerHTML || '';
  const stats = model ? model.getDocumentStats(rawHtml) : { words: 0, characters: 0, paragraphs: 1, pages: 1 };
  const words = stats.words || 0;
  const characters = stats.characters || 0;

  $('#word-count').textContent = `${words.toLocaleString()} words`;
  $('#char-count').textContent = `${characters.toLocaleString()} characters`;
  $('#page-count').textContent = `Page 1 of ${Math.max(1, stats.pages || 1)}`;
}

function updateHeadings() {
  const target = $('#headings');
  const headings = [...editor.querySelectorAll('h1,h2,h3')];
  target.innerHTML = headings.length ? '' : '<p class="muted">Headings will appear here</p>';

  headings.forEach((heading, index) => {
    heading.id = `heading-${index}`;
    const button = document.createElement('button');
    button.textContent = heading.textContent || 'Untitled heading';
    button.style.paddingLeft = `${8 + (Number(heading.tagName[1]) - 1) * 12}px`;
    button.onclick = () => heading.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.append(button);
  });
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

async function saveDocument() {
  const model = getModel();
  const payload = {
    version: 1,
    title: state.title,
    html: editor.innerHTML,
    savedAt: new Date().toISOString(),
    currentPath: state.currentPath
  };

  const content = model ? model.serializeDocument(payload) : JSON.stringify(payload, null, 2);

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
  } catch {
    alert('Nexa could not save the file. Please try again.');
  }
}

async function openDocument(filePath, rawSource = null) {
  try {
    let fileContent = rawSource;

    if (desktop && desktop.isElectron && !rawSource && filePath) {
      fileContent = await desktop.readFile(filePath);
    }

    if (!fileContent && filePath) {
      const response = await fetch(filePath);
      fileContent = await response.text();
    }

    const model = getModel();
    const doc = model ? model.deserializeDocument(fileContent) : { title: 'Untitled document', html: editor.innerHTML };
    state.title = doc.title || 'Untitled document';
    state.currentPath = filePath || doc.currentPath || null;
    editor.innerHTML = doc.html || '<p><br></p>';
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
  const content = editor.innerText;

  if (desktop && desktop.isElectron) {
    desktop.saveFileDialog({ defaultPath: `${state.title || 'Untitled document'}.txt`, filters: [{ name: 'Text documents', extensions: ['txt'] }] }).then((filePath) => {
      if (!filePath) return;
      desktop.writeFile({ filePath, content }).catch(() => alert('Export failed.'));
    });
    return;
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${state.title || 'Untitled document'}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function insertTable() {
  const rows = Number(prompt('Number of rows', '3'));
  const cols = Number(prompt('Number of columns', '3'));
  if (!rows || !cols || rows > 20 || cols > 12) return;

  let html = '<table><tbody>';
  for (let r = 0; r < rows; r++) {
    html += '<tr>';
    for (let c = 0; c < cols; c++) html += '<td><br></td>';
    html += '</tr>';
  }
  editor.focus();
  document.execCommand('insertHTML', false, html + '</tbody></table><p><br></p>');
  markDirty();
}

function insertLink() {
  const url = prompt('Enter a website or email address');
  if (url) exec('createLink', /^https?:\/\//.test(url) || url.startsWith('mailto:') ? url : `https://${url}`);
}

function applyStyle(tag) {
  exec('formatBlock', tag === 'p' ? 'p' : tag);
}

function showMenu(name, anchor) {
  const menu = $('#menu-popover');
  const items = {
    file: [['New document', 'new'], ['Open…', 'open', 'Ctrl+O'], ['Save document', 'save', 'Ctrl+S'], ['Export text…', 'export'], ['Print', 'print', 'Ctrl+P']],
    edit: [['Undo', 'undo', 'Ctrl+Z'], ['Redo', 'redo', 'Ctrl+Y'], ['Find', 'find', 'Ctrl+F'], ['Replace', 'replace', 'Ctrl+H']],
    view: [['Navigation pane', 'sidebar'], ['Zoom in', 'zoomIn'], ['Zoom out', 'zoomOut'], ['Reset zoom', 'zoomReset']],
    insert: [['Page break', 'pagebreak'], ['Table…', 'table'], ['Image…', 'image'], ['Hyperlink…', 'link']],
    format: [['Bold', 'bold', 'Ctrl+B'], ['Italic', 'italic', 'Ctrl+I'], ['Underline', 'underline', 'Ctrl+U'], ['Clear formatting', 'clear']],
    tools: [['Word count', 'count']]
  };

  menu.innerHTML = (items[name] || []).map(([label, action, key]) => `<button data-action="${action}">${label}<kbd>${key || ''}</kbd></button>`).join('');
  menu.hidden = false;
  const rect = anchor.getBoundingClientRect();
  menu.style.left = `${rect.left}px`;
  menu.style.top = `${rect.bottom + 4}px`;
}

function handleMenuAction(action) {
  if (action === 'new') {
    if (state.dirty && !confirm('Discard unsaved changes?')) return;
    state.title = 'Untitled document';
    state.currentPath = null;
    editor.innerHTML = '<h1>Untitled document</h1><p><br></p>';
    $('#document-title').textContent = state.title;
    state.dirty = false;
    $('#saved-state').textContent = 'Saved';
    return;
  }

  if (action === 'open') {
    if (desktop && desktop.isElectron) {
      desktop.openFileDialog().then((filePath) => {
        if (filePath) openDocument(filePath);
      });
      return;
    }

    $('#open-input').click();
    return;
  }

  if (action === 'save') return saveDocument();
  if (action === 'save-as') { state.currentPath = null; return saveDocument(); }
  if (action === 'export-text') return exportText();
  if (action === 'print') return window.print();
  if (action === 'zoom-in') return setZoom(state.zoom + .1);
  if (action === 'zoom-out') return setZoom(state.zoom - .1);
  if (action === 'zoom-reset') return setZoom(1);
  if (action === 'toggle-sidebar') return $('#sidebar').toggleAttribute('hidden');
  if (action === 'insert-table') return insertTable();
  if (action === 'insert-image') return $('#image-input').click();
  if (action === 'insert-link') return insertLink();
  if (action === 'insert-pagebreak') return exec('insertHTML', '<div style="break-after:page;height:1px"></div>');
  if (action === 'format-bold') return exec('bold');
  if (action === 'format-italic') return exec('italic');
  if (action === 'format-underline') return exec('underline');
  if (action === 'undo') return exec('undo');
  if (action === 'redo') return exec('redo');
  if (action === 'find') return findText();
  if (action === 'replace') return replaceText();
  if (action === 'clear') return exec('removeFormat');
  if (action === 'count') return alert(`${$('#word-count').textContent}\n${$('#char-count').textContent}`);
  if (action === 'sidebar') return $('#sidebar').toggleAttribute('hidden');
  if (action === 'pagebreak') return exec('insertHTML', '<div style="break-after:page;height:1px"></div>');
  if (action === 'image') return $('#image-input').click();
  if (action === 'link') return insertLink();
  if (action === 'table') return insertTable();
  if (action === 'bold') return exec('bold');
  if (action === 'italic') return exec('italic');
  if (action === 'underline') return exec('underline');
  if (action === 'zoomIn') return setZoom(state.zoom + .1);
  if (action === 'zoomOut') return setZoom(state.zoom - .1);
  if (action === 'zoomReset') return setZoom(1);
}

function findText() {
  const query = prompt('Find text');
  if (!query) return;
  const found = window.find(query);
  if (!found) alert('No matches found.');
}

function replaceText() {
  const from = prompt('Find text');
  if (!from) return;
  const to = prompt('Replace with', '');
  if (to === null) return;
  editor.innerHTML = editor.innerHTML.split(from).join(escapeHtml(to));
  markDirty();
}

function setZoom(value) {
  state.zoom = Math.min(1.5, Math.max(.6, value));
  $('.page').style.transform = `scale(${state.zoom})`;
  $('#zoom-level').textContent = `${Math.round(state.zoom * 100)}%`;
}

function bindWindowControls() {
  $('#minimize-button').onclick = () => {
    if (desktop && desktop.isElectron) desktop.minimizeWindow();
  };

  $('#maximize-button').onclick = () => {
    if (desktop && desktop.isElectron) desktop.maximizeWindow();
  };

  $('#close-button').onclick = () => {
    if (desktop && desktop.isElectron) desktop.closeWindow();
    else window.close();
  };
}

$$('[data-command]').forEach((b) => b.onclick = () => exec(b.dataset.command));
function $$(s) { return [...document.querySelectorAll(s)]; }
$$('[data-menu]').forEach((b) => b.onclick = () => showMenu(b.dataset.menu, b));
$('#menu-popover').onclick = (e) => { const b = e.target.closest('[data-action]'); if (b) { handleMenuAction(b.dataset.action); $('#menu-popover').hidden = true; updateCounts(); updateHeadings(); } };
$('#style-select').onchange = (e) => applyStyle(e.target.value);
$('#font-select').onchange = (e) => exec('fontName', e.target.value);
$('#size-select').onchange = (e) => exec('fontSize', Math.min(7, Math.max(1, Math.round(Number(e.target.value) / 3))));
$('#insert-table').onclick = insertTable;
$('#insert-link').onclick = insertLink;
$('#insert-image').onclick = () => $('#image-input').click();
$('#image-input').onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { exec('insertImage', reader.result); markDirty(); };
  reader.readAsDataURL(file);
};
$('#open-input').onchange = (e) => { if (e.target.files[0]) openDocument(e.target.files[0]); };
$('#undo').onclick = () => exec('undo');
$('#redo').onclick = () => exec('redo');
$('#zoom-in').onclick = () => setZoom(state.zoom + .1);
$('#zoom-out').onclick = () => setZoom(state.zoom - .1);
$('#close-sidebar').onclick = () => $('#sidebar').setAttribute('hidden', '');
$('#theme-toggle').onclick = () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.body.classList.toggle('dark', state.theme === 'dark');
  localStorage.setItem('nexa-theme', state.theme);
};
$('#help-button').onclick = () => alert('Shortcuts: Ctrl+N new, Ctrl+O open, Ctrl+S save, Ctrl+F find, Ctrl+H replace, Ctrl+B bold, Ctrl+I italic, Ctrl+Z undo.');

editor.addEventListener('input', markDirty);
editor.addEventListener('keyup', updateCounts);
document.addEventListener('click', (e) => { if (!e.target.closest('.menu-bar') && !e.target.closest('.menu-popover')) $('#menu-popover').hidden = true; });
document.addEventListener('keydown', (e) => { if (!(e.ctrlKey || e.metaKey)) return; const key = e.key.toLowerCase(); if (key === 's') { e.preventDefault(); saveDocument(); } if (key === 'o') { e.preventDefault(); handleMenuAction('open'); } if (key === 'n') { e.preventDefault(); handleMenuAction('new'); } if (key === 'f') { e.preventDefault(); findText(); } if (key === 'h') { e.preventDefault(); replaceText(); } if (key === 'p') { e.preventDefault(); window.print(); } });
window.addEventListener('beforeunload', (e) => { if (state.dirty) { e.preventDefault(); e.returnValue = ''; } });

if (desktop && desktop.isElectron) {
  desktop.onAppMenuAction((action) => handleMenuAction(action));
}

bindWindowControls();
document.body.classList.toggle('dark', state.theme === 'dark');
updateCounts();
updateHeadings();
