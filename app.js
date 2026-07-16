
let vacancies=[];
let linkedinPosts=[];
const sentState=JSON.parse(localStorage.getItem('sent-state-final')||'{}');

const jobsEl=document.querySelector('#jobs');
const linkedinEl=document.querySelector('#linkedinPosts');
const empty=document.querySelector('#empty');
const linkedinEmpty=document.querySelector('#linkedinEmpty');
const search=document.querySelector('#search');
const categoryFilter=document.querySelector('#categoryFilter');
const sentFilter=document.querySelector('#sentFilter');
const syncMessage=document.querySelector('#syncMessage');

function saveState(){localStorage.setItem('sent-state-final',JSON.stringify(sentState))}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function todayISO(){return new Date().toISOString().slice(0,10)}

async function syncData(show=true){
  try{
    const [v,l]=await Promise.all([
      fetch('./vacancies.json?ts='+Date.now(),{cache:'no-store'}),
      fetch('./linkedin.json?ts='+Date.now(),{cache:'no-store'})
    ]);
    if(!v.ok||!l.ok)throw new Error();
    vacancies=await v.json();
    linkedinPosts=await l.json();
    if(!Array.isArray(vacancies))vacancies=vacancies.vacancies||[];
    if(!Array.isArray(linkedinPosts))linkedinPosts=linkedinPosts.posts||[];
    if(show)syncMessage.textContent='La lista está actualizada.';
    renderJobs();
    renderLinkedIn();
  }catch(e){
    syncMessage.textContent='No se pudo actualizar. Revisá que vacancies.json y linkedin.json estén subidos.';
  }
}

function renderJobs(){
  const q=search.value.toLowerCase().trim();
  const c=categoryFilter.value;
  const f=sentFilter.value;
  let shown=0,sent=0;
  jobsEl.innerHTML='';
  document.querySelector('#todayCount').textContent=vacancies.filter(j=>j.date===todayISO()).length;

  vacancies.forEach(job=>{
    const st=sentState[job.id]||{sent:false};
    if(st.sent)sent++;
    const blob=(job.company+' '+job.title+' '+job.location+' '+job.category).toLowerCase();
    if(!blob.includes(q)||(c!=='all'&&job.category!==c)||(f==='yes'&&!st.sent)||(f==='no'&&st.sent))return;
    shown++;
    const card=document.createElement('article');
    card.className='card';
    card.innerHTML=`<div class="top"><div><div class="company">${esc(job.company)}</div><h2>${esc(job.title)}</h2></div><span class="fit">${esc(job.match||'Recomendada')}</span></div>
      <div class="meta">${esc(job.location)} · ${esc(job.date||'Sin fecha')} · ${esc(job.category)}</div>
      <div class="inclusion"><strong>Inclusión:</strong> ${esc(job.inclusion||'Empresa con programa de inclusión.')}</div>
      <div class="actions"><a class="primary" href="${esc(job.url)}" target="_blank" rel="noopener">Postularme</a><a class="secondary" href="${esc(job.portal||job.url)}" target="_blank" rel="noopener">Portal oficial</a></div>
      <div class="sent-box"><label class="sent-row"><input type="checkbox" data-sent="${job.id}" ${st.sent?'checked':''}><strong>CV enviado</strong></label></div>`;
    jobsEl.appendChild(card);
  });

  empty.hidden=shown!==0;
  document.querySelector('#summary').innerHTML=`<span class="pill"><strong>${vacancies.length}</strong> vacantes</span><span class="pill">CV enviados: <strong>${sent}</strong></span>`;
  document.querySelectorAll('[data-sent]').forEach(chk=>chk.onchange=()=>{
    sentState[chk.dataset.sent]={sent:chk.checked};
    saveState();
    renderJobs();
  });
}

function renderLinkedIn(){
  linkedinEl.innerHTML='';
  const filtered=linkedinPosts.filter(p=>p.date>='2026-05-01');
  filtered.forEach(p=>{
    const st=sentState[p.id]||{sent:false};
    const card=document.createElement('article');
    card.className='card';
    card.innerHTML=`<span class="linkedin-source">${esc(p.source)}</span>
      <h2>${esc(p.title)}</h2>
      <div class="company">${esc(p.company)}</div>
      <div class="meta">${esc(p.location)} · ${esc(p.date)}</div>
      <div class="inclusion">${esc(p.text||'Publicación laboral inclusiva.')}</div>
      <div class="actions"><a class="primary" href="${esc(p.url)}" target="_blank" rel="noopener">Abrir publicación</a></div>
      <div class="sent-box"><label class="sent-row"><input type="checkbox" data-lsent="${p.id}" ${st.sent?'checked':''}><strong>CV enviado</strong></label></div>`;
    linkedinEl.appendChild(card);
  });
  linkedinEmpty.hidden=filtered.length!==0;
  document.querySelectorAll('[data-lsent]').forEach(chk=>chk.onchange=()=>{
    sentState[chk.dataset.lsent]={sent:chk.checked};
    saveState();
    renderLinkedIn();
  });
}

document.querySelectorAll('.tab').forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');
  document.querySelector('#'+btn.dataset.tab).classList.add('active');
});

search.oninput=renderJobs;
categoryFilter.onchange=renderJobs;
sentFilter.onchange=renderJobs;
document.querySelector('#syncBtn').onclick=()=>syncData(true);

let deferredPrompt;
const installBtn=document.querySelector('#installBtn');
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;installBtn.hidden=false});
installBtn.onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.hidden=true};

if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
syncData(false);
