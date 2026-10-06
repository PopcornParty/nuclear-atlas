/* Simplified local-fallout plume. Estimated. Off unless the scenario is surface-coupled. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.NA = root.NA || {}; root.NA.falloutModel = api; }
})(typeof self !== "undefined" ? self : this, function () {
  function consts() {
    return (typeof self !== "undefined" ? self.NA : global.NA).constants.CONSTANTS.fallout;
  }
  function geo() { return (typeof self !== "undefined" ? self.NA : global.NA); }

  function fireballRadiusM(yieldKt) {
    const c = consts();
    return c.fireballCoeffM * Math.pow(yieldKt, c.fireballExponent);
  }

  function surfaceCoupled(scenario) {
    if (scenario.supportsFallout === false) return false;
    if (scenario.burstType === "surface" || scenario.burstType === "tower") return true;
    return scenario.heightM < fireballRadiusM(scenario.yieldKt);
  }

  function ellipsePolygon(lat, lon, downwindKm, crosswindKm, bearingDeg, steps) {
    const g = geo();
    const n = steps || 48;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI * 2;
      const x = (downwindKm / 2) * (1 + Math.cos(t));
      const y = (crosswindKm / 2) * Math.sin(t);
      const dist = Math.sqrt(x * x + y * y);
      const brg = bearingDeg + (Math.atan2(y, x) * 180 / Math.PI);
      pts.push(dist === 0 ? { lat: lat, lon: lon } : g.destination(lat, lon, brg, dist));
    }
    return pts;
  }

  function run(scenario, options) {
    const c = consts();
    const g = geo();
    const opts = options || {};
    if (!surfaceCoupled(scenario)) {
      return {
        model: "falloutModel",
        status: "not-applicable",
        enabled: false,
        sourceIds: c.sourceIds,
        limitations: "Local fallout model is off. This scenario is an air burst whose fireball is not modelled as surface-coupled. Prompt radiation is a separate layer.",
        bands: [],
        windMph: null,
        windFromDeg: null
      };
    }
    const windMph = opts.windMph || scenario.modelParameters.windMph || c.defaultWindMph;
    const windFromDeg = opts.windFromDeg == null ? 270 : opts.windFromDeg;
    g.assertFinite("windMph", windMph);
    const yieldMt = scenario.yieldKt / 1000;
    const scale = Math.pow(yieldMt / c.anchors.yieldMt, c.yieldExponent) * (windMph / c.anchors.windMph);
    const bands = c.anchors.bands.map(function (b) {
      const down = b.downwindKm * scale;
      const cross = b.crosswindKm * scale;
      return {
        id: b.id,
        category: b.category,
        label: b.label,
        downwindKm: down,
        crosswindKm: cross,
        areaKm2: Math.PI * (down / 2) * (cross / 2),
        meaning: "Directional deposition band under a constant " + windMph + " mph wind. Estimate only."
      };
    });
    return {
      model: "falloutModel",
      status: c.status,
      enabled: true,
      sourceIds: c.sourceIds,
      units: c.units,
      limitations: c.limitations,
      windMph: windMph,
      windFromDeg: windFromDeg,
      windToDeg: (windFromDeg + 180) % 360,
      fireballRadiusM: fireballRadiusM(scenario.yieldKt),
      bands: bands,
      maxDownwindKm: bands[bands.length - 1].downwindKm,
      note: "Model/estimate. Not a forecast. Arrival time uses wind speed and distance only."
    };
  }

  function arrivalHours(distanceKm, windMph) {
    if (!windMph || distanceKm < 0) return null;
    const kmh = windMph * 1.60934;
    return distanceKm / kmh;
  }

  return { run: run, surfaceCoupled: surfaceCoupled, fireballRadiusM: fireballRadiusM, ellipsePolygon: ellipsePolygon, arrivalHours: arrivalHours };
});
