
let vacancies=[], linkedinPosts=[], companies=[];
const sent=JSON.parse(localStorage.getItem('mi-empleo-cv-enviado')||'{}');

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function save(){localStorage.setItem('mi-empleo-cv-enviado',JSON.stringify(sent));}

async function loadData(showMessage=false){
  try{
    const [v,l,c] = await Promise.all([
      fetch('./vacancies.json?ts='+Date.now(),{cache:'no-store'}),
      fetch('./linkedin.json?ts='+Date.now(),{cache:'no-store'}),
      fetch('./companies.json?ts='+Date.now(),{cache:'no-store'})
    ]);
    if(!v.ok||!l.ok||!c.ok) throw new Error();
    vacancies=await v.json();
    linkedinPosts=await l.json();
    companies=await c.json();
    renderVacancies(); renderLinkedIn(); renderCompanies();
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
  document.querySelectorAll('[data-vacancy]').forEach(x=>x.onchange=()=>{sent[x.dataset.vacancy]=x.checked;save();});
}

function renderLinkedIn(){
  const box=$('#linkedinList'); box.innerHTML='';
  linkedinPosts.filter(p=>!p.date||p.date>='2026-05-01').forEach(p=>{
    const card=document.createElement('article'); card.className='card';
    card.innerHTML=`
      <div class="person">${esc(p.source)}</div>
      <h2>${esc(p.title)}</h2>
      <div class="actions">
        <a class="primary" href="${esc(p.url)}" target="_blank" rel="noopener">Ver publicación</a>
      </div>
      <label class="sent"><input type="checkbox" data-linkedin="${esc(p.id)}" ${sent[p.id]?'checked':''}> CV enviado</label>`;
    box.appendChild(card);
  });
  $('#linkedinEmpty').hidden=box.children.length>0;
  document.querySelectorAll('[data-linkedin]').forEach(x=>x.onchange=()=>{sent[x.dataset.linkedin]=x.checked;save();});
}

function renderCompanies(){
  const box=$('#companyList'); box.innerHTML='';
  companies.forEach(c=>{
    const card=document.createElement('article'); card.className='card company-card';
    card.innerHTML=`<div class="company">${esc(c.name)}</div><a href="${esc(c.url)}" target="_blank" rel="noopener">Abrir empresa</a>`;
    box.appendChild(card);
  });
}

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
