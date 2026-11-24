const C=process.argv.slice(2);const H={'User-Agent':'big-in-japan-check/1.0 (https://github.com/AngeloBerardi/big-in-japan)'};
for(let i=0;i<C.length;i+=50){const T=C.slice(i,i+50);const r=await fetch('https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=320&titles='+encodeURIComponent(T.join('|')),{headers:H});const j=await r.json();
for(const p of j.query.pages)console.log(p.thumbnail?'SI':'NO',p.title);for(const x of j.query.redirects||[])console.log('RED',x.from,'->',x.to)}
