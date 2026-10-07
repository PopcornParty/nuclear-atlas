(function () {
  const status = document.getElementById("status");
  const launchBtn = document.getElementById("launch");
  const streetBtn = document.getElementById("street");
  const earthBtn = document.getElementById("earth");
  const view = document.getElementById("view");
  const frame = document.getElementById("frame");
  const map = L.map("map", { zoomControl: false, worldCopyJump: true }).setView([51.5, -0.12], 4);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "OpenStreetMap" }).addTo(map);

  let target = null;
  let targetMarker = null;
  let flying = false;
  const plane = L.marker([51.5, -10], { icon: L.divIcon({ className: "plane-icon", html: "✈", iconSize: [32, 32] }) }).addTo(map);
  let chicken = null;
  let audioCtx = null;

  function sound(kind) {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    if (kind === "hit") {
      osc.type = "square";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.26);
      const bawk = audioCtx.createOscillator();
      const bg = audioCtx.createGain();
      bawk.type = "sawtooth";
      bawk.connect(bg);
      bg.connect(audioCtx.destination);
      bawk.frequency.setValueAtTime(700, now + 0.05);
      bawk.frequency.exponentialRampToValueAtTime(280, now + 0.35);
      bg.gain.setValueAtTime(0.12, now + 0.05);
      bg.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      bawk.start(now + 0.05);
      bawk.stop(now + 0.42);
    }
  }

  function streetUrl(lat, lon) {
    return "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=" + lat + "," + lon;
  }
  function earthUrl(lat, lon) {
    return "https://earth.google.com/web/@" + lat + "," + lon + ",180a,900d,35y,0h,45t,0r";
  }

  map.on("click", function (ev) {
    if (flying) return;
    target = ev.latlng;
    if (targetMarker) map.removeLayer(targetMarker);
    targetMarker = L.marker(target, { icon: L.divIcon({ className: "target-icon", html: "🎯", iconSize: [32, 32] }) }).addTo(map);
    status.textContent = "Target set. Launch the chicken.";
    streetBtn.disabled = true;
    earthBtn.disabled = true;
  });

  function launch() {
    if (!target || flying) {
      status.textContent = target ? "Chicken already in the air." : "Tap the map first.";
      return;
    }
    flying = true;
    const start = plane.getLatLng();
    const end = target;
    if (chicken) map.removeLayer(chicken);
    chicken = L.marker(start, { icon: L.divIcon({ className: "chicken-icon", html: "🐔", iconSize: [32, 32] }) }).addTo(map);
    const begun = performance.now();
    function step(now) {
      const t = Math.min(1, (now - begun) / 1600);
      const lat = start.lat + (end.lat - start.lat) * t;
      const lon = start.lng + (end.lng - start.lng) * t;
      chicken.setLatLng([lat, lon]);
      plane.setLatLng([start.lat + (end.lat - start.lat) * t * 0.35, start.lng + (end.lng - start.lng) * t * 0.35]);
      if (t < 1) requestAnimationFrame(step);
      else hit(end);
    }
    requestAnimationFrame(step);
  }

  function hit(end) {
    flying = false;
    sound("hit");
    status.textContent = "Hit. Opening the building view.";
    streetBtn.disabled = false;
    earthBtn.disabled = false;
    frame.src = streetUrl(end.lat, end.lng);
    view.hidden = false;
  }

  launchBtn.addEventListener("click", launch);
  streetBtn.addEventListener("click", function () {
    if (!target) return;
    frame.src = streetUrl(target.lat, target.lng);
    view.hidden = false;
  });
  earthBtn.addEventListener("click", function () {
    if (!target) return;
    window.open(earthUrl(target.lat, target.lng), "_blank", "noopener");
  });
  document.getElementById("close-view").addEventListener("click", function () {
    view.hidden = true;
    frame.src = "about:blank";
  });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function () {});
  setTimeout(function () { map.invalidateSize(); }, 200);
})();
