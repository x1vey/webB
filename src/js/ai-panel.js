// ===== AI Generation Panel =====
// Modal that collects a prompt (and optional model), calls ai.generateSite()
// — which hits our server-side /api/generate — and loads the result into the
// project as editable sections. No API key is handled in the browser.

import { ai } from './ai.js';
import * as state from './state.js';
import { htmlToSections } from './serializer.js';
import { toast } from './toast.js';
import { icon } from './icons.js';

const EXAMPLES = [
  'A landing page for a coffee subscription startup',
  'A portfolio site for a freelance photographer',
  'A SaaS pricing page with 3 tiers and an FAQ',
  'A launch page for a productivity mobile app'
];

let backdrop = null;
let busy = false;

function build() {
  backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.hidden = true;
  backdrop.innerHTML = `
    <div class="modal ai-modal" role="dialog" aria-modal="true" aria-label="Generate website with AI">
      <div class="modal-head">
        <h3>${icon('sparkles')}<span>Generate website with AI</span></h3>
        <button class="icon-btn" data-x title="Close">${icon('x')}</button>
      </div>
      <div class="modal-body">
        <label class="field-label">Describe the website you want</label>
        <textarea class="ai-prompt" rows="4" placeholder="e.g. A landing page for a coffee subscription startup with a hero, features, pricing and a sign-up form."></textarea>
        <div class="ai-examples"></div>

        <details class="ai-advanced">
          <summary>Advanced</summary>
          <label class="field-label">Model (optional — overrides the server default)</label>
          <input type="text" class="ai-model" placeholder="gpt-4o" spellcheck="false">
        </details>

        <div class="ai-status" hidden></div>
      </div>
      <div class="modal-foot">
        <span class="ai-note">${icon('save')}<span>The OpenAI key lives on the server, never in your browser.</span></span>
        <div class="modal-foot-actions">
          <button class="ghost-btn" data-x>Cancel</button>
          <button class="ai-btn ai-generate">${icon('sparkles')}<span>Generate</span></button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(backdrop);

  const $ = (sel) => backdrop.querySelector(sel);
  const promptEl = $('.ai-prompt');
  const genBtn = $('.ai-generate');
  const examplesEl = $('.ai-examples');

  for (const ex of EXAMPLES) {
    const chip = document.createElement('button');
    chip.className = 'ai-chip';
    chip.type = 'button';
    chip.textContent = ex;
    chip.addEventListener('click', () => { promptEl.value = ex; promptEl.focus(); });
    examplesEl.appendChild(chip);
  }

  backdrop.querySelectorAll('[data-x]').forEach(b => b.addEventListener('click', close));
  backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop && !busy) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop && !backdrop.hidden && !busy) close();
  });

  genBtn.addEventListener('click', run);
  promptEl.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); genBtn.click(); }
  });

  return backdrop;
}

function setStatus(msg, kind = 'info') {
  const el = backdrop.querySelector('.ai-status');
  if (!msg) { el.hidden = true; el.textContent = ''; return; }
  el.hidden = false;
  el.className = `ai-status ${kind}`;
  el.textContent = msg;
}

function setGenButton(state_) {
  const btn = backdrop.querySelector('.ai-generate');
  if (state_ === 'loading') {
    btn.disabled = true;
    btn.classList.add('loading');
    btn.innerHTML = `${icon('loader')}<span>Generating…</span>`;
  } else {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.innerHTML = `${icon('sparkles')}<span>Generate</span>`;
  }
}

async function run() {
  if (busy) return;
  const prompt = backdrop.querySelector('.ai-prompt').value.trim();
  const model = backdrop.querySelector('.ai-model').value.trim();

  if (!prompt) { setStatus('Describe the website you want to build.', 'error'); backdrop.querySelector('.ai-prompt').focus(); return; }

  ai.saveSettings({ model });

  busy = true;
  setGenButton('loading');
  setStatus('Generating your site… this can take 10–30s.', 'info');

  try {
    const site = await ai.generateSite(prompt, { model: model || undefined });
    applyGeneratedSite(site);
    busy = false;
    close();
    toast(`Generated “${site.name}”`, 'success', 3200);
    const designBtn = document.querySelector('.seg-btn[data-view="design"]');
    if (designBtn) designBtn.click();
  } catch (err) {
    busy = false;
    console.error(err);
    setStatus(err.message || String(err), 'error');
    setGenButton('idle');
  }
}

// Convert a generated { name, html, css, js } into a fresh editable project.
export function applyGeneratedSite(site) {
  const doc = new DOMParser().parseFromString(`<div id="__pc">${site.html || ''}</div>`, 'text/html');
  const root = doc.getElementById('__pc');
  let extraCSS = '', extraJS = '';
  root.querySelectorAll('style').forEach(s => { extraCSS += '\n' + s.textContent; s.remove(); });
  root.querySelectorAll('script').forEach(s => { if (!s.src) extraJS += '\n' + s.textContent; s.remove(); });

  const sections = htmlToSections(root.innerHTML);
  sections.forEach(sec => { sec.freeform = false; });   // AI builds normal flow layouts

  state.replaceProject({
    name: site.name || 'AI Website',
    sections,
    globalCSS: ((site.css || '') + extraCSS).trim() + '\n',
    globalJS:  ((site.js || '') + extraJS).trim() + '\n',
    meta: { created: Date.now(), modified: Date.now() }
  });
}

export function openPanel() {
  if (!backdrop) build();
  backdrop.hidden = false;
  busy = false;
  setGenButton('idle');
  setStatus('');
  backdrop.querySelector('.ai-model').value = ai.getSettings().model || '';
  setTimeout(() => backdrop.querySelector('.ai-prompt').focus(), 30);
}

function close() {
  if (backdrop) backdrop.hidden = true;
}

// ---- Wiring ----
// Legacy topbar button (may not exist in new UI — guard safely)
const genTopBtn = document.getElementById('btn-generate');
if (genTopBtn) genTopBtn.addEventListener('click', openPanel);

// Empty-state button inside the canvas (canvas re-renders, so delegate from document).
document.addEventListener('click', (e) => {
  const t = e.target.closest && e.target.closest('[data-action="generate"]');
  if (t) { e.preventDefault(); openPanel(); }
});

if (typeof window !== 'undefined') {
  window.Pagecraft = window.Pagecraft || {};
  window.Pagecraft.openGenerate = openPanel;
  window.Pagecraft.applyGeneratedSite = applyGeneratedSite;
}
