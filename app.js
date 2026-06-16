/* Council — Front-end Logic */
(function () {
  "use strict";

  const LS = { boards: "council.boards", history: "council.history", custom: "council.custom" };
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
  const save = (k, v) => { localStorage.setItem(k, JSON.stringify(v)); document.dispatchEvent(new CustomEvent("council:save")); };

  let boards = load(LS.boards, []);
  let history = load(LS.history, []);
  let customMembers = load(LS.custom, []);
  let lastDeliberation = null;

  const allMembers = () => window.COUNCIL_MEMBERS.concat(customMembers);
  const memberById = id => allMembers().find(m => m.id === id);

  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const esc = s => (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function show(view) {
    $$(".view").forEach(v => v.classList.toggle("active", v.id === view));
    if (view === "dashboard") renderDashboard();
    if (view === "room") renderRoom();
  }

  async function tryAI(members, decision) {
    const status = $("#aiStatus");
    try {
      const resp = await fetch("/api/deliberate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members, decision })
      });
      const data = await resp.json();
      if (!resp.ok || data.fallback) throw new Error("API Fallback");
      
      status.textContent = "● AI mode";
      status.style.color = "#22c55e"; // Green
      return data;
    } catch (e) {
      status.textContent = "● Local mode";
      status.style.color = "#64748b"; // Gray
      return null;
    }
  }

  async function convene() {
    const boardId = $("#boardSelect").value;
    const board = boards.find(b => b.id === boardId);
    const question = $("#qInput").value.trim();
    if (!board || !question) return;

    const members = board.memberIds.map(memberById).filter(Boolean);
    const decision = { question, context: $("#ctxInput").value.trim() };

    $("#deliberation").innerHTML = `<div class="card"><div class="loading"><div class="spinner"></div> The board is thinking…</div></div>`;

    let result = await tryAI(members, decision);
    if (!result) {
      result = window.CouncilEngine.deliberateLocal(members, decision);
    }

    lastDeliberation = { board, decision, result };
    renderDeliberation(result);
  }

  function renderDeliberation(result) {
    const cards = result.responses.map(r => {
      const m = memberById(r.memberId) || { name: r.name, category: "Advisor", color: "#4f46e5" };
      return `<div class="card resp">
        <div class="head"><h3>${esc(r.name)}</h3><span class="lean ${r.lean}">${r.lean}</span></div>
        <p>${esc(r.text)}</p>
        <div class="quote">"${esc(r.quote)}"</div>
      </div>`;
    }).join("");

    const s = result.synthesis;
    const synth = `<div class="card synth">
      <div class="headline">🧭 ${esc(s.headline)}</div>
      <p>${esc(s.direction)}</p>
      <div class="blk"><h4>Core Tension</h4><p>${esc(s.tension)}</p></div>
    </div>`;

    $("#deliberation").innerHTML = `<h2>The Board Responds</h2>` + cards + synth;
  }

  // --- Boot ---
  document.addEventListener("click", e => {
    if (e.target.id === "conveneBtn") convene();
    const nav = e.target.closest("[data-view]");
    if (nav) show(nav.dataset.view);
  });

  function renderDashboard() { /* Simplified for brevity */ }
  function renderRoom() { /* Simplified for brevity */ }

  show("dashboard");
})();
