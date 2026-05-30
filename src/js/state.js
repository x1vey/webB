// ===== Project State =====
// The single source of truth for the user's project.
// Pure data + observer pattern. No DOM here.

const STORAGE_KEY = 'pagecraft.project';
const HISTORY_LIMIT = 50;

let _project = blankProject();
let _selection = null;          // id of selected node, or null
let _view = 'design';            // 'design' | 'code' | 'preview'
let _device = 'desktop';         // 'desktop' | 'tablet' | 'mobile'
let _activeRightTab = 'properties';
let _activeCodeLang = 'html';

const _history = [];             // past snapshots
const _future = [];              // redo snapshots
const _listeners = new Set();

let _idCounter = 0;
export function uid(prefix = 'n') {
  _idCounter++;
  return `${prefix}_${Date.now().toString(36)}${_idCounter.toString(36)}`;
}

function blankProject() {
  return {
    name: 'Untitled Project',
    sections: [],
    globalCSS: '/* Add custom CSS here */\n',
    globalJS: '// Add custom JavaScript here\n',
    meta: { created: Date.now(), modified: Date.now() }
  };
}

// ===== Observer =====
export function subscribe(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
function notify(event = 'change') {
  _project.meta.modified = Date.now();
  _listeners.forEach(fn => {
    try { fn(event); } catch (e) { console.error('listener error', e); }
  });
}

// ===== Getters =====
export const getProject  = () => _project;
export const getSections = () => _project.sections;
export const getSelection = () => _selection;
export const getView     = () => _view;
export const getDevice   = () => _device;
export const getRightTab = () => _activeRightTab;
export const getCodeLang = () => _activeCodeLang;

export function findNode(id, root = _project.sections) {
  for (const node of root) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findNode(id, node.children);
      if (found) return found;
    }
  }
  return null;
}

export function findParent(id, root = _project.sections, parent = null) {
  for (const node of root) {
    if (node.id === id) return parent;
    if (node.children?.length) {
      const found = findParent(id, node.children, node);
      if (found !== null) return found;
    }
  }
  return null;
}

// Returns array of nodes from root to the node with `id`, inclusive.
export function pathTo(id) {
  const path = [];
  function walk(arr, trail) {
    for (const node of arr) {
      const next = [...trail, node];
      if (node.id === id) { path.push(...next); return true; }
      if (node.children?.length && walk(node.children, next)) return true;
    }
    return false;
  }
  walk(_project.sections, []);
  return path;
}

// ===== Setters (with history) =====
export function setProjectName(name) {
  pushHistory();
  _project.name = name;
  notify('project-name');
}

export function setSelection(id) {
  if (_selection === id) return;
  _selection = id;
  notify('selection');
}

export function setView(view) {
  if (_view === view) return;
  _view = view;
  notify('view');
}

export function setDevice(device) {
  if (_device === device) return;
  _device = device;
  notify('device');
}

export function setRightTab(tab) {
  _activeRightTab = tab;
  notify('right-tab');
}

export function setCodeLang(lang) {
  _activeCodeLang = lang;
  notify('code-lang');
}

// ===== Mutations =====

// Create a new node from a library template (deep clone with fresh ids)
export function instantiateTemplate(template) {
  const clone = JSON.parse(JSON.stringify(template));
  function reid(node) {
    node.id = uid(node.type === 'section' ? 'sec' : 'el');
    if (node.children) node.children.forEach(reid);
  }
  reid(clone);
  return clone;
}

export function addSection(template, index = null) {
  pushHistory();
  const section = instantiateTemplate(template);
  section.type = 'section';
  if (index === null || index > _project.sections.length) {
    _project.sections.push(section);
  } else {
    _project.sections.splice(index, 0, section);
  }
  _selection = section.id;
  notify('add-section');
  return section;
}

export function addElement(parentId, template, position = null, index = null) {
  pushHistory();
  const parent = parentId ? findNode(parentId) : null;
  if (!parent) {
    // No parent specified - create a default section and add inside
    const section = addSection(defaultSection(), null);
    return addElement(section.id, template, position, index);
  }
  const el = instantiateTemplate(template);
  el.type = el.type || 'element';
  if (!parent.children) parent.children = [];
  // Apply freeform positioning if the section is freeform
  if (parent.freeform && position) {
    el.styles = el.styles || {};
    el.styles.position = 'absolute';
    el.styles.left = `${position.x}px`;
    el.styles.top  = `${position.y}px`;
    parent.children.push(el);
  } else if (index !== null && index >= 0 && index <= parent.children.length) {
    parent.children.splice(index, 0, el);
  } else {
    parent.children.push(el);
  }
  _selection = el.id;
  notify('add-element');
  return el;
}

export function updateNode(id, patch) {
  const node = findNode(id);
  if (!node) return;
  pushHistory();
  Object.assign(node, patch);
  notify('update-node');
}

export function updateStyle(id, key, value) {
  const node = findNode(id);
  if (!node) return;
  pushHistory();
  node.styles = node.styles || {};
  if (value === '' || value === null || value === undefined) {
    delete node.styles[key];
  } else {
    node.styles[key] = value;
  }
  notify('update-style');
}

export function updateAttr(id, key, value) {
  const node = findNode(id);
  if (!node) return;
  pushHistory();
  node.attrs = node.attrs || {};
  if (value === '' || value === null || value === undefined) {
    delete node.attrs[key];
  } else {
    node.attrs[key] = value;
  }
  notify('update-attr');
}

export function updateText(id, text) {
  const node = findNode(id);
  if (!node) return;
  pushHistory();
  node.text = text;
  notify('update-text');
}

export function moveNode(id, direction) {
  const parent = findParent(id);
  const arr = parent ? parent.children : _project.sections;
  const idx = arr.findIndex(n => n.id === id);
  if (idx < 0) return;
  const newIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (newIdx < 0 || newIdx >= arr.length) return;
  pushHistory();
  const [node] = arr.splice(idx, 1);
  arr.splice(newIdx, 0, node);
  notify('move-node');
}

export function deleteNode(id) {
  const parent = findParent(id);
  const arr = parent ? parent.children : _project.sections;
  const idx = arr.findIndex(n => n.id === id);
  if (idx < 0) return;
  pushHistory();
  arr.splice(idx, 1);
  if (_selection === id) _selection = null;
  notify('delete-node');
}

export function duplicateNode(id) {
  const parent = findParent(id);
  const arr = parent ? parent.children : _project.sections;
  const idx = arr.findIndex(n => n.id === id);
  if (idx < 0) return;
  pushHistory();
  const copy = instantiateTemplate(arr[idx]);
  arr.splice(idx + 1, 0, copy);
  _selection = copy.id;
  notify('duplicate-node');
  return copy;
}

export function setGlobalCSS(css) {
  pushHistory();
  _project.globalCSS = css;
  notify('global-css');
}

export function setGlobalJS(js) {
  pushHistory();
  _project.globalJS = js;
  notify('global-js');
}

// Replace the entire sections array (used by code-edit re-parse and import)
export function replaceSections(sections) {
  pushHistory();
  _project.sections = sections;
  _selection = null;
  notify('replace-sections');
}

// Move a top-level section to a new index
export function moveSectionToIndex(id, toIdx) {
  const fromIdx = _project.sections.findIndex(s => s.id === id);
  if (fromIdx < 0) return;
  let target = toIdx;
  if (target > fromIdx) target--;
  if (target < 0 || target >= _project.sections.length || target === fromIdx) return;
  pushHistory();
  const [node] = _project.sections.splice(fromIdx, 1);
  _project.sections.splice(target, 0, node);
  notify('move-section');
}

// True if `candidateId` is `rootId` itself or nested anywhere inside it.
function isSelfOrDescendant(rootId, candidateId) {
  if (rootId === candidateId) return true;
  const root = findNode(rootId);
  if (!root || !root.children) return false;
  return findNode(candidateId, root.children) !== null;
}

// Move any node into a new parent (or top-level when newParentId is null) at an
// index. This powers drag-and-drop reordering across containers/sections.
export function moveNodeTo(id, newParentId, index = null) {
  const node = findNode(id);
  if (!node) return false;
  // Never drop a node into itself or one of its own descendants.
  if (newParentId && isSelfOrDescendant(id, newParentId)) return false;

  const fromParent = findParent(id);
  const fromArr = fromParent ? fromParent.children : _project.sections;
  const fromIdx = fromArr.findIndex(n => n.id === id);
  if (fromIdx < 0) return false;

  const newParent = newParentId ? findNode(newParentId) : null;
  if (newParentId && !newParent) return false;
  const toArr = newParent ? (newParent.children || (newParent.children = [])) : _project.sections;

  let target = (index == null) ? toArr.length : index;
  pushHistory();
  const [moved] = fromArr.splice(fromIdx, 1);
  // Removing an earlier item from the same array shifts later indices down one.
  if (fromArr === toArr && fromIdx < target) target--;
  target = Math.max(0, Math.min(target, toArr.length));
  toArr.splice(target, 0, moved);

  // Leaving a freeform parent for a flow container: drop stale absolute coords
  // so the node flows naturally instead of being pinned off-screen.
  if (moved.type !== 'section' && (!newParent || !newParent.freeform) && moved.styles) {
    for (const k of ['position', 'left', 'top', 'right', 'bottom']) delete moved.styles[k];
  }

  _selection = moved.id;
  notify('move-node');
  return true;
}

// Replace whole project (load from file/storage)
export function replaceProject(project) {
  _project = project;
  _selection = null;
  _history.length = 0;
  _future.length = 0;
  notify('replace-project');
}

// ===== History =====
function snapshot() {
  return JSON.stringify({ p: _project });
}
function restore(snap) {
  const data = JSON.parse(snap);
  _project = data.p;
}
function pushHistory() {
  _history.push(snapshot());
  if (_history.length > HISTORY_LIMIT) _history.shift();
  _future.length = 0;
}
export function undo() {
  if (!_history.length) return false;
  _future.push(snapshot());
  restore(_history.pop());
  _selection = null;
  notify('undo');
  return true;
}
export function redo() {
  if (!_future.length) return false;
  _history.push(snapshot());
  restore(_future.pop());
  _selection = null;
  notify('redo');
  return true;
}
export const canUndo = () => _history.length > 0;
export const canRedo = () => _future.length > 0;

// ===== Persistence =====
export function saveLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_project));
    return true;
  } catch (e) {
    console.error('save failed', e);
    return false;
  }
}
export function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    _project = JSON.parse(raw);
    notify('load');
    return true;
  } catch (e) {
    console.error('load failed', e);
    return false;
  }
}

// ===== Default templates (used when needed by other modules) =====
export function defaultSection() {
  return {
    type: 'section',
    tag: 'section',
    attrs: { class: 'section' },
    styles: { padding: '60px 20px', minHeight: '300px', background: '#ffffff' },
    freeform: true,
    children: []
  };
}

// Expose for debugging and future AI integration
if (typeof window !== 'undefined') {
  window.Pagecraft = window.Pagecraft || {};
  window.Pagecraft.state = {
    getProject, getSelection, getView, getDevice, findNode, findParent, pathTo,
    setProjectName, setSelection, setView, setDevice,
    addSection, addElement,
    updateNode, updateStyle, updateAttr, updateText,
    moveNode, moveNodeTo, moveSectionToIndex, deleteNode, duplicateNode,
    setGlobalCSS, setGlobalJS,
    undo, redo, canUndo, canRedo,
    saveLocal, loadLocal,
    replaceSections, replaceProject,
    subscribe
  };
}
