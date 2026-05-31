// ===== Theme Switcher =====
// Three themes: Coral, Indigo (default), Rose
// Applied via CSS custom properties on :root, persisted to localStorage.

const THEME_DEFS = {
  coral: {
    label: 'Coral',
    swatch: 'linear-gradient(135deg, oklch(0.64 0.16 32), oklch(0.73 0.13 48))',
    vars: {
      '--bg': 'oklch(0.992 0.003 40)',
      '--bg-tint': 'oklch(0.975 0.011 42)',
      '--surface': '#ffffff',
      '--surface-2': 'oklch(0.978 0.006 45)',
      '--text': 'oklch(0.26 0.02 32)',
      '--text-dim': 'oklch(0.5 0.022 36)',
      '--text-faint': 'oklch(0.68 0.018 40)',
      '--border': 'oklch(0.925 0.007 45)',
      '--border-strong': 'oklch(0.88 0.011 45)',
      '--accent': 'oklch(0.63 0.16 33)',
      '--accent-2': 'oklch(0.72 0.13 50)',
      '--accent-soft': 'oklch(0.955 0.022 42)',
      '--accent-ring': 'oklch(0.63 0.16 33 / 0.3)',
      '--accent-contrast': '#ffffff',
      '--shadow-color': '24 22% 48%',
    }
  },
  indigo: {
    label: 'Indigo',
    swatch: 'linear-gradient(135deg, oklch(0.56 0.17 275), oklch(0.64 0.15 298))',
    vars: {
      '--bg': 'oklch(0.992 0.003 275)',
      '--bg-tint': 'oklch(0.974 0.01 275)',
      '--surface': '#ffffff',
      '--surface-2': 'oklch(0.977 0.006 275)',
      '--text': 'oklch(0.27 0.028 278)',
      '--text-dim': 'oklch(0.5 0.028 278)',
      '--text-faint': 'oklch(0.68 0.022 278)',
      '--border': 'oklch(0.925 0.009 275)',
      '--border-strong': 'oklch(0.88 0.013 275)',
      '--accent': 'oklch(0.55 0.17 275)',
      '--accent-2': 'oklch(0.64 0.15 298)',
      '--accent-soft': 'oklch(0.955 0.02 278)',
      '--accent-ring': 'oklch(0.55 0.17 275 / 0.3)',
      '--accent-contrast': '#ffffff',
      '--shadow-color': '265 28% 54%',
    }
  },
  rose: {
    label: 'Rose',
    swatch: 'linear-gradient(135deg, oklch(0.6 0.16 5), oklch(0.69 0.13 350))',
    vars: {
      '--bg': 'oklch(0.992 0.003 350)',
      '--bg-tint': 'oklch(0.975 0.01 350)',
      '--surface': '#ffffff',
      '--surface-2': 'oklch(0.978 0.006 350)',
      '--text': 'oklch(0.27 0.024 350)',
      '--text-dim': 'oklch(0.5 0.026 350)',
      '--text-faint': 'oklch(0.68 0.02 350)',
      '--border': 'oklch(0.925 0.009 350)',
      '--border-strong': 'oklch(0.88 0.013 350)',
      '--accent': 'oklch(0.6 0.16 6)',
      '--accent-2': 'oklch(0.69 0.13 350)',
      '--accent-soft': 'oklch(0.955 0.02 353)',
      '--accent-ring': 'oklch(0.6 0.16 6 / 0.3)',
      '--accent-contrast': '#ffffff',
      '--shadow-color': '350 26% 54%',
    }
  }
};

const THEME_KEYS = Object.keys(THEME_DEFS);
const STORAGE_KEY = 'pc_theme';

let currentTheme = localStorage.getItem(STORAGE_KEY) || 'indigo';

export function applyTheme(name) {
  if (!THEME_KEYS.includes(name)) return;
  currentTheme = name;
  localStorage.setItem(STORAGE_KEY, name);

  const root = document.documentElement;
  const vars = THEME_DEFS[name].vars;
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }

  // Sync all .dir-switch dot groups
  document.querySelectorAll('.dir-chip[data-theme]').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.theme === name);
  });
}

export function getCurrentTheme() { return currentTheme; }

function populateSwitches() {
  document.querySelectorAll('.dir-switch').forEach(sw => {
    if (sw.querySelector('.dir-chip')) return; // already populated
    // Add label
    const label = document.createElement('span');
    label.className = 'dlabel';
    label.textContent = 'Theme';
    sw.appendChild(label);
    // Add dots
    for (const [key, def] of Object.entries(THEME_DEFS)) {
      const chip = document.createElement('button');
      chip.className = 'dir-chip' + (key === currentTheme ? ' active' : '');
      chip.dataset.theme = key;
      chip.title = def.label;
      chip.style.background = def.swatch;
      chip.addEventListener('click', () => applyTheme(key));
      sw.appendChild(chip);
    }
  });
}

export function initTheme() {
  populateSwitches();
  applyTheme(currentTheme);
}
