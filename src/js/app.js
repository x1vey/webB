// ===== Pagecraft — App Entry =====
// Wires modules together, binds top-bar actions, keyboard shortcuts, and auto-load.

import * as state from './state.js';
import { render } from './canvas-engine.js';
import './library-panel.js';
import './code-editor.js';
import './context-bar.js';
import { exportProject } from './exporter.js';
import './importer.js';
import { ai } from './ai.js';
import { toast } from './toast.js';
import { demoProject } from './demo.js';
import { hydrateIcons } from './icons-runtime.js';
import './layers.js';
import './resize-handles.js';
import './file-drop.js';
import './ai-panel.js';

// Replace all `<span class="i" data-icon="X">` placeholders with SVG
hydrateIcons(document.body);

// ---------- Topbar: project name ----------
const projectNameEl = document.getElementById('project-name');
projectNameEl.addEventListener('change', () => {
  state.setProjectName(projectNameEl.value.trim() || 'Untitled Project');
});

// ---------- Topbar: view tabs (design / code / preview) ----------
document.querySelectorAll('.seg-btn[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    document.querySelectorAll('.seg-btn[data-view]').forEach(b => b.classList.toggle('active', b === btn));
    document.body.setAttribute('data-view', view);
    state.setView(view);

    // When switching to preview, run the project's JS for real.
    if (view === 'preview') runPreviewJS();
    else stopPreviewJS();
  });
});

let _previewScript = null;
function runPreviewJS() {
  stopPreviewJS();
  const js = state.getProject().globalJS || '';
  if (!js.trim()) return;
  try {
    _previewScript = document.createElement('script');
    _previewScript.textContent = js;
    _previewScript.setAttribute('data-pagecraft-preview', '');
    document.body.appendChild(_previewScript);
  } catch (err) {
    toast(`Preview JS error: ${err.message}`, 'error', 4000);
  }
}
function stopPreviewJS() {
  document.querySelectorAll('script[data-pagecraft-preview]').forEach(s => s.remove());
  _previewScript = null;
}

// ---------- Canvas toolbar: device toggle ----------
document.querySelectorAll('.seg-btn[data-device]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.seg-btn[data-device]').forEach(b => b.classList.toggle('active', b === btn));
    const device = btn.dataset.device;
    document.getElementById('canvas-frame').setAttribute('data-device', device);
    state.setDevice(device);
  });
});

// ---------- Topbar: undo / redo / save / export ----------
const undoBtn = document.getElementById('btn-undo');
const redoBtn = document.getElementById('btn-redo');
const saveBtn = document.getElementById('btn-save');
const exportBtn = document.getElementById('btn-export');

undoBtn.addEventListener('click', () => { if (state.undo()) toast('Undone'); });
redoBtn.addEventListener('click', () => { if (state.redo()) toast('Redone'); });

saveBtn.addEventListener('click', () => {
  if (state.saveLocal()) toast('Saved to browser');
  else toast('Save failed', 'error');
});

exportBtn.addEventListener('click', () => exportProject());

function syncUndoRedoButtons() {
  undoBtn.disabled = !state.canUndo();
  redoBtn.disabled = !state.canRedo();
  undoBtn.style.opacity = state.canUndo() ? '1' : '0.4';
  redoBtn.style.opacity = state.canRedo() ? '1' : '0.4';
}
state.subscribe(syncUndoRedoButtons);
syncUndoRedoButtons();

// ---------- Keyboard shortcuts ----------
window.addEventListener('keydown', (e) => {
  // Skip when typing in inputs/textareas/contenteditable
  const t = e.target;
  const inField = t.matches('input, textarea, select, [contenteditable="true"]');

  const mod = e.metaKey || e.ctrlKey;

  if (mod && e.key === 'z' && !e.shiftKey) {
    if (inField) return;
    e.preventDefault();
    state.undo();
  } else if ((mod && e.key === 'y') || (mod && e.shiftKey && e.key === 'Z')) {
    if (inField) return;
    e.preventDefault();
    state.redo();
  } else if (mod && e.key === 's') {
    e.preventDefault();
    state.saveLocal();
    toast('Saved');
  } else if (mod && e.key === 'e') {
    e.preventDefault();
    exportProject();
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (inField) return;
    const id = state.getSelection();
    if (id) {
      e.preventDefault();
      state.deleteNode(id);
    }
  } else if (e.key === 'Escape') {
    state.setSelection(null);
  } else if (mod && e.key === 'd') {
    if (inField) return;
    const id = state.getSelection();
    if (id) {
      e.preventDefault();
      state.duplicateNode(id);
    }
  }
});

// ---------- Auto-load last project (or demo on first open) ----------
const loaded = state.loadLocal();
if (loaded) {
  projectNameEl.value = state.getProject().name;
  toast('Loaded last project');
} else {
  state.replaceProject(demoProject());
  projectNameEl.value = state.getProject().name;
}

// ---------- Initial render ----------
render();

// Keep project-name input synced if state changes elsewhere
state.subscribe((event) => {
  if (event === 'project-name' || event === 'replace-project' || event === 'load' || event === 'undo' || event === 'redo') {
    projectNameEl.value = state.getProject().name;
  }
});

// ---------- Hello banner ----------
console.info(`
%c Pagecraft %c v0.1
%cDrag a section from the library on the left to start building.
Window.Pagecraft.state / .ai expose the API for AI/MCP integration.
`,
'background:#6366f1;color:#fff;padding:2px 6px;border-radius:3px;font-weight:bold',
'color:#9aa3b2',
'color:#6b7280');

// AI is available object-wise, just not wired to a backend yet
window.Pagecraft = window.Pagecraft || {};
window.Pagecraft.toast = toast;
