// ===== Canvas =====
// Renders the project tree into #canvas-root.
// Handles: selection, hover, free-drag within freeform sections, drop targets.

import * as state from './state.js';

const canvasRoot = document.getElementById('canvas-root');
const canvasEmpty = document.getElementById('canvas-empty');
const breadcrumb = document.getElementById('canvas-breadcrumb');

// Tags whose `text` field becomes textContent (the rest may contain children)
const TEXT_TAGS = new Set(['h1','h2','h3','h4','h5','h6','p','a','span','button','label','li','small','strong','em','blockquote']);
// Tags that should never have a text fallback rendered
const VOID_TAGS = new Set(['img','input','br','hr','meta','link']);

// Tags that can accept dropped children (used by drag-and-drop targeting)
const CONTAINER_TAGS = new Set(['div','section','header','footer','main','nav','aside',
  'article','ul','ol','form','figure','figcaption','blockquote']);
function isContainerEl(el) {
  return CONTAINER_TAGS.has((el.tagName || '').toLowerCase());
}

// ---- Live global-CSS preview (scoped to the canvas) ----
// User/AI global CSS is injected here so @media, :hover and class rules preview
// live. Every selector is prefixed with .canvas-root so it can never leak into
// the builder's own dark UI.
const globalStyleEl = document.createElement('style');
globalStyleEl.id = 'pc-global-style';
document.head.appendChild(globalStyleEl);

function scopeCSS(css) {
  if (!css || !css.trim()) return '';
  let out = '', i = 0; const n = css.length;
  const skipWs = () => { while (i < n && /\s/.test(css[i])) i++; };
  while (i < n) {
    skipWs(); if (i >= n) break;
    if (css[i] === '@') {
      const start = i;
      while (i < n && css[i] !== '{' && css[i] !== ';') i++;
      const prelude = css.slice(start, i);
      if (css[i] === ';') { out += prelude + ';'; i++; continue; }
      i++; // consume {
      let depth = 1; const bstart = i;
      while (i < n && depth > 0) { if (css[i] === '{') depth++; else if (css[i] === '}') depth--; if (depth > 0) i++; }
      const inner = css.slice(bstart, i); i++; // consume }
      out += /^@(media|supports)/i.test(prelude.trim())
        ? prelude + '{' + scopeCSS(inner) + '}'
        : prelude + '{' + inner + '}';       // @keyframes / @font-face left intact
      continue;
    }
    const selStart = i;
    while (i < n && css[i] !== '{') i++;
    const selector = css.slice(selStart, i); i++; // consume {
    let depth = 1; const bstart = i;
    while (i < n && depth > 0) { if (css[i] === '{') depth++; else if (css[i] === '}') depth--; if (depth > 0) i++; }
    const body = css.slice(bstart, i); i++; // consume }
    const scoped = selector.split(',').map(s => {
      s = s.trim(); if (!s) return s;
      if (/^(html|body|:root)\b/i.test(s)) return s.replace(/^(html|body|:root)/i, '.canvas-root');
      return '.canvas-root ' + s;
    }).join(', ');
    out += scoped + '{' + body + '}';
  }
  return out;
}

function syncGlobalStyle() {
  globalStyleEl.textContent = scopeCSS(state.getProject().globalCSS || '');
}

// ============================================================
// RENDER
// ============================================================
export function render() {
  syncGlobalStyle();
  const sections = state.getSections();
  // Empty placeholder
  if (sections.length === 0) {
    canvasRoot.innerHTML = '';
    canvasRoot.appendChild(canvasEmpty);
    canvasEmpty.style.display = '';
    updateToolbar(null);
    updateBreadcrumb(null);
    return;
  }
  canvasEmpty.style.display = 'none';

  // Re-render fully (simple; fine for hundreds of nodes)
  canvasRoot.innerHTML = '';
  for (const section of sections) {
    canvasRoot.appendChild(renderNode(section, null));
  }

  // Reapply selection visuals
  const selId = state.getSelection();
  if (selId) {
    const el = canvasRoot.querySelector(`[data-pc-id="${selId}"]`);
    if (el) {
      el.setAttribute('data-pc-selected', 'true');
      updateToolbar(el);
      updateBreadcrumb(selId);
    } else {
      updateToolbar(null);
      updateBreadcrumb(null);
    }
  } else {
    updateToolbar(null);
    updateBreadcrumb(null);
  }
}

function renderNode(node, parentNode) {
  const tag = node.tag || 'div';
  const el = document.createElement(tag);

  // Attributes
  if (node.attrs) {
    for (const [k, v] of Object.entries(node.attrs)) {
      el.setAttribute(k, v);
    }
  }

  // Inline styles (apply each, converting camelCase to kebab)
  if (node.styles) {
    for (const [k, v] of Object.entries(node.styles)) {
      el.style.setProperty(camelToKebab(k), v);
    }
  }

  // Position adjustments for freeform parents
  if (parentNode?.freeform && node.styles?.position !== 'absolute') {
    // child should be relative inside freeform container by default
    // (but only enforce if no explicit position)
  }

  // Children OR text
  if (node.children && node.children.length) {
    for (const child of node.children) {
      el.appendChild(renderNode(child, node));
    }
  } else if (node.text !== undefined && !VOID_TAGS.has(tag)) {
    el.textContent = node.text;
  }

  // Tag with our metadata
  el.setAttribute('data-pc-id', node.id);
  el.setAttribute('data-pc-type', node.type || 'element');
  if (node.freeform) el.setAttribute('data-pc-freeform', 'true');
  if (node.type === 'section' && (!node.children || node.children.length === 0)) {
    el.setAttribute('data-pc-empty', 'true');
  }

  // Make sections freeform-positionable container
  if (node.freeform) {
    el.style.position = el.style.position || 'relative';
  }

  return el;
}

function camelToKebab(s) {
  return s.replace(/([A-Z])/g, '-$1').toLowerCase();
}

// ============================================================
// SELECTION
// ============================================================
function findEditableTarget(target) {
  let el = target;
  while (el && el !== canvasRoot) {
    if (el.hasAttribute && el.hasAttribute('data-pc-id')) return el;
    el = el.parentElement;
  }
  return null;
}

canvasRoot.addEventListener('click', (e) => {
  const target = findEditableTarget(e.target);
  if (!target) { state.setSelection(null); return; }
  e.stopPropagation();
  const id = target.getAttribute('data-pc-id');
  const node = state.findNode(id);
  const wasSelected = state.getSelection() === id;

  // Already selected + is a text element → enter inline edit on click
  if (wasSelected && node && TEXT_TAGS.has(node.tag) && target.getAttribute('contenteditable') !== 'true') {
    startInlineEdit(target, node);
    return;
  }
  state.setSelection(id);
});

// Double click is a shortcut for inline edit (e.g. select via layers, then dblclick)
canvasRoot.addEventListener('dblclick', (e) => {
  const target = findEditableTarget(e.target);
  if (!target) return;
  const node = state.findNode(target.getAttribute('data-pc-id'));
  if (!node || !TEXT_TAGS.has(node.tag)) return;
  if (target.getAttribute('contenteditable') === 'true') return;
  e.preventDefault();
  startInlineEdit(target, node);
});

function startInlineEdit(domEl, node) {
  domEl.setAttribute('contenteditable', 'true');
  domEl.focus();
  // Select all text
  const range = document.createRange();
  range.selectNodeContents(domEl);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  const commit = () => {
    domEl.removeAttribute('contenteditable');
    const newText = domEl.textContent;
    domEl.removeEventListener('blur', commit);
    domEl.removeEventListener('keydown', onKey);
    if (newText !== node.text) {
      state.updateText(node.id, newText);
    }
  };
  const onKey = (ev) => {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      commit();
    } else if (ev.key === 'Escape') {
      ev.preventDefault();
      domEl.textContent = node.text || '';
      commit();
    }
  };
  domEl.addEventListener('blur', commit);
  domEl.addEventListener('keydown', onKey);
}

// ============================================================
// HOVER → breadcrumb preview
// ============================================================
let hoverTarget = null;
canvasRoot.addEventListener('mouseover', (e) => {
  const t = findEditableTarget(e.target);
  if (t !== hoverTarget) {
    hoverTarget = t;
  }
});

// ============================================================
// DROP HANDLING (from library)
// ============================================================
let dragTemplate = null;
let dragKind = null;        // 'library' | 'move'
let dragNodeId = null;      // when moving an existing node
let libDropTarget = null;   // computed flow target while dragging from library

export function setDragPayload(payload) {
  dragKind = payload.kind;
  dragTemplate = payload.template || null;
  dragNodeId = payload.nodeId || null;
}
export function clearDragPayload() {
  dragKind = null;
  dragTemplate = null;
  dragNodeId = null;
  clearDropIndicators();
}

function clearDropIndicators() {
  canvasRoot.querySelectorAll('[data-pc-drop-target="true"]').forEach(el =>
    el.removeAttribute('data-pc-drop-target'));
  canvasRoot.querySelectorAll('.drop-indicator').forEach(el => el.remove());
}

// Find nearest section ancestor to a point (for dropping non-section elements)
function findDropSection(target) {
  let el = target;
  while (el && el !== canvasRoot) {
    if (el.getAttribute && el.getAttribute('data-pc-type') === 'section') return el;
    el = el.parentElement;
  }
  return null;
}

// Where to insert a section based on Y position relative to existing sections
function findSectionInsertIndex(y) {
  const sections = canvasRoot.querySelectorAll(':scope > [data-pc-type="section"]');
  for (let i = 0; i < sections.length; i++) {
    const r = sections[i].getBoundingClientRect();
    if (y < r.top + r.height / 2) return i;
  }
  return sections.length;
}

canvasRoot.addEventListener('dragover', (e) => {
  if (!dragKind || !dragTemplate) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';

  clearDropIndicators();

  if (dragTemplate.type === 'section') {
    // Section: insertion line between top-level sections.
    showSectionInsertIndicator(findSectionInsertIndex(e.clientY));
  } else {
    // Element: precise flow insertion point inside the hovered container.
    const target = computeFlowTarget(e.clientX, e.clientY, null);
    libDropTarget = target;
    if (target) drawFlowIndicator(target.indicator);
    else {
      const section = findDropSection(e.target);
      if (section) section.setAttribute('data-pc-drop-target', 'true');
    }
  }
});

canvasRoot.addEventListener('dragleave', (e) => {
  // Only clear if leaving the canvas root
  if (e.target === canvasRoot) clearDropIndicators();
});

canvasRoot.addEventListener('drop', (e) => {
  if (!dragKind || !dragTemplate) return;
  e.preventDefault();

  if (dragTemplate.type === 'section') {
    state.addSection(dragTemplate.template, findSectionInsertIndex(e.clientY));
  } else {
    const target = libDropTarget || computeFlowTarget(e.clientX, e.clientY, null);
    if (target) {
      const parentNode = state.findNode(target.parentId);
      if (parentNode?.freeform) {
        const pe = canvasRoot.querySelector(`[data-pc-id="${target.parentId}"]`);
        const r = pe.getBoundingClientRect();
        state.addElement(target.parentId, dragTemplate.template,
          { x: Math.max(0, e.clientX - r.left), y: Math.max(0, e.clientY - r.top) });
      } else {
        state.addElement(target.parentId, dragTemplate.template, null, target.index);
      }
    } else {
      const sectionEl = findDropSection(e.target);
      if (sectionEl) {
        state.addElement(sectionEl.getAttribute('data-pc-id'), dragTemplate.template, null);
      } else {
        // No section under cursor — create a new section + add element.
        const sec = state.addSection(blankSection(), null);
        state.addElement(sec.id, dragTemplate.template, null);
      }
    }
  }
  clearDragPayload();
  libDropTarget = null;
});

function showSectionInsertIndicator(index) {
  const sections = canvasRoot.querySelectorAll(':scope > [data-pc-type="section"]');
  const ind = document.createElement('div');
  ind.className = 'drop-indicator';
  if (sections.length === 0) {
    canvasRoot.appendChild(ind);
    ind.style.top = '0';
    return;
  }
  if (index >= sections.length) {
    const last = sections[sections.length - 1];
    const rootRect = canvasRoot.getBoundingClientRect();
    const r = last.getBoundingClientRect();
    ind.style.top = `${r.bottom - rootRect.top - 1}px`;
  } else {
    const target = sections[index];
    const rootRect = canvasRoot.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    ind.style.top = `${r.top - rootRect.top - 1}px`;
  }
  canvasRoot.style.position = 'relative';
  canvasRoot.appendChild(ind);
}

function blankSection() {
  return {
    type: 'section', tag: 'section',
    attrs: { class: 'section' },
    styles: { padding: '60px 20px', minHeight: '300px', background: '#ffffff' },
    freeform: true, children: []
  };
}

// ============================================================
// FLOW TARGETING — find where a dragged node/template should land
// ============================================================
// Returns { parentId, index, indicator } or null. `indicator` is geometry
// relative to canvas-root used to draw the insertion line.
function computeFlowTarget(clientX, clientY, draggingId) {
  const draggingEl = draggingId ? canvasRoot.querySelector(`[data-pc-id="${draggingId}"]`) : null;
  const prevPE = draggingEl ? draggingEl.style.pointerEvents : null;
  if (draggingEl) draggingEl.style.pointerEvents = 'none'; // exclude from hit-test
  const stack = document.elementsFromPoint(clientX, clientY);
  if (draggingEl) draggingEl.style.pointerEvents = prevPE || '';

  let hovered = null;
  for (const el of stack) {
    const idEl = el.closest && el.closest('[data-pc-id]');
    if (!idEl || !canvasRoot.contains(idEl)) continue;
    if (draggingEl && (idEl === draggingEl || draggingEl.contains(idEl))) continue;
    hovered = idEl;
    break;
  }
  if (!hovered) return null;

  // Resolve the container we'll drop into.
  let containerEl = isContainerEl(hovered)
    ? hovered
    : (hovered.parentElement && hovered.parentElement.closest('[data-pc-id]'));
  if (!containerEl) containerEl = findDropSection(hovered);
  if (!containerEl || !canvasRoot.contains(containerEl)) return null;

  const parentId = containerEl.getAttribute('data-pc-id');
  const kids = Array.from(containerEl.children).filter(c =>
    c.getAttribute && c.getAttribute('data-pc-id') &&
    c !== draggingEl && !(draggingEl && draggingEl.contains(c)));

  const cs = getComputedStyle(containerEl);
  const isRow = (cs.display.includes('flex') && cs.flexDirection.startsWith('row')) ||
                cs.display.includes('grid');
  const rootRect = canvasRoot.getBoundingClientRect();

  // Empty container — drop inside, indicator centred near the top.
  if (kids.length === 0) {
    const cr = containerEl.getBoundingClientRect();
    return {
      parentId, index: 0,
      indicator: { x: cr.left - rootRect.left + 8, y: cr.top - rootRect.top + 8,
                   w: Math.max(20, cr.width - 16), h: 3, vertical: false }
    };
  }

  let index = kids.length;
  for (let i = 0; i < kids.length; i++) {
    const r = kids[i].getBoundingClientRect();
    const mid = isRow ? r.left + r.width / 2 : r.top + r.height / 2;
    const pos = isRow ? clientX : clientY;
    if (pos < mid) { index = i; break; }
  }

  let indicator;
  if (index >= kids.length) {
    const r = kids[kids.length - 1].getBoundingClientRect();
    indicator = isRow
      ? { x: r.right - rootRect.left, y: r.top - rootRect.top, w: 3, h: r.height, vertical: true }
      : { x: r.left - rootRect.left, y: r.bottom - rootRect.top, w: r.width, h: 3, vertical: false };
  } else {
    const r = kids[index].getBoundingClientRect();
    indicator = isRow
      ? { x: r.left - rootRect.left, y: r.top - rootRect.top, w: 3, h: r.height, vertical: true }
      : { x: r.left - rootRect.left, y: r.top - rootRect.top, w: r.width, h: 3, vertical: false };
  }
  return { parentId, index, indicator };
}

function drawFlowIndicator(ind) {
  clearDropIndicators();
  if (!ind) return;
  const el = document.createElement('div');
  el.className = 'drop-indicator' + (ind.vertical ? ' vertical' : '');
  el.style.left = `${ind.x}px`;
  el.style.top = `${ind.y}px`;
  el.style.width = `${ind.w}px`;
  el.style.height = `${ind.h}px`;
  el.style.right = 'auto';
  canvasRoot.style.position = 'relative';
  canvasRoot.appendChild(el);
}

// ============================================================
// POINTER DRAG — move existing nodes
//   'free'    → absolute reposition inside a freeform parent
//   'flow'    → reorder / move between flow containers
//   'section' → reorder top-level sections
// ============================================================
let activeDrag = null;

canvasRoot.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  const target = findEditableTarget(e.target);
  if (!target) return;
  const id = target.getAttribute('data-pc-id');
  if (id !== state.getSelection()) return;          // select first, then drag
  if (target.getAttribute('contenteditable') === 'true') return;
  const node = state.findNode(id);
  if (!node) return;
  const parent = state.findParent(id);

  let mode;
  if (node.type === 'section') mode = 'section';
  else if (parent && parent.freeform) mode = 'free';
  else if (parent) mode = 'flow';
  else return;

  activeDrag = { mode, id, el: target, startX: e.clientX, startY: e.clientY, moved: false };

  if (mode === 'free') {
    const parentEl = canvasRoot.querySelector(`[data-pc-id="${parent.id}"]`);
    if (!parentEl) { activeDrag = null; return; }
    const parentRect = parentEl.getBoundingClientRect();
    const elRect = target.getBoundingClientRect();
    activeDrag.startLeft = elRect.left - parentRect.left;
    activeDrag.startTop  = elRect.top  - parentRect.top;
    e.preventDefault();
  }
  // flow/section: no preventDefault, so a plain click still selects / edits;
  // the native text selection is cleared once a real drag begins.
});

window.addEventListener('mousemove', (e) => {
  if (!activeDrag) return;
  const dx = e.clientX - activeDrag.startX;
  const dy = e.clientY - activeDrag.startY;
  if (!activeDrag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
  if (!activeDrag.moved) {
    activeDrag.moved = true;
    activeDrag.el.setAttribute('data-pc-dragging', 'true');
    if (activeDrag.mode !== 'free') {
      document.body.classList.add('pc-dragging');
      document.body.style.cursor = 'grabbing';
    }
  }

  if (activeDrag.mode === 'free') {
    activeDrag.el.style.position = 'absolute';
    activeDrag.el.style.left = `${Math.max(0, activeDrag.startLeft + dx)}px`;
    activeDrag.el.style.top  = `${Math.max(0, activeDrag.startTop + dy)}px`;
  } else if (activeDrag.mode === 'section') {
    window.getSelection()?.removeAllRanges();
    activeDrag.sectionIndex = findSectionInsertIndex(e.clientY);
    clearDropIndicators();
    showSectionInsertIndicator(activeDrag.sectionIndex);
  } else { // flow
    window.getSelection()?.removeAllRanges();
    activeDrag.target = computeFlowTarget(e.clientX, e.clientY, activeDrag.id);
    drawFlowIndicator(activeDrag.target ? activeDrag.target.indicator : null);
  }
});

window.addEventListener('mouseup', () => {
  if (!activeDrag) return;
  const d = activeDrag;
  activeDrag = null;
  d.el.removeAttribute('data-pc-dragging');
  document.body.classList.remove('pc-dragging');
  document.body.style.cursor = '';
  if (!d.moved) { clearDropIndicators(); return; }

  if (d.mode === 'free') {
    state.updateStyle(d.id, 'position', 'absolute');
    state.updateStyle(d.id, 'left', `${parseInt(d.el.style.left, 10)}px`);
    state.updateStyle(d.id, 'top',  `${parseInt(d.el.style.top, 10)}px`);
  } else if (d.mode === 'section') {
    clearDropIndicators();
    if (typeof d.sectionIndex === 'number') {
      state.moveSectionToIndex(d.id, d.sectionIndex);
      state.setSelection(d.id);
    }
  } else { // flow
    clearDropIndicators();
    if (d.target) state.moveNodeTo(d.id, d.target.parentId, d.target.index);
  }
});

// ============================================================
// BREADCRUMB (context bar handles its own positioning)
// ============================================================
function updateToolbar(_el) { /* context-bar.js handles this now */ }

function updateBreadcrumb(id) {
  if (!id) {
    breadcrumb.textContent = 'body';
    return;
  }
  const path = state.pathTo(id);
  breadcrumb.textContent = path.map(n => {
    const cls = n.attrs?.class ? `.${n.attrs.class.split(' ')[0]}` : '';
    return `${n.tag}${cls}`;
  }).join(' › ');
}

// Reposition on scroll/resize handled by context-bar
const viewport = document.getElementById('canvas-viewport');
if (viewport) {
  viewport.addEventListener('scroll', () => {
    const id = state.getSelection();
    if (!id) return;
    const el = canvasRoot.querySelector(`[data-pc-id="${id}"]`);
    if (el) updateToolbar(el);
  });
}
window.addEventListener('resize', () => {
  const id = state.getSelection();
  if (!id) return;
  const el = canvasRoot.querySelector(`[data-pc-id="${id}"]`);
  if (el) updateToolbar(el);
});

// Re-render on state changes
state.subscribe((event) => {
  if (event === 'selection') {
    // Optimization: just update selection visuals + toolbar
    canvasRoot.querySelectorAll('[data-pc-selected="true"]')
              .forEach(e => e.removeAttribute('data-pc-selected'));
    const id = state.getSelection();
    if (id) {
      const el = canvasRoot.querySelector(`[data-pc-id="${id}"]`);
      if (el) {
        el.setAttribute('data-pc-selected', 'true');
        updateToolbar(el);
      }
    } else {
      updateToolbar(null);
    }
    updateBreadcrumb(id);
  } else if (event === 'view' || event === 'device') {
    updateToolbar(null);
  } else {
    render();
  }
});
