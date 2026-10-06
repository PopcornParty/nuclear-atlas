/* Simulation state. Restart clears the run. New scenario keeps learn progress. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.NA = root.NA || {}; root.NA.state = api; }
})(typeof self !== "undefined" ? self : this, function () {
  function fresh() {
    return {
      scenarioId: null,
      location: null,
      windMph: 15,
      windFromDeg: 270,
      layers: { heat: true, blast: true, radiation: true, fallout: true, combined: false },
      opacity: 0.72,
      result: null,
      compareId: null,
      compareResult: null,
      timelineIndex: -1,
      playing: false,
      report: null
    };
  }

  const progress = { topics: {}, sourcesOpened: {} };

  let sim = fresh();

  function resetSimulation() {
    const layers = sim.layers;
    const opacity = sim.opacity;
    sim = fresh();
    sim.layers = layers;
    sim.opacity = opacity;
    return snapshot();
  }

  function restart() {
    sim = fresh();
    return snapshot();
  }

  function snapshot() {
    return JSON.parse(JSON.stringify(sim));
  }

  function setScenario(id) {
    sim.scenarioId = id;
    sim.result = null;
    sim.compareResult = null;
    sim.report = null;
    sim.timelineIndex = -1;
    sim.playing = false;
    sim.location = null;
    return snapshot();
  }

  function setLocation(loc) {
    sim.location = loc;
    sim.result = null;
    sim.report = null;
    sim.timelineIndex = -1;
    return snapshot();
  }

  function setResult(result) {
    sim.result = result;
    sim.timelineIndex = -1;
    sim.playing = true;
    return snapshot();
  }

  return {
    fresh: fresh,
    restart: restart,
    resetSimulation: resetSimulation,
    snapshot: snapshot,
    setScenario: setScenario,
    setLocation: setLocation,
    setResult: setResult,
    progress: progress,
    get sim() { return sim; },
    set sim(v) { sim = v; }
  };
});
