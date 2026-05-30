// ===== AI Generation Layer (client) =====
// The browser NEVER holds the OpenAI key. It calls our own serverless function
// at /api/generate, which holds OPENAI_API_KEY server-side (a Vercel env var).
//
// Public API:
//   ai.getSettings() / ai.saveSettings({ model })   // model preference only
//   ai.generateSite(prompt, { model, signal })       -> Promise<{name,html,css,js}>

const LS_KEY = 'pagecraft.ai.settings';
const DEFAULTS = { model: '' };          // '' => let the server choose the model
const ENDPOINT = '/api/generate';

function getSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(LS_KEY) || '{}') }; }
  catch { return { ...DEFAULTS }; }
}

function saveSettings(partial) {
  const next = { ...getSettings(), ...partial };
  // Never persist anything secret here — model preference only.
  delete next.apiKey;
  localStorage.setItem(LS_KEY, JSON.stringify(next));
  return next;
}

async function generateSite(prompt, { model, signal } = {}) {
  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model: model || getSettings().model || undefined })
    });
  } catch (err) {
    throw new Error('Could not reach the generator. Run `vercel dev` locally, or deploy to Vercel. (' + err.message + ')');
  }

  // Pure static hosting (e.g. python serve.py) has no serverless functions.
  if (res.status === 404) {
    throw new Error('The /api/generate endpoint was not found. Run `vercel dev` for local AI, or deploy to Vercel.');
  }

  let data = null;
  if ((res.headers.get('content-type') || '').includes('application/json')) {
    try { data = await res.json(); } catch { /* fall through */ }
  }
  if (!res.ok) {
    throw new Error((data && data.error) || `Generator error ${res.status}.`);
  }
  if (!data || typeof data.html !== 'string' || !data.html.trim()) {
    throw new Error('The generator did not return any HTML.');
  }
  return {
    name: typeof data.name === 'string' && data.name.trim() ? data.name.trim() : 'AI Website',
    html: data.html,
    css:  typeof data.css === 'string' ? data.css : '',
    js:   typeof data.js === 'string' ? data.js : ''
  };
}

export const ai = { getSettings, saveSettings, generateSite };

if (typeof window !== 'undefined') {
  window.Pagecraft = window.Pagecraft || {};
  window.Pagecraft.ai = ai;
}
