/* Distance, projection helpers and safe numeric formatting. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.NA = root.NA || {}; Object.assign(root.NA, api); }
})(typeof self !== "undefined" ? self : this, function () {
  const R = 6371.0088;

  function finite(n) {
    return typeof n === "number" && isFinite(n);
  }

  function assertFinite(name, n) {
    if (!finite(n)) {
      const err = new Error(name + " must be a finite number");
      err.code = "INVALID_INPUT";
      throw err;
    }
    return n;
  }

  function toRad(d) { return d * Math.PI / 180; }
  function toDeg(r) { return r * 180 / Math.PI; }

  function haversineKm(lat1, lon1, lat2, lon2) {
    assertFinite("lat1", lat1);
    assertFinite("lon1", lon1);
    assertFinite("lat2", lat2);
    assertFinite("lon2", lon2);
    const p1 = toRad(lat1);
    const p2 = toRad(lat2);
    const dp = toRad(lat2 - lat1);
    const dl = toRad(lon2 - lon1);
    const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  function destination(lat, lon, bearingDeg, distanceKm) {
    assertFinite("lat", lat);
    assertFinite("lon", lon);
    assertFinite("bearing", bearingDeg);
    assertFinite("distanceKm", distanceKm);
    const δ = distanceKm / R;
    const θ = toRad(bearingDeg);
    const φ1 = toRad(lat);
    const λ1 = toRad(lon);
    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
    const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
    return { lat: toDeg(φ2), lon: ((toDeg(λ2) + 540) % 360) - 180 };
  }

  function ring(lat, lon, radiusKm, steps) {
    const n = steps || 72;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      pts.push(destination(lat, lon, (360 * i) / n, radiusKm));
    }
    return pts;
  }

  function polygonAreaKm2(lat, lon, radiusKm) {
    return Math.PI * radiusKm * radiusKm;
  }

  function pointInRing(lat, lon, ringPts) {
    let inside = false;
    for (let i = 0, j = ringPts.length - 1; i < ringPts.length; j = i++) {
      const yi = ringPts[i][1];
      const xi = ringPts[i][0];
      const yj = ringPts[j][1];
      const xj = ringPts[j][0];
      const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / ((yj - yi) || 1e-12) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function ringsOf(geometry) {
    if (!geometry) return [];
    if (geometry.type === "Polygon") return geometry.coordinates;
    if (geometry.type === "MultiPolygon") {
      const out = [];
      geometry.coordinates.forEach(function (poly) { poly.forEach(function (ring) { out.push(ring); }); });
      return out;
    }
    return [];
  }

  function outerRings(geometry) {
    if (!geometry) return [];
    if (geometry.type === "Polygon") return [geometry.coordinates[0]];
    if (geometry.type === "MultiPolygon") return geometry.coordinates.map(function (p) { return p[0]; });
    return [];
  }

  function bbox(geometry) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    ringsOf(geometry).forEach(function (ring) {
      ring.forEach(function (c) {
        if (c[0] < minX) minX = c[0];
        if (c[1] < minY) minY = c[1];
        if (c[0] > maxX) maxX = c[0];
        if (c[1] > maxY) maxY = c[1];
      });
    });
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
  }

  function formatNum(n, digits) {
    if (!finite(n)) return "—";
    const d = digits == null ? 1 : digits;
    const abs = Math.abs(n);
    if (abs !== 0 && abs < 0.01) return n.toExponential(1);
    return n.toLocaleString("en-GB", { maximumFractionDigits: d, minimumFractionDigits: 0 });
  }

  return {
    EARTH_RADIUS_KM: R,
    finite: finite,
    assertFinite: assertFinite,
    toRad: toRad,
    toDeg: toDeg,
    haversineKm: haversineKm,
    destination: destination,
    ring: ring,
    polygonAreaKm2: polygonAreaKm2,
    pointInRing: pointInRing,
    ringsOf: ringsOf,
    outerRings: outerRings,
    bbox: bbox,
    formatNum: formatNum
  };
});
