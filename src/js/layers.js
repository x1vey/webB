// ===== Layers Panel =====
// Hierarchical tree view of the project. Click to select. Hover for actions.
// Guard: if #layers-tree doesn't exist (new UI), this module is a no-op.

import * as state from './state.js';
import { icon, iconForNode } from './icons.js';

const tree = document.getElementById('layers-tree');
if (!tree) {
  // Layers panel not present in current UI layout — nothing to do.
} else {
  const collapsed = new Set(); // ids whose children are hidden

  const nodeLabel = (node) => {
    const cls = node.attrs?.class ? `.${node.attrs.class.split(' ')[0]}` : '';
    const id  = node.attrs?.id ? `#${node.attrs.id}` : '';
    const text = node.text ? `"${node.text.slice(0, 22)}${node.text.length > 22 ? '…' : ''}"` : '';
    return { tag: node.tag + id + cls, text };
  };

  const escapeHtml = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const renderRow = (node, depth, selId) => {
    const wrap = document.createElement('div');

    const row = document.createElement('div');
    row.className = 'layer-row' + (node.id === selId ? ' selected' : '');
    row.style.paddingLeft = `${8 + depth * 14}px`;
    row.dataset.id = node.id;

    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsed.has(node.id);

    const caret = document.createElement('span');
    caret.className = 'caret' + (hasChildren ? '' : ' empty');
    caret.innerHTML = hasChildren ? icon(isCollapsed ? 'chevronRight' : 'chevronDown') : '';
    caret.title = 'Expand/collapse';
    caret.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!hasChildren) return;
      if (isCollapsed) collapsed.delete(node.id);
      else collapsed.add(node.id);
      render();
    });

    const ic = document.createElement('span');
    ic.className = 'icon';
    ic.innerHTML = icon(iconForNode(node));

    const label = nodeLabel(node);
    const name = document.createElement('span');
    name.className = 'name';
    name.innerHTML = `<span class="ntag">${escapeHtml(label.tag)}</span>` +
                     (label.text ? `<span class="ntext">${escapeHtml(label.text)}</span>` : '');

    const actions = document.createElement('span');
    actions.className = 'actions';
    actions.innerHTML = `
      <button title="Duplicate" data-act="dup">${icon('copy')}</button>
      <button title="Delete"   data-act="del">${icon('trash')}</button>
    `;
    actions.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      e.stopPropagation();
      if (btn.dataset.act === 'dup') state.duplicateNode(node.id);
      else if (btn.dataset.act === 'del') state.deleteNode(node.id);
    });

    row.appendChild(caret);
    row.appendChild(ic);
    row.appendChild(name);
    row.appendChild(actions);
    row.addEventListener('click', () => state.setSelection(node.id));
    wrap.appendChild(row);

    if (hasChildren && !isCollapsed) {
      const childWrap = document.createElement('div');
      childWrap.className = 'layer-children';
      for (const child of node.children) {
        childWrap.appendChild(renderRow(child, depth + 1, selId));
      }
      wrap.appendChild(childWrap);
    }
    return wrap;
  };

  const render = () => {
    tree.innerHTML = '';
    const sections = state.getSections();
    if (!sections.length) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:20px 12px;font-size:11px;color:var(--text-faint);text-align:center';
      empty.textContent = 'No layers yet';
      tree.appendChild(empty);
      return;
    }
    const selId = state.getSelection();
    for (const section of sections) {
      tree.appendChild(renderRow(section, 0, selId));
    }
  };

  state.subscribe(() => render());

  // Collapse-all button (optional)
  const collapseAllBtn = document.getElementById('btn-collapse-layers');
  if (collapseAllBtn) {
    collapseAllBtn.addEventListener('click', () => {
      const hasExpanded = (nodes) => {
        for (const n of nodes) {
          if (n.children?.length && !collapsed.has(n.id)) return true;
          if (n.children && hasExpanded(n.children)) return true;
        }
        return false;
      };
      const setAll = (nodes, value) => {
        for (const n of nodes) {
          if (n.children?.length) {
            if (value) collapsed.add(n.id); else collapsed.delete(n.id);
            setAll(n.children, value);
          }
        }
      };
      setAll(state.getSections(), hasExpanded(state.getSections()));
      render();
    });
  }

  render();
}
