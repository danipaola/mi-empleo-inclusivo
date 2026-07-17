
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const KEYS = {
  companies:"mei_custom_companies_v2",
  people:"mei_custom_people_v2",
  sent:"mei_cv_sent_v2"
};

let baseCompanies=[], basePeople=[], vacancies=[];
let customCompanies=JSON.parse(localStorage.getItem(KEYS.companies)||"[]");
let customPeople=JSON.parse(localStorage.getItem(KEYS.people)||"[]");
let sent=JSON.parse(localStorage.getItem(KEYS.sent)||"{}");

async function loadJSON(path){
  try{
    const r=await fetch(path,{cache:"no-store"});
    if(!r.ok) throw new Error(path);
    return await r.json();
  }catch(e){ console.warn(e); return []; }
}
function esc(v=""){
  return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function safeUrl(v){
  try{const u=new URL(v);return ["http:","https:"].includes(u.protocol)?u.href:"#"}catch{return "#"}
}
function logoUrl(domain){
  return domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128` : "";
}
function initials(name=""){
  return name.split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase();
}
function logoHTML(name,domain){
  return domain
    ? `<img class="company-logo" src="${logoUrl(domain)}" alt="Logo de ${esc(name)}" onerror="this.outerHTML='<span class=&quot;logo-fallback&quot;>${esc(initials(name))}</span>'">`
    : `<span class="logo-fallback">${esc(initials(name))}</span>`;
}

function setupTabs(){
  $$(".tab").forEach(tab=>tab.addEventListener("click",()=>{
    $$(".tab").forEach(t=>t.classList.toggle("active",t===tab));
    $$(".panel").forEach(p=>p.classList.toggle("active",p.id===tab.dataset.tab));
  }));
}

function renderVacancies(){
  const box=$("#vacancyList");
  if(!vacancies.length){
    box.innerHTML='<div class="empty">💼 No hay vacantes cargadas por el momento.</div>';
    return;
  }
  box.innerHTML=vacancies.map(v=>`
    <article class="job-card">
      <div class="job-head">
        ${logoHTML(v.company,v.domain)}
        <div>
          <h3 class="job-title">${esc(v.title)}</h3>
          <p class="company-name">${esc(v.company)}</p>
        </div>
      </div>
      <div class="chips">
        ${v.location?`<span class="chip">📍 ${esc(v.location)}</span>`:""}
        ${v.modality?`<span class="chip">🏠 ${esc(v.modality)}</span>`:""}
        ${v.date?`<span class="chip">📅 ${esc(v.date)}</span>`:""}
      </div>
      <label class="cv-line">
        <input type="checkbox" data-vacancy="${esc(v.id)}" ${sent[v.id]?"checked":""}>
        CV enviado
      </label>
      <div class="job-actions">
        <a class="primary-btn" href="${safeUrl(v.apply_url)}" target="_blank" rel="noopener">Postularme</a>
        <a class="outline-btn" href="${safeUrl(v.official_url)}" target="_blank" rel="noopener">Portal oficial</a>
      </div>
    </article>
  `).join("");
  $$("[data-vacancy]").forEach(c=>c.addEventListener("change",e=>{
    sent[e.target.dataset.vacancy]=e.target.checked;
    localStorage.setItem(KEYS.sent,JSON.stringify(sent));
  }));
}

function renderPeople(){
  const all=[
    ...basePeople.map(x=>({...x,custom:false})),
    ...customPeople.map((x,i)=>({...x,custom:true,index:i}))
  ];
  $("#linkedinList").innerHTML=all.length?all.map(p=>`
    <article class="linkedin-card">
      <div class="linkedin-top">
        <h3 class="linkedin-name">${esc(p.name)}</h3>
        <span class="linkedin-badge">in</span>
      </div>
      <p class="linkedin-label">Última publicación</p>
      <p class="linkedin-text">${esc(p.publication)}</p>
      <a class="primary-btn" href="${safeUrl(p.url)}" target="_blank" rel="noopener">Abrir publicación</a>
      ${p.custom?`<button class="delete-mini delete-person" data-index="${p.index}" title="Eliminar">×</button>`:""}
    </article>
  `).join(""):'<div class="empty">No hay publicaciones cargadas.</div>';

  $$(".delete-person").forEach(b=>b.addEventListener("click",()=>{
    customPeople.splice(Number(b.dataset.index),1);
    localStorage.setItem(KEYS.people,JSON.stringify(customPeople));
    renderPeople();
  }));
}

function renderCompanies(query=""){
  const q=query.trim().toLowerCase();
  const all=[
    ...baseCompanies.map(x=>({...x,custom:false})),
    ...customCompanies.map((x,i)=>({...x,custom:true,index:i}))
  ].filter(c=>c.name.toLowerCase().includes(q))
   .sort((a,b)=>a.name.localeCompare(b.name,"es"));

  $("#companyList").innerHTML=all.length?all.map(c=>`
    <article class="company-card">
      ${logoHTML(c.name,c.domain)}
      <div class="company-info">
        <h3>${esc(c.name)}</h3>
        <a href="${safeUrl(c.url)}" target="_blank" rel="noopener">Abrir portal →</a>
      </div>
      ${c.custom?`<button class="delete-mini delete-company" data-index="${c.index}" title="Eliminar">×</button>`:""}
    </article>
  `).join(""):'<div class="empty">No se encontró esa empresa.</div>';

  $$(".delete-company").forEach(b=>b.addEventListener("click",()=>{
    customCompanies.splice(Number(b.dataset.index),1);
    localStorage.setItem(KEYS.companies,JSON.stringify(customCompanies));
    renderCompanies($("#companySearch").value);
  }));
}

function setupDialogs(){
  const company=$("#companyModal"), person=$("#personModal");
  $("#openCompanyModal").onclick=()=>company.showModal();
  $("#openPersonModal").onclick=()=>person.showModal();
  $$(".close-dialog").forEach(b=>b.onclick=()=>b.closest("dialog").close());

  $("#companyForm").addEventListener("submit",e=>{
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    customCompanies.push({
      name:f.get("name").trim(),
      url:f.get("url").trim(),
      domain:f.get("domain").trim()
    });
    localStorage.setItem(KEYS.companies,JSON.stringify(customCompanies));
    e.currentTarget.reset(); company.close(); renderCompanies($("#companySearch").value);
  });

  $("#personForm").addEventListener("submit",e=>{
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    customPeople.push({
      name:f.get("name").trim(),
      publication:f.get("publication").trim(),
      url:f.get("url").trim()
    });
    localStorage.setItem(KEYS.people,JSON.stringify(customPeople));
    e.currentTarget.reset(); person.close(); renderPeople();
  });
}

function setupInstall(){
  let prompt;
  const btn=$("#installBtn");
  window.addEventListener("beforeinstallprompt",e=>{
    e.preventDefault(); prompt=e; btn.classList.remove("hidden");
  });
  btn.addEventListener("click",async()=>{
    if(!prompt)return;
    prompt.prompt(); await prompt.userChoice;
    prompt=null; btn.classList.add("hidden");
  });
}

async function init(){
  setupTabs(); setupDialogs(); setupInstall();
  $("#refreshBtn").onclick=()=>location.reload();
  $("#companySearch").addEventListener("input",e=>renderCompanies(e.target.value));

  [baseCompanies,basePeople,vacancies]=await Promise.all([
    loadJSON("data/companies.json"),
    loadJSON("data/linkedin_sources.json"),
    loadJSON("data/vacancies.json")
  ]);

  renderVacancies(); renderPeople(); renderCompanies();

  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("sw.js").catch(console.error);
  }
}
document.addEventListener("DOMContentLoaded",init);
