/* Population exposure from uniform country density. Estimated. No invented city counts. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.NA = root.NA || {}; root.NA.populationImpactModel = api; }
})(typeof self !== "undefined" ? self : this, function () {
  function na() { return (typeof self !== "undefined" ? self.NA : global.NA); }

  const RANK = { EXTREME: 5, MAJOR: 4, MODERATE: 3, LIGHT: 2, MINIMAL: 1, "NO SIGNIFICANT MODELLED EFFECT": 0 };

  function run(features, lat, lon, physical) {
    const c = na().constants.CONSTANTS.population;
    const geo = na().geographyModel;
    const blastR = physical.blast.maxRadiusKm;
    const heatR = physical.thermal.maxRadiusKm;
    const radR = physical.radiation.maxRadiusKm;
    const reach = Math.max(blastR, heatR, radR, physical.fallout.enabled ? physical.fallout.maxDownwindKm : 0);
    const countries = [];
    let exposed = 0;
    let exposedHigh = 0;
    let areaHit = 0;
    const local = na().places && na().places.nearest(lat, lon, 220);
    const localDensity = local ? local.place.density : null;
    features.forEach(function (f) {
      const box = na().bbox(f.geometry);
      const pad = reach / 100;
      if (lon + pad < box.minX - 2 || lon - pad > box.maxX + 2 || lat + pad < box.minY - 2 || lat - pad > box.maxY + 2) {
        if (!geo.intersectsCircle(f, lat, lon, reach)) return;
      }
      const hitBlast = geo.intersectsCircle(f, lat, lon, blastR);
      const hitHeat = geo.intersectsCircle(f, lat, lon, heatR);
      const hitRad = geo.intersectsCircle(f, lat, lon, radR);
      const hitFall = physical.fallout.enabled && geo.intersectsCircle(f, lat, lon, physical.fallout.maxDownwindKm);
      if (!hitBlast && !hitHeat && !hitRad && !hitFall) return;
      const area = geo.countryAreaKm2(f);
      const pop = f.properties.pop;
      const popYear = f.properties.popYear;
      let worst = "LIGHT";
      let why = [];
      if (geo.intersectsCircle(f, lat, lon, physical.blast.contours[0].radiusKm)) { worst = "EXTREME"; why.push("20 psi blast contour intersects territory"); }
      else if (geo.intersectsCircle(f, lat, lon, physical.blast.contours[1].radiusKm)) { worst = "MAJOR"; why.push("5 psi blast contour intersects territory"); }
      else if (geo.intersectsCircle(f, lat, lon, physical.blast.contours[2].radiusKm)) { worst = "MODERATE"; why.push("interpolated 2 psi contour intersects territory"); }
      else if (hitBlast) { worst = "LIGHT"; why.push("1 psi blast contour intersects territory"); }
      else if (hitHeat) { worst = "WINDOW DAMAGE POSSIBLE"; why.push("thermal contour intersects territory but the 1 psi blast contour does not"); }
      else if (hitRad) { worst = "HEARD / FELT"; why.push("prompt-radiation contour intersects territory outside the structural blast contours"); }
      else if (hitFall) { worst = "MODERATE"; why.push("simplified fallout plume intersects territory"); }
      const land = geo.sampleIntersectionAreaKm2(f, lat, lon, Math.max(blastR, heatR));
      areaHit += land;
      let people = null;
      if (typeof pop === "number" && isFinite(pop) && area > 0) {
        const density = localDensity || (pop / area);
        people = density * land;
        exposed += people;
        if (RANK[worst] >= RANK.MAJOR) exposedHigh += people;
      }
      countries.push({
        name: f.properties.name,
        iso: f.properties.iso,
        category: worst,
        why: why.join("; "),
        explanation: "This category means the modelled contour touches some part of the country polygon. It does not mean the whole country is affected.",
        intersectionKm2: land,
        populationTotal: pop,
        populationYear: popYear,
        exposedEstimate: people,
        dataCoverage: people == null ? "Population figure missing in Natural Earth row" : "Uniform density from Natural Earth POP_EST"
      });
    });
    countries.sort(function (a, b) { return (RANK[b.category] || 0) - (RANK[a.category] || 0); });
    return {
      model: "populationImpactModel",
      status: c.status,
      sourceIds: c.sourceIds,
      units: c.units,
      limitations: c.limitations,
      countries: countries,
      affectedLandKm2: areaHit,
      exposedPopulation: exposed,
      higherImpactExposure: exposedHigh,
      place: local ? { name: local.place.name, kind: local.place.kind, distanceKm: local.distanceKm, pop: local.place.pop, areaKm2: local.place.areaKm2, density: local.place.density } : null,
      urbanArea: null,
      urbanNote: "Urban area is not calculated. This build has no urban-extent dataset, so none is invented.",
      agriculturalArea: null,
      agriculturalNote: "Agricultural area is not calculated. Land-cover data is not in this build."
    };
  }

  return { run: run };
});
