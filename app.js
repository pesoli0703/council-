(function () {
  "use strict";

  const LS = { boards: "council.boards", history: "council.history", custom: "council.custom" };
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
  const save = (k, v) => { localStorage.setItem(k, JSON.stringify(v)); document.dispatchEvent(new CustomEvent("council:save")); };

  let boards = load(LS.boards, []);
  let history = load(LS.history, []);
  let customMembers = load(LS.custom, []);
  let draft = { name: "", memberIds: [] };
  let lastDeliberation = null;

  const allMembers = () => window.COUNCIL_MEMBERS.concat(customMembers);
  const memberById = id => allMembers().find(m => m.id === id);

  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const esc = s => (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const initials = n => n.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const avatar = (m) => `<div class="avatar" style="background:${m.color || "#4f46e5"}">${initials(m.name)}</div>`;

  function show(view) {
    $$(".view").forEach(v => v.classList.toggle("active", v.id === view));
    $$(".links button").forEach(b => b.classList.toggle("active", b.dataset.view === view));
    if (view === "dashboard") renderDashboard();
    if (view === "gallery") renderGallery();
    if (view === "builder") renderBuilder();
    if (view === "room") renderRoom();
  }

  function renderDashboard() {
    const list = $("#boardsList");
    list.innerHTML = boards.length ? boards.map(b => `
      <div class="card">
        <h3>${esc(b.name)}</h3>
        <div class="row">
          <button class="btn sm" data-decide="${b.id}">Bring a decision</button>
        </div>
      </div>`).join("") : `<p>No boards yet. Build one first.</p>`;
  }

  function renderGallery() {
    $("#membersGrid").innerHTML = allMembers().map(m => `
      <div class="card member">
        <div class="head">${avatar(m)} <h3>${esc(m.name)}</h3></div>
        <p>${esc(m.oneLiner)}</p>
        <button class="btn sm" data-toggle="${m.id}">${draft.memberIds.includes(m.id) ? "✓ Added" : "+ Add"}</button>
      </div>`).join("");
  }

  function renderBuilder() {
    $("#boardName").value = draft.name;
    $("#seatsGrid").innerHTML = draft.memberIds.map(id => {
      const m = memberById(id);
      return `<div class="seat-slot filled">${avatar(m)} <span>${esc(m.name)}</span> <button data-remove="${id}">✕</button></div>`;
    }).join("");
  }

  function renderRoom() {
    $("#boardSelect").innerHTML = boards.map(b => `<option value="${b.id}">${esc(b.name)}</option>`).join("");
  }

  async function tryAI(members, decision) {
    try {
      const resp = await fetch("/api/deliberate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members, decision })
      });
      const data = await resp.json();
      if (!resp.ok) return null;
      $("#aiStatus").textContent = "● AI mode";
      $("#aiStatus").style.color = "#22c55e";
      return data;
    } catch (e) { return null; }
  }

  async function convene() {
    const boardId = $("#boardSelect").value;
    const board = boards.find(b => b.id === boardId);
    const question = $("#qInput").value.trim();
    if (!board || !question) return;

    const members = board.memberIds.map(memberById).filter(Boolean);
    const decision = { question, context: $("#ctxInput").value.trim() };
    $("#deliberation").innerHTML = `<div class="loading">The board is thinking…</div>`;

    let result = await tryAI(members, decision);
    if (!result) {
      $("#aiStatus").textContent = "● Local mode";
      result = window.CouncilEngine.deliberateLocal(members, decision);
    }
    renderDeliberation(result);
  }

  function renderDeliberation(result) {
    $("#deliberation").innerHTML = result.responses.map(r => `
      <div class="card resp">
        <h3>${esc(r.name)} <span class="lean ${r.lean}">${r.lean}</span></h3>
        <p>${esc(r.text)}</p>
        <div class="quote">"${esc(r.quote)}"</div>
      </div>`).join("") + `<div class="card synth"><h3>Synthesis</h3><p>${esc(result.synthesis.direction)}</p></div>`;
  }

  document.addEventListener("click", e => {
    const nav = e.target.closest("[data-view]");
    if (nav) show(nav.dataset.view);
    if (e.target.dataset.decide) { show("room"); $("#boardSelect").value = e.target.dataset.decide; }
    if (e.target.id === "conveneBtn") convene();
    if (e.target.dataset.toggle) {
      const id = e.target.dataset.toggle;
      if (draft.memberIds.includes(id)) draft.memberIds = draft.memberIds.filter(x => x !== id);
      else draft.memberIds.push(id);
      renderGallery();
    }
    if (e.target.dataset.remove) {
      draft.memberIds = draft.memberIds.filter(x => x !== e.target.dataset.remove);
      renderBuilder();
    }
    if (e.target.id === "saveBoardBtn") {
      draft.name = $("#boardName").value;
      boards.push({ id: "id" + Date.now(), name: draft.name, memberIds: [...draft.memberIds] });
      save(LS.boards, boards);
      show("dashboard");
    }
  });

  show("dashboard");
})();
