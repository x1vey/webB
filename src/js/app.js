// ===== Pagecraft — App Entry =====
// Wires all modules together: screen flow, start screen, generating,
// builder (chat + canvas + DnD), theme, export modal.

import * as state from './state.js';
import { render } from './canvas-engine.js';
import { hydrateIcons } from './icons-runtime.js';
import { toast } from './toast.js';
import { demoProject } from './demo.js';
import { exportProject } from './exporter.js';

// Screen flow
import { initScreens, showScreen, getCurrentScreen } from './screens.js';
import { initStartScreen } from './start-screen.js';
import { initGenerating } from './generating.js';
import { initChat } from './chat.js';
import { initTheme } from './theme.js';
import { initExportModal } from './export-modal.js';

// Existing sub-modules that still work unchanged
import './library-panel.js';
import './code-editor.js';
import './context-bar.js';
import './importer.js';
import './layers.js';
import './resize-handles.js';
import './file-drop.js';
import './ai-panel.js';

// ---- Hydrate icons ----
hydrateIcons(document.body);

// ---- Theme ----
initTheme();

// ---- Screen flow ----
initScreens();

// ---- Start screen ----
initStartScreen();

// ---- Generating screen ----
initGenerating();

// ---- Chat panel ----
initChat();

// ---- Export / publish modal ----
initExportModal();

// ---- Project name sync (builder panel input) ----
const projectNameEl = document.getElementById('project-name');
if (projectNameEl) {
  projectNameEl.addEventListener('change', () => {
    state.setProjectName(projectNameEl.value.trim() || 'Untitled Project');
  });
  state.subscribe((event) => {
    if (event === 'project-name' || event === 'replace-project' || event === 'load' || event === 'undo' || event === 'redo') {
      projectNameEl.value = state.getProject().name;
    }
  });
}

// ---- Device toggle in builder ----
document.querySelectorAll('#device-seg .seg-btn[data-device]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#device-seg .seg-btn').forEach(b => b.classList.toggle('active', b === btn));
    const device = btn.dataset.device;
    const frame = document.getElementById('canvas-frame');
    if (frame) frame.setAttribute('data-device', device);
    state.setDevice(device);
  });
});

// ---- Undo / Redo in builder ----
const undoBtn = document.getElementById('btn-undo');
const redoBtn = document.getElementById('btn-redo');

if (undoBtn) undoBtn.addEventListener('click', () => { if (state.undo()) toast('Undone'); });
if (redoBtn) redoBtn.addEventListener('click', () => { if (state.redo()) toast('Redone'); });

function syncUndoRedo() {
  if (undoBtn) { undoBtn.disabled = !state.canUndo(); undoBtn.style.opacity = state.canUndo() ? '1' : '0.4'; }
  if (redoBtn) { redoBtn.disabled = !state.canRedo(); redoBtn.style.opacity = state.canRedo() ? '1' : '0.4'; }
}
state.subscribe(syncUndoRedo);
syncUndoRedo();

// ---- Back to start ----
const backBtn = document.getElementById('btn-back');
if (backBtn) backBtn.addEventListener('click', () => showScreen('start'));

// ---- Add section button ----
const addSectionBtn = document.getElementById('btn-add-section');
if (addSectionBtn) {
  addSectionBtn.addEventListener('click', () => {
    const drawer = document.getElementById('lib-drawer');
    const scrim  = document.getElementById('lib-scrim');
    if (drawer) drawer.classList.add('open');
    if (scrim)  scrim.classList.add('open');
  });
}

// ---- Components FAB (library drawer toggle) ----
const fabBtn = document.getElementById('btn-components');
const libDrawer = document.getElementById('lib-drawer');
const libScrim  = document.getElementById('lib-scrim');
const closeDrawerBtn = document.getElementById('btn-close-drawer');

function openDrawer() {
  if (libDrawer) libDrawer.classList.add('open');
  if (libScrim)  libScrim.classList.add('open');
}
function closeDrawer() {
  if (libDrawer) libDrawer.classList.remove('open');
  if (libScrim)  libScrim.classList.remove('open');
}

if (fabBtn) fabBtn.addEventListener('click', openDrawer);
if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
if (libScrim) libScrim.addEventListener('click', closeDrawer);

// ---- Keyboard shortcuts ----
window.addEventListener('keydown', (e) => {
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
    if (id) { e.preventDefault(); state.deleteNode(id); }
  } else if (e.key === 'Escape') {
    state.setSelection(null);
    closeDrawer();
  } else if (mod && e.key === 'd') {
    if (inField) return;
    const id = state.getSelection();
    if (id) { e.preventDefault(); state.duplicateNode(id); }
  }
});

// ---- Load saved project or demo ----
const loaded = state.loadLocal();
if (loaded) {
  toast('Loaded last project');
  if (projectNameEl) projectNameEl.value = state.getProject().name;
} else {
  state.replaceProject(demoProject());
  if (projectNameEl) projectNameEl.value = state.getProject().name;
}

// ---- Initial render (canvas) ----
render();

// ---- If we saved as 'builder', go straight there ----
// (initScreens handles this via localStorage)

// ---- Hello banner ----
console.info(
  '%c Pagecraft %c v0.2 — Light Edition\n%cDescribe your page on the start screen, or open the builder directly.',
  'background:oklch(0.55 0.17 275);color:#fff;padding:2px 8px;border-radius:4px;font-weight:bold',
  'color:oklch(0.5 0.028 278)',
  'color:oklch(0.68 0.022 278)'
);

// Expose debug API
window.Pagecraft = window.Pagecraft || {};
window.Pagecraft.toast = toast;
window.Pagecraft.showScreen = showScreen;
window.Pagecraft.state = state;
