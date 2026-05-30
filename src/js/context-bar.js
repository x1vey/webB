// ===== Context Bar =====
// Rich floating toolbar above the selected element.
// All editing happens here — there's no separate properties form.
// Changes flow straight to state, which updates the canvas and code panels.

import * as state from './state.js';
import { icon } from './icons.js';
import { showPopover, closePopover } from './popover.js';

const bar = document.getElementById('context-bar');
const canvasRoot = document.getElementById('canvas-root');
const TEXT_TAGS = new Set(['h1','h2','h3','h4','h5','h6','p','a','span','button','label','li','small','strong','em','blockquote']);
const ELEMENT_TAGS = ['div','section','article','header','footer','main','nav','aside',
                      'h1','h2','h3','h4','h5','h6','p','span','a','button','img','input'];

let _currentEl = null;

state.subscribe((event) => {
  // Hide while doing a drag (would interfere visually)
  if (event === 'selection' || event === 'replace-project' || event === 'replace-sections') {
    closePopover();
  }
  syncBar();
});

const viewport = document.getElementById('canvas-viewport');
viewport.addEventListener('scroll', repositionBar);
window.addEventListener('resize', repositionBar);

// Hide in non-design view modes
const moView = new MutationObserver(() => {
  const view = document.body.getAttribute('data-view');
  if (view === 'preview' || view === 'code') { bar.hidden = true; closePopover(); }
  else syncBar();
});
moView.observe(document.body, { attributes: true, attributeFilter: ['data-view'] });

// =====================================================================
// Build / sync
// =====================================================================
function syncBar() {
  const id = state.getSelection();
  if (!id) { bar.hidden = true; _currentEl = null; return; }
  const node = state.findNode(id);
  const el = canvasRoot.querySelector(`[data-pc-id="${id}"]`);
  if (!node || !el) { bar.hidden = true; _currentEl = null; return; }
  _currentEl = el;
  buildBar(node);
  bar.hidden = false;
  repositionBar();
}

function repositionBar() {
  if (!_currentEl || bar.hidden) return;
  const r = _currentEl.getBoundingClientRect();
  const barRect = bar.getBoundingClientRect();
  let top = r.top - barRect.height - 8;
  if (top < 60) top = r.bottom + 8;       // flip below if no room above
  let left = r.left + r.width/2 - barRect.width/2;
  left = Math.max(8, Math.min(left, window.innerWidth - barRect.width - 8));
  bar.style.left = `${Math.round(left)}px`;
  bar.style.top  = `${Math.round(top)}px`;
}

// =====================================================================
// Bar contents
// =====================================================================
function buildBar(node) {
  bar.innerHTML = '';
  const isSection = node.type === 'section';
  const isText = TEXT_TAGS.has(node.tag);
  const isVoid = node.tag === 'img' || node.tag === 'input' || node.tag === 'br' || node.tag === 'hr';

  // --- Tag changer (skip for sections) ---
  if (!isSection) {
    bar.appendChild(tagSelect(node));
    bar.appendChild(sep());
  }

  // --- Text controls (font size, weight, italic, align) ---
  if (isText || (!isVoid && node.text !== undefined)) {
    bar.appendChild(fontSizeControl(node));
    bar.appendChild(weightToggle(node));
    bar.appendChild(italicToggle(node));
    bar.appendChild(alignSelect(node));
    bar.appendChild(textColorSwatch(node));
    bar.appendChild(sep());
  }

  // --- Background color ---
  if (!isVoid || node.tag === 'input') {
    bar.appendChild(bgColorSwatch(node));
  }

  // --- Padding (block-level only) ---
  if (!isVoid) {
    bar.appendChild(paddingControl(node));
  }

  // --- Radius ---
  bar.appendChild(radiusControl(node));

  bar.appendChild(sep());

  // --- Structural actions ---
  bar.appendChild(actionBtn('copy', 'Duplicate (Ctrl+D)', () => state.duplicateNode(node.id)));
  bar.appendChild(actionBtn('arrowUp', 'Move up', () => state.moveNode(node.id, 'up')));
  bar.appendChild(actionBtn('arrowDown', 'Move down', () => state.moveNode(node.id, 'down')));
  bar.appendChild(actionBtn('trash', 'Delete', () => state.deleteNode(node.id), 'danger'));
}

// =====================================================================
// Individual controls
// =====================================================================
function sep() {
  const s = document.createElement('span');
  s.className = 'cb-sep';
  return s;
}

function actionBtn(iconName, title, onClick, variant = '') {
  const b = document.createElement('button');
  b.className = 'cb-btn' + (variant ? ' ' + variant : '');
  b.title = title;
  b.innerHTML = icon(iconName);
  b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
  return b;
}

function tagSelect(node) {
  const wrap = document.createElement('div');
  wrap.className = 'cb-select-wrap';
  const sel = document.createElement('select');
  sel.className = 'cb-select';
  sel.title = 'Change tag';
  for (const t of ELEMENT_TAGS) {
    const o = document.createElement('option');
    o.value = t; o.textContent = t;
    sel.appendChild(o);
  }
  sel.value = node.tag;
  sel.addEventListener('change', () => {
    state.updateNode(node.id, { tag: sel.value });
  });
  wrap.appendChild(sel);
  return wrap;
}

function fontSizeControl(node) {
  const wrap = document.createElement('div');
  wrap.className = 'cb-num';

  const dec = document.createElement('button');
  dec.className = 'cb-num-btn';
  dec.textContent = '−';
  dec.title = 'Smaller';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'cb-num-input';
  input.title = 'Font size';
  input.value = pxNum(node.styles?.fontSize, '');
  input.placeholder = '—';

  const inc = document.createElement('button');
  inc.className = 'cb-num-btn';
  inc.textContent = '+';
  inc.title = 'Larger';

  const apply = (v) => {
    const num = parseInt(v, 10);
    if (Number.isFinite(num) && num > 0) {
      state.updateStyle(node.id, 'fontSize', `${num}px`);
    }
  };

  dec.addEventListener('click', () => {
    const cur = parseInt(input.value, 10) || 16;
    input.value = Math.max(8, cur - 1);
    apply(input.value);
  });
  inc.addEventListener('click', () => {
    const cur = parseInt(input.value, 10) || 16;
    input.value = cur + 1;
    apply(input.value);
  });
  input.addEventListener('change', () => apply(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp')   { e.preventDefault(); inc.click(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); dec.click(); }
  });

  wrap.appendChild(dec);
  wrap.appendChild(input);
  wrap.appendChild(inc);
  return wrap;
}

function weightToggle(node) {
  const b = document.createElement('button');
  b.className = 'cb-btn bold';
  b.title = 'Bold';
  const cur = parseInt(node.styles?.fontWeight, 10) || 400;
  if (cur >= 600) b.classList.add('active');
  b.innerHTML = '<span style="font-weight:700">B</span>';
  b.addEventListener('click', () => {
    const cur = parseInt(node.styles?.fontWeight, 10) || 400;
    state.updateStyle(node.id, 'fontWeight', cur >= 600 ? '400' : '700');
  });
  return b;
}

function italicToggle(node) {
  const b = document.createElement('button');
  b.className = 'cb-btn italic';
  b.title = 'Italic';
  if (node.styles?.fontStyle === 'italic') b.classList.add('active');
  b.innerHTML = '<span style="font-style:italic;font-family:serif">I</span>';
  b.addEventListener('click', () => {
    const cur = node.styles?.fontStyle;
    state.updateStyle(node.id, 'fontStyle', cur === 'italic' ? '' : 'italic');
  });
  return b;
}

function alignSelect(node) {
  const wrap = document.createElement('div');
  wrap.className = 'cb-aligns';
  const current = node.styles?.textAlign || 'left';
  const aligns = [
    { v: 'left',   t: 'Left',   svg: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>' },
    { v: 'center', t: 'Center', svg: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>' },
    { v: 'right',  t: 'Right',  svg: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/>' }
  ];
  for (const a of aligns) {
    const b = document.createElement('button');
    b.className = 'cb-btn small' + (current === a.v ? ' active' : '');
    b.title = `Align ${a.t}`;
    b.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${a.svg}</svg>`;
    b.addEventListener('click', () => state.updateStyle(node.id, 'textAlign', a.v));
    wrap.appendChild(b);
  }
  return wrap;
}

function textColorSwatch(node) {
  return colorSwatchControl(node, 'color', 'Text color', '#111111');
}
function bgColorSwatch(node) {
  return colorSwatchControl(node, 'background', 'Background', 'transparent');
}

function colorSwatchControl(node, styleKey, title, defaultValue) {
  const b = document.createElement('button');
  b.className = 'cb-swatch';
  b.title = title;
  const cur = node.styles?.[styleKey] || defaultValue;
  const inner = document.createElement('span');
  inner.className = 'cb-swatch-inner';
  inner.style.background = cur === 'transparent' || !cur
    ? 'repeating-conic-gradient(#ccc 0 25%, #fff 0 50%) 50%/8px 8px'
    : cur;
  b.appendChild(inner);
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    openColorPopover(b, node, styleKey);
  });
  return b;
}

function paddingControl(node) {
  const b = document.createElement('button');
  b.className = 'cb-btn';
  b.title = 'Padding';
  b.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>';
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    openPaddingPopover(b, node);
  });
  return b;
}

function radiusControl(node) {
  const wrap = document.createElement('div');
  wrap.className = 'cb-num';
  wrap.title = 'Border radius';

  const ic = document.createElement('span');
  ic.className = 'cb-num-prefix';
  ic.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 21V8a5 5 0 0 1 5-5h13"/></svg>';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'cb-num-input narrow';
  input.value = pxNum(node.styles?.borderRadius, '');
  input.placeholder = '0';
  input.addEventListener('change', () => {
    const v = parseInt(input.value, 10);
    state.updateStyle(node.id, 'borderRadius', Number.isFinite(v) ? `${v}px` : '');
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp')   { e.preventDefault(); const c = parseInt(input.value, 10)||0; input.value = c+1; input.dispatchEvent(new Event('change')); }
    if (e.key === 'ArrowDown') { e.preventDefault(); const c = parseInt(input.value, 10)||0; input.value = Math.max(0, c-1); input.dispatchEvent(new Event('change')); }
  });

  wrap.appendChild(ic);
  wrap.appendChild(input);
  return wrap;
}

function pxNum(val, fallback = '') {
  if (!val) return fallback;
  const m = String(val).match(/^(-?\d+(?:\.\d+)?)/);
  return m ? m[1] : fallback;
}

// =====================================================================
// Popovers
// =====================================================================
function openColorPopover(anchor, node, styleKey) {
  const wrap = document.createElement('div');
  wrap.className = 'pop-color';

  const cur = node.styles?.[styleKey] || '';
  const colorIn = document.createElement('input');
  colorIn.type = 'color';
  colorIn.className = 'pop-color-picker';
  colorIn.value = toHex(cur) || '#ffffff';

  const hexIn = document.createElement('input');
  hexIn.type = 'text';
  hexIn.className = 'pop-color-hex';
  hexIn.value = cur;
  hexIn.placeholder = '#000000 / rgb() / transparent';

  const swatches = document.createElement('div');
  swatches.className = 'pop-color-swatches';
  const presets = [
    '#000000','#ffffff','#6366f1','#8b5cf6','#ec4899','#ef4444',
    '#f59e0b','#10b981','#3b82f6','#0ea5e9','#64748b','#f3f4f6',
    'transparent'
  ];
  for (const c of presets) {
    const s = document.createElement('button');
    s.className = 'pop-color-swatch';
    s.title = c;
    s.style.background = c === 'transparent'
      ? 'repeating-conic-gradient(#ccc 0 25%, #fff 0 50%) 50%/6px 6px'
      : c;
    s.addEventListener('click', () => {
      state.updateStyle(node.id, styleKey, c);
      hexIn.value = c;
      if (c !== 'transparent') colorIn.value = c;
    });
    swatches.appendChild(s);
  }

  colorIn.addEventListener('input', () => {
    state.updateStyle(node.id, styleKey, colorIn.value);
    hexIn.value = colorIn.value;
  });
  hexIn.addEventListener('change', () => {
    state.updateStyle(node.id, styleKey, hexIn.value);
    const hx = toHex(hexIn.value);
    if (hx) colorIn.value = hx;
  });

  const clearBtn = document.createElement('button');
  clearBtn.className = 'pop-btn';
  clearBtn.textContent = 'Clear';
  clearBtn.addEventListener('click', () => {
    state.updateStyle(node.id, styleKey, '');
    closePopover();
  });

  const head = document.createElement('div');
  head.className = 'pop-row';
  head.appendChild(colorIn);
  head.appendChild(hexIn);

  wrap.appendChild(head);
  wrap.appendChild(swatches);
  wrap.appendChild(clearBtn);
  showPopover({ anchor, content: wrap });
}

function openPaddingPopover(anchor, node) {
  const wrap = document.createElement('div');
  wrap.className = 'pop-padding';

  // Parse current padding shorthand into [top, right, bottom, left]
  const cur = parseSides(node.styles?.padding || '0');
  const labels = ['T','R','B','L'];
  const keys = ['top','right','bottom','left'];
  const inputs = [];
  const head = document.createElement('div');
  head.className = 'pop-padding-title';
  head.textContent = 'Padding';
  wrap.appendChild(head);

  const grid = document.createElement('div');
  grid.className = 'pop-padding-grid';
  for (let i = 0; i < 4; i++) {
    const cell = document.createElement('label');
    cell.className = 'pop-padding-cell ' + keys[i];
    const span = document.createElement('span');
    span.textContent = labels[i];
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.value = cur[i];
    inp.placeholder = '0';
    inp.addEventListener('change', commit);
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp')   { e.preventDefault(); inp.value = (parseInt(inp.value, 10)||0)+1; commit(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); inp.value = Math.max(0,(parseInt(inp.value, 10)||0)-1); commit(); }
    });
    inputs.push(inp);
    cell.appendChild(span);
    cell.appendChild(inp);
    grid.appendChild(cell);
  }
  wrap.appendChild(grid);

  function commit() {
    const vals = inputs.map(i => `${parseInt(i.value, 10) || 0}px`);
    // Use shorthand if all equal
    const allEq = vals.every(v => v === vals[0]);
    state.updateStyle(node.id, 'padding', allEq ? vals[0] : vals.join(' '));
  }

  showPopover({ anchor, content: wrap });
}

function parseSides(value) {
  const parts = String(value).trim().split(/\s+/).map(p => parseInt(p, 10) || 0);
  if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]];
  if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]];
  if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]];
  return [parts[0], parts[1], parts[2], parts[3]];
}

function toHex(value) {
  if (!value) return null;
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return ('#' + value.slice(1).split('').map(c => c+c).join('')).toLowerCase();
  }
  const m = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) {
    return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
  }
  return null;
}

// Initial
syncBar();
