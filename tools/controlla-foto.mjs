// Controlla che ogni suggerimento e ogni tappa abbia una foto su Wikipedia: 50 titoli per richiesta
import fs from 'node:fs';
const I=JSON.parse(fs.readFileSync('data/idee.json')).idee,V=JSON.parse(fs.readFileSync('data/viaggio.json'));
const H={'User-Agent':'big-in-japan-check/1.0 (https://github.com/AngeloBerardi/big-in-japan)'};
const zz=ms=>new Promise(r=>setTimeout(r,ms));
async function get(u){for(let k=0;k<6;k++){const r=await fetch(u,{headers:H});if(r.ok)return r.json();console.log('stato',r.status);await zz(5000*(k+1))}throw new Error('Wikipedia non risponde')}
const voci=[...I.map(x=>['idea',x.id,x.wiki,x.titolo]),...V.giorni.flatMap(g=>g.eventi.filter(e=>e.wiki).map(e=>['tappa',g.data,e.wiki,e.titolo]))];
const titoli=[...new Set(voci.map(v=>v[2]))],img={};
for(let i=0;i<titoli.length;i+=50){const T=titoli.slice(i,i+50);
 const j=await get('https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=320&titles='+encodeURIComponent(T.join('|')));
 const map=new Map(T.map(t=>[t,t]));for(const n of j.query.normalized||[])for(const[k,v]of map)if(v===n.from)map.set(k,n.to);for(const r of j.query.redirects||[])for(const[k,v]of map)if(v===r.from)map.set(k,r.to);
 const P=Object.fromEntries((j.query.pages||[]).map(p=>[p.title,p]));for(const t of T){const p=P[map.get(t)];img[t]=p&&!p.missing&&p.thumbnail?p.thumbnail.source:null}await zz(1500)}
const manca=voci.filter(v=>!img[v[2]]);manca.forEach(v=>console.log('MANCA',...v));
console.log(`con foto ${voci.length-manca.length}, senza ${manca.length} su ${voci.length}`);
