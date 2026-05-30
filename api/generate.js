// ===== /api/generate — Vercel serverless function (Node.js) =====
// Holds the OpenAI key SERVER-SIDE so it is never exposed to the browser.
// The frontend POSTs { prompt, model? } here; we call OpenAI and return
// { name, html, css, js }.
//
// Required env var:  OPENAI_API_KEY
// Optional env vars: OPENAI_MODEL (default "gpt-4o"), OPENAI_BASE_URL

const SYSTEM_PROMPT = `You are an expert front-end web designer who builds polished, modern, conversion-focused landing pages in plain HTML, CSS, and JavaScript (no frameworks).

Respond with ONLY a single JSON object — no prose, no markdown code fences — matching exactly:
{"name": string, "html": string, "css": string, "js": string}

Requirements for "html":
- Only the markup that goes INSIDE <body> (do NOT include <html>, <head>, <body>, <style>, or <script> tags).
- Compose the page as a sequence of top-level blocks using semantic tags (<header>, <section>, <footer>). Each top-level block becomes one editable section in the builder.
- Put ALL visual styling as inline style="" attributes on every element — colours, typography, spacing, flexbox/grid, backgrounds, borders, radius, shadows. This is mandatory so the visual editor can edit each property. Do NOT rely on CSS classes for layout or colour.
- Write real, specific copy relevant to the user's request. Never use lorem ipsum.
- Use https://placehold.co/<w>x<h> for placeholder images.
- Use sensible max-widths and centred containers so it reads well on desktop.

Requirements for "css":
- Global rules ONLY: a tiny reset, @media overrides for mobile, :hover states, @keyframes. Keep it short — base styling stays inline in the HTML.

Requirements for "js":
- Optional, vanilla JS only (no imports/frameworks). Keep it minimal (e.g. mobile nav toggle, smooth scroll).

CRITICAL JSON RULES:
- Return ONLY the JSON object, nothing else. No markdown, no code fences, no explanation.
- All newlines inside string values MUST be escaped as \\n
- All double quotes inside string values MUST be escaped as \\"
- The JSON must parse with JSON.parse() in one shot.
- If the HTML is long, that's fine — just ensure the JSON is valid and complete.`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Server is missing OPENAI_API_KEY. Add it in Vercel → Settings → Environment Variables (or .env.local for local dev), then redeploy.'
    });
  }

  // Vercel parses JSON bodies for us, but guard for string/empty too.
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object') body = {};

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) return res.status(400).json({ error: 'Missing "prompt".' });
  if (prompt.length > 2000) return res.status(400).json({ error: 'Prompt is too long (max 2000 characters).' });

  const model = (typeof body.model === 'string' && body.model.trim())
    ? body.model.trim()
    : (process.env.OPENAI_MODEL || 'gpt-4o');
  const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');

  let aiRes;
  try {
    aiRes = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: 16000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Build this website: ${prompt}` }
        ]
      })
    });
  } catch (err) {
    return res.status(502).json({ error: 'Could not reach OpenAI: ' + (err && err.message ? err.message : String(err)) });
  }

  if (!aiRes.ok) {
    let detail = '';
    try { const j = await aiRes.json(); detail = (j && j.error && (j.error.message || j.error.code)) || ''; } catch { /* ignore */ }
    // Map upstream 401 to 502 so the client message points at server config, not the user.
    return res.status(aiRes.status === 401 ? 502 : aiRes.status).json({ error: friendly(aiRes.status, detail) });
  }

  let content;
  try {
    const data = await aiRes.json();
    content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  } catch {
    return res.status(502).json({ error: 'Malformed response from OpenAI.' });
  }
  if (!content) return res.status(502).json({ error: 'Empty response from the model.' });

  let site;
  try { site = parseSiteJSON(content); }
  catch (err) { return res.status(502).json({ error: err.message }); }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(site);
};

function friendly(status, detail) {
  if (status === 401) return "The server's OpenAI API key was rejected (401). Check the OPENAI_API_KEY value.";
  if (status === 429) return 'OpenAI rate limit or quota exceeded (429). ' + (detail || '');
  if (status === 400 && /response_format|model/i.test(detail)) return 'Model error: ' + detail;
  return `OpenAI error ${status}: ${detail || 'request failed'}`;
}

function parseSiteJSON(text) {
  let t = String(text).trim();

  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();

  // Extract the outermost { ... } block
  const first = t.indexOf('{'), last = t.lastIndexOf('}');
  if (first !== -1 && last !== -1) t = t.slice(first, last + 1);

  let obj;

  // Attempt 1: direct parse
  try { obj = JSON.parse(t); } catch { obj = null; }

  // Attempt 2: fix unescaped newlines/tabs inside string values
  if (!obj) {
    try {
      const fixed = t.replace(/(?<=:[\s]*")([\s\S]*?)(?="[\s]*[,}])/g, (match) => {
        return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
      });
      obj = JSON.parse(fixed);
    } catch { obj = null; }
  }

  // Attempt 3: manually extract each field with greedy regex
  if (!obj) {
    try {
      const grab = (key) => {
        const re = new RegExp('"' + key + '"\\s*:\\s*"([\\s\\S]*?)"\\s*(?:,\\s*"|\\s*})', 'i');
        const m = t.match(re);
        return m ? m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '';
      };
      obj = { name: grab('name'), html: grab('html'), css: grab('css'), js: grab('js') };
      if (!obj.html) obj = null;
    } catch { obj = null; }
  }

  if (!obj) throw new Error('The model did not return valid JSON. Try again or use a different prompt.');
  if (!obj.html || (typeof obj.html === 'string' && !obj.html.trim())) {
    throw new Error('The response did not include any HTML.');
  }

  return {
    name: typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : 'AI Website',
    html: typeof obj.html === 'string' ? obj.html : '',
    css: typeof obj.css === 'string' ? obj.css : '',
    js:  typeof obj.js === 'string' ? obj.js : ''
  };
}
