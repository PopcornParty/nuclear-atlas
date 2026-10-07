const CACHE = "chicken-drop-v2";
const FILES = ["./index.html", "./css/chicken.css", "./js/chicken.js", "./vendor/leaflet/leaflet.css", "./vendor/leaflet/leaflet.js", "./manifest.webmanifest"];
self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (event) {
  event.respondWith(fetch(event.request).catch(function () { return caches.match(event.request); }));
});
