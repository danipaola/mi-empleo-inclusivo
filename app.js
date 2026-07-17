
let vacancies=[], baseCompanies=[], baseLinkedin=[];
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const sent=JSON.parse(localStorage.getItem('mi-empleo-cv-enviado')||'{}');
let addedCompanies=JSON.parse(localStorage.getItem('mi-empleo-empresas-agregadas')||'[]');
let addedLinkedin=JSON.parse(localStorage.getItem('mi-empleo-linkedin-agregados')||'[]');

function saveSent(){localStorage.setItem('mi-empleo-cv-enviado',JSON.stringify(sent));}
function saveCompanies(){localStorage.setItem('mi-empleo-empresas-agregadas',JSON.stringify(addedCompanies));}
function saveLinkedin(){localStorage.setItem('mi-empleo-linkedin-agregados',JSON.stringify(addedLinkedin));}
function allCompanies(){return [...baseCompanies,...addedCompanies];}
function allLinkedin(){return [...baseLinkedin,...addedLinkedin];}

async function loadData(showMessage=false){
  try{
    const [v,c,l] = await Promise.all([
      fetch('./vacancies.json?ts='+Date.now(),{cache:'no-store'}),
      fetch('./companies.json?ts='+Date.now(),{cache:'no-store'}),
      fetch('./linkedin_sources.json?ts='+Date.now(),{cache:'no-store'})
    ]);
    if(!v.ok||!c.ok||!l.ok) throw new Error();
    vacancies=await v.json(); baseCompanies=await c.json(); baseLinkedin=await l.json();
    renderVacancies(); renderCompanies(); renderLinkedin();
    if(showMessage) $('#statusText').textContent='La lista está actualizada.';
  }catch(e){
    $('#statusText').textContent='No se pudo actualizar. Revisá que todos los archivos estén subidos.';
  }
}

function renderVacancies(){
  const box=$('#vacancyList'); box.innerHTML='';
  $('#vacancyCount').textContent=vacancies.length;
  vacancies.forEach(v=>{
    const card=document.createElement('article'); card.className='card';
    card.innerHTML=`
      <div class="company">${esc(v.company)}</div>
      <h2>${esc(v.title)}</h2>
      <div class="actions">
        <a class="primary" href="${esc(v.url)}" target="_blank" rel="noopener">Postularme</a>
        <a class="secondary" href="${esc(v.portal||v.url)}" target="_blank" rel="noopener">Portal oficial</a>
      </div>
      <label class="sent"><input type="checkbox" data-vacancy="${esc(v.id)}" ${sent[v.id]?'checked':''}> CV enviado</label>`;
    box.appendChild(card);
  });
  $('#vacancyEmpty').hidden=vacancies.length>0;
  document.querySelectorAll('[data-vacancy]').forEach(x=>x.onchange=()=>{sent[x.dataset.vacancy]=x.checked;saveSent();});
}

function renderCompanies(){
  const q=$('#companySearch').value.toLowerCase().trim();
  const filtered=allCompanies().filter(c=>c.name.toLowerCase().includes(q));
  const box=$('#companyList'); box.innerHTML='';
  filtered.forEach(c=>{
    const custom=addedCompanies.some(x=>x.name===c.name && x.url===c.url);
    const card=document.createElement('article'); card.className='card company-card';
    card.innerHTML=`<div class="company">${esc(c.name)}</div>
      <a href="${esc(c.url)}" target="_blank" rel="noopener">Abrir empresa</a>
      ${custom?`<button class="delete-btn" data-delete-company="${esc(c.url)}">Eliminar empresa agregada</button>`:''}`;
    box.appendChild(card);
  });
  $('#companyEmpty').hidden=filtered.length>0;
  document.querySelectorAll('[data-delete-company]').forEach(b=>b.onclick=()=>{
    addedCompanies=addedCompanies.filter(x=>x.url!==b.dataset.deleteCompany); saveCompanies(); renderCompanies();
  });
}

function renderLinkedin(){
  const list=allLinkedin();
  const box=$('#linkedinSourceList'); box.innerHTML='';
  list.forEach(p=>{
    const custom=addedLinkedin.some(x=>x.name===p.name && x.url===p.url);
    const card=document.createElement('article'); card.className='card person-card';
    card.innerHTML=`<div class="person">${esc(p.name)}</div>
      <a href="${esc(p.url)}" target="_blank" rel="noopener">Abrir LinkedIn</a>
      ${custom?`<button class="delete-btn" data-delete-linkedin="${esc(p.url)}">Eliminar persona agregada</button>`:''}`;
    box.appendChild(card);
  });
  $('#linkedinEmpty').hidden=list.length>0;
  document.querySelectorAll('[data-delete-linkedin]').forEach(b=>b.onclick=()=>{
    addedLinkedin=addedLinkedin.filter(x=>x.url!==b.dataset.deleteLinkedin); saveLinkedin(); renderLinkedin();
  });
}

$('#companySearch').addEventListener('input',renderCompanies);
$('#showCompanyForm').onclick=()=>{$('#companyForm').hidden=false;$('#companyName').focus()};
$('#cancelCompany').onclick=()=>{$('#companyForm').reset();$('#companyForm').hidden=true};
$('#companyForm').onsubmit=e=>{
  e.preventDefault();
  const name=$('#companyName').value.trim(), url=$('#companyUrl').value.trim();
  if(!name||!url)return;
  addedCompanies.push({name,url}); saveCompanies();
  e.target.reset(); e.target.hidden=true; renderCompanies();
};

$('#showLinkedinForm').onclick=()=>{$('#linkedinForm').hidden=false;$('#linkedinName').focus()};
$('#cancelLinkedin').onclick=()=>{$('#linkedinForm').reset();$('#linkedinForm').hidden=true};
$('#linkedinForm').onsubmit=e=>{
  e.preventDefault();
  const name=$('#linkedinName').value.trim(), url=$('#linkedinUrl').value.trim();
  if(!name||!url)return;
  addedLinkedin.push({name,url}); saveLinkedin();
  e.target.reset(); e.target.hidden=true; renderLinkedin();
};

document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); $('#'+b.dataset.tab).classList.add('active');
});
$('#refreshBtn').onclick=()=>loadData(true);

let deferredPrompt; const install=$('#installBtn');
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;install.hidden=false});
install.onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;install.hidden=true};

if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
loadData(false);
