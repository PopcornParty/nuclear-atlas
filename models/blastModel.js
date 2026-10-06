/* Blast overpressure model. Calculated from published 1 Mt reference radii and cube-root scaling. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.NA = root.NA || {}; root.NA.blastModel = api; }
})(typeof self !== "undefined" ? self : this, function () {
  function consts() {
    return (typeof self !== "undefined" ? self.NA : global.NA).constants.CONSTANTS.blast;
  }
  function geo() {
    return (typeof self !== "undefined" ? self.NA : global.NA);
  }

  function interpolate2psi(points) {
    const a = points.find(function (p) { return p.psi === 5; });
    const b = points.find(function (p) { return p.psi === 1; });
    const t = (Math.log(5) - Math.log(2)) / (Math.log(5) - Math.log(1));
    const logKm = Math.log(a.km) + t * (Math.log(b.km) - Math.log(a.km));
    return Math.exp(logKm);
  }

  function heightFactor(scenario) {
    const c = consts();
    if (scenario.burstType === "surface" || scenario.heightM <= 50) return c.surfaceToAirRadiusRatio;
    if (scenario.burstType === "tower") return 0.85;
    return 1;
  }

  function radii(scenario) {
    const c = consts();
    geo().assertFinite("yieldKt", scenario.yieldKt);
    if (scenario.yieldKt <= 0) throw new Error("yield must be positive");
    const scale = Math.pow(scenario.yieldKt / c.referenceYieldKt, 1 / 3) * heightFactor(scenario);
    const twoPsi = interpolate2psi(c.airburstRadiiKm);
    return c.airburstRadiiKm.map(function (row) {
      const km = (row.psi === 2 ? twoPsi : row.km) * scale;
      return {
        psi: row.psi,
        radiusKm: km,
        category: row.category,
        meaning: row.meaning,
        interpolated: !!row.interpolated,
        areaKm2: Math.PI * km * km
      };
    });
  }

  function overpressureAt(scenario, distanceKm) {
    geo().assertFinite("distanceKm", distanceKm);
    if (distanceKm < 0) throw new Error("distance must be >= 0");
    const rows = radii(scenario).slice().sort(function (a, b) { return a.radiusKm - b.radiusKm; });
    if (distanceKm === 0) return { psi: 20, category: "EXTREME", extrapolated: true, note: "Inside the tabulated 20 psi contour; peak overpressure is higher and is not extrapolated as a precise value." };
    if (distanceKm <= rows[0].radiusKm) {
      return { psi: rows[0].psi, category: "EXTREME", extrapolated: false, note: "At or inside the 20 psi reference contour." };
    }
    for (let i = 0; i < rows.length - 1; i++) {
      if (distanceKm <= rows[i + 1].radiusKm) {
        const t = (Math.log(distanceKm) - Math.log(rows[i].radiusKm)) / (Math.log(rows[i + 1].radiusKm) - Math.log(rows[i].radiusKm));
        const logPsi = Math.log(rows[i].psi) + t * (Math.log(rows[i + 1].psi) - Math.log(rows[i].psi));
        return { psi: Math.exp(logPsi), category: rows[i].category === "EXTREME" ? "MAJOR" : rows[i + 1].category, extrapolated: false, note: "Log-interpolated between tabulated contours." };
      }
    }
    const last = rows[rows.length - 1];
    return { psi: last.psi * Math.pow(last.radiusKm / distanceKm, 1.4), category: "MINIMAL", extrapolated: true, note: "Outside the 1 psi contour. Value is a rough falloff, not a tabulated result." };
  }

  function categoryAt(scenario, distanceKm) {
    const rows = radii(scenario).slice().sort(function (a, b) { return a.radiusKm - b.radiusKm; });
    if (distanceKm <= rows[0].radiusKm) return "EXTREME";
    if (distanceKm <= rows[1].radiusKm) return "MAJOR";
    if (distanceKm <= rows[2].radiusKm) return "MODERATE";
    if (distanceKm <= rows[3].radiusKm) return "LIGHT";
    return "MINIMAL";
  }

  function arrivalSeconds(scenario, distanceKm) {
    const c = consts();
    const op = overpressureAt(scenario, Math.max(distanceKm, 0.05));
    const speed = c.ambientSoundSpeedMps * (1 + Math.max(op.psi, 0) / 14.7);
    return (distanceKm * 1000) / speed;
  }

  function run(scenario) {
    const c = consts();
    const rows = radii(scenario);
    return {
      model: "blastModel",
      status: c.status,
      sourceIds: c.sourceIds,
      units: c.units,
      limitations: c.limitations,
      heightFactor: heightFactor(scenario),
      contours: rows,
      maxRadiusKm: rows[rows.length - 1].radiusKm,
      areaKm2: rows[rows.length - 1].areaKm2
    };
  }

  return { run: run, radii: radii, overpressureAt: overpressureAt, categoryAt: categoryAt, arrivalSeconds: arrivalSeconds, heightFactor: heightFactor };
});
