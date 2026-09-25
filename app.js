<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <title>Nexa — Word processor</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="app-shell">
    <header class="titlebar">
      <div class="brand"><span class="brand-mark">N</span><span>Nexa</span></div>
      <div class="titlebar-center"><span id="document-title">Untitled document</span><span class="saved-state" id="saved-state">Saved</span></div>
      <div class="window-actions" aria-label="Window controls">
        <button id="minimize-button" title="Minimize">—</button>
        <button id="maximize-button" title="Maximize">□</button>
        <button id="close-button" title="Close">×</button>
      </div>
    </header>

    <nav class="menu-bar" aria-label="Application menu">
      <button data-menu="file">File</button><button data-menu="edit">Edit</button><button data-menu="view">View</button><button data-menu="insert">Insert</button><button data-menu="format">Format</button><button data-menu="tools">Tools</button>
      <div class="menu-spacer"></div><button id="theme-toggle" class="subtle-button" title="Toggle appearance">◐</button><button id="help-button" class="subtle-button" title="Keyboard shortcuts">?</button>
    </nav>
    <div id="menu-popover" class="menu-popover" hidden></div>

    <section class="quick-toolbar" aria-label="Formatting toolbar">
      <div class="tool-group"><button id="undo" title="Undo (Ctrl+Z)">↶</button><button id="redo" title="Redo (Ctrl+Y)">↷</button></div>
      <div class="divider"></div>
      <select id="style-select" aria-label="Text style"><option value="p">Normal</option><option value="h1">Title</option><option value="h2">Heading 1</option><option value="h3">Heading 2</option><option value="blockquote">Quote</option></select>
      <select id="font-select" aria-label="Font family"><option>Segoe UI</option><option>Georgia</option><option>Arial</option><option>Consolas</option></select>
      <select id="size-select" aria-label="Font size"><option>10</option><option>11</option><option selected>12</option><option>14</option><option>16</option><option>18</option><option>24</option><option>32</option></select>
      <div class="divider"></div>
      <div class="tool-group"><button data-command="bold" title="Bold (Ctrl+B)"><b>B</b></button><button data-command="italic" title="Italic (Ctrl+I)"><i>I</i></button><button data-command="underline" title="Underline (Ctrl+U)"><u>U</u></button><button data-command="strikeThrough" title="Strikethrough"><s>S</s></button></div>
      <div class="tool-group"><button id="text-color" title="Text color">A<span class="color-line"></span></button><button id="highlight-color" title="Highlight">▰</button></div>
      <div class="divider"></div>
      <div class="tool-group"><button data-command="justifyLeft" title="Align left">≡</button><button data-command="justifyCenter" title="Align center">≡</button><button data-command="justifyRight" title="Align right">≡</button><button data-command="justifyFull" title="Justify">☰</button></div>
      <div class="tool-group"><button data-command="insertUnorderedList" title="Bulleted list">•≡</button><button data-command="insertOrderedList" title="Numbered list">1≡</button><button data-command="outdent" title="Decrease indent">⇤</button><button data-command="indent" title="Increase indent">⇥</button></div>
      <div class="divider"></div><button id="insert-link" title="Insert hyperlink">↗</button><button id="insert-table" title="Insert table">▦</button><button id="insert-image" title="Insert image">▧</button>
    </section>

    <div class="workspace">
      <aside class="sidebar" id="sidebar"><div class="sidebar-header"><strong>Navigation</strong><button id="close-sidebar">×</button></div><div class="sidebar-search"><input id="nav-search" placeholder="Search document" aria-label="Search document" /></div><div id="headings" class="headings"><p class="muted">Headings will appear here</p></div></aside>
      <main class="editor-area">
        <div class="ruler"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span></div>
        <div class="page-scroller"><article class="page" id="page"><div id="editor" class="editor" contenteditable="true" spellcheck="true" aria-label="Document editor"><h1>Welcome to Nexa</h1><p>Start writing something remarkable.</p><p><br></p></div></article></div>
      </main>
    </div>
    <footer class="statusbar"><span id="page-count">Page 1 of 1</span><span id="word-count">0 words</span><span id="char-count">0 characters</span><span class="status-spacer"></span><span>English (US)</span><button id="zoom-out">−</button><span id="zoom-level">100%</span><button id="zoom-in">＋</button></footer>
  </div>
  <input id="image-input" type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden />
  <input id="open-input" type="file" accept=".nexa,.txt,.html,.htm" hidden />
  <script src="document-model.js"></script>
  <script src="app.js"></script>
</body>
</html>
