const C='mi-empleo-completo-v1';
const A=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./companies.json','./linkedin_sources.json','./profile_filters.json','./vacancies.json','./linkedin.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{
  if(e.request.url.endsWith('.json')||e.request.url.includes('.json?')){
    e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match(e.request))); return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});