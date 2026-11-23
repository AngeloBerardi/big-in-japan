// Big in Japan: app shell e dati disponibili anche senza rete; foto e mappe salvate man mano che si vedono.
const V='bij-v2',SHELL=['./','index.html','app.js','scene.js','manifest.json','icon.svg','vendor/maplibre/maplibre-gl.js','vendor/maplibre/maplibre-gl.css','data/viaggio.json','data/stazioni.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>!x.startsWith(V)).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET')return;
 if(/firebaseio|firebasedatabase|googleapis\.com\/identitytoolkit|securetoken/.test(u.host+u.pathname))return;
 if(u.origin===location.origin){ // rete prima per i dati, cache prima per il resto
  if(u.pathname.includes('/data/'))e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(V).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)));
  else e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(r2=>{const c=r2.clone();caches.open(V).then(x=>x.put(e.request,c));return r2})));return}
 if(/openfreemap|arcgisonline|cyberjapandata|opentopomap|tile-cyclosm|tile\.openstreetmap|photon\.komoot|upload\.wikimedia|wikipedia\.org\/api|fonts\.(gstatic|googleapis)|gstatic\.com\/firebasejs/.test(u.host+u.pathname))
  e.respondWith(caches.open(V+'-ext').then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(r2=>{if(r2.ok||r2.type==='opaque')c.put(e.request,r2.clone());return r2}))))});
