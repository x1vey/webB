// ===== File drop on canvas =====
// Drop .html / .css / .js files anywhere on the canvas to import them.
// Re-uses the importer logic so behavior matches the topbar Import button.

import * as state from './state.js';
import { htmlToSections } from './serializer.js';
import { toast } from './toast.js';

const canvasViewport = document.getElementById('canvas-viewport');

// Overlay shown when files are dragged over the app
const overlay = document.createElement('div');
overlay.id = 'file-drop-overlay';
Object.assign(overlay.style, {
  position: 'fixed', inset: '0',
  background: 'rgba(99, 102, 241, 0.12)',
  border: '3px dashed #6366f1',
  display: 'none',
  alignItems: 'center', justifyContent: 'center',
  zIndex: '4000',
  pointerEvents: 'none',
  color: '#fff', fontSize: '20px', fontWeight: '600',
  textShadow: '0 1px 3px rgba(0,0,0,0.4)'
});
overlay.textContent = 'Drop HTML/CSS/JS files to import';
document.body.appendChild(overlay);

let dragCounter = 0;

// Only react to file drags (not internal element drags)
function isFileDrag(e) {
  return Array.from(e.dataTransfer?.types || []).includes('Files');
}

window.addEventListener('dragenter', (e) => {
  if (!isFileDrag(e)) return;
  dragCounter++;
  overlay.style.display = 'flex';
});
window.addEventListener('dragover', (e) => {
  if (!isFileDrag(e)) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});
window.addEventListener('dragleave', (e) => {
  if (!isFileDrag(e)) return;
  dragCounter = Math.max(0, dragCounter - 1);
  if (dragCounter === 0) overlay.style.display = 'none';
});
window.addEventListener('drop', async (e) => {
  if (!isFileDrag(e)) return;
  e.preventDefault();
  dragCounter = 0;
  overlay.style.display = 'none';
  const files = Array.from(e.dataTransfer.files);
  if (!files.length) return;
  try {
    await handleFiles(files);
  } catch (err) {
    console.error(err);
    toast(`Import failed: ${err.message}`, 'error', 4000);
  }
});

async function handleFiles(files) {
  // Project JSON?
  const jsonFile = files.find(f => f.name.endsWith('.pagecraft.json'));
  if (jsonFile) {
    const project = JSON.parse(await jsonFile.text());
    state.replaceProject(project);
    toast(`Loaded "${project.name}"`, 'success');
    return;
  }

  const html = files.find(f => /\.html?$/i.test(f.name));
  const css  = files.find(f => /\.css$/i.test(f.name));
  const js   = files.find(f => /\.js$/i.test(f.name));

  if (html) {
    await importHTMLBundle(html, css, js);
    return;
  }
  if (css) { state.setGlobalCSS(await css.text()); toast('CSS replaced', 'success'); }
  if (js)  { state.setGlobalJS(await js.text());   toast('JavaScript replaced', 'success'); }
  if (!html && !css && !js) {
    toast('Supported: .html / .css / .js / .pagecraft.json', 'warn', 3500);
  }
}

async function importHTMLBundle(htmlFile, cssFile, jsFile) {
  const htmlText = await htmlFile.text();
  const doc = new DOMParser().parseFromString(htmlText, 'text/html');
  const title = doc.querySelector('title')?.textContent || htmlFile.name.replace(/\.[^.]+$/, '');
  const inlineCSS = Array.from(doc.querySelectorAll('style')).map(s => s.textContent).join('\n\n');
  const inlineJS  = Array.from(doc.querySelectorAll('script:not([src])')).map(s => s.textContent).join('\n\n');
  doc.querySelectorAll('style, script').forEach(el => el.remove());
  const bodyHTML = doc.body ? doc.body.innerHTML : htmlText;
  const sections = htmlToSections(bodyHTML);
  const project = {
    name: title,
    sections,
    globalCSS: (cssFile ? await cssFile.text() : '') + (inlineCSS ? `\n\n/* From inline <style> */\n${inlineCSS}` : ''),
    globalJS:  (jsFile  ? await jsFile.text()  : '') + (inlineJS  ? `\n\n/* From inline <script> */\n${inlineJS}` : ''),
    meta: { created: Date.now(), modified: Date.now() }
  };
  state.replaceProject(project);
  toast(`Imported ${htmlFile.name}`, 'success');
}
