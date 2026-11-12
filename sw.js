// Service worker: guarda a "casca" do app para abrir offline e permitir instalação
// e também recebe as notificações push do OneSignal.
// (try/catch: se estiver sem internet, o app continua abrindo normalmente)
try { importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js'); } catch (e) {}

const CACHE = 'validades-v2';
const ARQUIVOS = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // só mexe em arquivos do próprio app; chamadas ao Apps Script passam direto
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  // rede primeiro (pega atualizações), cache como reserva offline
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copia));
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
  );
});
