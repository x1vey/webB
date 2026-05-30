// ===== Popover utility =====
// Lightweight floating panel anchored to a trigger element.
// Auto-closes on outside click or Escape.

const root = document.getElementById('popover-root');
let _active = null;

export function showPopover({ anchor, content, onClose, placement = 'bottom-start' }) {
  closePopover();

  const pop = document.createElement('div');
  pop.className = 'popover';
  if (typeof content === 'string') pop.innerHTML = content;
  else pop.appendChild(content);
  root.appendChild(pop);

  // Position relative to viewport
  const r = anchor.getBoundingClientRect();
  const popRect = pop.getBoundingClientRect();
  const margin = 6;

  let left, top;
  if (placement.startsWith('bottom')) {
    top = r.bottom + margin;
  } else {
    top = r.top - popRect.height - margin;
  }
  if (placement.endsWith('end')) {
    left = r.right - popRect.width;
  } else if (placement.endsWith('center')) {
    left = r.left + r.width/2 - popRect.width/2;
  } else {
    left = r.left;
  }
  // Clamp to viewport
  left = Math.max(8, Math.min(left, window.innerWidth - popRect.width - 8));
  top  = Math.max(8, Math.min(top,  window.innerHeight - popRect.height - 8));

  pop.style.left = `${Math.round(left)}px`;
  pop.style.top  = `${Math.round(top)}px`;

  // Outside click / Escape
  const onDocClick = (e) => {
    if (!pop.contains(e.target) && !anchor.contains(e.target)) closePopover();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); closePopover(); }
  };
  // Defer to next tick so the click that opened doesn't close immediately
  setTimeout(() => document.addEventListener('mousedown', onDocClick), 0);
  document.addEventListener('keydown', onKey);

  _active = {
    el: pop,
    close: () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
      pop.remove();
      _active = null;
      onClose?.();
    }
  };
  return _active;
}

export function closePopover() {
  if (_active) _active.close();
}

export function isPopoverOpen() {
  return _active !== null;
}
