// ===== Chat Panel =====
// Renders chat messages, typing indicator, quick-action chips,
// and handles user input with intent detection.

import * as state from './state.js';
import { render } from './canvas-engine.js';
import { toast } from './toast.js';
import { getPrompt } from './screens.js';

const QUICK_ACTIONS = [
  'Make it bolder',
  'Add an FAQ section',
  'Change colour scheme',
  'Add a testimonials section',
  'Make the hero taller',
  'Simplify the copy',
];

const AI_RESPONSES = [
  "Done! I've updated that for you. What else would you like to change?",
  "Great choice! The section has been added. Anything else you'd like to tweak?",
  "Applied! The page is looking sharp. Want me to adjust anything else?",
  "Sure, I've made that change. Let me know if you want to go further.",
  "That looks much better now! Would you like me to refine anything else?",
];

let _log = null;
let _input = null;
let _sendBtn = null;
let _initialized = false;

function randomResponse() {
  return AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
}

function autoGrow(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ---- Render a chat message ----
export function appendMessage(role, text, chips = []) {
  if (!_log) return;

  const wrapper = document.createElement('div');
  wrapper.className = `chat-msg ${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.textContent = text;
  wrapper.appendChild(bubble);

  if (chips.length > 0) {
    const chipsEl = document.createElement('div');
    chipsEl.className = 'chat-chips';
    chips.forEach(label => {
      const btn = document.createElement('button');
      btn.className = 'chat-chip';
      btn.type = 'button';
      btn.textContent = label;
      btn.addEventListener('click', () => handleUserMessage(label));
      chipsEl.appendChild(btn);
    });
    wrapper.appendChild(chipsEl);
  }

  const meta = document.createElement('div');
  meta.className = 'chat-meta';
  meta.textContent = now();
  wrapper.appendChild(meta);

  _log.appendChild(wrapper);
  _log.scrollTop = _log.scrollHeight;
  return wrapper;
}

// ---- Typing indicator ----
function showTyping() {
  const el = document.createElement('div');
  el.className = 'chat-msg ai';
  el.id = 'chat-typing';
  el.innerHTML = `
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>`;
  _log.appendChild(el);
  _log.scrollTop = _log.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById('chat-typing');
  if (el) el.remove();
}

// ---- Intent detection ----
function detectIntent(text) {
  const t = text.toLowerCase();
  if (/\bfaq\b/.test(t)) return 'add-faq';
  if (/testimonial/.test(t)) return 'add-testimonials';
  if (/pricing/.test(t)) return 'add-pricing';
  if (/hero/.test(t) && /(taller|bigger|larger)/.test(t)) return 'resize-hero';
  if (/(bold|bolder|stronger)/.test(t)) return 'make-bold';
  if (/(colour|color|scheme|palette)/.test(t)) return 'change-color';
  if (/(simplif|shorter|concise)/.test(t)) return 'simplify';
  return 'generic';
}

// ---- Handle a user message ----
async function handleUserMessage(text) {
  if (!text.trim()) return;
  appendMessage('user', text);
  if (_input) { _input.value = ''; _input.style.height = ''; }
  if (_sendBtn) _sendBtn.disabled = true;

  showTyping();

  // Simulate AI "thinking"
  await new Promise(r => setTimeout(r, 900 + Math.random() * 600));
  hideTyping();

  const intent = detectIntent(text);

  // Apply rough intent effects on the actual project
  const sections = state.getSections();
  let acted = false;

  if (intent === 'add-faq' && sections.length > 0) {
    // Add a placeholder FAQ section
    state.addSection({
      type: 'section',
      tag: 'section',
      attrs: { class: 'faq-section' },
      styles: { padding: '80px 40px', background: '#fafafa' },
      children: [
        { type: 'element', tag: 'h2', text: 'Frequently Asked Questions', styles: { fontSize: '32px', fontWeight: '700', marginBottom: '40px', textAlign: 'center' }, children: [] },
        { type: 'element', tag: 'div', styles: { maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }, children: [
          { type: 'element', tag: 'div', styles: { padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }, children: [
            { type: 'element', tag: 'h3', text: 'How does it work?', styles: { fontSize: '16px', fontWeight: '600', marginBottom: '8px' }, children: [] },
            { type: 'element', tag: 'p', text: 'Our platform makes it simple to get started. Just sign up, follow the onboarding steps, and you\'ll be up and running in minutes.', styles: { color: '#6b7280', lineHeight: '1.6' }, children: [] },
          ]},
        ]},
      ]
    });
    render();
    acted = true;
  } else if (intent === 'add-testimonials' && sections.length > 0) {
    state.addSection({
      type: 'section',
      tag: 'section',
      attrs: { class: 'testimonials-section' },
      styles: { padding: '80px 40px', background: '#fff' },
      children: [
        { type: 'element', tag: 'h2', text: 'What our customers say', styles: { fontSize: '32px', fontWeight: '700', marginBottom: '48px', textAlign: 'center' }, children: [] },
        { type: 'element', tag: 'div', styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '900px', margin: '0 auto' }, children: [
          { type: 'element', tag: 'blockquote', styles: { padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }, children: [
            { type: 'element', tag: 'p', text: '"This product has completely changed how our team works. Absolutely love it."', styles: { fontStyle: 'italic', color: '#374151', marginBottom: '16px', lineHeight: '1.6' }, children: [] },
            { type: 'element', tag: 'cite', text: '— Sarah K., Head of Design', styles: { fontStyle: 'normal', fontWeight: '600', fontSize: '14px', color: '#6b7280' }, children: [] },
          ]},
        ]},
      ]
    });
    render();
    acted = true;
  }

  appendMessage('ai', randomResponse(), acted ? [] : QUICK_ACTIONS.slice(0, 3));
  if (_sendBtn) _sendBtn.disabled = false;
}

// ---- Initial welcome message ----
function showWelcome() {
  const prompt = getPrompt();
  const short = prompt ? `"${prompt.slice(0, 60)}${prompt.length > 60 ? '…' : ''}"` : 'your project';
  appendMessage('ai',
    `I've built ${short}. You can click any element to edit it directly, or ask me to make changes here.`,
    QUICK_ACTIONS.slice(0, 4)
  );
}

// ---- Init ----
export function initChat() {
  _log     = document.getElementById('chat-log');
  _input   = document.getElementById('chat-input');
  _sendBtn = document.getElementById('chat-send');

  if (!_log || !_input || !_sendBtn) return;

  // Auto-grow textarea
  _input.addEventListener('input', () => {
    autoGrow(_input);
    _sendBtn.disabled = !_input.value.trim();
  });

  // Submit on Enter (Shift+Enter = newline)
  _input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!_sendBtn.disabled) _sendBtn.click();
    }
  });

  _sendBtn.addEventListener('click', () => {
    const text = _input.value.trim();
    if (text) handleUserMessage(text);
  });

  // Show welcome when builder screen is first shown
  const builderScreen = document.getElementById('screen-builder');
  if (builderScreen) {
    const observer = new MutationObserver(() => {
      if (!builderScreen.hidden && !_initialized) {
        _initialized = true;
        setTimeout(showWelcome, 600);
      }
    });
    observer.observe(builderScreen, { attributes: true, attributeFilter: ['hidden'] });
    if (!builderScreen.hidden && !_initialized) {
      _initialized = true;
      setTimeout(showWelcome, 600);
    }
  }
}

// Re-export for use in app.js
export { appendMessage as chatMessage };
