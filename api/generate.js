// ===== /api/generate — Vercel serverless function (Node.js) =====
// Holds the OpenAI key SERVER-SIDE so it is never exposed to the browser.
// The frontend POSTs { prompt, model? } here; we call OpenAI and return
// { name, html, css, js }.
//
// Required env var:  OPENAI_API_KEY
// Optional env vars: OPENAI_MODEL (default "gpt-4o"), OPENAI_BASE_URL

const SYSTEM_PROMPT = `You are a world-class web designer and front-end developer. You build stunning, award-winning landing pages in plain HTML, CSS, and JavaScript — no frameworks.

RESPONSE FORMAT — return ONLY a single JSON object (no markdown, no code fences, no explanation):
{"name": string, "html": string, "css": string, "js": string}

═══════════════════════════════════════════════════
DESIGN SYSTEM — apply these rules to EVERY page regardless of the user's prompt:
═══════════════════════════════════════════════════

TYPOGRAPHY:
- Use Inter or system font stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- Hero headlines: 48–72px, font-weight 800, line-height 1.08–1.15, letter-spacing -0.02em
- Section headings: 32–40px, font-weight 700
- Body text: 16–18px, font-weight 400, line-height 1.6–1.7
- Small/label text: 12–14px, uppercase, letter-spacing 0.08em, font-weight 600
- Never use font sizes below 13px

COLOUR & CONTRAST:
- Pick ONE bold accent colour that fits the brand/topic (not always indigo — vary it). Derive 2–3 shades from it.
- Light sections: white or very light grey (#f8f9fa / #f1f5f9) backgrounds, dark text (#0f172a / #1e293b)
- Dark sections: deep navy/charcoal (#0f172a / #111827), white or light text
- Alternate light and dark sections for visual rhythm
- Buttons: solid accent fill with white text, generous padding (14px 32px), border-radius 8–12px, subtle box-shadow
- Ensure all text meets WCAG AA contrast (4.5:1 minimum)

SPACING & LAYOUT:
- Sections: padding 80–120px vertical, 24–40px horizontal
- Use max-width 1200px centered containers inside sections (margin: 0 auto)
- Generous whitespace between elements — min 24px between siblings, 48px+ between groups
- Use CSS grid (repeat(auto-fit, minmax(300px, 1fr))) or flexbox for card/feature grids
- Gap: 24–32px for grids

VISUAL POLISH:
- Cards: background white, border-radius 12–16px, box-shadow 0 1px 3px rgba(0,0,0,0.08), padding 32px
- Smooth hover transitions on all interactive elements (transition: all 0.2s ease)
- Images: border-radius 12px, subtle shadow
- Gradient backgrounds where appropriate: use 135deg angle, two complementary colours
- Add subtle background patterns or accent shapes (CSS gradients, not images) to avoid flat sections
- Dividers between sections: use background colour changes, not <hr>

STRUCTURE — always include all of these:
1. NAVBAR — sticky, backdrop-filter blur, logo left, nav links right, CTA button far right. Padding 16px 40px. Z-index 1000.
2. HERO — full-width, min-height 600px, centred content, headline + subtitle + 1–2 CTA buttons. Use a gradient or bold background.
3. SOCIAL PROOF / LOGOS — "Trusted by" strip with 4–6 placeholder brand names or metrics (e.g. "10,000+ users", "4.9★ rating")
4. FEATURES — 3–4 cards in a grid. Each card: emoji or icon character as visual, bold title, 1–2 sentence description.
5. HOW IT WORKS / BENEFITS — numbered steps or alternating image+text rows
6. TESTIMONIALS — 2–3 quote cards with name, role, avatar placeholder
7. PRICING or FINAL CTA — if pricing fits the topic, show 2–3 tier cards; otherwise a strong CTA section with headline + button
8. FOOTER — dark background, 3–4 column grid (product links, company links, legal links, newsletter signup), copyright at bottom

COPY:
- Write real, compelling, specific copy that matches the user's topic — NEVER lorem ipsum
- Headlines should be benefit-driven ("Ship 10x faster" not "Our product")
- CTAs should be action-oriented ("Start free trial", "Get started today")
- Keep paragraphs to 1–2 sentences max

═══════════════════════════════════════════════════
TECHNICAL REQUIREMENTS:
═══════════════════════════════════════════════════

"html":
- Only markup that goes INSIDE <body> — no <html>, <head>, <body>, <style>, or <script> tags
- Compose as a sequence of top-level semantic blocks (<header>, <section>, <footer>)
- Put ALL visual styling as inline style="" on every element — this is mandatory for the visual editor
- Use https://placehold.co/<w>x<h>/<bg>/<text> for images (match colours to the palette)
- Every element must have explicit inline styles — no naked tags

"css":
- Global rules only: @media responsive overrides, :hover/:focus states, @keyframes, smooth-scroll
- Mobile breakpoint at max-width: 768px: stack grids to 1 column, reduce font sizes, adjust padding
- Include hover effects for buttons (brightness/transform) and cards (translateY/shadow)

"js":
- Optional, vanilla only. Mobile nav toggle, smooth scroll, or subtle scroll animations if appropriate.

JSON RULES:
- Return ONLY the JSON object — no markdown fences, no explanation
- All newlines in string values MUST be escaped as \\n
- All double quotes in string values MUST be escaped as \\"
- The JSON must parse with JSON.parse() in one shot`;

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
