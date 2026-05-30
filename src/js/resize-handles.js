// ===== Resize handles =====
// Adds 8 draggable handles around the selected element (4 corners + 4 sides).
// For elements in a freeform section, corner drags adjust position too.

import * as state from './state.js';

const HANDLE_SIZE = 10;
const POSITIONS = ['nw','n','ne','e','se','s','sw','w'];

// One container that holds all handles
const layer = document.createElement('div');
layer.id = 'resize-layer';
Object.assign(layer.style, {
  position: 'fixed', left: '0', top: '0', width: '0', height: '0',
  pointerEvents: 'none', zIndex: '1900'
});
document.body.appendChild(layer);

const handles = {};
for (const pos of POSITIONS) {
  const h = document.createElement('div');
  h.className = `resize-handle resize-${pos}`;
  h.dataset.pos = pos;
  Object.assign(h.style, {
    position: 'fixed',
    width:  `${HANDLE_SIZE}px`,
    height: `${HANDLE_SIZE}px`,
    background: '#fff',
    border: '1.5px solid #6366f1',
    borderRadius: '2px',
    pointerEvents: 'auto',
    cursor: cursorFor(pos),
    display: 'none',
    zIndex: '1900'
  });
  layer.appendChild(h);
  handles[pos] = h;
  h.addEventListener('mousedown', (e) => startResize(e, pos));
}

function cursorFor(pos) {
  return { n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
           ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize' }[pos];
}

let _activeEl = null;

function hideAll() {
  for (const pos of POSITIONS) handles[pos].style.display = 'none';
  _activeEl = null;
}

function showAround(el) {
  _activeEl = el;
  reposition();
}

function reposition() {
  if (!_activeEl || !document.body.contains(_activeEl)) { hideAll(); return; }
  const r = _activeEl.getBoundingClientRect();
  const half = HANDLE_SIZE / 2;
  const place = (pos, x, y) => {
    const h = handles[pos];
    h.style.display = 'block';
    h.style.left = `${x - half}px`;
    h.style.top  = `${y - half}px`;
  };
  place('nw', r.left, r.top);
  place('n',  r.left + r.width/2, r.top);
  place('ne', r.right, r.top);
  place('e',  r.right, r.top + r.height/2);
  place('se', r.right, r.bottom);
  place('s',  r.left + r.width/2, r.bottom);
  place('sw', r.left, r.bottom);
  place('w',  r.left, r.top + r.height/2);
}

// ---------- Resize logic ----------
let _drag = null;
function startResize(e, pos) {
  if (!_activeEl) return;
  e.preventDefault();
  e.stopPropagation();
  const id = _activeEl.getAttribute('data-pc-id');
  if (!id) return;
  const node = state.findNode(id);
  if (!node) return;
  const parent = state.findParent(id);
  const parentFreeform = parent?.freeform === true;
  const parentEl = parent
    ? document.querySelector(`[data-pc-id="${parent.id}"]`)
    : document.getElementById('canvas-root');
  const parentRect = parentEl.getBoundingClientRect();
  const r = _activeEl.getBoundingClientRect();
  _drag = {
    id, pos, node, parentFreeform,
    startX: e.clientX, startY: e.clientY,
    startW: r.width, startH: r.height,
    startLeft: r.left - parentRect.left,
    startTop:  r.top  - parentRect.top
  };
  document.body.style.cursor = cursorFor(pos);
}

window.addEventListener('mousemove', (e) => {
  if (!_drag) return;
  const dx = e.clientX - _drag.startX;
  const dy = e.clientY - _drag.startY;

  let w = _drag.startW, h = _drag.startH;
  let left = _drag.startLeft, top = _drag.startTop;

  if (_drag.pos.includes('e')) w = Math.max(20, _drag.startW + dx);
  if (_drag.pos.includes('s')) h = Math.max(20, _drag.startH + dy);
  if (_drag.pos.includes('w')) { w = Math.max(20, _drag.startW - dx); left = _drag.startLeft + dx; }
  if (_drag.pos.includes('n')) { h = Math.max(20, _drag.startH - dy); top  = _drag.startTop  + dy; }

  // Apply live (without state churn) for smooth visual feedback
  if (_activeEl) {
    _activeEl.style.width  = `${Math.round(w)}px`;
    _activeEl.style.height = `${Math.round(h)}px`;
    if (_drag.parentFreeform) {
      _activeEl.style.position = 'absolute';
      if (_drag.pos.includes('w')) _activeEl.style.left = `${Math.round(left)}px`;
      if (_drag.pos.includes('n')) _activeEl.style.top  = `${Math.round(top)}px`;
    }
    reposition();
  }
});

window.addEventListener('mouseup', () => {
  if (!_drag) return;
  document.body.style.cursor = '';
  const d = _drag;
  _drag = null;
  if (!_activeEl) return;
  // Commit to state
  state.updateStyle(d.id, 'width',  _activeEl.style.width);
  state.updateStyle(d.id, 'height', _activeEl.style.height);
  if (d.parentFreeform) {
    if (d.pos.includes('w') || d.pos.includes('n')) {
      state.updateStyle(d.id, 'position', 'absolute');
      state.updateStyle(d.id, 'left', _activeEl.style.left);
      state.updateStyle(d.id, 'top',  _activeEl.style.top);
    }
  }
});

// React to selection changes
function syncToSelection() {
  const id = state.getSelection();
  if (!id) { hideAll(); return; }
  // Don't show handles on sections (let user resize via properties for now)
  const node = state.findNode(id);
  if (!node || node.type === 'section') { hideAll(); return; }
  const el = document.querySelector(`[data-pc-id="${id}"]`);
  if (!el) { hideAll(); return; }
  showAround(el);
}

state.subscribe(() => syncToSelection());

// Reposition on scroll & resize
window.addEventListener('resize', reposition);
const viewport = document.getElementById('canvas-viewport');
viewport.addEventListener('scroll', reposition);

// In preview / code views, hide handles
const observer = new MutationObserver(() => {
  const view = document.body.getAttribute('data-view');
  if (view === 'preview' || view === 'code') hideAll();
  else syncToSelection();
});
observer.observe(document.body, { attributes: true, attributeFilter: ['data-view'] });

// Initial sync
syncToSelection();
