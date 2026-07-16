
let remoteJobs=[];
let customJobs=JSON.parse(localStorage.getItem('custom-jobs-v5')||'[]');
let alerts=JSON.parse(localStorage.getItem('linkedin-alerts-v5')||'[]');
const state=JSON.parse(localStorage.getItem('job-state-v5')||'{}');

const jobsEl=document.querySelector('#jobs'),alertsEl=document.querySelector('#alerts');
const empty=document.querySelector('#empty'),alertsEmpty=document.querySelector('#alertsEmpty');
const search=document.querySelector('#search'),filter=document.querySelector('#statusFilter');
const jobDialog=document.querySelector('#jobDialog'),jobForm=document.querySelector('#jobForm');
const alertDialog=document.querySelector('#alertDialog'),alertForm=document.querySelector('#alertForm');
const syncMessage=document.querySelector('#syncMessage');

function saveAll(){
  localStorage.setItem('custom-jobs-v5',JSON.stringify(customJobs));
  localStorage.setItem('linkedin-alerts-v5',JSON.stringify(alerts));
  localStorage.setItem('job-state-v5',JSON.stringify(state));
}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function allJobs(){return [...customJobs,...remoteJobs].filter((j,i,a)=>a.findIndex(x=>x.id===j.id)===i)}

async function syncJobs(showMessage=true){
  try{
    const r=await fetch('./data/vacancies.json?ts='+Date.now(),{cache:'no-store'});
    if(!r.ok)throw new Error('No se pudo leer la actualización');
    const data=await r.json();
    const oldIds=new Set(remoteJobs.map(j=>j.id));
    remoteJobs=Array.isArray(data)?data:data.vacancies||[];
    const newCount=remoteJobs.filter(j=>!oldIds.has(j.id)).length;
    if(showMessage)syncMessage.textContent=newCount?`Hay ${newCount} vacante(s) nueva(s).`:'La lista está actualizada.';
    renderJobs();
  }catch(e){
    syncMessage.textContent='No se pudo actualizar. Revisá tu conexión.';
  }
}
function validSource(source,text){
  const t=(text||'').toLowerCase();
  if(source==='Julieta Mariela Moranzoni')return t.includes('desde sumate')&&t.includes('acompañando a una importante');
  if(source==='Silvina Alonso')return t.includes('oportunidad laboral para personas con discapacidad');
  if(source==='Karina Guerschberg')return t.includes('búsqueda laboral')||t.includes('busqueda laboral');
  return false;
}
function renderJobs(){
  const jobs=allJobs(),q=search.value.toLowerCase().trim(),f=filter.value;let shown=0,counts={};jobsEl.innerHTML='';
  jobs.forEach(job=>{
    const st=state[job.id]||{status:'No enviada',sentDate:'',notes:''};counts[st.status]=(counts[st.status]||0)+1;
    const blob=(job.company+' '+job.title+' '+job.location+' '+job.category).toLowerCase();
    if(!blob.includes(q)||(f!=='all'&&st.status!==f))return;shown++;
    const card=document.createElement('article');card.className='card';
    card.innerHTML=`<div class="top"><div><div class="company">${esc(job.company)}</div><h2>${esc(job.title)}</h2></div><span class="fit">${esc(job.match||'Revisar')}</span></div>
    <div class="meta">${esc(job.location)} · ${esc(job.date||'Sin fecha')} · ${esc(job.category)}</div>
    <div class="inclusion"><strong>Inclusión:</strong> ${esc(job.inclusion||'Empresa con programa o política de inclusión.')}</div>
    <div class="actions"><a class="primary" href="${esc(job.url)}" target="_blank" rel="noopener">Abrir vacante</a><a class="secondary" href="${esc(job.portal||job.url)}" target="_blank" rel="noopener">Portal oficial</a></div>
    <div class="tracker"><label>Estado</label><select data-field="status" data-id="${job.id}">
    ${['No enviada','CV enviado','Esperando respuesta','Entrevista','Rechazada'].map(x=>`<option ${st.status===x?'selected':''}>${x}</option>`).join('')}</select>
    <label>Fecha de postulación</label><input data-field="sentDate" data-id="${job.id}" type="date" value="${esc(st.sentDate||'')}">
    <label>Notas</label><textarea data-field="notes" data-id="${job.id}" placeholder="Ej.: envié el CV, me escribieron...">${esc(st.notes||'')}</textarea>
    <button class="save" data-save="${job.id}">Guardar seguimiento</button>${job.custom?`<button class="delete" data-delete="${job.id}">Eliminar vacante</button>`:''}</div>`;
    jobsEl.appendChild(card);
  });
  empty.hidden=shown!==0;
  document.querySelector('#summary').innerHTML=`<span class="pill"><strong>${jobs.length}</strong> vacantes</span>`+Object.entries(counts).map(([k,v])=>`<span class="pill">${k}: <strong>${v}</strong></span>`).join('');
  bindJobs();
}
function renderAlerts(){
  alertsEl.innerHTML='';
  alerts.forEach(a=>{
    const card=document.createElement('article');card.className='card';
    card.innerHTML=`<span class="alert-source">${esc(a.source)}</span><h2>${esc(a.title)}</h2><div class="company">${esc(a.company)}</div>
    <div class="meta">${esc(a.location)} · ${esc(a.date||'Sin fecha')}</div><div class="inclusion">${esc(a.text)}</div>
    <div class="actions"><a class="primary" href="${esc(a.url)}" target="_blank" rel="noopener">Abrir publicación</a><button class="delete" data-alert-delete="${a.id}">Eliminar</button></div>`;
    alertsEl.appendChild(card);
  });
  alertsEmpty.hidden=alerts.length!==0;
  document.querySelectorAll('[data-alert-delete]').forEach(btn=>btn.onclick=()=>{alerts=alerts.filter(a=>a.id!==btn.dataset.alertDelete);saveAll();renderAlerts();});
}
function bindJobs(){
  document.querySelectorAll('[data-save]').forEach(btn=>btn.onclick=()=>{
    const id=btn.dataset.save;state[id]=state[id]||{};
    document.querySelectorAll(`[data-id="${id}"]`).forEach(el=>state[id][el.dataset.field]=el.value);
    saveAll();renderJobs();alert('Seguimiento guardado.');
  });
  document.querySelectorAll('[data-delete]').forEach(btn=>btn.onclick=()=>{
    customJobs=customJobs.filter(j=>j.id!==btn.dataset.delete);delete state[btn.dataset.delete];saveAll();renderJobs();
  });
}
document.querySelectorAll('.tab').forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');document.querySelector('#'+btn.dataset.tab).classList.add('active');
});
search.oninput=renderJobs;filter.onchange=renderJobs;
document.querySelector('#syncBtn').onclick=()=>syncJobs(true);
document.querySelector('#addBtn').onclick=()=>jobDialog.showModal();
document.querySelector('#addAlertBtn').onclick=()=>alertDialog.showModal();

jobForm.addEventListener('submit',e=>{
  if(e.submitter?.value==='cancel')return;e.preventDefault();
  const d=Object.fromEntries(new FormData(jobForm));d.id='custom-'+Date.now();d.match='Revisar requisitos';d.custom=true;
  customJobs.unshift(d);saveAll();jobForm.reset();jobDialog.close();renderJobs();
});
alertForm.addEventListener('submit',e=>{
  if(e.submitter?.value==='cancel')return;e.preventDefault();
  const d=Object.fromEntries(new FormData(alertForm));
  if(!validSource(d.source,d.text)){alert('La publicación no coincide con la frase laboral permitida para esa fuente.');return;}
  d.id='alert-'+Date.now();alerts.unshift(d);saveAll();alertForm.reset();alertDialog.close();renderAlerts();
});

let deferredPrompt;const installBtn=document.querySelector('#installBtn');
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;installBtn.hidden=false});
installBtn.onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.hidden=true};
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
syncJobs(false);renderAlerts();
