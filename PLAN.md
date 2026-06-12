# 🪑 The Board — Product Plan & Design Doc

*A decision-making companion where you assemble a personal "board of directors" from the minds of real people you admire — and bring your big decisions to them for perspective and direction.*

**Status:** Plan & design phase (no code yet)
**Owner:** You
**Last updated:** 2026-06-12

---

## 1. The One-Liner

> **"What would they do?" — assemble a board of great minds and bring your decisions to them.**

You pick real people whose worldview you trust (athletes, spiritual leaders, founders, historical figures, family, mentors). You pose a decision. Each board member responds *in character* — from their authentic values and way of thinking. The app then synthesizes the differing views into a clear direction.

---

## 2. Why This Is Different

Most decision tools give you *one* answer. Life decisions are rarely one-dimensional — they're a tug-of-war between:

- **Ambition / excellence** (e.g. a Cristiano Ronaldo mindset)
- **Faith / wisdom / purpose** (e.g. an Apostle Joshua Selman lens)
- **Morality / love / sacrifice** (e.g. a Jesus lens)
- **Strategy / money / risk** (e.g. a founder or investor lens)

The magic is **seeing the same decision through multiple worldviews at once**, then deciding for yourself with all of them on the table.

---

## 3. Core Concept & Vocabulary

| Term | Meaning |
|------|---------|
| **Board** | A curated collection of 3–7 members the user assembles. |
| **Member** | A perspective modeled on a real person (their values, tone, priorities, famous quotes). |
| **Decision** | A question the user brings to the board ("Should I take this job?"). |
| **Deliberation** | Each member's response to the decision. |
| **Synthesis** | The combined recommendation — where members agree, disagree, and the suggested path. |
| **Verdict** | The user's final call, saved to history. |

---

## 4. Who Is It For (Personas)

1. **The Ambitious Builder** — facing career / business forks, wants discipline + faith + strategy in one view.
2. **The Faith-Driven Decider** — wants spiritual and moral perspectives front and center.
3. **The Overthinker** — paralyzed by choices, needs structured, multi-angle clarity.
4. **The Team Lead** — uses it to pressure-test a direction before committing.

---

## 5. Key User Flows

### Flow A — Assemble Your Board
1. Browse a **gallery of suggested people** (Ronaldo, Joshua Selman, Jesus, plus categories: Sports, Faith, Business, Science, History, Arts).
2. Or **add your own** (name + a short "who they are / what they value" description).
3. Drag chosen members onto the **boardroom table** (3–7 seats).
4. Save the board (e.g. "My Life Board", "Startup Board").

### Flow B — Bring a Decision to the Board
1. Type the decision and optional context ("I've been offered X but Y...").
2. Optionally set **stakes** (low / medium / life-changing) and a **deadline**.
3. Hit **"Convene the Board."**
4. Each member responds in a card — voice, priorities, a recommendation, and a confidence level.
5. View the **Synthesis**: consensus, key tensions, and a suggested direction.

### Flow C — Decide & Track
1. User records their **Verdict** and reasoning.
2. Saved to **Decision History** with date and which board was used.
3. Later, mark outcome ("Worked out" / "Didn't") to learn over time.

---

## 6. Screens / Pages

1. **Home / Dashboard** — your boards, recent decisions, "Start a new decision" CTA.
2. **Member Gallery** — searchable, filter by category, add custom member.
3. **Board Builder** — the boardroom table; add/remove seats; name & save.
4. **Decision Room** — pose decision → member cards appear → synthesis panel.
5. **Decision History** — timeline of past decisions, verdicts, outcomes.
6. **Member Profile** — values, tone, signature ideas, sample quotes.

---

## 7. The "Member Model" (heart of the app)

Each member is defined by a small structured profile so their responses feel authentic and consistent:

```
Member {
  name:            "Cristiano Ronaldo"
  category:        "Sports"
  one_liner:       "Relentless excellence, discipline, self-belief."
  core_values:     ["hard work", "winning mentality", "discipline", "legacy"]
  decision_lens:   "Will this make you better? Are you giving 100%? Don't fear pressure."
  tone:            "Direct, confident, motivational."
  signature_lines: ["Talent without working hard is nothing.", "I'm not a perfectionist, but I like to feel that things are done well."]
  avatar:          (initials or uploaded image)
}
```

Example trio for an MVP:

- **Cristiano Ronaldo** — performance, discipline, ambition, ignoring doubters.
- **Apostle Joshua Selman** — purpose, wisdom, faith, integrity, divine timing.
- **Jesus** — love, sacrifice, others before self, eternal vs. temporary value.

> ⚠️ **Note on real & sacred figures:** Responses are clearly framed as *"a perspective inspired by"* a person — not real quotes or claims to speak for them. For religious figures this is handled with extra care and respect (drawing on widely known teachings, framed humbly). This framing is shown in the UI and the disclaimers.

---

## 8. The Synthesis Engine (logic)

When the board deliberates, the synthesis shows:
- **Where members agree** (the strong signal).
- **Where they pull in different directions** (the real trade-off).
- **A suggested direction** that weighs the tensions.
- **Questions to sit with** before deciding.

In the prototype this can be rule-based / templated. In the full version it's powered by an LLM that takes each member profile + the decision and generates in-character responses + the synthesis.

---

## 9. Build Phases (Roadmap)

### Phase 0 — This document ✅
Shared understanding of what we're building.

### Phase 1 — Clickable front-end prototype (recommended next)
- Single-page web app (clean, modern, light theme).
- Pre-loaded members (Ronaldo, Joshua Selman, Jesus + a few more).
- Build a board → pose a decision → see *templated* member responses + synthesis.
- Saves boards & history in the browser (localStorage). No backend, no API key needed.
- **Goal:** feel the experience, validate the concept.

### Phase 2 — Real AI responses
- Wire the Decision Room to an LLM so members respond live & uniquely.
- Add "add your own member" with free-form profiles.
- Requires an API key to run.

### Phase 3 — Accounts & cloud
- User login, save boards across devices, share a board, collaborate.
- Optional: invite *real* people to also weigh in on a decision.

### Phase 4 — Intelligence & polish
- Outcome tracking → "your boards have helped you decide 12 times."
- Suggested members based on your decision type.
- Mobile app / PWA.

---

## 10. Tech Approach (proposed)

- **Phase 1:** Plain HTML + CSS + vanilla JS (or React), single file, localStorage. Runs anywhere, instant preview.
- **Phase 2:** Add an LLM API call (server route to keep the key safe).
- **Phase 3:** Lightweight backend (e.g. Supabase / Firebase) for auth + storage.
- **Design:** Clean modern SaaS — lots of whitespace, soft shadows, rounded cards, one accent color, member cards that feel like "seats at a table."

---

## 11. Naming Ideas

- **The Board** (simple, clear)
- **Boardroom**
- **Council** / **My Council**
- **Roundtable**
- **Convene**
- **Voices**
- **What Would They Do (WWTD)**

---

## 12. Open Questions / Decisions for You

1. **Name** — which of the above (or something else)?
2. **Default members** — beyond Ronaldo, Joshua Selman, Jesus, who else should ship preloaded?
3. **Tone of synthesis** — gentle coach, blunt strategist, or neutral facilitator?
4. **Should real people ever be invited** to weigh in (Phase 3), or is it purely "modeled perspectives"?
5. After you approve this plan — **shall I build the Phase 1 clickable prototype next?**

---

*Next step: review this, tweak anything, then I'll build the Phase 1 prototype.*
