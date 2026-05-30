// ===== Exporter =====
// Generates and downloads the project as 3 files: index.html + styles.css + script.js.
// Pure vanilla — no third-party dependencies. Optionally uses JSZip (CDN) if available
// for single-file ZIP downloads; otherwise falls back to 3 sequential downloads.

import * as state from './state.js';
import { buildExportHTML, buildExportCSS, buildExportJS } from './serializer.js';
import { toast } from './toast.js';

export async function exportProject() {
  const project = state.getProject();
  const html = buildExportHTML(project);
  const css  = buildExportCSS(project);
  const js   = buildExportJS(project);

  // Attempt ZIP via JSZip if loaded
  if (window.JSZip) {
    try {
      const zip = new window.JSZip();
      zip.file('index.html', html);
      zip.file('styles.css', css);
      zip.file('script.js', js);
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, `${safeFilename(project.name)}.zip`);
      toast('Exported as ZIP', 'success');
      return;
    } catch (err) {
      console.warn('ZIP failed, falling back to individual downloads', err);
    }
  }

  // Fallback: three sequential downloads
  downloadText(html, 'index.html', 'text/html');
  setTimeout(() => downloadText(css, 'styles.css', 'text/css'), 200);
  setTimeout(() => downloadText(js, 'script.js', 'application/javascript'), 400);
  toast('Exported 3 files — put them in the same folder', 'success', 3500);
}

function downloadText(text, filename, mime) {
  const blob = new Blob([text], { type: mime });
  downloadBlob(blob, filename);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFilename(name) {
  return (name || 'project').toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || 'project';
}

// Save project JSON for backup/share
export function exportProjectJSON() {
  const blob = new Blob([JSON.stringify(state.getProject(), null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${safeFilename(state.getProject().name)}.pagecraft.json`);
  toast('Project file downloaded', 'success');
}
