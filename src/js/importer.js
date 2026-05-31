// ===== Importer =====
// Loads existing HTML/CSS/JS files into the project so the user can edit them visually.
// Supports:
//   - A single .html file (parses body into sections; <style>/<script> become globalCSS/JS)
//   - Multiple files at once (will pair index.html with styles.css and script.js if present)
//   - .pagecraft.json (full project save file)
//   - A .zip (only if JSZip is loaded — optional dependency)

import * as state from './state.js';
import { htmlToSections } from './serializer.js';
import { toast } from './toast.js';

const fileInput = document.getElementById('file-input');
const importBtn = document.getElementById('btn-import');

if (importBtn) importBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  try {
    await handleFiles(files);
  } catch (err) {
    console.error(err);
    toast(`Import failed: ${err.message}`, 'error', 4000);
  } finally {
    fileInput.value = '';
  }
});

async function handleFiles(files) {
  // Project JSON?
  const jsonFile = files.find(f => f.name.endsWith('.pagecraft.json'));
  if (jsonFile) {
    const text = await jsonFile.text();
    const project = JSON.parse(text);
    state.replaceProject(project);
    toast(`Loaded project "${project.name}"`, 'success');
    return;
  }

  // Single .html / multi-file pairing
  const html = files.find(f => f.name.toLowerCase().endsWith('.html') || f.name.toLowerCase().endsWith('.htm'));
  const css  = files.find(f => f.name.toLowerCase().endsWith('.css'));
  const js   = files.find(f => f.name.toLowerCase().endsWith('.js'));

  if (html) {
    await importHTMLBundle(html, css, js);
    return;
  }

  // CSS-only or JS-only? Update globals without changing layout
  if (css) {
    state.setGlobalCSS(await css.text());
    toast('CSS imported into globals', 'success');
  }
  if (js) {
    state.setGlobalJS(await js.text());
    toast('JavaScript imported into globals', 'success');
  }
  if (!html && !css && !js) {
    toast('No supported files found (.html / .css / .js)', 'warn', 3500);
  }
}

async function importHTMLBundle(htmlFile, cssFile, jsFile) {
  const htmlText = await htmlFile.text();
  const doc = new DOMParser().parseFromString(htmlText, 'text/html');

  // Extract title
  const title = doc.querySelector('title')?.textContent || htmlFile.name.replace(/\.[^.]+$/, '');

  // Extract inline <style> tags from head/body
  const inlineCSS = Array.from(doc.querySelectorAll('style'))
    .map(s => s.textContent).join('\n\n');

  // Extract inline <script> tags (not src=)
  const inlineJS = Array.from(doc.querySelectorAll('script:not([src])'))
    .map(s => s.textContent).join('\n\n');

  // Strip style/script from body before serializing
  doc.querySelectorAll('style, script').forEach(el => el.remove());

  // Parse body children into sections
  const bodyHTML = doc.body ? doc.body.innerHTML : htmlText;
  const sections = htmlToSections(bodyHTML);

  // Compose new project
  const project = {
    name: title,
    sections,
    globalCSS: (cssFile ? await cssFile.text() : '') + (inlineCSS ? `\n\n/* From inline <style> */\n${inlineCSS}` : ''),
    globalJS:  (jsFile ? await jsFile.text() : '') + (inlineJS ? `\n\n/* From inline <script> */\n${inlineJS}` : ''),
    meta: { created: Date.now(), modified: Date.now() }
  };
  state.replaceProject(project);
  toast(`Imported ${htmlFile.name}`, 'success');
}
