/* Economic exposure range. Estimated share of dataset GDP. Not a loss forecast. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.NA = root.NA || {}; root.NA.economicModel = api; }
})(typeof self !== "undefined" ? self : this, function () {
  function na() { return (typeof self !== "undefined" ? self.NA : global.NA); }

  function sectorFrom(physical, population) {
    const blast = physical.blast.contours;
    const hasMajor = blast[1].radiusKm > 0;
    function level(cat) { return cat; }
    return [
      { id: "BUILDINGS", category: "EXTREME", note: "Tied to the 20 psi and 5 psi structural contours." },
      { id: "INFRASTRUCTURE", category: "MAJOR", note: "Bridges, plants and buried services are not mapped; category follows major blast." },
      { id: "TRANSPORT", category: physical.fallout.enabled ? "MAJOR" : "MODERATE", note: "Road blockage follows blast. Fallout, where modelled, adds a disruption band." },
      { id: "POWER", category: "MAJOR", note: "No power-grid dataset. Category follows major structural damage." },
      { id: "COMMUNICATIONS", category: "MODERATE", note: "Electromagnetic pulse is not modelled in this build." },
      { id: "HEALTHCARE", category: physical.radiation.contours[1] ? "MAJOR" : "MODERATE", note: "Capacity pressure inferred from blast damage plus prompt-radiation footprint. No hospital inventory." },
      { id: "BUSINESS INTERRUPTION", category: "MODERATE", note: "Interruption is inferred from area, not from firm-level data." },
      { id: "HOUSING", category: "MAJOR", note: "Housing stock is not mapped. Category follows major blast damage." },
      { id: "AGRICULTURE", category: physical.fallout.enabled ? "MODERATE" : "MINIMAL", note: population.agriculturalNote },
      { id: "GOVERNMENT SERVICES", category: "MODERATE", note: "Administrative disruption inferred from infrastructure damage. Offices are not mapped." }
    ].map(function (s) { s.category = level(s.category); return s; });
  }

  function run(physical, population) {
    const c = na().constants.CONSTANTS.economic;
    const fractions = c.damageFractionByCategory;
    let low = 0;
    let high = 0;
    let covered = 0;
    let missing = 0;
    (population.countries || []).forEach(function (country) {
      if (typeof country.populationTotal !== "number") missing++;
      const gdpMd = country.gdpMd;
      const area = country.countryAreaKm2;
      if (typeof gdpMd !== "number" || !isFinite(gdpMd) || typeof area !== "number" || area <= 0) {
        missing++;
        return;
      }
      covered++;
      const share = Math.max(0, Math.min(0.25, country.intersectionKm2 / area));
      const band = fractions[country.category] || fractions.LIGHT;
      low += share * band[0] * gdpMd;
      high += share * band[1] * gdpMd;
    });
    const confidence = covered === 0 ? "Unavailable" : "Low";
    return {
      model: "economicModel",
      status: c.status,
      sourceIds: c.sourceIds,
      units: c.units,
      limitations: c.limitations,
      lowMillionUsd: covered ? low : null,
      highMillionUsd: covered ? high : null,
      lowBillionUsd: covered ? low / 1000 : null,
      highBillionUsd: covered ? high / 1000 : null,
      confidence: confidence,
      dataCoverage: covered + " country rows with GDP and area; " + missing + " skipped for missing data",
      why: "Money is an exposure share of the country's dataset GDP, capped so a small circle cannot be priced as the whole country. Rural points are still too high and city points too low, because people and jobs are not mapped.",
      sectors: sectorFrom(physical, population),
      currencyNote: "Dataset currency is US dollars (GDP_MD_EST, mostly 2016). Not converted to pounds, because this build has no exchange-rate source."
    };
  }

  return { run: run };
});
