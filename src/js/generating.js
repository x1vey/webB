// ===== Generating Screen =====
// Animates build steps, fills a progress bar, then calls the AI and transitions
// to the builder screen.

import { showScreen, getPrompt } from './screens.js';
import { applyGeneratedSite } from './ai-panel.js';
import { ai } from './ai.js';
import { toast } from './toast.js';
import * as state from './state.js';
import { render } from './canvas-engine.js';

const BUILD_STEPS = [
  { label: 'Analysing your prompt',    sub: 'Understanding goals & audience' },
  { label: 'Designing the structure',  sub: 'Sections, layout & hierarchy' },
  { label: 'Writing copy',             sub: 'Headlines, body text & CTAs' },
  { label: 'Styling the design',       sub: 'Colours, typography & spacing' },
  { label: 'Finalising the page',      sub: 'Polish, responsive tweaks & QA' },
];

const STEP_DURATION = 720; // ms per step

let _running = false;
let _stepTimers = [];

function clearTimers() {
  _stepTimers.forEach(clearTimeout);
  _stepTimers = [];
}

function buildStepEls(container) {
  container.innerHTML = '';
  BUILD_STEPS.forEach((step, i) => {
    const div = document.createElement('div');
    div.className = 'gen-step';
    div.id = `gen-step-${i}`;
    div.innerHTML = `
      <div class="step-icon">${i + 1}</div>
      <div class="step-body">
        <div class="step-label">${step.label}</div>
        <div class="step-sub">${step.sub}</div>
      </div>`;
    container.appendChild(div);
  });
}

function animateSteps(onComplete) {
  const barFill = document.getElementById('gen-bar-fill');
  const totalSteps = BUILD_STEPS.length;

  BUILD_STEPS.forEach((_, i) => {
    const t = setTimeout(() => {
      // Mark previous step as done
      if (i > 0) {
        const prev = document.getElementById(`gen-step-${i - 1}`);
        if (prev) {
          prev.classList.remove('active');
          prev.classList.add('done');
          prev.querySelector('.step-icon').textContent = '✓';
        }
      }
      // Activate current step
      const cur = document.getElementById(`gen-step-${i}`);
      if (cur) {
        cur.classList.add('active');
        cur.querySelector('.step-icon').textContent = '◌';
      }
      // Update progress bar
      if (barFill) barFill.style.width = ((i + 1) / totalSteps * 75) + '%';
    }, i * STEP_DURATION);
    _stepTimers.push(t);
  });

  // After all animation steps
  const finalT = setTimeout(() => {
    // Mark last step as done
    const last = document.getElementById(`gen-step-${totalSteps - 1}`);
    if (last) {
      last.classList.remove('active');
      last.classList.add('done');
      last.querySelector('.step-icon').textContent = '✓';
    }
    if (barFill) barFill.style.width = '90%';
    if (onComplete) onComplete();
  }, totalSteps * STEP_DURATION);
  _stepTimers.push(finalT);
}

async function runGeneration(prompt) {
  const barFill = document.getElementById('gen-bar-fill');
  try {
    const site = await ai.generateSite(prompt);
    applyGeneratedSite(site);
    render();
    if (barFill) barFill.style.width = '100%';
    setTimeout(() => {
      showScreen('builder');
      _running = false;
    }, 400);
    toast(`Generated "${site.name}"`, 'success', 3200);
  } catch (err) {
    console.error('Generation error:', err);
    _running = false;
    // Fall back to empty builder with a toast
    toast(err.message || 'Generation failed — try again', 'error', 5000);
    showScreen('builder');
  }
}

export function initGenerating() {
  const screen = document.getElementById('screen-generating');
  if (!screen) return;

  // Use a MutationObserver to detect when the screen becomes visible
  const observer = new MutationObserver(() => {
    if (!screen.hidden && !_running) {
      startGenerating();
    }
  });
  observer.observe(screen, { attributes: true, attributeFilter: ['hidden'] });

  // Also fire immediately if the screen is already visible
  if (!screen.hidden) startGenerating();
}

function startGenerating() {
  _running = true;
  clearTimers();

  const prompt = getPrompt();
  const promptEl = document.getElementById('gen-prompt');
  const stepsEl  = document.getElementById('gen-steps');

  if (promptEl) promptEl.textContent = prompt || 'Your custom landing page';
  if (stepsEl)  buildStepEls(stepsEl);

  // Reset bar
  const barFill = document.getElementById('gen-bar-fill');
  if (barFill) barFill.style.width = '0%';

  // Animate steps, then call AI
  animateSteps(() => {
    runGeneration(prompt);
  });
}
