/* Country intersection against modelled footprints. Boundaries from Natural Earth. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.NA = root.NA || {}; root.NA.geographyModel = api; }
})(typeof self !== "undefined" ? self : this, function () {
  function g() { return (typeof self !== "undefined" ? self.NA : global.NA); }

  function countryAreaKm2(feature) {
    const outers = g().outerRings(feature.geometry);
    let area = 0;
    outers.forEach(function (ring) {
      if (!ring || ring.length < 4) return;
      let sum = 0;
      for (let i = 0; i < ring.length - 1; i++) {
        const lon1 = ring[i][0] * Math.PI / 180;
        const lat1 = ring[i][1] * Math.PI / 180;
        const lon2 = ring[i + 1][0] * Math.PI / 180;
        const lat2 = ring[i + 1][1] * Math.PI / 180;
        sum += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
      }
      area += Math.abs(sum) * g().EARTH_RADIUS_KM * g().EARTH_RADIUS_KM / 2;
    });
    return area;
  }

  function contains(feature, lat, lon) {
    const rings = g().ringsOf(feature.geometry);
    let inside = false;
    rings.forEach(function (ring, idx) {
      const hit = g().pointInRing(lat, lon, ring.map(function (c) { return [c[0], c[1]]; }).map(function (c) { return [c[0], c[1]]; }));
      /* pointInRing expects [lon, lat] pairs as [x, y] with y=lat. Our helper uses ringPts[i][0]=lon, [1]=lat. */
      if (hit) inside = !inside;
    });
    return inside;
  }

  function pointInFeature(feature, lat, lon) {
    const geom = feature.geometry;
    function inPoly(coords) {
      const outer = g().pointInRing(lat, lon, coords[0]);
      if (!outer) return false;
      for (let h = 1; h < coords.length; h++) {
        if (g().pointInRing(lat, lon, coords[h])) return false;
      }
      return true;
    }
    if (geom.type === "Polygon") return inPoly(geom.coordinates);
    if (geom.type === "MultiPolygon") {
      for (let i = 0; i < geom.coordinates.length; i++) if (inPoly(geom.coordinates[i])) return true;
    }
    return false;
  }

  function segmentDistanceKm(lat, lon, a, b) {
    const samples = 8;
    let best = Infinity;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const slon = a[0] + (b[0] - a[0]) * t;
      const slat = a[1] + (b[1] - a[1]) * t;
      const d = g().haversineKm(lat, lon, slat, slon);
      if (d < best) best = d;
    }
    return best;
  }

  function intersectsCircle(feature, lat, lon, radiusKm) {
    if (!feature || !feature.geometry || radiusKm <= 0) return false;
    const box = g().bbox(feature.geometry);
    const reach = radiusKm / 111;
    if (lon + reach < box.minX || lon - reach > box.maxX || lat + reach < box.minY || lat - reach > box.maxY) {
      /* dateline-safe enough for this resolution; still test point-in-poly */
      if (!pointInFeature(feature, lat, lon)) return false;
    }
    if (pointInFeature(feature, lat, lon)) return true;
    const rings = g().ringsOf(feature.geometry);
    for (let r = 0; r < rings.length; r++) {
      const ring = rings[r];
      for (let i = 0; i < ring.length; i++) {
        const d = g().haversineKm(lat, lon, ring[i][1], ring[i][0]);
        if (d <= radiusKm) return true;
        const j = (i + 1) % ring.length;
        if (segmentDistanceKm(lat, lon, ring[i], ring[j]) <= radiusKm) return true;
      }
    }
    return false;
  }

  function sampleIntersectionAreaKm2(feature, lat, lon, radiusKm) {
    if (radiusKm <= 0) return 0;
    if (!intersectsCircle(feature, lat, lon, radiusKm)) return 0;
    const n = 18;
    let hit = 0;
    let total = 0;
    for (let iy = 0; iy < n; iy++) {
      for (let ix = 0; ix < n; ix++) {
        const ang = 2 * Math.PI * (ix + 0.5) / n;
        const rad = radiusKm * Math.sqrt((iy + 0.5) / n);
        const p = g().destination(lat, lon, ang * 180 / Math.PI, rad);
        total++;
        if (pointInFeature(feature, p.lat, p.lon)) hit++;
      }
    }
    return (hit / total) * Math.PI * radiusKm * radiusKm;
  }

  function countryAt(features, lat, lon) {
    for (let i = 0; i < features.length; i++) {
      if (pointInFeature(features[i], lat, lon)) return features[i];
    }
    return null;
  }

  return {
    countryAreaKm2: countryAreaKm2,
    pointInFeature: pointInFeature,
    intersectsCircle: intersectsCircle,
    sampleIntersectionAreaKm2: sampleIntersectionAreaKm2,
    countryAt: countryAt
  };
});
