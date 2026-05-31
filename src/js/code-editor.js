// ===== Code Editor =====
// HTML/CSS/JS view & edit. Two-way: state → code; code → state on Apply.
// Guard: if #code-editor doesn't exist (new UI), this module is a no-op.

import * as state from './state.js';
import { projectToHTML, htmlToSections, buildExportCSS, buildExportJS } from './serializer.js';
import { toast } from './toast.js';

const editor    = document.getElementById('code-editor');
const applyBtn  = document.getElementById('btn-code-apply');
const revertBtn = document.getElementById('btn-code-revert');
const codeTabs  = document.querySelectorAll('.code-tab');

// In the new UI the code editor textarea exists (hidden) but the apply/revert buttons
// and code tabs do not. Only wire up if the editor is actually visible/usable.
if (editor && (applyBtn || codeTabs.length)) {
  let currentLang = 'html';
  let dirty = false;
  let lastLoadedValue = '';

  const syncApplyState = () => {
    if (applyBtn)  { applyBtn.disabled  = !dirty; applyBtn.style.opacity  = dirty ? '1' : '0.5'; }
    if (revertBtn) { revertBtn.disabled = !dirty; revertBtn.style.opacity = dirty ? '1' : '0.5'; }
  };

  const updateCode = () => {
    const project = state.getProject();
    let value = '';
    if (currentLang === 'html')      value = projectToHTML(project.sections);
    else if (currentLang === 'css')  value = project.globalCSS || '';
    else if (currentLang === 'js')   value = project.globalJS || '';
    editor.value = value;
    lastLoadedValue = value;
    dirty = false;
    syncApplyState();
  };

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

  if (applyBtn) applyBtn.addEventListener('click', () => {
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

  if (revertBtn) revertBtn.addEventListener('click', () => updateCode());

  // Re-sync code view when state changes (only if not actively editing)
  state.subscribe((event) => {
    if (dirty) return;
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
}
