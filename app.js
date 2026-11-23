'use strict';
{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COL=['#e2412b','#2c3e8f','#b07800','#7b45c4','#13808a','#c03a6e','#4f6375','#2b7a3e'];
const TIPI={visita:'Visita',attivita:'Da fare',pasto:'Cibo',evento:'Evento',trasferimento:'Spostamento',treno:'Treno',bus:'Bus',volo:'Volo',hotel:'Alloggio',nota:'Nota'};
const FONTI={mappa:'Dalla vostra mappa',proposta:'Proposta',prenotato:'Prenotato',idea:'Vostra idea'};
let V,ST,map,baseLayer,railLayer,staLayer,routeLayer,pinLayer,meMarker,meCircle,ME=null,filter=null,selId=null,watching=false;
const col=i=>COL[i%COL.length];
const D=iso=>new Date(iso+'T12:00:00');
const fmt=(iso,o)=>D(iso).toLocaleDateString('it-IT',o);
const lungo=iso=>fmt(iso,{weekday:'long',day:'numeric',month:'long'});
const corto=iso=>fmt(iso,{day:'numeric',month:'short'});
const diff=(a,b)=>Math.round((D(b)-D(a))/864e5);
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const yen=n=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'JPY',maximumFractionDigits:0}).format(n);
function adesso(tz){try{const p=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());const g=t=>p.find(x=>x.type===t).value;return{data:`${g('year')}-${g('month')}-${g('day')}`,ora:`${g('hour')}:${g('minute')}`}}catch(e){const d=new Date();return{data:d.toISOString().slice(0,10),ora:d.toTimeString().slice(0,5)}}}
function stato(){const n=adesso(V.viaggio.fuso),v=V.viaggio,a=diff(n.data,v.inizio),b=diff(v.fine,n.data);
 if(a>0)return{fase:'prima',txt:a===1?'Si parte domani':`Mancano ${a} giorni`};if(b>0)return{fase:'dopo',txt:'Viaggio concluso'};
 const i=V.giorni.findIndex(g=>g.data===n.data);return{fase:'durante',i,txt:`Oggi è il giorno ${i+1}`}}

/* ---------- foto da Wikipedia ---------- */
const WK={};
function foto(t){if(!t)return Promise.resolve(null);if(WK[t])return WK[t];
 const c=store.get('wk2:'+t,undefined);if(c!==undefined)return WK[t]=Promise.resolve(c);
 return WK[t]=fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(t.replace(/ /g,'_'))).then(r=>r.ok?r.json():null)
  .then(j=>{const v=j&&j.thumbnail?{src:j.thumbnail.source,url:j.content_urls?.desktop?.page||''}:null;store.set('wk2:'+t,v);return v}).catch(()=>null)}
const big=(src,w)=>src.replace(/\/(\d+)px-/,`/${w}px-`);
function riempiFoto(root=document){root.querySelectorAll('[data-wiki]:not([data-done])').forEach(el=>{el.dataset.done=1;const w=+el.dataset.w||400;
 foto(el.dataset.wiki).then(v=>{if(!v){if(el.dataset.scene&&window.scena)el.innerHTML=scena(el.dataset.scene,+el.dataset.seed||3);return}
  const img=new Image();img.alt=el.dataset.alt||'';img.loading='lazy';img.decoding='async';img.src=big(v.src,w);img.onerror=()=>{img.onerror=null;img.src=v.src};el.prepend(img);
  if(el.dataset.credit!==undefined&&v.url){const a=document.createElement('a');a.className='credit';a.href=v.url;a.target='_blank';a.rel='noopener';a.textContent='Foto: Wikipedia';el.appendChild(a)}})})}
const ph=(t,w,extra='',scene='',seed=3,alt='')=>`<div class="ph" data-wiki="${esc(t||'')}" data-w="${w}" data-scene="${esc(scene)}" data-seed="${seed}" data-alt="${esc(alt)}" ${extra}></div>`;

/* ---------- stazioni ---------- */
function km(a,b,c,d){const x=(d-b)*Math.cos((a+c)/2*Math.PI/180),y=c-a;return Math.hypot(x,y)*111.2}
function vicina(lat,lng){if(!ST)return null;let best=null,bd=1e9;for(const s of ST.stazioni){const d=km(lat,lng,s.lat,s.lon);if(d<bd){bd=d;best=s}}return best&&bd<2.5?{s:best,d:bd}:null}
const piedi=d=>Math.max(1,Math.round(d*1000*1.25/80));
const nomeSt=s=>s.n?`${esc(s.n)} <span lang="ja">${esc(s.k)}</span>`:`<span lang="ja">${esc(s.k)}</span>`;
const linee=s=>s.l.slice(0,3).map(i=>esc(ST.linee[i].n)).join(', ');
function staTxt(e){if(e.lat==null)return'';const v=vicina(e.lat,e.lng);if(!v)return'';
 return`<div class="sta"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex:none;margin-top:2px"><rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M8 21l2-4M16 21l-2-4"/></svg><span><b>${nomeSt(v.s)}</b> · ${v.d<.15?'lì davanti':piedi(v.d)+' min a piedi'}${v.s.l.length?`<br>${linee(v.s)}`:''}</span></div>`}
const q=e=>e.lat!=null?`${e.lat},${e.lng}`:encodeURIComponent(e.luogo||e.titolo||'');
const gmap=e=>`https://www.google.com/maps/search/?api=1&query=${q(e)}`;
const arrivo=(e,da)=>`https://www.google.com/maps/dir/?api=1${da?`&origin=${q(da)}`:''}&destination=${q(e)}&travelmode=transit`;

/* ---------- dati ---------- */
let TUTTI=[];
function prepara(){V.giorni.sort((a,b)=>a.data<b.data?-1:1);TUTTI=[];
 V.giorni.forEach((g,i)=>{let n=0;g.eventi.sort((a,b)=>(a.ora||'').localeCompare(b.ora||''));g.eventi.forEach((e,k)=>{e.id=`e${i}-${k}`;e.d=i;if(e.lat!=null)e.n=++n;TUTTI.push(e)})})}
const ev=id=>TUTTI.find(e=>e.id===id);

/* ---------- viste ---------- */
function vHome(){const v=V.viaggio,s=stato(),n=diff(v.inizio,v.fine)+1,tap=TUTTI.filter(e=>!['hotel','trasferimento','volo','treno','bus'].includes(e.tipo)).length;
 return`<div class="hero">${ph(v.hero,1200,'data-credit style="position:absolute;inset:0;height:auto"','hero',3,'Monte Fuji')}<div class="sh"></div><div class="tx"><h1>${esc(v.titolo)}</h1><p>${esc(v.sottotitolo)}</p><span class="pill">${esc(s.txt)}</span></div></div>
 <div class="pad"><div class="stats"><div><b>${n}</b><span>giorni, ${corto(v.inizio)} – ${corto(v.fine)}</span></div><div><b>${tap}</b><span>tappe in programma</span></div><div><b>2</b><span>città, più terme e Nara</span></div></div>
 ${s.fase==='durante'&&s.i>=0?`<a class="btn pri" href="#g${s.i+1}" style="margin-bottom:12px">Vai a oggi</a>`:''}
 <h2 class="sec">Giorno per giorno</h2><div class="days">${V.giorni.map((g,i)=>`<a class="dc ${s.fase==='durante'&&s.i===i?'today':''}" href="#g${i+1}" style="--c:${col(i)}">${ph(g.cover,300,'',g.scena,i+1,g.titolo).replace('</div>',`<span class="n">${i+1}</span></div>`)}<div><small>${esc(fmt(g.data,{weekday:'short',day:'numeric',month:'short'}))} · ${esc(g.citta||'')}</small><strong>${esc(g.titolo)}</strong><em>${g.eventi.length} tappe<span class="pc">${propDi(g.data).length?' · '+propDi(g.data).length+' proposte':''}</span>${g.pernotto?' · '+esc(g.pernotto.replace(/\s*\(.*\)/,'')):''}</em></div></a>`).join('')}</div>
 <p class="foot">Foto da Wikipedia e Wikimedia Commons, con i crediti sui rispettivi file. Mappe © OpenStreetMap, CARTO, Esri, OpenRailwayMap.</p></div>`}
function vGiorno(i){const g=V.giorni[i],c=col(i),now=adesso(V.viaggio.fuso),live=now.data===g.data;let last='',next=false;
 const fascia=o=>!o?'':o<'12:00'?'Mattina':o<'18:00'?'Pomeriggio':'Sera';
 const stops=g.eventi.map(e=>{const f=fascia(e.ora);let h='';if(f&&f!==last){h=`<div class="slot">${f}</div>`;last=f}
  let cls='';if(live&&e.ora&&!next&&(e.fine&&/^\d\d:\d\d$/.test(e.fine)?e.fine:e.ora)>=now.ora){cls='next';next=true}
  return h+`<div class="stop ${cls}" id="s-${e.id}"><div class="t">${esc(e.ora||'')}${e.fine?`<small>${esc(e.fine)}</small>`:''}</div>
  <div class="card ${selId===e.id?'sel':''}" data-sel="${e.id}">${e.wiki?ph(e.wiki,640,'','',i+1,e.titolo):''}<div class="bd"><div class="tags">${e.n?`<span class="num">${e.n}</span>`:''}<span class="tg">${esc(TIPI[e.tipo]||e.tipo||'')}</span>${e.fonte?`<span class="tg ${esc(e.fonte)}">${esc(FONTI[e.fonte]||e.fonte)}</span>`:''}${e.costo?`<span class="tg">${yen(e.costo)}</span>`:e.costoPersona?`<span class="tg">${yen(e.costoPersona)} a testa</span>`:''}</div>
  <h4>${esc(e.titolo)}</h4>${e.luogo&&e.luogo!==e.titolo?`<p style="color:var(--ink)">${esc(e.luogo)}</p>`:''}${e.note?`<p>${esc(e.note)}</p>`:''}${staTxt(e)}
  <div class="acts">${e.lat!=null||e.luogo?`<a class="btn pri" href="${arrivo(e,ME)}" target="_blank" rel="noopener">Come arrivo</a><a class="btn" href="${gmap(e)}" target="_blank" rel="noopener">Google Maps</a>`:''}${e.lat!=null?`<button class="btn mob" data-showmap="${e.id}">Sulla mappa</button>`:''}</div></div></div></div>`}).join('');
 return`<div style="--c:${c}"><div class="cover">${ph(g.cover,1200,'data-credit style="position:absolute;inset:0;height:auto"',g.scena,i+1,g.titolo)}<div class="sh"></div><div class="tx"><small>Giorno ${i+1} · ${esc(lungo(g.data))}</small><h1>${esc(g.titolo)}</h1></div></div>
 <nav class="daynav" aria-label="Giornate">${V.giorni.map((x,k)=>`<a href="#g${k+1}" style="--c:${col(k)}" ${k===i?'aria-current="page"':''}>${k+1} · ${esc(corto(x.data))}</a>`).join('')}</nav>
 <div class="pad"><p class="lead">${esc(g.riassunto||'')}</p>${(g.avvisi||[]).map(a=>`<div class="alert"><b>Da sapere:</b> ${esc(a)}</div>`).join('')}
 ${stops}${g.pernotto?`<div class="sleep">Si dorme a <b>${esc(g.pernotto)}</b></div>`:''}${vProposte(i)}
 <div class="acts" style="margin-top:16px">${i>0?`<a class="btn" href="#g${i}">← Giorno ${i}</a>`:''}${i<V.giorni.length-1?`<a class="btn" href="#g${i+2}">Giorno ${i+2} →</a>`:''}<a class="btn" href="${esc(V.pianifica)}" target="_blank" rel="noopener">Modifica nel planner</a></div></div></div>`}
function lista(key,voci){const ck=store.get('bij:'+key,{});return`<ul class="checks">${voci.map((t,i)=>`<li><label><input type="checkbox" data-k="${key}" data-i="${i}" ${ck[i]?'checked':''}><span>${esc(t)}</span></label></li>`).join('')}</ul>`}
function vInfo(){const inf=V.info,per=V.viaggio.persone||1;let tot=0;TUTTI.forEach(e=>{tot+=(e.costo||0)+(e.costoPersona||0)*per});
 const hotel=TUTTI.filter(e=>e.tipo==='hotel'&&e.fonte==='prenotato'&&e.costo);
 return`<div class="pad"><h2 class="sec" style="margin-top:4px">Alloggi</h2>${hotel.map(e=>`<div class="box" style="--c:${col(e.d)}"><h3>${esc(e.luogo)}</h3><p style="margin:0 0 6px;color:var(--muted);font-size:14px">${esc(e.note||'')}</p><div class="acts"><a class="btn pri" href="${arrivo(e,ME)}" target="_blank" rel="noopener">Come arrivo</a><a class="btn" href="${gmap(e)}" target="_blank" rel="noopener">Google Maps</a><a class="btn" href="#g${e.d+1}">Giorno ${e.d+1}</a></div></div>`).join('')}
 <div class="box"><h3>Spese inserite</h3><p style="margin:0;font-size:14px"><b class="disp" style="font-size:26px">${yen(tot)}</b> · circa ${yen(tot/per)} a testa</p><p style="margin:6px 0 0;color:var(--muted);font-size:13px">${esc(V.viaggio.notaCosti)}</p></div>
 <h2 class="sec">Da sapere</h2><div class="box"><dl class="kv">${inf.pratiche.map(p=>`<dt>${esc(p.voce)}</dt><dd>${esc(p.valore)}</dd>`).join('')}</dl></div>
 <h2 class="sec">Contatti utili</h2><div class="box"><dl class="kv">${inf.contatti.map(c=>`<dt>${esc(c.nome)}<br><small>${esc(c.ruolo||'')}</small></dt><dd><a href="tel:${esc(c.tel.replace(/\s/g,''))}">${esc(c.tel)}</a>${c.email?`<br><small>${esc(c.email)}</small>`:''}</dd>`).join('')}</dl></div>
 <h2 class="sec">Prima di partire</h2>${lista('pre',V.prepartenza)}
 ${V.bagaglio.map((b,j)=>`<h2 class="sec">${esc(b.gruppo)}</h2>${lista('bag'+j,b.voci)}`).join('')}
 <h2 class="sec">Link</h2><div class="acts"><a class="btn" href="${esc(V.pianifica)}" target="_blank" rel="noopener">Planner condiviso (privato)</a><a class="btn" href="${esc(V.mymap)}" target="_blank" rel="noopener">Mappa Big In Japan</a></div>
 <p class="foot">${esc(inf.note)} Le spunte restano su questo telefono.</p></div>`}

/* ---------- mappa ---------- */
const BASI={mappa:{n:'Mappa',u:'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',a:'&copy; OpenStreetMap &copy; CARTO',t:'https://a.basemaps.cartocdn.com/rastertiles/voyager/12/3637/1612.png'},
 satellite:{n:'Satellite',u:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',a:'Immagini &copy; Esri',t:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/1612/3637'},
 notte:{n:'Notte',u:'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',a:'&copy; OpenStreetMap &copy; CARTO',t:'https://a.basemaps.cartocdn.com/dark_all/12/3637/1612.png'}};
function setBase(k){if(baseLayer)map.removeLayer(baseLayer);const b=BASI[k];baseLayer=L.tileLayer(b.u,{attribution:b.a,maxZoom:19,subdomains:'abcd',crossOrigin:true}).addTo(map);baseLayer.bringToBack();store.set('bij:base',k);
 $$('#lgrid button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.b===k))}
function initMap(){map=L.map('map',{zoomControl:false,attributionControl:true}).setView([35.68,139.74],12);
 L.control.zoom({position:'bottomright'}).addTo(map);
 $('#lgrid').innerHTML=Object.entries(BASI).map(([k,b])=>`<button data-b="${k}"><i style="background-image:url('${b.t}')"></i>${b.n}</button>`).join('');
 setBase(store.get('bij:base','mappa'));
 railLayer=L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',{subdomains:'abc',maxZoom:19,opacity:.75,attribution:'<a href="https://www.openrailwaymap.org/">OpenRailwayMap</a>'});
 if(store.get('bij:rail',true)){railLayer.addTo(map)}else $('#lrail').checked=false;
 staLayer=L.layerGroup();routeLayer=L.layerGroup().addTo(map);pinLayer=L.layerGroup().addTo(map);
 map.on('zoomend moveend',stazioni);
 $('#lgrid').addEventListener('click',e=>{const b=e.target.closest('[data-b]');if(b)setBase(b.dataset.b)});
 $('#lrail').addEventListener('change',e=>{e.target.checked?railLayer.addTo(map):map.removeLayer(railLayer);store.set('bij:rail',e.target.checked)});
 $('#lsta').addEventListener('change',stazioni);
 $('#lall').addEventListener('change',()=>disegnaPins(true));
 $('#blayers').addEventListener('click',()=>{$('#lpanel').classList.toggle('on');$('#blayers').classList.toggle('on')});
 map.on('click',()=>{$('#lpanel').classList.remove('on');$('#blayers').classList.remove('on')});
 $('#bloc').addEventListener('click',localizza);$('#bfit').addEventListener('click',()=>inquadra());
 map.on('locationfound',trovato);map.on('locationerror',()=>{watching=false;$('#bloc').classList.remove('on');vicino(null,'Posizione non disponibile: controllate i permessi del browser per questo sito.')});}
function stazioni(){if(!ST)return;const on=$('#lsta').checked&&map.getZoom()>=14;if(!on){map.removeLayer(staLayer);return}
 staLayer.clearLayers();const b=map.getBounds().pad(.2);ST.stazioni.forEach(s=>{if(!b.contains([s.lat,s.lon]))return;
  L.circleMarker([s.lat,s.lon],{radius:6,color:'#15171c',weight:2,fillColor:'#fff',fillOpacity:1}).bindPopup(`<div class="bd st-pop" style="padding:12px"><b>${nomeSt(s)}</b><p style="margin:4px 0;color:var(--muted)">${s.l.map(i=>esc(ST.linee[i].n)).join(', ')}</p><a class="btn pri" href="${arrivo({lat:s.lat,lng:s.lon},ME)}" target="_blank" rel="noopener">Come arrivo</a></div>`).addTo(staLayer)});staLayer.addTo(map)}
function icona(e,label,sel){return L.divIcon({className:'',html:`<div class="pin ${e.tipo==='hotel'?'hotel':''} ${sel?'sel':''}" style="--c:${col(e.d)}"><span>${label}</span></div>`,iconSize:sel?[38,38]:[30,30],iconAnchor:sel?[19,38]:[15,30],popupAnchor:[0,-30]})}
function popup(e){const g=V.giorni[e.d],v=vicina(e.lat,e.lng);
 return`<div class="pop" style="--c:${col(e.d)}">${e.wiki?ph(e.wiki,560,'','',e.d+1,e.titolo):''}<div class="bd"><small>Giorno ${e.d+1} · ${esc(corto(g.data))}${e.ora?' · '+esc(e.ora):''}</small><h4>${esc(e.titolo)}</h4>${e.note?`<p>${esc(e.note.length>150?e.note.slice(0,147)+'…':e.note)}</p>`:''}${staTxt(e)}
 <div class="acts"><a class="btn pri" href="${arrivo(e,ME)}" target="_blank" rel="noopener">Come arrivo</a><a class="btn" href="${gmap(e)}" target="_blank" rel="noopener">Maps</a><a class="btn" href="#g${e.d+1}">Giorno ${e.d+1}</a></div></div></div>`}
let PINS={};
function eventiMappa(){const all=$('#lall').checked;if(filter==null||all)return TUTTI.filter(e=>e.lat!=null&&V.giorni[e.d].zona!=='Roma');return TUTTI.filter(e=>e.d===filter&&e.lat!=null)}
function disegnaPins(fit){pinLayer.clearLayers();routeLayer.clearLayers();PINS={};const evs=eventiMappa(),giorno=filter!=null&&!$('#lall').checked;
 evs.forEach(e=>{const m=L.marker([e.lat,e.lng],{icon:icona(e,giorno?e.n:e.d+1,e.id===selId),riseOnHover:true,keyboard:true,title:e.titolo});
  m.bindPopup(()=>popup(e),{maxWidth:280,minWidth:270,autoPanPaddingTopLeft:[20,70]});m.on('popupopen',p=>{riempiFoto(p.popup.getElement());seleziona(e.id,false)});m.addTo(pinLayer);PINS[e.id]=m});
 if(giorno&&evs.length>1)L.polyline(evs.map(e=>[e.lat,e.lng]),{color:col(filter),weight:4,opacity:.8,dashArray:'2 9',lineCap:'round'}).addTo(routeLayer);
 carosello(evs);disegnaProp();if(fit)inquadra(evs)}
function inquadra(evs=eventiMappa()){if(!map)return;const pts=evs.map(e=>[e.lat,e.lng]);if(!pts.length)return;
 if(filter==null){const tk=evs.filter(e=>V.giorni[e.d].zona==='Tokyo').map(e=>[e.lat,e.lng]);if(tk.length){map.fitBounds(tk,{padding:[60,60]});return}}
 if(pts.length===1)map.setView(pts[0],15);else{const mob=innerWidth<=860;map.fitBounds(pts,{paddingTopLeft:[40,70],paddingBottomRight:[70,mob?150:40],maxZoom:16})}}
function seleziona(id,pan=true){if(selId===id)return;const prev=selId;selId=id;const e=ev(id);
 [prev,id].forEach(k=>{const m=PINS[k],x=ev(k);if(m&&x)m.setIcon(icona(x,filter!=null&&!$('#lall').checked?x.n:x.d+1,k===id))});
 $$('.card.sel,.cc.sel').forEach(x=>x.classList.remove('sel'));$$(`[data-sel="${id}"]`).forEach(x=>x.classList.add('sel'));
 const cc=$(`.cc[data-sel="${id}"]`);if(cc&&!carScroll){cc.parentNode.scrollTo({left:cc.offsetLeft-16,behavior:'smooth'})}
 if(pan&&e&&e.lat!=null&&map)map.flyTo([e.lat,e.lng],Math.max(map.getZoom(),15),{duration:.6})}
let carScroll=false,carT;
function carosello(evs){const c=$('#carousel');c.innerHTML=evs.map(e=>`<div class="cc ${e.id===selId?'sel':''}" data-sel="${e.id}" style="--c:${col(e.d)}">${ph(e.wiki,240,'','',e.d+1,e.titolo)}<div><small>${filter!=null&&!$('#lall').checked?e.n+' · ':'G'+(e.d+1)+' · '}${esc(e.ora||'')}</small><b>${esc(e.titolo)}</b><div class="acts"><a class="btn pri" href="${arrivo(e,ME)}" target="_blank" rel="noopener">Come arrivo</a><button class="btn" data-pop="${e.id}">Info</button></div></div></div>`).join('');riempiFoto(c)}
$('#carousel').addEventListener('scroll',()=>{carScroll=true;clearTimeout(carT);carT=setTimeout(()=>{const c=$('#carousel'),mid=c.scrollLeft+c.clientWidth/2;let best=null,bd=1e9;
 c.querySelectorAll('.cc').forEach(x=>{const d=Math.abs(x.offsetLeft+x.clientWidth/2-mid);if(d<bd){bd=d;best=x}});if(best)seleziona(best.dataset.sel,true);carScroll=false},140)});
$('#carousel').addEventListener('click',e=>{const p=e.target.closest('[data-pop]');if(p){const m=PINS[p.dataset.pop];if(m)m.openPopup()}});

/* ---------- posizione ---------- */
function localizza(){if(watching){map.stopLocate();watching=false;$('#bloc').classList.remove('on');return}
 watching=true;$('#bloc').classList.add('on');vicino(null,'Cerco la vostra posizione…');map.locate({watch:true,enableHighAccuracy:true,setView:false,maximumAge:15000});localizza.primo=true}
function trovato(p){ME={lat:p.latlng.lat,lng:p.latlng.lng};
 if(!meMarker){meMarker=L.marker(p.latlng,{icon:L.divIcon({className:'',html:'<div class="me"></div>',iconSize:[18,18],iconAnchor:[9,9]}),zIndexOffset:1000}).addTo(map);meCircle=L.circle(p.latlng,{radius:p.accuracy,color:'#2f7cf6',weight:1,fillOpacity:.08}).addTo(map)}
 else{meMarker.setLatLng(p.latlng);meCircle.setLatLng(p.latlng).setRadius(p.accuracy)}
 if(localizza.primo){map.flyTo(p.latlng,16);localizza.primo=false}vicino(ME)}
function vicino(pos,msg){const n=$('#near');n.classList.add('on');if(!pos){n.innerHTML=`<button class="x" aria-label="Chiudi">×</button>${esc(msg)}`;return}
 const v=vicina(pos.lat,pos.lng),s=stato(),now=adesso(V.viaggio.fuso);
 const pool=(s.fase==='durante'&&s.i>=0?V.giorni[s.i].eventi.filter(e=>e.lat!=null&&(e.ora||'')>=now.ora):eventiMappa());
 const nx=pool.length?pool.slice().sort((a,b)=>s.fase==='durante'?0:km(pos.lat,pos.lng,a.lat,a.lng)-km(pos.lat,pos.lng,b.lat,b.lng))[0]:null;
 n.innerHTML=`<button class="x" aria-label="Chiudi">×</button>${v?`<div>Stazione più vicina: <b>${nomeSt(v.s)}</b>, ${piedi(v.d)} min a piedi${v.s.l.length?' · '+linee(v.s):''}. <a href="${arrivo({lat:v.s.lat,lng:v.s.lon},pos)}" target="_blank" rel="noopener">Portami lì</a></div>`:'<div>Nessuna stazione del programma qui vicino.</div>'}
 ${nx?`<div style="margin-top:6px">${s.fase==='durante'?'Prossima tappa':'Tappa più vicina'}: <b>${esc(nx.titolo)}</b> (${km(pos.lat,pos.lng,nx.lat,nx.lng).toFixed(1)} km). <a href="${arrivo(nx,pos)}" target="_blank" rel="noopener">Come arrivarci</a></div>`:''}`}
$('#near').addEventListener('click',e=>{if(e.target.closest('.x'))$('#near').classList.remove('on')});

/* ---------- persone, proposte e pollici (Firebase Realtime Database) ---------- */
const PERSONE=['Angelo','Luigi','Valerio','Daniele','Luca','Dario'];
const PCOL={Angelo:'#e2412b',Luigi:'#2c3e8f',Valerio:'#13808a',Daniele:'#7b45c4',Luca:'#b07800',Dario:'#c03a6e'};
const FBV='12.11.0',FCFG={apiKey:'AIzaSyBhLn7ArFoHOtumCZpMb0LlRb23mOblLGM',authDomain:'la-taverna-dei-giochi.firebaseapp.com',projectId:'la-taverna-dei-giochi',appId:'1:879748781861:web:d67778b6e973f1fc19eccc',databaseURL:'https://la-taverna-dei-giochi-default-rtdb.europe-west1.firebasedatabase.app'};
let IO=store.get('bij:nome',null),KEY=store.get('bij:k',null),FB=null,PROP={},propStato='spento',propErr='';
(()=>{const m=location.hash.match(/k=([A-Za-z0-9]{20,64})/);if(m){KEY=m[1];store.set('bij:k',KEY);history.replaceState(null,'',location.pathname+'#home')}})();
const avatar=(n,s=26)=>`<span class="av" style="--p:${PCOL[n]||'#666'};width:${s}px;height:${s}px;font-size:${Math.round(s*.45)}px" title="${esc(n)}">${esc((n||'?')[0])}</span>`;
function accesso(forza){if(IO&&KEY&&!forza)return;const o=$('#login');o.classList.add('on');
 o.querySelector('.sheet').innerHTML=`<h2>Chi sei?</h2><p class="lead">Scegli il tuo nome: le tue proposte e i tuoi pollici avranno la tua firma.</p><div class="who">${PERSONE.map(n=>`<button data-io="${n}" aria-pressed="${IO===n}">${avatar(n,44)}<b>${n}</b></button>`).join('')}</div>
 ${KEY?'':`<label class="fld">Codice del viaggio <small>è nel link che vi ho mandato in chat</small><input id="kin" autocomplete="off" placeholder="es. CT1Z…"></label>`}<p class="foot">Senza accesso il programma si vede lo stesso; servono nome e codice solo per proporre e votare.</p><button class="btn" data-chiudi>Più tardi</button>`}
$('#login').addEventListener('click',e=>{const b=e.target.closest('[data-io]');if(b){const k=$('#kin');if(k&&k.value.trim()){KEY=k.value.trim().replace(/.*k=/,'');store.set('bij:k',KEY)}
  if(!KEY){k&&k.focus();toast('Serve il codice del viaggio');return}IO=b.dataset.io;store.set('bij:nome',IO);$('#login').classList.remove('on');utente();avviaFB();route();return}
 if(e.target.closest('[data-chiudi]')||e.target.id==='login')$('#login').classList.remove('on')});
function utente(){$('#me').innerHTML=IO?`${avatar(IO,24)}<span>${esc(IO)}</span>`:'Accedi'}
$('#me').addEventListener('click',()=>accesso(true));
async function avviaFB(){if(FB||!IO||!KEY)return;propStato='carica';
 try{const B=`https://www.gstatic.com/firebasejs/${FBV}/`;const[A,Au,Db]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-database.js')]);
  const app=A.initializeApp(FCFG,'viaggio'),auth=Au.getAuth(app);await auth.authStateReady();if(!auth.currentUser)await Au.signInAnonymously(auth);
  const db=Db.getDatabase(app);FB={Db,db,uid:auth.currentUser.uid,ref:p=>Db.ref(db,`viaggi/${KEY}/${p}`)};
  Db.onValue(FB.ref('proposte'),s=>{PROP=s.val()||{};propStato='ok';aggiornaProp()},e=>{propStato='errore';propErr=String(e&&e.code||e);aggiornaProp()});
 }catch(e){propStato='errore';propErr=String(e&&e.code||e);aggiornaProp()}}
const propDi=data=>Object.entries(PROP[data]||{}).map(([id,p])=>({...p,id,data,nv:Object.keys(p.voti||{}).length})).sort((a,b)=>b.nv-a.nv||a.t-b.t);
const linkG=(p,citta)=>p.link&&/^https:\/\//.test(p.link)?p.link:p.lat!=null?`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((p.luogo||p.titolo)+' '+(citta||'Japan'))}`;
function coords(s){if(!s)return null;try{s=decodeURIComponent(s)}catch(e){}const m=s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)||s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)||s.match(/[?&](?:q|query|ll|destination|center)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/)||s.match(/^\s*(-?\d{1,2}\.\d+)\s*[, ]\s*(-?\d{1,3}\.\d+)\s*$/);return m?{lat:+m[1],lng:+m[2]}:null}
function propCard(p,g){const mia=FB&&p.uid===FB.uid,io=IO&&p.voti&&p.voti[IO],chi=Object.keys(p.voti||{});
 return`<div class="prop" id="p-${esc(p.id)}"><div class="ph-row">${avatar(p.autore,30)}<div><b>${esc(p.titolo)}</b><small>${esc(p.autore)}${p.fascia?' · '+esc(p.fascia):''}${p.luogo?' · '+esc(p.luogo):''}</small></div></div>
 ${p.nota?`<p>${esc(p.nota)}</p>`:''}<div class="acts"><button class="btn like ${io?'on':''}" data-like="${esc(g.data)}|${esc(p.id)}" aria-pressed="${!!io}" ${IO?'':'disabled'}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10v11H3V10h4Zm0 0 4-8a3 3 0 0 1 3 3v4h5.5a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.1 21H7"/></svg>${p.nv}</button>
 <a class="btn" href="${esc(linkG(p,g.citta))}" target="_blank" rel="noopener">Google Maps</a>${p.lat!=null?`<a class="btn" href="${arrivo(p,ME)}" target="_blank" rel="noopener">Come arrivo</a>`:''}${mia?`<button class="btn" data-del="${esc(g.data)}|${esc(p.id)}">Elimina</button>`:''}</div>
 ${chi.length?`<div class="likers">${chi.map(n=>avatar(n,20)).join('')}<span>${chi.length===1?'piace a '+esc(chi[0]):'piace a '+chi.map(esc).join(', ')}</span></div>`:''}</div>`}
function vProposte(i){const g=V.giorni[i],ps=propDi(g.data);
 let h=`<section class="props"><div class="ph-head"><h2 class="sec" style="margin:0">Proposte del gruppo</h2>${IO?`<span class="lead" style="margin:0">come ${avatar(IO,20)} ${esc(IO)}</span>`:''}</div>`;
 if(!IO||!KEY)return h+`<p class="lead">Accedi con il tuo nome per vedere e fare proposte per questa giornata.</p><button class="btn pri" data-login>Accedi</button></section>`;
 if(propStato==='errore')h+=`<div class="alert">Le proposte non sono raggiungibili in questo momento (${esc(propErr)}).</div>`;
 else if(propStato!=='ok')h+=`<p class="lead">Carico le proposte…</p>`;
 h+=ps.length?ps.map(p=>propCard(p,g)).join(''):(propStato==='ok'?`<p class="lead">Ancora nessuna proposta: siate i primi.</p>`:'');
 return h+`<form class="pform" data-data="${g.data}"><h3>Proponi qualcosa per il ${esc(corto(g.data))}</h3>
 <input name="titolo" maxlength="120" required placeholder="Cosa? es. Ramen da Ichiran">
 <input name="luogo" maxlength="120" placeholder="Dove? nome del posto o quartiere">
 <input name="link" maxlength="600" placeholder="Link di Google Maps (consigliato)">
 <div class="row2"><select name="fascia"><option value="">Quando?</option><option value="mattina">Mattina</option><option value="pomeriggio">Pomeriggio</option><option value="sera">Sera</option></select><button class="btn pri" type="submit">Proponi</button></div>
 <textarea name="nota" maxlength="600" placeholder="Perché? prezzo, orari, consigli…"></textarea></form></section>`}
function aggiornaProp(){const m=location.hash.match(/^#g(\d+)$/);if(m){const box=$('.props');if(box&&!box.contains(document.activeElement)){const i=+m[1]-1;box.outerHTML=vProposte(i)}}
 else if(!location.hash||location.hash==='#home'){$$('.dc').forEach((a,i)=>{const n=propDi(V.giorni[i].data).length,em=a.querySelector('.pc');if(em)em.textContent=n?` · ${n} proposte`:''})}
 if(map)disegnaProp()}
let propLayer;
function disegnaProp(){if(!propLayer)propLayer=L.layerGroup().addTo(map);propLayer.clearLayers();const giorni=filter==null||$('#lall').checked?V.giorni.map((g,i)=>i):[filter];
 giorni.forEach(i=>{const g=V.giorni[i];propDi(g.data).forEach(p=>{if(p.lat==null)return;
  L.marker([p.lat,p.lng],{icon:L.divIcon({className:'',html:`<div class="pin prop-pin" style="--c:${PCOL[p.autore]||'#666'}"><span>${p.nv||'★'}</span></div>`,iconSize:[30,30],iconAnchor:[15,30],popupAnchor:[0,-30]}),title:p.titolo})
   .bindPopup(()=>`<div class="pop" style="--c:${PCOL[p.autore]}"><div class="bd"><small>Proposta di ${esc(p.autore)} · giorno ${i+1}</small>${propCard(p,g)}</div></div>`,{maxWidth:290,minWidth:270}).addTo(propLayer)})})}
document.addEventListener('click',async e=>{const l=e.target.closest('[data-like]'),d=e.target.closest('[data-del]');
 if(e.target.closest('[data-login]'))accesso(true);
 if(l&&FB&&IO){const[g,id]=l.dataset.like.split('|'),on=!!(PROP[g]&&PROP[g][id]&&PROP[g][id].voti&&PROP[g][id].voti[IO]);
  try{await FB.Db.set(FB.ref(`proposte/${g}/${id}/voti/${IO}`),on?null:true)}catch(err){toast('Voto non salvato')}}
 if(d&&FB){const[g,id]=d.dataset.del.split('|');if(d.dataset.ok){try{await FB.Db.remove(FB.ref(`proposte/${g}/${id}`))}catch(err){toast('Non eliminata')}}else{d.dataset.ok=1;d.textContent='Conferma elimina';setTimeout(()=>{d.dataset.ok='';d.textContent='Elimina'},3000)}}});
document.addEventListener('submit',async e=>{const f=e.target.closest('.pform');if(!f)return;e.preventDefault();if(!FB){toast('Proposte non collegate');return}
 const o={autore:IO,uid:FB.uid,t:Date.now(),titolo:f.titolo.value.trim()};if(!o.titolo)return;
 for(const k of['luogo','nota','fascia']){const v=f[k].value.trim();if(v)o[k]=v}
 const lk=f.link.value.trim();if(lk){if(/^https:\/\//.test(lk))o.link=lk;const c=coords(lk);if(c){o.lat=c.lat;o.lng=c.lng}}
 const btn=f.querySelector('[type=submit]');btn.disabled=true;
 try{await FB.Db.set(FB.Db.push(FB.ref('proposte/'+f.dataset.data)),o);f.reset();toast('Proposta inviata')}catch(err){toast('Proposta non salvata: '+(err.code||err))}btn.disabled=false});
function toast(t){let el=$('#toast');el.textContent=t;el.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>el.classList.remove('on'),2400)}

/* ---------- chips e routing ---------- */
function chips(){$('#chips').innerHTML=`<button class="chip" data-f="" aria-pressed="${filter==null}">Tutto</button>`+V.giorni.map((g,i)=>`<button class="chip" data-f="${i}" aria-pressed="${filter===i}" style="${filter===i?`background:${col(i)};`:''}">${i+1} · ${esc(corto(g.data))}</button>`).join('');
 const a=$('#chips [aria-pressed=true]');if(a)a.scrollIntoView({inline:'center',block:'nearest'})}
$('#chips').addEventListener('click',e=>{const c=e.target.closest('[data-f]');if(!c)return;const f=c.dataset.f===''?null:+c.dataset.f;
 if(document.body.classList.contains('mapmode')){filter=f;selId=null;chips();disegnaPins(true);history.replaceState(null,'','#mappa')}else location.hash=f==null?'#home':'#g'+(f+1)});
function route(){const h=location.hash.slice(1)||'home',m=h.match(/^g(\d+)$/),mob=innerWidth<=860;
 document.body.classList.toggle('mapmode',h==='mappa');
 $$('.top a.tab').forEach(a=>a.toggleAttribute('aria-current',a.hash==='#'+(h==='info'?'info':'home')&&!m||(m&&a.hash==='#home')));
 $$('#bnav a').forEach(a=>a.toggleAttribute('aria-current',(a.dataset.t==='map'&&h==='mappa')||(a.dataset.t==='info'&&h==='info')||(a.dataset.t==='list'&&h!=='mappa'&&h!=='info')));
 if(h==='mappa'){if(map){map.invalidateSize();disegnaPins(!route.fitted);route.fitted=true}return}
 let html;if(m){const i=Math.min(Math.max(+m[1]-1,0),V.giorni.length-1);filter=i;html=vGiorno(i)}else if(h==='info'){html=vInfo()}else{filter=null;html=vHome()}
 selId=null;$('#view').innerHTML=html;$('#side').scrollTop=0;riempiFoto($('#view'));chips();
 if(map){map.invalidateSize();disegnaPins(true)}}
$('#view').addEventListener('click',e=>{const c=e.target.closest('.card[data-sel]'),sm=e.target.closest('[data-showmap]');if(e.target.closest('a'))return;
 if(sm){selId=null;location.hash='#mappa';setTimeout(()=>{const x=ev(sm.dataset.showmap);seleziona(x.id);const m=PINS[x.id];if(m)setTimeout(()=>m.openPopup(),650)},120);return}
 if(c&&innerWidth>860){seleziona(c.dataset.sel);const m=PINS[c.dataset.sel];if(m)setTimeout(()=>m.openPopup(),650)}});
$('#view').addEventListener('change',e=>{const i=e.target;if(!i.dataset.k)return;const ck=store.get('bij:'+i.dataset.k,{});ck[i.dataset.i]=i.checked;store.set('bij:'+i.dataset.k,ck)});
document.addEventListener('click',e=>{const a=e.target.closest('.leaflet-popup a[href^="#g"]');if(a&&innerWidth<=860){map.closePopup()}});
addEventListener('hashchange',route);addEventListener('resize',()=>map&&map.invalidateSize());

Promise.all([fetch('data/viaggio.json',{cache:'no-cache'}).then(r=>r.json()),fetch('data/stazioni.json').then(r=>r.json()).catch(()=>null)]).then(([v,s])=>{V=v;ST=s;prepara();document.title=V.viaggio.titolo;initMap();utente();if(!IO||!KEY)setTimeout(()=>accesso(),600);else avviaFB();
 if(!location.hash){const st=stato();if(st.fase==='durante'&&st.i>=0)location.hash='#g'+(st.i+1)}route()})
 .catch(()=>{$('#view').innerHTML='<div class="pad">Il programma non si è caricato. Controllate la connessione e ricaricate.</div>'});
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
}
