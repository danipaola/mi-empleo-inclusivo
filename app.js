
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const STORAGE = {
  companies: "mei_custom_companies",
  people: "mei_custom_people",
  sent: "mei_cv_sent"
};

let baseCompanies = [];
let basePeople = [];
let vacancies = [];
let customCompanies = JSON.parse(localStorage.getItem(STORAGE.companies) || "[]");
let customPeople = JSON.parse(localStorage.getItem(STORAGE.people) || "[]");
let sent = JSON.parse(localStorage.getItem(STORAGE.sent) || "{}");

async function loadJSON(path, fallback=[]) {
  try {
    const response = await fetch(path, {cache:"no-store"});
    if (!response.ok) throw new Error("No se pudo cargar " + path);
    return await response.json();
  } catch (error) {
    console.warn(error);
    return fallback;
  }
}

function safeUrl(url) {
  try {
    const parsed = new URL(url);
    return ["http:","https:"].includes(parsed.protocol) ? parsed.href : "#";
  } catch { return "#"; }
}

function esc(value="") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[c]);
}

function renderSummary() {
  $("#vacancyCount").textContent = vacancies.filter(v => v.is_new).length;
  $("#publicationCount").textContent = basePeople.length + customPeople.length;
  $("#companyCount").textContent = baseCompanies.length + customCompanies.length;
}

function renderVacancies() {
  const list = $("#vacancyList");
  if (!vacancies.length) {
    list.innerHTML = '<div class="empty">No hay vacantes cargadas por el momento.</div>';
    return;
  }
  list.innerHTML = vacancies.map(v => `
    <article class="card">
      <h3>${esc(v.title)}</h3>
      <p><strong>${esc(v.company)}</strong></p>
      <p>${esc(v.location || "")}</p>
      <p>${esc(v.date || "")}</p>
      <label class="checkline">
        <input type="checkbox" data-vacancy="${esc(v.id)}" ${sent[v.id] ? "checked" : ""}>
        CV enviado
      </label>
      <div class="actions">
        <a class="primary" href="${safeUrl(v.apply_url)}" target="_blank" rel="noopener">Postularme</a>
        <a class="secondary" href="${safeUrl(v.official_url)}" target="_blank" rel="noopener">Portal oficial</a>
      </div>
    </article>
  `).join("");
  $$("[data-vacancy]").forEach(box => box.addEventListener("change", e => {
    sent[e.target.dataset.vacancy] = e.target.checked;
    localStorage.setItem(STORAGE.sent, JSON.stringify(sent));
  }));
}

function renderCompanies(query="") {
  const normalized = query.trim().toLowerCase();
  const all = [
    ...baseCompanies.map(x => ({...x, custom:false})),
    ...customCompanies.map((x,i) => ({...x, custom:true, customIndex:i}))
  ].filter(c => c.name.toLowerCase().includes(normalized))
   .sort((a,b) => a.name.localeCompare(b.name,"es"));

  $("#companyList").innerHTML = all.length ? all.map(c => `
    <article class="card">
      <h3>${esc(c.name)}</h3>
      <div class="actions">
        <a class="primary" href="${safeUrl(c.url)}" target="_blank" rel="noopener">Portal de empleos</a>
        ${c.custom ? `<button class="danger delete-company" data-index="${c.customIndex}">Eliminar</button>` : ""}
      </div>
    </article>
  `).join("") : '<div class="empty">No se encontró esa empresa.</div>';

  $$(".delete-company").forEach(btn => btn.addEventListener("click", () => {
    customCompanies.splice(Number(btn.dataset.index),1);
    localStorage.setItem(STORAGE.companies, JSON.stringify(customCompanies));
    renderCompanies($("#companySearch").value);
    renderSummary();
  }));
}

function renderPeople() {
  const all = [
    ...basePeople.map(x => ({...x, custom:false})),
    ...customPeople.map((x,i) => ({...x, custom:true, customIndex:i}))
  ];
  $("#linkedinList").innerHTML = all.length ? all.map(p => `
    <article class="card">
      <h3>${esc(p.name)}</h3>
      <p class="label">Última publicación</p>
      <p>${esc(p.publication)}</p>
      <p class="label">Puesto</p>
      <p><strong>${esc(p.position)}</strong></p>
      <div class="actions">
        <a class="primary" href="${safeUrl(p.url)}" target="_blank" rel="noopener">Abrir publicación</a>
        ${p.custom ? `<button class="danger delete-person" data-index="${p.customIndex}">Eliminar</button>` : ""}
      </div>
    </article>
  `).join("") : '<div class="empty">Todavía no agregaste publicaciones.</div>';

  $$(".delete-person").forEach(btn => btn.addEventListener("click", () => {
    customPeople.splice(Number(btn.dataset.index),1);
    localStorage.setItem(STORAGE.people, JSON.stringify(customPeople));
    renderPeople();
    renderSummary();
  }));
}

function setupTabs() {
  $$(".tab").forEach(tab => tab.addEventListener("click", () => {
    $$(".tab").forEach(t => t.classList.toggle("active", t === tab));
    $$(".panel").forEach(p => p.classList.toggle("active", p.id === tab.dataset.tab));
  }));
}

function setupDialogs() {
  const companyModal = $("#companyModal");
  const personModal = $("#personModal");
  $("#openCompanyModal").onclick = () => companyModal.showModal();
  $("#openPersonModal").onclick = () => personModal.showModal();
  $$(".close-dialog").forEach(b => b.onclick = () => b.closest("dialog").close());

  $("#companyForm").addEventListener("submit", e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    customCompanies.push({name:form.get("name").trim(), url:form.get("url").trim()});
    localStorage.setItem(STORAGE.companies, JSON.stringify(customCompanies));
    e.currentTarget.reset();
    companyModal.close();
    renderCompanies($("#companySearch").value);
    renderSummary();
  });

  $("#personForm").addEventListener("submit", e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    customPeople.push({
      name:form.get("name").trim(),
      publication:form.get("publication").trim(),
      position:form.get("position").trim(),
      url:form.get("url").trim()
    });
    localStorage.setItem(STORAGE.people, JSON.stringify(customPeople));
    e.currentTarget.reset();
    personModal.close();
    renderPeople();
    renderSummary();
  });
}

function setupInstall() {
  let deferredPrompt;
  const btn = $("#installBtn");
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredPrompt = e;
    btn.classList.remove("hidden");
  });
  btn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    btn.classList.add("hidden");
  });
}

async function init() {
  setupTabs();
  setupDialogs();
  setupInstall();
  $("#companySearch").addEventListener("input", e => renderCompanies(e.target.value));
  $("#refreshBtn").addEventListener("click", () => location.reload());

  [baseCompanies, basePeople, vacancies] = await Promise.all([
    loadJSON("data/companies.json", []),
    loadJSON("data/linkedin_sources.json", []),
    loadJSON("data/vacancies.json", [])
  ]);

  renderSummary();
  renderVacancies();
  renderCompanies();
  renderPeople();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(console.error);
  }
}
document.addEventListener("DOMContentLoaded", init);
