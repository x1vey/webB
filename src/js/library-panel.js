// ===== Library Panel UI =====
// Renders library items with miniature renderings of each template.

import { templatesByCategory, searchTemplates, templateById } from './library.js';
import { setDragPayload, clearDragPayload } from './canvas-engine.js';
import { nodeToHTML } from './serializer.js';

const listEl = document.getElementById('library-list');
const searchEl = document.getElementById('library-search');
const tabs = document.querySelectorAll('.lib-tab');

let activeCategory = 'sections';
let activeQuery = '';

// Width assumed for the rendered template (then scaled to fit thumb)
const VIRTUAL_WIDTH = { sections: 1100, layouts: 800, elements: 600 };

function renderList() {
  const items = activeQuery
    ? searchTemplates(activeQuery)
    : templatesByCategory(activeCategory);

  listEl.classList.toggle('single-col', activeCategory === 'sections' && !activeQuery);
  listEl.innerHTML = '';

  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:var(--text-faint);font-size:12px;text-align:center;padding:24px;grid-column:1/-1';
    empty.textContent = 'No matches';
    listEl.appendChild(empty);
    return;
  }

  for (const item of items) {
    const card = document.createElement('div');
    card.className = 'library-item';
    card.draggable = true;
    card.dataset.templateId = item.id;

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    const inner = document.createElement('div');
    inner.className = 'thumb-inner';
    inner.innerHTML = nodeToHTML(item.template, 0);

    // Apply a virtual width and scale to fit
    const vw = VIRTUAL_WIDTH[item.category] || 800;
    inner.style.width = vw + 'px';

    thumb.appendChild(inner);
    card.appendChild(thumb);

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = item.name;
    const desc = document.createElement('div');
    desc.className = 'desc';
    desc.textContent = item.desc;
    card.appendChild(name);
    card.appendChild(desc);

    listEl.appendChild(card);

    // Scale to fit AFTER mount (need actual rendered width)
    requestAnimationFrame(() => fitThumb(thumb, inner, vw));
  }
}

function fitThumb(thumb, inner, vw) {
  const rect = thumb.getBoundingClientRect();
  if (!rect.width) return;
  const scale = rect.width / vw;
  inner.style.transform = `scale(${scale})`;
  // Set inner height in *real* px so the thumb sizing is honest;
  // also clip excess content to the thumb's aspect ratio.
  const innerRect = inner.getBoundingClientRect();
  // No-op: thumb has aspect-ratio CSS — overflow hidden takes care of it.
}

// Re-fit thumbs on panel resize
const ro = new ResizeObserver(() => {
  listEl.querySelectorAll('.library-item').forEach(card => {
    const thumb = card.querySelector('.thumb');
    const inner = card.querySelector('.thumb-inner');
    if (thumb && inner) {
      const item = templateById(card.dataset.templateId);
      const vw = VIRTUAL_WIDTH[item?.category] || 800;
      fitThumb(thumb, inner, vw);
    }
  });
});
ro.observe(listEl);

function activateTab(category) {
  activeCategory = category;
  tabs.forEach(t => t.classList.toggle('active', t.dataset.category === category));
  renderList();
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => activateTab(tab.dataset.category));
});

searchEl.addEventListener('input', () => {
  activeQuery = searchEl.value;
  renderList();
});

// Drag handling
listEl.addEventListener('dragstart', (e) => {
  const card = e.target.closest('.library-item');
  if (!card) return;
  const template = templateById(card.dataset.templateId);
  if (!template) return;
  setDragPayload({ kind: 'library', template });
  e.dataTransfer.effectAllowed = 'copy';
  e.dataTransfer.setData('text/plain', template.id);
  // Use the card itself as drag image, but slightly transparent
  card.style.opacity = '0.6';
});

listEl.addEventListener('dragend', (e) => {
  const card = e.target.closest('.library-item');
  if (card) card.style.opacity = '';
  clearDragPayload();
});

renderList();
