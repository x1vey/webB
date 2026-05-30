// ===== Serializer =====
// Two-way conversion between the project tree and real HTML/CSS strings.
//   nodeToHTML(node)   → string of HTML for that node (recursive)
//   htmlToNodes(html)  → array of nodes (each top-level child becomes a section)

import { uid } from './state.js';

// ---------- to HTML ----------
export function projectToHTML(sections) {
  return sections.map(s => nodeToHTML(s, 0)).join('\n');
}

const VOID_TAGS = new Set(['area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr']);

export function nodeToHTML(node, indent = 0) {
  const pad = '  '.repeat(indent);
  const tag = node.tag || 'div';
  const attrs = serializeAttrs(node);
  const styleAttr = serializeInlineStyle(node);
  const openAttrs = [attrs, styleAttr].filter(Boolean).join(' ');
  const open = `<${tag}${openAttrs ? ' ' + openAttrs : ''}>`;
  if (VOID_TAGS.has(tag)) return pad + `<${tag}${openAttrs ? ' ' + openAttrs : ''}>`;
  if (node.children && node.children.length) {
    const inner = node.children.map(c => nodeToHTML(c, indent + 1)).join('\n');
    return `${pad}${open}\n${inner}\n${pad}</${tag}>`;
  }
  if (node.text !== undefined && node.text !== null) {
    return `${pad}${open}${escapeText(node.text)}</${tag}>`;
  }
  return `${pad}${open}</${tag}>`;
}

function serializeAttrs(node) {
  if (!node.attrs) return '';
  return Object.entries(node.attrs)
    .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
    .join(' ');
}

function serializeInlineStyle(node) {
  if (!node.styles) return '';
  const parts = Object.entries(node.styles).map(([k, v]) => `${camelToKebab(k)}: ${v}`);
  if (!parts.length) return '';
  return `style="${escapeAttr(parts.join('; '))}"`;
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function escapeText(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function camelToKebab(s) {
  return s.replace(/([A-Z])/g, '-$1').toLowerCase();
}
function kebabToCamel(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

// ---------- from HTML ----------
// Parse an HTML string into a list of section nodes.
// Top-level children become sections; everything below becomes elements.
export function htmlToSections(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="__root__">${html}</div>`, 'text/html');
  const root = doc.getElementById('__root__');
  if (!root) return [];
  const sections = [];
  for (const child of Array.from(root.children)) {
    sections.push(domToNode(child, true));
  }
  return sections;
}

// Parse one element (could be entire fragment) into a node.
export function htmlToNode(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="__root__">${html}</div>`, 'text/html');
  const root = doc.getElementById('__root__');
  if (!root || !root.firstElementChild) return null;
  return domToNode(root.firstElementChild, false);
}

function domToNode(el, isTopLevel) {
  const node = {
    id: uid(isTopLevel ? 'sec' : 'el'),
    type: isTopLevel ? 'section' : 'element',
    tag: el.tagName.toLowerCase(),
    attrs: {},
    styles: {}
  };
  // Mark freeform for top-level if there's no obvious flex/grid layout
  if (isTopLevel) node.freeform = true;

  // Attributes
  for (const attr of Array.from(el.attributes)) {
    if (attr.name === 'style') {
      node.styles = parseInlineStyle(attr.value);
    } else {
      node.attrs[attr.name] = attr.value;
    }
  }
  if (Object.keys(node.attrs).length === 0) delete node.attrs;
  if (Object.keys(node.styles).length === 0) delete node.styles;

  // Children
  if (el.children.length) {
    node.children = Array.from(el.children).map(c => domToNode(c, false));
  } else {
    const text = el.textContent.trim();
    if (text) node.text = text;
  }
  return node;
}

function parseInlineStyle(str) {
  const out = {};
  if (!str) return out;
  for (const decl of str.split(';')) {
    const m = decl.match(/^\s*([a-z\-]+)\s*:\s*(.+?)\s*$/i);
    if (m) out[kebabToCamel(m[1])] = m[2];
  }
  return out;
}

// ---------- Build a full standalone HTML document for export/preview ----------
export function buildExportHTML(project, { cssHref = 'styles.css', jsSrc = 'script.js' } = {}) {
  const body = project.sections.map(s => nodeToHTML(s, 1)).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeText(project.name || 'My Page')}</title>
  <link rel="stylesheet" href="${cssHref}">
</head>
<body>
${body}
  <script src="${jsSrc}"></script>
</body>
</html>
`;
}

export function buildExportCSS(project) {
  return `/* Reset */
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.5; color: #111; }
img { max-width: 100%; display: block; }

/* Project CSS */
${project.globalCSS || ''}
`;
}

export function buildExportJS(project) {
  return project.globalJS || '';
}
