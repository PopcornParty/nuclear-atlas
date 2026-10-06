/* Runs every model and builds the report. No display strings invent numbers. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.NA = root.NA || {}; root.NA.engine = api; }
})(typeof self !== "undefined" ? self : this, function () {
  function na() { return (typeof self !== "undefined" ? self.NA : global.NA); }

  function validate(scenario, location) {
    if (!scenario) throw new Error("No scenario selected");
    if (!location || !na().finite(location.lat) || !na().finite(location.lon)) throw new Error("No location selected");
    if (location.lat < -90 || location.lat > 90 || location.lon < -180 || location.lon > 180) throw new Error("Location out of range");
    na().assertFinite("yield", scenario.yieldKt);
  }

  function timeline(scenario, physical) {
    const thermalT = physical.thermal.pulseSeconds;
    const blastT = na().blastModel.arrivalSeconds(scenario, physical.blast.maxRadiusKm);
    const steps = [
      { id: "det", tLabel: "T+0", title: "Detonation", detail: "Energy release begins. Yield " + scenario.yieldKt + " kt, " + scenario.burstType + " burst at " + scenario.heightM + " m.", layer: null },
      { id: "heat", tLabel: "T+" + thermalT.toFixed(2) + " s", title: "Thermal pulse", detail: "Thermal radiation is emitted over roughly this interval (approximate scaling). The map shows the clear-day fluence field.", layer: "heat" },
      { id: "blast", tLabel: "T+" + Math.max(1, blastT).toFixed(0) + " s", title: "Blast wave", detail: "Arrival time at the 1 psi contour is estimated from a pressure-adjusted sound speed. Near the source the shock is faster than this far-field figure.", layer: "blast" },
      { id: "rad", tLabel: "T+1 min", title: "Prompt-radiation consequences", detail: "Prompt neutrons and gammas are emitted in the first minute. This layer is not fallout.", layer: "radiation" }
    ];
    if (physical.fallout.enabled) {
      const hours = na().falloutModel.arrivalHours(physical.fallout.maxDownwindKm, physical.fallout.windMph);
      steps.push({ id: "fall", tLabel: "T+" + (hours ? hours.toFixed(1) : "—") + " h", title: "Fallout model", detail: "Simplified plume under a constant " + physical.fallout.windMph + " mph wind from " + physical.fallout.windFromDeg + "°. Estimate only.", layer: "fallout" });
    } else {
      steps.push({ id: "fall", tLabel: "Not modelled", title: "Fallout model off", detail: "This scenario is not surface-coupled. Local fallout is not drawn. Prompt radiation remains a separate layer.", layer: null });
    }
    steps.push({ id: "long", tLabel: "T+days", title: "Longer-term consequences", detail: "Infrastructure disruption, sheltering and economic exposure continue after the prompt effects. Displacement is not a measured count.", layer: "combined" });
    return steps;
  }

  function facts(scenario, physical) {
    const list = [
      { text: scenario.name + " is modelled as " + scenario.yieldKt + " kilotons, " + scenario.burstType + " burst, height " + scenario.heightM + " m.", sourceIds: [scenario.source] },
      { text: scenario.historicalContext, sourceIds: [scenario.source, "doe-trinity"].filter(function (id, i, a) { return scenario.id === "hist-trinity" ? true : id !== "doe-trinity"; }) },
      { text: "Blast radii use cube-root scaling from a 1 Mt airburst reference (about 2.8 km at 20 psi, 7.0 km at 5 psi, 21.7 km at 1 psi), adjusted for burst height.", sourceIds: ["glasstone-1977", "lovelace-1962"] },
      { text: "Thermal colours are a continuous fluence field anchored to a clear-day severe-fluence radius r = 0.67 × Y^0.41 km. They are not a fire outline.", sourceIds: ["sublette-faq", "glasstone-1977"] },
      { text: "Prompt radiation falls off much faster than blast because air attenuates neutrons and gammas. It is drawn separately from fallout.", sourceIds: ["glasstone-1977", "sandia-2022"] },
      { text: "A country category means a contour intersects that territory. It does not mean the country is destroyed.", sourceIds: ["natural-earth", "fema-planning"] },
      { text: "Population exposure uses Natural Earth POP_EST spread evenly over the country polygon. Cities are not resolved.", sourceIds: ["natural-earth", "un-wpp"] },
      { text: "Public preparedness sources describe getting inside, staying inside and staying tuned if fallout is possible. This app is not an emergency instruction for a real event.", sourceIds: ["ready-gov"] }
    ];
    if (physical.fallout.enabled) {
      list.push({ text: "Fallout bands use a constant-wind assumption (" + physical.fallout.windMph + " mph). Miller and the MIT educational calculator both treat wind as an explicit input. This is not a weather forecast.", sourceIds: ["miller-1964", "mit-fallout", "sandia-2022"] });
    } else {
      list.push({ text: "Local fallout is not modelled for this air burst. An air burst can still produce prompt radiation and, at very high altitude, other effects that are outside this model.", sourceIds: ["glasstone-1977"] });
    }
    return list;
  }

  function report(scenario, location, physical, population, economic) {
    return {
      title: "SIMULATION SUMMARY",
      location: location,
      scenario: { id: scenario.id, name: scenario.name, type: scenario.type, yieldKt: scenario.yieldKt, burstType: scenario.burstType, heightM: scenario.heightM },
      modelType: "Scaled Glasstone/Lovelace blast, clear-day thermal fit, prompt-dose extrapolation, optional constant-wind fallout",
      physical: {
        blast: physical.blast.contours,
        heat: physical.thermal.contours,
        radiation: physical.radiation.contours,
        fallout: physical.fallout
      },
      geographic: {
        affectedAreaKm2: physical.blast.areaKm2,
        countries: population.countries
      },
      human: {
        exposure: population.exposedPopulation,
        higherImpactExposure: population.higherImpactExposure,
        displacement: null,
        displacementNote: "No displacement count is produced. A housing inventory is not in this build.",
        historicalCasualties: scenario.id === "hist-trinity" ? "Trinity was a desert test. This app does not assign a death toll to it." : "No casualty count is produced. This is not a historical city case."
      },
      economic: economic,
      confidence: "Low for people and money. Medium for scaled blast radii under the stated idealisations. Fallout, when shown, is low confidence.",
      limitations: [physical.blast.limitations, physical.thermal.limitations, physical.radiation.limitations, physical.fallout.limitations, population.limitations, economic.limitations],
      sourceIds: Array.from(new Set([].concat(physical.blast.sourceIds, physical.thermal.sourceIds, physical.radiation.sourceIds, physical.fallout.sourceIds, population.sourceIds, economic.sourceIds, [scenario.source])))
    };
  }

  function run(scenario, location, features, options) {
    validate(scenario, location);
    const opts = options || {};
    const blast = na().blastModel.run(scenario);
    const thermal = na().thermalModel.run(scenario);
    const radiation = na().radiationModel.run(scenario);
    const fallout = na().falloutModel.run(scenario, { windMph: opts.windMph, windFromDeg: opts.windFromDeg });
    const physical = { blast: blast, thermal: thermal, radiation: radiation, fallout: fallout };
    const population = na().populationImpactModel.run(features || [], location.lat, location.lon, physical);
    population.countries.forEach(function (c) {
      const f = (features || []).find(function (ft) { return ft.properties.iso === c.iso; });
      c.gdpMd = f && f.properties.gdpMd;
      c.countryAreaKm2 = f ? na().geographyModel.countryAreaKm2(f) : null;
    });
    const economic = na().economicModel.run(physical, population);
    const steps = timeline(scenario, physical);
    const factList = facts(scenario, physical);
    const summary = report(scenario, location, physical, population, economic);
    return {
      scenario: scenario,
      location: location,
      physical: physical,
      population: population,
      economic: economic,
      timeline: steps,
      facts: factList,
      report: summary,
      generatedAt: "model-run"
    };
  }

  function compare(a, b) {
    function pack(r) {
      return {
        name: r.scenario.name,
        yieldKt: r.scenario.yieldKt,
        blastArea: r.physical.blast.areaKm2,
        thermalArea: r.physical.thermal.areaKm2,
        radiationArea: r.physical.radiation.areaKm2,
        fallout: r.physical.fallout.enabled ? r.physical.fallout.maxDownwindKm : 0,
        countries: r.population.countries.length,
        economicLow: r.economic.lowBillionUsd,
        economicHigh: r.economic.highBillionUsd,
        exposure: r.population.exposedPopulation
      };
    }
    return { a: pack(a), b: pack(b) };
  }

  return { run: run, compare: compare, validate: validate };
});
