/* Council — front-end app logic.
 * State persists in localStorage. Works fully offline (local engine).
 * If /api/deliberate is available (deployed on Vercel with a key), it uses live AI.
 */
(function () {
  "use strict";

  // ---------- State ----------
  const LS = {
    boards: "council.boards",
    history: "council.history",
    custom: "council.custom"
  };
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
  const rawSet = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  // save() also notifies the cloud layer (firebase.js) so changes sync when signed in.
  const save = (k, v) => { rawSet(k, v); document.dispatchEvent(new CustomEvent("council:save")); };

  let boards = load(LS.boards, []);
  let history = load(LS.history, []);
  let customMembers = load(LS.custom, []);
  let draft = { name: "", memberIds: [] };       // builder draft
  let lastDeliberation = null;

  const allMembers = () => window.COUNCIL_MEMBERS.concat(customMembers);
  const memberById = id => allMembers().find(m => m.id === id);
  const MAX_SEATS = 7;

  // ---------- Helpers ----------
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const esc = s => (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const initials = name => name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const uid = () => "id" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1800);
  }
  function avatar(m, cls = "") {
    return `<div class="avatar ${cls}" style="background:${m.color || "#4f46e5"}">${initials(m.name)}</div>`;
  }

  // ---------- Navigation ----------
  function show(view) {
    $$(".view").forEach(v => v.classList.toggle("active", v.id === view));
    $$(".links button").forEach(b => b.classList.toggle("active", b.dataset.view === view));
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (view === "dashboard") renderDashboard();
    if (view === "gallery") renderGallery();
    if (view === "builder") renderBuilder();
    if (view === "room") renderRoom();
    if (view === "history") renderHistory();
  }
  document.addEventListener("click", e => {
    const nav = e.target.closest("[data-view]");
    if (nav) { show(nav.dataset.view); }
  });

  // ---------- Dashboard ----------
  function renderDashboard() {
    const list = $("#boardsList");
    if (!boards.length) {
      list.innerHTML = `<div class="card empty" style="grid-column:1/-1">No boards yet. <a href="#" data-view="builder" style="color:var(--accent);font-weight:700">Build your first board →</a></div>`;
    } else {
      list.innerHTML = boards.map(b => {
        const seats = b.memberIds.map(id => memberById(id)).filter(Boolean);
        return `<div class="card board-card">
          <h3>${esc(b.name)}</h3>
          <div class="date" style="color:var(--muted);font-size:12px">${seats.length} members</div>
          <div class="seats">${seats.slice(0, 6).map(m => avatar(m)).join("")}</div>
          <div class="row">
            <button class="btn sm" data-decide="${b.id}">Bring a decision</button>
            <button class="btn ghost sm" data-edit="${b.id}">Edit</button>
          </div>
        </div>`;
      }).join("");
    }
    const recent = $("#recentDecisions");
    const last3 = history.slice(0, 3);
    recent.innerHTML = last3.length
      ? last3.map(h => histCard(h, false)).join("")
      : `<div class="card empty">No decisions yet — convene a board to get started.</div>`;
  }

  document.addEventListener("click", e => {
    const dec = e.target.closest("[data-decide]");
    if (dec) { selectedBoardId = dec.dataset.decide; show("room"); $("#boardSelect").value = selectedBoardId; }
    const ed = e.target.closest("[data-edit]");
    if (ed) { editBoard(ed.dataset.edit); }
  });

  // ---------- Gallery ----------
  let activeFilter = "All";
  function categories() {
    return ["All", ...Array.from(new Set(allMembers().map(m => m.category)))];
  }
  function renderGallery() {
    const f = $("#filters");
    f.innerHTML = categories().map(c =>
      `<button class="chip ${c === activeFilter ? "active" : ""}" data-filter="${esc(c)}">${esc(c)}</button>`).join("");
    const grid = $("#membersGrid");
    const items = allMembers().filter(m => activeFilter === "All" || m.category === activeFilter);
    grid.innerHTML = items.map(m => {
      const inDraft = draft.memberIds.includes(m.id);
      return `<div class="card member">
        <div class="head">
          ${avatar(m)}
          <div class="meta">
            <h3>${esc(m.name)}</h3>
            <div class="cat">${esc(m.category)}${m.custom ? " · custom" : ""}</div>
          </div>
        </div>
        <div class="one">${esc(m.oneLiner)}</div>
        <div class="vals">${(m.values || []).slice(0, 4).map(v => `<span class="tag">${esc(v)}</span>`).join("")}</div>
        <div class="foot">
          <button class="btn sm ${inDraft ? "ghost" : ""}" data-toggle="${m.id}">${inDraft ? "✓ On board" : "+ Add to board"}</button>
          <button class="btn ghost sm" data-profile="${m.id}">View</button>
        </div>
      </div>`;
    }).join("");
  }
  document.addEventListener("click", e => {
    const fl = e.target.closest("[data-filter]");
    if (fl) { activeFilter = fl.dataset.filter; renderGallery(); }
    const tg = e.target.closest("[data-toggle]");
    if (tg) { toggleDraftMember(tg.dataset.toggle); }
    const pr = e.target.closest("[data-profile]");
    if (pr) { showProfile(pr.dataset.profile); }
  });

  function toggleDraftMember(id) {
    const i = draft.memberIds.indexOf(id);
    if (i >= 0) { draft.memberIds.splice(i, 1); }
    else {
      if (draft.memberIds.length >= MAX_SEATS) { toast("Max " + MAX_SEATS + " seats"); return; }
      draft.memberIds.push(id);
    }
    renderGallery();
    toast(i >= 0 ? "Removed from board" : "Added to board");
  }

  function showProfile(id) {
    const m = memberById(id);
    openModal(`
      <button class="close" data-close>×</button>
      <div style="display:flex;gap:14px;align-items:center;margin-bottom:6px">
        ${avatar(m)}
        <div><h3 style="margin:0">${esc(m.name)}</h3><div style="color:var(--muted);font-size:13px">${esc(m.category)}</div></div>
      </div>
      <p style="color:var(--ink);line-height:1.6">${esc(m.oneLiner)}</p>
      <p style="font-size:13px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Decision lens</p>
      <p style="line-height:1.6;margin-top:0">${esc(m.lens)}</p>
      <div class="vals" style="margin:6px 0 14px">${(m.values || []).map(v => `<span class="tag">${esc(v)}</span>`).join("")}</div>
      ${(m.quotes || []).map(q => `<p class="quote" style="font-style:italic;color:var(--muted);border-left:3px solid var(--line);padding-left:10px;margin:8px 0">"${esc(q)}"</p>`).join("")}
      <button class="btn" style="margin-top:14px" data-toggle="${m.id}" data-close>${draft.memberIds.includes(m.id) ? "✓ On your board" : "+ Add to board"}</button>
    `);
  }

  // ---------- Custom member ----------
  $("#addCustomBtn").addEventListener("click", () => {
    openModal(`
      <button class="close" data-close>×</button>
      <h3>Add your own person</h3>
      <div class="field"><label>Name</label><input class="fld" id="cmName" placeholder="e.g. My grandmother, Sun Tzu, my mentor"/></div>
      <div class="field"><label>Category</label><input class="fld" id="cmCat" placeholder="e.g. Family, History, Mentor"/></div>
      <div class="field"><label>One-liner — who are they?</label><input class="fld" id="cmOne" placeholder="What they stand for in a sentence"/></div>
      <div class="field"><label>Core values (comma separated)</label><input class="fld" id="cmVals" placeholder="e.g. patience, honesty, courage"/></div>
      <div class="field"><label>Decision lens — how do they judge a choice?</label><textarea id="cmLens" placeholder="What questions would they ask you?"></textarea></div>
      <button class="btn" id="cmSave">Save person</button>
    `);
    $("#cmSave").addEventListener("click", () => {
      const name = $("#cmName").value.trim();
      if (!name) { toast("Name required"); return; }
      const colors = ["#4f46e5", "#0e7490", "#be185d", "#15803d", "#b45309", "#7c3aed"];
      const m = {
        id: uid(), name, custom: true,
        category: $("#cmCat").value.trim() || "Custom",
        oneLiner: $("#cmOne").value.trim() || "A perspective you trust.",
        values: $("#cmVals").value.split(",").map(s => s.trim()).filter(Boolean).slice(0, 5),
        lens: $("#cmLens").value.trim() || "Does this align with what truly matters to you?",
        tone: "Personal, grounded.",
        color: colors[customMembers.length % colors.length],
        quotes: []
      };
      if (!m.values.length) m.values = ["wisdom", "honesty"];
      customMembers.push(m); save(LS.custom, customMembers);
      closeModal(); renderGallery(); toast("Person added");
    });
  });

  // ---------- Builder ----------
  let editingBoardId = null;
  function renderBuilder() {
    $("#boardName").value = draft.name;
    const grid = $("#seatsGrid");
    const slots = [];
    draft.memberIds.forEach(id => {
      const m = memberById(id);
      if (!m) return;
      slots.push(`<div class="seat-slot filled" data-remove="${id}">
        ${avatar(m)}<div class="name">${esc(m.name)}</div><div class="x">remove ✕</div>
      </div>`);
    });
    // show remaining empty slots up to a minimum of 3 visible
    const target = Math.max(3, Math.min(MAX_SEATS, draft.memberIds.length + 1));
    for (let i = draft.memberIds.length; i < target; i++) {
      slots.push(`<div class="seat-slot" data-view="gallery">＋<br>add member</div>`);
    }
    grid.innerHTML = slots.join("");
    $("#seatCount").textContent = `(${draft.memberIds.length}/${MAX_SEATS})`;
  }
  $("#boardName").addEventListener("input", e => draft.name = e.target.value);
  document.addEventListener("click", e => {
    const rm = e.target.closest("[data-remove]");
    if (rm) { draft.memberIds = draft.memberIds.filter(id => id !== rm.dataset.remove); renderBuilder(); }
  });
  $("#clearBoardBtn").addEventListener("click", () => {
    draft = { name: "", memberIds: [] }; editingBoardId = null; renderBuilder();
  });
  $("#saveBoardBtn").addEventListener("click", () => {
    if (!draft.name.trim()) { toast("Name your board"); return; }
    if (draft.memberIds.length < 2) { toast("Add at least 2 members"); return; }
    if (editingBoardId) {
      const b = boards.find(x => x.id === editingBoardId);
      b.name = draft.name.trim(); b.memberIds = [...draft.memberIds];
    } else {
      boards.push({ id: uid(), name: draft.name.trim(), memberIds: [...draft.memberIds], created: Date.now() });
    }
    save(LS.boards, boards);
    draft = { name: "", memberIds: [] }; editingBoardId = null;
    toast("Board saved"); show("dashboard");
  });
  function editBoard(id) {
    const b = boards.find(x => x.id === id);
    if (!b) return;
    editingBoardId = id;
    draft = { name: b.name, memberIds: [...b.memberIds] };
    show("builder");
  }

  // ---------- Decision room ----------
  let selectedBoardId = null;

  // Decision templates: pre-fill the question/context + know which member types help most.
  const TEMPLATES = [
    {
      id: "career", label: "💼 Career",
      q: "Should I take this new job / role?",
      ctx: "The opportunity: \nMy current situation: \nWhat excites me: \nWhat worries me: ",
      stakes: "life-changing",
      suggest: ["jobs", "buffett", "naval", "goggins", "selman"]
    },
    {
      id: "business", label: "🚀 Business",
      q: "Should I start (or double down on) this business?",
      ctx: "The idea: \nMy runway / savings: \nThe risk: \nWhy now: ",
      stakes: "life-changing",
      suggest: ["musk", "jobs", "buffett", "naval", "ronaldo"]
    },
    {
      id: "money", label: "💰 Money",
      q: "Should I make this financial decision?",
      ctx: "The amount: \nWhat it's for: \nCan I afford the downside: ",
      stakes: "medium",
      suggest: ["buffett", "naval", "aurelius", "selman"]
    },
    {
      id: "relationship", label: "❤️ Relationship",
      q: "Should I make this relationship decision?",
      ctx: "The situation: \nHow I feel: \nWhat I'm afraid of: ",
      stakes: "life-changing",
      suggest: ["angelou", "oprah", "jesus", "aurelius", "mandela"]
    },
    {
      id: "faith", label: "🙏 Faith & Purpose",
      q: "Is this aligned with my purpose and values?",
      ctx: "What I'm considering: \nHow it fits my values: \nWhat my conscience says: ",
      stakes: "life-changing",
      suggest: ["selman", "jesus", "aurelius", "mandela", "angelou"]
    },
    {
      id: "health", label: "🧘 Health & Habits",
      q: "Should I commit to this change for my health/discipline?",
      ctx: "The change: \nWhat's stopped me before: \nWhy it matters now: ",
      stakes: "medium",
      suggest: ["goggins", "ronaldo", "aurelius", "naval"]
    }
  ];
  let activeTemplate = null;

  function renderTemplateChips() {
    const host = $("#templateChips");
    if (!host) return;
    host.innerHTML = TEMPLATES.map(t =>
      `<button class="chip ${activeTemplate === t.id ? "active" : ""}" data-tpl="${t.id}">${esc(t.label)}</button>`
    ).join("");
  }
  document.addEventListener("click", e => {
    const tp = e.target.closest("[data-tpl]");
    if (!tp) return;
    const t = TEMPLATES.find(x => x.id === tp.dataset.tpl);
    if (!t) return;
    if (activeTemplate === t.id) { // toggle off
      activeTemplate = null;
    } else {
      activeTemplate = t.id;
      $("#qInput").value = t.q;
      $("#ctxInput").value = t.ctx;
      $("#stakesInput").value = t.stakes;
    }
    renderTemplateChips();
    renderSuggestBanner();
  });

  // Suggest members not yet on the chosen board that fit the current template.
  function renderSuggestBanner() {
    const host = $("#suggestBanner");
    if (!host) return;
    const t = TEMPLATES.find(x => x.id === activeTemplate);
    const board = boards.find(b => b.id === $("#boardSelect").value);
    if (!t || !board) { host.innerHTML = ""; return; }
    const missing = t.suggest
      .filter(id => !board.memberIds.includes(id))
      .map(memberById).filter(Boolean).slice(0, 3);
    if (!missing.length) { host.innerHTML = ""; return; }
    host.innerHTML = `<div class="suggest">
      <span>💡 For a <b>${esc(t.label.replace(/^[^ ]+ /, ""))}</b> decision, consider adding:</span>
      ${missing.map(m => `<span class="add" data-addsuggest="${m.id}" data-board="${board.id}">+ ${esc(m.name)}</span>`).join("")}
    </div>`;
  }
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-addsuggest]");
    if (!a) return;
    const board = boards.find(b => b.id === a.dataset.board);
    if (board && !board.memberIds.includes(a.dataset.addsuggest)) {
      if (board.memberIds.length >= MAX_SEATS) { toast("Board is full (" + MAX_SEATS + ")"); return; }
      board.memberIds.push(a.dataset.addsuggest);
      save(LS.boards, boards);
      toast("Added to board");
      renderRoom(); renderSuggestBanner();
    }
  });

  function renderRoom() {
    renderTemplateChips();
    const sel = $("#boardSelect");
    if (!boards.length) {
      sel.innerHTML = `<option value="">No boards yet — build one first</option>`;
      $("#conveneBtn").disabled = true;
      $("#suggestBanner").innerHTML = "";
      return;
    }
    $("#conveneBtn").disabled = false;
    sel.innerHTML = boards.map(b => `<option value="${b.id}">${esc(b.name)} (${b.memberIds.length})</option>`).join("");
    if (selectedBoardId) sel.value = selectedBoardId;
    renderSuggestBanner();
  }
  $("#conveneBtn").addEventListener("click", convene);
  $("#boardSelect").addEventListener("change", renderSuggestBanner);

  async function convene() {
    const boardId = $("#boardSelect").value;
    const board = boards.find(b => b.id === boardId);
    const question = $("#qInput").value.trim();
    if (!board) { toast("Pick a board"); return; }
    if (!question) { toast("Enter your decision"); return; }

    const members = board.memberIds.map(memberById).filter(Boolean);
    const decision = {
      question,
      context: $("#ctxInput").value.trim(),
      stakes: $("#stakesInput").value
    };

    const out = $("#deliberation");
    out.innerHTML = `<div class="card"><div class="loading"><div class="spinner"></div> The board is deliberating…</div></div>`;

    let result = await tryAI(members, decision);
    if (!result) result = window.CouncilEngine.deliberateLocal(members, decision);

    lastDeliberation = { board, decision, result };
    renderDeliberation(members, result, board, decision);
  }

  async function tryAI(members, decision) {
    try {
      const resp = await fetch("/api/deliberate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members, decision })
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      if (data.fallback || !data.responses) return null;
      $("#aiStatus").textContent = "● AI mode";
      $("#aiStatus").style.color = "var(--go)";
      return data;
    } catch { return null; }
  }

  function renderDeliberation(members, result, board, decision) {
    const cards = result.responses.map(r => {
      const m = memberById(r.memberId) || members.find(x => x.name === r.name) || members[0];
      return `<div class="card resp">
        <div class="head">
          ${avatar(m)}
          <div class="meta"><h3>${esc(r.name)}</h3><div style="color:var(--muted);font-size:12px">${esc(m.category)}</div></div>
          <span class="lean ${r.lean}">${r.lean}</span>
        </div>
        <p>${esc(r.text)}</p>
        ${r.quote ? `<div class="quote">"${esc(r.quote)}"</div>` : ""}
        <div class="conf"><i style="width:${r.confidence}%"></i></div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">conviction ${r.confidence}%</div>
      </div>`;
    }).join("");

    const s = result.synthesis;
    const synth = `<div class="card synth">
      <div class="headline">🧭 ${esc(s.headline)}</div>
      <p style="line-height:1.6;margin:0">${esc(s.direction)}</p>
      <div class="blk"><h4>Where the board lands</h4><ul>${s.agree.map(a => `<li>${esc(a)}</li>`).join("")}</ul></div>
      <div class="blk"><h4>The core tension</h4><p style="margin:0;line-height:1.6">${esc(s.tension)}</p></div>
      <div class="blk"><h4>Sit with these questions</h4><ul>${s.questions.map(q => `<li>${esc(q)}</li>`).join("")}</ul></div>
      <button class="btn" style="margin-top:18px" id="recordVerdictBtn">📝 Record my verdict</button>
    </div>`;

    const followup = `<div class="card followup">
      <h2 style="margin:0;font-size:17px">💬 Ask the board a follow-up</h2>
      <p style="color:var(--muted);font-size:13px;margin:6px 0 0">Push back, add detail, or ask "what should I watch out for?"</p>
      <div class="thread" id="followThread"></div>
      <div class="ask">
        <input class="fld" id="followInput" placeholder="Ask a follow-up question…" />
        <button class="btn" id="followBtn">Ask</button>
      </div>
    </div>`;

    $("#deliberation").innerHTML =
      `<h2 style="margin-top:8px">The board responds</h2>` + cards + synth + followup;
    $("#recordVerdictBtn").addEventListener("click", recordVerdict);
    $("#followBtn").addEventListener("click", askFollowUp);
    $("#followInput").addEventListener("keydown", e => { if (e.key === "Enter") askFollowUp(); });
  }

  // ---------- Follow-up conversation ----------
  async function askFollowUp() {
    const input = $("#followInput");
    const q = input.value.trim();
    if (!q || !lastDeliberation) return;
    const thread = $("#followThread");
    thread.insertAdjacentHTML("beforeend", `<div class="bubble you">${esc(q)}</div>`);
    input.value = "";
    const loadingId = "fl" + Date.now();
    thread.insertAdjacentHTML("beforeend",
      `<div class="bubble board" id="${loadingId}"><div class="loading" style="padding:0"><div class="spinner"></div> The board is considering…</div></div>`);
    thread.scrollTop = thread.scrollHeight;

    const members = lastDeliberation.board.memberIds.map(memberById).filter(Boolean);
    let answer = await tryFollowUpAI(members, lastDeliberation.decision, lastDeliberation.result, q);
    if (!answer) answer = followUpLocal(members, q);

    const el = document.getElementById(loadingId);
    if (el) el.innerHTML = `<div class="who">The board</div>${esc(answer)}`;
    thread.scrollTop = thread.scrollHeight;
  }

  async function tryFollowUpAI(members, decision, priorResult, followup) {
    try {
      const resp = await fetch("/api/deliberate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members, decision, followup, priorResult })
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      if (data.fallback) return null;
      if (data.followupAnswer) return data.followupAnswer;
      // If the AI returned a fresh deliberation, summarize its direction as the answer.
      if (data.synthesis && data.synthesis.direction) return data.synthesis.direction;
      return null;
    } catch { return null; }
  }

  function followUpLocal(members, q) {
    const names = members.map(m => m.name.split(" ")[0]);
    const a = names[Math.abs(hashStr(q)) % names.length];
    const b = names[Math.abs(hashStr(q + "2")) % names.length];
    return `Good question. ${a} would say it comes down to your real priorities here — be honest about what you're optimizing for. ${b} would add: don't let fear or other people's expectations decide this for you. Sit with what you'd respect yourself for, and the answer usually gets clearer.`;
  }
  function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; } return h; }

  function recordVerdict() {
    openModal(`
      <button class="close" data-close>×</button>
      <h3>Record your verdict</h3>
      <p style="color:var(--muted);font-size:14px;margin-top:0">${esc(lastDeliberation.decision.question)}</p>
      <div class="field"><label>What did you decide?</label>
        <select class="fld" id="vDecision">
          <option>Going for it</option><option>Holding / waiting</option>
          <option>A different path</option><option>Still undecided</option>
        </select></div>
      <div class="field"><label>Why? (your reasoning)</label><textarea id="vWhy" placeholder="The board helped me see…"></textarea></div>
      <button class="btn" id="vSave">Save to history</button>
    `);
    $("#vSave").addEventListener("click", () => {
      const entry = {
        id: uid(),
        boardName: lastDeliberation.board.name,
        decision: lastDeliberation.decision,
        result: lastDeliberation.result,
        verdict: $("#vDecision").value,
        why: $("#vWhy").value.trim(),
        date: Date.now()
      };
      entry.outcome = "pending";
      history.unshift(entry); save(LS.history, history);
      closeModal(); toast("Saved to history"); show("history");
    });
  }

  // ---------- History + outcome tracking ----------
  const OUTCOMES = {
    win: { label: "✅ Worked out", short: "Worked out" },
    mixed: { label: "🤔 Mixed", short: "Mixed" },
    loss: { label: "❌ Didn't", short: "Didn't work out" },
    pending: { label: "⏳ Too soon", short: "Too soon to tell" }
  };

  function histCard(h, withOutcome) {
    const d = new Date(h.date);
    const oc = h.outcome && OUTCOMES[h.outcome] ? h.outcome : "pending";
    const outcomeUI = withOutcome ? `
      <div class="outcome-row">
        <span class="lbl">How did it turn out?</span>
        ${["win", "mixed", "loss", "pending"].map(k =>
          `<button class="obtn ${k} ${oc === k ? "on" : ""}" data-outcome="${h.id}" data-val="${k}">${OUTCOMES[k].label}</button>`
        ).join("")}
      </div>` : (h.outcome && h.outcome !== "pending"
        ? `<div class="ocard ${oc}">${OUTCOMES[oc].label}</div>` : "");
    return `<div class="card hist">
      <p class="q">${esc(h.decision.question)}</p>
      <div class="date">${d.toLocaleDateString()} · ${esc(h.boardName)}</div>
      ${h.verdict ? `<div class="verdict">Verdict: ${esc(h.verdict)}${h.why ? " — " + esc(h.why) : ""}</div>` : ""}
      ${outcomeUI}
    </div>`;
  }

  document.addEventListener("click", e => {
    const ob = e.target.closest("[data-outcome]");
    if (!ob) return;
    const h = history.find(x => x.id === ob.dataset.outcome);
    if (!h) return;
    h.outcome = h.outcome === ob.dataset.val ? "pending" : ob.dataset.val;
    save(LS.history, history);
    renderHistory();
  });

  function renderStats() {
    const host = $("#historyStats");
    if (!host) return;
    if (history.length < 1) { host.innerHTML = ""; return; }
    const total = history.length;
    const decided = history.filter(h => h.verdict && h.verdict !== "Still undecided").length;
    const wins = history.filter(h => h.outcome === "win").length;
    const rated = history.filter(h => h.outcome && h.outcome !== "pending").length;
    const winRate = rated ? Math.round((wins / rated) * 100) : null;

    let insight = "";
    if (total >= 3) {
      if (winRate !== null && winRate >= 70) insight = `🌟 Your board has a great track record — ${winRate}% of rated decisions worked out. Trust the process.`;
      else if (winRate !== null && winRate < 40 && rated >= 3) insight = `🔍 A few calls didn't land. Worth reviewing what the board flagged as the "core tension" in those.`;
      else insight = `📈 You've brought ${total} decisions to the board. Keep marking outcomes to learn your patterns.`;
    }

    host.innerHTML = `
      <div class="stats">
        <div class="card stat"><div class="num">${total}</div><div class="cap">decisions</div></div>
        <div class="card stat"><div class="num">${decided}</div><div class="cap">decided</div></div>
        <div class="card stat"><div class="num">${winRate !== null ? winRate + "%" : "—"}</div><div class="cap">worked out</div></div>
      </div>
      ${insight ? `<div class="insight">${insight}</div>` : ""}`;
  }

  function renderHistory() {
    renderStats();
    const list = $("#historyList");
    list.innerHTML = history.length
      ? history.map(h => histCard(h, true)).join("")
      : `<div class="card empty">No decisions recorded yet.</div>`;
  }

  // ---------- Modal ----------
  function openModal(html) { $("#modalBody").innerHTML = html; $("#modalBg").classList.add("show"); }
  function closeModal() { $("#modalBg").classList.remove("show"); }
  document.addEventListener("click", e => {
    if (e.target.id === "modalBg" || e.target.closest("[data-close]")) closeModal();
  });

  // ---------- Seed a demo board on first run ----------
  if (!boards.length && !load("council.seeded", false)) {
    boards.push({
      id: uid(), name: "My Life Board",
      memberIds: ["ronaldo", "selman", "jesus", "aurelius", "buffett"],
      created: Date.now()
    });
    save(LS.boards, boards); save("council.seeded", true);
  }

  // ---------- Public API for the cloud layer (firebase.js) ----------
  // Lets Firebase read/replace state and trigger a re-render after sign-in/sync.
  window.Council = {
    keys: LS,
    getState: () => ({ boards, history, customMembers }),
    // Replace local state with cloud data (called once after sign-in / on snapshot).
    hydrate: (data) => {
      if (data.boards) { boards = data.boards; rawSet(LS.boards, boards); }
      if (data.history) { history = data.history; rawSet(LS.history, history); }
      if (data.customMembers) { customMembers = data.customMembers; rawSet(LS.custom, customMembers); }
      const active = document.querySelector(".view.active");
      show(active ? active.id : "dashboard");
    },
    refresh: () => {
      const active = document.querySelector(".view.active");
      show(active ? active.id : "dashboard");
    }
  };

  // ---------- Boot ----------
  show("dashboard");
})();
