/* Fictional sandbox scenarios plus one location-locked historical test.
   No weapon design, delivery or procurement fields. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.NA = root.NA || {}; root.NA.scenarios = api; }
})(typeof self !== "undefined" ? self : this, function () {
  const SCENARIOS = [
    {
      id: "fic-small",
      name: "Fictional case ALPHA",
      type: "Small fictional nuclear detonation",
      yieldKt: 15,
      burstType: "air",
      heightM: 600,
      source: "glasstone-1977",
      sourceDate: "1977",
      historicalContext: "Fictional sandbox case. The 15 kt energy release is in the same order as the published yield of the 1945 Hiroshima detonation, used here only as a scale comparison — this scenario is not that event and is not aimed at a real city.",
      assumptions: [
        "Single prompt energy release of 15 kilotons TNT equivalent",
        "Air burst at 600 m, a scenario assumption so the fireball does not couple to the surface",
        "Clear-day thermal transmissivity embedded in the thermal fit",
        "Flat terrain, sea-level air density"
      ],
      modelParameters: { falloutEnabled: false, windMph: null, locationLocked: false },
      supportsFallout: false
    },
    {
      id: "fic-medium",
      name: "Fictional case BRAVO",
      type: "Medium fictional detonation",
      yieldKt: 100,
      burstType: "surface",
      heightM: 0,
      source: "glasstone-1977",
      sourceDate: "1977",
      historicalContext: "Fictional surface-coupled case for comparing blast, thermal and a simplified fallout plume. Not a stockpile weapon and not a target study.",
      assumptions: [
        "100 kiloton energy release",
        "Contact surface burst so a local fallout model is switched on",
        "Constant wind at the selected educational speed (default 15 mph)",
        "No rainout"
      ],
      modelParameters: { falloutEnabled: true, windMph: 15, locationLocked: false },
      supportsFallout: true
    },
    {
      id: "fic-large",
      name: "Fictional case CHARLIE",
      type: "Large fictional detonation",
      yieldKt: 1000,
      burstType: "air",
      heightM: 2000,
      source: "glasstone-1977",
      sourceDate: "1977",
      historicalContext: "Fictional 1 megaton air-burst reference. Used because published blast curves are often tabulated at 1 Mt and then scaled. Not a deployed weapon.",
      assumptions: [
        "1000 kiloton energy release",
        "Air burst at 2000 m",
        "Local fallout model off because the scenario is not surface-coupled",
        "Cube-root scaling from the 1 Mt reference curve"
      ],
      modelParameters: { falloutEnabled: false, windMph: null, locationLocked: false },
      supportsFallout: false
    },
    {
      id: "hist-trinity",
      name: "Historical test: Trinity",
      type: "Extreme historical-scale test scenario",
      yieldKt: 21,
      burstType: "tower",
      heightM: 30.5,
      source: "doe-trinity",
      sourceDate: "1945-07-16",
      historicalContext: "Trinity, 16 July 1945, was the first nuclear test. It was fired from a 100-foot tower on the Alamogordo range in New Mexico. Published yield is about 21 kilotons; early gauges disagreed. This scenario is locked to the documented test site.",
      assumptions: [
        "Yield fixed at 21 kt (published approximate figure; historical estimates span roughly the high teens to low 20s)",
        "Height fixed at 30.5 m (100 ft tower)",
        "Location locked to the public test-site coordinate",
        "Near-surface coupling, so the simplified fallout model is shown as an illustration — the real 1945 fallout was measured under that day's weather, which this model does not reconstruct"
      ],
      modelParameters: {
        falloutEnabled: true,
        windMph: 15,
        locationLocked: true,
        lockedLat: 33.6773,
        lockedLon: -106.4754,
        lockedLabel: "Trinity site, New Mexico (documented test coordinate)"
      },
      supportsFallout: true
    }
  ];

  function byId(id) {
    return SCENARIOS.find(function (s) { return s.id === id; }) || null;
  }

  return { SCENARIOS: SCENARIOS, byId: byId };
});
