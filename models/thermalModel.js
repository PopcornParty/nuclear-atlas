/* Thermal fluence model. Estimated clear-day power law; continuous falloff. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.NA = root.NA || {}; root.NA.thermalModel = api; }
})(typeof self !== "undefined" ? self : this, function () {
  function consts() {
    return (typeof self !== "undefined" ? self.NA : global.NA).constants.CONSTANTS.thermal;
  }
  function geo() { return (typeof self !== "undefined" ? self.NA : global.NA); }

  function severeRadiusKm(yieldKt) {
    const c = consts();
    geo().assertFinite("yieldKt", yieldKt);
    if (yieldKt <= 0) throw new Error("yield must be positive");
    return c.severeRadiusCoeff * Math.pow(yieldKt, c.severeRadiusExponent);
  }

  function fluenceAt(yieldKt, distanceKm) {
    geo().assertFinite("distanceKm", distanceKm);
    if (distanceKm <= 0) return { fluence: null, category: "EXTREME", note: "Inside the fireball region the far-field fluence formula does not apply." };
    const c = consts();
    const r10 = severeRadiusKm(yieldKt);
    const fluence = c.severeFluenceCalCm2 * Math.pow(r10 / distanceKm, 2);
    return { fluence: fluence, category: categoryFor(fluence), note: "Inverse-square falloff anchored to the clear-day severe-fluence radius. Atmospheric absorption is only implicit in that fit." };
  }

  function categoryFor(fluence) {
    const c = consts();
    if (fluence == null) return "EXTREME";
    for (let i = 0; i < c.thresholds.length; i++) {
      if (fluence >= c.thresholds[i].fluence) return c.thresholds[i].category;
    }
    return "MINIMAL";
  }

  function contours(yieldKt) {
    const c = consts();
    const r10 = severeRadiusKm(yieldKt);
    return c.thresholds.map(function (th) {
      const radiusKm = r10 * Math.sqrt(c.severeFluenceCalCm2 / th.fluence);
      return {
        fluence: th.fluence,
        radiusKm: radiusKm,
        category: th.category,
        meaning: th.meaning,
        areaKm2: Math.PI * radiusKm * radiusKm
      };
    });
  }

  function pulseSeconds(yieldKt) {
    /* Glasstone discusses a thermal pulse lasting from a fraction of a second to several seconds as yield rises.
       Approximate scaling used only for the timeline label. */
    return 0.06 * Math.pow(yieldKt, 0.42);
  }

  function run(scenario) {
    const c = consts();
    const rows = contours(scenario.yieldKt);
    return {
      model: "thermalModel",
      status: c.status,
      sourceIds: c.sourceIds,
      units: c.units,
      limitations: c.limitations,
      severeRadiusKm: severeRadiusKm(scenario.yieldKt),
      pulseSeconds: pulseSeconds(scenario.yieldKt),
      contours: rows,
      maxRadiusKm: rows[rows.length - 1].radiusKm,
      areaKm2: rows[rows.length - 1].areaKm2
    };
  }

  return { run: run, fluenceAt: fluenceAt, contours: contours, severeRadiusKm: severeRadiusKm, pulseSeconds: pulseSeconds };
});
