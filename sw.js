const CACHE = "nuclear-atlas-v5";
const FILES = [
  "./",
  "./index.html",
  "./css/app.css",
  "./app.js",
  "./storage.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-180.png",
  "./vendor/leaflet/leaflet.css",
  "./vendor/leaflet/leaflet.js",
  "./data/sources.js",
  "./data/constants.js",
  "./data/scenarios.js",
  "./data/countries.js",
  "./models/geoMath.js",
  "./models/blastModel.js",
  "./models/thermalModel.js",
  "./models/radiationModel.js",
  "./models/falloutModel.js",
  "./models/geographyModel.js",
  "./models/populationImpactModel.js",
  "./models/economicModel.js",
  "./models/visualisationModel.js",
  "./simulation/state.js",
  "./simulation/engine.js",
  "./map/mapView.js",
  "./components/learn.js"
];
self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", function (event) {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request).then(function (res) {
      const copy = res.clone();
      caches.open(CACHE).then(function (cache) { cache.put(event.request, copy); });
      return res;
    }).catch(function () { return caches.match(event.request); })
  );
});
