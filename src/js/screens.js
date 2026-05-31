// ===== Screen Flow Controller =====
// Manages Start → Generating → Builder transitions.
// Persists current screen + prompt to localStorage.

const SCREENS = ['start', 'generating', 'builder'];
let currentScreen = localStorage.getItem('pc_screen') || 'start';
let currentPrompt = localStorage.getItem('pc_prompt') || '';

export function showScreen(name) {
  if (!SCREENS.includes(name)) return;
  currentScreen = name;
  localStorage.setItem('pc_screen', name);
  SCREENS.forEach(s => {
    const el = document.getElementById('screen-' + s);
    if (el) el.hidden = (s !== name);
  });
}

export function getCurrentScreen() { return currentScreen; }
export function getPrompt() { return currentPrompt; }
export function setPrompt(p) { currentPrompt = p; localStorage.setItem('pc_prompt', p); }

// Initialize: show whatever screen is saved, or start by default
export function initScreens() {
  // Always start on the start screen on fresh load
  // (only go to builder if we were in the middle of building)
  const savedScreen = localStorage.getItem('pc_screen') || 'start';
  // Don't jump straight to generating — always land on start or builder
  const screen = savedScreen === 'generating' ? 'start' : savedScreen;
  showScreen(screen);
}
