'use strict';
{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COL=['#e2412b','#2c3e8f','#b07800','#7b45c4','#13808a','#c03a6e','#4f6375','#2b7a3e'];
const TIPI={visita:'Visita',attivita:'Da fare',pasto:'Cibo',evento:'Evento',trasferimento:'Spostamento',treno:'Treno',bus:'Bus',volo:'Volo',hotel:'Alloggio',nota:'Nota'};
const FONTI={piano:'Dal vostro piano',mappa:'Dalla vostra mappa',proposta:'Suggerimento',prenotato:'Prenotato',gruppo:'Approvata dal gruppo'};
const FASCE=[['mattina','Mattina','10:00'],['pomeriggio','Pomeriggio','15:00'],['sera','Sera','20:00']];
const PERSONE=['Angelo','Luigi','Valerio','Daniele','Luca','Dario'];
const PCOL={Angelo:'#e2412b',Luigi:'#2c3e8f',Valerio:'#13808a',Daniele:'#7b45c4',Luca:'#b07800',Dario:'#c03a6e'};
const KEY='CT1Zd9gxQiGd1Zmn4GohBkh1';
const FBV='12.11.0',FCFG={apiKey:'AIzaSyBhLn7ArFoHOtumCZpMb0LlRb23mOblLGM',authDomain:'la-taverna-dei-giochi.firebaseapp.com',projectId:'la-taverna-dei-giochi',appId:'1:879748781861:web:d67778b6e973f1fc19eccc',databaseURL:'https://la-taverna-dei-giochi-default-rtdb.europe-west1.firebasedatabase.app'};
let V,ST,map,ME=null,filter=null,selId=null,IO=null,FB=null,PROP={},propStato='spento',propErr='',watchId=null;
const col=i=>COL[i%COL.length];
const D=iso=>new Date(iso+'T12:00:00');
const fmt=(iso,o)=>D(iso).toLocaleDateString('it-IT',o);
const lungo=iso=>fmt(iso,{weekday:'long',day:'numeric',month:'long'});
const corto=iso=>fmt(iso,{day:'numeric',month:'short'});
const diff=(a,b)=>Math.round((D(b)-D(a))/864e5);
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const soldi=(n,c='JPY')=>new Intl.NumberFormat('it-IT',{style:'currency',currency:c,maximumFractionDigits:0}).format(n);
IO=store.get('bij:nome',null);if(!PERSONE.includes(IO))IO=null;
function adesso(tz){try{const p=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());const g=t=>p.find(x=>x.type===t).value;return{data:`${g('year')}-${g('month')}-${g('day')}`,ora:`${g('hour')}:${g('minute')}`}}catch(e){const d=new Date();return{data:d.toISOString().slice(0,10),ora:d.toTimeString().slice(0,5)}}}
function stato(){const n=adesso(V.viaggio.fuso),v=V.viaggio,a=diff(n.data,v.inizio),b=diff(v.fine,n.data);
 if(a>0)return{fase:'prima',txt:a===1?'Si parte domani':`Mancano ${a} giorni`};if(b>0)return{fase:'dopo',txt:'Viaggio concluso'};
 const i=V.giorni.findIndex(g=>g.data===n.data);return{fase:'durante',i,txt:`Oggi è il giorno ${i+1}`}}
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>el.classList.remove('on'),2400)}
const avatar=(n,s=26)=>`<span class="av" style="--p:${PCOL[n]||'#666'};width:${s}px;height:${s}px;font-size:${Math.round(s*.45)}px" title="${esc(n)}">${esc((n||'?')[0])}</span>`;
const fasciaDi=o=>!o?'':o<'12:00'?'mattina':o<'18:00'?'pomeriggio':'sera';

/* ---------- foto (Wikipedia) ---------- */
const WK={};
function foto(t){if(!t)return Promise.resolve(null);if(WK[t])return WK[t];const c=store.get('wk2:'+t,undefined);if(c!==undefined)return WK[t]=Promise.resolve(c);
 return WK[t]=fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(t.replace(/ /g,'_'))).then(r=>r.ok?r.json():null).then(j=>{const v=j&&j.thumbnail?{src:j.thumbnail.source,url:j.content_urls?.desktop?.page||''}:null;store.set('wk2:'+t,v);return v}).catch(()=>null)}
const big=(src,w)=>src.replace(/\/(\d+)px-/,`/${w}px-`);
function riempiFoto(root=document){if(!root)return;root.querySelectorAll('[data-wiki]:not([data-done])').forEach(el=>{el.dataset.done=1;const w=+el.dataset.w||400;
 foto(el.dataset.wiki).then(v=>{if(!v){if(el.dataset.scene&&window.scena)el.innerHTML=scena(el.dataset.scene,+el.dataset.seed||3);return}
  const img=new Image();img.alt=el.dataset.alt||'';img.loading='lazy';img.decoding='async';img.src=big(v.src,w);img.onerror=()=>{img.onerror=null;img.src=v.src};el.prepend(img);
  if(el.dataset.credit!==undefined&&v.url){const a=document.createElement('a');a.className='credit';a.href=v.url;a.target='_blank';a.rel='noopener';a.textContent='Foto: Wikipedia';el.appendChild(a)}})})}
const ph=(t,w,extra='',scene='',seed=3,alt='')=>`<div class="ph" data-wiki="${esc(t||'')}" data-w="${w}" data-scene="${esc(scene)}" data-seed="${seed}" data-alt="${esc(alt)}" ${extra}></div>`;

/* ---------- stazioni e link ---------- */
function km(a,b,c,d){const x=(d-b)*Math.cos((a+c)/2*Math.PI/180),y=c-a;return Math.hypot(x,y)*111.2}
function vicina(lat,lng){if(!ST||lat==null)return null;let best=null,bd=1e9;for(const s of ST.stazioni){const d=km(lat,lng,s.lat,s.lon);if(d<bd){bd=d;best=s}}return best&&bd<2.5?{s:best,d:bd}:null}
const piedi=d=>Math.max(1,Math.round(d*1000*1.25/80));
const nomeSt=s=>s.n?`${esc(s.n)} <span lang="ja">${esc(s.k)}</span>`:`<span lang="ja">${esc(s.k)}</span>`;
const linee=s=>s.l.slice(0,3).map(i=>esc(ST.linee[i].n)).join(', ');
const ICO_TRENO='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex:none;margin-top:2px"><rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M8 21l2-4M16 21l-2-4"/></svg>';
function staTxt(e){const v=vicina(e.lat,e.lng);if(!v)return'';return`<div class="sta">${ICO_TRENO}<span><b>${nomeSt(v.s)}</b> · ${v.d<.15?'lì davanti':piedi(v.d)+' min a piedi'}${v.s.l.length?`<br>${linee(v.s)}`:''}</span></div>`}
const q=e=>e.lat!=null?`${e.lat},${e.lng}`:encodeURIComponent((e.luogo||e.titolo||'')+' Japan');
const gmap=e=>e.link&&/^https:\/\//.test(e.link)?e.link:`https://www.google.com/maps/search/?api=1&query=${q(e)}`;
const arrivo=(e,da)=>`https://www.google.com/maps/dir/?api=1${da?`&origin=${q(da)}`:''}&destination=${q(e)}&travelmode=transit`;
function coords(s){if(!s)return null;try{s=decodeURIComponent(s)}catch(e){}const m=s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)||s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)||s.match(/[?&](?:q|query|ll|destination|center)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/)||s.match(/^\s*(-?\d{1,2}\.\d+)\s*[, ]\s*(-?\d{1,3}\.\d+)\s*$/);return m?{lat:+m[1],lng:+m[2]}:null}

/* ---------- dati: programma + proposte approvate ---------- */
let PIANO=[];
function prepara(){V.giorni.sort((a,b)=>a.data<b.data?-1:1);V.giorni.forEach((g,i)=>{g.i=i;g.eventi.forEach((e,k)=>{e.id=`e${i}-${k}`;e.d=i})})}
function propDi(data){return Object.entries(PROP[data]||{}).map(([id,p])=>({...p,id,data,d:V.giorni.findIndex(g=>g.data===data),nv:Object.keys(p.voti||{}).length,prop:true})).sort((a,b)=>b.nv-a.nv||a.t-b.t)}
function tappe(i){const g=V.giorni[i],ok=propDi(g.data).filter(p=>p.ok).map(p=>({...p,ora:p.ora||(FASCE.find(f=>f[0]===p.fascia)||FASCE[0])[2],fonte:'gruppo',tipo:'attivita',id:p.id}));
 const t=[...g.eventi,...ok].sort((a,b)=>(a.ora||'').localeCompare(b.ora||''));let n=0;t.forEach(e=>{e.n=e.lat!=null?++n:0});return t}
function ricalcola(){PIANO=V.giorni.flatMap((g,i)=>tappe(i))}
const trova=id=>PIANO.find(e=>e.id===id)||Object.values(PROP).flatMap(o=>Object.entries(o)).map(([k,p])=>({...p,id:k})).find(p=>p.id===id);

/* ---------- Firebase: proposte e pollici ---------- */
async function avviaFB(){if(FB)return;propStato='carica';
 try{const B=`https://www.gstatic.com/firebasejs/${FBV}/`;const[A,Au,Db]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-database.js')]);
  const app=A.initializeApp(FCFG,'viaggio'),auth=Au.getAuth(app);await auth.authStateReady();if(!auth.currentUser)await Au.signInAnonymously(auth);
  const db=Db.getDatabase(app);FB={Db,db,uid:auth.currentUser.uid,ref:p=>Db.ref(db,`viaggi/${KEY}/${p}`)};
  Db.onValue(FB.ref('proposte'),s=>{PROP=s.val()||{};propStato='ok';aggiorna()},e=>{propStato='errore';propErr=String(e&&e.code||e);aggiorna()});
 }catch(e){propStato='errore';propErr=String(e&&e.code||e);aggiorna()}}
const salva=(p,v)=>FB?FB.Db.set(FB.ref(p),v):Promise.reject({code:'non collegato'});
function aggiorna(){ricalcola();const a=document.activeElement;const typing=a&&a.closest&&a.closest('#view form, #view input, #view textarea');
 if(!typing&&!$('#sheet').classList.contains('on')){const y=$('#side').scrollTop;renderView();$('#side').scrollTop=y}if(map)disegna(false)}

/* ---------- accesso ---------- */
function accesso(){const o=$('#login');o.classList.add('on');
 o.querySelector('.sheet').innerHTML=`<h2>Chi sei?</h2><p class="lead">Scegli il tuo nome: proposte, pollici e approvazioni avranno la tua firma.</p><div class="who">${PERSONE.map(n=>`<button data-io="${n}" aria-pressed="${IO===n}">${avatar(n,46)}<b>${n}</b></button>`).join('')}</div><button class="btn" data-chiudi>Solo guardare</button>`}
$('#login').addEventListener('click',e=>{const b=e.target.closest('[data-io]');if(b){IO=b.dataset.io;store.set('bij:nome',IO);$('#login').classList.remove('on');utente();aggiorna();toast('Ciao '+IO);return}
 if(e.target.closest('[data-chiudi]')||e.target.id==='login')$('#login').classList.remove('on')});
function utente(){$('#me').innerHTML=IO?`${avatar(IO,24)}<span>${esc(IO)}</span>`:'Chi sei?'}
$('#me').addEventListener('click',accesso);

/* ---------- schede (HTML) ---------- */
function tagRow(e){return`<div class="tags">${e.n?`<span class="num" style="--c:${col(e.d)}">${e.n}</span>`:''}${e.tipo&&!e.prop?`<span class="tg">${esc(TIPI[e.tipo]||e.tipo)}</span>`:''}${e.fonte?`<span class="tg ${esc(e.fonte)}">${esc(FONTI[e.fonte]||e.fonte)}</span>`:''}${e.costo?`<span class="tg">${soldi(e.costo,e.valuta||'JPY')}</span>`:e.costoPersona?`<span class="tg">${soldi(e.costoPersona)} a testa</span>`:''}</div>`}
function likeBtn(p){const io=IO&&p.voti&&p.voti[IO];return`<button class="btn like ${io?'on':''}" data-like="${esc(p.data)}|${esc(p.id)}" aria-pressed="${!!io}" aria-label="Mi piace"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10v11H3V10h4Zm0 0 4-8a3 3 0 0 1 3 3v4h5.5a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.1 21H7"/></svg>${p.nv||0}</button>`}
function likers(p){const chi=Object.keys(p.voti||{});return chi.length?`<div class="likers">${chi.map(n=>avatar(n,20)).join('')}<span>piace a ${chi.map(esc).join(', ')}</span></div>`:''}
function stopCard(e,cls=''){const g=V.giorni[e.d];
 return`<div class="stop ${cls}" id="s-${e.id}"><div class="t">${esc(e.ora||'')}${e.fine?`<small>${esc(e.fine)}</small>`:''}</div>
 <div class="card ${selId===e.id?'sel':''}" data-sel="${e.id}" style="--c:${col(e.d)}">${e.wiki?ph(e.wiki,640,'','',e.d+1,e.titolo):''}<div class="bd">${tagRow(e)}
 <h4>${esc(e.titolo)}</h4>${e.luogo&&e.luogo!==e.titolo?`<p class="pl">${esc(e.luogo)}</p>`:''}${e.prop?`<p class="by">${avatar(e.autore,20)} proposta di ${esc(e.autore)}</p>`:''}${e.note||e.nota?`<p>${esc(e.note||e.nota)}</p>`:''}${staTxt(e)}${e.prop?likers(e):''}
 <div class="acts">${e.prop?likeBtn(e):''}<a class="btn pri" href="${arrivo(e,ME)}" target="_blank" rel="noopener">Come arrivo</a><a class="btn" href="${gmap(e)}" target="_blank" rel="noopener">Google Maps</a>${e.lat!=null?`<button class="btn" data-showmap="${e.id}">Mappa</button>`:''}${e.prop&&IO?`<button class="btn" data-ok="${esc(e.data)}|${esc(e.id)}|0">Togli dal programma</button>`:''}</div></div></div></div>`}
function propCard(p){const mia=FB&&p.uid===FB.uid,f=(FASCE.find(x=>x[0]===p.fascia)||FASCE[0]);
 return`<div class="prop" id="p-${esc(p.id)}" style="--p:${PCOL[p.autore]||'#666'}"><div class="ph-row">${avatar(p.autore,30)}<div><small>Proposta di ${esc(p.autore)}</small><b>${esc(p.titolo)}</b>${p.luogo?`<small>${esc(p.luogo)}</small>`:''}</div></div>
 ${p.nota?`<p>${esc(p.nota)}</p>`:''}${p.lat!=null?staTxt(p):''}${likers(p)}
 <div class="acts">${IO?likeBtn(p):''}<a class="btn" href="${esc(gmap(p))}" target="_blank" rel="noopener">Google Maps</a>${p.lat!=null?`<button class="btn" data-showmap="${esc(p.id)}">Mappa</button>`:''}
 ${IO?`<span class="okrow"><input type="time" value="${esc(p.ora||f[2])}" aria-label="Orario" data-ora="${esc(p.id)}"><button class="btn ok" data-ok="${esc(p.data)}|${esc(p.id)}|1">Metti nel programma</button></span>`:''}${mia?`<button class="btn" data-del="${esc(p.data)}|${esc(p.id)}">Elimina</button>`:''}</div></div>`}

/* ---------- viste ---------- */
function vHome(){const v=V.viaggio,s=stato(),n=diff(v.inizio,v.fine)+1,tutte=V.giorni.flatMap(g=>propDi(g.data)),aperte=tutte.filter(p=>!p.ok);
 const recenti=tutte.slice().sort((a,b)=>b.t-a.t).slice(0,4);
 return`<div class="hero">${ph(v.hero,1200,'data-credit style="position:absolute;inset:0;height:auto"','hero',3,'Monte Fuji')}<div class="sh"></div><div class="tx"><h1>${esc(v.titolo)}</h1><p>${esc(v.sottotitolo)}</p><span class="pill">${esc(s.txt)}</span></div></div>
 <div class="pad"><div class="stats"><div><b>${n}</b><span>giorni, ${corto(v.inizio)} – ${corto(v.fine)}</span></div><div><b>${PIANO.length}</b><span>tappe in programma</span></div><div><b>${aperte.length}</b><span>proposte da votare</span></div></div>
 <div class="acts" style="margin-bottom:6px">${s.fase==='durante'&&s.i>=0?`<a class="btn pri" href="#g${s.i+1}">Vai a oggi</a>`:''}<a class="btn pri" href="#piano">Pianifica insieme</a><button class="btn" data-nuova="">+ Proponi qualcosa</button></div>
 ${recenti.length?`<h2 class="sec">Ultime proposte</h2>${recenti.map(p=>`<a class="mini" href="#g${p.d+1}" style="--p:${PCOL[p.autore]}">${avatar(p.autore,28)}<span><b>${esc(p.titolo)}</b><small>${esc(p.autore)} · giorno ${p.d+1}, ${esc(corto(p.data))}${p.ok?' · nel programma':''}</small></span><em>${p.nv} ♥</em></a>`).join('')}`:''}
 <h2 class="sec">Giorno per giorno</h2><div class="days">${V.giorni.map((g,i)=>{const np=propDi(g.data).filter(p=>!p.ok).length;return`<a class="dc ${s.fase==='durante'&&s.i===i?'today':''}" href="#g${i+1}" style="--c:${col(i)}">${ph(g.cover,300,'',g.scena,i+1,g.titolo).replace('</div>',`<span class="n">${i+1}</span></div>`)}<div><small>${esc(fmt(g.data,{weekday:'short',day:'numeric',month:'short'}))} · ${esc(g.citta||'')}</small><strong>${esc(g.titolo)}</strong><em>${tappe(i).length} tappe${np?` · <b class="np">${np} da votare</b>`:''}</em></div></a>`}).join('')}</div>
 <p class="foot">Foto da Wikipedia e Wikimedia Commons. Mappe © OpenStreetMap, OpenFreeMap, OpenMapTiles, Esri, GSI Japan, OpenTopoMap, CyclOSM.</p></div>`}
function vGiorno(i){const g=V.giorni[i],now=adesso(V.viaggio.fuso),live=now.data===g.data,T=tappe(i),P=propDi(g.data).filter(p=>!p.ok);let next=false;
 const blocchi=FASCE.map(([k,nome])=>{const ts=T.filter(e=>fasciaDi(e.ora)===k),ps=P.filter(p=>(p.fascia||'mattina')===k||(!p.fascia&&k==='mattina'));
  const stops=ts.map(e=>{let c='';if(live&&!next&&(e.fine&&/^\d\d:\d\d$/.test(e.fine)?e.fine:e.ora)>=now.ora){c='next';next=true}return stopCard(e,c)}).join('');
  return`<div class="slot">${nome}</div>${stops}${ps.length?`<div class="pgroup"><div class="plab">Proposte per ${nome.toLowerCase()} · votate e mettete nel programma</div>${ps.map(propCard).join('')}</div>`:''}<button class="add" data-nuova="${g.data}|${k}">+ Proponi per ${nome.toLowerCase()}</button>`}).join('');
 return`<div style="--c:${col(i)}"><div class="cover">${ph(g.cover,1200,'data-credit style="position:absolute;inset:0;height:auto"',g.scena,i+1,g.titolo)}<div class="sh"></div><div class="tx"><small>Giorno ${i+1} · ${esc(lungo(g.data))}</small><h1>${esc(g.titolo)}</h1></div></div>
 <nav class="daynav" aria-label="Giornate">${V.giorni.map((x,k)=>`<a href="#g${k+1}" style="--c:${col(k)}" ${k===i?'aria-current="page"':''}>${k+1} · ${esc(corto(x.data))}${propDi(x.data).some(p=>!p.ok)?' •':''}</a>`).join('')}</nav>
 <div class="pad"><p class="lead">${esc(g.riassunto||'')}</p>${(g.avvisi||[]).map(a=>`<div class="alert"><b>Da sapere:</b> ${esc(a)}</div>`).join('')}
 ${propStato==='errore'?`<div class="alert">Proposte non raggiungibili (${esc(propErr)}): si vede solo il programma.</div>`:''}
 ${blocchi}${g.pernotto?`<div class="sleep">Si dorme a <b>${esc(g.pernotto)}</b></div>`:''}
 <div class="acts" style="margin-top:16px">${i>0?`<a class="btn" href="#g${i}">← Giorno ${i}</a>`:''}${i<V.giorni.length-1?`<a class="btn" href="#g${i+2}">Giorno ${i+2} →</a>`:''}<a class="btn" href="#piano">Vista d'insieme</a></div></div></div>`}
function vPiano(){return`<div class="pad"><h1 class="disp" style="font-size:30px;margin:4px 0 4px">Pianifica insieme</h1><p class="lead">Tutte le giornate come nel taccuino: in nero il programma, a colori le proposte con i loro pollici. Tocca per aprire, + per proporre.</p>
 ${V.giorni.map((g,i)=>{const T=tappe(i),P=propDi(g.data).filter(p=>!p.ok);return`<div class="pday" style="--c:${col(i)}"><a class="pdh" href="#g${i+1}"><span class="n">${i+1}</span><b>${esc(fmt(g.data,{weekday:'short',day:'numeric',month:'short'}))}</b><small>${esc(g.titolo)}</small></a>
 <div class="pcols">${FASCE.map(([k,nome])=>`<div class="pcell"><span>${nome}</span>${T.filter(e=>fasciaDi(e.ora)===k).map(e=>`<a class="pi ${e.fonte==='gruppo'?'grp':''}" href="#g${i+1}" data-goto="${e.id}"><b>${esc(e.ora||'')}</b> ${esc(e.titolo)}</a>`).join('')}${P.filter(p=>(p.fascia||'mattina')===k).map(p=>`<a class="pi pp" style="--p:${PCOL[p.autore]}" href="#g${i+1}" data-goto="p-${esc(p.id)}">${avatar(p.autore,18)} ${esc(p.titolo)} <em>${p.nv}♥</em></a>`).join('')}<button class="padd" data-nuova="${g.data}|${k}" aria-label="Proponi per ${nome.toLowerCase()} del ${esc(corto(g.data))}">+</button></div>`).join('')}</div></div>`}).join('')}</div>`}
function lista(key,voci){const ck=store.get('bij:'+key,{});return`<ul class="checks">${voci.map((t,i)=>`<li><label><input type="checkbox" data-k="${key}" data-i="${i}" ${ck[i]?'checked':''}><span>${esc(t)}</span></label></li>`).join('')}</ul>`}
function vInfo(){const inf=V.info,per=V.viaggio.persone||1,tot={};V.giorni.forEach(g=>g.eventi.forEach(e=>{const c=e.valuta||'JPY';tot[c]=(tot[c]||0)+(e.costo||0)+(e.costoPersona||0)*per}));
 const pren=V.giorni.flatMap(g=>g.eventi).filter(e=>e.fonte==='prenotato'&&(e.costo||e.tipo==='volo'));
 return`<div class="pad"><h2 class="sec" style="margin-top:4px">Prenotazioni</h2>${pren.map(e=>`<div class="box" style="--c:${col(e.d)}"><small style="color:var(--c);font-weight:700">Giorno ${e.d+1} · ${esc(corto(V.giorni[e.d].data))}${e.ora?' · '+esc(e.ora):''}</small><h3>${esc(e.titolo)}</h3><p style="margin:0 0 6px;color:var(--muted);font-size:14px">${esc(e.note||'')}</p><div class="acts">${e.costo?`<span class="tg">${soldi(e.costo,e.valuta||'JPY')}</span>`:''}<a class="btn" href="${gmap(e)}" target="_blank" rel="noopener">Google Maps</a><a class="btn" href="#g${e.d+1}">Giorno ${e.d+1}</a></div></div>`).join('')}
 <div class="box"><h3>Spese inserite</h3><p style="margin:0">${Object.entries(tot).filter(x=>x[1]).map(([c,v])=>`<b class="disp" style="font-size:24px">${soldi(v,c)}</b>`).join(' + ')}</p><p style="margin:6px 0 0;color:var(--muted);font-size:13px">${esc(V.viaggio.notaCosti)}</p></div>
 <h2 class="sec">Da sapere</h2><div class="box"><dl class="kv">${inf.pratiche.map(p=>`<dt>${esc(p.voce)}</dt><dd>${esc(p.valore)}</dd>`).join('')}</dl></div>
 <h2 class="sec">Contatti utili</h2><div class="box"><dl class="kv">${inf.contatti.map(c=>`<dt>${esc(c.nome)}<br><small>${esc(c.ruolo||'')}</small></dt><dd><a href="tel:${esc(c.tel.replace(/\s/g,''))}">${esc(c.tel)}</a>${c.email?`<br><small>${esc(c.email)}</small>`:''}</dd>`).join('')}</dl></div>
 <h2 class="sec">Prima di partire</h2>${lista('pre',V.prepartenza)}${V.bagaglio.map((b,j)=>`<h2 class="sec">${esc(b.gruppo)}</h2>${lista('bag'+j,b.voci)}`).join('')}
 <h2 class="sec">Link</h2><div class="acts"><a class="btn" href="${esc(V.mymap)}" target="_blank" rel="noopener">Mappa Big In Japan</a></div><p class="foot">${esc(inf.note)} Le spunte restano su questo telefono.</p></div>`}

/* ---------- form proposta (foglio) ---------- */
let NUOVA={};
function apriForm(data,fascia,pos){NUOVA={lat:pos?.lat??null,lng:pos?.lng??null};if(!IO){accesso();return}
 const s=$('#sheet');s.classList.add('on');const gi=data?V.giorni.findIndex(g=>g.data===data):(filter??0);
 s.querySelector('.sheet').innerHTML=`<form id="pform"><h2>Proponi qualcosa</h2><p class="lead">${avatar(IO,22)} a nome di ${esc(IO)}</p>
 <div class="row2b"><label>Giorno<select name="data">${V.giorni.map((g,i)=>`<option value="${g.data}" ${i===gi?'selected':''}>${i+1} · ${esc(corto(g.data))} · ${esc(g.titolo)}</option>`).join('')}</select></label>
 <label>Quando<select name="fascia">${FASCE.map(([k,n])=>`<option value="${k}" ${k===(fascia||'mattina')?'selected':''}>${n}</option>`).join('')}</select></label></div>
 <label>Cosa<input name="titolo" maxlength="120" required placeholder="es. Ramen da Ichiran" value="${esc(pos?.nome||'')}"></label>
 <label>Dove <small>cerca il posto, oppure incolla un link di Google Maps</small><input name="luogo" maxlength="120" autocomplete="off" placeholder="Cerca un luogo…" value="${esc(pos?.luogo||'')}"></label><div class="sugg" id="sugg"></div>
 <div class="posok" id="posok">${NUOVA.lat!=null?'Posizione impostata sulla mappa':'Nessuna posizione: verrà usata la ricerca di Google'}</div>
 <label>Link Google Maps <small>(facoltativo)</small><input name="link" maxlength="600" placeholder="https://maps.app.goo.gl/…"></label>
 <label>Perché <small>prezzo, orari, consigli</small><textarea name="nota" maxlength="600"></textarea></label>
 <div class="acts"><button class="btn pri" type="submit">Pubblica la proposta</button><button class="btn" type="button" data-chiudi>Annulla</button></div></form>`;
 setTimeout(()=>s.querySelector('[name=titolo]').focus(),50)}
function cercaLuoghi(qs,cb){clearTimeout(cercaLuoghi.t);if(qs.length<3){cb([]);return}cercaLuoghi.t=setTimeout(()=>{const c=map?map.getCenter():{lat:35.68,lng:139.76};
 fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(qs)}&limit=6&lat=${c.lat}&lon=${c.lng}`).then(r=>r.json()).then(j=>cb(j.features.map(f=>({nome:f.properties.name||qs,dove:[f.properties.district,f.properties.city,f.properties.country].filter(Boolean).join(', '),lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0]})))).catch(()=>cb([]))},350)}
$('#sheet').addEventListener('input',e=>{const f=e.target.form;if(!f)return;
 if(e.target.name==='luogo'){const v=e.target.value,c=coords(v);if(c){NUOVA.lat=c.lat;NUOVA.lng=c.lng;$('#posok').textContent='Posizione presa dal link';return}
  cercaLuoghi(v,r=>{$('#sugg').innerHTML=r.map((x,i)=>`<button type="button" data-sg="${i}"><b>${esc(x.nome)}</b><small>${esc(x.dove)}</small></button>`).join('');cercaLuoghi.r=r})}
 if(e.target.name==='link'){const c=coords(e.target.value);if(c){NUOVA.lat=c.lat;NUOVA.lng=c.lng;$('#posok').textContent='Posizione presa dal link'}}});
$('#sheet').addEventListener('click',e=>{const sg=e.target.closest('[data-sg]');if(sg){const x=cercaLuoghi.r[+sg.dataset.sg],f=$('#pform');NUOVA.lat=x.lat;NUOVA.lng=x.lng;f.luogo.value=x.nome+(x.dove?', '+x.dove.split(',')[0]:'');if(!f.titolo.value)f.titolo.value=x.nome;$('#sugg').innerHTML='';$('#posok').textContent='Posizione: '+x.nome}
 if(e.target.closest('[data-chiudi]')||e.target.id==='sheet')$('#sheet').classList.remove('on')});
$('#sheet').addEventListener('submit',async e=>{e.preventDefault();const f=e.target,o={autore:IO,uid:FB?.uid,t:Date.now(),titolo:f.titolo.value.trim()};if(!o.titolo)return;if(!FB){toast('Proposte non collegate: riprova tra poco');return}
 for(const k of['luogo','nota','fascia']){const v=f[k].value.trim();if(v)o[k]=v.slice(0,k==='nota'?600:120)}
 const lk=f.link.value.trim();if(/^https:\/\//.test(lk))o.link=lk;if(NUOVA.lat!=null){o.lat=+NUOVA.lat.toFixed(6);o.lng=+NUOVA.lng.toFixed(6)}
 const b=f.querySelector('[type=submit]');b.disabled=true;
 try{await FB.Db.set(FB.Db.push(FB.ref('proposte/'+f.data.value)),o);$('#sheet').classList.remove('on');toast('Proposta pubblicata');const i=V.giorni.findIndex(g=>g.data===f.data.value);if(location.hash!=='#mappa')location.hash='#g'+(i+1)}catch(err){toast('Non salvata: '+(err.code||err));b.disabled=false}});

/* ---------- mappa: MapLibre + OpenFreeMap e altre basi senza chiave ---------- */
const OFM='https://tiles.openfreemap.org/styles/',GLYPHS='https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
const raster=(tiles,attr,over,max=19)=>({version:8,glyphs:GLYPHS,sources:{r:{type:'raster',tiles,tileSize:256,attribution:attr,maxzoom:max},...(over?{o:{type:'raster',tiles:[over],tileSize:256}}:{})},layers:[{id:'r',type:'raster',source:'r'},...(over?[{id:'o',type:'raster',source:'o'}]:[])]});
const T12=u=>u.replace('{z}','12').replace('{x}','3637').replace('{y}','1612');
const STILI=[
 {k:'liberty',n:'Mappa',s:OFM+'liberty',v:1,sw:'linear-gradient(135deg,#f2efe9 40%,#a6d1ea 40% 55%,#cfe8c4 55%)'},
 {k:'bright',n:'Colorata',s:OFM+'bright',v:1,sw:'linear-gradient(135deg,#f8f4f0 40%,#9ccde6 40% 55%,#fbd37c 55%)'},
 {k:'positron',n:'Chiara',s:OFM+'positron',v:1,sw:'linear-gradient(135deg,#fafafa 50%,#d4dadc 50%)'},
 {k:'dark',n:'Notte',s:OFM+'dark',v:1,sw:'linear-gradient(135deg,#2b2b2b 50%,#0e0e0e 50%)'},
 {k:'fiord',n:'Fiordo',s:OFM+'fiord',v:1,sw:'linear-gradient(135deg,#45516e 50%,#38435c 50%)'},
 {k:'sat',n:'Satellite',s:raster(['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],'Immagini © Esri','https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'),t:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/1612/3637'},
 {k:'gsifoto',n:'Foto aeree Giappone',s:raster(['https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'],'Foto © GSI Japan',null,18),t:T12('https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg')},
 {k:'osm',n:'OSM classica',s:raster(['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],'© OpenStreetMap'),t:T12('https://tile.openstreetmap.org/{z}/{x}/{y}.png')},
 {k:'gsi',n:'GSI (giapponese)',s:raster(['https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'],'© GSI Japan',null,18),t:T12('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png')},
 {k:'gsipale',n:'GSI chiara',s:raster(['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'],'© GSI Japan',null,18),t:T12('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png')},
 {k:'topo',n:'Topografica',s:raster(['https://a.tile.opentopomap.org/{z}/{x}/{y}.png','https://b.tile.opentopomap.org/{z}/{x}/{y}.png'],'© OpenStreetMap, SRTM · © OpenTopoMap',null,17),t:T12('https://a.tile.opentopomap.org/{z}/{x}/{y}.png')},
 {k:'esri',n:'Strade Esri',s:raster(['https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'],'© Esri'),t:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/12/1612/3637'},
 {k:'cyclosm',n:'CyclOSM',s:raster(['https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png','https://b.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png'],'© OpenStreetMap · CyclOSM'),t:T12('https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png')}];
let stile=store.get('bij:stile','liberty'),OPZ=store.get('bij:opz',{linee:true,stazioni:true,latino:true,tutto:false});
const stileObj=()=>STILI.find(s=>s.k===stile)||STILI[0];
let LINEE=null,STAZ=null;
function geo(){if(!ST||LINEE)return;LINEE={type:'FeatureCollection',features:ST.linee.map(l=>({type:'Feature',properties:{c:/^#[0-9a-fA-F]{6}$/.test(l.c)?l.c:'#8a93a6',n:l.n},geometry:{type:'LineString',coordinates:l.s.map(([a,b])=>[b,a])}}))};
 STAZ={type:'FeatureCollection',features:ST.stazioni.map(s=>({type:'Feature',properties:{n:s.n||s.k,k:s.k,l:s.l.slice(0,4).map(i=>ST.linee[i].n).join(', ')},geometry:{type:'Point',coordinates:[s.lon,s.lat]}}))}}
function initMap(){geo();map=new maplibregl.Map({container:'map',style:stileObj().s,center:[139.74,35.68],zoom:11.5,attributionControl:{compact:true},maxPitch:70});
 map.addControl(new maplibregl.NavigationControl({visualizePitch:true}),'bottom-right');map.addControl(new maplibregl.ScaleControl({unit:'metric'}),'bottom-left');
 map.on('style.load',livelli);
 map.on('click','staz-pt',e=>{const f=e.features[0];new maplibregl.Popup({offset:10,maxWidth:'280px'}).setLngLat(f.geometry.coordinates).setHTML(`<div class="bd st-pop"><b>${esc(f.properties.n)}</b> <span lang="ja">${esc(f.properties.k)}</span><p>${esc(f.properties.l)}</p><div class="acts"><a class="btn pri" href="${arrivo({lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0]},ME)}" target="_blank" rel="noopener">Come arrivo</a></div></div>`).addTo(map)});
 map.on('mouseenter','staz-pt',()=>map.getCanvas().style.cursor='pointer');map.on('mouseleave','staz-pt',()=>map.getCanvas().style.cursor='');
 map.on('contextmenu',e=>quiPopup(e.lngLat));
 map.on('click',e=>{if(map.queryRenderedFeatures(e.point,{layers:map.getLayer('staz-pt')?['staz-pt']:[]}).length)return;if(scegli){scegli=false;$('#mapwrap').classList.remove('picking');quiPopup(e.lngLat)}else{$('#lpanel').classList.remove('on');$('#blayers').classList.remove('on')}});
 pannello();disegna(true)}
let scegli=false;
function quiPopup(ll){const g=filter??0;new maplibregl.Popup({offset:6,maxWidth:'280px'}).setLngLat(ll).setHTML(`<div class="bd"><b>Questo punto</b><p>${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}</p>${vicinaTxt(ll)}<div class="acts"><button class="btn pri" data-qui="${ll.lat},${ll.lng}">Proponi qui</button><a class="btn" href="https://www.google.com/maps/search/?api=1&query=${ll.lat},${ll.lng}" target="_blank" rel="noopener">Google Maps</a></div></div>`).addTo(map)}
const vicinaTxt=ll=>{const v=vicina(ll.lat,ll.lng);return v?`<div class="sta">${ICO_TRENO}<span><b>${nomeSt(v.s)}</b> · ${piedi(v.d)} min a piedi</span></div>`:''};
function livelli(){const vt=!!stileObj().v;
 if(vt&&OPZ.latino)map.getStyle().layers.forEach(l=>{if(l.type==='symbol'&&l.layout&&l.layout['text-field'])try{map.setLayoutProperty(l.id,'text-field',['coalesce',['get','name:it'],['get','name:latin'],['get','name_en'],['get','name']])}catch(e){}});
 if(LINEE){if(!map.getSource('linee'))map.addSource('linee',{type:'geojson',data:LINEE});if(!map.getSource('staz'))map.addSource('staz',{type:'geojson',data:STAZ});
  if(!map.getLayer('linee'))map.addLayer({id:'linee',type:'line',source:'linee',layout:{'line-join':'round','line-cap':'round',visibility:OPZ.linee?'visible':'none'},paint:{'line-color':['get','c'],'line-width':['interpolate',['linear'],['zoom'],9,1.2,13,3,16,5],'line-opacity':.8}});
  if(!map.getLayer('staz-pt'))map.addLayer({id:'staz-pt',type:'circle',source:'staz',minzoom:12,layout:{visibility:OPZ.stazioni?'visible':'none'},paint:{'circle-radius':['interpolate',['linear'],['zoom'],12,2.5,16,6],'circle-color':'#fff','circle-stroke-color':'#15171c','circle-stroke-width':1.6}});
  if(!map.getLayer('staz-lb'))map.addLayer({id:'staz-lb',type:'symbol',source:'staz',minzoom:13.5,layout:{visibility:OPZ.stazioni?'visible':'none','text-field':['get','n'],'text-font':['Noto Sans Bold'],'text-size':12,'text-offset':[0,1.1],'text-anchor':'top','text-optional':true},paint:{'text-color':'#15171c','text-halo-color':'#fff','text-halo-width':1.6}})}
 if(!map.getSource('rotta'))map.addSource('rotta',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
 if(!map.getLayer('rotta'))map.addLayer({id:'rotta',type:'line',source:'rotta',layout:{'line-cap':'round'},paint:{'line-color':['get','c'],'line-width':4,'line-dasharray':[.2,2],'line-opacity':.9}});
 rotta()}
function pannello(){$('#lgrid').innerHTML=STILI.map(s=>`<button data-st="${s.k}" aria-pressed="${s.k===stile}"><i style="background:${s.t?`url('${s.t}') center/cover`:s.sw}"></i>${esc(s.n)}</button>`).join('');
 $('#lopz').innerHTML=[['linee','Linee di treni e metro'],['stazioni','Stazioni (da vicino)'],['latino','Nomi in caratteri latini'],['tutto','Tutte le tappe del viaggio']].map(([k,n])=>`<label><input type="checkbox" data-opz="${k}" ${OPZ[k]?'checked':''}> ${n}</label>`).join('')}
$('#lpanel').addEventListener('click',e=>{const b=e.target.closest('[data-st]');if(!b)return;stile=b.dataset.st;store.set('bij:stile',stile);map.setStyle(stileObj().s,{diff:false});pannello()});
$('#lpanel').addEventListener('change',e=>{const k=e.target.dataset.opz;if(!k)return;OPZ[k]=e.target.checked;store.set('bij:opz',OPZ);
 if(k==='linee'&&map.getLayer('linee'))map.setLayoutProperty('linee','visibility',OPZ.linee?'visible':'none');
 if(k==='stazioni')['staz-pt','staz-lb'].forEach(l=>map.getLayer(l)&&map.setLayoutProperty(l,'visibility',OPZ.stazioni?'visible':'none'));
 if(k==='latino')map.setStyle(stileObj().s,{diff:false});if(k==='tutto')disegna(true)});
$('#blayers').addEventListener('click',()=>{$('#lpanel').classList.toggle('on');$('#blayers').classList.toggle('on')});
$('#b3d').addEventListener('click',()=>{const p=map.getPitch()>10;map.easeTo({pitch:p?0:60,bearing:p?0:-17,duration:800});$('#b3d').classList.toggle('on',!p)});
$('#bfit').addEventListener('click',()=>inquadra());
$('#bqui').addEventListener('click',()=>{if(!IO){accesso();return}scegli=!scegli;$('#mapwrap').classList.toggle('picking',scegli);toast(scegli?'Tocca il punto della mappa da proporre':'Annullato')});

let MK=[];
function evMappa(){if(filter==null||OPZ.tutto)return V.giorni.flatMap((g,i)=>g.zona==='Roma'?[]:tappe(i)).filter(e=>e.lat!=null);return tappe(filter).filter(e=>e.lat!=null)}
function propMappa(){const gs=filter==null||OPZ.tutto?V.giorni:[V.giorni[filter]];return gs.flatMap(g=>propDi(g.data)).filter(p=>!p.ok&&p.lat!=null)}
function pinEl(e,label,cls){const el=document.createElement('button');el.className='pinw';el.setAttribute('aria-label',e.titolo);el.innerHTML=`<div class="pin ${cls}" style="--c:${cls.includes('prop')?PCOL[e.autore]:col(e.d)}"><span>${esc(label)}</span></div>`;return el}
function popHTML(e){const g=V.giorni[e.d];return`<div class="pop" style="--c:${col(e.d)}">${e.wiki?ph(e.wiki,560,'','',e.d+1,e.titolo):''}<div class="bd"><small>Giorno ${e.d+1} · ${esc(corto(g.data))}${e.ora?' · '+esc(e.ora):''}</small><h4>${esc(e.titolo)}</h4>${e.prop?`<p class="by">${avatar(e.autore,18)} ${e.ok?'approvata, ':''}proposta di ${esc(e.autore)}</p>`:''}${(e.note||e.nota)?`<p>${esc((e.note||e.nota).slice(0,160))}</p>`:''}${staTxt(e)}${e.prop?likers(e):''}
 <div class="acts">${e.prop&&IO?likeBtn(e):''}<a class="btn pri" href="${arrivo(e,ME)}" target="_blank" rel="noopener">Come arrivo</a><a class="btn" href="${esc(gmap(e))}" target="_blank" rel="noopener">Google Maps</a><a class="btn" href="#g${e.d+1}">Giorno ${e.d+1}</a></div></div></div>`}
function disegna(fit){if(!map)return;MK.forEach(m=>m.remove());MK=[];const giorno=filter!=null&&!OPZ.tutto,evs=evMappa(),ps=propMappa();
 evs.forEach(e=>{const el=pinEl(e,giorno?e.n:e.d+1,(e.tipo==='hotel'?'hotel ':'')+(e.fonte==='gruppo'?'grp ':'')+(e.id===selId?'sel':''));
  const pop=new maplibregl.Popup({offset:30,maxWidth:'290px'}).setHTML(popHTML(e));pop.on('open',()=>{riempiFoto(pop.getElement());seleziona(e.id,false)});
  const m=new maplibregl.Marker({element:el,anchor:'bottom'}).setLngLat([e.lng,e.lat]).setPopup(pop).addTo(map);m._id=e.id;MK.push(m)});
 ps.forEach(p=>{const el=pinEl(p,p.nv||'?','prop');const pop=new maplibregl.Popup({offset:22,maxWidth:'300px'}).setHTML(`<div class="pop"><div class="bd">${propCard(p)}</div></div>`);
  const m=new maplibregl.Marker({element:el,anchor:'bottom'}).setLngLat([p.lng,p.lat]).setPopup(pop).addTo(map);m._id=p.id;MK.push(m)});
 rotta();carosello(evs,ps);if(fit)inquadra(evs.concat(ps))}
function rotta(){if(!map||!map.getSource('rotta'))return;const f=filter!=null&&!OPZ.tutto?[{type:'Feature',properties:{c:col(filter)},geometry:{type:'LineString',coordinates:tappe(filter).filter(e=>e.lat!=null).map(e=>[e.lng,e.lat])}}]:[];map.getSource('rotta').setData({type:'FeatureCollection',features:f.filter(x=>x.geometry.coordinates.length>1)})}
function inquadra(pts=evMappa().concat(propMappa())){if(!map||!pts.length)return;if(filter==null&&!OPZ.tutto){const tk=pts.filter(e=>V.giorni[e.d]?.zona==='Tokyo');if(tk.length)pts=tk}
 const b=new maplibregl.LngLatBounds();pts.forEach(e=>b.extend([e.lng,e.lat]));const mob=innerWidth<=860;map.fitBounds(b,{padding:{top:120,left:50,right:70,bottom:mob?170:50},maxZoom:16,duration:700})}
function seleziona(id,vola=true){selId=id;MK.forEach(m=>{const p=m.getElement().querySelector('.pin');p&&p.classList.toggle('sel',m._id===id)});
 $$('.card.sel,.cc.sel').forEach(x=>x.classList.remove('sel'));$$(`[data-sel="${id}"]`).forEach(x=>x.classList.add('sel'));
 const cc=$(`.cc[data-sel="${id}"]`);if(cc&&!carScroll)cc.parentNode.scrollTo({left:cc.offsetLeft-16,behavior:'smooth'});
 const m=MK.find(x=>x._id===id);if(vola&&m)map.flyTo({center:m.getLngLat(),zoom:Math.max(map.getZoom(),15.5),duration:700})}
const apriPin=id=>{const m=MK.find(x=>x._id===id);if(m&&!m.getPopup().isOpen())m.togglePopup()};
let carScroll=false,carT;
function carosello(evs,ps){const c=$('#carousel');c.innerHTML=evs.concat(ps).map(e=>`<div class="cc" data-sel="${esc(e.id)}" style="--c:${e.prop&&!e.ok?PCOL[e.autore]:col(e.d)}">${ph(e.wiki,240,'','',e.d+1,e.titolo)}<div><small>${e.prop&&!e.ok?'Proposta di '+esc(e.autore):(filter!=null&&!OPZ.tutto?e.n+' · ':'G'+(e.d+1)+' · ')+esc(e.ora||'')}</small><b>${esc(e.titolo)}</b><div class="acts"><a class="btn pri" href="${arrivo(e,ME)}" target="_blank" rel="noopener">Come arrivo</a><button class="btn" data-pop="${esc(e.id)}">Dettagli</button></div></div></div>`).join('');riempiFoto(c)}
$('#carousel').addEventListener('scroll',()=>{carScroll=true;clearTimeout(carT);carT=setTimeout(()=>{const c=$('#carousel'),mid=c.scrollLeft+c.clientWidth/2;let best=null,bd=1e9;c.querySelectorAll('.cc').forEach(x=>{const d=Math.abs(x.offsetLeft+x.clientWidth/2-mid);if(d<bd){bd=d;best=x}});if(best)seleziona(best.dataset.sel,true);carScroll=false},160)});

/* ---------- ricerca sulla mappa ---------- */
$('#msearch').addEventListener('input',e=>cercaLuoghi(e.target.value,r=>{cercaLuoghi.m=r;$('#mres').innerHTML=r.map((x,i)=>`<button data-mr="${i}"><b>${esc(x.nome)}</b><small>${esc(x.dove)}</small></button>`).join('')}));
$('#mres').addEventListener('click',e=>{const b=e.target.closest('[data-mr]');if(!b)return;const x=cercaLuoghi.m[+b.dataset.mr];$('#mres').innerHTML='';$('#msearch').value=x.nome;
 map.flyTo({center:[x.lng,x.lat],zoom:16});new maplibregl.Popup({offset:6,maxWidth:'280px'}).setLngLat([x.lng,x.lat]).setHTML(`<div class="bd"><b>${esc(x.nome)}</b><p>${esc(x.dove)}</p>${vicinaTxt(x)}<div class="acts"><button class="btn pri" data-qui="${x.lat},${x.lng}" data-nome="${esc(x.nome)}">Proponi</button><a class="btn" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.nome)}%20${x.lat},${x.lng}" target="_blank" rel="noopener">Google Maps</a><a class="btn" href="${arrivo(x,ME)}" target="_blank" rel="noopener">Come arrivo</a></div></div>`).addTo(map)});

/* ---------- posizione ---------- */
let meMk=null;
$('#bloc').addEventListener('click',()=>{if(watchId!=null){navigator.geolocation.clearWatch(watchId);watchId=null;$('#bloc').classList.remove('on');return}
 if(!navigator.geolocation){vicino(null,'Questo browser non dà la posizione.');return}$('#bloc').classList.add('on');vicino(null,'Cerco la vostra posizione…');let primo=true;
 watchId=navigator.geolocation.watchPosition(p=>{ME={lat:p.coords.latitude,lng:p.coords.longitude};if(!meMk){const el=document.createElement('div');el.className='me';meMk=new maplibregl.Marker({element:el}).setLngLat([ME.lng,ME.lat]).addTo(map)}else meMk.setLngLat([ME.lng,ME.lat]);
  if(primo){map.flyTo({center:[ME.lng,ME.lat],zoom:16});primo=false}vicino(ME)},()=>{$('#bloc').classList.remove('on');watchId=null;vicino(null,'Posizione non disponibile: consentitela al browser per questo sito.')},{enableHighAccuracy:true,maximumAge:15000})});
function vicino(pos,msg){const n=$('#near');n.classList.add('on');if(!pos){n.innerHTML=`<button class="x" aria-label="Chiudi">×</button>${esc(msg)}`;return}
 const v=vicina(pos.lat,pos.lng),s=stato(),now=adesso(V.viaggio.fuso),pool=s.fase==='durante'&&s.i>=0?tappe(s.i).filter(e=>e.lat!=null&&(e.ora||'')>=now.ora):evMappa();
 const nx=pool.length?(s.fase==='durante'?pool[0]:pool.slice().sort((a,b)=>km(pos.lat,pos.lng,a.lat,a.lng)-km(pos.lat,pos.lng,b.lat,b.lng))[0]):null;
 n.innerHTML=`<button class="x" aria-label="Chiudi">×</button>${v?`<div>Stazione più vicina: <b>${nomeSt(v.s)}</b>, ${piedi(v.d)} min a piedi${v.s.l.length?' · '+linee(v.s):''}. <a href="${arrivo({lat:v.s.lat,lng:v.s.lon},pos)}" target="_blank" rel="noopener">Portami lì</a></div>`:'<div>Nessuna stazione qui vicino.</div>'}${nx?`<div style="margin-top:6px">${s.fase==='durante'?'Prossima tappa':'Tappa più vicina'}: <b>${esc(nx.titolo)}</b> (${km(pos.lat,pos.lng,nx.lat,nx.lng).toFixed(1)} km). <a href="${arrivo(nx,pos)}" target="_blank" rel="noopener">Come arrivarci</a></div>`:''}`}
$('#near').addEventListener('click',e=>{if(e.target.closest('.x'))$('#near').classList.remove('on')});

/* ---------- chips, routing, azioni ---------- */
function chips(){$('#chips').innerHTML=`<button class="chip" data-f="" aria-pressed="${filter==null}">Tutto</button>`+V.giorni.map((g,i)=>`<button class="chip" data-f="${i}" aria-pressed="${filter===i}" style="${filter===i?`background:${col(i)};color:#fff`:''}">${i+1} · ${esc(corto(g.data))}</button>`).join('');const a=$('#chips [aria-pressed=true]');if(a)a.scrollIntoView({inline:'center',block:'nearest'})}
$('#chips').addEventListener('click',e=>{const c=e.target.closest('[data-f]');if(!c)return;const f=c.dataset.f===''?null:+c.dataset.f;
 if(document.body.classList.contains('mapmode')){filter=f;selId=null;chips();disegna(true)}else location.hash=f==null?'#home':'#g'+(f+1)});
function renderView(){const h=location.hash.slice(1)||'home',m=h.match(/^g(\d+)$/);let html;
 if(m){const i=Math.min(Math.max(+m[1]-1,0),V.giorni.length-1);filter=i;html=vGiorno(i)}else if(h==='info')html=vInfo();else if(h==='piano'){html=vPiano()}else{if(h!=='mappa')filter=null;html=vHome()}
 $('#view').innerHTML=html;riempiFoto($('#view'))}
function route(){const h=location.hash.slice(1)||'home';document.body.classList.toggle('mapmode',h==='mappa');
 $$('.top a.tab').forEach(a=>a.toggleAttribute('aria-current',a.hash.slice(1)===(h.match(/^g\d+$/)?'home':h)));
 $$('#bnav a').forEach(a=>a.toggleAttribute('aria-current',a.hash.slice(1)===(h.match(/^g\d+$/)?'home':h)));
 if(h==='mappa'){if(map){map.resize();disegna(!route.fit);route.fit=true}return}
 selId=null;renderView();$('#side').scrollTop=0;chips();if(map){map.resize();disegna(true)}}
document.addEventListener('click',async e=>{const t=e.target;
 const nu=t.closest('[data-nuova]');if(nu){const[d,f]=nu.dataset.nuova.split('|');apriForm(d||null,f||null);return}
 const qu=t.closest('[data-qui]');if(qu){const[la,ln]=qu.dataset.qui.split(',').map(Number);$$('.maplibregl-popup').forEach(p=>p.remove());apriForm(filter!=null?V.giorni[filter].data:null,null,{lat:la,lng:ln,nome:qu.dataset.nome||'',luogo:qu.dataset.nome||''});return}
 const l=t.closest('[data-like]');if(l){if(!IO){accesso();return}const[g,id]=l.dataset.like.split('|'),on=!!(PROP[g]?.[id]?.voti?.[IO]);try{await salva(`proposte/${g}/${id}/voti/${IO}`,on?null:true)}catch(err){toast('Voto non salvato: '+(err.code||err))}return}
 const ok=t.closest('[data-ok]');if(ok){const[g,id,v]=ok.dataset.ok.split('|');const ora=$(`[data-ora="${id}"]`)?.value;try{if(v==='1'&&ora)await salva(`proposte/${g}/${id}/ora`,ora);await salva(`proposte/${g}/${id}/ok`,v==='1');toast(v==='1'?'Messa nel programma':'Tolta dal programma')}catch(err){toast('Non salvato: '+(err.code||err))}return}
 const d=t.closest('[data-del]');if(d){if(d.dataset.sure){const[g,id]=d.dataset.del.split('|');try{await salva(`proposte/${g}/${id}`,null);toast('Proposta eliminata')}catch(err){toast('Non eliminata')}}else{d.dataset.sure=1;d.textContent='Conferma';setTimeout(()=>{d.dataset.sure='';d.textContent='Elimina'},3000)}return}
 const sm=t.closest('[data-showmap]');if(sm){const id=sm.dataset.showmap;if(innerWidth<=860){location.hash='#mappa';setTimeout(()=>{seleziona(id);setTimeout(()=>apriPin(id),750)},150)}else{seleziona(id);setTimeout(()=>apriPin(id),750)}return}
 const pp=t.closest('[data-pop]');if(pp){apriPin(pp.dataset.pop);return}
 const go=t.closest('[data-goto]');if(go){setTimeout(()=>{const el=document.getElementById(go.dataset.goto.startsWith('p-')?go.dataset.goto:'s-'+go.dataset.goto);if(el)el.scrollIntoView({behavior:'smooth',block:'center'})},80)}
 const c=t.closest('#view .card[data-sel]');if(c&&!t.closest('a,button')&&innerWidth>860){seleziona(c.dataset.sel);setTimeout(()=>apriPin(c.dataset.sel),750)}
 if(t.closest('.maplibregl-popup a[href^="#g"]'))$$('.maplibregl-popup').forEach(p=>p.remove())});
$('#view').addEventListener('change',e=>{const i=e.target;if(!i.dataset.k)return;const ck=store.get('bij:'+i.dataset.k,{});ck[i.dataset.i]=i.checked;store.set('bij:'+i.dataset.k,ck)});
addEventListener('hashchange',route);addEventListener('resize',()=>map&&map.resize());
addEventListener('keydown',e=>{if(e.key==='Escape'){$('#sheet').classList.remove('on');$('#login').classList.remove('on')}});

Promise.all([fetch('data/viaggio.json',{cache:'no-cache'}).then(r=>r.json()),fetch('data/stazioni.json').then(r=>r.json()).catch(()=>null)]).then(([v,s])=>{V=v;ST=s;prepara();ricalcola();document.title=V.viaggio.titolo;utente();
 try{initMap()}catch(e){$('#map').innerHTML='<p style="padding:20px">La mappa non si è avviata su questo browser.</p>'}
 if(!location.hash){const st=stato();if(st.fase==='durante'&&st.i>=0)history.replaceState(null,'','#g'+(st.i+1))}route();avviaFB();if(!IO)setTimeout(accesso,700)})
 .catch(()=>{$('#view').innerHTML='<div class="pad">Il programma non si è caricato. Controllate la connessione e ricaricate.</div>'});
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
}
