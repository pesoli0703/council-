# 🗺️ Council — Full Roadmap

*From the working prototype you have today → a real, multi-user product.*

**Last updated:** 2026-06-12
**Stack:** HTML/CSS/JS front-end · Vercel (hosting + serverless AI) · Firebase (auth + data) · GitHub (source)

---

## Legend
- ✅ Done
- 🔨 In progress / partially built
- ⬜ Not started
- ⭐ Recommended next

Effort: **S** (hours) · **M** (1–3 days) · **L** (a week+)

---

## 📍 Where you are today (Phase 1 — shipped)

| Item | Status |
|------|--------|
| Single-page app, clean modern UI | ✅ |
| 12 preloaded members with authentic, hand-crafted voices | ✅ |
| Member gallery + category filters | ✅ |
| Add-your-own-person (custom members) | ✅ |
| Board builder (seat 2–7, save multiple boards) | ✅ |
| Decision room (question + context + stakes → convene) | ✅ |
| Per-member responses with lean (go/caution/depends) + conviction | ✅ |
| Synthesis (headline, direction, agreements, tension, questions) | ✅ |
| Verdict + decision history | ✅ |
| Offline engine (no API key required) | ✅ |
| Optional AI route (`api/deliberate.js`) with graceful fallback | ✅ |
| localStorage persistence | ✅ |
| Vercel/GitHub config + README + PLAN | ✅ |

**You can deploy this today.** Everything below makes it richer, smarter, and multi-user.

---

## 🚀 PHASE 2 — Real AI, everywhere ⭐

*Goal: every response is unique, deep, and truly in-character — not templated.*

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 2.1 | Add `GEMINI_API_KEY` to Vercel & verify live AI flips badge to "AI mode" | S | ✅ Gemini route built |
| 2.2 | Provider swappable (Gemini default; OpenAI / Claude / Groq optional) | S | Model via `GEMINI_MODEL` env |
| 2.3 | Stream responses (members "speak" one by one in real time) | M | Server-sent events; feels alive |
| 2.4 | Stronger character prompting (per-member system prompt + few-shot voice samples) | M | Reuse the hand-crafted voices as anchors |
| 2.5 | Guardrails for sacred/real figures (respectful framing, refuse fabricated quotes) | S | Already framed; harden in prompt |
| 2.6 | Cost controls (cache, token limits, rate limit per user/IP) | M | Avoid surprise bills |
| 2.7 | "Ask a follow-up" — continue the conversation with the board | M | Threaded deliberation |

**Exit criteria:** Convene a board → each member streams a unique, in-voice answer; follow-ups work; costs are bounded.

---

## 🔥 PHASE 3 — Accounts & cloud (Firebase)

*Goal: your boards and decisions follow you across devices; foundation for sharing.*

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 3.1 | Firebase project + Auth (Google sign-in) | S | ✅ Built in firebase.js |
| 3.2 | Firestore data model | M | ✅ Built (one doc per user) |
| 3.3 | load/save → Firestore sync | M | ✅ Built (debounced auto-sync) |
| 3.4 | Merge local data on first login | S | ✅ Built (mergeById) |
| 3.5 | Security rules | S | ✅ Built (firestore.rules) |
| 3.6 | Offline-first sync (Firestore persistence) so it still works offline | S | Built into Firestore SDK |
| 3.7 | Profile/settings page (name, avatar, default board, AI on/off) | M | |

**Firestore schema**
```
users/{uid}
  ├─ profile           { name, photo, createdAt, defaultBoardId }
  ├─ boards/{boardId}  { name, memberIds[], createdAt }
  ├─ customMembers/{id}{ name, category, oneLiner, values[], lens, tone, color }
  └─ history/{id}      { boardName, decision{}, result{}, verdict, why, date }

sharedBoards/{boardId} { ownerUid, name, memberIds[], visibility }   // for Phase 5
```

**Exit criteria:** Sign in on any device → see the same boards & history; data is private and secure.

---

## 👥 PHASE 4 — Smarter deliberation

*Goal: the board feels less like Q&A and more like a real, dynamic council.*

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 4.1 | Members **react to each other** (round 2: rebuttals, agreements) | L | The "debate" mode |
| 4.2 | **Chairperson** member who runs the meeting & calls the final vote | M | |
| 4.3 | **Weighted votes** — you set how much each member's view counts | S | |
| 4.4 | **Decision templates** (career, relationship, money, faith, health) | M | Pre-fills context prompts |
| 4.5 | **Suggested members** based on the decision type | M | "This is a money call — add Buffett?" |
| 4.6 | **Confidence + risk meter** visualization for the whole board | S | |
| 4.7 | **"Devil's advocate"** toggle — force one member to argue the opposite | S | Stress-test your bias |

**Exit criteria:** You can run a structured, multi-round board meeting that ends in a clear, weighted recommendation.

---

## 🤝 PHASE 5 — Real people & collaboration

*Goal: not just modeled perspectives — invite actual humans to weigh in.*

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 5.1 | **Share a board** via link | M | Read-only first |
| 5.2 | **Invite real people** to respond to a specific decision | L | Email/link → they add their view |
| 5.3 | Mixed boards: AI personas **+** real collaborators side by side | M | The hybrid vision |
| 5.4 | Comments & threaded discussion on each response | M | |
| 5.5 | Voting / polls among real members | S | |
| 5.6 | Notifications (someone responded to your decision) | M | Email + in-app |

**Exit criteria:** Send a decision to friends/mentors; their answers appear next to the AI board; everyone discusses and votes.

---

## 📈 PHASE 6 — Intelligence & retention

*Goal: Council gets more valuable the more you use it.*

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 6.1 | **Outcome tracking** — revisit past decisions, mark "worked out / didn't" | M | |
| 6.2 | **Personal insights** — "your boards have helped you decide 12 times; you tend to over-caution on money" | L | |
| 6.3 | **Decision journal** export (PDF / Markdown) | S | |
| 6.4 | **Reminders** — "you said you'd revisit this in 30 days" | M | |
| 6.5 | **Member memory** — board remembers your past context & values | L | Personalization |
| 6.6 | Search across all past decisions | S | |

**Exit criteria:** Users return weekly; the app reflects patterns back to them and learns their context.

---

## 📱 PHASE 7 — Polish, platform & growth

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 7.1 | **PWA** — installable, offline, push notifications | M | One step to "mobile app" |
| 7.2 | Native mobile (React Native / Expo) if PWA isn't enough | L | Optional |
| 7.3 | **Dark "boardroom" theme** toggle | S | |
| 7.4 | Onboarding flow (build first board in 60 seconds) | M | Activation |
| 7.5 | **Member marketplace / community packs** (curated boards to import) | L | "Founder board", "Faith board" |
| 7.6 | Accessibility pass (keyboard, screen reader, contrast) | M | |
| 7.7 | Analytics (privacy-friendly) to see what's used | S | |
| 7.8 | Landing page + SEO | M | Growth |

---

## 💰 PHASE 8 — Business & scale (optional)

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 8.1 | Free tier (local AI / limited boards) vs Pro (live AI, unlimited, sharing) | M | |
| 8.2 | Payments (Stripe) + subscription management | M | |
| 8.3 | Usage metering & abuse protection | M | |
| 8.4 | Team / org boards (B2B angle for leadership teams) | L | |
| 8.5 | API for partners / embeds | L | |

---

## 🧭 Suggested sequence (if I were driving)

1. **Phase 2.1–2.3** — turn on real AI + streaming (biggest "wow" for least effort) ⭐
2. **Phase 3.1–3.5** — Firebase auth + cloud sync (so people can actually keep their data)
3. **Phase 6.1** — outcome tracking (cheap, huge for retention)
4. **Phase 4.1–4.2** — debate mode + chairperson (the magic moment)
5. **Phase 5.1–5.3** — sharing + real collaborators (growth loop)
6. **Phase 7** — PWA + onboarding + theme (make it feel finished)
7. **Phase 8** — monetize once people love it

---

## ⏱️ Rough timeline (solo, part-time)

| Milestone | Calendar estimate |
|-----------|-------------------|
| Phase 2 (real AI) | ~1 week |
| Phase 3 (Firebase) | ~1–2 weeks |
| Phase 4 (smarter board) | ~2 weeks |
| Phase 5 (collaboration) | ~2–3 weeks |
| Phase 6 (insights) | ~2 weeks |
| Phase 7 (polish/PWA) | ~1–2 weeks |
| **MVP → polished v1** | **~2–3 months** |

Full-time or with help, roughly half that.

---

## ✅ Definition of "v1 launch-ready"
- Real AI responses, streamed, in authentic voices ✅(route ready)
- Sign in + cloud sync (Firebase)
- Build boards, convene, get synthesis, record verdicts
- Decision history with outcome tracking
- Shareable boards
- PWA installable + onboarding
- Respectful framing & guardrails for real/sacred figures
- Basic analytics + a landing page

---

*Tell me which phase to build next and I'll start on it. My recommendation: **Phase 2 (real AI + streaming)**, then **Phase 3 (Firebase)**.*
