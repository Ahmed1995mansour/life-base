// LifeBase service worker.
// The page is network-first so updates arrive; css/js carry ?v=N and are cache-first (a new version means new URLs).
// Fonts and how-to videos are cached the first time they load. Run tools/release.py to bump the version.
const VERSION = "lifebase-v5";
const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png",
  "icons/apple-touch-icon.png",
  "css/tokens.css?v=5",
  "css/base.css?v=5",
  "css/components.css?v=5",
  "css/screens.css?v=5",
  "js/core.js?v=5",
  "js/data/plan.js?v=5",
  "js/data/training.js?v=5",
  "js/data/recipes.js?v=5",
  "js/store.js?v=5",
  "js/modules/today.js?v=5",
  "js/modules/todos.js?v=5",
  "js/modules/train.js?v=5",
  "js/modules/food.js?v=5",
  "js/modules/weight.js?v=5",
  "js/modules/quran.js?v=5",
  "js/modules/week.js?v=5",
  "js/modules/reminders.js?v=5",
  "js/modules/money.js?v=5",
  "js/modules/settings.js?v=5",
  "js/app.js?v=5"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => ![VERSION, "lifebase-media", "lifebase-fonts"].includes(k)).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Google Fonts: serve from cache, refresh in the background
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open("lifebase-fonts").then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  // The app page: network first, cached copy when offline
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put("index.html", copy)); }
      return r;
    }).catch(() => caches.match("index.html")));
    return;
  }

  // How-to videos and pictures: keep a copy after the first view so they play offline
  if (url.pathname.includes("/media/")) {
    if (req.headers.has("range")) return; // video seeking: let the browser handle it
    e.respondWith(caches.open("lifebase-media").then(async c => {
      const hit = await c.match(req, {ignoreVary: true});
      if (hit) return hit;
      const r = await fetch(req);
      if (r.ok && r.status === 200) c.put(req, r.clone());
      return r;
    }));
    return;
  }

  // Everything else from our folder (versioned css/js, icons): cache first
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok && url.search.includes("v=")) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return r;
  })));
});
