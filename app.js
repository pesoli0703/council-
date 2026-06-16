(function () {
  "use strict";
  const LS = { boards: "council.boards", history: "council.history", custom: "council.custom" };
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
  const save = (k, v) => { localStorage.setItem(k, JSON.stringify(v)); document.dispatchEvent(new CustomEvent("council:save")); };

  let boards = load(LS.boards, []);
  let history = load(LS.history, []);
  let customMembers = load(LS.custom, []);
  const allMembers = () => window.COUNCIL_MEMBERS.concat(customMembers);
  const memberById = id => allMembers().find(m => m.id === id);

  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const esc = s => (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const avatar = m => `<div class="avatar" style="background:${m.color || "#4f46e5"}">${m.name[0]}</div>`;

  function show(view) {
    $$(".view").forEach(v => v.classList.toggle("active", v.id === view));
    if (view === "dashboard") renderDashboard();
    if (view === "room") renderRoom();
    if (view === "gallery") renderGallery();
  }

  function renderDashboard() {
    const list = $("#boardsList");
    if (!boards.length) {
      list.innerHTML = `<div class="card empty">No boards yet. <button class="btn" data-view="builder">Create One</button></div>`;
    } else {
      list.innerHTML = boards.map(b => `<div class="card"><h3>${esc(b.name)}</h3><button class="btn sm" data-decide="${b.id}">Open Board</button></div>`).join("");
    }
  }

  function renderGallery() {
    const grid = $("#membersGrid");
    grid.innerHTML = allMembers().map(m => `<div class="card"><h3>${esc(m.name)}</h3><p>${esc(m.oneLiner)}</p></div>`).join("");
  }

  function renderRoom() {
    const sel = $("#boardSelect");
    sel.innerHTML = boards.map(b => `<option value="${b.id}">${esc(b.name)}</option>`).join("");
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
    } catch (e) {
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
    $("#deliberation").innerHTML = `<div class="loading">Deliberating...</div>`;

    let result = await tryAI(members, decision);
    if (!result) result = window.CouncilEngine.deliberateLocal(members, decision);

    $("#deliberation").innerHTML = result.responses.map(r => `
      <div class="card">
        <div class="head"><strong>${esc(r.name)}</strong> <span class="lean ${r.lean}">${r.lean}</span></div>
        <p>${esc(r.text)}</p>
      </div>`).join("") + `<div class="card synth"><h3>Summary</h3><p>${result.synthesis.direction}</p></div>`;
  }

  document.addEventListener("click", e => {
    const v = e.target.closest("[data-view]");
    if (v) show(v.dataset.view);
    if (e.target.id === "conveneBtn") convene();
    if (e.target.dataset.decide) {
      show("room");
      $("#boardSelect").value = e.target.dataset.decide;
    }
  });

  show("dashboard");
})();
