// node test/spese.test.js
require('../spese.js');
const { saldi, pareggia, quote } = globalThis.CASSA;
const P = ['Angelo', 'Luigi', 'Valerio', 'Daniele', 'Luca', 'Dario'];
let ok = 0, ko = 0;
const ck = (c, m) => { if (c) ok++; else { ko++; console.log('NO  ' + m); } };
const tutti = Object.fromEntries(P.map(n => [n, 1]));
const S = [
  { titolo: 'Cena', importo: 36000, valuta: 'JPY', paga: 'Luca', per: tutti, modo: 'uguale', cambio: 160 },
  { titolo: 'Ryokan', importo: 854, valuta: 'EUR', paga: 'Luigi', per: { Luigi: 1, Luca: 1, Dario: 1, Angelo: 1 }, modo: 'uguale' },
  { titolo: 'Taxi', importo: 3000, valuta: 'JPY', paga: 'Dario', per: { Dario: 1000, Angelo: 2000 }, modo: 'importi', cambio: 150 },
  { titolo: 'Treno', importo: 120, valuta: 'EUR', paga: 'Angelo', per: { Angelo: 2, Valerio: 1 }, modo: 'quote' },
];
const r = saldi(S, P, 160);
const somma = Object.values(r.saldo).reduce((a, b) => a + b, 0);
ck(Math.abs(somma) < 0.05, 'i saldi sommano a zero: ' + somma);
ck(Math.abs(r.totale - (225 + 854 + 20 + 120)) < 0.01, 'totale in euro: ' + r.totale);
ck(Math.abs(quote(S[3]).Angelo - 80) < 1e-9, 'quote 2 a 1');
const T = pareggia(r.saldo);
ck(T.length <= P.length - 1, 'al massimo n-1 bonifici: ' + T.length);
const dopo = { ...r.saldo };
T.forEach(t => { dopo[t.da] += t.eur; dopo[t.a] -= t.eur; });
ck(Object.values(dopo).every(v => Math.abs(v) < 0.05), 'dopo i bonifici tutti a zero');
// i rimborsi chiudono i conti
const R = S.concat(T.map(t => ({ titolo: 'Rimborso', importo: t.eur, valuta: 'EUR', paga: t.da, per: { [t.a]: 1 }, modo: 'rimborso' })));
const r2 = saldi(R, P, 160);
ck(Object.values(r2.saldo).every(v => Math.abs(v) < 0.05), 'con i rimborsi registrati tutti a zero');
ck(Math.abs(r2.totale - r.totale) < 0.01, 'i rimborsi non contano come spesa');
ck(pareggia({ A: 10, B: -10, C: 5, D: -5 }).length === 2, 'coppie con la stessa cifra');
console.log(`cassa: ${ok} ok, ${ko} falliti`); if (ko) process.exit(1);
