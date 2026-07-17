const BASE_LINKEDIN=[{"name": "Julieta Mariela Moranzoni", "profile": "https://www.linkedin.com/in/julieta-mariela-moranzoni-27a4a736", "type": "Oportunidad laboral", "job": "Administrativo/a de Producción", "company": "SUMATE – Consultora en inclusión", "location": "Buenos Aires", "date": "Publicación guardada", "post": "https://www.linkedin.com/search/results/content/?keywords=%22Administrativo%20de%20Producci%C3%B3n%22%20%22Julieta%20Mariela%20Moranzoni%22"}, {"name": "Silvina Alonso", "profile": "https://www.linkedin.com/in/silvina-alonso-22243a46", "type": "Oportunidad Laboral para Personas con Discapacidad", "job": "Ingeniera/o Microsoft Fabric", "company": "Entidad financiera", "location": "No informada", "date": "Publicado hace 3 semanas", "post": "https://www.linkedin.com/posts/silvina-alonso-22243a46_empleo-oportunidades-oportunidadlaboral-activity-7475273670517526528-n_g0"}, {"name": "Karina Guerschberg", "profile": "https://www.linkedin.com/in/karina-guerschberg", "type": "BÚSQUEDA LABORAL (solo comparto)", "job": "Orientador/a – Taller Manual (Turno Tarde)", "company": "Centro de Día para jóvenes y adultos con discapacidad intelectual", "location": "Vicente López", "date": "Publicado hace 1 semana", "post": "https://www.linkedin.com/search/results/content/?keywords=%22Orientador%2Fa%22%20%22Taller%20Manual%22%20%22Karina%20Guerschberg%22"}];
const BASE_COMPANIES=[{"name": "Accenture", "url": "https://www.accenture.com/ar-es/careers", "domain": "accenture.com"}, {"name": "Arcor", "url": "https://www.arcor.com/ar/trabaja-con-nosotros", "domain": "arcor.com"}, {"name": "Banco Galicia", "url": "https://www.galicia.ar/personas/trabaja-con-nosotros", "domain": "galicia.ar"}, {"name": "Banco Nación", "url": "https://www.bna.com.ar/Institucional/TrabajaConNosotros", "domain": "bna.com.ar"}, {"name": "Banco Provincia", "url": "https://www.bancoprovincia.com.ar/web/trabaja_con_nosotros", "domain": "bancoprovincia.com.ar"}, {"name": "CILSA", "url": "https://www.cilsa.org/", "domain": "cilsa.org"}, {"name": "Coca-Cola FEMSA", "url": "https://coca-colafemsa.com/trabaja-con-nosotros/", "domain": "coca-colafemsa.com"}, {"name": "Coto", "url": "https://www.coto.com.ar/empleos/", "domain": "coto.com.ar"}, {"name": "Globant", "url": "https://career.globant.com/", "domain": "globant.com"}, {"name": "IBM", "url": "https://www.ibm.com/careers", "domain": "ibm.com"}, {"name": "Mercado Libre", "url": "https://careers-meli.mercadolibre.com/", "domain": "mercadolibre.com"}, {"name": "Natura", "url": "https://www.natura.com.ar/trabaja-con-nosotros", "domain": "natura.com.ar"}, {"name": "Randstad", "url": "https://www.randstad.com.ar/trabajos/", "domain": "randstad.com.ar"}, {"name": "Toyota Argentina", "url": "https://www.toyota.com.ar/trabaja-con-nosotros", "domain": "toyota.com.ar"}, {"name": "Unilever", "url": "https://careers.unilever.com/", "domain": "unilever.com"}, {"name": "YPF", "url": "https://www.ypf.com/trabaja-con-nosotros", "domain": "ypf.com"}];

const KEYS={people:"mei_people_v21",companies:"mei_companies_v21",sent:"mei_sent_v21"};
let customPeople=JSON.parse(localStorage.getItem(KEYS.people)||"[]");
let customCompanies=JSON.parse(localStorage.getItem(KEYS.companies)||"[]");
let sentVacancies=JSON.parse(localStorage.getItem(KEYS.sent)||"{}");

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safe=v=>{try{const u=new URL(v);return ["http:","https:"].includes(u.protocol)?u.href:"#"}catch{return"#"}};
const logo=d=>`https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=128`;
const initials=n=>n.split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase();

function tabs(){$$(".tab").forEach(b=>b.onclick=()=>{$$(".tab").forEach(x=>x.classList.toggle("active",x===b));$$(".panel").forEach(x=>x.classList.toggle("active",x.id===b.dataset.tab))})}

async function loadVacancies(showMessage=false){
  const box=$("#vacancyList");
  if(!box) return;

  try{
    const response=await fetch(`./vacancies.json?ts=${Date.now()}`,{cache:"no-store"});
    if(!response.ok) throw new Error("No se pudo leer vacancies.json");

    const vacancies=await response.json();
    renderVacancies(Array.isArray(vacancies)?vacancies:[]);

    if(showMessage){
      const status=$("#vacancyStatus")||$("#statusText");
      if(status) status.textContent="Vacantes actualizadas.";
    }
  }catch(error){
    box.innerHTML='<div class="notice"><strong>No se pudieron cargar las vacantes.</strong><p>Revisá que el archivo vacancies.json esté subido en GitHub.</p></div>';
  }
}

function renderVacancies(vacancies){
  const box=$("#vacancyList");
  if(!box) return;

  const count=$("#vacancyCount");
  if(count) count.textContent=String(vacancies.length);

  if(!vacancies.length){
    box.innerHTML='<div class="notice"><strong>No hay vacantes cargadas.</strong></div>';
    return;
  }

  box.innerHTML=vacancies.map(v=>{
    const id=v.id||v.identificacion||`${v.company||v.compania}-${v.title||v.titulo}`;
    const company=v.company||v.compania||"Empresa";
    const title=v.title||v.titulo||"Vacante";
    const location=v.location||v.ubicacion||"Buenos Aires";
    const date=v.date||v.fecha||"Fecha no informada";
    const url=v.url||v.link||"#";
    const portal=v.portal||url;

    return `<article class="vacancy-card">
      <div class="card-top">
        <h3>${esc(company)}</h3>
        <span class="badge">Vacante</span>
      </div>
      <div class="meta">
        <div>💼 <span><strong>${esc(title)}</strong></span></div>
        <div>📍 <span>${esc(location)}</span></div>
        <div>📅 <span>${esc(date)}</span></div>
      </div>
      <div class="actions">
        <a class="primary" target="_blank" rel="noopener" href="${safe(url)}">Postularme</a>
        <a class="secondary" target="_blank" rel="noopener" href="${safe(portal)}">Portal de empleos</a>
      </div>
      <label class="sent">
        <input type="checkbox" data-vacancy-id="${esc(id)}" ${sentVacancies[id]?"checked":""}>
        CV enviado
      </label>
    </article>`;
  }).join("");

  $$("[data-vacancy-id]").forEach(input=>{
    input.onchange=()=>{
      sentVacancies[input.dataset.vacancyId]=input.checked;
      localStorage.setItem(KEYS.sent,JSON.stringify(sentVacancies));
    };
  });
}

function renderLinkedin(){
 const all=[...BASE_LINKEDIN,...customPeople.map(p=>({...p,type:"Persona agregada",job:"Publicación pendiente",company:"LinkedIn",location:"",date:"Abrí el perfil para revisar sus publicaciones",post:p.profile,custom:true}))];
 $("#linkedinList").innerHTML=all.map(p=>`<article class="linkedin-card"><div class="card-top"><h3 class="person">${esc(p.name)}</h3><span class="badge">LinkedIn</span></div><div class="type">🟢 ${esc(p.type)}</div><div class="meta"><div>💼 <span><strong>${esc(p.job)}</strong></span></div><div>🏢 <span>${esc(p.company)}</span></div>${p.location?`<div>📍 <span>${esc(p.location)}</span></div>`:""}<div>📅 <span>${esc(p.date)}</span></div></div><div class="actions"><a class="primary" target="_blank" href="${safe(p.post)}">Abrir publicación</a><a class="secondary" target="_blank" href="${safe(p.profile)}">Ver perfil</a></div>${p.custom?'<div class="custom-note">Todavía no hay una publicación específica guardada.</div>':""}</article>`).join("");
}

function renderCompanies(q=""){
 const all=[...BASE_COMPANIES,...customCompanies].filter(x=>x.name.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.name.localeCompare(b.name,"es"));
 $("#companyList").innerHTML=all.map(c=>`<article class="company">${c.domain?`<img class="logo" src="${logo(c.domain)}" onerror="this.outerHTML='<span class=&quot;fallback&quot;>${esc(initials(c.name))}</span>'">`:`<span class="fallback">${esc(initials(c.name))}</span>`}<div class="company-info"><h3>${esc(c.name)}</h3><a href="${safe(c.url)}" target="_blank">Abrir portal →</a></div></article>`).join("");
}

function dialogs(){
 const pm=$("#personModal"),cm=$("#companyModal"),im=$("#infoModal");
 $("#openPerson").onclick=()=>pm.showModal();$("#openCompany").onclick=()=>cm.showModal();$("#refreshLinkedin").onclick=()=>im.showModal();
 $$(".close").forEach(b=>b.onclick=()=>b.closest("dialog").close());$(".close-info").onclick=()=>im.close();
 $("#personForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);customPeople.push({name:f.get("name").trim(),profile:f.get("profile").trim()});localStorage.setItem(KEYS.people,JSON.stringify(customPeople));e.currentTarget.reset();pm.close();renderLinkedin()};
 $("#companyForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);customCompanies.push({name:f.get("name").trim(),url:f.get("url").trim(),domain:f.get("domain").trim()});localStorage.setItem(KEYS.companies,JSON.stringify(customCompanies));e.currentTarget.reset();cm.close();renderCompanies($("#companySearch").value)};
}

function install(){
 let p;const b=$("#installBtn");window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();p=e;b.classList.remove("hidden")});b.onclick=async()=>{if(!p)return;p.prompt();await p.userChoice;p=null;b.classList.add("hidden")}
}

document.addEventListener("DOMContentLoaded",()=>{
  tabs();
  dialogs();
  install();
  $("#companySearch").oninput=e=>renderCompanies(e.target.value);
  renderLinkedin();
  renderCompanies();

  const refresh=$("#refreshVacancies")||$("#refreshBtn")||$("#vacancyRefresh");
  if(refresh) refresh.onclick=()=>loadVacancies(true);

  loadVacancies(false);

  if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
});