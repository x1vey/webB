// Runtime icon hydration — replaces `<span data-icon="name">` placeholders
// with inline SVGs from icons.js.
import { icon } from './icons.js';

export function hydrateIcons(root) {
  if (!root) root = document.body;
  root.querySelectorAll('[data-icon]').forEach((el) => {
    if (el.dataset.iconRendered) return;
    const name = el.dataset.icon;
    el.innerHTML = icon(name);
    el.dataset.iconRendered = '1';
  });
}
