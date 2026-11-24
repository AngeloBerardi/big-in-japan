// Controlla che ogni suggerimento e ogni tappa abbia una foto su Wikipedia (stessa logica dell'app)
import fs from 'node:fs';
const I=JSON.parse(fs.readFileSync('data/idee.json')).idee,V=JSON.parse(fs.readFileSync('data/viaggio.json'));
const H={'User-Agent':'big-in-japan-check/1.0 (github.com/AngeloBerardi/big-in-japan)'};
const sum=async t=>{const r=await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(t.replace(/ /g,'_')),{headers:H});if(!r.ok)return null;const j=await r.json();return j.thumbnail?.source||null};
const cerca=async q=>{const r=await fetch('https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrlimit=5&prop=pageimages&piprop=thumbnail&pithumbsize=640&gsrsearch='+encodeURIComponent(q),{headers:H});if(!r.ok)return null;const j=await r.json();const P=j.query?Object.values(j.query.pages).sort((a,b)=>a.index-b.index).find(p=>p.thumbnail):null;return P?P.thumbnail.source:null};
const voci=[...I.map(x=>['idea',x.id,x.wiki,x.titolo]),...V.giorni.flatMap(g=>g.eventi.filter(e=>e.wiki).map(e=>['tappa',g.data,e.wiki,e.titolo]))];
let diretta=0,ricerca=0;const mancano=[];
for(const[t,id,w,tit]of voci){let v=w&&await sum(w);if(v){diretta++;continue}v=(w&&await cerca(w.replace(/_/g,' ')))||await cerca(tit+' Japan');if(v){ricerca++;console.log('RICERCA',t,id,w,'->',v)}else{mancano.push([t,id,w,tit]);console.log('MANCA',t,id,w,tit)}}
console.log(`foto dirette ${diretta}, trovate con la ricerca ${ricerca}, mancanti ${mancano.length} su ${voci.length}`);
