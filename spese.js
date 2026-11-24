'use strict';
/* Cassa comune di Big in Japan: conti puri, senza interfaccia.
   Ogni spesa: {titolo, importo, valuta:'EUR'|'JPY', paga, per:{nome:valore}, modo:'uguale'|'quote'|'importi'|'rimborso', cambio (yen per 1 euro), data, cat}
   I saldi sono in euro: positivo = deve ricevere, negativo = deve dare. */
(function (g) {
  const r2 = x => Math.round(x * 100) / 100;
  const inEuro = (s, cambio) => s.valuta === 'EUR' ? s.importo : s.importo / (s.cambio || cambio);

  // quanto tocca a ciascuno, nella valuta della spesa
  function quote(s) {
    const per = s.per || {}, nomi = Object.keys(per).filter(n => per[n] > 0 || s.modo === 'uguale');
    if (!nomi.length) return {};
    const o = {};
    if (s.modo === 'importi') { nomi.forEach(n => { o[n] = per[n]; }); return o; }
    if (s.modo === 'rimborso') { o[nomi[0]] = s.importo; return o; }
    const w = s.modo === 'quote' ? nomi.map(n => per[n]) : nomi.map(() => 1), tot = w.reduce((a, b) => a + b, 0) || 1;
    nomi.forEach((n, i) => { o[n] = s.importo * w[i] / tot; });
    return o;
  }

  function saldi(spese, persone, cambio) {
    const saldo = {}, pagato = {}, quota = {};
    persone.forEach(p => { saldo[p] = 0; pagato[p] = 0; quota[p] = 0; });
    let totale = 0;
    const cat = {}, giorno = {};
    for (const s of spese) {
      const e = inEuro(s, cambio), f = e / s.importo, q = quote(s), rimb = s.modo === 'rimborso';
      saldo[s.paga] = (saldo[s.paga] || 0) + e;
      for (const n of Object.keys(q)) saldo[n] = (saldo[n] || 0) - q[n] * f;
      if (rimb) continue;
      totale += e;
      pagato[s.paga] = (pagato[s.paga] || 0) + e;
      for (const n of Object.keys(q)) quota[n] = (quota[n] || 0) + q[n] * f;
      cat[s.cat || 'altro'] = (cat[s.cat || 'altro'] || 0) + e;
      if (s.data) giorno[s.data] = (giorno[s.data] || 0) + e;
    }
    for (const n of Object.keys(saldo)) saldo[n] = r2(saldo[n]);
    return { saldo, pagato, quota, totale, cat, giorno };
  }

  // pochi bonifici: prima chi deve e chi riceve la stessa cifra, poi il più grande debitore paga il più grande creditore
  function pareggia(saldo) {
    const cred = [], deb = [], out = [];
    for (const [n, v0] of Object.entries(saldo)) { const v = r2(v0); if (v > 0.009) cred.push([n, v]); else if (v < -0.009) deb.push([n, -v]); }
    for (let i = deb.length - 1; i >= 0; i--) {
      const j = cred.findIndex(c => Math.abs(c[1] - deb[i][1]) < 0.01);
      if (j >= 0) { out.push({ da: deb[i][0], a: cred[j][0], eur: r2(deb[i][1]) }); deb.splice(i, 1); cred.splice(j, 1); }
    }
    while (deb.length && cred.length) {
      deb.sort((a, b) => b[1] - a[1]); cred.sort((a, b) => b[1] - a[1]);
      const x = Math.min(deb[0][1], cred[0][1]);
      if (x >= 0.01) out.push({ da: deb[0][0], a: cred[0][0], eur: r2(x) });
      deb[0][1] = r2(deb[0][1] - x); cred[0][1] = r2(cred[0][1] - x);
      if (deb[0][1] < 0.01) deb.shift();
      if (cred.length && cred[0][1] < 0.01) cred.shift();
    }
    return out;
  }

  g.CASSA = { r2, inEuro, quote, saldi, pareggia };
})(typeof window !== 'undefined' ? window : globalThis);
