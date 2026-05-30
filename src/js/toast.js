// Simple toast notifications.
const stack = document.getElementById('toast-stack');

export function toast(message, variant = 'success', duration = 2400) {
  const el = document.createElement('div');
  el.className = `toast ${variant}`;
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .2s, transform .2s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(4px)';
    setTimeout(() => el.remove(), 250);
  }, duration);
}
