// ===== Start Screen =====
// Typewriter placeholder, composer logic, chips, template cards, submit.

import { showScreen, setPrompt } from './screens.js';

const EXAMPLE_PROMPTS = [
  'A SaaS landing page for a project management tool aimed at remote teams',
  'A portfolio site for a freelance photographer with a dark moody aesthetic',
  'A launch page for a meditation mobile app with calm, minimalist design',
  'A pricing page for a B2B analytics platform with 3 tiers',
  'A landing page for a coffee subscription startup with hero, features, and FAQ',
  'A fitness coaching site with testimonials, program breakdown, and booking CTA',
];

const TEMPLATES = [
  { name: 'SaaS Launch',     cat: 'Product',  color: '#6366f1' },
  { name: 'Portfolio',       cat: 'Creative', color: '#ec4899' },
  { name: 'Startup Landing', cat: 'Business', color: '#f59e0b' },
  { name: 'App Promo',       cat: 'Mobile',   color: '#10b981' },
  { name: 'Agency',          cat: 'Services', color: '#8b5cf6' },
  { name: 'E-Commerce',      cat: 'Store',    color: '#ef4444' },
];

// ---- Typewriter effect ----
let twIndex = 0;
let twTimer = null;

function typewriter(el, text, speed = 38) {
  return new Promise(resolve => {
    el.placeholder = '';
    let i = 0;
    const type = () => {
      if (i <= text.length) {
        el.placeholder = text.slice(0, i) + (i < text.length ? '|' : '');
        i++;
        twTimer = setTimeout(type, speed);
      } else {
        el.placeholder = text;
        resolve();
      }
    };
    type();
  });
}

async function cycleTypewriter(el) {
  while (true) {
    await typewriter(el, EXAMPLE_PROMPTS[twIndex % EXAMPLE_PROMPTS.length]);
    await pause(2400);
    // Erase
    let text = el.placeholder;
    while (text.length > 0) {
      text = text.slice(0, -1);
      el.placeholder = text;
      await pause(18);
    }
    await pause(300);
    twIndex++;
  }
}

function pause(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---- Chips ----
function buildChips(container, textarea, sendBtn) {
  const short = [
    'Coffee subscription startup',
    'Freelance photographer portfolio',
    'SaaS pricing page with 3 tiers',
    'Productivity app launch page',
    'Remote team management tool',
    'Yoga studio booking site',
  ];
  short.forEach(label => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.type = 'button';
    chip.textContent = label;
    chip.addEventListener('click', () => {
      textarea.value = label;
      textarea.focus();
      sendBtn.disabled = false;
      autoGrow(textarea);
    });
    container.appendChild(chip);
  });
}

// ---- Templates ----
function buildTemplates(container) {
  TEMPLATES.forEach(t => {
    const card = document.createElement('div');
    card.className = 'tpl-card';
    card.innerHTML = `
      <div class="tpl-thumb" style="background:${t.color}18;">
        <div class="tpl-thumb-inner">
          <div class="tpl-t1" style="background:${t.color};opacity:0.8"></div>
          <div class="tpl-t2"></div>
          <div class="tpl-t3"></div>
        </div>
      </div>
      <div class="tpl-info">
        <div class="tpl-name">${t.name}</div>
        <div class="tpl-cat">${t.cat}</div>
      </div>`;
    card.addEventListener('click', () => {
      triggerGenerate(`A ${t.name.toLowerCase()} landing page with a modern, professional design`);
    });
    container.appendChild(card);
  });
}

// ---- Auto-grow textarea ----
function autoGrow(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 220) + 'px';
}

// ---- Trigger generation ----
function triggerGenerate(prompt) {
  if (!prompt.trim()) return;
  setPrompt(prompt.trim());
  showScreen('generating');
  // The generating screen's init() will pick up the prompt and start
}

// ---- Init ----
export function initStartScreen() {
  const textarea = document.getElementById('composer-input');
  const sendBtn  = document.getElementById('composer-send');
  const chipsEl  = document.getElementById('example-chips');
  const tplGrid  = document.getElementById('tpl-grid');

  if (!textarea) return;

  // Auto-grow
  textarea.addEventListener('input', () => {
    autoGrow(textarea);
    sendBtn.disabled = !textarea.value.trim();
  });

  // Submit on Enter (Shift+Enter = newline)
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) sendBtn.click();
    }
  });

  sendBtn.addEventListener('click', () => {
    const prompt = textarea.value.trim();
    if (prompt) triggerGenerate(prompt);
  });

  // Chips
  if (chipsEl) buildChips(chipsEl, textarea, sendBtn);

  // Templates
  if (tplGrid) buildTemplates(tplGrid);

  // Typewriter (only when textarea is empty and not focused)
  if (textarea) {
    textarea.addEventListener('focus', () => {
      clearTimeout(twTimer);
      if (!textarea.value) textarea.placeholder = 'Describe your landing page…';
    });
    textarea.addEventListener('blur', () => {
      if (!textarea.value) {
        setTimeout(() => cycleTypewriter(textarea), 600);
      }
    });
    cycleTypewriter(textarea);
  }
}
