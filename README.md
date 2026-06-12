# 🪑 Council

> Assemble a personal **board of directors** from people you admire — and bring your hardest decisions to them.

You pick real people whose worldview you trust (Cristiano Ronaldo, Apostle Joshua Selman, Jesus, Steve Jobs, Marcus Aurelius… or your own additions). You pose a decision. Each member responds **in character**, from their authentic values and way of thinking. Then Council **synthesizes** the perspectives into a clear direction — where they agree, where they clash, and questions to sit with.

Built to run **instantly with zero setup**, and to scale up to **live AI** and **Firebase** when you want.

---

## ✨ Features

- **Member gallery** — 12 preloaded perspectives across Sports, Faith, Business, Philosophy, Leadership, Arts. Filter by category.
- **Add your own person** — model a mentor, grandparent, or any figure with their values + decision lens.
- **Board builder** — seat 2–7 members at "the table", name & save multiple boards.
- **Decision room** — pose a decision with context + stakes, convene the board, read each member's response + conviction level.
- **Synthesis engine** — headline, suggested direction, where the board lands, the core tension, reflective questions.
- **Verdict + history** — record what you decided and why; review past decisions.
- **Works offline** — fully functional with a local templated engine (no API key needed).
- **Optional live AI** — deploy with a key for unique, in-character responses.
- **No build step** — plain HTML/CSS/JS. Everything persists in `localStorage`.

---

## 📁 Project structure

```
council/
├── index.html          # App shell + all styles (single page)
├── members.js          # Default board-member profiles
├── engine.js           # Local (offline) deliberation + synthesis engine
├── app.js              # UI logic, state, localStorage persistence
├── api/
│   └── deliberate.js   # Vercel serverless function for live AI (optional)
├── vercel.json         # Vercel config (clean URLs)
├── package.json        # Scripts
├── .env.example        # Env template for the AI key
├── PLAN.md             # Product plan & design doc
└── README.md
```

---

## 🚀 Run it

### Option 1 — Just open it (local mode)
Open `index.html` in a browser. That's it. Uses the offline engine.
> Tip: if you want everything to behave like production (clean URLs), serve it: `npx serve .`

### Option 2 — Deploy to Vercel (recommended)
```bash
# from the project folder
npm i -g vercel          # if needed
vercel                   # preview deploy
vercel --prod            # production
```
- Without an API key it deploys in **local mode** (still fully usable).
- To enable **live AI** (Google Gemini), get a **free** key and add it:
  1. Go to **https://aistudio.google.com** → sign in → **"Get API key"** → **Create API key** (no credit card for the free tier).
  2. Add it to Vercel:
     ```bash
     vercel env add GEMINI_API_KEY
     ```
     (or Project → Settings → Environment Variables → `GEMINI_API_KEY = AIza...`)
  3. Redeploy. The header badge flips from **● Local mode** to **● AI mode** automatically when the API responds.

The AI route is in `api/deliberate.js`. It uses Google's **`gemini-2.5-flash`** by default (fast, free-tier eligible, 1M-token context). Override with the `GEMINI_MODEL` env var (e.g. `gemini-2.0-flash`, `gemini-2.5-flash-lite`). The front-end always falls back to local/offline mode if the API is missing or errors, so the app never breaks.

> **Region note:** Gemini's free tier isn't available in every country. If yours is restricted, the app still runs in offline mode, or you can use a paid Gemini key.

### Option 3 — Push to GitHub → Vercel auto-deploy
```bash
git init
git add .
git commit -m "Council v1"
git branch -M main
git remote add origin git@github.com:<you>/council.git
git push -u origin main
```
Then "Import Project" in Vercel and point it at the repo. Set `GEMINI_API_KEY` in project settings for AI (free key from https://aistudio.google.com).

---

## ☁️ Cloud sync (Firebase) — OPTIONAL, disabled by default

**You don't need this.** Council saves everything (boards, history, custom members) in the browser via `localStorage`, with no account and no backend. Firebase only adds value if you want the *same account synced across multiple devices*.

The full implementation is built and parked in **`optional-cloud-sync/`** (`firebase.js` + `firestore.rules` + setup notes). It's disabled in `index.html` (the `<script>` line is commented out). As of 2025, creating a Firestore database requires Firebase's **Blaze** plan — which has a generous free tier; set a **$0–$1 budget alert** so you're never charged. See `optional-cloud-sync/README.md` to switch it on later.

When enabled: sign in with Google → local data merges to the cloud once → Firestore becomes the source of truth and changes auto-sync.

### One-time Firebase Console setup
1. **Authentication** → Get started → enable **Google** sign-in.
2. **Firestore Database** → Create database.
3. **Rules** → paste the contents of `firestore.rules` → **Publish** (locks each user to their own data).
4. **Authentication → Settings → Authorized domains** → add your deploy domains:
   - `localhost` (already there)
   - your Vercel domain, e.g. `council-xyz.vercel.app`
   - any custom domain
   > If you skip this, Google sign-in throws an `auth/unauthorized-domain` error.

### Data model (Firestore)
```
users/{uid} {
  boards:        [ { id, name, memberIds[], created } ],
  history:       [ { id, boardName, decision{}, result{}, verdict, why, date } ],
  customMembers: [ { id, name, category, oneLiner, values[], lens, tone, color } ],
  updatedAt:     <ms>
}
```
One document per user keeps reads/writes simple and cheap. (For Phase 5 sharing, a `sharedBoards/{boardId}` collection is sketched in `firestore.rules`.)

> The Firebase **web config** in `firebase.js` is safe to commit — it's public by design. Security comes from the Firestore rules, not the config.

---

## 🧠 How the local engine works

`engine.js` gives each member a **leaning** (go / caution / depends) based on:
- keywords in the decision (risk vs. caution words),
- the member's disposition (e.g. Ronaldo/Musk lean bold, Buffett/Aurelius lean cautious),
- a deterministic hash so responses are stable but varied.

It then composes a response from the member's `values` + `lens` + a fitting quote, and builds a synthesis from the distribution of leanings. It's intentionally simple and transparent — the live AI route in `api/deliberate.js` produces richer, unique responses.

---

## ⚖️ Respect & framing

Council generates **perspectives _inspired by_** real and historical figures from their publicly known values and ideas. Responses are **not real quotes** and never claim to speak for any person. Spiritual and sacred figures are represented **humbly and respectfully**. It's a reflection tool — the final decision is always yours. This disclaimer is shown in the app footer.

---

## 🗺️ Roadmap

- [x] Phase 1 — Clickable prototype (this)
- [ ] Phase 2 — Live AI wired in (route ready; add key)
- [ ] Phase 3 — Firebase auth + cloud sync + sharing
- [ ] Phase 4 — Outcome tracking ("worked out?"), suggested members, PWA/mobile

See `PLAN.md` for the full product design doc.

---

MIT licensed. Built as a starting point — make it yours.
