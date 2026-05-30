// ===== Properties + Content Panels =====
// Right-panel forms that drive the selected node's styles and attributes.

import * as state from './state.js';
import { icon } from './icons.js';

// Per-section-title collapsed state (persists between selections)
const collapsedSections = new Set(['Advanced (raw CSS)', 'Position']);

const paneProps = document.getElementById('pane-properties');
const paneContent = document.getElementById('pane-content');
const rightTabs = document.querySelectorAll('.right-tab');
const tabPanes = document.querySelectorAll('.tab-pane');

// Tab switching
rightTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const which = tab.dataset.tab;
    state.setRightTab(which);
    rightTabs.forEach(t => t.classList.toggle('active', t === tab));
    tabPanes.forEach(p => p.classList.toggle('active', p.dataset.pane === which));
  });
});

// ============================================================
// Properties (Style) pane
// ============================================================
function renderProperties() {
  const id = state.getSelection();
  if (!id) {
    paneProps.innerHTML = '<div class="no-selection"><p>Select an element on the canvas to edit its style.</p></div>';
    return;
  }
  const node = state.findNode(id);
  if (!node) {
    paneProps.innerHTML = '<div class="no-selection"><p>Element not found.</p></div>';
    return;
  }
  paneProps.innerHTML = '';
  paneProps.appendChild(typographySection(node));
  paneProps.appendChild(layoutSection(node));
  paneProps.appendChild(spacingSection(node));
  paneProps.appendChild(backgroundSection(node));
  paneProps.appendChild(borderSection(node));
  paneProps.appendChild(positionSection(node));
  paneProps.appendChild(advancedSection(node));
}

function s(node, key, fallback = '') {
  return node.styles?.[key] ?? fallback;
}

// Helper: build a collapsible section with rows
function section(title, rows) {
  const sec = document.createElement('div');
  sec.className = 'prop-section';
  if (collapsedSections.has(title)) sec.classList.add('collapsed');

  const head = document.createElement('div');
  head.className = 'prop-section-head';
  head.innerHTML = `<h4>${title}</h4><span class="caret">${icon('chevronDown')}</span>`;
  head.addEventListener('click', () => {
    sec.classList.toggle('collapsed');
    if (sec.classList.contains('collapsed')) collapsedSections.add(title);
    else collapsedSections.delete(title);
  });

  const body = document.createElement('div');
  body.className = 'prop-section-body';
  rows.forEach(r => body.appendChild(r));

  sec.appendChild(head);
  sec.appendChild(body);
  return sec;
}

function row(label, ...inputs) {
  const r = document.createElement('div');
  r.className = 'prop-row';
  const l = document.createElement('label');
  l.textContent = label;
  r.appendChild(l);
  inputs.forEach(i => r.appendChild(i));
  return r;
}

function textInput(value, onChange, placeholder = '') {
  const i = document.createElement('input');
  i.type = 'text';
  i.className = 'prop-input';
  i.value = value || '';
  i.placeholder = placeholder;
  i.addEventListener('change', () => onChange(i.value));
  return i;
}

function colorInput(value, onChange) {
  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.gap = '6px';
  wrap.style.flex = '1';

  const c = document.createElement('input');
  c.type = 'color';
  c.className = 'prop-color';
  // Color input only accepts hex; try to set from value
  const hex = toHex(value);
  if (hex) c.value = hex;
  c.addEventListener('input', () => onChange(c.value));

  const t = document.createElement('input');
  t.type = 'text';
  t.className = 'prop-input';
  t.value = value || '';
  t.placeholder = '#000000';
  t.addEventListener('change', () => {
    onChange(t.value);
    const hx = toHex(t.value);
    if (hx) c.value = hx;
  });

  wrap.appendChild(c);
  wrap.appendChild(t);
  return wrap;
}

function selectInput(value, options, onChange) {
  const s = document.createElement('select');
  s.className = 'prop-select';
  for (const opt of options) {
    const o = document.createElement('option');
    o.value = typeof opt === 'string' ? opt : opt.value;
    o.textContent = typeof opt === 'string' ? opt : opt.label;
    s.appendChild(o);
  }
  s.value = value || '';
  s.addEventListener('change', () => onChange(s.value));
  return s;
}

function toHex(value) {
  if (!value) return null;
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return '#' + value.slice(1).split('').map(c => c+c).join('');
  }
  // Try parse rgb
  const m = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) {
    const r = parseInt(m[1]).toString(16).padStart(2, '0');
    const g = parseInt(m[2]).toString(16).padStart(2, '0');
    const b = parseInt(m[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return null;
}

function setStyle(id, key, value) { state.updateStyle(id, key, value); }

// === Sections ===
function typographySection(node) {
  return section('Typography', [
    row('Font size', textInput(s(node, 'fontSize'), v => setStyle(node.id, 'fontSize', v), 'e.g. 16px')),
    row('Weight', selectInput(s(node, 'fontWeight', '400'), ['100','200','300','400','500','600','700','800','900'],
      v => setStyle(node.id, 'fontWeight', v))),
    row('Color', colorInput(s(node, 'color'), v => setStyle(node.id, 'color', v))),
    row('Align', selectInput(s(node, 'textAlign', 'left'), ['left','center','right','justify'],
      v => setStyle(node.id, 'textAlign', v))),
    row('Line height', textInput(s(node, 'lineHeight'), v => setStyle(node.id, 'lineHeight', v), 'e.g. 1.5')),
    row('Font family', textInput(s(node, 'fontFamily'), v => setStyle(node.id, 'fontFamily', v), 'sans-serif'))
  ]);
}

function layoutSection(node) {
  return section('Layout', [
    row('Display', selectInput(s(node, 'display', ''), ['','block','inline','inline-block','flex','grid','none'],
      v => setStyle(node.id, 'display', v))),
    row('Width', textInput(s(node, 'width'), v => setStyle(node.id, 'width', v), 'e.g. 100% / 200px')),
    row('Height', textInput(s(node, 'height'), v => setStyle(node.id, 'height', v), 'auto')),
    row('Max width', textInput(s(node, 'maxWidth'), v => setStyle(node.id, 'maxWidth', v))),
    row('Gap', textInput(s(node, 'gap'), v => setStyle(node.id, 'gap', v), 'flex/grid only')),
    row('Justify', selectInput(s(node, 'justifyContent', ''),
      ['','flex-start','center','flex-end','space-between','space-around','space-evenly'],
      v => setStyle(node.id, 'justifyContent', v))),
    row('Align', selectInput(s(node, 'alignItems', ''),
      ['','stretch','flex-start','center','flex-end','baseline'],
      v => setStyle(node.id, 'alignItems', v)))
  ]);
}

function spacingSection(node) {
  return section('Spacing', [
    row('Padding', textInput(s(node, 'padding'), v => setStyle(node.id, 'padding', v), '20px or 10px 20px')),
    row('Margin', textInput(s(node, 'margin'), v => setStyle(node.id, 'margin', v), '0 auto'))
  ]);
}

function backgroundSection(node) {
  return section('Background', [
    row('Color', colorInput(s(node, 'background'), v => setStyle(node.id, 'background', v))),
    row('Image', textInput(s(node, 'backgroundImage'), v => setStyle(node.id, 'backgroundImage', v), 'url(...) or gradient')),
    row('Size', selectInput(s(node, 'backgroundSize', ''),
      ['','cover','contain','auto','100% 100%'],
      v => setStyle(node.id, 'backgroundSize', v))),
    row('Position', textInput(s(node, 'backgroundPosition'), v => setStyle(node.id, 'backgroundPosition', v), 'center'))
  ]);
}

function borderSection(node) {
  return section('Border', [
    row('Border', textInput(s(node, 'border'), v => setStyle(node.id, 'border', v), '1px solid #ddd')),
    row('Radius', textInput(s(node, 'borderRadius'), v => setStyle(node.id, 'borderRadius', v), '8px')),
    row('Shadow', textInput(s(node, 'boxShadow'), v => setStyle(node.id, 'boxShadow', v), '0 1px 3px rgba(0,0,0,0.1)'))
  ]);
}

function positionSection(node) {
  return section('Position', [
    row('Mode', selectInput(s(node, 'position', ''),
      ['','static','relative','absolute','fixed','sticky'],
      v => setStyle(node.id, 'position', v))),
    row('Top', textInput(s(node, 'top'), v => setStyle(node.id, 'top', v))),
    row('Left', textInput(s(node, 'left'), v => setStyle(node.id, 'left', v))),
    row('Right', textInput(s(node, 'right'), v => setStyle(node.id, 'right', v))),
    row('Bottom', textInput(s(node, 'bottom'), v => setStyle(node.id, 'bottom', v))),
    row('Z-index', textInput(s(node, 'zIndex'), v => setStyle(node.id, 'zIndex', v)))
  ]);
}

function advancedSection(node) {
  const title = 'Advanced (raw CSS)';
  const sec = document.createElement('div');
  sec.className = 'prop-section' + (collapsedSections.has(title) ? ' collapsed' : '');
  const head = document.createElement('div');
  head.className = 'prop-section-head';
  head.innerHTML = `<h4>${title}</h4><span class="caret">${icon('chevronDown')}</span>`;
  head.addEventListener('click', () => {
    sec.classList.toggle('collapsed');
    if (sec.classList.contains('collapsed')) collapsedSections.add(title);
    else collapsedSections.delete(title);
  });
  sec.appendChild(head);
  const body = document.createElement('div');
  body.className = 'prop-section-body';
  sec.appendChild(body);
  const ta = document.createElement('textarea');
  ta.className = 'prop-input';
  ta.rows = 4;
  ta.style.fontFamily = 'var(--font-mono)';
  ta.style.fontSize = '11px';
  ta.style.minHeight = '80px';
  ta.placeholder = 'opacity: 0.9;\ntransform: rotate(2deg);';
  // Show styles NOT already represented as raw key:value lines
  const known = new Set(['fontSize','fontWeight','color','textAlign','lineHeight','fontFamily',
    'display','width','height','maxWidth','gap','justifyContent','alignItems',
    'padding','margin','background','backgroundImage','backgroundSize','backgroundPosition',
    'border','borderRadius','boxShadow','position','top','left','right','bottom','zIndex']);
  const extra = node.styles
    ? Object.entries(node.styles).filter(([k]) => !known.has(k))
        .map(([k, v]) => `${camelToKebab(k)}: ${v};`).join('\n')
    : '';
  ta.value = extra;
  ta.addEventListener('change', () => {
    // Strip existing extras
    if (node.styles) {
      for (const k of Object.keys(node.styles)) {
        if (!known.has(k)) state.updateStyle(node.id, k, '');
      }
    }
    // Parse new ones
    const lines = ta.value.split(/[\n;]/);
    for (const line of lines) {
      const m = line.match(/^\s*([a-z\-]+)\s*:\s*(.+?)\s*$/i);
      if (m) {
        state.updateStyle(node.id, kebabToCamel(m[1]), m[2]);
      }
    }
  });
  body.appendChild(ta);
  return sec;
}

function camelToKebab(s) { return s.replace(/([A-Z])/g, '-$1').toLowerCase(); }
function kebabToCamel(s) { return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); }

// ============================================================
// Content pane
// ============================================================
function renderContent() {
  const id = state.getSelection();
  if (!id) {
    paneContent.innerHTML = '<div class="no-selection"><p>Select an element to edit its text or content.</p></div>';
    return;
  }
  const node = state.findNode(id);
  if (!node) return;

  paneContent.innerHTML = '';
  paneContent.appendChild(tagSection(node));
  paneContent.appendChild(textSection(node));
  paneContent.appendChild(attrSection(node));
}

function tagSection(node) {
  const allowed = ['div','section','article','header','footer','main','nav','aside',
    'h1','h2','h3','h4','h5','h6','p','span','a','button','img','input'];
  return section('Tag', [
    row('Element', selectInput(node.tag, allowed, v => state.updateNode(node.id, { tag: v }))),
    row('ID', textInput(node.attrs?.id || '', v => state.updateAttr(node.id, 'id', v))),
    row('Class', textInput(node.attrs?.class || '', v => state.updateAttr(node.id, 'class', v)))
  ]);
}

// Custom section wrapper (for sections that build their own body content)
function customSection(title) {
  const sec = document.createElement('div');
  sec.className = 'prop-section' + (collapsedSections.has(title) ? ' collapsed' : '');
  const head = document.createElement('div');
  head.className = 'prop-section-head';
  head.innerHTML = `<h4>${title}</h4><span class="caret">${icon('chevronDown')}</span>`;
  head.addEventListener('click', () => {
    sec.classList.toggle('collapsed');
    if (sec.classList.contains('collapsed')) collapsedSections.add(title);
    else collapsedSections.delete(title);
  });
  const body = document.createElement('div');
  body.className = 'prop-section-body';
  sec.appendChild(head);
  sec.appendChild(body);
  return { sec, body };
}

function textSection(node) {
  const { sec, body } = customSection('Text content');
  if (node.children && node.children.length) {
    const note = document.createElement('div');
    note.style.fontSize = '11px';
    note.style.color = 'var(--text-faint)';
    note.textContent = 'This element has child elements; text content is disabled.';
    body.appendChild(note);
  } else {
    const ta = document.createElement('textarea');
    ta.className = 'prop-input';
    ta.rows = 4;
    ta.style.minHeight = '80px';
    ta.value = node.text || '';
    ta.addEventListener('change', () => state.updateText(node.id, ta.value));
    body.appendChild(ta);
  }
  return sec;
}

function attrSection(node) {
  const { sec, body } = customSection('Attributes');

  // Common attrs by tag
  const common = {
    'a':     ['href', 'target', 'rel'],
    'img':   ['src', 'alt'],
    'input': ['type', 'placeholder', 'name', 'value']
  };
  const list = common[node.tag] || [];
  for (const k of list) {
    body.appendChild(row(k, textInput(node.attrs?.[k] || '', v => state.updateAttr(node.id, k, v))));
  }

  // Custom attrs (already-set keys not in common list and not id/class)
  const extras = Object.entries(node.attrs || {})
    .filter(([k]) => !list.includes(k) && k !== 'id' && k !== 'class');
  for (const [k, v] of extras) {
    body.appendChild(row(k, textInput(v, val => state.updateAttr(node.id, k, val))));
  }

  // Add-custom row
  const addWrap = document.createElement('div');
  addWrap.className = 'prop-row';
  const keyIn = document.createElement('input');
  keyIn.className = 'prop-input';
  keyIn.placeholder = 'attribute';
  const valIn = document.createElement('input');
  valIn.className = 'prop-input';
  valIn.placeholder = 'value';
  const addBtn = document.createElement('button');
  addBtn.className = 'ghost-btn small';
  addBtn.textContent = '+';
  addBtn.addEventListener('click', () => {
    if (keyIn.value.trim()) {
      state.updateAttr(node.id, keyIn.value.trim(), valIn.value);
      keyIn.value = ''; valIn.value = '';
    }
  });
  addWrap.appendChild(keyIn);
  addWrap.appendChild(valIn);
  addWrap.appendChild(addBtn);
  body.appendChild(addWrap);

  return sec;
}

// ============================================================
// Render on state changes
// ============================================================
state.subscribe((event) => {
  if (event === 'selection' || event === 'update-node' || event === 'update-style'
      || event === 'update-attr' || event === 'update-text'
      || event === 'replace-project' || event === 'replace-sections'
      || event === 'undo' || event === 'redo') {
    renderProperties();
    renderContent();
  }
});

// Initial
renderProperties();
renderContent();
