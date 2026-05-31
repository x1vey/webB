// ===== Export / Publish Modal =====
// Shown when user clicks the "Publish" button.
// States: menu → publishing (progress) → published (URL + copy/visit)

import { exportProject } from './exporter.js';
import { toast } from './toast.js';

const MENU_ITEMS = [
  { id: 'publish',  icon: '🚀', label: 'Publish to web',   desc: 'Get a shareable pages.dev URL instantly' },
  { id: 'download', icon: '📦', label: 'Download code',    desc: 'Export clean HTML, CSS & JS as a ZIP' },
  { id: 'copy',     icon: '📋', label: 'Copy HTML',        desc: 'Copy the full page HTML to clipboard' },
  { id: 'domain',   icon: '🌐', label: 'Connect domain',   desc: 'Point your custom domain to this page' },
];

let _scrim = null;
let _modal = null;

function renderMenu() {
  _modal.innerHTML = `
    <div class="modal-head">
      <h3>Export &amp; Publish</h3>
      <button class="icon-btn" id="btn-close-export" type="button">✕</button>
    </div>
    <div class="export-menu">
      ${MENU_ITEMS.map(item => `
        <div class="export-item" data-action="${item.id}">
          <div class="export-icon">${item.icon}</div>
          <div class="export-item-text">
            <h4>${item.label}</h4>
            <p>${item.desc}</p>
          </div>
        </div>`).join('')}
    </div>`;

  _modal.querySelector('#btn-close-export').addEventListener('click', closeModal);
  _modal.querySelectorAll('.export-item').forEach(el => {
    el.addEventListener('click', () => handleAction(el.dataset.action));
  });
}

function renderPublishing() {
  _modal.innerHTML = `
    <div class="modal-head">
      <h3>Publishing…</h3>
    </div>
    <div class="publish-state">
      <div style="font-size:40px">🚀</div>
      <p style="font-size:14px;color:var(--text-dim)">Deploying your page to the edge…</p>
      <div class="publish-progress" style="width:100%">
        <div class="publish-progress-fill"></div>
      </div>
    </div>`;

  setTimeout(renderPublished, 2400);
}

function renderPublished() {
  const fakeSlug = 'page-' + Math.random().toString(36).slice(2, 8);
  const url = `https://${fakeSlug}.pages.dev`;

  _modal.innerHTML = `
    <div class="modal-head">
      <h3>Published! 🎉</h3>
      <button class="icon-btn" id="btn-close-export" type="button">✕</button>
    </div>
    <div class="publish-done">
      <div style="font-size:48px">🌐</div>
      <p style="font-size:14px;color:var(--text-dim);max-width:320px">
        Your page is live! Share the link or connect a custom domain.
      </p>
      <div class="publish-url" id="pub-url">${url}</div>
      <div style="display:flex;gap:10px;justify-content:center;width:100%">
        <button class="btn btn-ghost" id="btn-copy-url">📋 Copy link</button>
        <a class="btn btn-primary" href="${url}" target="_blank" rel="noopener">🔗 Visit page</a>
      </div>
    </div>`;

  _modal.querySelector('#btn-close-export').addEventListener('click', closeModal);
  _modal.querySelector('#btn-copy-url').addEventListener('click', () => {
    navigator.clipboard.writeText(url).then(() => toast('Link copied!', 'success'));
  });
}

async function handleAction(action) {
  if (action === 'publish') {
    renderPublishing();
    return;
  }
  if (action === 'download') {
    exportProject();
    closeModal();
    return;
  }
  if (action === 'copy') {
    try {
      // Build the export HTML from the serializer
      const { buildExportHTML } = await import('./serializer.js');
      const stateModule = await import('./state.js');
      const project = stateModule.getProject();
      const html = buildExportHTML(project);
      await navigator.clipboard.writeText(html);
      toast('HTML copied to clipboard', 'success');
    } catch {
      toast('Copy HTML: try Download instead', 'warn');
    }
    closeModal();
    return;
  }
  if (action === 'domain') {
    toast('Custom domain: coming soon!', 'warn');
    closeModal();
    return;
  }
}

function openModal() {
  if (!_scrim) {
    _scrim  = document.getElementById('export-scrim');
    _modal  = document.getElementById('export-modal');
  }
  renderMenu();
  _scrim.hidden = false;
  _scrim.addEventListener('mousedown', (e) => { if (e.target === _scrim) closeModal(); }, { once: false });
}

function closeModal() {
  if (_scrim) _scrim.hidden = true;
}

export function initExportModal() {
  const publishBtn = document.getElementById('btn-publish');
  if (publishBtn) publishBtn.addEventListener('click', openModal);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && _scrim && !_scrim.hidden) closeModal();
  });
}
