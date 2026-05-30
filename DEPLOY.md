# Pagecraft — deploy & run

A visual website builder: describe a site, the AI generates plain **HTML/CSS/JS**,
then you edit it by drag-and-drop. The OpenAI key is held **server-side** by a
Vercel serverless function (`/api/generate`) — it is never sent to the browser.

---

## Deploy to Vercel (production)

1. Push this folder to a Git repo (GitHub/GitLab/Bitbucket).
2. In Vercel: **Add New → Project**, import the repo.
   - Framework preset: **Other**. Build command: **none**. Output dir: leave default.
   - Vercel auto-detects `api/generate.js` as a serverless function.
3. **Settings → Environment Variables**, add:
   | Name | Value | Required |
   |------|-------|----------|
   | `OPENAI_API_KEY` | your `sk-...` key | ✅ |
   | `OPENAI_MODEL` | e.g. `gpt-4o` | optional |
   | `OPENAI_BASE_URL` | OpenAI-compatible base URL | optional |
4. **Deploy.** Open the URL, click **Generate**, describe a site, go.

To change the key later: update the env var in Vercel and **redeploy** (env vars
are read at runtime, but a redeploy guarantees a fresh function instance).

> CLI alternative: `npm i -g vercel` → `vercel` (preview) → `vercel --prod`.
> Add the env var with `vercel env add OPENAI_API_KEY`.

---

## Run locally

### Option A — full app incl. AI (recommended): `vercel dev`
The AI endpoint is a serverless function, so you need the Vercel runtime locally.

```bash
npm i -g vercel
cp .env.example .env.local        # then put your real key in .env.local
vercel dev                        # serves UI + /api/generate, reads .env.local
```

Open the printed URL (usually http://localhost:3000).

### Option B — UI only (no AI): `python serve.py`
Fast static preview of the builder. **Generate won't work** (there's no
`/api/generate` on a plain static server — you'll get a clear message saying so).
Everything else (library drag-drop, editing, import/export) works.

```bash
python serve.py     # http://localhost:8123
```

---

## Where does the API key go? (summary)

- **Not** in the browser, **not** in any committed file.
- **Local dev:** `.env.local` (git-ignored).
- **Production:** Vercel env vars.

`.env.local` and `.env` are git-ignored. Only `.env.example` (no real key) is committed.
