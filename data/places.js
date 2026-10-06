/* Place stats for local density. Country totals stay in Natural Earth.
   US state figures are rounded public totals, not a live census. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.NA = root.NA || {}; root.NA.places = api; }
})(typeof self !== "undefined" ? self : this, function () {
  const PLACES = [
    { name: "Kansas", kind: "US state", lat: 38.5, lon: -98.3, pop: 2940000, areaKm2: 213100 },
    { name: "Nebraska", kind: "US state", lat: 41.5, lon: -99.8, pop: 1970000, areaKm2: 200330 },
    { name: "Oklahoma", kind: "US state", lat: 35.6, lon: -97.5, pop: 4010000, areaKm2: 181040 },
    { name: "Texas", kind: "US state", lat: 31.5, lon: -99.3, pop: 30030000, areaKm2: 695660 },
    { name: "Colorado", kind: "US state", lat: 39.0, lon: -105.5, pop: 5830000, areaKm2: 269600 },
    { name: "Missouri", kind: "US state", lat: 38.4, lon: -92.5, pop: 6170000, areaKm2: 180540 },
    { name: "Iowa", kind: "US state", lat: 42.1, lon: -93.5, pop: 3200000, areaKm2: 145750 },
    { name: "Illinois", kind: "US state", lat: 40.0, lon: -89.2, pop: 12600000, areaKm2: 149990 },
    { name: "New York state", kind: "US state", lat: 42.9, lon: -75.5, pop: 19680000, areaKm2: 141300 },
    { name: "California", kind: "US state", lat: 37.2, lon: -119.5, pop: 39000000, areaKm2: 423970 },
    { name: "Florida", kind: "US state", lat: 28.6, lon: -82.4, pop: 22240000, areaKm2: 170310 },
    { name: "New York", kind: "city", lat: 40.71, lon: -74.01, pop: 8800000, areaKm2: 780 },
    { name: "Los Angeles", kind: "city", lat: 34.05, lon: -118.24, pop: 3900000, areaKm2: 1210 },
    { name: "Chicago", kind: "city", lat: 41.88, lon: -87.63, pop: 2700000, areaKm2: 590 },
    { name: "Houston", kind: "city", lat: 29.76, lon: -95.37, pop: 2300000, areaKm2: 1650 },
    { name: "London", kind: "city", lat: 51.51, lon: -0.13, pop: 8800000, areaKm2: 1570 },
    { name: "Paris", kind: "city", lat: 48.86, lon: 2.35, pop: 2100000, areaKm2: 105 },
    { name: "Tokyo", kind: "city", lat: 35.68, lon: 139.69, pop: 14000000, areaKm2: 2190 },
    { name: "Delhi", kind: "city", lat: 28.61, lon: 77.21, pop: 16700000, areaKm2: 1480 },
    { name: "Shanghai", kind: "city", lat: 31.23, lon: 121.47, pop: 24800000, areaKm2: 6340 },
    { name: "Cairo", kind: "city", lat: 30.04, lon: 31.24, pop: 10000000, areaKm2: 3080 },
    { name: "São Paulo", kind: "city", lat: -23.55, lon: -46.63, pop: 12300000, areaKm2: 1520 },
    { name: "Mexico City", kind: "city", lat: 19.43, lon: -99.13, pop: 9200000, areaKm2: 1490 },
    { name: "Lagos", kind: "city", lat: 6.52, lon: 3.38, pop: 15000000, areaKm2: 1170 },
    { name: "Hiroshima", kind: "city", lat: 34.39, lon: 132.45, pop: 1190000, areaKm2: 900 },
    { name: "Nagasaki", kind: "city", lat: 32.75, lon: 129.87, pop: 410000, areaKm2: 400 }
  ];
  PLACES.forEach(function (p) { p.density = p.pop / p.areaKm2; });

  function nearest(lat, lon, maxKm) {
    const geo = (typeof self !== "undefined" ? self.NA : global.NA);
    let best = null;
    let bestD = maxKm || 180;
    PLACES.forEach(function (p) {
      const d = geo.haversineKm(lat, lon, p.lat, p.lon);
      if (d < bestD) { bestD = d; best = p; }
    });
    return best ? { place: best, distanceKm: bestD } : null;
  }

  return { PLACES: PLACES, nearest: nearest };
});
