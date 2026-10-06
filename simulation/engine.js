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

  function facts(scenario, location, physical, population) {
    const blast = physical.blast.contours.map(function (c) {
      return c.psi + " psi at " + c.radiusKm.toFixed(1) + " km";
    }).join(", ");
    const country = population.countries[0] ? population.countries[0].name : "no country polygon";
    const people = population.exposedPopulation;
    const list = [
      { text: scenario.name + " at " + location.label + ": " + scenario.yieldKt + " kt, " + scenario.burstType + " burst, " + scenario.heightM + " m.", sourceIds: [scenario.source] },
      { text: "This run: " + blast + ". Heat severe-fluence radius " + physical.thermal.severeRadiusKm.toFixed(1) + " km. Prompt 1 rad contour " + physical.radiation.maxRadiusKm.toFixed(1) + " km.", sourceIds: ["glasstone-1977", "sublette-faq"] },
      { text: "Ground zero is inside " + country + ". Sampled land inside the heat/blast circle is " + Math.round(population.affectedLandKm2) + " km². A category means the contour touches that country, not that the whole country is affected.", sourceIds: ["natural-earth"] },
      { text: "People estimate: " + (isFinite(people) ? Math.round(people).toLocaleString() : "unavailable") + ". It spreads the country's total population evenly, so a rural point in a large country is too high and a city centre is too low.", sourceIds: ["natural-earth", "un-wpp"] },
      { text: scenario.historicalContext, sourceIds: [scenario.source] }
    ];
    if (physical.fallout.enabled) {
      list.push({ text: "Fallout is a simplified " + physical.fallout.windMph + " mph wind sketch, not a weather forecast. Outer band " + Math.round(physical.fallout.maxDownwindKm) + " km.", sourceIds: ["miller-1964"] });
    } else {
      list.push({ text: "Local fallout is off for this air burst. Prompt radiation is separate and much smaller than the blast.", sourceIds: ["glasstone-1977"] });
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
    const factList = facts(scenario, location, physical, population);
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
