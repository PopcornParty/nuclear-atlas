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
    },
    {
      id: "hist-little-boy",
      name: "Historic: Little Boy",
      type: "Historic detonation, location locked",
      yieldKt: 15,
      burstType: "air",
      heightM: 600,
      source: "doe-hiroshima",
      sourceDate: "1945-08-06",
      historicalContext: "Little Boy was detonated over Hiroshima on 6 August 1945. Published yield is about 15 kilotons. The burst height was about 600 metres. This scenario is locked to the documented hypocenter. It cannot be moved.",
      assumptions: ["Yield fixed at 15 kt", "Air burst at 600 m", "Location locked to the Hiroshima hypocenter", "Local fallout model off"],
      modelParameters: { falloutEnabled: false, windMph: null, locationLocked: true, lockedLat: 34.3947, lockedLon: 132.4547, lockedLabel: "Hiroshima hypocenter, 6 August 1945" },
      supportsFallout: false
    },
    {
      id: "hist-fat-man",
      name: "Historic: Fat Man",
      type: "Historic detonation, location locked",
      yieldKt: 21,
      burstType: "air",
      heightM: 503,
      source: "doe-hiroshima",
      sourceDate: "1945-08-09",
      historicalContext: "Fat Man was detonated over Nagasaki on 9 August 1945. Published yield is about 21 kilotons. The burst height was about 500 metres. This scenario is locked to the documented hypocenter. It cannot be moved.",
      assumptions: ["Yield fixed at 21 kt", "Air burst at 503 m", "Location locked to the Nagasaki hypocenter", "Local fallout model off"],
      modelParameters: { falloutEnabled: false, windMph: null, locationLocked: true, lockedLat: 32.7731, lockedLon: 129.8632, lockedLabel: "Nagasaki hypocenter, 9 August 1945" },
      supportsFallout: false
    },
    {
      id: "hist-bravo",
      name: "Historic test: Castle Bravo",
      type: "Extreme historical-scale test scenario",
      yieldKt: 15000,
      burstType: "surface",
      heightM: 2,
      source: "doe-bravo",
      sourceDate: "1954-03-01",
      historicalContext: "Castle Bravo, 1 March 1954, was a thermonuclear test at Bikini Atoll. Published yield was about 15 megatons. This scenario is locked to the test site. The fallout shape is a simplified wind model, not the 1954 weather.",
      assumptions: ["Yield fixed at 15,000 kt", "Near-surface test", "Location locked to Bikini Atoll", "Constant-wind assumption"],
      modelParameters: { falloutEnabled: true, windMph: 15, locationLocked: true, lockedLat: 11.697, lockedLon: 165.273, lockedLabel: "Castle Bravo site, Bikini Atoll, 1 March 1954" },
      supportsFallout: true
    },
    {
      id: "icbm-charlie",
      name: "ICBM-scale case CHARLIE",
      type: "Fictional ICBM-scale energy release",
      yieldKt: 150,
      burstType: "air",
      heightM: 1200,
      source: "glasstone-1977",
      sourceDate: "1977",
      historicalContext: "Smaller fictional ICBM-scale energy release. Place it by tapping the map. No flight path is drawn.",
      assumptions: ["150 kt air burst at 1200 m", "No missile trajectory"],
      modelParameters: { falloutEnabled: false, windMph: null, locationLocked: false },
      supportsFallout: false
    },
    {
      id: "icbm-delta",
      name: "ICBM-scale case DELTA",
      type: "Fictional ICBM-scale energy release",
      yieldKt: 300,
      burstType: "air",
      heightM: 1500,
      source: "glasstone-1977",
      sourceDate: "1977",
      historicalContext: "Fictional 300 kt energy release. Tap the map to place it. This is not a missile and not a target planner.",
      assumptions: ["300 kt air burst at 1500 m", "No missile trajectory"],
      modelParameters: { falloutEnabled: false, windMph: null, locationLocked: false },
      supportsFallout: false
    },
    {
      id: "icbm-foxtrot",
      name: "ICBM-scale case FOXTROT",
      type: "Fictional ICBM-scale energy release",
      yieldKt: 500,
      burstType: "air",
      heightM: 1600,
      source: "glasstone-1977",
      sourceDate: "1977",
      historicalContext: "Fictional 500 kt energy release for scale comparison. Tap the map. No launch site and no guidance model.",
      assumptions: ["500 kt air burst at 1600 m", "No missile trajectory"],
      modelParameters: { falloutEnabled: false, windMph: null, locationLocked: false },
      supportsFallout: false
    },
    {
      id: "icbm-echo",
      name: "ICBM-scale case ECHO",
      type: "Fictional ICBM-scale energy release",
      yieldKt: 800,
      burstType: "air",
      heightM: 1800,
      source: "glasstone-1977",
      sourceDate: "1977",
      historicalContext: "Fictional 800 kt energy release. Tap the map. Blast, heat and prompt radiation only.",
      assumptions: ["800 kt air burst at 1800 m", "No missile trajectory"],
      modelParameters: { falloutEnabled: false, windMph: null, locationLocked: false },
      supportsFallout: false
    },
    {
      id: "icbm-golf",
      name: "ICBM-scale case GOLF",
      type: "Fictional ICBM-scale energy release",
      yieldKt: 1000,
      burstType: "air",
      heightM: 2000,
      source: "glasstone-1977",
      sourceDate: "1977",
      historicalContext: "Fictional 1 megaton energy release. Tap the map. Not a real missile type.",
      assumptions: ["1000 kt air burst at 2000 m", "No missile trajectory"],
      modelParameters: { falloutEnabled: false, windMph: null, locationLocked: false },
      supportsFallout: false
    },
    {
      id: "fic-50",
      name: "Fictional case DELTA",
      type: "Small fictional nuclear detonation",
      yieldKt: 50,
      burstType: "air",
      heightM: 800,
      source: "glasstone-1977",
      sourceDate: "1977",
      historicalContext: "Fictional 50 kt air burst. Tap the map, or press SIMULATE to use the map centre.",
      assumptions: ["50 kt air burst at 800 m", "Fallout model off"],
      modelParameters: { falloutEnabled: false, windMph: null, locationLocked: false },
      supportsFallout: false
    },
    {
      id: "fic-mt",
      name: "Fictional case ECHO",
      type: "Large fictional detonation",
      yieldKt: 1000,
      burstType: "air",
      heightM: 2000,
      source: "glasstone-1977",
      sourceDate: "1977",
      historicalContext: "Fictional 1 megaton air burst for scale. Not a weapon and not a target list.",
      assumptions: ["1000 kt air burst at 2000 m", "Fallout model off"],
      modelParameters: { falloutEnabled: false, windMph: null, locationLocked: false },
      supportsFallout: false
    },
    {
      id: "icbm-hotel",
      name: "ICBM-scale case HOTEL",
      type: "Fictional ICBM-scale energy release",
      yieldKt: 1200,
      burstType: "air",
      heightM: 2200,
      source: "glasstone-1977",
      sourceDate: "1977",
      historicalContext: "Fictional 1.2 megaton energy release. Place it on the map. No flight path.",
      assumptions: ["1200 kt air burst", "No missile trajectory"],
      modelParameters: { falloutEnabled: false, windMph: null, locationLocked: false },
      supportsFallout: false
    },
    {
      id: "icbm-india",
      name: "ICBM-scale case INDIA",
      type: "Fictional ICBM-scale energy release",
      yieldKt: 1500,
      burstType: "surface",
      heightM: 0,
      source: "glasstone-1977",
      sourceDate: "1977",
      historicalContext: "Fictional 1.5 megaton surface-coupled energy release so the simplified fallout sketch can be compared. Not a missile flight.",
      assumptions: ["1500 kt surface burst", "Constant-wind fallout sketch"],
      modelParameters: { falloutEnabled: true, windMph: 15, locationLocked: false },
      supportsFallout: true
    }
  ];

  function byId(id) {
    return SCENARIOS.find(function (s) { return s.id === id; }) || null;
  }

  return { SCENARIOS: SCENARIOS, byId: byId };
});
