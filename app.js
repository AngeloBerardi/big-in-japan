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
const APK='https://github.com/AngeloBerardi/big-in-japan/releases/download/android/big-in-japan.apk';
const INAPP=/[?&]app=android/.test(location.search)||(()=>{try{return localStorage.getItem('bij:app')==='1'}catch(e){return false}})();
if(/[?&]app=android/.test(location.search))try{localStorage.setItem('bij:app','1')}catch(e){}
const apkBox=()=>INAPP?'':`<div class="apk"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M12 7v7m-3-3 3 3 3-3M10 18h4"/></svg><div><b>App per Android</b><small>Si apre a tutto schermo con un tocco e funziona anche senza rete. Dopo il download, consentite l'installazione da questa fonte.</small></div><a class="btn pri" href="${APK}">Scarica l'APK</a></div>`;
const FBV='12.11.0',FCFG={apiKey:'AIzaSyBhLn7ArFoHOtumCZpMb0LlRb23mOblLGM',authDomain:'la-taverna-dei-giochi.firebaseapp.com',projectId:'la-taverna-dei-giochi',appId:'1:879748781861:web:d67778b6e973f1fc19eccc',databaseURL:'https://la-taverna-dei-giochi-default-rtdb.europe-west1.firebasedatabase.app'};
let IDEE=[],IDX={},RZ={},CM={},CMID=null;
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
const cercaFoto=q=>fetch('https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=5&prop=pageimages|info&inprop=url&piprop=thumbnail&pithumbsize=640&gsrsearch='+encodeURIComponent(q)).then(r=>r.ok?r.json():null).then(j=>{const P=j&&j.query?Object.values(j.query.pages).sort((a,b)=>a.index-b.index).find(p=>p.thumbnail):null;return P?{src:P.thumbnail.source,url:P.fullurl||''}:null}).catch(()=>null);
function foto(t,alt){if(!t&&!alt)return Promise.resolve(null);const key=t||'?'+alt;if(WK[key])return WK[key];const c=store.get('wk3:'+key,undefined);if(c!==undefined&&(c||Date.now()-(store.get('wk3t:'+key,0))<6048e5))return WK[key]=Promise.resolve(c);
 const sum=t?fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(t.replace(/ /g,'_'))).then(r=>r.ok?r.json():null).then(j=>j&&j.thumbnail?{src:j.thumbnail.source,url:j.content_urls?.desktop?.page||''}:null).catch(()=>null):Promise.resolve(null);
 return WK[key]=sum.then(v=>v||(t?cercaFoto(t.replace(/_/g,' ')):null)).then(v=>v||(alt?cercaFoto(alt+' Japan'):null)).then(v=>{if(v!==null||navigator.onLine){store.set('wk3:'+key,v);if(!v)store.set('wk3t:'+key,Date.now())}return v})}
const big=(src,w)=>src.replace(/\/(\d+)px-/,`/${w}px-`);
function riempiFoto(root=document){if(!root)return;root.querySelectorAll('[data-wiki]:not([data-done])').forEach(el=>{el.dataset.done=1;const w=+el.dataset.w||400;
 foto(el.dataset.wiki,el.dataset.alt).then(v=>{if(!v){if(el.dataset.scene&&window.scena)el.innerHTML=scena(el.dataset.scene,+el.dataset.seed||3);else el.classList.add('noimg');return}
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

/* ---------- spostamenti: percorso minimo su treni e metro (dati aperti, tempi stimati) ---------- */
const ESCLUSE=/Narita Express|Scenic|Shinkansen/;
let GR=null;const ROUTE={};
function grafo(){if(GR||!ST)return GR;const S=ST.stazioni,N=[],idx={},adj=[];
 const nodo=(s,l)=>{const k=s+'|'+l;if(idx[k]==null){idx[k]=N.length;N.push({s,l});adj.push([])}return idx[k]};
 const ed=(a,b,w,t)=>{adj[a].push([b,w,t]);adj[b].push([a,w,t])};
 ST.linee.forEach((L,li)=>{if(ESCLUSE.test(L.n))return;const cand=S.map((s,i)=>[s,i]).filter(([s])=>s.l.includes(li));let prev=null;const seq=[];
  L.s.forEach(([a,b])=>{let best=null,bd=.5;for(const[s,i]of cand){const d=km(a,b,s.lat,s.lon);if(d<bd){bd=d;best=i}}if(best==null){prev=null;return}if(best===prev)return;
   if(prev!=null){const d=km(S[prev].lat,S[prev].lon,S[best].lat,S[best].lon);if(d<12)ed(nodo(prev,li),nodo(best,li),d/32*60+.7,'r')}seq.push(best);prev=best});
  L.seq=seq;if(/Yamanote/.test(L.n)&&seq.length>2)ed(nodo(seq[0],li),nodo(seq.at(-1),li),2.5,'r')});
 S.forEach((s,i)=>{const ls=s.l.filter(l=>idx[i+'|'+l]!=null);for(let a=0;a<ls.length;a++)for(let b=a+1;b<ls.length;b++)ed(idx[i+'|'+ls[a]],idx[i+'|'+ls[b]],5,'c')});
 S.forEach((s,i)=>S.forEach((t,j)=>{if(j<=i)return;const d=km(s.lat,s.lon,t.lat,t.lon);if(d<.35)s.l.forEach(la=>t.l.forEach(lb=>{if(idx[i+'|'+la]!=null&&idx[j+'|'+lb]!=null)ed(idx[i+'|'+la],idx[j+'|'+lb],piedi(d)+4,'w')}))}));
 return GR={N,adj,idx}}
const nomeS=i=>{const s=ST.stazioni[i];return s.n||s.k};
function percorso(a,b){const key=`${a.lat},${a.lng}>${b.lat},${b.lng}`;if(ROUTE[key]!==undefined)return ROUTE[key];
 const dir=km(a.lat,a.lng,b.lat,b.lng),camm=piedi(dir);if(dir<.08)return ROUTE[key]=null;
 const G=grafo();let r=null;
 if(G&&dir<40){const S=ST.stazioni,near=p=>S.map((s,i)=>[i,km(p.lat,p.lng,s.lat,s.lon)]).filter(x=>x[1]<1.6).sort((x,y)=>x[1]-y[1]).slice(0,9);
  const da=near(a),aa=near(b),dist=new Float64Array(G.N.length).fill(1e9),prev=new Int32Array(G.N.length).fill(-1),done=new Uint8Array(G.N.length),fine={};
  da.forEach(([i,d])=>ST.stazioni[i].l.forEach(l=>{const n=G.idx[i+'|'+l];if(n!=null&&piedi(d)+3<dist[n]){dist[n]=piedi(d)+3}}));
  aa.forEach(([i,d])=>{fine[i]=piedi(d)});
  for(;;){let u=-1,m=1e9;for(let k=0;k<dist.length;k++)if(!done[k]&&dist[k]<m){m=dist[k];u=k}if(u<0||m>150)break;done[u]=1;for(const[v,w]of G.adj[u])if(m+w<dist[v]){dist[v]=m+w;prev[v]=u}}
  let best=-1,bt=1e9;G.N.forEach((n,k)=>{if(fine[n.s]!=null&&dist[k]+fine[n.s]<bt){bt=dist[k]+fine[n.s];best=k}});
  if(best>=0){const path=[];for(let k=best;k>=0;k=prev[k])path.unshift(k);const tratte=[];
   for(let k=0;k<path.length;k++){const n=G.N[path[k]],t=tratte.at(-1);if(t&&t.l===n.l&&t.ultima!==n.s){t.fermate.push(n.s);t.ultima=n.s}else if(!t||t.l!==n.l)tratte.push({l:n.l,fermate:[n.s],ultima:n.s})}
   const corse=tratte.filter(t=>t.fermate.length>1);
   if(corse.length){const s0=corse[0].fermate[0],sN=corse.at(-1).ultima;
    corse.forEach(t=>{const L=ST.linee[t.l],seq=L.seq||[],ia=seq.indexOf(t.fermate[0]),ib=seq.indexOf(t.ultima);t.verso=/Yamanote/.test(L.n)?'':(ib>ia?nomeS(seq.at(-1)):nomeS(seq[0]));t.min=0;
     for(let k=1;k<t.fermate.length;k++){const p=ST.stazioni[t.fermate[k-1]],q=ST.stazioni[t.fermate[k]];t.min+=km(p.lat,p.lon,q.lat,q.lon)/32*60+.7}t.min=Math.max(1,Math.round(t.min))});
    r={tipo:'treno',tot:Math.round(bt),pa:piedi(km(a.lat,a.lng,ST.stazioni[s0].lat,ST.stazioni[s0].lon)),s0,sN,pb:fine[sN],corse,cambi:corse.length-1}}}}
 if(!r||camm<=Math.max(15,r.tot*.9))r={tipo:'piedi',tot:camm,km:dir,alt:r};else if(r&&camm<=30)r.alt={tipo:'piedi',tot:camm,km:dir};
 if(dir>=40)r={tipo:'lungo',km:dir};
 return ROUTE[key]=r}
/* tariffe a persona (IC card), stime per distanza: Tokyo Metro e taxi da fonti ufficiali 2026, gli altri approssimati */
const OPER=n=>/^Tokyo Metro/.test(n)?'metro':/^Toei/.test(n)?'toei':/^Karasuma|Tozai Line \(Kyoto\)/.test(n)?'kyosub':/^Randen/.test(n)?'randen':/Yurikamome/.test(n)?'yuri':/^(JR|Yamanote|Keihin|Saikyo|Shonan|Ueno|Takasaki|Utsunomiya|Yokosuka|Nambu|Keiyo|Sobu|Biwako|Kosei|Sagano|Nara Line \(JR|Sakurai|Yamatoji)/.test(n)?(/Biwako|Kosei|Sagano|Nara Line \(JR|Sakurai|Yamatoji|JR Kyoto/.test(n)?'jrw':'jr'):'priv';
const scala=(km,t)=>{for(const[l,p]of t)if(km<=l)return p;return t.at(-1)[1]};
const TARIFFA={metro:k=>scala(k,[[6,178],[11,209],[19,252],[27,293],[99,324]]),toei:k=>scala(k,[[4,180],[8,220],[12,280],[16,330],[20,380],[99,430]]),
 jr:k=>scala(k,[[3,150],[6,170],[10,210],[15,240],[20,320],[99,410]]),jrw:k=>scala(k,[[3,150],[6,190],[10,200],[15,240],[99,330]]),
 kyosub:k=>scala(k,[[3,220],[7,260],[11,290],[15,330],[99,360]]),randen:()=>250,yuri:k=>scala(k,[[2,190],[5,250],[9,330],[99,390]]),priv:k=>scala(k,[[3,150],[7,190],[12,240],[20,300],[99,380]])};
const NOME_OP={metro:'Tokyo Metro',toei:'Toei',jr:'JR East',jrw:'JR West',kyosub:'metro di Kyoto',randen:'Randen',yuri:'Yurikamome',priv:'linea privata'};
function costoTreno(r){let tot=0;const parti=[];let cur=null;
 r.corse.forEach(t=>{const op=OPER(ST.linee[t.l].n);let k=0;for(let i=1;i<t.fermate.length;i++){const p=ST.stazioni[t.fermate[i-1]],q2=ST.stazioni[t.fermate[i]];k+=km(p.lat,p.lon,q2.lat,q2.lon)}
  if(cur&&cur.op===op&&op!=='randen')cur.km+=k;else{cur={op,km:k};parti.push(cur)}});
 parti.forEach(p=>{p.y=TARIFFA[p.op](p.km);tot+=p.y});return{tot,parti}}
function taxi(dir,kyoto,ora){const road=dir*1.35,base=kyoto?[.9,255]:[1,232];let y=500+Math.max(0,Math.ceil((road-base[0])*1000/base[1]))*100;const notte=ora&&(ora>='22:00'||ora<'05:00');if(notte)y=Math.round(y*1.2/10)*10;
 const min=road<=5?road/18*60:5/18*60+(road-5)/35*60;return{y,min:Math.round(min+3),notte}}
function legInfo(da,a){const r=percorso(da,a);if(!r)return null;const g=m=>`https://www.google.com/maps/dir/?api=1&origin=${q(da)}&destination=${q(a)}&travelmode=${m}`;
 const P=V.viaggio.persone||6,kyoto=a.lat<35.3&&a.lng<136.5;
 if(r.tipo==='lungo')return{r,lungo:true,g,best:'lungo',min:null};
 const tr=r.tipo==='treno'?r:r.alt&&r.alt.tipo==='treno'?r.alt:null,pd=r.tipo==='piedi'?r:r.alt&&r.alt.tipo==='piedi'?r.alt:null,dir=km(da.lat,da.lng,a.lat,a.lng),tx=taxi(dir,kyoto,a.ora),nTaxi=Math.ceil(P/4);
 const ct=tr?costoTreno(tr):null;
 const opz=[];
 if(pd)opz.push({k:'piedi',ico:ICO_PIEDI,nome:'A piedi',min:pd.tot,pp:0,txt:`${dir<1?Math.round(dir*1000)+' m':dir.toFixed(1)+' km'}`,url:g('walking')});
 if(tr)opz.push({k:'treno',ico:ICO_TRENO,nome:'Treno e metro',min:tr.tot,pp:ct.tot,txt:`${tr.corse.length} ${tr.corse.length===1?'linea':'linee'}${tr.cambi?', '+tr.cambi+(tr.cambi===1?' cambio':' cambi'):''}`,url:g('transit')});
 if(kyoto&&dir>1.2)opz.push({k:'bus',ico:ICO_BUS,nome:'Bus urbano',min:null,pp:230,txt:'tariffa unica, percorso su Google',url:g('transit')});
 if(dir>.6)opz.push({k:'taxi',ico:ICO_TAXI,nome:`Taxi (${nTaxi} auto)`,min:tx.min,pp:Math.ceil(tx.y*nTaxi/P/10)*10,txt:`circa ¥${tx.y.toLocaleString('it-IT')} ad auto${tx.notte?', tariffa notturna':''}`,url:g('driving')});
 const best=pd&&(!tr||pd.min<=15||pd.tot<=tr.tot+5)?'piedi':tr&&tr.tot<=Math.max(tx.min*2,40)?'treno':'taxi';
 const sum=opz.find(o=>o.k===best)||opz[0];
 return{r,g,tr,pd,tx,ct,opz,best,sum,dir,min:sum.min}}
function legHTML(da,a){const L=legInfo(da,a);if(!L)return'';const{r,g}=L,dest=esc(a.luogo||a.titolo);
 if(L.lungo)return`<div class="leg"><span class="li">${ICO_TRENO}</span><span>Trasferimento lungo (${Math.round(r.km)} km): è il treno della giornata. <a href="${g('transit')}" target="_blank" rel="noopener">Orari su Google Maps</a></span></div>`;
 const{tr,ct,opz,best,sum}=L;
 const lin=tr?tr.corse.map(t=>{const L=ST.linee[t.l];return`<span class="lchip" style="--lc:${/^#[0-9a-fA-F]{6}$/.test(L.c)?L.c:'#6b7280'}">${esc(L.n.replace(/^Tokyo Metro |^Toei /,''))}</span>`}).join('<i>›</i>'):'';
 const tab=`<table class="opt"><tbody>${opz.map(o=>`<tr class="${o.k===best?'best':''}"><td>${o.ico}</td><td><b>${o.nome}</b>${o.k===best?' <span class="consig">consigliato</span>':''}<br><small>${esc(o.txt)}</small></td><td class="r">${o.min!=null?'~'+o.min+' min':'—'}</td><td class="r">${o.pp?'~¥'+o.pp.toLocaleString('it-IT')+'<br><small>a testa</small>':'gratis'}</td><td><a href="${o.url}" target="_blank" rel="noopener" aria-label="${o.nome} su Google Maps">Maps</a></td></tr>`).join('')}</tbody></table>`;
 let passi='';if(tr){const p=[`<li>A piedi <b>${tr.pa} min</b> fino alla stazione <b>${esc(nomeS(tr.s0))}</b>.</li>`];
  tr.corse.forEach((t,k)=>{const L=ST.linee[t.l],c=/^#[0-9a-fA-F]{6}$/.test(L.c)?L.c:'#6b7280';if(k>0)p.push(`<li>Cambio a <b>${esc(nomeS(t.fermate[0]))}</b>: seguite i cartelli della <b>${esc(L.n)}</b>.</li>`);
   p.push(`<li><span class="lchip" style="--lc:${c}">${esc(L.n)}</span>${t.verso?` direzione <b>${esc(t.verso)}</b>`:' (linea circolare: controllate il verso sui cartelli)'}: <b>${t.fermate.length-1} ${t.fermate.length===2?'fermata':'fermate'}</b>, circa ${t.min} min, scendete a <b>${esc(nomeS(t.ultima))}</b>.</li>`)});
  p.push(`<li>A piedi <b>${tr.pb} min</b> fino a <b>${dest}</b>.</li>`);
  passi=`<h5>Passaggi in treno e metro${ct.parti.length>1?` · ${ct.parti.map(x=>NOME_OP[x.op]+' ¥'+x.y).join(' + ')}`:''}</h5><ol>${p.join('')}</ol>`}
 return`<details class="leg"><summary><span class="li">${sum.ico}</span><span><b>${sum.nome}${sum.min!=null?' · ~'+sum.min+' min':''}</b>${sum.k==='treno'?' · '+lin:''}${sum.pp?` · ~¥${sum.pp.toLocaleString('it-IT')} a testa`:''} <em>${opz.length>1?'confronta '+opz.length+' opzioni':''}</em></span></summary>
 ${tab}${passi}<p class="nb">Tempi e prezzi sono stime: treni sui dati aperti di linee e stazioni, tariffe IC per distanza, taxi a tassametro (4 persone ad auto). Orari reali e ritardi su Google Maps.</p></details>`}
const ICO_BUS='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 21v-3M16 21v-3"/><circle cx="8" cy="15" r=".5"/><circle cx="16" cy="15" r=".5"/></svg>';
const ICO_TAXI='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 16V11l2-5h10l2 5v5M3 16h18v3H3zM9 3h6v3H9z"/><circle cx="7.5" cy="16" r="1.5"/><circle cx="16.5" cy="16" r="1.5"/></svg>';
const ICO_PIEDI='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13" cy="4" r="2"/><path d="m9 21 2-6 3 3v5M8 12l2-4 4 1 3 4M10 8l-2 5"/></svg>';
function hotelPrima(i,ora){for(let k=i;k>=0;k--){const h=tappe(k).filter(e=>e.tipo==='hotel'&&e.lat!=null&&(k<i||(e.ora||'')<=(ora||'99'))).at(-1);if(h)return h}return null}
function legsGiorno(i){const T=tappe(i),out={};let prev=null;const h=hotelPrima(i-1,'99');
 T.forEach((e,k)=>{if(e.lat==null)return;const da=prev||(k===0||!T.slice(0,k).some(x=>x.lat!=null)?(h&&V.giorni[i].zona===V.giorni[i-1]?.zona?h:null):null);if(da&&km(da.lat,da.lng,e.lat,e.lng)>.08)out[e.id]=legHTML(da,e);prev=e});return out}

/* ---------- dati: programma + proposte approvate ---------- */
let PIANO=[];
function prepara(){V.giorni.sort((a,b)=>a.data<b.data?-1:1);V.giorni.forEach((g,i)=>{g.i=i;g.eventi.forEach((e,k)=>{e.id=`e${i}-${k}`;e.d=i;e.rid0=`ev-${g.data.replace(/-/g,'')}-${(e.ora||'0000').replace(':','')}-${slug(e.titolo)}`})})}
function propDi(data){return Object.entries(PROP[data]||{}).map(([id,p])=>{const r=reaz(id,p.voti),x=p.idea&&IDX[p.idea];return{...p,id,data,d:V.giorni.findIndex(g=>g.data===data),nv:r.su.length,ng:r.giu.length,prop:true,wiki:x?x.wiki:p.wiki}}).sort((a,b)=>(b.nv-b.ng)-(a.nv-a.ng)||a.t-b.t)}
function tappe(i){const t=(tappe.G||grezze()).filter(e=>e.d===i&&!e.nascosto).sort((a,b)=>(a.ora||'').localeCompare(b.ora||''));let n=0;t.forEach(e=>{e.n=e.lat!=null?++n:0});return t}
function ricalcola(){tappe.G=grezze();PIANO=V.giorni.flatMap((g,i)=>tappe(i));tappe.G=null}
const trova=id=>PIANO.find(e=>e.id===id)||Object.values(PROP).flatMap(o=>Object.entries(o)).map(([k,p])=>({...p,id:k})).find(p=>p.id===id);

/* ---------- Firebase: proposte e pollici ---------- */
async function avviaFB(){if(FB)return;propStato='carica';
 try{const B=`https://www.gstatic.com/firebasejs/${FBV}/`;const[A,Au,Db]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-database.js')]);
  const app=A.initializeApp(FCFG,'viaggio'),auth=Au.getAuth(app);await auth.authStateReady();if(!auth.currentUser)await Au.signInAnonymously(auth);
  const db=Db.getDatabase(app);FB={Db,db,uid:auth.currentUser.uid,ref:p=>Db.ref(db,`viaggi/${KEY}/${p}`)};
  Db.onValue(FB.ref('proposte'),s=>{PROP=s.val()||{};propStato='ok';aggiorna()},e=>{propStato='errore';propErr=String(e&&e.code||e);aggiorna()});
  for(const[n,set]of[['spese',v=>SPE=v],['cassa/cambio',v=>{CAMBIO=v&&v.valore?v:null;if(CAMBIO)store.set('bij:cambio',CAMBIO)}],['modifiche',v=>MOD=v],['liste',v=>LST=v],['spunte',v=>SPU=v],['visti',v=>VIS=v],['diario',v=>DIA=v]])Db.onValue(FB.ref(n),s=>{set(s.val()||{});aggiorna()},()=>{});
  Db.onValue(FB.ref('reazioni'),s=>{RZ=s.val()||{};aggiornaRbar();if(CMID)commenti(CMID,true)},()=>{});
  Db.onValue(FB.ref('commenti'),s=>{CM=s.val()||{};aggiornaRbar();if(CMID)commenti(CMID,true)},()=>{});
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
function _likeBtn(p){const io=IO&&p.voti&&p.voti[IO];return`<button class="btn like ${io?'on':''}" data-like="${esc(p.data)}|${esc(p.id)}" aria-pressed="${!!io}" aria-label="Mi piace"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10v11H3V10h4Zm0 0 4-8a3 3 0 0 1 3 3v4h5.5a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.1 21H7"/></svg>${p.nv||0}</button>`}
function _likers(p){const chi=Object.keys(p.voti||{});return chi.length?`<div class="likers">${chi.map(n=>avatar(n,20)).join('')}<span>piace a ${chi.map(esc).join(', ')}</span></div>`:''}
function stopCard(e,cls=''){const g=V.giorni[e.d],vv=visti(e),io=IO&&vv.includes(IO);
 return`<div class="stop ${cls} ${vv.length?'fatta':''}" id="s-${e.id}" data-rid="${esc(rid(e))}" data-day="${e.d}" data-ora="${esc(e.ora||'')}"><div class="t">${esc(e.ora||'')}${e.fine?`<small>${esc(e.fine)}</small>`:''}${IO?`<button class="drag" aria-label="Trascina per cambiare ordine" title="Trascina">⋮⋮</button>`:''}${e.mod&&!e.mod.nascosto?`<small class="modt" title="Spostata da ${esc(e.mod.autore||'')}">spostata</small>`:''}</div>
 <div class="card ${selId===e.id?'sel':''}" data-sel="${e.id}" style="--c:${col(e.d)}">${e.wiki?ph(e.wiki,640,'','',e.d+1,e.titolo):''}<div class="bd">${tagRow(e)}
 <h4>${esc(e.titolo)}</h4>${e.idea&&IDX[e.idea]?avvisoApertura(IDX[e.idea],g.data):''}${(b=>b?`<a class="bgl" href="#piano" data-ptab="prenotare">${bollino(b)}</a>`:'')(bigliettoDi(rid(e)))}${e.luogo&&e.luogo!==e.titolo?`<p class="pl">${esc(e.luogo)}</p>`:''}${e.prop?`<p class="by">${avatar(e.autore,20)} proposta di ${esc(e.autore)}</p>`:''}${e.note||e.nota?`<p>${esc(e.note||e.nota)}</p>`:''}${staTxt(e)}${rbar(rid(e),e.prop?e.voti:null,e.prop?`${e.data}|${e.id}`:null)}
 <div class="acts"><a class="btn pri" href="${arrivo(e,ME)}" target="_blank" rel="noopener">Come arrivo</a><a class="btn" href="${gmap(e)}" target="_blank" rel="noopener">Google Maps</a>${e.sito?`<a class="btn" href="${esc(e.sito)}" target="_blank" rel="noopener">Sito</a>`:''}${e.idea&&IDX[e.idea]?`<button class="btn" data-idea="${esc(e.idea)}">Scheda</button>`:''}${e.lat!=null?`<button class="btn" data-showmap="${e.id}">Mappa</button>`:''}${IO?`<button class="btn" data-mod="${esc(e.id)}">Sposta</button>`:''}<button class="btn vis ${io?'on':''}" data-vis="${esc(rid(e))}" aria-pressed="${!!io}">${io?ico('check')+' Ci sono stato':'Ci sono stato'}</button>${vv.length?`<span class="chi">${vv.map(n=>avatar(n,18)).join('')}</span>`:''}</div></div></div></div>`}
/* aperto quel giorno? */
const GSET=['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
const dowDi=d=>new Date(d+'T12:00:00Z').getUTCDay();
function chiusoIl(x,d){const c=x&&x.chiuso;if(!c||!d)return null;const w=dowDi(d);if((c.dow||[]).includes(w))return`chiuso ${w===0?"la":"il"} ${GSET[w]}`;
 for(const[a,b]of c.date||[])if(d>=a&&d<=b)return a===b?`chiuso il ${corto(a)}`:`chiuso dal ${corto(a)} al ${corto(b)}`;return null}
const daVerificare=(x,d)=>!!(x&&x.chiuso&&x.chiuso.verifica&&d>='2026-12-29'&&d<='2027-01-04');
function avvisoApertura(x,d){const c=chiusoIl(x,d);if(c){const alt=x.giorni.filter(g=>g!==d&&!chiusoIl(x,g));return`<div class="achiuso"><b>Attenzione: ${esc(fmt(d,{weekday:'long',day:'numeric',month:'short'}))} è ${esc(c)}.</b>${alt.length?` Va bene ${alt.slice(0,3).map(g=>esc(corto(g))).join(', ')}.`:''}</div>`}
 return daVerificare(x,d)?`<div class="averif">Orari di fine anno da verificare sul sito prima di andarci.</div>`:''}
function propCard(p){const mia=FB&&p.uid===FB.uid,f=(FASCE.find(x=>x[0]===p.fascia)||FASCE[0]),x=p.idea&&IDX[p.idea];
 return`<div class="prop" id="p-${esc(p.id)}" style="--p:${PCOL[p.autore]||'#666'}">${x?ph(x.wiki,600,'class="pimg"','',3,x.titolo):''}<div class="ph-row">${avatar(p.autore,30)}<div><small>Proposta di ${esc(p.autore)}</small><b>${esc(p.titolo)}</b>${p.luogo?`<small>${esc(p.luogo)}</small>`:''}</div></div>
 ${x?`<p class="imeta"><span>${esc(x.orari)}</span><span>${esc(x.prezzo)}</span></p>${avvisoApertura(x,p.data)}`:''}${p.nota?`<p>${esc(p.nota)}</p>`:''}${p.lat!=null?staTxt(p):''}${rbar(p.id,p.voti,`${p.data}|${p.id}`)}
 <div class="acts">${x?`<button class="btn" data-idea="${esc(x.id)}">Scheda</button>`:''}<a class="btn" href="${esc(gmap(p))}" target="_blank" rel="noopener">Google Maps</a>${p.lat!=null?`<button class="btn" data-showmap="${esc(p.id)}">Mappa</button>`:''}
 ${IO?`<span class="okrow"><input type="time" value="${esc(p.ora||f[2])}" aria-label="Orario" data-ora="${esc(p.id)}"><button class="btn ok" data-ok="${esc(p.data)}|${esc(p.id)}|1">Metti nel programma</button></span>`:''}${mia?`<button class="btn" data-del="${esc(p.data)}|${esc(p.id)}">Elimina</button>`:''}</div></div>`}

/* ---------- reazioni (mi piace / non mi piace) e commenti ---------- */
const ICO_SU='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10v11H3V10h4Zm0 0 4-8a3 3 0 0 1 3 3v4h5.5a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.1 21H7"/></svg>';
const ICO_GIU=ICO_SU.replace('<svg ','<svg style="transform:rotate(180deg)" ');
const ICO_CM='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12Z"/></svg>';
const slug=t=>(t||'').normalize('NFD').replace(/[^A-Za-z0-9]+/g,'').slice(0,14).toLowerCase();
const rid=e=>e.prop?e.id:e.rid0||`ev-${V.giorni[e.d].data.replace(/-/g,'')}-${(e.ora||'0000').replace(':','')}-${slug(e.titolo)}`;
function reaz(id,legacy){const r={};if(legacy)for(const n of Object.keys(legacy))r[n]=1;Object.assign(r,RZ[id]||{});const su=[],giu=[];for(const[n,v]of Object.entries(r)){if(v===1)su.push(n);else if(v===-1)giu.push(n)}return{su,giu,mio:IO?r[IO]||0:0}}
const ncom=id=>Object.keys(CM[id]||{}).length;
function rbar(id,legacy,leg){const r=reaz(id,legacy),nc=ncom(id);
 return`<div class="rbar" data-rid="${esc(id)}"${leg?` data-leg="${esc(leg)}"`:''}><button class="rb su ${r.mio===1?'on':''}" data-r="1" aria-pressed="${r.mio===1}" aria-label="Mi piace">${ICO_SU}<b>${r.su.length}</b></button><button class="rb giu ${r.mio===-1?'on':''}" data-r="-1" aria-pressed="${r.mio===-1}" aria-label="Non mi piace">${ICO_GIU}<b>${r.giu.length}</b></button><button class="rb cm" data-cm="${esc(id)}" aria-label="Commenti">${ICO_CM}<b>${nc}</b></button>${r.su.length||r.giu.length?`<span class="chi">${r.su.map(n=>avatar(n,18)).join('')}${r.giu.length?`<span class="no">${r.giu.map(n=>avatar(n,18)).join('')}</span>`:''}</span>`:''}</div>`}
async function reagisci(b){if(!IO){accesso();return}const bar=b.closest('.rbar'),id=bar.dataset.rid,v=+b.dataset.r;let legacy=null,g,pid;
 if(bar.dataset.leg){[g,pid]=bar.dataset.leg.split('|');legacy=PROP[g]?.[pid]?.voti||null}
 const cur=reaz(id,legacy).mio;
 try{await salva(`reazioni/${id}/${IO}`,cur===v?null:v);if(legacy&&legacy[IO])await salva(`proposte/${g}/${pid}/voti/${IO}`,null)}catch(err){toast('Non salvato: '+(err.code||err))}}
const quando=t=>{const d=new Date(t);return d.toLocaleDateString('it-IT',{day:'numeric',month:'short'})+' '+d.toTimeString().slice(0,5)};
function titoloDi(id){const x=IDX[id];if(x)return x.titolo;const p=Object.values(PROP).map(o=>o[id]).find(Boolean);if(p)return p.titolo;const e=PIANO.find(e=>rid(e)===id);return e?e.titolo:'Commenti'}
function listaCom(id){const cs=Object.entries(CM[id]||{}).map(([k,c])=>({...c,k})).sort((a,b)=>a.t-b.t);
 return cs.length?cs.map(c=>`<div class="com" style="--p:${PCOL[c.autore]||'#666'}">${avatar(c.autore,26)}<div><small><b>${esc(c.autore)}</b> · ${esc(quando(c.t))}${c.mod?' · modificato':''}</small><p>${esc(c.testo)}</p>${FB&&c.uid===FB.uid?`<span class="comact"><button class="lnk" data-editcom="${esc(id)}|${esc(c.k)}">Modifica</button><button class="lnk" data-delcom="${esc(id)}|${esc(c.k)}">Elimina</button></span>`:''}</div></div>`).join(''):'<p class="muted">Ancora nessun commento: scrivete il primo.</p>'}
function formCom(id){return IO?`<form class="cform" data-cform="${esc(id)}"><textarea name="testo" maxlength="500" rows="2" placeholder="Scrivi un commento come ${esc(IO)}…" required></textarea><button class="btn pri" type="submit">Invia</button></form>`:`<button class="btn" data-login>Scegli il tuo nome per commentare</button>`}
function commenti(id,refresh){CMID=id;const s=$('#sheet'),box=s.querySelector('.sheet');
 if(refresh){const l=box.querySelector('.coml');if(l&&l.dataset.id===id){l.innerHTML=listaCom(id);const rb=box.querySelector(`.rbar[data-rid="${CSS.escape(id)}"]`);if(rb){const pe=Object.entries(PROP).map(([g,o])=>o[id]&&[g,o[id]]).find(Boolean);rb.outerHTML=pe?rbar(id,pe[1].voti,pe[0]+'|'+id):rbar(id,null,null)}}return}
 const x=IDX[id];if(x){scheda(x);return}
 const pe=Object.entries(PROP).map(([g,o])=>o[id]&&[g,o[id]]).find(Boolean);s.classList.add('on');box.innerHTML=`<h2>${esc(titoloDi(id))}</h2>${pe?rbar(id,pe[1].voti,pe[0]+'|'+id):rbar(id,null,null)}<div class="coml" data-id="${esc(id)}">${listaCom(id)}</div>${formCom(id)}<div class="acts"><button class="btn" data-chiudi>Chiudi</button></div>`}

/* ---------- suggerimenti (data/idee.json) ---------- */
const CAT={visita:'Da vedere',esperienza:'Esperienza',cibo:'Mangiare',shopping:'Shopping',evento:'Evento',notte:'Notte',gita:'Gita',partita:'Partita della Roma'};
const CATC={visita:'#2c3e8f',esperienza:'#7b45c4',cibo:'#d9480f',shopping:'#c03a6e',evento:'#b07800',notte:'#15171c',gita:'#13808a',partita:'#8e1b1b'};
const PASTO={pranzo:'Pranzo',cena:'Cena',spuntino:'Spuntino'};
const enc=encodeURIComponent;
const scoreIdea=x=>{const r=reaz(x.id);return r.su.length-r.giu.length};
function ideeDi(data,fascia,cibo){const gia=new Set(Object.values(PROP[data]||{}).map(p=>p.idea).filter(Boolean));
 return IDEE.filter(x=>x.giorni.includes(data)&&!chiusoIl(x,data)&&!gia.has(x.id)&&(fascia==null||x.fascia===fascia)&&(cibo==null||(x.cat==='cibo')===cibo)).sort((a,b)=>scoreIdea(b)-scoreIdea(a)||(b.top?1:0)-(a.top?1:0))}
const ilink=x=>({maps:`https://www.google.com/maps/search/?api=1&query=${enc(x.q+(x.lat!=null?'':''))}`,yt:`https://www.youtube.com/results?search_query=${enc(x.q+' #shorts')}`,tt:`https://www.tiktok.com/search?q=${enc(x.q)}`,
 gyg:`https://www.getyourguide.com/s/?q=${enc(x.q)}`,via:`https://www.viator.com/searchResults/all?text=${enc(x.q)}`,ta:`https://www.tripadvisor.com/Search?q=${enc(x.q)}`});
const badge=x=>`<span class="ibadge" style="--k:${CATC[x.cat]||'#555'}">${esc(CAT[x.cat]||x.cat)}${x.pasto?' · '+esc(PASTO[x.pasto]||x.pasto):''}</span>${x.top?'<span class="itop">Consigliata</span>':''}${x.prenota?'<span class="ipren">Da prenotare</span>':''}`;
const desDi=id=>Object.entries(LST).find(([k,v])=>v.lista==='desideri'&&v.idea===id);
const giorniIdea=x=>{const G=V.giorni.map((g,i)=>[g,i]).filter(([g])=>x.giorni.includes(g.data)&&!chiusoIl(x,g.data));return G.length?`<p class="igg">${G.length>4?`${G.length} giorni a ${esc(V.giorni[G[0][1]].citta||'')}: `:''}${G.slice(0,4).map(([g,i])=>`<a href="#g${i+1}" style="--c:${col(i)}">G${i+1} · ${esc(corto(g.data))}</a>`).join('')}${G.length>4?'…':''}</p>`:''};
function ideaMini(x){return`<article class="icard" style="--k:${CATC[x.cat]||'#555'}">${ph(x.wiki,420,'','',3,x.titolo)}<div class="ibd"><div>${badge(x)}</div><h4>${esc(x.titolo)}</h4><p class="iz">${esc(x.zona)}</p>${giorniIdea(x)}${x.alt?`<p class="ialt">${esc(x.alt)}</p>`:''}
 <p class="imeta"><span>${esc(x.prezzo)}</span>${x.durata?`<span>${esc(x.durata)}</span>`:''}</p><p class="isin">${esc(x.sintesi)}</p>${rbar(x.id)}<div class="acts"><button class="btn pri" data-idea="${esc(x.id)}">Apri la scheda</button>${x.lat!=null?`<button class="btn" data-ideamap="${esc(x.id)}">Mappa</button>`:''}</div></div></article>`}
function rigaIdee(lista,lab,extra=''){return lista.length?`<div class="alt"><div class="alab">${lab} <small>${lista.length}</small>${extra}</div><div class="ascroll">${lista.map(ideaMini).join('')}</div></div>`:''}
function scheda(x,dataSel){CMID=x.id;const s=$('#sheet');s.classList.add('on');const L=ilink(x);let g0=dataSel||(filter!=null&&x.giorni.includes(V.giorni[filter].data)?V.giorni[filter].data:x.giorni[0]);if(!dataSel&&chiusoIl(x,g0))g0=x.giorni.find(d=>!chiusoIl(x,d))||g0;
 const gia=x.giorni.map(d=>Object.values(PROP[d]||{}).find(p=>p.idea===x.id)&&d).filter(Boolean);
 const v=x.lat!=null?vicina(x.lat,x.lng):null;
 s.querySelector('.sheet').innerHTML=`<div class="isheet" style="--k:${CATC[x.cat]||'#555'}">${ph(x.wiki,900,'data-credit','',3,x.titolo)}<div>${badge(x)}</div><h2>${esc(x.titolo)}</h2><p class="iz">${esc(x.zona)}${v?` · stazione ${nomeSt(v.s)}, ${v.d<.15?'lì davanti':piedi(v.d)+' min a piedi'}`:''}</p>
 <dl class="igrid"><div><dt>Orari</dt><dd>${esc(x.orari)}</dd></div><div><dt>Prezzo</dt><dd>${esc(x.prezzo)}</dd></div>${x.durata?`<div><dt>Durata</dt><dd>${esc(x.durata)}</dd></div>`:''}<div><dt>Giorni adatti</dt><dd>${x.giorni.map(d=>chiusoIl(x,d)?`<s title="${esc(chiusoIl(x,d))}">${esc(corto(d))}</s>`:esc(corto(d))).join(', ')}</dd></div></dl>
 ${x.alt?`<p class="ialt">${esc(x.alt)}</p>`:''}<p>${esc(x.sintesi)}</p>${x.consiglio?`<div class="itip"><b>Consiglio:</b> ${esc(x.consiglio)}</div>`:''}${x.prenota?`<a class="btn pri ipbtn" href="${esc(x.prenota)}" target="_blank" rel="noopener">Prenota sul sito ufficiale</a>`:''}
 <div class="ilinks"><a href="${L.maps}" target="_blank" rel="noopener">Google Maps</a>${x.sito?`<a href="${esc(x.sito)}" target="_blank" rel="noopener">Sito</a>`:''}<a href="${L.yt}" target="_blank" rel="noopener">Video brevi</a><a href="${L.tt}" target="_blank" rel="noopener">TikTok</a><a href="${L.ta}" target="_blank" rel="noopener">Recensioni</a>${x.cat!=='cibo'?`<a href="${L.gyg}" target="_blank" rel="noopener">GetYourGuide</a><a href="${L.via}" target="_blank" rel="noopener">Viator</a>`:''}${x.lat!=null?`<a href="${arrivo(x,ME)}" target="_blank" rel="noopener">Come arrivo</a>`:''}</div>
 ${x.fonti?`<p class="ifonti">Fonti: ${esc(x.fonti)}. Prezzi e orari indicativi, verificati a novembre 2026.</p>`:''}
 ${rbar(x.id)}
 <div class="iprop">${gia.length?`<p>Già proposta per ${gia.map(d=>esc(corto(d))).join(', ')}: votatela nella giornata.</p>`:''}${IO?`<label>Proponi per<select data-ideagiorno>${x.giorni.map(d=>{const i=V.giorni.findIndex(g=>g.data===d);const c=chiusoIl(x,d);return`<option value="${d}" ${d===g0?'selected':''}>${i+1} · ${esc(corto(d))}${c?' · '+esc(c):''}</option>`}).join('')}</select></label><div class="iavv" data-iavv="${esc(x.id)}">${avvisoApertura(x,g0)}</div><button class="btn pri" data-propidea="${esc(x.id)}">Proponi nel programma</button>${desDi(x.id)?'<span class="muted">Già nei desideri</span>':`<button class="btn" data-desidea="${esc(x.id)}">Salva nei desideri</button>`}`:''}</div>
 <h3 class="isec">Commenti</h3><div class="coml" data-id="${esc(x.id)}">${listaCom(x.id)}</div>${formCom(x.id)}
 <div class="acts"><button class="btn" data-chiudi>Chiudi</button></div></div>`;riempiFoto(s)}
async function proponiIdea(x,data){if(!IO){accesso();return}if(!FB){toast('Proposte non collegate: riprova tra poco');return}
 const o={autore:IO,uid:FB.uid,t:Date.now(),titolo:x.titolo.slice(0,120),luogo:x.zona.slice(0,120),nota:(x.sintesi+(x.prezzo?' Prezzo: '+x.prezzo+'.':'')).slice(0,600),fascia:x.fascia,idea:x.id,link:ilink(x).maps};
 if(x.lat!=null){o.lat=x.lat;o.lng=x.lng}
 try{await FB.Db.set(FB.Db.push(FB.ref('proposte/'+data)),o);const dz=desDi(x.id);if(dz)salva(`liste/${dz[0]}/fatto`,true).catch(()=>{});toast('Proposta pubblicata: ora si vota');$('#sheet').classList.remove('on');CMID=null}catch(err){toast('Non salvata: '+(err.code||err))}}

/* ---------- programma modificabile: sposta, togli, trascina, ottimizza ---------- */
let MOD={},LST={},SPU={},VIS={},DIA={};
const minDi=o=>{const[a,b]=(o||'00:00').split(':').map(Number);return a*60+b};
const oraDi=m=>{m=Math.max(0,Math.min(23*60+55,Math.round(m/5)*5));return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
const FISSO=e=>e.fonte==='prenotato'||['volo','treno','hotel','bus','trasferimento'].includes(e.tipo);
function conMod(e,j){const m=MOD[rid(e)];if(!m)return{...e,d:j};const d=m.data?V.giorni.findIndex(g=>g.data===m.data):-1;return{...e,ora:m.ora||e.ora,d:d>=0?d:j,orig:j,mod:m,nascosto:!!m.nascosto}}
function grezze(){return V.giorni.flatMap((g,j)=>[...g.eventi.map(e=>conMod(e,j)),...propDi(g.data).filter(p=>p.ok).map(p=>conMod({...p,ora:p.ora||(FASCE.find(f=>f[0]===p.fascia)||FASCE[0])[2],fonte:'gruppo',tipo:'attivita',id:p.id},j))])}
function nascoste(i){return grezze().filter(e=>e.nascosto&&e.orig===i)}
function modifica(e){if(!IO){accesso();return}CMID=null;const s=$('#sheet');s.classList.add('on');const k=rid(e);
 s.querySelector('.sheet').innerHTML=`<form id="mform" data-rid="${esc(k)}" data-ora0="${esc(e.ora||'')}"><h2>Sposta o togli</h2><p class="lead">${esc(e.titolo)}</p>
 <div class="row2b"><label>Giorno<select name="data">${V.giorni.map((g,i)=>`<option value="${g.data}" ${i===e.d?'selected':''}>${i+1} · ${esc(corto(g.data))} · ${esc(g.titolo)}</option>`).join('')}</select></label>
 <label>Ora<input type="time" name="ora" value="${esc(e.ora||'')}" step="300" required></label></div>
 ${FISSO(e)?'<p class="itip">È una prenotazione o uno spostamento già fissato: cambiate l\'orario solo se è cambiato davvero.</p>':''}
 <div class="acts"><button class="btn pri" type="submit">Salva per tutti</button>${e.mod?'<button class="btn" type="button" data-modreset>Torna come prima</button>':''}<button class="btn" type="button" data-modtogli>Togli dal programma</button><button class="btn" type="button" data-chiudi>Annulla</button></div>
 <p class="muted" style="font-size:12.5px">La modifica vale per tutti i viaggiatori. Le tappe tolte restano in fondo alla giornata e si rimettono con un tocco.</p></form>`}
async function salvaMod(k,o){try{await salva('modifiche/'+k,o?{...o,autore:IO,t:Date.now()}:null);toast(o?(o.nascosto?'Tappa tolta dal programma':'Programma aggiornato'):'Tappa rimessa come prima')}catch(err){toast('Non salvato: '+(err.code||err))}}
/* trascinamento dentro la giornata: si prende la maniglia e si lascia tra due tappe */
let DR=null;
function initDrag(){const v=$('#view');
 v.addEventListener('pointerdown',e=>{const h=e.target.closest('.drag');if(!h||!IO)return;const card=h.closest('.stop');if(!card)return;e.preventDefault();
  const list=[...v.querySelectorAll('.stop[data-rid]')].filter(c=>c.dataset.day===card.dataset.day);const t0=card.getBoundingClientRect().top;v.classList.add('dragmode');const t1=card.getBoundingClientRect().top;$('#side').scrollTop+=t1-t0;window.scrollBy(0,t1-t0);
  DR={card,list,y0:card.getBoundingClientRect().top+15,pid:e.pointerId};card.classList.add('dragging');h.setPointerCapture(e.pointerId);
  DR.auto=setInterval(()=>{if(!DR||DR.y==null)return;const g=DR.y<90?-12:DR.y>innerHeight-110?12:0;if(g){$('#side').scrollBy(0,g);window.scrollBy(0,g)}},30)});
 v.addEventListener('pointermove',e=>{if(!DR)return;DR.y=e.clientY;const dy=e.clientY-DR.card.getBoundingClientRect().top+(parseFloat((DR.card.style.transform.match(/-?[\d.]+/)||[0])[0])||0)-15;DR.card.style.transform=`translateY(${dy}px)`;const y=e.clientY;
  DR.list.forEach(c=>c.classList.remove('drop-before','drop-after'));const altri=DR.list.filter(c=>c!==DR.card);let dopo=null;
  for(const c of altri){const r=c.getBoundingClientRect();if(y<r.top+r.height/2){dopo=c;break}}DR.target=dopo;if(dopo)dopo.classList.add('drop-before');else if(altri.length)altri.at(-1).classList.add('drop-after')});
 const fine=async()=>{if(!DR)return;const{card,list,target}=DR;clearInterval(DR.auto);DR=null;v.classList.remove('dragmode');card.style.transform='';card.classList.remove('dragging');list.forEach(c=>c.classList.remove('drop-before','drop-after'));
  const altri=list.filter(c=>c!==card),idx=target?altri.indexOf(target):altri.length,prima=altri[idx-1],dopo=altri[idx];
  const vecchio=list.indexOf(card),nuovo=target?list.indexOf(target)-(list.indexOf(target)>vecchio?1:0):list.length-1;if(nuovo===vecchio)return;
  const a=prima?minDi(prima.dataset.ora):null,b=dopo?minDi(dopo.dataset.ora):null;let m=a!=null&&b!=null?(a+b)/2:a!=null?a+60:b-60;
  if(a!=null&&b!=null&&b-a<10)m=a+5;const ora=oraDi(m);await salvaMod(card.dataset.rid,{ora})};
 v.addEventListener('pointerup',fine);v.addEventListener('pointercancel',fine)}
/* ordine con meno strada: permuta le tappe libere e rimette gli orari nello stesso ordine */
function ottimizza(i){const T=tappe(i),lib=T.filter(e=>e.lat!=null&&!FISSO(e));if(lib.length<3){toast('Servono almeno 3 tappe libere con la posizione');return}
 const idx0=T.indexOf(lib[0]),idxN=T.indexOf(lib.at(-1));let start=null;for(let k=idx0-1;k>=0;k--)if(T[k].lat!=null){start=T[k];break}
 if(!start){const h=hotelPrima(i-1,'99');if(h)start=h}let end=null;for(let k=idxN+1;k<T.length;k++)if(T[k].lat!=null){end=T[k];break}
 const D=(a,b)=>km(a.lat,a.lng,b.lat,b.lng),costo=o=>{let s=0,p=start;o.forEach(e=>{if(p)s+=D(p,e);p=e});if(end)s+=D(p,end);return s};
 let best=lib.slice(),bc=costo(best);const c0=bc;
 if(lib.length<=8){const perm=(arr,l=0)=>{if(l===arr.length){const c=costo(arr);if(c<bc-1e-9){bc=c;best=arr.slice()}return}for(let k=l;k<arr.length;k++){[arr[l],arr[k]]=[arr[k],arr[l]];perm(arr,l+1);[arr[l],arr[k]]=[arr[k],arr[l]]}};perm(lib.slice())}
 if(bc>=c0-.05){toast('L\'ordine attuale è già quello con meno strada');return}
 const ore=lib.map(e=>e.ora).sort(),nuovo=best.map((e,k)=>({e,ora:ore[k]}));CMID=null;const s=$('#sheet');s.classList.add('on');
 s.querySelector('.sheet').innerHTML=`<h2>Ordine con meno strada</h2><p class="lead">Giorno ${i+1}: ${c0.toFixed(1)} km in linea d'aria tra le tappe libere, con questo ordine ${bc.toFixed(1)} km. Gli orari restano gli stessi, cambia chi va prima.</p>
 <ol class="olist">${nuovo.map(x=>`<li><b>${esc(x.ora)}</b> ${esc(x.e.titolo)}${x.e.ora!==x.ora?` <small>(era alle ${esc(x.e.ora)})</small>`:''}</li>`).join('')}</ol>
 <p class="muted" style="font-size:12.5px">Prenotazioni, treni e alberghi non si muovono. Controllate gli orari di apertura prima di applicare.</p>
 <div class="acts"><button class="btn pri" data-ottapplica="${i}">Applica per tutti</button><button class="btn" data-chiudi>Annulla</button></div>`;ottimizza.nuovo=nuovo}

/* ---------- liste condivise ---------- */
let PT=store.get('bij:ptab','tabellone');
const LISTE=[['tabellone','Tabellone'],['idee','Suggerimenti'],['posti','Posti segnalati'],['desideri','Desideri'],['prenotare','Biglietti'],['prima','Prima di partire'],['valigia','Valigia']];
const voci=l=>Object.entries(LST).filter(([k,v])=>v.lista===l).map(([k,v])=>({...v,k})).sort((a,b)=>(a.fatto?1:0)-(b.fatto?1:0)||(a.t-b.t));
const chiSel=(k,chi)=>`<select class="chi-sel" data-chi="${esc(k)}" aria-label="Chi se ne occupa"><option value="">Chi?</option>${V.viaggio.viaggiatori.map(n=>`<option ${n===chi?'selected':''}>${esc(n)}</option>`).join('')}</select>`;
function rigaCheck({k,testo,nota,link,fatto,chi,autore,man,extra=''}){return`<li class="lv ${fatto?'ok':''}"><label class="lchk"><input type="checkbox" data-${man?'lfatto':'sfatto'}="${esc(k)}" ${fatto?'checked':''}><span><b>${esc(testo)}</b>${nota?`<small>${esc(nota)}</small>`:''}</span></label>
 <div class="lrow">${chiSel((man?'L|':'S|')+k,chi)}${link?`<a class="btn sm pri" href="${esc(link)}" target="_blank" rel="noopener">${/^tel:/.test(link)?'Chiama':'Prenota sul sito'}</a>`:''}${extra}${man&&autore?`<span class="lby">${avatar(autore,18)}</span><button class="lnk" data-ldel="${esc(k)}">Togli</button>`:''}</div></li>`}
function formLista(l,ph){return IO?`<form class="lform" data-lform="${l}"><input name="testo" maxlength="160" placeholder="${esc(ph)}" required><input name="link" type="url" placeholder="Link (facoltativo)"><button class="btn pri" type="submit">Aggiungi</button></form>`:'<button class="btn" data-login>Scegli il tuo nome per aggiungere</button>'}
/* biglietti e prenotazioni: lista che si aggiorna da sola dal programma, dalle proposte e dai desideri */
const piuGiorni=(iso,n)=>{const d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
function biglietti(){const out=[],visti=new Set(),di=d=>V.giorni.findIndex(g=>g.data===d);
 (V.daPrenotare||[]).forEach(x=>{let r=null,ora='';if(x.data&&x.tappa){const i=di(x.data),e=i>=0&&tappe(i).find(e=>e.titolo.includes(x.tappa));if(e){r=rid(e);ora=e.ora||''}}
  out.push({k:'pr-'+x.id,testo:x.testo,nota:x.nota,link:x.link,data:x.data||null,ora,entro:x.entro||null,prezzo:x.prezzo||'',rid:r,fonte:'programma'})});
 V.giorni.forEach(g=>Object.entries(PROP[g.data]||{}).forEach(([id,p])=>{const x=p.idea&&IDX[p.idea];if(!x||!x.prenota||visti.has(x.id+g.data))return;visti.add(x.id+g.data);
  out.push({k:'pp-'+id,testo:x.titolo,nota:x.consiglio||'',link:x.prenota,data:g.data,ora:p.ora||'',entro:piuGiorni(g.data,-7),prezzo:x.prezzo||'',rid:id,fonte:p.ok?'programma':'proposta',autore:p.autore})}));
 Object.entries(LST).filter(([k,v])=>v.lista==='desideri'&&v.idea&&IDX[v.idea]?.prenota).forEach(([k,v])=>{const x=IDX[v.idea];out.push({k:'pd-'+k,testo:x.titolo,nota:'Nei desideri di '+v.autore+'. '+(x.consiglio||''),link:x.prenota,data:null,entro:null,prezzo:x.prezzo||'',fonte:'desiderio'})});
 return out.map(o=>{const S=SPU[o.k]||{};return{...o,stato:S.stato||(S.fatto?'fatto':'fare'),chi:S.chi||'',codice:S.codice||''}})}
const daPrenotare=biglietti;
const BST={fare:'Da fare',fatto:'Prenotato',pagato:'Pagato',no:'Non serve'};
function urgenza(o){if(o.stato!=='fare'||o.fonte!=='programma')return 9999;if(!o.entro)return 999;return diff(adesso(V.viaggio.fuso).data,o.entro)}
function bigliettoDi(r){return r&&biglietti().find(o=>o.rid===r&&o.fonte==='programma')}
const bollino=o=>o?`<span class="bgb ${o.stato}">${o.stato==='fare'?'da prenotare':o.stato==='no'?'non serve':BST[o.stato].charAt(0).toUpperCase()+BST[o.stato].slice(1).toLowerCase()}</span>`:'';
function rigaBiglietto(o){const g=o.data?di0(o.data):-1,u=urgenza(o),scad=o.stato==='fare'&&o.fonte==='programma'?(o.entro?(u<0?`<b class="neg">scaduta da ${-u} gg</b>`:u<=7?`<b class="neg">entro ${esc(corto(o.entro))} · tra ${u} gg</b>`:`entro ${esc(corto(o.entro))}`):'il prima possibile'):'';
 return`<li class="lv bg st-${o.stato}" id="b-${esc(o.k)}"><div class="bgh"><b>${esc(o.testo)}</b>${o.fonte!=='programma'?`<span class="bgf">${o.fonte==='proposta'?'proposta di '+esc(o.autore||''):'desiderio'} · da valutare</span>`:''}</div>
 <small class="bgm">${g>=0?`<a href="#g${g+1}" style="color:${col(g)}">G${g+1} · ${esc(corto(o.data))}${o.ora?', '+esc(o.ora):''}</a>`:''}${o.prezzo?`<span>${esc(o.prezzo)}</span>`:''}${scad?`<span>${scad}</span>`:''}</small>${o.nota?`<small>${esc(o.nota)}</small>`:''}
 <div class="seg3" role="group" aria-label="Stato">${['fare','fatto','pagato'].map(k=>`<button data-bst="${esc(o.k)}|${k}" aria-pressed="${o.stato===k}">${BST[k]}</button>`).join('')}</div>
 ${o.stato==='fatto'||o.stato==='pagato'?`<input class="bcod" data-bcod="${esc(o.k)}" value="${esc(o.codice)}" maxlength="300" placeholder="Codice o link della conferma">`:''}
 <div class="lrow">${chiSel('S|'+o.k,o.chi)}${o.link?`<a class="btn sm pri" href="${esc(o.link)}" target="_blank" rel="noopener">${/^tel:/.test(o.link)?'Chiama':'Prenota sul sito'}</a>`:''}<button class="lnk" data-bst="${esc(o.k)}|${o.stato==='no'?'fare':'no'}">${o.stato==='no'?'Rimetti':'Non serve'}</button></div></li>`}
const di0=d=>V.giorni.findIndex(g=>g.data===d);
function vBiglietti(){const B=biglietti(),M=voci('prenotare'),solo=store.get('bij:bmie',false)&&IO;
 const L=B.filter(o=>!solo||o.chi===IO),aperte=L.filter(o=>o.stato==='fare'&&o.fonte==='programma'),urg=aperte.filter(o=>urgenza(o)<=7);
 const ord=(a,b)=>urgenza(a)-urgenza(b)||(a.data||'9').localeCompare(b.data||'9');
 const A=L.filter(o=>o.stato==='fare'&&o.fonte==='programma').sort(ord),V2=L.filter(o=>o.stato==='fare'&&o.fonte!=='programma'),F=L.filter(o=>o.stato==='fatto'||o.stato==='pagato').sort(ord),N=L.filter(o=>o.stato==='no');
 return`<p class="lead">Si aggiorna da sola: quando il gruppo mette nel programma qualcosa che va prenotato, il biglietto compare qui; se lo togliete, sparisce. Per ognuno: entro quando, chi se ne occupa, e lo stato da fare → prenotato → pagato.</p>
 <div class="cassa-top"><div class="${aperte.length?'neg':'pos'}"><small>Da prenotare</small><b>${aperte.length}</b></div><div class="${urg.length?'neg':''}"><small>In scadenza (7 giorni)</small><b>${urg.length}</b></div></div>
 ${IO?`<label class="lchk" style="margin:4px 0 8px"><input type="checkbox" data-bmie ${solo?'checked':''}> <span>Solo quelli di ${esc(IO)}</span></label>`:''}
 <ul class="lvlist">${A.map(rigaBiglietto).join('')}</ul>
 ${V2.length?`<h3 class="sec">Da valutare</h3><p class="muted">Suggerimenti proposti o nei desideri che richiedono un biglietto: diventano "da fare" quando entrano nel programma.</p><ul class="lvlist">${V2.map(rigaBiglietto).join('')}</ul>`:''}
 <h3 class="sec">Aggiunti a mano</h3><ul class="lvlist">${M.map(v=>rigaCheck({...v,man:true})).join('')}</ul>${formLista('prenotare','Altra cosa da prenotare')}
 ${F.length?`<details class="tolte" open><summary>${F.length} già prenotati o pagati</summary><ul class="lvlist">${F.map(rigaBiglietto).join('')}</ul></details>`:''}
 ${N.length?`<details class="tolte"><summary>${N.length} segnati "non serve"</summary><ul class="lvlist">${N.map(rigaBiglietto).join('')}</ul></details>`:''}`}
/* posti segnalati: ristoranti e locali senza giorno; l'app dice quando ci stanno bene */
function giorniVicini(v){if(v.lat==null)return[];return V.giorni.map((g,i)=>{if(g.zona==='Roma')return null;const T=tappe(i).filter(e=>e.lat!=null);if(!T.length)return null;
 const d=Math.min(...T.map(e=>km(v.lat,v.lng,e.lat,e.lng)));return{i,g,d}}).filter(x=>x&&x.d<=2.5).sort((a,b)=>a.d-b.d)}
const distTxt=d=>d<1?Math.round(d*10)*100+' m':d.toFixed(1).replace('.',',')+' km';
function vPosti(){const L=voci('posti');
 return`<p class="lead">Ristoranti e locali consigliati da amici, video o recensioni, senza ancora un giorno. Incollate il link e due righe: l'app trova il posto e vi dice in quali giornate siete lì vicino. Da qui si propone con un tocco.</p>
 ${IO?`<form class="pform" data-pform><input name="testo" maxlength="160" placeholder="Nome del posto (es. Uobei Shibuya)" required><input name="dove" maxlength="80" placeholder="Zona o città (es. Shibuya, Tokyo)"><input name="link" type="url" placeholder="Link Google Maps, Instagram o TikTok (facoltativo)"><textarea name="nota" maxlength="600" rows="2" placeholder="Perché: cosa si mangia, quanto si spende, chi lo consiglia"></textarea><button class="btn pri" type="submit">Segnala il posto</button></form>`:'<button class="btn" data-login>Scegli il tuo nome per segnalare un posto</button>'}
 <ul class="lvlist">${L.map(v=>{const G=giorniVicini(v),best=G[0]?G[0].g.data:V.giorni[1].data;
  return`<li class="lv posto ${v.fatto?'ok':''}"><div class="bgh"><b>${esc(v.testo)}</b><span class="lby">${avatar(v.autore,18)} ${esc(v.autore)}</span></div>${v.nota?`<small>${esc(v.nota)}</small>`:''}
  ${v.lat==null?`<small class="neg">Posizione non trovata: <button class="lnk" data-pfix="${esc(v.k)}">cerca con un altro nome</button></small>`:G.length?`<div class="igg">${G.slice(0,4).map(x=>`<a href="#g${x.i+1}" style="--c:${col(x.i)}">G${x.i+1} · ${esc(corto(x.g.data))} · ${distTxt(x.d)}</a>`).join('')}</div>`:'<small>Lontano dalle tappe in programma: va messo in una giornata apposta.</small>'}
  ${v.fatto?`<small>${ico('check',14)} Già proposto</small>`:''}
  <div class="lrow">${v.link?`<a class="btn sm" href="${esc(v.link)}" target="_blank" rel="noopener">Apri il link</a>`:''}${v.lat!=null?`<a class="btn sm" href="https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng}" target="_blank" rel="noopener">Mappa</a>`:''}
  ${IO?`<select data-pgiorno="${esc(v.k)}" aria-label="Giorno">${V.giorni.map((g,i)=>g.zona==='Roma'?'':`<option value="${g.data}" ${g.data===best?'selected':''}>G${i+1} · ${esc(corto(g.data))}</option>`).join('')}</select><select data-pfascia="${esc(v.k)}" aria-label="Momento">${FASCE.map(([k,n])=>`<option value="${k}" ${k==='sera'?'selected':''}>${n}</option>`).join('')}</select><button class="btn sm pri" data-pprop="${esc(v.k)}">Proponi</button>`:''}
  ${FB&&v.uid===FB.uid?`<button class="lnk" data-ldel="${esc(v.k)}">Togli</button>`:''}</div></li>`}).join('')||'<li class="muted">Ancora nessun posto: segnalate il primo.</li>'}</ul>`}
function coordDaLink(l){const m=(l||'').match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)||(l||'').match(/[?&](?:q|query|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);return m?{lat:+m[1],lng:+m[2]}:null}
async function trovaPosto(q){try{const r=await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lat=35.68&lon=139.76`);const j=await r.json();const f=j.features.find(f=>(f.properties.country||'').match(/Japan|日本|Giappone/))||null;return f?{lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0]}:null}catch(e){return null}}
async function proponiPosto(k,data,fascia){const v=LST[k];if(!v||!IO||!FB)return;const o={autore:IO,uid:FB.uid,t:Date.now(),titolo:v.testo.slice(0,120),luogo:v.testo.slice(0,120),nota:((v.nota||'')+` (segnalato da ${v.autore})`).slice(0,600),fascia};
 if(v.link)o.link=v.link;if(v.lat!=null){o.lat=v.lat;o.lng=v.lng}
 try{await FB.Db.set(FB.Db.push(FB.ref('proposte/'+data)),o);await salva(`liste/${k}/fatto`,true);toast('Proposta pubblicata per il '+corto(data))}catch(err){toast('Non salvata: '+(err.code||err))}}
let IF=store.get('bij:if',{cat:'',g:'',n:24});
function vCatalogo(){const L=IDEE.filter(x=>(!IF.cat||x.cat===IF.cat)&&(IF.g===''||x.giorni.includes(V.giorni[+IF.g]?.data))).sort((a,b)=>scoreIdea(b)-scoreIdea(a)||(b.top?1:0)-(a.top?1:0));
 const cats=[...new Set(IDEE.map(x=>x.cat))];
 return`<p class="lead">Tutti i ${IDEE.length} suggerimenti presi da guide, recensioni e tour, ognuno con la sua scheda. Sotto ogni scheda trovate i giorni in cui ci sta bene: toccate il giorno per vederlo nel programma, o aprite la scheda per proporlo al gruppo.</p>
 <div class="ifilt"><select data-if="g" aria-label="Giorno"><option value="">Tutti i giorni</option>${V.giorni.map((g,i)=>`<option value="${i}" ${String(IF.g)===String(i)?'selected':''}>G${i+1} · ${esc(corto(g.data))} · ${esc(g.citta||'')}</option>`).join('')}</select></div>
 <div class="cats" role="group" aria-label="Tipo">${[['','Tutti'],...cats.map(c=>[c,CAT[c]||c])].map(([k,n])=>`<button class="chipc" data-ifcat="${k}" aria-pressed="${IF.cat===k}">${esc(n)}</button>`).join('')}</div>
 <p class="muted">${L.length} ${L.length===1?'suggerimento':'suggerimenti'}</p><div class="igrid">${L.slice(0,IF.n).map(ideaMini).join('')}</div>${L.length>IF.n?`<button class="btn big" data-ifpiu>Mostra altri ${Math.min(24,L.length-IF.n)}</button>`:''}`}
function vListe(){const tabs=`<div class="ptabs" role="tablist">${LISTE.map(([k,n])=>`<button role="tab" aria-selected="${PT===k}" data-ptab="${k}">${n}${k==='desideri'&&voci('desideri').length?` <small>${voci('desideri').length}</small>`:''}${k==='prenotare'?(n=>n?` <small class="bgn">${n}</small>`:'')(biglietti().filter(o=>o.stato==='fare'&&o.fonte==='programma').length):''}</button>`).join('')}</div>`;
 if(PT==='idee')return tabs+vCatalogo();
 if(PT==='posti')return tabs+vPosti();
 if(PT==='desideri'){const L=voci('desideri');return tabs+`<p class="lead">Cose da fare "prima o poi", senza ancora un giorno. Votatele e, quando c'è posto, mettetele in una giornata.</p>${formLista('desideri','Es. vedere una partita di baseball, provare il fugu…')}
  <ul class="lvlist">${L.length?L.map(v=>{const x=v.idea&&IDX[v.idea];return`<li class="lv des ${v.fatto?'ok':''}" style="--p:${PCOL[v.autore]||'#666'}">${x?ph(x.wiki,300,'class="lph"','',3,x.titolo):''}<div class="ldes"><b>${esc(v.testo)}</b>${v.nota?`<small>${esc(v.nota)}</small>`:''}<span class="lby">${avatar(v.autore,18)} ${esc(v.autore)}${v.fatto?' · già messo in un giorno':''}</span>${rbar(v.k)}
   <div class="acts">${x?`<button class="btn sm" data-idea="${esc(x.id)}">Scheda</button>`:''}${v.link?`<a class="btn sm" href="${esc(v.link)}" target="_blank" rel="noopener">Link</a>`:''}<button class="btn sm pri" data-lgiorno="${esc(v.k)}">Mettilo in un giorno</button><button class="lnk" data-ldel="${esc(v.k)}">Togli</button></div></div></li>`}).join(''):'<li class="muted">Ancora vuota. Dalle schede dei suggerimenti c\'è il tasto «Salva nei desideri».</li>'}</ul>`}
 if(PT==='prenotare')return tabs+vBiglietti();
 if(PT==='prima'){const M=voci('prima');return tabs+`<p class="lead">Le cose da sistemare prima del 26 dicembre: le spunte sono condivise.</p><ul class="lvlist">${V.prepartenza.map((t,i)=>rigaCheck({k:'pre-'+i,testo:t,fatto:!!SPU['pre-'+i]?.fatto,chi:SPU['pre-'+i]?.chi||''})).join('')}${M.map(v=>rigaCheck({...v,man:true})).join('')}</ul>${formLista('prima','Altra cosa da fare prima di partire')}`}
 if(PT==='valigia'){const M=voci('valigia');return tabs+`<p class="lead">La valigia è personale: queste spunte restano su questo telefono. In fondo, le cose che serve portare per tutto il gruppo.</p>${V.bagaglio.map((b,j)=>`<h3 class="isec">${esc(b.gruppo)}</h3>${lista('bag'+j,b.voci)}`).join('')}
  <h3 class="isec">Per tutto il gruppo</h3><ul class="lvlist">${M.map(v=>rigaCheck({...v,man:true})).join('')||'<li class="muted">Es. una ciabatta multipresa, un mazzo di carte, il cavo HDMI.</li>'}</ul>${formLista('valigia','Cosa porta qualcuno per tutti')}`}
 return tabs}

/* ---------- diario e tappe visitate ---------- */
const visti=e=>Object.keys(VIS[rid(e)]||{});
const fotoDiretta=u=>/\.(jpe?g|png|webp|gif)(\?|$)/i.test(u)||/googleusercontent\.com\//.test(u);
function diarioGiorno(g,i){const P=Object.entries(DIA).map(([k,v])=>({...v,k})).filter(v=>v.data===g.data).sort((a,b)=>a.t-b.t),A=V.viaggio.album;
 return`<h2 class="sec" id="diario">Diario del giorno</h2><div class="diario">${A?`<a class="album" href="${esc(A)}" target="_blank" rel="noopener"><span class="aic">${ico('foto',20)}</span><span><b>Album condiviso su Google Foto</b><small>Caricate lì le foto: qui scrivete com'è andata e collegate le più belle</small></span></a>`:''}
 ${P.map(v=>{const e=v.rid&&PIANO.find(x=>rid(x)===v.rid);return`<article class="dpost" style="--p:${PCOL[v.autore]||'#666'}">${avatar(v.autore,28)}<div><small><b>${esc(v.autore)}</b> · ${esc(quando(v.t))}${e?` · ${esc(e.titolo)}`:''}</small><p>${esc(v.testo)}</p>${v.foto?(fotoDiretta(v.foto)?`<a href="${esc(v.foto)}" target="_blank" rel="noopener"><img class="dimg" src="${esc(v.foto)}" alt="Foto di ${esc(v.autore)}" loading="lazy"></a>`:`<a class="btn sm" href="${esc(v.foto)}" target="_blank" rel="noopener">Apri la foto</a>`):''}${FB&&v.uid===FB.uid?`<button class="lnk" data-ddel="${esc(v.k)}">Elimina</button>`:''}</div></article>`}).join('')}
 ${IO?`<form class="dform" data-dform="${g.data}"><textarea name="testo" maxlength="1000" rows="2" placeholder="Com'è andata oggi, ${esc(IO)}?" required></textarea><div class="row2b"><label>Tappa<select name="rid"><option value="">Tutta la giornata</option>${PIANO.filter(e=>e.d===i).map(e=>`<option value="${esc(rid(e))}">${esc(e.ora||'')} ${esc(e.titolo)}</option>`).join('')}</select></label><label>Link a una foto<input name="foto" type="url" placeholder="Condividi da Google Foto e incolla"></label></div><button class="btn pri" type="submit">Pubblica nel diario</button></form>`:'<button class="btn" data-login>Scegli il tuo nome per scrivere nel diario</button>'}</div>`}

/* ---------- cassa comune (i conti sono in spese.js) ---------- */
let SPE={},CAMBIO=null,ST_T=store.get('bij:sptab','spese'),VVIS=store.get('bij:vvis','EUR');
/* icone a linea, un solo set (stile lucide, tratto 1.5) */
const IP={cibo:'<path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M17 21V3c-2 1-3 3.5-3 7h3"/>',
 treno:'<rect x="5" y="3" width="14" height="13" rx="3"/><path d="M5 10h14M9 20l-2 2M15 20l2 2M9 16v1M15 16v1"/>',
 letto:'<path d="M3 19V6M3 12h18v7M21 19v-4a3 3 0 0 0-3-3h-8v7"/><circle cx="7" cy="9" r="2"/>',
 biglietto:'<path d="M3 8a2 2 0 0 0 0 4v4a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-4a2 2 0 0 1 0-4V5a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z"/><path d="M14 4v13" stroke-dasharray="2 2"/>',
 borsa:'<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
 punto:'<circle cx="12" cy="12" r="3"/>',
 torii:'<path d="M3 5c5 1 13 1 18 0M5 9h14M7 6v15M17 6v15M12 9V6"/>',
 stella:'<path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6-4.5-4.1 6-.7z"/>',
 calendario:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 luna:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
 pallone:'<circle cx="12" cy="12" r="9"/><path d="m12 7 4 3-1.5 4.5h-5L8 10zM12 7V3M16 10l4-1M14.5 14.5l2 4M9.5 14.5l-2 4M8 10 4 9"/>',
 scambio:'<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
 foto:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
 check:'<path d="m5 12 5 5 9-10"/>',
 su:'<path d="M7 10v11M7 10l4-7a2 2 0 0 1 3 2l-1 5h6a2 2 0 0 1 2 2.3l-1.3 7A2 2 0 0 1 17.7 21H7"/>'};
const ico=(k,s=16)=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IP[k]||IP.punto}</svg>`;
const CATS=[['cibo',ico('cibo'),'Cibo'],['trasporti',ico('treno'),'Trasporti'],['alloggio',ico('letto'),'Alloggio'],['attivita',ico('biglietto'),'Attività'],['shopping',ico('borsa'),'Shopping'],['altro',ico('punto'),'Altro']];
const catDi=k=>CATS.find(c=>c[0]===k)||CATS[5];
const cambioOra=()=>CAMBIO&&CAMBIO.valore||store.get('bij:cambio',null)?.valore||160;
const eur=n=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(n);
const yen=n=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'JPY',currencyDisplay:'narrowSymbol',maximumFractionDigits:0}).format(n);
const vis=e=>VVIS==='EUR'?eur(e):yen(e*cambioOra());
const doppio=e=>VVIS==='EUR'?`${eur(e)} <small>${yen(e*cambioOra())}</small>`:`${yen(e*cambioOra())} <small>${eur(e)}</small>`;
const speseL=()=>Object.entries(SPE).map(([k,v])=>({...v,k})).sort((a,b)=>(b.data||'').localeCompare(a.data||'')||b.t-a.t);
async function aggiornaCambio(forza){const c=CAMBIO||store.get('bij:cambio',null);if(!forza&&c&&Date.now()-c.t<864e5)return;
 for(const u of['https://api.frankfurter.dev/v1/latest?base=EUR&symbols=JPY','https://api.frankfurter.app/latest?from=EUR&to=JPY']){try{const r=await fetch(u);if(!r.ok)continue;const j=await r.json(),v=j.rates&&j.rates.JPY;if(!v)continue;
  const o={valore:Math.round(v*100)/100,t:Date.now(),fonte:'BCE '+(j.date||'')};store.set('bij:cambio',o);if(FB&&IO){o.autore=IO;salva('cassa/cambio',o).catch(()=>{})}else{CAMBIO=o}if(location.hash==='#spese')renderView();if(forza)toast(`Cambio aggiornato: 1 € = ¥${o.valore}`);return}catch(e){}}
 if(forza)toast('Cambio non raggiungibile: potete scriverlo a mano')}
function vSpese(){const P=V.viaggio.viaggiatori,L=speseL(),cb=cambioOra(),R=CASSA.saldi(L,P,cb),T=CASSA.pareggia(R.saldo),io=IO&&R.saldo[IO]!=null?R.saldo[IO]:null;
 const tabs=`<div class="ptabs" role="tablist">${[['spese','Spese'],['saldi','Chi deve a chi'],['riepilogo','Riepilogo']].map(([k,n])=>`<button role="tab" aria-selected="${ST_T===k}" data-sptab="${k}">${n}${k==='saldi'&&T.length?` <small>${T.length}</small>`:''}</button>`).join('')}</div>`;
 const testa=`<div class="cassa-top"><div><small>Speso dal gruppo</small><b>${doppio(R.totale)}</b></div>${io!=null?`<div class="${io>0.009?'pos':io<-0.009?'neg':''}"><small>${io>0.009?'Devi ricevere':io<-0.009?'Devi dare':'Sei in pari'}</small><b>${io>0.009||io<-0.009?doppio(Math.abs(io)):'—'}</b></div>`:''}</div>
  <div class="cambio"><span>1 € = <b>¥${cb.toLocaleString('it-IT')}</b> <small>${esc((CAMBIO||store.get('bij:cambio',{})||{}).fonte||'valore indicativo')}</small></span><button class="lnk2" data-cambio="agg">Aggiorna</button><button class="lnk2" data-cambio="man">Scrivi</button><span class="vvis"><button aria-pressed="${VVIS==='EUR'}" data-vvis="EUR">€</button><button aria-pressed="${VVIS==='JPY'}" data-vvis="JPY">¥</button></span></div>
  <button class="btn pri big" data-spesa="nuova">+ Aggiungi una spesa</button>`;
 let corpo='';
 if(ST_T==='spese'){const G={};L.forEach(s=>(G[s.data||'']=G[s.data||'']||[]).push(s));
  corpo=L.length?Object.entries(G).map(([d,ss])=>`<h3 class="isec">${d?esc(fmt(d,{weekday:'short',day:'numeric',month:'short'})):'Senza data'}</h3>${ss.map(s=>{const e=CASSA.inEuro(s,cb),q=CASSA.quote(s),f=e/s.importo,mia=IO&&q[IO]!=null?q[IO]*f:0,c=catDi(s.cat);
   return`<button class="spesa ${s.modo==='rimborso'?'rimb':''}" data-spesa="${esc(s.k)}"><span class="sic">${s.modo==='rimborso'?ico('scambio',18):c[1]}</span><span class="stx"><b>${esc(s.titolo)}</b><small>${s.modo==='rimborso'?`${esc(s.paga)} ha dato a ${esc(Object.keys(s.per)[0])}`:`pagato da ${esc(s.paga)} · ${Object.keys(q).length===P.length?'tutti':Object.keys(q).map(esc).join(', ')}`}</small></span>
    <span class="simp"><b>${s.valuta==='EUR'?eur(s.importo):yen(s.importo)}</b>${s.modo!=='rimborso'&&IO?(s.paga===IO?`<small class="pos">ricevi ${vis(e-mia)}</small>`:mia?`<small class="neg">la tua parte ${vis(mia)}</small>`:'<small>non ti riguarda</small>'):''}</span></button>`}).join('')}`).join(''):`<p class="muted">Nessuna spesa ancora. Segnate qui ogni conto pagato da uno per altri: la cassa calcola chi deve cosa, anche tra euro e yen.</p>`}
 else if(ST_T==='saldi'){const mx=Math.max(1,...P.map(p=>Math.abs(R.saldo[p]||0)));
  corpo=`<h3 class="isec">Il modo più veloce per pareggiare</h3>${T.length?`<ul class="lvlist">${T.map(t=>`<li class="lv trasf"><span>${avatar(t.da,26)} <b>${esc(t.da)}</b> dà a ${avatar(t.a,26)} <b>${esc(t.a)}</b></span><span class="tam">${doppio(t.eur)}</span>${IO?`<button class="btn sm" data-salda="${esc(t.da)}|${esc(t.a)}|${t.eur}">Fatto</button>`:''}</li>`).join('')}</ul><p class="muted" style="font-size:12.5px">${T.length} ${T.length===1?'trasferimento':'trasferimenti'} al posto di uno per ogni spesa. «Fatto» registra il rimborso e aggiorna i saldi.</p>`:'<p class="muted">Tutti in pari</p>'}
  <h3 class="isec">Saldi</h3><div class="saldi">${P.map(p=>{const v=R.saldo[p]||0;return`<div class="sal"><span>${avatar(p,24)} ${esc(p)}</span><span class="bar"><i class="${v>=0?'pos':'neg'}" style="width:${Math.abs(v)/mx*50}%;${v>=0?'left:50%':'right:50%'}"></i></span><b class="${v>0.009?'pos':v<-0.009?'neg':''}">${v>0.009?'+':''}${vis(v)}</b></div>`}).join('')}</div>
  <p class="muted" style="font-size:12.5px">Positivo: deve ricevere. Ogni spesa in yen è convertita al cambio del giorno in cui è stata inserita.</p>`}
 else{const mx=Math.max(1,...Object.values(R.cat));
  corpo=`<h3 class="isec">Per categoria</h3><div class="ribar">${CATS.filter(c=>R.cat[c[0]]).map(c=>`<div><span>${c[1]} ${c[2]}</span><span class="bar"><i style="width:${R.cat[c[0]]/mx*100}%"></i></span><b>${vis(R.cat[c[0]])}</b></div>`).join('')||'<p class="muted">Ancora nulla.</p>'}</div>
  <h3 class="isec">Chi ha pagato e quanto tocca a ciascuno</h3><div class="ribar">${P.map(p=>`<div><span>${avatar(p,20)} ${esc(p)}</span><span>pagato <b>${vis(R.pagato[p]||0)}</b></span><span>parte <b>${vis(R.quota[p]||0)}</b></span></div>`).join('')}</div>
  <h3 class="isec">Per giorno</h3><div class="ribar">${Object.entries(R.giorno).sort().map(([d,v])=>`<div><span>${esc(corto(d))}</span><b>${vis(v)}</b></div>`).join('')||'<p class="muted">Ancora nulla.</p>'}</div>
  <div class="acts" style="margin-top:12px"><button class="btn" data-csv>Scarica tutte le spese (CSV)</button></div>`}
 return`<div class="pad"><h1 class="disp" style="font-size:30px;margin:4px 0 4px">Cassa comune</h1>${testa}${tabs}${corpo}</div>`}
function formSpesa(k){if(!IO){accesso();return}CMID=null;const s0=k&&SPE[k]?{...SPE[k]}:null,P=V.viaggio.viaggiatori,oggi=adesso(V.viaggio.fuso).data,cb=cambioOra();
 const s=s0||{titolo:'',importo:'',valuta:'JPY',paga:IO,per:Object.fromEntries(P.map(n=>[n,1])),modo:'uguale',data:oggi,cat:'cibo'};
 const pren=V.giorni.flatMap(g=>g.eventi.filter(e=>e.fonte==='prenotato'&&e.costo).map(e=>({t:e.titolo,c:e.costo,v:e.valuta||'JPY',d:g.data,cat:e.tipo==='hotel'?'alloggio':['treno','volo','bus'].includes(e.tipo)?'trasporti':'attivita'})));
 const sh=$('#sheet');sh.classList.add('on');
 sh.querySelector('.sheet').innerHTML=`<form id="sform" data-k="${esc(k||'')}"><h2>${s0?'Modifica la spesa':'Nuova spesa'}</h2>

 <label>Cosa<input name="titolo" maxlength="120" required value="${esc(s.titolo)}" placeholder="Es. cena a Pontocho"></label>
 <div class="row2b"><label>Importo<input name="importo" type="number" inputmode="decimal" min="0.01" step="0.01" required value="${esc(s.importo)}"></label>
 <label>Valuta<span class="seg"><label><input type="radio" name="valuta" value="JPY" ${s.valuta==='JPY'?'checked':''}><span>¥</span></label><label><input type="radio" name="valuta" value="EUR" ${s.valuta==='EUR'?'checked':''}><span>€</span></label></span></label></div>
 <div class="row2b"><label>Ha pagato<select name="paga">${P.map(n=>`<option ${n===s.paga?'selected':''}>${esc(n)}</option>`).join('')}</select></label><label>Giorno<input name="data" type="date" value="${esc(s.data||oggi)}"></label></div>
 <div class="cats">${CATS.map(c=>`<label><input type="radio" name="cat" value="${c[0]}" ${c[0]===(s.cat||'altro')?'checked':''}><span>${c[1]} ${c[2]}</span></label>`).join('')}</div>
 <fieldset class="divi"><legend>Come si divide</legend><span class="seg">${[['uguale','Uguali'],['importi','Importi'],['quote','Quote']].map(([m,n])=>`<label><input type="radio" name="modo" value="${m}" ${s.modo===m?'checked':''}><span>${n}</span></label>`).join('')}</span>
 <div class="pers">${P.map(n=>{const on=s.per&&s.per[n]!=null&&(s.per[n]>0||s.modo==='uguale');return`<div class="per"><label><input type="checkbox" name="p_${n}" ${on?'checked':''}> ${avatar(n,22)} ${esc(n)}</label><input class="pv" name="v_${n}" type="number" inputmode="decimal" min="0" step="0.01" value="${on&&s.modo!=='uguale'?s.per[n]:''}" placeholder="${s.modo==='quote'?'1':'0'}"><span class="pq"></span></div>`}).join('')}</div>
 <p class="sprev"></p></fieldset>
 <label>Nota <small>(facoltativa)</small><input name="nota" maxlength="300" value="${esc(s.nota||'')}"></label>
 <p class="muted" style="font-size:12.5px">Cambio usato: 1 € = ¥${s0&&s0.cambio||cb}. Resta fissato per questa spesa.</p>
 <div class="acts"><button class="btn pri" type="submit">${s0?'Salva':'Aggiungi'}</button>${s0?'<button class="btn" type="button" data-spdel>Elimina</button>':''}<button class="btn" type="button" data-chiudi>Annulla</button></div></form>`;anteprima()}
function leggiForm(f){const P=V.viaggio.viaggiatori,modo=f.modo.value,imp=+f.importo.value,per={};
 P.forEach(n=>{if(f['p_'+n].checked){const v=+f['v_'+n].value;per[n]=modo==='uguale'?1:modo==='quote'?(v>0?v:1):(v>=0?v:0)}});return{modo,imp,per,valuta:f.valuta.value}}
function anteprima(){const f=$('#sform');if(!f)return;const{modo,imp,per,valuta}=leggiForm(f),cb=+(f.dataset.k&&SPE[f.dataset.k]?.cambio)||cambioOra();
 f.querySelectorAll('.pv').forEach(i=>{i.hidden=modo==='uguale';i.placeholder=modo==='quote'?'1':'0'});
 const s={importo:imp||0,valuta,modo,per},q=CASSA.quote(s),fmtv=v=>valuta==='EUR'?eur(v):yen(v);
 f.querySelectorAll('.per').forEach(r=>{const n=r.querySelector('[name^=p_]').name.slice(2);r.querySelector('.pq').textContent=q[n]&&imp?fmtv(q[n]):''});
 let msg='';const n=Object.keys(per).length;if(!n)msg='Scegliete almeno una persona.';
 else if(modo==='importi'){const tot=Object.values(per).reduce((a,b)=>a+b,0),d=Math.round((imp-tot)*100)/100;msg=Math.abs(d)<0.01?'Gli importi tornano.':`Mancano ${fmtv(d)} da assegnare.`}
 else if(imp)msg=`${modo==='uguale'?`${fmtv(imp/n)} a testa`:'Diviso in proporzione alle quote'}${valuta==='JPY'?` · in totale ${eur(imp/cb)}`:` · in totale ${yen(imp*cb)}`}`;
 f.querySelector('.sprev').textContent=msg}
async function salvaSpesa(f){if(!IO||!FB)return;const{modo,imp,per,valuta}=leggiForm(f);if(!(imp>0)){toast('Scrivete l\'importo');return}if(!Object.keys(per).length){toast('Scegliete almeno una persona');return}
 if(modo==='importi'){const tot=Object.values(per).reduce((a,b)=>a+b,0);if(Math.abs(tot-imp)>=0.01){toast('Gli importi delle persone non tornano con il totale');return}}
 const k=f.dataset.k,old=k&&SPE[k],o={titolo:f.titolo.value.trim().slice(0,120),importo:Math.round(imp*100)/100,valuta,paga:f.paga.value,per,modo,data:f.data.value||adesso(V.viaggio.fuso).data,cat:f.cat.value,cambio:old&&old.cambio||cambioOra(),autore:IO,uid:old?old.uid:FB.uid,t:old?old.t:Date.now()};
 const nota=f.nota.value.trim();if(nota)o.nota=nota.slice(0,300);
 try{if(k)await salva('spese/'+k,o);else await FB.Db.set(FB.Db.push(FB.ref('spese')),o);$('#sheet').classList.remove('on');toast(k?'Spesa aggiornata':'Spesa aggiunta')}catch(err){toast('Non salvata: '+(err.code||err))}}
function csvSpese(){const P=V.viaggio.viaggiatori,cb=cambioOra(),righe=[['Data','Cosa','Categoria','Importo','Valuta','Cambio','Euro','Pagato da',...P.map(p=>'Parte '+p+' (€)')]];
 speseL().reverse().forEach(s=>{const e=CASSA.inEuro(s,cb),q=CASSA.quote(s),f=e/s.importo;righe.push([s.data||'',s.titolo,s.modo==='rimborso'?'rimborso':catDi(s.cat)[2],s.importo,s.valuta,s.cambio||cb,e.toFixed(2),s.paga,...P.map(p=>q[p]?(q[p]*f).toFixed(2):'')])});
 const csv=righe.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(';')).join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+csv],{type:'text/csv'}));a.download='big-in-japan-spese.csv';a.click()}

/* ---------- viste ---------- */
function vHome(){const v=V.viaggio,s=stato(),n=diff(v.inizio,v.fine)+1,tutte=V.giorni.flatMap(g=>propDi(g.data)),aperte=tutte.filter(p=>!p.ok);
 const recenti=tutte.slice().sort((a,b)=>b.t-a.t).slice(0,4);
 return`<div class="hero">${ph(v.hero,1200,'data-credit style="position:absolute;inset:0;height:auto"','hero',3,'Monte Fuji')}<div class="sh"></div><div class="tx"><h1>${esc(v.titolo)}</h1><p>${esc(v.sottotitolo)}</p><span class="pill">${esc(s.txt)}</span></div></div>
 <div class="pad"><div class="stats"><a href="#g1"><b>${n}</b><span>giorni, ${corto(v.inizio)} – ${corto(v.fine)}</span></a><a href="#piano" data-ptab="tabellone"><b>${PIANO.length}</b><span>tappe in programma</span></a><a href="#piano" data-ptab="tabellone"><b>${aperte.length}</b><span>proposte da votare</span></a><a href="#piano" data-ptab="idee"><b>${IDEE.length}</b><span>suggerimenti con schede</span></a>${(()=>{const a=biglietti().filter(o=>o.stato==='fare'&&o.fonte==='programma'),u=a.filter(o=>urgenza(o)<=7).length;return`<a href="#piano" data-ptab="prenotare" class="${a.length?'warn':''}"><b>${a.length}</b><span>biglietti da prenotare${u?`, ${u} in scadenza`:''}</span></a>`})()}</div>
 ${apkBox()}<div class="acts" style="margin-bottom:6px">${s.fase==='durante'&&s.i>=0?`<a class="btn pri" href="#g${s.i+1}">Vai a oggi</a>`:''}<a class="btn pri" href="#piano">Pianifica insieme</a><button class="btn" data-nuova="">+ Proponi qualcosa</button></div>
 ${recenti.length?`<h2 class="sec">Ultime proposte</h2>${recenti.map(p=>`<a class="mini" href="#g${p.d+1}" style="--p:${PCOL[p.autore]}">${avatar(p.autore,28)}<span><b>${esc(p.titolo)}</b><small>${esc(p.autore)} · giorno ${p.d+1}, ${esc(corto(p.data))}${p.ok?' · nel programma':''}</small></span><em>${ico('su',14)} ${p.nv}</em></a>`).join('')}`:''}
 ${(()=>{const oggi=s.fase==='durante'&&s.i>=0?V.giorni[s.i].data:null,base=oggi?IDEE.filter(x=>x.giorni.includes(oggi)):IDEE,top=base.slice().sort((a,b)=>scoreIdea(b)-scoreIdea(a)||(b.top?1:0)-(a.top?1:0)).slice(0,8);
  return`<h2 class="sec">Suggerimenti</h2><p class="muted" style="margin-top:-4px">${oggi?'Le 8 idee migliori per oggi.':'Le 8 migliori tra le '+IDEE.length+' raccolte da guide e recensioni; sotto ognuna, i giorni in cui ci sta.'} <a href="#piano" data-ptab="idee">Vedi tutti i ${IDEE.length} →</a></p>`+rigaIdee(top,oggi?'Per oggi':IDEE.some(x=>reaz(x.id).su.length)?'I più votati':'I più consigliati')})()}
 <h2 class="sec">Giorno per giorno</h2><div class="days">${V.giorni.map((g,i)=>{const np=propDi(g.data).filter(p=>!p.ok).length;return`<a class="dc ${s.fase==='durante'&&s.i===i?'today':''}" href="#g${i+1}" style="--c:${col(i)}">${ph(g.cover,300,'',g.scena,i+1,g.titolo).replace('</div>',`<span class="n">${i+1}</span></div>`)}<div><small>${esc(fmt(g.data,{weekday:'short',day:'numeric',month:'short'}))} · ${esc(g.citta||'')}</small><strong>${esc(g.titolo)}</strong><em>${tappe(i).length} tappe${np?` · <b class="np">${np} da votare</b>`:''}</em></div></a>`}).join('')}</div>
 <p class="foot">Foto da Wikipedia e Wikimedia Commons. Mappe © OpenStreetMap, OpenFreeMap, OpenMapTiles, Esri, GSI Japan, OpenTopoMap, CyclOSM.</p></div>`}
function vGiorno(i){const g=V.giorni[i],now=adesso(V.viaggio.fuso),live=now.data===g.data,T=tappe(i),P=propDi(g.data).filter(p=>!p.ok);let next=false;
 const LEGS=legsGiorno(i);
 const blocchi=FASCE.map(([k,nome])=>{const ts=T.filter(e=>fasciaDi(e.ora)===k),ps=P.filter(p=>(p.fascia||'mattina')===k||(!p.fascia&&k==='mattina'));
  const stops=ts.map(e=>{let c='';if(live&&!next&&(e.fine&&/^\d\d:\d\d$/.test(e.fine)?e.fine:e.ora)>=now.ora){c='next';next=true}return(LEGS[e.id]||'')+stopCard(e,c)}).join('');
  return`<div class="slot">${nome}</div>${stops}${ps.length?`<div class="pgroup"><div class="plab">Proposte per ${nome.toLowerCase()} · votate e mettete nel programma</div>${ps.map(propCard).join('')}</div>`:''}${rigaIdee(ideeDi(g.data,k,false),'Alternative per '+nome.toLowerCase()+' · da guide, recensioni e tour')}<button class="add" data-nuova="${g.data}|${k}">+ Proponi per ${nome.toLowerCase()}</button>`}).join('');
 const cibo=ideeDi(g.data,null,true),pr=cibo.filter(x=>x.pasto!=='cena'),ce=cibo.filter(x=>x.pasto==='cena');
 const mangiare=cibo.length?`<h2 class="sec" id="mangiare">Dove mangiare</h2><p class="muted" style="margin-top:-4px">Posti vicini alle tappe del giorno, con prezzi indicativi. Proponeteli per metterli nel programma.</p>${rigaIdee(pr,'Pranzo e spuntini')}${rigaIdee(ce,'Cena')}`:'';
 return`<div style="--c:${col(i)}"><div class="cover">${ph(g.cover,1200,'data-credit style="position:absolute;inset:0;height:auto"',g.scena,i+1,g.titolo)}<div class="sh"></div><div class="tx"><small>Giorno ${i+1} · ${esc(lungo(g.data))}</small><h1>${esc(g.titolo)}</h1></div></div>
 <nav class="daynav" aria-label="Giornate">${V.giorni.map((x,k)=>`<a href="#g${k+1}" style="--c:${col(k)}" ${k===i?'aria-current="page"':''}>${k+1} · ${esc(corto(x.data))}${propDi(x.data).some(p=>!p.ok)?' •':''}</a>`).join('')}</nav>
 <div class="pad"><p class="lead">${esc(g.riassunto||'')}</p>${(()=>{const n=ideeDi(g.data).length,c=ideeDi(g.data,null,true).length;return n?`<div class="daytools"><span>${n-c} alternative e ${c} posti dove mangiare per questo giorno</span><a href="#mappa" data-giornomappa="${i}">Percorso sulla mappa</a>${IO?`<button class="lnk2" data-ottimizza="${i}">Ordine con meno strada</button>`:''}<a href="#diario" data-goto="diario">Diario</a>${['2027-01-03','2027-01-08'].includes(g.data)?`<button class="lnk2" data-fujiday="${i}">Il Fuji dal finestrino, in 3D</button>`:''}${c?'<a href="#mangiare" data-goto="mangiare">Dove mangiare</a>':''}</div>`:''})()}${(g.avvisi||[]).map(a=>`<div class="alert"><b>Da sapere:</b> ${esc(a)}</div>`).join('')}
 ${propStato==='errore'?`<div class="alert"><span title="${esc(propErr)}">Proposte e voti non raggiungibili in questo momento: si vede solo il programma</span></div>`:''}
 ${blocchi}${(()=>{const N=nascoste(i);return N.length?`<details class="tolte"><summary>${N.length} ${N.length===1?'tappa tolta':'tappe tolte'} dal programma</summary>${N.map(e=>`<div class="tolta"><span><b>${esc(e.ora||'')}</b> ${esc(e.titolo)} <small>da ${esc(e.mod.autore||'')}</small></span><button class="btn sm" data-rimetti="${esc(rid(e))}">Rimetti</button></div>`).join('')}</details>`:''})()}${mangiare}${diarioGiorno(g,i)}${g.pernotto?`<div class="sleep">Si dorme a <b>${esc(g.pernotto)}</b></div>`:''}
 <div class="acts" style="margin-top:16px">${i>0?`<a class="btn" href="#g${i}">← Giorno ${i}</a>`:''}${i<V.giorni.length-1?`<a class="btn" href="#g${i+2}">Giorno ${i+2} →</a>`:''}<a class="btn" href="#piano">Vista d'insieme</a></div></div></div>`}
function vPiano(){if(PT!=='tabellone')return`<div class="pad"><h1 class="disp" style="font-size:30px;margin:4px 0 4px">Pianifica insieme</h1>${vListe()}</div>`;return`<div class="pad"><h1 class="disp" style="font-size:30px;margin:4px 0 4px">Pianifica insieme</h1>${vListe()}<p class="lead">Tutte le giornate come nel taccuino: in nero il programma, a colori le proposte con i loro pollici. Tocca per aprire, + per proporre.</p>
 ${V.giorni.map((g,i)=>{const T=tappe(i),P=propDi(g.data).filter(p=>!p.ok);return`<div class="pday" style="--c:${col(i)}"><a class="pdh" href="#g${i+1}"><span class="n">${i+1}</span><b>${esc(fmt(g.data,{weekday:'short',day:'numeric',month:'short'}))}</b><small>${esc(g.titolo)}</small></a>
 <div class="pcols">${FASCE.map(([k,nome])=>`<div class="pcell"><span>${nome}</span>${T.filter(e=>fasciaDi(e.ora)===k).map(e=>`<a class="pi ${e.fonte==='gruppo'?'grp':''}" href="#g${i+1}" data-goto="${e.id}"><b>${esc(e.ora||'')}</b> ${esc(e.titolo)}</a>`).join('')}${P.filter(p=>(p.fascia||'mattina')===k).map(p=>`<a class="pi pp" style="--p:${PCOL[p.autore]}" href="#g${i+1}" data-goto="p-${esc(p.id)}">${avatar(p.autore,18)} ${esc(p.titolo)} <em>${ico('su',12)} ${p.nv}</em></a>`).join('')}${(()=>{const n=ideeDi(g.data,k).length;return n?`<a class="pi idn" href="#g${i+1}">${n} ${n===1?'alternativa':'alternative'}</a>`:''})()}<button class="padd" data-nuova="${g.data}|${k}" aria-label="Proponi per ${nome.toLowerCase()} del ${esc(corto(g.data))}">+</button></div>`).join('')}</div></div>`}).join('')}</div>`}
function lista(key,voci){const ck=store.get('bij:'+key,{});return`<ul class="checks">${voci.map((t,i)=>`<li><label><input type="checkbox" data-k="${key}" data-i="${i}" ${ck[i]?'checked':''}><span>${esc(t)}</span></label></li>`).join('')}</ul>`}
function vInfo(){const inf=V.info,per=V.viaggio.persone||1,tot={};V.giorni.forEach(g=>g.eventi.forEach(e=>{const c=e.valuta||'JPY';tot[c]=(tot[c]||0)+(e.costo||0)+(e.costoPersona||0)*per}));
 const pren=V.giorni.flatMap(g=>g.eventi).filter(e=>e.fonte==='prenotato'&&(e.costo||e.tipo==='volo'));
 return`<div class="pad">${apkBox()}<h2 class="sec" style="margin-top:4px">Prenotazioni</h2>${pren.map(e=>`<div class="box" style="--c:${col(e.d)}"><small style="color:var(--c);font-weight:700">Giorno ${e.d+1} · ${esc(corto(V.giorni[e.d].data))}${e.ora?' · '+esc(e.ora):''}</small><h3>${esc(e.titolo)}</h3><p style="margin:0 0 6px;color:var(--muted);font-size:14px">${esc(e.note||'')}</p><div class="acts">${e.costo?`<span class="tg">${soldi(e.costo,e.valuta||'JPY')}</span>`:''}<a class="btn" href="${gmap(e)}" target="_blank" rel="noopener">Google Maps</a><a class="btn" href="#g${e.d+1}">Giorno ${e.d+1}</a></div></div>`).join('')}
 <div class="box"><h3>Spese inserite</h3><p style="margin:0">${Object.entries(tot).filter(x=>x[1]).map(([c,v])=>`<b class="disp" style="font-size:24px">${soldi(v,c)}</b>`).join(' + ')}</p><p style="margin:6px 0 0;color:var(--muted);font-size:13px">${esc(V.viaggio.notaCosti)}</p></div>
 <h2 class="sec">Da sapere</h2><div class="box"><dl class="kv">${inf.pratiche.map(p=>`<dt>${esc(p.voce)}</dt><dd>${esc(p.valore)}</dd>`).join('')}</dl></div>
 <h2 class="sec">Contatti utili</h2><div class="box"><dl class="kv">${inf.contatti.map(c=>`<dt>${esc(c.nome)}<br><small>${esc(c.ruolo||'')}</small></dt><dd><a href="tel:${esc(c.tel.replace(/\s/g,''))}">${esc(c.tel)}</a>${c.email?`<br><small>${esc(c.email)}</small>`:''}</dd>`).join('')}</dl></div>
 <h2 class="sec">Liste e diario</h2><div class="acts"><a class="btn" href="#piano" data-ptab="prima">Prima di partire</a><a class="btn" href="#piano" data-ptab="prenotare">Da prenotare</a><a class="btn" href="#piano" data-ptab="valigia">Valigia</a>${V.viaggio.album?`<a class="btn pri" href="${esc(V.viaggio.album)}" target="_blank" rel="noopener">Album Google Foto</a>`:''}</div>
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
 if(e.target.closest('[data-chiudi]')||e.target.id==='sheet'){$('#sheet').classList.remove('on');CMID=null;aggiorna()}});
$('#sheet').addEventListener('submit',async e=>{const ef=e.target.closest('[data-eform]');if(ef){e.preventDefault();const[id,k]=ef.dataset.eform.split('|'),tx=ef.testo.value.trim();if(!tx)return;if(!FB){toast('Non collegato: riprova tra poco');return}
  const b=ef.querySelector('[type=submit]');b.disabled=true;try{await FB.Db.update(FB.ref(`commenti/${id}/${k}`),{testo:tx.slice(0,500),mod:Date.now()});commenti(id,true)}catch(err){toast('Modifica non salvata: '+(err.code||err));b.disabled=false}return}
 const cf=e.target.closest('[data-cform]');if(cf){e.preventDefault();const id=cf.dataset.cform,tx=cf.testo.value.trim();if(!tx||!IO)return;if(!FB){toast('Non collegato: riprova tra poco');return}
  const b=cf.querySelector('button');b.disabled=true;try{await FB.Db.set(FB.Db.push(FB.ref('commenti/'+id)),{autore:IO,uid:FB.uid,t:Date.now(),testo:tx.slice(0,500)});cf.testo.value=''}catch(err){toast('Commento non salvato: '+(err.code||err))}b.disabled=false;return}});
$('#sheet').addEventListener('submit',async e=>{const sf=e.target.closest('#sform');if(!sf)return;e.preventDefault();await salvaSpesa(sf)});
$('#sheet').addEventListener('input',e=>{if(e.target.closest('#sform'))anteprima()});
$('#sheet').addEventListener('change',e=>{if(e.target.matches('[data-ideagiorno]')){const b=$('[data-iavv]');if(b)b.innerHTML=avvisoApertura(IDX[b.dataset.iavv],e.target.value)}if(e.target.closest('#sform'))anteprima()});
$('#sheet').addEventListener('click',async e=>{const pb=e.target.closest('[data-pren]');if(pb){const p=JSON.parse(pb.dataset.pren),f=$('#sform');f.titolo.value=p.t;f.importo.value=p.c;f.valuta.value=p.v;f.data.value=p.d;f.cat.value=p.cat;anteprima();return}
 if(e.target.closest('[data-spdel]')){const k=$('#sform').dataset.k;if(k&&confirm('Eliminare questa spesa per tutti?')){try{await salva('spese/'+k,null);$('#sheet').classList.remove('on');toast('Spesa eliminata')}catch(err){toast('Non eliminata')}}}});
$('#sheet').addEventListener('submit',async e=>{const mf=e.target.closest('#mform');if(!mf)return;e.preventDefault();const o={ora:mf.ora.value};const k=mf.dataset.rid,e0=PIANO.concat(grezze()).find(x=>rid(x)===k);
 if(e0&&V.giorni[e0.orig??e0.d]&&mf.data.value!==V.giorni[e0.orig??e0.d].data)o.data=mf.data.value;else if(MOD[k]&&MOD[k].data)o.data=mf.data.value;$('#sheet').classList.remove('on');await salvaMod(k,o)});
$('#sheet').addEventListener('submit',async e=>{if(e.target.closest('[data-cform]')||e.target.closest('[data-eform]')||e.target.closest('#mform')||e.target.closest('#sform'))return;e.preventDefault();const f=e.target,o={autore:IO,uid:FB?.uid,t:Date.now(),titolo:f.titolo.value.trim()};if(!o.titolo)return;if(!FB){toast('Proposte non collegate: riprova tra poco');return}
 for(const k of['luogo','nota','fascia']){const v=f[k].value.trim();if(v)o[k]=v.slice(0,k==='nota'?600:120)}
 const lk=f.link.value.trim();if(/^https:\/\//.test(lk))o.link=lk;if(NUOVA.lat!=null){o.lat=+NUOVA.lat.toFixed(6);o.lng=+NUOVA.lng.toFixed(6)}
 const b=f.querySelector('[type=submit]');b.disabled=true;
 try{await FB.Db.set(FB.Db.push(FB.ref('proposte/'+f.data.value)),o);if(f.dataset.lst)salva(`liste/${f.dataset.lst}/fatto`,true).catch(()=>{});$('#sheet').classList.remove('on');toast('Proposta pubblicata');const i=V.giorni.findIndex(g=>g.data===f.data.value);if(location.hash!=='#mappa')location.hash='#g'+(i+1)}catch(err){toast('Non salvata: '+(err.code||err));b.disabled=false}});

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
let MODO=store.get('bij:modo','giornata'),PS=store.get('bij:ps',1),ALT=-1,KBQUI=false;
let stile=store.get('bij:stile','liberty'),OPZ=store.get('bij:opz',{linee:true,stazioni:true,latino:true,tutto:false});
const stileObj=()=>STILI.find(s=>s.k===stile)||STILI[0];
let LINEE=null,STAZ=null;
function geo(){if(!ST||LINEE)return;LINEE={type:'FeatureCollection',features:ST.linee.map(l=>({type:'Feature',properties:{c:/^#[0-9a-fA-F]{6}$/.test(l.c)?l.c:'#8a93a6',n:l.n},geometry:{type:'LineString',coordinates:l.s.map(([a,b])=>[b,a])}}))};
 STAZ={type:'FeatureCollection',features:ST.stazioni.map(s=>({type:'Feature',properties:{n:s.n||s.k,k:s.k,l:s.l.slice(0,4).map(i=>ST.linee[i].n).join(', ')},geometry:{type:'Point',coordinates:[s.lon,s.lat]}}))}}
function initMap(){geo();map=new maplibregl.Map({container:'map',style:stileObj().s,center:[139.74,35.68],zoom:11.5,attributionControl:{compact:true},maxPitch:70});
 const mob0=innerWidth<=860;map.addControl(new maplibregl.NavigationControl({visualizePitch:true,showZoom:!mob0}),'top-right');if(!mob0)map.addControl(new maplibregl.ScaleControl({unit:'metric'}),'bottom-left');
 map.on('zoom',()=>$('#mapwrap').classList.toggle('zlo',map.getZoom()<15));map.on('zoomend',()=>disegnaIdee());
 map.on('click','rotta-hit',e=>tratto(e.features[0],e.lngLat));map.on('mouseenter','rotta-hit',()=>map.getCanvas().style.cursor='pointer');map.on('mouseleave','rotta-hit',()=>map.getCanvas().style.cursor='');
 map.on('style.load',livelli);
 map.on('click','staz-pt',e=>{const f=e.features[0];new maplibregl.Popup({offset:10,maxWidth:'280px'}).setLngLat(f.geometry.coordinates).setHTML(`<div class="bd st-pop"><b>${esc(f.properties.n)}</b> <span lang="ja">${esc(f.properties.k)}</span><p>${esc(f.properties.l)}</p><div class="acts"><a class="btn pri" href="${arrivo({lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0]},ME)}" target="_blank" rel="noopener">Come arrivo</a></div></div>`).addTo(map)});
 map.on('mouseenter','staz-pt',()=>map.getCanvas().style.cursor='pointer');map.on('mouseleave','staz-pt',()=>map.getCanvas().style.cursor='');
 map.on('contextmenu',e=>quiPopup(e.lngLat));
 ['ov-poi','ov-kb'].forEach(l=>{map.on('click',l,e=>{ovPopup(e.features[0])});map.on('mouseenter',l,()=>map.getCanvas().style.cursor='pointer');map.on('mouseleave',l,()=>map.getCanvas().style.cursor='')});
 map.on('moveend',()=>{clearTimeout(ovT);ovT=setTimeout(ovAggiorna,700)});
 map.on('click',e=>{if(map.queryRenderedFeatures(e.point,{layers:['staz-pt','ov-poi','ov-kb','rotta-hit'].filter(l=>map.getLayer(l))}).length)return;setAlt(-1);if(scegli){scegli=false;$('#mapwrap').classList.remove('picking');quiPopup(e.lngLat)}else{$('#lpanel').classList.remove('on');$('#blayers').classList.remove('on')}});
 pannello();initTline();setModo(MODO,true);disegna(true);if(TRE){$('#b3d').classList.add('on');map.once('load',()=>map.easeTo({pitch:50,bearing:-17,duration:0}))}}
initDrag();
let scegli=false;
function quiPopup(ll){const g=filter??0;new maplibregl.Popup({offset:6,maxWidth:'280px'}).setLngLat(ll).setHTML(`<div class="bd"><b>Questo punto</b><p>${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}</p>${vicinaTxt(ll)}<div class="acts"><button class="btn pri" data-qui="${ll.lat},${ll.lng}">Proponi qui</button><a class="btn" href="https://www.google.com/maps/search/?api=1&query=${ll.lat},${ll.lng}" target="_blank" rel="noopener">Google Maps</a></div></div>`).addTo(map)}
const vicinaTxt=ll=>{const v=vicina(ll.lat,ll.lng);return v?`<div class="sta">${ICO_TRENO}<span><b>${nomeSt(v.s)}</b> · ${piedi(v.d)} min a piedi</span></div>`:''};
/* edifici 3D: se lo stile vettoriale non li ha già, li aggiungiamo noi; visibili solo in Vista 3D */
function edifici3d(){if(!map||!stileObj().v)return;const L=map.getStyle().layers,src=Object.keys(map.getStyle().sources).find(k=>map.getStyle().sources[k].type==='vector');if(!src)return;
 const suoi=L.filter(l=>l.type==='fill-extrusion'&&l['source-layer']==='building').map(l=>l.id);
 if(!suoi.length&&!map.getLayer('edifici-3d')){const scuro=/dark|fiord/.test(stile);map.addLayer({id:'edifici-3d',type:'fill-extrusion',source:src,'source-layer':'building',minzoom:14,
  paint:{'fill-extrusion-color':scuro?'#3a3d47':'#e4dfd6','fill-extrusion-height':['coalesce',['get','render_height'],['get','height'],10],'fill-extrusion-base':['coalesce',['get','render_min_height'],['get','min_height'],0],'fill-extrusion-opacity':.85}},(L.find(l=>l.type==='symbol')||{}).id)}
 if(map.getLayer('edifici-3d'))map.setLayoutProperty('edifici-3d','visibility',TRE?'visible':'none')}
function livelli(){const vt=!!stileObj().v;
 if(vt)map.getStyle().layers.forEach(l=>{if(l['source-layer']==='poi')try{map.setLayerZoomRange(l.id,Math.max(l.minzoom||0,16.5),24)}catch(e){}});
 if(vt&&OPZ.latino)map.getStyle().layers.forEach(l=>{if(l.type==='symbol'&&l.layout&&l.layout['text-field'])try{map.setLayoutProperty(l.id,'text-field',['coalesce',['get','name:it'],['get','name:latin'],['get','name_en'],['get','name']])}catch(e){}});
 if(LINEE){if(!map.getSource('linee'))map.addSource('linee',{type:'geojson',data:LINEE});if(!map.getSource('staz'))map.addSource('staz',{type:'geojson',data:STAZ});
  if(!map.getLayer('linee'))map.addLayer({id:'linee',type:'line',source:'linee',layout:{'line-join':'round','line-cap':'round',visibility:OPZ.linee?'visible':'none'},paint:{'line-color':['get','c'],'line-width':lineeW(),'line-opacity':MODO==='esplora'?.8:.45}});
  if(!map.getLayer('staz-pt'))map.addLayer({id:'staz-pt',type:'circle',source:'staz',minzoom:MODO==='esplora'?12:14,layout:{visibility:OPZ.stazioni?'visible':'none'},paint:{'circle-radius':['interpolate',['linear'],['zoom'],12,2.5,16,6],'circle-color':'#fff','circle-stroke-color':'#15171c','circle-stroke-width':1.6}});
  if(!map.getLayer('staz-lb'))map.addLayer({id:'staz-lb',type:'symbol',source:'staz',minzoom:MODO==='esplora'?13.5:15,layout:{visibility:OPZ.stazioni?'visible':'none','text-field':['get','n'],'text-font':['Noto Sans Bold'],'text-size':12,'text-offset':[0,1.1],'text-anchor':'top','text-optional':true},paint:{'text-color':'#15171c','text-halo-color':'#fff','text-halo-width':1.6}})}
 const primoTesto=(map.getStyle().layers.find(l=>l.type==='symbol')||{}).id;
 if(!map.getSource('dem'))map.addSource('dem',DEM);
 if(!map.getLayer('rilievo'))map.addLayer({id:'rilievo',type:'hillshade',source:'dem',layout:{visibility:'none'},paint:{'hillshade-exaggeration':.35,'hillshade-shadow-color':'#3d3a52'}},primoTesto);
 if(!map.getSource('mondo'))map.addSource('mondo',{type:'geojson',data:{type:'Feature',geometry:{type:'Polygon',coordinates:[[[-180,-85],[180,-85],[180,85],[-180,85],[-180,-85]]]}}});
 if(!map.getLayer('notte'))map.addLayer({id:'notte',type:'fill',source:'mondo',paint:{'fill-color':'#0b1638','fill-opacity':0}},primoTesto);
 if(!map.getSource('hl'))map.addSource('hl',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
 if(!map.getLayer('hl-3d'))map.addLayer({id:'hl-3d',type:'fill-extrusion',source:'hl',paint:{'fill-extrusion-color':['get','c'],'fill-extrusion-height':['get','h'],'fill-extrusion-base':['get','m'],'fill-extrusion-opacity':.88}},primoTesto);
 terreno(!!FJ);try{edifici3d()}catch(e){}if(CIELO)cielo(CIELO.data,CIELO.m,CIELO.lat,CIELO.lng);
 if(!map.getSource('rotta'))map.addSource('rotta',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
 if(!map.getLayer('rotta-alt'))map.addLayer({id:'rotta-alt',type:'line',source:'rotta',filter:fAlt(),layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#7c8494','line-width':3,'line-dasharray':[1.2,1.6],'line-opacity':.85}});
 if(!map.getLayer('rotta-case'))map.addLayer({id:'rotta-case',type:'line',source:'rotta',filter:['==',['get','best'],1],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#fff','line-width':8,'line-opacity':.9}});
 if(!map.getLayer('rotta'))map.addLayer({id:'rotta',type:'line',source:'rotta',filter:['==',['get','best'],1],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':VERDE,'line-width':5}});
 if(!map.getLayer('rotta-lb'))map.addLayer({id:'rotta-lb',type:'symbol',source:'rotta',minzoom:12.5,filter:fLab(),layout:{'symbol-placement':'line-center','text-field':['get','lab'],'text-font':['Noto Sans Bold'],'text-size':11.5,'text-allow-overlap':false},paint:{'text-color':['case',['==',['get','best'],1],'#0b6b35','#4b5260'],'text-halo-color':'#fff','text-halo-width':2}});
 if(!map.getLayer('rotta-hit'))map.addLayer({id:'rotta-hit',type:'line',source:'rotta',filter:['==',['get','best'],1],layout:{'line-cap':'round'},paint:{'line-color':'#000','line-width':24,'line-opacity':0}});
 if(!map.getSource('ov'))map.addSource('ov',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
 if(!map.getLayer('ov-poi'))map.addLayer({id:'ov-poi',type:'circle',source:'ov',filter:['==',['get','k'],'poi'],minzoom:13,paint:{'circle-radius':['interpolate',['linear'],['zoom'],13,3.5,17,7],'circle-color':'#7b45c4','circle-stroke-color':'#fff','circle-stroke-width':1.6}});
 if(!map.getLayer('ov-poi-lb'))map.addLayer({id:'ov-poi-lb',type:'symbol',source:'ov',filter:['==',['get','k'],'poi'],minzoom:15.3,layout:{'text-field':['get','n'],'text-font':['Noto Sans Regular'],'text-size':11.5,'text-offset':[0,1],'text-anchor':'top','text-optional':true,'text-max-width':9},paint:{'text-color':'#5a2d99','text-halo-color':'#fff','text-halo-width':1.5}});
 if(!map.getLayer('ov-kb'))map.addLayer({id:'ov-kb',type:'circle',source:'ov',filter:['==',['get','k'],'kb'],minzoom:13,paint:{'circle-radius':['interpolate',['linear'],['zoom'],13,3,17,7.5],'circle-color':['get','c'],'circle-stroke-color':'#fff','circle-stroke-width':1.6}});
 if(!map.getLayer('ov-kb-lb'))map.addLayer({id:'ov-kb-lb',type:'symbol',source:'ov',filter:['==',['get','k'],'kb'],minzoom:16.2,layout:{'text-field':['get','n'],'text-font':['Noto Sans Bold'],'text-size':10.5,'text-offset':[0,1],'text-anchor':'top','text-optional':true},paint:{'text-color':['get','c'],'text-halo-color':'#fff','text-halo-width':1.5}});
 rotta();ovDisegna()}
function pannello(){$('#lgrid').innerHTML=STILI.map(s=>`<button data-st="${s.k}" aria-pressed="${s.k===stile}"><i style="background:${s.t?`url('${s.t}') center/cover`:s.sw}"></i>${esc(s.n)}</button>`).join('');
 $('#lopz').innerHTML=[['percorsi','Percorsi del giorno (verde il consigliato)'],['idee','Suggerimenti e ristoranti'],['konbini','Konbini (da vicino)'],['poi','Altri punti d\'interesse (da vicino)'],['linee','Linee di treni e metro'],['stazioni','Stazioni (da vicino)'],['latino','Nomi in caratteri latini'],['tutto','Tutte le tappe del viaggio']].map(([k,n])=>`<label><input type="checkbox" data-opz="${k}" ${OPZ[k]!==false&&(OPZ[k]||!['tutto','linee','stazioni','latino'].includes(k))?'checked':''}> ${n}</label>`).join('')+`<div class="legenda"><span><i style="background:${VERDE}"></i>consigliato</span><span><i class="tr"></i>alternativa</span><span><i style="background:#f58220"></i>7-Eleven</span><span><i style="background:#0a8a3c"></i>FamilyMart</span><span><i style="background:#1b6ec2"></i>Lawson</span><span><i style="background:#7b45c4"></i>punto d'interesse</span></div>`}
const lineeW=()=>MODO==='esplora'?['interpolate',['linear'],['zoom'],9,1.2,13,3,16,5]:['interpolate',['linear'],['zoom'],9,.6,13,1.4,16,2.6];
const fAlt=()=>['all',['==',['get','best'],0],['==',['get','i'],ALT]],fLab=()=>['any',['==',['get','best'],1],['==',['get','i'],ALT]];
function setAlt(i){if(i===ALT)return;ALT=i;if(map&&map.getLayer('rotta-alt')){map.setFilter('rotta-alt',fAlt());map.setFilter('rotta-lb',fLab())}}
function tratto(f,ll){const P=f.properties;setAlt(P.i);
 new maplibregl.Popup({offset:6,maxWidth:'280px'}).setLngLat(ll).setHTML(`<div class="bd"><small>Tratto ${P.i+1}</small><b style="display:block">${esc(P.da)} → ${esc(P.a)}</b><p><span style="color:${VERDE};font-weight:700">Consigliato:</span> ${esc(P.lab)}</p>${P.alab?`<p><b>Alternativa</b> (tratteggiata): ${esc(P.alab)}</p>`:''}<div class="acts"><a class="btn pri" href="https://www.google.com/maps/dir/?api=1&origin=${P.o}&destination=${P.d}&travelmode=${P.k==='piedi'?'walking':'transit'}" target="_blank" rel="noopener">Indicazioni</a></div></div>`).addTo(map)}
function setModo(m,init){MODO=m==='esplora'?'esplora':'giornata';store.set('bij:modo',MODO);const es=MODO==='esplora';
 $$('.modo [data-modo]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.modo===MODO)));$('#mapwrap').classList.toggle('esplora',es);
 if(init||!map)return;if(map.getLayer('linee')){map.setPaintProperty('linee','line-width',lineeW());map.setPaintProperty('linee','line-opacity',es?.8:.45)}
 if(map.getLayer('staz-pt'))map.setLayerZoomRange('staz-pt',es?12:14,24);if(map.getLayer('staz-lb'))map.setLayerZoomRange('staz-lb',es?13.5:15,24);
 disegnaIdee();ovDisegna();if(es){ovAvv=false;ovAggiorna()}}
$$('.modo [data-modo]').forEach(b=>b.addEventListener('click',()=>{setModo(b.dataset.modo);toast(MODO==='esplora'?'Esplora: suggerimenti, konbini e punti d\'interesse':'Giornata: solo le tappe e il percorso')}));
/* pannello in basso: 0 chiuso, 1 a metà, 2 aperto */
function panelState(n,salva=true){PS=Math.max(0,Math.min(2,n));if(salva)store.set('bij:ps',PS);const p=$('#mpanel');p.classList.remove('s0','s1','s2');p.classList.add('s'+PS);misuraPanel()}
function misuraPanel(){requestAnimationFrame(()=>{const p=$('#mpanel');$('#mapwrap').style.setProperty('--ph',innerWidth<=860&&p?p.offsetHeight+'px':'0px')})}
(()=>{let y0=null,mosso=false;const zone=['.mhandle','.tinfo'].map(q=>$(q));
 zone.forEach(z=>{z.addEventListener('pointerdown',e=>{y0=e.clientY;mosso=false});
  z.addEventListener('pointerup',e=>{if(y0==null)return;const dy=e.clientY-y0;y0=null;if(Math.abs(dy)>28){mosso=true;panelState(PS+(dy<0?1:-1))}});
  z.addEventListener('click',()=>{if(mosso){mosso=false;return}panelState(PS===2?0:PS+1)})})})();
$('#carousel').addEventListener('click',e=>{if(PS!==2||e.target.closest('a,button'))return;const c=e.target.closest('.cc');if(!c)return;panelState(1);seleziona(c.dataset.sel,true)});
addEventListener('resize',misuraPanel);
$('#bcerca').addEventListener('click',()=>{$('#msearchbox').hidden=false;$('.mtop').classList.add('cerca');$('#bcerca').setAttribute('aria-expanded','true');$('#bcerca').hidden=true;$('#msearch').focus()});
$('#bcercax').addEventListener('click',()=>{$('#msearchbox').hidden=true;$('.mtop').classList.remove('cerca');$('#msearch').value='';$('#mres').innerHTML='';$('#bcerca').hidden=false;$('#bcerca').setAttribute('aria-expanded','false');$('#bcerca').focus()});
if(document.fullscreenEnabled)$('#bfull').hidden=false;
$('#bfull').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>{})});
document.addEventListener('fullscreenchange',()=>{$('#bfull').classList.toggle('on',!!document.fullscreenElement);setTimeout(()=>{map&&map.resize();misuraPanel()},200)});
$('#lpanel').addEventListener('click',e=>{const b=e.target.closest('[data-st]');if(!b)return;stile=b.dataset.st;store.set('bij:stile',stile);map.setStyle(stileObj().s,{diff:false});pannello()});
$('#lpanel').addEventListener('change',e=>{const k=e.target.dataset.opz;if(!k)return;OPZ[k]=e.target.checked;store.set('bij:opz',OPZ);
 if(k==='linee'&&map.getLayer('linee'))map.setLayoutProperty('linee','visibility',OPZ.linee?'visible':'none');
 if(k==='stazioni')['staz-pt','staz-lb'].forEach(l=>map.getLayer(l)&&map.setLayoutProperty(l,'visibility',OPZ.stazioni?'visible':'none'));
 if(k==='latino')map.setStyle(stileObj().s,{diff:false});if(k==='tutto')disegna(true);if(k==='percorsi'){rotta();tline()}if(k==='idee')disegnaIdee();if(k==='konbini'||k==='poi'){ovDisegna();ovAggiorna()}});
$('#blayers').addEventListener('click',()=>{const on=$('#lpanel').classList.toggle('on');$('#blayers').classList.toggle('on',on);$('#blayers').setAttribute('aria-expanded',String(on))});
$('#b3d').addEventListener('click',()=>{TRE=!TRE;store.set('bij:3d',TRE);try{edifici3d()}catch(e){}map.easeTo({pitch:TRE?50:0,bearing:TRE?-17:0,...(TRE&&map.getZoom()<15.5?{zoom:15.5}:{}),duration:900});if(TRE&&!stileObj().v)toast('Gli edifici 3D si vedono con le mappe Mappa, Colorata, Chiara, Notte e Fiordo');$('#b3d').classList.toggle('on',TRE)});
$('#bfit').addEventListener('click',()=>inquadra());
$('#bqui').addEventListener('click',()=>{if(!IO){accesso();return}scegli=!scegli;$('#mapwrap').classList.toggle('picking',scegli);toast(scegli?'Tocca il punto della mappa da proporre':'Annullato');$('#lpanel').classList.remove('on');$('#blayers').classList.remove('on')});

let MK=[];
function evMappa(){if(filter==null||OPZ.tutto)return V.giorni.flatMap((g,i)=>g.zona==='Roma'?[]:tappe(i)).filter(e=>e.lat!=null);return tappe(filter).filter(e=>e.lat!=null)}
function propMappa(){const gs=filter==null||OPZ.tutto?V.giorni:[V.giorni[filter]];return gs.flatMap(g=>propDi(g.data)).filter(p=>!p.ok&&p.lat!=null)}
function pinEl(e,label,cls){const el=document.createElement('button');el.className='pinw'+(!e.partenza&&!cls.includes('prop')&&visti(e).length?' vis':'');el.setAttribute('aria-label',e.titolo);el.innerHTML=`<div class="pin ${cls}" style="--c:${cls.includes('prop')?PCOL[e.autore]:col(e.d)}"><span>${esc(label)}</span></div>`;return el}
function popHTML(e){const g=V.giorni[e.d];return`<div class="pop" style="--c:${col(e.d)}">${e.wiki?ph(e.wiki,560,'','',e.d+1,e.titolo):''}<div class="bd"><small>Giorno ${e.d+1} · ${esc(corto(g.data))}${e.ora?' · '+esc(e.ora):''}</small><h4>${esc(e.titolo)}</h4>${bollino(bigliettoDi(rid(e)))}${e.prop?`<p class="by">${avatar(e.autore,18)} ${e.ok?'approvata, ':''}proposta di ${esc(e.autore)}</p>`:''}${(e.note||e.nota)?`<p>${esc((e.note||e.nota).slice(0,160))}</p>`:''}${staTxt(e)}${rbar(rid(e),e.prop?e.voti:null,e.prop?`${e.data}|${e.id}`:null)}
 <div class="acts"><a class="btn pri" href="${arrivo(e,ME)}" target="_blank" rel="noopener">Come arrivo</a><a class="btn" href="${esc(gmap(e))}" target="_blank" rel="noopener">Google Maps</a><a class="btn" href="#g${e.d+1}">Giorno ${e.d+1}</a></div></div></div>`}
function disegna(fit){if(!map)return;MK.forEach(m=>m.remove());MK=[];const giorno=filter!=null&&!OPZ.tutto,evs=evMappa(),ps=propMappa();
 evs.forEach(e=>{const el=pinEl(e,giorno?e.n:e.d+1,(e.tipo==='hotel'?'hotel ':'')+(e.fonte==='gruppo'?'grp ':'')+(e.id===selId?'sel':''));
  const pop=new maplibregl.Popup({offset:30,maxWidth:'290px'}).setHTML(popHTML(e));pop.on('open',()=>{riempiFoto(pop.getElement());seleziona(e.id,false)});
  const m=new maplibregl.Marker({element:el,anchor:'bottom'}).setLngLat([e.lng,e.lat]).setPopup(pop).addTo(map);m._id=e.id;MK.push(m)});
 if(giorno){const h=sequenza(filter)[0];if(h&&h.partenza){const el=pinEl({...h,partenza:true},'H','hotel');el.setAttribute('aria-label','Partenza: '+h.titolo);const m=new maplibregl.Marker({element:el,anchor:'bottom'}).setLngLat([h.lng,h.lat]).setPopup(new maplibregl.Popup({offset:30,maxWidth:'260px'}).setHTML(`<div class="bd"><small>Si parte da</small><b style="display:block">${esc(h.titolo)}</b></div>`)).addTo(map);m._id='h-'+h.id;MK.push(m)}}
 ps.forEach(p=>{const el=pinEl(p,(p.autore||'?')[0],'prop');el.setAttribute('aria-label',`Proposta di ${p.autore}: ${p.titolo}`);el.title=`Proposta di ${p.autore} · ${p.nv} voti`;el.insertAdjacentHTML('beforeend',`<i class="ptag">proposta${p.nv?' · '+p.nv+' sì':''}</i>`);const pop=new maplibregl.Popup({offset:22,maxWidth:'300px'}).setHTML(`<div class="pop"><div class="bd">${propCard(p)}</div></div>`);
  const m=new maplibregl.Marker({element:el,anchor:'bottom'}).setLngLat([p.lng,p.lat]).setPopup(pop).addTo(map);m._id=p.id;MK.push(m)});
 rotta();disegnaIdee();carosello(evs,ps);tline();if(fit)inquadra(evs.concat(ps))}
function inquadra(pts=evMappa().concat(propMappa())){if(!map||!pts.length)return;if(filter==null&&!OPZ.tutto){const tk=pts.filter(e=>V.giorni[e.d]?.zona==='Tokyo');if(tk.length)pts=tk}
 const b=new maplibregl.LngLatBounds();pts.forEach(e=>b.extend([e.lng,e.lat]));const ph=($('#mpanel')||{}).offsetHeight||0;map.fitBounds(b,{padding:{top:80,left:innerWidth>860?40:36,right:70,bottom:ph+30},maxZoom:16,duration:700})}
function seleziona(id,vola=true){selId=id;MK.forEach(m=>{const p=m.getElement().querySelector('.pin');p&&p.classList.toggle('sel',m._id===id)});
 $$('.card.sel,.cc.sel').forEach(x=>x.classList.remove('sel'));$$(`[data-sel="${id}"]`).forEach(x=>x.classList.add('sel'));
 const cc=$(`.cc[data-sel="${id}"]`);if(cc&&!carScroll){if(PS===2)cc.scrollIntoView({block:'nearest',behavior:'smooth'});else cc.parentNode.scrollTo({left:cc.offsetLeft-12,behavior:'smooth'})}
 if(filter!=null&&!OPZ.tutto&&map){try{setAlt((TL||giornata(filter)).legs.findIndex(l=>l.B.id===id))}catch(e){}}
 const m=MK.find(x=>x._id===id);if(vola&&m)map.flyTo({center:m.getLngLat(),zoom:Math.max(map.getZoom(),15.5),duration:700});const e=PIANO.find(x=>x.id===id);if(e&&vola)evidenzia(e)}
const apriPin=id=>{const m=MK.find(x=>x._id===id);if(m&&!m.getPopup().isOpen())m.togglePopup()};
let carScroll=false,carT;
function carosello(evs,ps){const c=$('#carousel');c.innerHTML=evs.concat(ps).map(e=>`<div class="cc" data-sel="${esc(e.id)}" style="--c:${e.prop&&!e.ok?PCOL[e.autore]:col(e.d)}">${ph(e.wiki,240,'','',e.d+1,e.titolo)}<div><small>${e.prop&&!e.ok?'Proposta di '+esc(e.autore):(filter!=null&&!OPZ.tutto?e.n+' · ':'G'+(e.d+1)+' · ')+esc(e.ora||'')}</small><b>${esc(e.titolo)}</b><div class="acts"><a class="btn pri" href="${arrivo(e,ME)}" target="_blank" rel="noopener">Come arrivo</a><button class="btn" data-pop="${esc(e.id)}">Dettagli</button></div></div></div>`).join('');riempiFoto(c)}
$('#carousel').addEventListener('scroll',()=>{if(PS!==1)return;carScroll=true;clearTimeout(carT);carT=setTimeout(()=>{const c=$('#carousel'),mid=c.scrollLeft+c.clientWidth/2;let best=null,bd=1e9;c.querySelectorAll('.cc').forEach(x=>{const d=Math.abs(x.offsetLeft+x.clientWidth/2-mid);if(d<bd){bd=d;best=x}});if(best)seleziona(best.dataset.sel,true);carScroll=false},160)});

/* ---------- 1. percorsi veri a piedi e in auto (Valhalla su OpenStreetMap), salvati sul telefono ---------- */
const VAL=['https://valhalla1.openstreetmap.de/route'];
let RT=store.get('bij:rt',{}),rtCoda=[],rtVia=false,rtT=null;
function dec6(s){const c=[];let i=0,lat=0,lng=0;while(i<s.length){let b,sh=0,r=0;do{b=s.charCodeAt(i++)-63;r|=(b&31)<<sh;sh+=5}while(b>=32);lat+=r&1?~(r>>1):r>>1;sh=0;r=0;do{b=s.charCodeAt(i++)-63;r|=(b&31)<<sh;sh+=5}while(b>=32);lng+=r&1?~(r>>1):r>>1;c.push([lng/1e6,lat/1e6])}return c}
const rtKey=(a,b,m)=>m+':'+[a.lat,a.lng,b.lat,b.lng].map(x=>(+x).toFixed(4)).join(',');
function vero(a,b,m){if(km(a.lat,a.lng,b.lat,b.lng)<.05)return null;const k=rtKey(a,b,m),v=RT[k];if(v){if(v==='x')return null;const j=v.lastIndexOf('|'),c=dec6(v.slice(0,j)),d=km(a.lat,a.lng,b.lat,b.lng),lim=Math.max(3,d*2.5);
  if(!c.length||c.some(p=>km(p[1],p[0],a.lat,a.lng)>lim&&km(p[1],p[0],b.lat,b.lng)>lim)){RT[k]='x';return null}return{c,min:Math.round(+v.slice(j+1)/60)}}
 if(!rtCoda.some(q=>q.k===k)&&rtCoda.length<40)rtCoda.push({k,a,b,m});rtVai();return null}
async function rtVai(){if(rtVia||!navigator.onLine)return;rtVia=true;let nuovi=0;
 while(rtCoda.length){const q=rtCoda.shift();const body={locations:[{lat:q.a.lat,lon:q.a.lng},{lat:q.b.lat,lon:q.b.lng}],costing:q.m==='piedi'?'pedestrian':'auto',units:'kilometers'};
  try{const r=await fetch(VAL[0]+'?json='+enc(JSON.stringify(body)));if(r.status===400){RT[q.k]='x';continue}if(!r.ok)throw r.status;const j=await r.json(),L=j.trip&&j.trip.legs&&j.trip.legs[0];
   if(L){RT[q.k]=L.shape+'|'+Math.round(j.trip.summary.time);nuovi++}}catch(e){rtCoda.length=0;break}
  await new Promise(r=>setTimeout(r,250))}
 rtVia=false;if(nuovi){const ks=Object.keys(RT);if(ks.length>400)ks.slice(0,ks.length-400).forEach(k=>delete RT[k]);store.set('bij:rt',RT);clearTimeout(rtT);rtT=setTimeout(()=>{rotta();if(TL&&!tPlay)tline()},150)}}

/* ---------- 2. evidenzia l'edificio della tappa (solo mappe vettoriali con edifici 3D) ---------- */
let HL=null;
function strBuild(){return map.getStyle().layers.filter(l=>l['source-layer']==='building').map(l=>l.id)}
function evidenzia(e){if(!map||!map.getSource('hl'))return;e=null;/* edifici colorati tolti: il 3D resta quello della mappa */if(!e||e.lat==null){map.getSource('hl').setData({type:'FeatureCollection',features:[]});HL=null;return}HL=e;
 const go=()=>{if(HL!==e)return;const L=strBuild();if(!L.length)return;const pt=map.project([e.lng,e.lat]);let f=map.queryRenderedFeatures([[pt.x-6,pt.y-6],[pt.x+6,pt.y+6]],{layers:L});
  if(!f.length)f=map.queryRenderedFeatures([[pt.x-26,pt.y-26],[pt.x+26,pt.y+26]],{layers:L});const b=f.find(x=>/Polygon/.test(x.geometry.type));
  map.getSource('hl').setData({type:'FeatureCollection',features:b?[{type:'Feature',properties:{h:(b.properties.render_height||b.properties.height||12)+1.5,m:b.properties.render_min_height||0,c:col(e.d??0)},geometry:b.geometry}]:[]})};
 if(map.loaded()&&!map.isMoving())go();map.once('idle',go)}

/* ---------- 3. sole, cielo e notte all'ora dello slider ---------- */
const SOL=(()=>{const rad=Math.PI/180,e=rad*23.4397;
 const pos=(date,lat,lng)=>{const d=date.valueOf()/864e5-.5+2440588-2451545,M=rad*(357.5291+.98560028*d),C=rad*(1.9148*Math.sin(M)+.02*Math.sin(2*M)+.0003*Math.sin(3*M)),L=M+C+rad*102.9372+Math.PI;
  const dec=Math.asin(Math.sin(e)*Math.sin(L)),ra=Math.atan2(Math.sin(L)*Math.cos(e),Math.cos(L)),H=rad*(280.16+360.9856235*d)-rad*-lng-ra,phi=rad*lat;
  return{alt:Math.asin(Math.sin(phi)*Math.sin(dec)+Math.cos(phi)*Math.cos(dec)*Math.cos(H))/rad,az:(Math.atan2(Math.sin(H),Math.cos(H)*Math.sin(phi)-Math.tan(dec)*Math.cos(phi))/rad+180)%360}};
 const quando=(data,m,lat,lng)=>new Date(`${data}T${hm(m)}:00+09:00`);
 const orari=(data,lat,lng)=>{let alba=null,tram=null,prev=null;for(let m=240;m<=1260;m+=2){const a=pos(quando(data,m),lat,lng).alt;if(prev!=null){if(prev<-.833&&a>=-.833)alba=m;if(prev>=-.833&&a<-.833)tram=m}prev=a}return{alba,tram}};
 return{pos,quando,orari}})();
const mixc=(a,b,f)=>{const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),x=p(a),y=p(b);return'#'+x.map((v,i)=>Math.round(v+(y[i]-v)*Math.max(0,Math.min(1,f))).toString(16).padStart(2,'0')).join('')};
const FASI=[[-12,'#0a1330','#1d2550','#3a4a7a',.55],[-4,'#28366a','#c97a62','#ffb38a',.32],[2,'#6e8fc8','#ffc58f','#ffcf9e',.08],[12,'#8cc4f5','#e9f3fc','#fff5e6',0],[90,'#7fbdf3','#e6f2fc','#ffffff',0]];
function luce(alt){let k=0;while(k<FASI.length-1&&alt>FASI[k+1][0])k++;const A=FASI[k],B=FASI[Math.min(k+1,FASI.length-1)],f=B===A?0:(alt-A[0])/(B[0]-A[0]);
 return{sky:mixc(A[1],B[1],f),hor:mixc(A[2],B[2],f),luce:mixc(A[3],B[3],f),notte:A[4]+(B[4]-A[4])*Math.max(0,Math.min(1,f))}}
let CIELO=null;
function cielo(data,m,lat,lng){if(!map||!map.getLayer('notte'))return;if(data==null){CIELO=null;try{map.setSky({});map.setLight({anchor:'viewport',position:[1.15,210,30],color:'#ffffff',intensity:.5})}catch(e){}if(map.getLayer('notte'))map.setPaintProperty('notte','fill-opacity',0);return}
 const s=SOL.pos(SOL.quando(data,m),lat,lng),c=luce(s.alt);CIELO={data,m,lat,lng,alt:s.alt};
 try{map.setSky({'sky-color':c.sky,'horizon-color':c.hor,'fog-color':c.hor,'sky-horizon-blend':.6,'horizon-fog-blend':.5,'fog-ground-blend':.6,'atmosphere-blend':.8});
  map.setLight({anchor:'map',position:[1.5,s.az,Math.max(5,Math.min(88,90-Math.max(s.alt,2)))],color:c.luce,intensity:s.alt>0?.55:.25})}catch(e){}
 if(map.getLayer('notte'))map.setPaintProperty('notte','fill-opacity',Math.min(c.notte,.38))}

/* ---------- 4. rilievo 3D e il Fuji dal finestrino ---------- */
const DEM={type:'raster-dem',tiles:['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],encoding:'terrarium',tileSize:256,maxzoom:14,attribution:'Rilievo © Mapzen, AWS Terrain Tiles'};
let TRE=store.get('bij:3d',false);
function terreno(on){if(!map||!map.getSource('dem'))return;try{map.setTerrain(on?{source:'dem',exaggeration:1.35}:null)}catch(e){}if(map.getLayer('rilievo'))map.setLayoutProperty('rilievo','visibility',on?'visible':'none')}
const FUJI=[138.7274,35.3606];
const TOKAIDO=[['Tokyo',139.7671,35.6812],['Shinagawa',139.7387,35.6285],['',139.66,35.56],['Shin-Yokohama',139.6176,35.5075],['',139.36,35.33],['Odawara',139.1554,35.2564],['Atami',139.0779,35.1037],['Mishima',138.9110,35.1263],['',138.80,35.135],['Shin-Fuji',138.6633,35.1424],['',138.53,35.07],['Shizuoka',138.3890,34.9716],['Kakegawa',138.0146,34.7693],['Hamamatsu',137.7350,34.7039],['Toyohashi',137.3817,34.7629],['',137.09,34.95],['Nagoya',136.8815,35.1709],['Gifu-Hashima',136.6857,35.3155],['Maibara',136.2900,35.3146],['',136.02,35.07],['Kyoto',135.7588,34.9858]];
const brg=(a,b)=>{const r=Math.PI/180,y=Math.sin((b[0]-a[0])*r)*Math.cos(b[1]*r),x=Math.cos(a[1]*r)*Math.sin(b[1]*r)-Math.sin(a[1]*r)*Math.cos(b[1]*r)*Math.cos((b[0]-a[0])*r);return(Math.atan2(y,x)/r+360)%360};
const angd=(a,b)=>((b-a+540)%360)-180;
let FJ=null;
function fujiScena(verso){if(!map)return;if(FJ){fujiStop();return}stopPlay();
 const andata=verso!=='ritorno',P=andata?TOKAIDO:TOKAIDO.slice().reverse(),C=P.map(p=>[p[1],p[2]]),{s:tot,d}=lungh(C);
 const g=V.giorni.find(g=>g.data===(andata?'2027-01-03':'2027-01-08')),sh=g&&g.eventi.find(e=>e.tipo==='treno'&&/Shinkansen/.test(e.titolo)),dep=minDi(sh?sh.ora:(andata?'10:30':'11:00')),durata=135,data=g?g.data:'2027-01-03';
 const kFuji=P.findIndex(p=>p[0]==='Shin-Fuji'),dFuji=d[kFuji],lato=andata?'a destra (posti dal lato D-E)':'a sinistra (posti dal lato A)',tFuji=hm(dep+durata*dFuji/tot);
 const hud=document.createElement('div');hud.id='fujihud';hud.innerHTML=`<div class="fh1"><b>Shinkansen ${andata?'Tokyo → Kyoto':'Kyoto → Tokyo'}</b><span class="fclock"></span></div><div class="fh2"></div><div class="fbar"><i></i></div><div class="acts"><button class="btn sm" data-fj="pausa">Pausa</button><button class="btn sm" data-fj="esci">Chiudi</button></div>`;
 $('#mapwrap').appendChild(hud);document.body.classList.add('fujimode');
 terreno(true);const el=document.createElement('div');el.className='treno';el.innerHTML=ico('treno',18);const mk=new maplibregl.Marker({element:el}).setLngLat(C[0]).addTo(map);
 const fe=document.createElement('div');fe.className='fujilab';fe.innerHTML='<b>Monte Fuji</b><small>3.776 m</small>';const fm=new maplibregl.Marker({element:fe,anchor:'bottom'}).setLngLat(FUJI).addTo(map);
 FJ={fm,mk,hud,P,C,tot,d,dep,durata,data,dFuji,lato,tFuji,f:0,pausa:false,last:0,brg:brg(C[0],C[1]),andata};
 hud.addEventListener('click',e=>{const b=e.target.closest('[data-fj]');if(!b)return;if(b.dataset.fj==='esci')fujiStop();else{FJ.pausa=!FJ.pausa;b.textContent=FJ.pausa?'Riprendi':'Pausa'}});
 map.jumpTo({center:C[0],zoom:12,pitch:70,bearing:FJ.brg});const DUR=matchMedia('(prefers-reduced-motion:reduce)').matches?90000:50000;
 const passo=ts=>{if(!FJ)return;if(!FJ.last)FJ.last=ts;const dt=ts-FJ.last;if(dt<33){FJ.raf=requestAnimationFrame(passo);return}FJ.last=ts;
  if(!FJ.pausa){const x=FJ.f*tot,vicino=Math.abs(x-dFuji)<45;FJ.f=Math.min(1,FJ.f+dt/DUR*(vicino?.45:1))}
  const x=FJ.f*tot,p=lungoLinea(C,FJ.f),avanti=lungoLinea(C,Math.min(1,FJ.f+.004)),dir=brg(p,avanti),m=dep+durata*FJ.f,dfj=x-dFuji,vede=dfj>-75&&dfj<55;
  const verso=vede?brg(p,FUJI):(dir+(andata?62:-62)+360)%360;FJ.brg=(FJ.brg+angd(FJ.brg,verso)*.06+360)%360;
  mk.setLngLat(p);map.jumpTo({center:p,bearing:FJ.brg,pitch:vede?74:68,zoom:vede?11.2:12.2});
  const k=FJ.d.findIndex(v=>v>x),prox=P.slice(Math.max(1,k)).find(q=>q[0]);
  hud.querySelector('.fclock').textContent=hm(m);hud.querySelector('.fbar i').style.width=(FJ.f*100)+'%';
  hud.querySelector('.fh2').innerHTML=vede?`<b class="fnow">Il Fuji è ${esc(lato)}</b><small>Verso le ${tFuji}, quando il treno attraversa il fiume Fuji vicino a Shin-Fuji. Orario indicativo.</small>`:`<span>Prossima: <b>${esc(prox?prox[0]:'arrivo')}</b></span><small>${dfj<0?`Il Fuji compare tra circa ${Math.max(1,Math.round(-dfj/tot*durata))} min, ${esc(lato)}`:'Il Fuji è alle spalle'}</small>`;
  if(CIELO!==null||true)cielo(data,m,p[1],p[0]);
  if(FJ.f>=1){hud.querySelector('.fh2').innerHTML=`<b>Arrivo a ${andata?'Kyoto':'Tokyo'} verso le ${hm(dep+durata)}</b><small>Il Fuji si vede ${esc(lato)} verso le ${tFuji}, se il cielo è limpido.</small>`;return}
  FJ.raf=requestAnimationFrame(passo)};
 FJ.raf=requestAnimationFrame(passo)}
function fujiStop(){if(!FJ)return;cancelAnimationFrame(FJ.raf);FJ.mk.remove();FJ.fm.remove();FJ.hud.remove();FJ=null;document.body.classList.remove('fujimode');terreno(false);cielo(null);map.easeTo({pitch:TRE?50:0,bearing:TRE?-17:0,duration:600});if(TL)tline()}

/* ---------- percorsi del giorno sulla mappa: verde il consigliato, grigio le alternative ---------- */
const VERDE='#12a150';
function sequenza(i){const T=tappe(i).filter(e=>e.lat!=null&&/^\d\d:\d\d$/.test(e.ora||'')),h=hotelPrima(i-1,'99');
 const seq=(h&&V.giorni[i].zona===V.giorni[i-1]?.zona&&T.length&&km(h.lat,h.lng,T[0].lat,T[0].lng)>.08?[{...h,partenza:true}]:[]).concat(T);return seq}
function geomLeg(da,a,L){const S=ST?ST.stazioni:[],dritta=[[da.lng,da.lat],[a.lng,a.lat]];let tg=null;
 if(L&&L.tr){const st=[];L.tr.corse.forEach(t=>t.fermate.forEach(k=>{const p=[S[k].lon,S[k].lat],u=st.at(-1);if(!u||u[0]!==p[0]||u[1]!==p[1])st.push(p)}));
  if(st.length){const s0={lng:st[0][0],lat:st[0][1]},s1={lng:st.at(-1)[0],lat:st.at(-1)[1]},w1=vero(da,s0,'piedi'),w2=vero(s1,a,'piedi');tg=[...(w1?w1.c:[[da.lng,da.lat]]),...st,...(w2?w2.c:[[a.lng,a.lat]])]}}
 const strada=m=>{const v=vero(da,a,m);return v?v.c:dritta};
 if(!L||L.lungo)return{best:dritta,alt:null};const k=L.best;
 const best=k==='treno'&&tg?tg:k==='piedi'?strada('piedi'):(k==='taxi'||k==='bus')?strada('auto'):dritta;
 const alt=k==='treno'?(L.tx?strada('auto'):strada('piedi')):tg;return{best,alt}}
function giornata(i){const seq=sequenza(i),legs=[],min=t=>{const[a,b]=t.split(':').map(Number);return a*60+b};
 seq.forEach((e,k)=>{e.t=e.partenza?null:min(e.ora)});
 for(let k=1;k<seq.length;k++){const A=seq[k-1],B=seq[k];if(km(A.lat,A.lng,B.lat,B.lng)<=.08)continue;const L=legInfo(A,B);const G=geomLeg(A,B,L);
  let dur=L&&!L.lungo&&L.min?L.min:L&&L.lungo?Math.max(30,(B.t-(A.fine&&/^\d\d:\d\d$/.test(A.fine)?min(A.fine):A.t||B.t-60))):15;
  const fa=A.fine&&/^\d\d:\d\d$/.test(A.fine)&&!(L&&L.lungo)?min(A.fine):null;let arr=B.t,dep=arr-dur;
  if(fa!=null&&fa>=(A.t??0)&&fa+dur<=B.t){dep=fa;arr=fa+dur}if(A.t!=null&&dep<A.t){dep=A.t;arr=Math.max(arr,dep+1)}if(A.partenza)A.t=dep;B.arrivo=arr;legs.push({A,B,L,G,dep,arr})}
 const t0=seq.length?(seq[0].t??0):0,t1=seq.length?Math.max(...seq.map(e=>e.t??0))+45:60;return{seq,legs,t0,t1}}
function lungh(c){let s=0;const d=[0];for(let k=1;k<c.length;k++){s+=km(c[k-1][1],c[k-1][0],c[k][1],c[k][0]);d.push(s)}return{s,d}}
function lungoLinea(c,f){const{s,d}=lungh(c),x=s*f;for(let k=1;k<c.length;k++)if(d[k]>=x){const u=(x-d[k-1])/((d[k]-d[k-1])||1);return[c[k-1][0]+(c[k][0]-c[k-1][0])*u,c[k-1][1]+(c[k][1]-c[k-1][1])*u]}return c.at(-1)}
const NOMEK={piedi:'a piedi',treno:'in treno e metro',taxi:'in taxi',bus:'in bus',lungo:'in treno'};
function featLegs(){if(filter==null||OPZ.tutto||OPZ.percorsi===false)return[];const F=[];
 giornata(filter).legs.forEach((l,i)=>{const L=l.L,lab=L&&!L.lungo?`${L.sum.nome}${L.min?' ~'+L.min+' min':''}${L.sum.pp?' · ¥'+L.sum.pp:''}`:'treno';
  const vp=L&&L.best==='piedi'?vero(l.A,l.B,'piedi'):null,lab2=vp?`a piedi ~${Math.max(1,vp.min)} min`:lab;const alab=l.G.alt?(L.best==='treno'?'taxi o a piedi':'treno e metro'):'';F.push({type:'Feature',properties:{best:1,i,lab:lab2,alab,k:L?L.best:'piedi',da:l.A.titolo,a:l.B.titolo,o:`${l.A.lat},${l.A.lng}`,d:`${l.B.lat},${l.B.lng}`},geometry:{type:'LineString',coordinates:l.G.best}});
  if(l.G.alt)F.push({type:'Feature',properties:{best:0,i,lab:alab,k:'alt'},geometry:{type:'LineString',coordinates:l.G.alt}})});return F}
function rotta(){if(!map||!map.getSource('rotta'))return;map.getSource('rotta').setData({type:'FeatureCollection',features:featLegs()})}

/* ---------- slider della giornata ---------- */
let TL=null,tDot=null,tPlay=null;
const hm=m=>{m=((Math.round(m)%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
function tline(){const box=$('#mpanel');if(!box)return;const on=document.body.classList.contains('mapmode')||innerWidth>860;
 const G=map&&on&&filter!=null&&!OPZ.tutto?giornata(filter):null;
 if(!G||G.seq.length<2){box.classList.remove('tl');if(tDot){tDot.remove();tDot=null}stopPlay();TL=null;evidenzia(null);if(!FJ)cielo(null);
  const n=evMappa().length;box.querySelector('.tora').textContent=filter==null||OPZ.tutto?'Tutto il viaggio':`Giorno ${filter+1}`;box.querySelector('.tsun').textContent='';box.querySelector('.tnow').textContent=`${n} tappe sulla mappa`;box.querySelector('.tlab').textContent='';box.querySelector('.tfuji').hidden=true;misuraPanel();return}
 TL=G;box.classList.add('tl');
 const sp=G.t1-G.t0||1,r=box.querySelector('input');r.min=G.t0;r.max=G.t1;r.step=5;if(!(+r.value>=G.t0&&+r.value<=G.t1))r.value=G.t0;
 box.querySelector('.tticks').innerHTML=G.seq.filter(e=>e.t!=null).map((e,k)=>`<span style="left:${(e.t-G.t0)/sp*100}%;--c:${e.partenza?'#15171c':col(e.d)}" title="${esc(e.ora+' '+e.titolo)}">${e.partenza?'H':e.n||k}</span>`).join('');
 box.querySelector('.tfuji').hidden=!['2027-01-03','2027-01-08'].includes(V.giorni[filter].data);posTL(+r.value,false);misuraPanel()}
function posTL(t,segui){if(!TL)return;const G=TL;let p=null,txt='',sub='';
 const l=G.legs.find(l=>t>=l.dep&&t<l.arr);
 if(l){const f=(t-l.dep)/((l.arr-l.dep)||1),c=l.G.best;p=lungoLinea(c,f);const k=l.L?l.L.best:'piedi';
  if(k==='treno'&&l.L.tr){const tr=l.L.tr,S=ST.stazioni;let acc=tr.pa,corsa=null;for(const c2 of tr.corse){if((t-l.dep)>=acc&&(t-l.dep)<acc+c2.min){corsa=c2;break}acc+=c2.min+5}
   txt=corsa?`In treno: ${ST.linee[corsa.l].n} verso ${corsa.verso||nomeS(corsa.ultima)}`:'A piedi verso la stazione o tra un treno e l\'altro';}
  else txt=`${NOMEK[k]||'in viaggio'} verso ${l.B.titolo}`.replace(/^./,c=>c.toUpperCase());
  sub=`arrivo verso le ${hm(l.arr)} a ${l.B.titolo}`}
 else{let e=G.seq[0];for(const x of G.seq){const ta=x.arrivo!=null?Math.min(x.arrivo,x.t??x.arrivo):x.t;if(ta!=null&&ta<=t)e=x}p=[e.lng,e.lat];txt=e.partenza?`Partenza da ${e.titolo}`:`${e.titolo}`;
  const nx=G.legs.find(l=>l.dep>t);sub=e.partenza?'':e.arrivo!=null&&e.t!=null&&t<e.t?`arrivati, la tappa inizia alle ${e.ora}`:nx?`fino alle ${hm(nx.dep)} circa, poi ${(nx.L&&nx.L.sum?nx.L.sum.nome:'spostamento').toLowerCase()}`:'ultima tappa del giorno';if(!e.partenza&&e.id&&selId!==e.id)seleziona(e.id,false)}
 const box=$('#mpanel');box.querySelector('.tora').textContent=hm(t);box.querySelector('.tnow').textContent=txt;box.querySelector('.tlab').textContent=sub;
 if(!tDot){const el=document.createElement('div');el.className='tdot';el.title='Dove siete a quest\'ora';tDot=new maplibregl.Marker({element:el}).setLngLat(p).addTo(map)}else tDot.setLngLat(p);
 tDot.getElement().style.setProperty('--c',col(filter));tDot.getElement().dataset.ora=hm(t);const prev=TL.pos;TL.pos=p;
 const g=V.giorni[filter],ss=SOL.orari(g.data,p[1],p[0]);box.querySelector('.tsun').textContent=ss.alba?`Alba ${hm(ss.alba)} · tramonto ${hm(ss.tram)}`:'';if(tPlay)cielo(g.data,t,p[1],p[0]);else if(CIELO&&!FJ)cielo(null);
 const ferma=!l?G.seq.filter(x=>x.t!=null||x.partenza).reduce((a,x)=>{const ta=x.arrivo!=null?Math.min(x.arrivo,x.t??x.arrivo):x.t;return ta!=null&&ta<=t?x:a},G.seq[0]):null;
 if(ferma&&ferma.id&&TL.ferma!==ferma.id){TL.ferma=ferma.id;evidenzia(ferma);if(tPlay&&!ferma.partenza){TL.hold=16;setTimeout(()=>{if(tPlay)apriPin(ferma.id)},350)}}else if(!ferma&&TL.ferma){TL.ferma=null;if(tPlay)$$('.maplibregl-popup').forEach(x=>x.remove())}
 if(segui){const mov=prev&&km(prev[1],prev[0],p[1],p[0])>.005;if(mov)TL.brg=(TL.brg??map.getBearing())+angd(TL.brg??map.getBearing(),brg(prev,p))*.35;
  const z=l?(l.L&&l.L.best==='treno'?14.2:16.2):16.6;map.easeTo({center:p,duration:tPlay?260:500,zoom:z,pitch:62,bearing:TL.brg??map.getBearing()})}}
let PSprima=null;
function stopPlay(){if(tPlay){clearInterval(tPlay);tPlay=null;const b=$('#mpanel .tplay');if(b){b.classList.remove('on');b.setAttribute('aria-label','Riproduci la giornata')}if(!FJ)cielo(null);if(PSprima!=null){panelState(PSprima,false);PSprima=null}}}
function initTline(){const box=$('#mpanel'),r=box.querySelector('input');panelState(PS,false);
 r.addEventListener('input',()=>{stopPlay();posTL(+r.value,false)});
 box.querySelector('.tplay').addEventListener('click',()=>{if(tPlay){stopPlay();return}if(+r.value>=+r.max)r.value=r.min;const b=box.querySelector('.tplay');b.classList.add('on');b.setAttribute('aria-label','Pausa');
  if(PS>0){PSprima=PS;panelState(0,false)}
  tPlay=setInterval(()=>{if(TL&&TL.hold>0){TL.hold--;return}const v=Math.min(+r.max,+r.value+5);r.value=v;posTL(v,true);if(v>=+r.max)stopPlay()},matchMedia('(prefers-reduced-motion:reduce)').matches?400:90)});
 box.querySelector('.tticks').addEventListener('click',e=>{const s=e.target.closest('span');if(!s)return;const G=TL,k=[...s.parentNode.children].indexOf(s),x=G.seq.filter(e=>e.t!=null)[k];if(x){r.value=x.t;posTL(x.t,true)}});
 box.querySelector('.tfuji').addEventListener('click',()=>fujiScena(V.giorni[filter].data==='2027-01-08'?'ritorno':'andata'));
 box.querySelector('.tkb').addEventListener('click',()=>{if(TL&&TL.pos)konbiniVicini({lng:TL.pos[0],lat:TL.pos[1]})})}

/* ---------- suggerimenti sulla mappa ---------- */
const EMO={visita:'torii',esperienza:'stella',cibo:'cibo',shopping:'borsa',evento:'calendario',notte:'luna',gita:'treno',partita:'pallone'};
let IMK=[];
function ideeMappa(){if(OPZ.idee===false)return[];const d=filter!=null&&!OPZ.tutto?V.giorni[filter].data:null;return IDEE.filter(x=>x.lat!=null&&(!d||x.giorni.includes(d)&&!chiusoIl(x,d)))}
function disegnaIdee(){if(!map)return;const L=ideeMappa(),z=map.getZoom(),es=MODO==='esplora',grp=es&&z<14.5,chiave=L.map(x=>x.id).join()+'|'+MODO+'|'+(grp?Math.floor(z*2):'n');
 if(chiave===disegnaIdee.k){IMK.forEach(m=>{const p=m.getPopup&&m.getPopup(),el=p&&p.getElement(),rb=el&&el.querySelector('.rbar');if(rb)rb.outerHTML=rbar(m._id)});return}
 disegnaIdee.k=chiave;IMK.forEach(m=>m.remove());IMK=[];$('#mapwrap').classList.toggle('zlo',z<15);
 let G=L.map(x=>[x]);
 if(grp){G=[];L.forEach(x=>{const p=map.project([x.lng,x.lat]),g=G.find(g=>Math.hypot(g.p.x-p.x,g.p.y-p.y)<44);if(g)g.push(x);else{const n=[x];n.p=p;G.push(n)}})}
 G.forEach(g=>{if(g.length>1){const el=document.createElement('button');el.className='icl';const lng=g.reduce((a,x)=>a+x.lng,0)/g.length,lat=g.reduce((a,x)=>a+x.lat,0)/g.length;
   el.innerHTML=`${ico(EMO[g[0].cat],14)}<span>${g.length}</span>`;el.setAttribute('aria-label',`${g.length} suggerimenti qui: avvicina`);
   el.addEventListener('click',ev=>{ev.stopPropagation();map.easeTo({center:[lng,lat],zoom:Math.min(17,z+2),duration:500})});
   const m=new maplibregl.Marker({element:el}).setLngLat([lng,lat]).addTo(map);m._id='grp';IMK.push(m);return}
  const x=g[0],el=document.createElement('button');el.className='ipin'+(es?'':' mini');el.style.setProperty('--k',CATC[x.cat]||'#555');el.setAttribute('aria-label',x.titolo);el.innerHTML=ico(EMO[x.cat],14);
  const pop=new maplibregl.Popup({offset:14,maxWidth:'300px'}).setHTML(`<div class="pop ipop" style="--k:${CATC[x.cat]}">${ph(x.wiki,560,'','',3,x.titolo)}<div class="bd"><div>${badge(x)}</div><h4>${esc(x.titolo)}</h4><p class="imeta"><span>${esc(x.orari)}</span><span>${esc(x.prezzo)}</span></p><p>${esc(x.sintesi.slice(0,170))}${x.sintesi.length>170?'…':''}</p>${rbar(x.id)}<div class="acts"><button class="btn pri" data-idea="${esc(x.id)}">Scheda</button><a class="btn" href="${arrivo(x,ME)}" target="_blank" rel="noopener">Come arrivo</a></div></div></div>`);
  pop.on('open',()=>{const el=pop.getElement();riempiFoto(el);const rb=el.querySelector('.rbar');if(rb)rb.outerHTML=rbar(x.id)});
  const m=new maplibregl.Marker({element:el}).setLngLat([x.lng,x.lat]).setPopup(pop).addTo(map);m._id=x.id;IMK.push(m)})}
function mostraIdea(id){const x=IDX[id];if(!x||x.lat==null)return;$('#sheet').classList.remove('on');
 const vai=()=>{if(OPZ.idee===false){OPZ.idee=true;store.set('bij:opz',OPZ);pannello()}if(!x.giorni.includes(V.giorni[filter??0]?.data)){filter=V.giorni.findIndex(g=>g.data===x.giorni[0]);chips();disegna(false)}else disegnaIdee();
  map.flyTo({center:[x.lng,x.lat],zoom:16,duration:700});setTimeout(()=>{const m=IMK.find(k=>k._id===id);if(m&&!m.getPopup().isOpen())m.togglePopup()},780)};
 if(innerWidth<=860&&location.hash!=='#mappa'){location.hash='#mappa';setTimeout(vai,200)}else vai()}

/* ---------- konbini e punti d'interesse da OpenStreetMap (Overpass) ---------- */
const OVP=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
const OVC={},OVF=new Map();let ovT=null,ovAvv=false;
function ovQuery(q){let p=Promise.reject();OVP.forEach(u=>{p=p.catch(()=>fetch(u,{method:'POST',body:'data='+enc(q),headers:{'Content-Type':'application/x-www-form-urlencoded'}}).then(r=>{if(!r.ok)throw r.status;return r.json()}))});return p}
const KBC=n=>/seven|セブン/i.test(n)?'#f58220':/family|ファミリー/i.test(n)?'#0a8a3c':/lawson|ローソン/i.test(n)?'#1b6ec2':/ministop|ミニストップ/i.test(n)?'#e5a800':'#6b7280';
const KBN=t=>t['brand:en']||t['name:en']||t.brand||t.name||'Konbini';
const POIK=t=>t.tourism==='viewpoint'?'Punto panoramico':t.tourism==='museum'?'Museo':t.tourism==='gallery'?'Galleria':t.tourism==='theme_park'?'Parco a tema':t.amenity==='place_of_worship'?(t.religion==='shinto'?'Santuario':t.religion==='buddhist'?'Tempio':'Luogo di culto'):t.historic?'Luogo storico':'Attrazione';
function ovElem(el){const t=el.tags||{},lat=el.lat??el.center?.lat,lng=el.lon??el.center?.lon;if(lat==null)return null;
 if(t.shop==='convenience'){const n=KBN(t);return{type:'Feature',id:el.id,properties:{k:'kb',n,c:KBC(n+' '+(t.name||''))},geometry:{type:'Point',coordinates:[lng,lat]}}}
 const n=t['name:it']||t['name:en']||t['name:latin']||t.name;if(!n)return null;
 return{type:'Feature',id:el.id,properties:{k:'poi',n,ja:t.name&&t.name!==n?t.name:'',tipo:POIK(t),wp:t.wikipedia||'',sito:t.website||''},geometry:{type:'Point',coordinates:[lng,lat]}}}
function ovAggiorna(){if(!map||!map.getSource('ov')||MODO!=='esplora')return;const on=OPZ.konbini!==false||OPZ.poi!==false;if(!on)return;
 if(map.getZoom()<14){if(!ovAvv&&document.body.classList.contains('mapmode')){ovAvv=true;toast('Avvicinate la mappa per vedere konbini e punti d\'interesse')}return}
 const b=map.getBounds(),c=.02,cells=[];for(let y=Math.floor(b.getSouth()/c);y<=Math.floor(b.getNorth()/c);y++)for(let x=Math.floor(b.getWest()/c);x<=Math.floor(b.getEast()/c);x++)cells.push([y,x]);
 cells.filter(([y,x])=>!OVC[y+'|'+x]).slice(0,6).forEach(([y,x])=>{const k=y+'|'+x,S=(y*c).toFixed(3),W=(x*c).toFixed(3),N=((y+1)*c).toFixed(3),E=((x+1)*c).toFixed(3),bb=`(${S},${W},${N},${E})`;
  OVC[k]=ovQuery(`[out:json][timeout:25];(node["shop"="convenience"]${bb};nwr["tourism"~"^(attraction|viewpoint|museum|gallery|theme_park)$"]${bb};nwr["amenity"="place_of_worship"]["wikipedia"]${bb};nwr["historic"]["wikipedia"]${bb};);out center tags 500;`)
   .then(j=>{j.elements.forEach(el=>{const f=ovElem(el);if(f)OVF.set(el.type+el.id,f)});ovDisegna()}).catch(()=>{delete OVC[k]})})}
function ovDisegna(){if(!map||!map.getSource('ov'))return;map.getSource('ov').setData({type:'FeatureCollection',features:[...OVF.values()].filter(f=>f.properties.k==='kb'?(MODO==='esplora'||KBQUI)&&OPZ.konbini!==false:MODO==='esplora'&&OPZ.poi!==false)})}
function konbiniVicini(p){KBQUI=true;if(OPZ.konbini===false){OPZ.konbini=true;store.set('bij:opz',OPZ);pannello()}ovDisegna();
 const near=()=>[...OVF.values()].filter(f=>f.properties.k==='kb').map(f=>({f,d:km(p.lat,p.lng,f.geometry.coordinates[1],f.geometry.coordinates[0])})).filter(x=>x.d<.8).sort((a,b)=>a.d-b.d);
 const mostra=()=>{const n=near();if(!n.length){toast('Nessun konbini trovato entro 800 m');return}const x=n[0],[lng,lat]=x.f.geometry.coordinates;
  const b=new maplibregl.LngLatBounds([p.lng,p.lat],[p.lng,p.lat]);n.slice(0,4).forEach(y=>b.extend(y.f.geometry.coordinates));map.fitBounds(b,{padding:{top:80,bottom:(($('#mpanel')||{}).offsetHeight||0)+40,left:60,right:80},maxZoom:17.5,duration:600});
  new maplibregl.Popup({offset:8,maxWidth:'260px'}).setLngLat([lng,lat]).setHTML(`<div class="bd"><b>${esc(x.f.properties.n)}</b><p>Il konbini più vicino: ${Math.round(x.d*1000)} m, circa ${piedi(x.d)} min a piedi.${n.length>1?` Altri ${n.length-1} entro 800 m.`:''}</p><div class="acts"><a class="btn pri" href="https://www.google.com/maps/dir/?api=1&origin=${p.lat},${p.lng}&destination=${lat},${lng}&travelmode=walking" target="_blank" rel="noopener">Portami lì</a></div></div>`).addTo(map)};
 if(near().length){mostra();return}
 const S=p.lat-.007,N=p.lat+.007,W=p.lng-.009,E=p.lng+.009;toast('Cerco i konbini qui intorno…');
 ovQuery(`[out:json][timeout:20];node["shop"="convenience"](${S},${W},${N},${E});out tags 200;`).then(j=>{j.elements.forEach(el=>{const f=ovElem(el);if(f)OVF.set(el.type+el.id,f)});ovDisegna();mostra()}).catch(()=>toast('Servizio konbini non raggiungibile: riprovate tra poco'))}
function ovPopup(f){const P=f.properties,[lng,lat]=f.geometry.coordinates,wp=P.wp&&P.wp.split(':'),wurl=wp&&wp.length>1?`https://${wp[0]}.wikipedia.org/wiki/${enc(wp.slice(1).join(':'))}`:'';
 const pop=new maplibregl.Popup({offset:8,maxWidth:'280px'}).setLngLat([lng,lat]).setHTML(P.k==='kb'?`<div class="bd"><b>${esc(P.n)}</b><p>Konbini · aperto di solito 24 ore: bancomat, snack, caffè, bagni.</p><div class="acts"><a class="btn pri" href="${arrivo({lat,lng},ME)}" target="_blank" rel="noopener">Come arrivo</a></div></div>`
  :`<div class="pop">${wp&&wp[0]==='en'?ph(wp.slice(1).join(':'),560):''}<div class="bd"><small>${esc(P.tipo)}</small><h4>${esc(P.n)}</h4>${P.ja?`<p lang="ja">${esc(P.ja)}</p>`:''}${vicinaTxt({lat,lng})}<div class="acts"><a class="btn pri" href="https://www.google.com/maps/search/?api=1&query=${enc(P.n)}%20${lat},${lng}" target="_blank" rel="noopener">Google Maps</a>${wurl?`<a class="btn" href="${wurl}" target="_blank" rel="noopener">Wikipedia</a>`:''}<button class="btn" data-qui="${lat},${lng}" data-nome="${esc(P.n)}">Proponi</button></div></div></div>`).addTo(map);
 pop.on('open',()=>riempiFoto(pop.getElement()));riempiFoto(pop.getElement())}

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
function chips(){const n=V.giorni.length;
 $('#chips').innerHTML=`<button class="dn" data-dn="-1" aria-label="Giorno precedente" ${filter==null?'disabled':''}>‹</button><select id="dsel" aria-label="Giornata sulla mappa"><option value="">Tutto</option>${V.giorni.map((g,i)=>`<option value="${i}">G${i+1} · ${esc(corto(g.data))}</option>`).join('')}</select><button class="dn" data-dn="1" aria-label="Giorno successivo" ${filter===n-1?'disabled':''}>›</button>`;
 $('#dsel').value=filter==null?'':String(filter)}
function vaiGiorno(f){KBQUI=false;setAlt(-1);if(document.body.classList.contains('mapmode')||innerWidth>860&&location.hash==='#mappa'){filter=f;selId=null;chips();disegna(true)}else location.hash=f==null?'#home':'#g'+(f+1)}
$('#chips').addEventListener('click',e=>{const b=e.target.closest('[data-dn]');if(!b)return;const n=V.giorni.length;let f=filter==null?(+b.dataset.dn>0?0:null):filter+(+b.dataset.dn);if(f!=null&&f<0)f=null;if(f!=null&&f>=n)f=n-1;vaiGiorno(f)});
$('#chips').addEventListener('change',e=>{if(e.target.id!=='dsel')return;vaiGiorno(e.target.value===''?null:+e.target.value)});
function renderView(){const h=location.hash.slice(1)||'home',m=h.match(/^g(\d+)$/);let html;
 if(m){const i=Math.min(Math.max(+m[1]-1,0),V.giorni.length-1);filter=i;html=vGiorno(i)}else if(h==='info')html=vInfo();else if(h==='spese'){html=vSpese();aggiornaCambio(false)}else if(h==='piano'){html=vPiano()}else{if(h!=='mappa')filter=null;html=vHome()}
 const SQ='#view .ascroll,#view .ptabs,#view .daynav,#view .cats',side=$('#side'),keep=renderView.h===h?{y:side.scrollTop,x:$$(SQ).map(e=>e.scrollLeft),d:$$('#view details').map(d=>d.open)}:null;
 $('#view').innerHTML=html;riempiFoto($('#view'));
 if(keep){$$(SQ).forEach((e,i)=>{if(keep.x[i])e.scrollLeft=keep.x[i]});$$('#view details').forEach((d,i)=>{if(keep.d[i]!=null)d.open=keep.d[i]});side.scrollTop=keep.y}
 renderView.h=h}
/* pollici e commenti: si aggiornano al loro posto, senza ridisegnare e riordinare la pagina */
function aggiornaRbar(){document.querySelectorAll('.rbar[data-rid]').forEach(b=>{const id=b.dataset.rid,leg=b.dataset.leg;let legacy=null;if(leg){const j=leg.indexOf('|');legacy=PROP[leg.slice(0,j)]?.[leg.slice(j+1)]?.voti||null}
 const t=document.createElement('div');t.innerHTML=rbar(id,legacy,leg||null);const n=t.firstElementChild;if(n&&n.outerHTML!==b.outerHTML)b.replaceWith(n)})}
function route(){const h=location.hash.slice(1)||'home';document.body.classList.toggle('mapmode',h==='mappa');
 $$('.top a.tab').forEach(a=>a.toggleAttribute('aria-current',a.hash.slice(1)===(h.match(/^g\d+$/)?'home':h)));
 $$('#bnav a').forEach(a=>a.toggleAttribute('aria-current',a.hash.slice(1)===(h.match(/^g\d+$/)?'home':h)));
 if(h==='mappa'){chips();if(map){map.resize();disegna(!route.fit);route.fit=true}return}
 tline();
 selId=null;renderView();$('#side').scrollTop=0;chips();if(map){map.resize();disegna(true)}}
document.addEventListener('click',async e=>{const t=e.target;
 const nu=t.closest('[data-nuova]');if(nu){const[d,f]=nu.dataset.nuova.split('|');apriForm(d||null,f||null);return}
 const qu=t.closest('[data-qui]');if(qu){const[la,ln]=qu.dataset.qui.split(',').map(Number);$$('.maplibregl-popup').forEach(p=>p.remove());apriForm(filter!=null?V.giorni[filter].data:null,null,{lat:la,lng:ln,nome:qu.dataset.nome||'',luogo:qu.dataset.nome||''});return}
 const rb=t.closest('.rbar [data-r]');if(rb){reagisci(rb);return}
 const sp=t.closest('[data-spesa]');if(sp){formSpesa(sp.dataset.spesa==='nuova'?null:sp.dataset.spesa);return}
 const stb=t.closest('[data-sptab]');if(stb){ST_T=stb.dataset.sptab;store.set('bij:sptab',ST_T);renderView();return}
 const vv=t.closest('[data-vvis]');if(vv){VVIS=vv.dataset.vvis;store.set('bij:vvis',VVIS);renderView();return}
 const cbt=t.closest('[data-cambio]');if(cbt){if(cbt.dataset.cambio==='agg')aggiornaCambio(true);else{const v=prompt('Quanti yen per 1 euro?',String(cambioOra()));const n=+String(v||'').replace(',','.');if(n>0&&n<1000){const o={valore:n,t:Date.now(),fonte:'scritto da '+(IO||'')};store.set('bij:cambio',o);if(FB&&IO)salva('cassa/cambio',{...o,autore:IO}).catch(()=>toast('Non salvato'));else{CAMBIO=o;renderView()}}}return}
 const sd=t.closest('[data-salda]');if(sd){if(!IO||!FB){accesso();return}const[da,a,e]=sd.dataset.salda.split('|');if(!confirm(`${da} ha dato ${eur(+e)} a ${a}?`))return;
  try{await FB.Db.set(FB.Db.push(FB.ref('spese')),{titolo:'Rimborso',importo:+e,valuta:'EUR',paga:da,per:{[a]:1},modo:'rimborso',data:adesso(V.viaggio.fuso).data,cat:'altro',cambio:cambioOra(),autore:IO,uid:FB.uid,t:Date.now()});toast('Rimborso registrato')}catch(err){toast('Non salvato: '+(err.code||err))}return}
 if(t.closest('[data-csv]')){csvSpese();return}
 const bs=t.closest('[data-bst]');if(bs){if(!IO){accesso();return}const j=bs.dataset.bst.lastIndexOf('|'),k=bs.dataset.bst.slice(0,j),st=bs.dataset.bst.slice(j+1);
  try{await salva('spunte/'+k,{...(SPU[k]||{}),stato:st,fatto:st==='fatto'||st==='pagato',chi:(SPU[k]||{}).chi||(st!=='no'?IO:''),autore:IO,t:Date.now()});
   if(st==='pagato'&&!(SPU[k]||{}).spesa){const o=biglietti().find(x=>x.k===k);formSpesa(null);setTimeout(()=>{const f=$('#sform');if(!f||!o)return;f.titolo.value=o.testo;if(o.data)f.data.value=o.data;if(f.cat)f.cat.value=/cena|pranzo|ristor/i.test(o.testo)?'cibo':'attivita';anteprima();toast('Inserite l\'importo pagato e chi ha pagato')},60)}}catch(err){toast('Non salvato: '+(err.code||err))}return}
 const ppr=t.closest('[data-pprop]');if(ppr){const k=ppr.dataset.pprop,d=$(`[data-pgiorno="${k}"]`).value,fa=$(`[data-pfascia="${k}"]`).value;proponiPosto(k,d,fa);return}
 const pf=t.closest('[data-pfix]');if(pf){const k=pf.dataset.pfix,q=prompt('Nome del posto e zona, come su Google Maps',LST[k]?.testo||'');if(!q)return;const c=await trovaPosto(q);if(!c){toast('Non trovato: provate con la zona, es. "Uobei Shibuya"');return}try{await salva(`liste/${k}/lat`,c.lat);await salva(`liste/${k}/lng`,c.lng);toast('Posizione trovata')}catch(err){toast('Non salvato')}return}
 const ic=t.closest('[data-ifcat]');if(ic){IF.cat=ic.dataset.ifcat;IF.n=24;store.set('bij:if',IF);renderView();return}
 if(t.closest('[data-ifpiu]')){IF.n+=24;store.set('bij:if',IF);const y=$('#side').scrollTop;renderView();$('#side').scrollTop=y;return}
 const pt=t.closest('[data-ptab]');if(pt){PT=pt.dataset.ptab;store.set('bij:ptab',PT);if(location.hash!=='#piano'){if(pt.tagName==='A')return;location.hash='#piano'}else{e.preventDefault();renderView()}return}
 const md=t.closest('[data-mod]');if(md){const x=PIANO.find(y=>y.id===md.dataset.mod);if(x)modifica(x);return}
 if(t.closest('[data-modreset]')){const f=$('#mform');$('#sheet').classList.remove('on');await salvaMod(f.dataset.rid,null);return}
 if(t.closest('[data-modtogli]')){const f=$('#mform');$('#sheet').classList.remove('on');await salvaMod(f.dataset.rid,{nascosto:true});return}
 const rm=t.closest('[data-rimetti]');if(rm){await salvaMod(rm.dataset.rimetti,null);return}
 const ot=t.closest('[data-ottimizza]');if(ot){ottimizza(+ot.dataset.ottimizza);return}
 const oa=t.closest('[data-ottapplica]');if(oa){const L=ottimizza.nuovo||[];$('#sheet').classList.remove('on');for(const x of L)if(x.e.ora!==x.ora){const k=rid(x.e),m=MOD[k];await salvaMod(k,{...(m&&m.data?{data:m.data}:{}),ora:x.ora})}return}
 const vs=t.closest('[data-vis]');if(vs){if(!IO){accesso();return}const k=vs.dataset.vis,on=VIS[k]?.[IO];try{await salva(`visti/${k}/${IO}`,on?null:Date.now())}catch(err){toast('Non salvato')}return}
 const di=t.closest('[data-desidea]');if(di){const x=IDX[di.dataset.desidea];if(!x||!IO||!FB)return;const o={lista:'desideri',testo:x.titolo,nota:x.sintesi.slice(0,300),idea:x.id,autore:IO,uid:FB.uid,t:Date.now(),fatto:false};if(x.lat!=null){o.lat=x.lat;o.lng=x.lng}
  try{await FB.Db.set(FB.Db.push(FB.ref('liste')),o);toast('Salvato nei desideri');di.outerHTML='<span class="muted">Già nei desideri</span>'}catch(err){toast('Non salvato: '+(err.code||err))}return}
 const ld=t.closest('[data-ldel]');if(ld){try{await salva('liste/'+ld.dataset.ldel,null)}catch(err){toast('Non tolto')}return}
 const dd=t.closest('[data-ddel]');if(dd){try{await salva('diario/'+dd.dataset.ddel,null)}catch(err){toast('Non eliminato')}return}
 const lg=t.closest('[data-lgiorno]');if(lg){const v=LST[lg.dataset.lgiorno];if(!v)return;if(v.idea&&IDX[v.idea]){scheda(IDX[v.idea]);return}apriForm(null,'mattina',v.lat!=null?{lat:v.lat,lng:v.lng}:null);setTimeout(()=>{const f=$('#pform');if(f){f.titolo&&(f.titolo.value=v.testo);if(f.nota&&v.nota)f.nota.value=v.nota;if(f.link&&v.link)f.link.value=v.link;f.dataset.lst=lg.dataset.lgiorno}},50);return}
 const cm=t.closest('[data-cm]');if(cm){const id=cm.dataset.cm;if(IDX[id])scheda(IDX[id]);else commenti(id);return}
 const ia=t.closest('[data-idea]');if(ia){const x=IDX[ia.dataset.idea];if(x)scheda(x);return}
 const pi=t.closest('[data-propidea]');if(pi){const x=IDX[pi.dataset.propidea],d=$('[data-ideagiorno]')?.value||x.giorni[0];if(x&&chiusoIl(x,d)){toast(`${corto(d)}: ${chiusoIl(x,d)}. Scegliete un altro giorno.`);return}if(x)proponiIdea(x,d);return}
 const im=t.closest('[data-ideamap]');if(im){mostraIdea(im.dataset.ideamap);return}
 const ec=t.closest('[data-editcom]');if(ec){const[id,k]=ec.dataset.editcom.split('|'),c=(CM[id]||{})[k];if(!c)return;const box=ec.closest('.com>div');
  box.innerHTML=`<small><b>${esc(c.autore)}</b> · modifica</small><form class="cform eform" data-eform="${esc(id)}|${esc(k)}"><textarea name="testo" maxlength="500" rows="3" required>${esc(c.testo)}</textarea><span class="comact"><button class="btn pri sm" type="submit">Salva</button><button class="btn sm" type="button" data-annullacom>Annulla</button></span></form>`;
  const ta=box.querySelector('textarea');ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);return}
 if(t.closest('[data-annullacom]')){commenti(CMID,true);return}
 const dc=t.closest('[data-delcom]');if(dc){const[id,k]=dc.dataset.delcom.split('|');try{await salva(`commenti/${id}/${k}`,null)}catch(err){toast('Non eliminato')}return}
 if(t.closest('[data-login]')){$('#sheet').classList.remove('on');CMID=null;accesso();return}
 const fd=t.closest('[data-fujiday]');if(fd){filter=+fd.dataset.fujiday;location.hash='#mappa';setTimeout(()=>{chips();disegna(false);fujiScena(V.giorni[filter].data==='2027-01-08'?'ritorno':'andata')},450);return}
 const gm=t.closest('[data-giornomappa]');if(gm){e.preventDefault();filter=+gm.dataset.giornomappa;location.hash='#mappa';setTimeout(()=>{chips();disegna(true);tline()},120);return}
 const l=t.closest('[data-like]');if(l){if(!IO){accesso();return}const[g,id]=l.dataset.like.split('|'),on=!!(PROP[g]?.[id]?.voti?.[IO]);try{await salva(`proposte/${g}/${id}/voti/${IO}`,on?null:true)}catch(err){toast('Voto non salvato: '+(err.code||err))}return}
 const ok=t.closest('[data-ok]');if(ok){const[g,id,v]=ok.dataset.ok.split('|');const ora=$(`[data-ora="${id}"]`)?.value;try{if(v==='1'&&ora)await salva(`proposte/${g}/${id}/ora`,ora);await salva(`proposte/${g}/${id}/ok`,v==='1');toast(v==='1'?'Messa nel programma':'Tolta dal programma')}catch(err){toast('Non salvato: '+(err.code||err))}return}
 const d=t.closest('[data-del]');if(d){if(d.dataset.sure){const[g,id]=d.dataset.del.split('|');try{await salva(`proposte/${g}/${id}`,null);toast('Proposta eliminata')}catch(err){toast('Non eliminata')}}else{d.dataset.sure=1;d.textContent='Conferma';setTimeout(()=>{d.dataset.sure='';d.textContent='Elimina'},3000)}return}
 const sm=t.closest('[data-showmap]');if(sm){const id=sm.dataset.showmap;if(innerWidth<=860){location.hash='#mappa';setTimeout(()=>{seleziona(id);setTimeout(()=>apriPin(id),750)},150)}else{seleziona(id);setTimeout(()=>apriPin(id),750)}return}
 const pp=t.closest('[data-pop]');if(pp){apriPin(pp.dataset.pop);return}
 const go=t.closest('[data-goto]');if(go){if(go.getAttribute('href')==='#mangiare')e.preventDefault();setTimeout(()=>{const el=document.getElementById(go.dataset.goto)||document.getElementById('s-'+go.dataset.goto);if(el)el.scrollIntoView({behavior:'smooth',block:'center'})},80)}
 const c=t.closest('#view .card[data-sel]');if(c&&!t.closest('a,button')&&innerWidth>860){seleziona(c.dataset.sel);setTimeout(()=>apriPin(c.dataset.sel),750)}
 if(t.closest('.maplibregl-popup a[href^="#g"]'))$$('.maplibregl-popup').forEach(p=>p.remove())});
$('#view').addEventListener('submit',async e=>{const f=e.target;
 if(f.dataset.pform!=null){e.preventDefault();if(!IO||!FB)return;const b=f.querySelector('button');b.disabled=true;const testo=f.testo.value.trim().slice(0,160),link=f.link.value.trim();
  if(link&&!/^https:\/\//.test(link)){toast('Il link deve iniziare con https://');b.disabled=false;return}
  const o={lista:'posti',testo,autore:IO,uid:FB.uid,t:Date.now(),fatto:false};if(f.nota.value.trim())o.nota=f.nota.value.trim().slice(0,600);if(link)o.link=link.slice(0,600);
  const c=coordDaLink(link)||await trovaPosto(testo+' '+(f.dove.value.trim()||'Japan'))||await trovaPosto(testo);if(c){o.lat=c.lat;o.lng=c.lng}
  try{await FB.Db.set(FB.Db.push(FB.ref('liste')),o);toast(c?'Posto segnalato':'Segnalato, ma la posizione non si trova: provate un altro nome')}catch(err){toast('Non salvato: '+(err.code||err))}b.disabled=false;return}
 if(f.dataset.lform){e.preventDefault();if(!IO||!FB)return;const o={lista:f.dataset.lform,testo:f.testo.value.trim().slice(0,160),autore:IO,uid:FB.uid,t:Date.now(),fatto:false};const l=f.link.value.trim();if(l){if(!/^https:\/\//.test(l)){toast('Il link deve iniziare con https://');return}o.link=l.slice(0,600)}
  try{await FB.Db.set(FB.Db.push(FB.ref('liste')),o);f.reset()}catch(err){toast('Non salvato: '+(err.code||err))}return}
 if(f.dataset.dform){e.preventDefault();if(!IO||!FB)return;const o={autore:IO,uid:FB.uid,t:Date.now(),data:f.dataset.dform,testo:f.testo.value.trim().slice(0,1000)};const ft=f.foto.value.trim();if(ft){if(!/^https:\/\//.test(ft)){toast('Il link della foto deve iniziare con https://');return}o.foto=ft.slice(0,600)}if(f.rid.value)o.rid=f.rid.value;
  try{await FB.Db.set(FB.Db.push(FB.ref('diario')),o);f.reset();toast('Pubblicato nel diario')}catch(err){toast('Non pubblicato: '+(err.code||err))}return}});
$('#view').addEventListener('change',async e=>{const i=e.target;
 if(i.dataset.bcod!=null){const k=i.dataset.bcod;try{await salva('spunte/'+k,{...(SPU[k]||{}),codice:i.value.slice(0,300),autore:IO||'Ospite',t:Date.now()});toast('Codice salvato')}catch(err){toast('Non salvato')}return}
 if(i.dataset.bmie!=null){store.set('bij:bmie',i.checked);renderView();return}
 if(i.dataset.if==='g'){IF.g=i.value;IF.n=24;store.set('bij:if',IF);renderView();return}
 if(i.dataset.chi!=null){if(!IO){accesso();return}const[tp,k]=[i.dataset.chi.slice(0,1),i.dataset.chi.slice(2)];try{if(tp==='L')await salva(`liste/${k}/chi`,i.value);else await salva('spunte/'+k,{...(SPU[k]||{}),chi:i.value,autore:IO,t:Date.now()})}catch(err){toast('Non salvato')}return}
 if(i.dataset.lfatto!=null){if(!IO){accesso();i.checked=!i.checked;return}try{await salva(`liste/${i.dataset.lfatto}/fatto`,i.checked)}catch(err){toast('Non salvato')}return}
 if(i.dataset.sfatto!=null){if(!IO){accesso();i.checked=!i.checked;return}const k=i.dataset.sfatto;try{await salva('spunte/'+k,{...(SPU[k]||{}),fatto:i.checked,autore:IO,t:Date.now()})}catch(err){toast('Non salvato')}return}
 if(!i.dataset.k)return;const ck=store.get('bij:'+i.dataset.k,{});ck[i.dataset.i]=i.checked;store.set('bij:'+i.dataset.k,ck)});
if(location.hostname==='localhost')window.T={get map(){return map},get ALT(){return ALT},get PS(){return PS},get CIELO(){return CIELO},get filter(){return filter},seleziona,tappe,aggiorna,aggiornaRbar};
addEventListener('hashchange',route);addEventListener('resize',()=>map&&map.resize());
addEventListener('keydown',e=>{if(e.key==='Escape'){$('#sheet').classList.remove('on');CMID=null;$('#login').classList.remove('on')}});

Promise.all([fetch('data/viaggio.json',{cache:'no-cache'}).then(r=>r.json()),fetch('data/stazioni.json').then(r=>r.json()).catch(()=>null),fetch('data/idee.json',{cache:'no-cache'}).then(r=>r.json()).catch(()=>({idee:[]}))]).then(([v,s,id])=>{V=v;ST=s;IDEE=id.idee||[];IDEE.forEach(x=>IDX[x.id]=x);prepara();ricalcola();document.title=V.viaggio.titolo;utente();
 try{initMap()}catch(e){$('#map').innerHTML='<p style="padding:20px">La mappa non si è avviata su questo browser.</p>'}
 if(!location.hash){const st=stato();if(st.fase==='durante'&&st.i>=0)history.replaceState(null,'','#g'+(st.i+1))}route();avviaFB();if(!IO)setTimeout(accesso,700)})
 .catch(()=>{$('#view').innerHTML='<div class="pad">Il programma non si è caricato. Controllate la connessione e ricaricate.</div>'});
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
}
