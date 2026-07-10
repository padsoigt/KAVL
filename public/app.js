// ─────────────────────────────────────────────────────────────
//  COACH IA — front (vanilla, sans build)
// ─────────────────────────────────────────────────────────────
const API = "/api";
const state = { programme: null, seance: null };

const $ = (s, r = document) => r.querySelector(s);
async function api(path, opts = {}) {
  const res = await fetch(API + path, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Erreur ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}
const fmtDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", weekday: "short" });
const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const mdLite = (s = "") => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

// ── Navigation ────────────────────────────────────────────────
document.querySelectorAll("nav button").forEach((b) => b.addEventListener("click", () => switchView(b.dataset.view)));
function switchView(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.querySelectorAll("nav button").forEach((b) => b.classList.remove("active"));
  $(`#view-${name}`).classList.add("active");
  $(`nav button[data-view="${name}"]`).classList.add("active");
  document.body.classList.toggle("chat-mode", name === "chat");
  if (name === "chat") renderChat();
  if (name === "seance") renderSeance();
  if (name === "history") renderHistory();
  if (name === "prog") renderProg();
}

// ── Boot ──────────────────────────────────────────────────────
async function boot() {
  try {
    const progs = await api("/programmes");
    state.programme = progs.find((p) => p.actif) || progs[0] || null;
    $("#progName").textContent = state.programme ? state.programme.nom : "Aucun programme";
    if (!state.programme) { switchView("prog"); return; }
    document.body.classList.add("chat-mode");
    renderChat();
  } catch (e) {
    toast("Connexion impossible : " + e.message);
  }
}

// ── CHAT ──────────────────────────────────────────────────────
async function renderChat() {
  const log = $("#chat-log");
  if (!state.programme) {
    log.innerHTML = `<div class="chat-intro"><div class="big">🏛️</div>Crée d'abord ton programme dans <b>Réglages</b>.</div>`;
    return;
  }
  try {
    const msgs = await api(`/messages?programmeId=${state.programme._id}`);
    if (!msgs.length) {
      log.innerHTML = `<div class="chat-intro"><div class="big">🏋️</div>
        Ton coach est prêt.<br/>Pose-lui une question, ou tape <b>⚡</b> pour générer ta séance du jour.</div>`;
    } else {
      log.innerHTML = msgs.map((m) => `<div class="msg ${m.role}">${mdLite(m.content)}</div>`).join("");
    }
    scrollChat();
  } catch (e) {
    toast(e.message);
  }
}
function scrollChat() { const l = $("#chat-log"); if (l) l.scrollTop = l.scrollHeight; window.scrollTo(0, document.body.scrollHeight); }

async function envoyerMessage() {
  const inp = $("#chat-input");
  const contenu = inp.value.trim();
  if (!contenu || !state.programme) return;
  inp.value = "";
  const log = $("#chat-log");
  if ($(".chat-intro")) log.innerHTML = "";
  log.insertAdjacentHTML("beforeend", `<div class="msg user">${esc(contenu)}</div>`);
  log.insertAdjacentHTML("beforeend", `<div class="typing" id="typing">Le coach écrit<span class="spin" style="margin-left:6px"></span></div>`);
  scrollChat();
  try {
    const rep = await api(`/coach/chat/${state.programme._id}`, { method: "POST", body: JSON.stringify({ message: contenu }) });
    $("#typing")?.remove();
    log.insertAdjacentHTML("beforeend", `<div class="msg assistant">${mdLite(rep.content)}</div>`);
    scrollChat();
  } catch (e) {
    $("#typing")?.remove();
    toast("Erreur : " + e.message);
  }
}
$("#send-btn").addEventListener("click", envoyerMessage);
$("#chat-input").addEventListener("keydown", (e) => { if (e.key === "Enter") envoyerMessage(); });
$("#gen-btn").addEventListener("click", genererSeance);

// ── GÉNÉRATION DE SÉANCE ──────────────────────────────────────
async function genererSeance() {
  if (!state.programme) return toast("Crée d'abord un programme.");
  const chatMode = document.body.classList.contains("chat-mode");
  const log = $("#chat-log");
  if (chatMode) {
    if ($(".chat-intro")) log.innerHTML = "";
    log.insertAdjacentHTML("beforeend", `<div class="typing" id="typing">Le coach construit ta séance<span class="spin" style="margin-left:6px"></span></div>`);
    scrollChat();
  } else toast("Génération en cours…");
  try {
    const seance = await api(`/coach/generer/${state.programme._id}`, { method: "POST", body: JSON.stringify({ demande: "" }) });
    $("#typing")?.remove();
    state.seance = seance;
    toast("Séance prête 💪");
    switchView("seance");
  } catch (e) {
    $("#typing")?.remove();
    toast("Génération impossible : " + e.message);
  }
}

// ── SÉANCE ────────────────────────────────────────────────────
async function renderSeance() {
  const box = $("#seance-content");
  if (!state.programme) { box.innerHTML = `<div class="empty">Crée d'abord un programme.</div>`; return; }
  try {
    const seances = await api(`/seances?programmeId=${state.programme._id}`);
    const planifiee = seances.find((s) => s.statut === "planifiee");
    state.seance = planifiee || null;
    if (!planifiee) {
      box.innerHTML = `<div class="empty"><div class="big">📋</div>Aucune séance en attente.<br/>Va dans l'onglet <b>Coach</b> et tape ⚡ pour en générer une.</div>
        <button class="btn primary" id="gen-here">Générer ma séance</button>`;
      $("#gen-here").addEventListener("click", genererSeance);
      return;
    }
    $("#seance-sub").textContent = fmtDate(planifiee.date) + " · " + planifiee.nom;
    box.innerHTML = renderSeanceCards(planifiee);
    bindSeance();
  } catch (e) {
    box.innerHTML = `<div class="empty">${esc(e.message)}</div>`;
  }
}

function renderSeanceCards(s) {
  const note = s.resumeCoach ? `<div class="coach-note"><span class="lbl">Note du coach</span>${esc(s.resumeCoach)}</div>` : "";
  const warmup = `<div class="warmup"><b>Échauffement · </b>${esc(s.echauffement)}</div>`;
  const cards = s.exercices.map((ex, i) => {
    const focus = (ex.focus || []).map((f) => `<li>${esc(f)}</li>`).join("");
    const rem = [0, 1, 2, 3].map((k) =>
      `<input data-ei="${i}" data-rk="${k}" value="${esc(ex.remarques?.[k] || "")}" placeholder="Rep ${k + 1}" />`
    ).join("");
    return `<div class="exo-card">
      <div class="exo-top"><span class="exo-nom">${esc(ex.nom)}</span></div>
      <div class="exo-meta">
        <span class="chip charge">${esc(ex.charge)}</span>
        <span class="chip reps">${esc(ex.dureeRep)}</span>
        ${ex.cible ? `<span class="chip">${esc(ex.cible)}</span>` : ""}
        ${ex.materiel ? `<span class="chip">${esc(ex.materiel)}</span>` : ""}
      </div>
      ${focus ? `<ul class="focus-list">${focus}</ul>` : ""}
      <div class="remarques">${rem}</div>
    </div>`;
  }).join("");
  return `${note}${warmup}${cards}
    ${renderRessenti(s)}
    <button class="btn primary" id="finish-btn">Terminer la séance</button>
    <button class="btn ghost" id="export-btn">Exporter (.tsv Google Sheet)</button>
    <button class="btn ghost" id="skip-btn">Sauter cette séance</button>`;
}

function renderRessenti(s) {
  const r = s.ressenti || {};
  const grp = (key, label) => {
    const dots = [1, 2, 3, 4, 5].map((n) => `<button data-ressenti="${key}" data-val="${n}" class="${r[key] === n ? "on" : ""}">${n}</button>`).join("");
    return `<div class="grp"><label>${label}</label><div class="dots">${dots}</div></div>`;
  };
  return `<div class="card"><div class="ressenti">${grp("energie", "Énergie")}${grp("fatigue", "Fatigue")}${grp("humeur", "Humeur")}</div></div>`;
}

function bindSeance() {
  const box = $("#seance-content");
  box.querySelectorAll(".remarques input").forEach((inp) =>
    inp.addEventListener("input", (e) => {
      const { ei, rk } = e.target.dataset;
      state.seance.exercices[ei].remarques[rk] = e.target.value;
    })
  );
  box.querySelectorAll("[data-ressenti]").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const { ressenti, val } = e.currentTarget.dataset;
      state.seance.ressenti = state.seance.ressenti || {};
      state.seance.ressenti[ressenti] = Number(val);
      e.currentTarget.parentElement.querySelectorAll("button").forEach((b) => b.classList.remove("on"));
      e.currentTarget.classList.add("on");
    })
  );
  $("#finish-btn").addEventListener("click", () => terminerSeance("terminee"));
  $("#skip-btn").addEventListener("click", () => terminerSeance("sautee"));
  $("#export-btn").addEventListener("click", exporterTSV);
}

async function terminerSeance(statut) {
  try {
    await api(`/seances/${state.seance._id}`, {
      method: "PUT",
      body: JSON.stringify({
        statut,
        exercices: state.seance.exercices,
        ressenti: state.seance.ressenti,
        date: new Date().toISOString(),
      }),
    });
    toast(statut === "terminee" ? "Séance enregistrée 💪 Le coach s'en souviendra." : "Séance sautée");
    state.seance = null;
    renderSeance();
  } catch (e) {
    toast("Erreur : " + e.message);
  }
}

function exporterTSV() {
  const s = state.seance;
  const head = ["Exercice", "Charge", "Cible Musculaire", "Durée / Rép", "Matériel", "Focus / Posture", "Remarque rep 1", "Remarque rep 2", "Remarque rep 3", "Remarque rep 4"];
  const lignes = [head.join("\t"), ["Échauffement", "", "", "5 min", "Aucun", "", "", "", "", ""].join("\t")];
  s.exercices.forEach((ex) => {
    const focus = (ex.focus || []).map((f) => "• " + f).join("  ");
    const r = ex.remarques || ["", "", "", ""];
    lignes.push([ex.nom, ex.charge, ex.cible, ex.dureeRep, ex.materiel, focus, r[0] || "", r[1] || "", r[2] || "", r[3] || ""].join("\t"));
  });
  const blob = new Blob([lignes.join("\n")], { type: "text/tab-separated-values;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${s.nom.replace(/[^\w]+/g, "_")}.tsv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── HISTORIQUE ────────────────────────────────────────────────
async function renderHistory() {
  const box = $("#history-content");
  if (!state.programme) { box.innerHTML = `<div class="empty">Pas encore de programme.</div>`; return; }
  try {
    const [seances, stats] = await Promise.all([
      api(`/seances?programmeId=${state.programme._id}`),
      api(`/stats?programmeId=${state.programme._id}`),
    ]);
    const terminees = seances.filter((s) => s.statut === "terminee");
    box.innerHTML = renderStats(stats) + renderHistList(terminees);
  } catch (e) {
    box.innerHTML = `<div class="empty">${esc(e.message)}</div>`;
  }
}
function renderStats(stats) {
  const semaines = Object.keys(stats.seancesParSemaine).sort();
  const vals = semaines.map((k) => stats.seancesParSemaine[k]);
  const max = Math.max(1, ...vals);
  const bars = semaines.slice(-8).map((k) => `<div class="bar" style="height:${Math.max(8, (stats.seancesParSemaine[k] / max) * 100)}%" title="${k}"></div>`).join("");
  return `<div class="stats-row">
      <div class="stat"><div class="val">${stats.totalSeances}</div><div class="lbl">séances au total</div></div>
      <div class="stat"><div class="val">${stats.seances7j}</div><div class="lbl">ces 7 derniers jours</div></div>
    </div>
    ${bars ? `<div class="card"><div class="lbl" style="font-size:12px;color:var(--muted)">Séances par semaine</div><div class="spark">${bars}</div></div>` : ""}`;
}
function renderHistList(terminees) {
  if (!terminees.length) return `<div class="empty">Aucune séance terminée pour l'instant.</div>`;
  const items = terminees.map((s) => `<div class="hist-item">
      <div><div class="h-nom">${esc(s.nom)}</div><div class="h-date">${fmtDate(s.date)}</div></div>
      <div class="h-count">${s.exercices.length} exos</div>
    </div>`).join("");
  return `<div class="card">${items}</div>`;
}

// ── RÉGLAGES / PROGRAMME ──────────────────────────────────────
const DEFAUTS = {
  nom: "ROAD TO CAVILL",
  objectif: "Perdre du gras en construisant un maximum de muscle — physique esthétique, puissant et naturel inspiré d'Henry Cavill.",
  priorites: "Épaules larges, dos en V, pectoraux épais, bras massifs, bonne posture, force, santé articulaire.",
  profil: "26 ans, 176 cm, ~75 kg, alimentation optimisée, travail assis (dev web / DA), séances le matin, salle très bien équipée.",
  philosophie: "Sécurité d'abord : machines guidées, poulies, convergentes, Smith, Leg Press, Hack Squat. Hypertrophie, surcharge progressive, technique avant l'ego.",
  joursParSemaine: 4,
  dureeSeance: "1h45 à 2h10",
};

async function renderProg() {
  const box = $("#prog-content");
  const status = await api("/coach/status").catch(() => ({ ok: false }));
  const pill = status.ok
    ? `<div class="status-pill up"><span class="led"></span>IA en ligne · ${esc(status.modeleActif || "")}</div>`
    : `<div class="status-pill down"><span class="led"></span>IA hors ligne (PC ou tunnel éteint ?)</div>`;
  const p = state.programme || DEFAUTS;
  box.innerHTML = pill + `
    <div class="card">
      <label class="flabel">Nom du programme</label>
      <input class="field" id="f-nom" value="${esc(p.nom)}" />
      <label class="flabel">Objectif global</label>
      <textarea class="field" id="f-objectif">${esc(p.objectif)}</textarea>
      <label class="flabel">Priorités</label>
      <textarea class="field" id="f-priorites">${esc(p.priorites)}</textarea>
      <label class="flabel">Profil de l'athlète</label>
      <textarea class="field" id="f-profil">${esc(p.profil)}</textarea>
      <label class="flabel">Philosophie d'entraînement</label>
      <textarea class="field" id="f-philosophie">${esc(p.philosophie)}</textarea>
      <label class="flabel">Séances / semaine</label>
      <input class="field" id="f-jours" type="number" min="1" max="7" value="${p.joursParSemaine}" inputmode="numeric" />
      <label class="flabel">Durée cible d'une séance</label>
      <input class="field" id="f-duree" value="${esc(p.dureeSeance)}" />
      <button class="btn primary" id="save-prog">${state.programme ? "Enregistrer" : "Créer le programme"}</button>
    </div>`;
  $("#save-prog").addEventListener("click", saveProg);
}

async function saveProg() {
  const payload = {
    nom: $("#f-nom").value.trim() || "Mon programme",
    objectif: $("#f-objectif").value.trim(),
    priorites: $("#f-priorites").value.trim(),
    profil: $("#f-profil").value.trim(),
    philosophie: $("#f-philosophie").value.trim(),
    joursParSemaine: Number($("#f-jours").value) || 4,
    dureeSeance: $("#f-duree").value.trim(),
    actif: true,
  };
  try {
    const prog = state.programme
      ? await api(`/programmes/${state.programme._id}`, { method: "PUT", body: JSON.stringify(payload) })
      : await api("/programmes", { method: "POST", body: JSON.stringify(payload) });
    state.programme = prog;
    $("#progName").textContent = prog.nom;
    toast("Programme enregistré ✅");
    switchView("chat");
  } catch (e) {
    toast("Erreur : " + e.message);
  }
}

if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
boot();
