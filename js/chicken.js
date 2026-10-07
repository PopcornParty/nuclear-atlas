(function () {
  const status = document.getElementById("status");
  const statsEl = document.getElementById("stats");
  const hitText = document.getElementById("hit-text");
  const streetBtn = document.getElementById("street");
  const earthBtn = document.getElementById("earth");
  const map = L.map("map", { zoomControl: false, worldCopyJump: true }).setView([48, 8], 4);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "OpenStreetMap" }).addTo(map);

  const state = { target: null, marker: null, flying: false, chickens: 6, hits: 0, misses: 0, score: 0, streak: 0, bestStreak: 0, longestKm: 0, wind: 8, last: null };
  try { state.best = Number(localStorage.getItem("chicken-best") || 0); } catch (e) { state.best = 0; }
  const plane = L.marker([52, -12], { icon: L.divIcon({ className: "plane-icon", html: "✈️", iconSize: [32, 32] }) }).addTo(map);
  let chicken = null;
  let audioCtx = null;
  let heading = 0;

  function km(a, b) {
    const r = Math.PI / 180;
    const dLat = (b.lat - a.lat) * r;
    const dLon = (b.lng - a.lng) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }
  function render() {
    const shots = state.hits + state.misses;
    const acc = shots ? Math.round(100 * state.hits / shots) : 0;
    statsEl.innerHTML = [
      ["Score", state.score],
      ["Best", state.best],
      ["Left", state.chickens],
      ["Hits", state.hits],
      ["Accuracy", acc + "%"],
      ["Wind", state.wind + " km"]
    ].map(function (row) { return "<div><b>" + row[1] + "</b><span>" + row[0] + "</span></div>"; }).join("");
  }
  function sound(hit) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = hit ? "square" : "triangle";
    osc.frequency.setValueAtTime(hit ? 540 : 220, now);
    osc.frequency.exponentialRampToValueAtTime(hit ? 160 : 90, now + 0.2);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }
  function streetUrl(lat, lon) { return "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=" + lat + "," + lon; }
  function earthUrl(lat, lon) { return "https://earth.google.com/web/@" + lat + "," + lon + ",180a,900d,35y,0h,45t,0r"; }

  map.on("click", function (ev) {
    if (state.flying) return;
    state.target = ev.latlng;
    if (state.marker) map.removeLayer(state.marker);
    state.marker = L.marker(state.target, { icon: L.divIcon({ className: "target-icon", html: "🎯", iconSize: [32, 32] }) }).addTo(map);
    status.textContent = "Target locked. Launch while the plane is near.";
  });

  function finish(land) {
    state.flying = false;
    const missKm = km(land, state.target);
    const hit = missKm < 80;
    const dropKm = km(plane.getLatLng(), land);
    state.longestKm = Math.max(state.longestKm, dropKm);
    if (hit) {
      state.hits += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      const points = Math.max(10, Math.round(120 - missKm));
      state.score += points;
      if (state.score > state.best) { state.best = state.score; try { localStorage.setItem("chicken-best", String(state.best)); } catch (e) {} }
      status.textContent = "Hit. " + points + " points.";
      hitText.textContent = "Hit " + missKm.toFixed(0) + " km from the pin. Drop " + dropKm.toFixed(0) + " km. Streak " + state.streak + ".";
      streetBtn.disabled = false;
      earthBtn.disabled = false;
      state.last = land;
    } else {
      state.misses += 1;
      state.streak = 0;
      status.textContent = "Miss by " + missKm.toFixed(0) + " km.";
      hitText.textContent = "Miss. Wind pushed it " + missKm.toFixed(0) + " km off the pin.";
      streetBtn.disabled = true;
      earthBtn.disabled = true;
    }
    sound(hit);
    if (state.chickens === 0) status.textContent += " Round over. New round refills the crate.";
    render();
  }

  function launch() {
    if (!state.target) { status.textContent = "Tap the map first."; return; }
    if (state.flying) return;
    if (state.chickens <= 0) { status.textContent = "No chickens left. Start a new round."; return; }
    state.chickens -= 1;
    state.flying = true;
    state.wind = Math.round((Math.random() * 40 - 20));
    const start = plane.getLatLng();
    const drift = state.wind / 111;
    const end = L.latLng(state.target.lat + drift * 0.25, state.target.lng + drift);
    if (chicken) map.removeLayer(chicken);
    chicken = L.marker(start, { icon: L.divIcon({ className: "chicken-icon", html: "🐔", iconSize: [32, 32] }) }).addTo(map);
    const begun = performance.now();
    status.textContent = "In the air. Wind " + state.wind + " km.";
    render();
    function step(now) {
      const t = Math.min(1, (now - begun) / 1300);
      chicken.setLatLng([start.lat + (end.lat - start.lat) * t, start.lng + (end.lng - start.lng) * t]);
      if (t < 1) requestAnimationFrame(step);
      else finish(end);
    }
    requestAnimationFrame(step);
  }

  function patrol(now) {
    heading += 0.004;
    plane.setLatLng([50 + Math.sin(heading) * 8, -15 + (heading * 12) % 50]);
    if (!state.flying) requestAnimationFrame(patrol);
    else requestAnimationFrame(patrol);
  }
  requestAnimationFrame(patrol);

  document.getElementById("launch").addEventListener("click", launch);
  document.getElementById("reload").addEventListener("click", function () {
    state.chickens = 6;
    state.hits = 0;
    state.misses = 0;
    state.score = 0;
    state.streak = 0;
    state.wind = 8;
    status.textContent = "New round. Six chickens.";
    hitText.textContent = "No drop yet.";
    streetBtn.disabled = true;
    earthBtn.disabled = true;
    render();
  });
  streetBtn.addEventListener("click", function () { if (state.last) window.open(streetUrl(state.last.lat, state.last.lng), "_blank", "noopener"); });
  earthBtn.addEventListener("click", function () { if (state.last) window.open(earthUrl(state.last.lat, state.last.lng), "_blank", "noopener"); });
  render();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function () {});
  setTimeout(function () { map.invalidateSize(); }, 200);
})();
