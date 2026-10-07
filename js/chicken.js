(function () {
  const status = document.getElementById("status");
  const launchBtn = document.getElementById("launch");
  const streetBtn = document.getElementById("street");
  const earthBtn = document.getElementById("earth");
  const hitBox = document.getElementById("hit");
  const hitText = document.getElementById("hit-text");
  const map = L.map("map", { zoomControl: false, worldCopyJump: true }).setView([51.5, -0.12], 4);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "OpenStreetMap" }).addTo(map);

  let target = null;
  let targetMarker = null;
  let flying = false;
  const plane = L.marker([51.5, -10], { icon: L.divIcon({ className: "plane-icon", html: "✈️", iconSize: [32, 32] }) }).addTo(map);
  let chicken = null;
  let audioCtx = null;

  function sound() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
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
    hitBox.classList.remove("show");
  });

  function launch() {
    if (!target || flying) {
      status.textContent = target ? "Chicken already in the air." : "Tap the map first.";
      return;
    }
    flying = true;
    status.textContent = "Chicken away.";
    const start = plane.getLatLng();
    const end = target;
    if (chicken) map.removeLayer(chicken);
    chicken = L.marker(start, { icon: L.divIcon({ className: "chicken-icon", html: "🐔", iconSize: [32, 32] }) }).addTo(map);
    const begun = performance.now();
    function step(now) {
      const t = Math.min(1, (now - begun) / 1400);
      chicken.setLatLng([start.lat + (end.lat - start.lat) * t, start.lng + (end.lng - start.lng) * t]);
      if (t < 1) requestAnimationFrame(step);
      else hit(end);
    }
    requestAnimationFrame(step);
  }

  function hit(end) {
    flying = false;
    sound();
    status.textContent = "Hit.";
    hitText.textContent = "Hit at " + end.lat.toFixed(2) + ", " + end.lng.toFixed(2) + ". Street View opens in Google.";
    hitBox.classList.add("show");
    map.invalidateSize();
  }

  launchBtn.addEventListener("click", launch);
  streetBtn.addEventListener("click", function () {
    if (target) window.open(streetUrl(target.lat, target.lng), "_blank", "noopener");
  });
  earthBtn.addEventListener("click", function () {
    if (target) window.open(earthUrl(target.lat, target.lng), "_blank", "noopener");
  });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function () {});
  setTimeout(function () { map.invalidateSize(); }, 250);
  window.addEventListener("resize", function () { map.invalidateSize(); });
})();
