/* Prompt ionizing radiation. Distinct from fallout. Estimated. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.NA = root.NA || {}; root.NA.radiationModel = api; }
})(typeof self !== "undefined" ? self : this, function () {
  function consts() {
    return (typeof self !== "undefined" ? self.NA : global.NA).constants.CONSTANTS.radiation;
  }
  function geo() { return (typeof self !== "undefined" ? self.NA : global.NA); }

  function radiusForDose(yieldKt, doseRad) {
    const c = consts();
    geo().assertFinite("yieldKt", yieldKt);
    geo().assertFinite("doseRad", doseRad);
    const r1000 = c.refRadiusKm * Math.pow(yieldKt / c.refYieldKt, c.yieldExponent);
    return r1000 + c.tenthValueDistanceKm * Math.log10(c.refDoseRad / doseRad);
  }

  function doseAt(yieldKt, distanceKm) {
    const c = consts();
    geo().assertFinite("distanceKm", distanceKm);
    if (distanceKm < 0) throw new Error("distance must be >= 0");
    const r1000 = c.refRadiusKm * Math.pow(yieldKt / c.refYieldKt, c.yieldExponent);
    const dose = c.refDoseRad * Math.pow(10, -(distanceKm - r1000) / c.tenthValueDistanceKm);
    return {
      doseRad: dose,
      category: categoryFor(dose),
      note: "Educational tenth-value extrapolation around a published 1000 rad reference range. Factor-of-two uncertainty is expected."
    };
  }

  function categoryFor(dose) {
    const c = consts();
    if (!isFinite(dose)) return "MINIMAL";
    for (let i = 0; i < c.thresholds.length; i++) {
      if (dose >= c.thresholds[i].dose) return c.thresholds[i].category;
    }
    return "MINIMAL";
  }

  function contours(yieldKt) {
    const c = consts();
    return c.thresholds.map(function (th) {
      const radiusKm = Math.max(0.05, radiusForDose(yieldKt, th.dose));
      return {
        doseRad: th.dose,
        radiusKm: radiusKm,
        category: th.category,
        meaning: th.meaning,
        areaKm2: Math.PI * radiusKm * radiusKm
      };
    });
  }

  function run(scenario) {
    const c = consts();
    const rows = contours(scenario.yieldKt);
    return {
      model: "radiationModel",
      status: c.status,
      sourceIds: c.sourceIds,
      units: c.units,
      limitations: c.limitations,
      kind: "prompt",
      contours: rows,
      maxRadiusKm: rows[rows.length - 1].radiusKm,
      areaKm2: rows[rows.length - 1].areaKm2
    };
  }

  return { run: run, doseAt: doseAt, contours: contours, radiusForDose: radiusForDose };
});
