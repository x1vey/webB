// ===== Code Editor =====
// HTML/CSS/JS view & edit. Two-way: state → code; code → state on Apply.

import * as state from './state.js';
import { projectToHTML, htmlToSections, buildExportCSS, buildExportJS } from './serializer.js';
import { toast } from './toast.js';

const editor = document.getElementById('code-editor');
const codeTabs = document.querySelectorAll('.code-tab');
const applyBtn = document.getElementById('btn-code-apply');
const revertBtn = document.getElementById('btn-code-revert');

let currentLang = 'html';
let dirty = false;
let lastLoadedValue = '';

function updateCode() {
  const project = state.getProject();
  let value = '';
  if (currentLang === 'html') value = projectToHTML(project.sections);
  else if (currentLang === 'css') value = project.globalCSS || '';
  else if (currentLang === 'js')  value = project.globalJS || '';
  editor.value = value;
  lastLoadedValue = value;
  dirty = false;
  syncApplyState();
}

function syncApplyState() {
  applyBtn.disabled = !dirty;
  applyBtn.style.opacity = dirty ? '1' : '0.5';
  revertBtn.disabled = !dirty;
  revertBtn.style.opacity = dirty ? '1' : '0.5';
}

editor.addEventListener('input', () => {
  dirty = editor.value !== lastLoadedValue;
  syncApplyState();
});

// Tab indent support
editor.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const s = editor.selectionStart, en = editor.selectionEnd;
    editor.value = editor.value.slice(0, s) + '  ' + editor.value.slice(en);
    editor.selectionStart = editor.selectionEnd = s + 2;
    dirty = true;
    syncApplyState();
  }
});

codeTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    if (dirty) {
      const ok = confirm('You have unsaved code changes. Discard them?');
      if (!ok) return;
    }
    codeTabs.forEach(t => t.classList.toggle('active', t === tab));
    currentLang = tab.dataset.lang;
    state.setCodeLang(currentLang);
    updateCode();
  });
});

applyBtn.addEventListener('click', () => {
  try {
    if (currentLang === 'html') {
      const sections = htmlToSections(editor.value);
      state.replaceSections(sections);
      toast('HTML applied', 'success');
    } else if (currentLang === 'css') {
      state.setGlobalCSS(editor.value);
      toast('CSS applied', 'success');
    } else if (currentLang === 'js') {
      state.setGlobalJS(editor.value);
      toast('JavaScript applied', 'success');
    }
    dirty = false;
    lastLoadedValue = editor.value;
    syncApplyState();
  } catch (err) {
    toast(`Error: ${err.message}`, 'error');
  }
});

revertBtn.addEventListener('click', () => {
  updateCode();
});

// Re-sync code view when state changes (only if not editing)
state.subscribe((event) => {
  if (dirty) return;
  // Avoid loops: only refresh on changes that affect the code we're viewing
  if (currentLang === 'html' && ['add-section','add-element','update-node','update-style',
    'update-attr','update-text','move-node','delete-node','duplicate-node',
    'replace-project','replace-sections','undo','redo'].includes(event)) {
    updateCode();
  } else if (currentLang === 'css' && (event === 'global-css' || event === 'replace-project' || event === 'undo' || event === 'redo')) {
    updateCode();
  } else if (currentLang === 'js' && (event === 'global-js' || event === 'replace-project' || event === 'undo' || event === 'redo')) {
    updateCode();
  }
});

// Initial
updateCode();
