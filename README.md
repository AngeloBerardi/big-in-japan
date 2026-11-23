# Big in Japan

Sito compagno del viaggio Tokyo, terme e Kyoto (26 dicembre 2026 – 9 gennaio 2027).

- `index.html`, `app.js`: l'app (Leaflet, nessuna build).
- `data/viaggio.json`: programma giorno per giorno. Niente codici di prenotazione qui: il repository è pubblico.
- `data/stazioni.json`: stazioni e linee di Tokyo, Kyoto e Nara da [open-data-jp-railway-stations](https://github.com/piuccio/open-data-jp-railway-stations).
- Proposte e pollici: Firebase Realtime Database, percorso `viaggi/<chiave>`; la chiave non è nel codice.

Mappe © OpenStreetMap, CARTO, Esri, OpenRailwayMap. Foto da Wikipedia e Wikimedia Commons.

## App Android

`android/` è un contenitore a tutto schermo (WebView, senza barra dell'indirizzo) che apre il sito. Il workflow `.github/workflows/android.yml` la compila a ogni modifica di `android/` e la pubblica nella release `android`:
https://github.com/AngeloBerardi/big-in-japan/releases/download/android/big-in-japan.apk

La chiave di firma non è nel repository: il workflow usa i segreti `ANDROID_KEYSTORE` (file .jks in base64) e `ANDROID_KEYSTORE_PASSWORD` se ci sono; altrimenti genera una chiave e la tiene nella cache privata delle Actions. Se la cache scade (7 giorni senza compilazioni) la chiave cambia e l'app va reinstallata: per evitarlo, mettete una chiave nei segreti.
