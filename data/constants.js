/* Scientific constants. Values live here, not in the interface.
   Each block records source, units, and whether it is measured, calculated or estimated.
*/
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.NA = root.NA || {}; root.NA.constants = api; }
})(typeof self !== "undefined" ? self : this, function () {
  const CONSTANTS = {
    blast: {
      sourceIds: ["glasstone-1977", "lovelace-1962"],
      status: "calculated",
      units: { radius: "km", overpressure: "psi", yield: "kilotons TNT equivalent" },
      limitations: "Scaled from a 1 Mt optimum-airburst reference curve. Real overpressure depends on height of burst, terrain, weather and buildings. The 2 psi radius is log-interpolated, not a tabulated digit.",
      /* Anchored so a 15 kt airburst matches published Hiroshima-order ranges:
         about 0.8 km at 20 psi, 1.8 km at 5 psi, 4.2 km at 1 psi.
         Cube-root scaling then gives the 1 Mt row below. */
      referenceYieldKt: 1000,
      airburstRadiiKm: [
        { psi: 20, km: 3.4, category: "EXTREME", meaning: "Severe structural destruction in the modelled area." },
        { psi: 5, km: 7.3, category: "MAJOR", meaning: "Major structural and infrastructure damage." },
        { psi: 2, km: null, category: "MODERATE", meaning: "Significant damage; widespread broken windows and infrastructure disruption.", interpolated: true },
        { psi: 1, km: 17.0, category: "LIGHT", meaning: "Limited structural damage; broken windows and other lighter effects may occur." }
      ],
      /* Published comparison: 1 Mt contact surface burst reaches 5 psi near 4.4 km, versus 7.0 km for the airburst reference. */
      surfaceToAirRadiusRatio: 4.4 / 7.0,
      scaling: "cube-root",
      ambientSoundSpeedMps: 340
    },
    thermal: {
      sourceIds: ["glasstone-1977", "sublette-faq", "sandia-2022"],
      status: "estimated",
      units: { fluence: "cal/cm²", radius: "km", yield: "kilotons" },
      limitations: "Uses a clear-day power-law fit. Cloud, haze, terrain shadowing and clothing are not modelled. Fluence is not a burn forecast for a specific person.",
      /* Sublette clear-day fit cited for the ~10 cal/cm² (severe exposed-skin thermal) radius: r_km = 0.67 * Y_kt^0.41 */
      severeRadiusCoeff: 0.67,
      severeRadiusExponent: 0.41,
      severeFluenceCalCm2: 10,
      thresholds: [
        { fluence: 10, category: "EXTREME", meaning: "Modelled severe thermal fluence on exposed surfaces (clear-day estimate)." },
        { fluence: 5, category: "MAJOR", meaning: "High thermal fluence; ignition of some light materials is discussed in the source literature." },
        { fluence: 2, category: "MODERATE", meaning: "Intermediate thermal fluence; effects depend strongly on exposure and materials." },
        { fluence: 1, category: "LIGHT", meaning: "Lower modelled fluence; still above the 1 cal/cm² educational contour." }
      ]
    },
    radiation: {
      sourceIds: ["glasstone-1977", "sublette-faq", "sandia-2022", "iaea-radiation"],
      status: "estimated",
      units: { dose: "rad (approximate; 1 rad ≈ 0.01 Gy in soft tissue for this educational display)", radius: "km" },
      limitations: "Prompt dose is air-transported ionizing radiation in the first minute. It is not fallout. Glasstone presents this graphically with about a factor-of-two uncertainty. Shielding is not modelled.",
      /* Sublette worked point: 20 kt, 1000 rad at about 1.24 km. Radius grows slowly, about Y^0.19. */
      refYieldKt: 20,
      refDoseRad: 1000,
      refRadiusKm: 1.24,
      yieldExponent: 0.19,
      tenthValueDistanceKm: 0.42,
      thresholds: [
        { dose: 600, category: "EXTREME", meaning: "Modelled prompt dose in the range historically discussed near median lethal dose for unsupported acute exposure. Not a prediction for a sheltered person." },
        { dose: 100, category: "MAJOR", meaning: "Modelled prompt dose well above background; acute effects depend on dose rate and shielding." },
        { dose: 10, category: "MODERATE", meaning: "Modelled prompt dose above typical annual background, below the higher acute thresholds used here." },
        { dose: 1, category: "LIGHT", meaning: "Modelled prompt dose near 1 rad. Distinguish this from fallout." }
      ]
    },
    fallout: {
      sourceIds: ["glasstone-1977", "miller-1964", "mit-fallout", "sandia-2022", "ready-gov"],
      status: "estimated",
      units: { length: "km", wind: "mph", doseBand: "order-of-magnitude outdoor dose band, not a measurement" },
      limitations: "Simplified constant-wind plume. No vertical wind shear, no rain, no particle-size spectrum, no real forecast. Sandia notes generic fallout maps are not a substitute for meteorology. Displayed only for surface-coupled scenarios.",
      defaultWindMph: 15,
      windOptionsMph: [15, 30],
      /* Order-of-magnitude educational scaling for a 1 Mt surface burst at 15 mph.
         These anchors are modelling assumptions for a directional illustration, not measured contours. */
      anchors: {
        yieldMt: 1,
        windMph: 15,
        bands: [
          { id: "high", category: "EXTREME", downwindKm: 180, crosswindKm: 28, label: "Higher modelled deposition band" },
          { id: "mid", category: "MAJOR", downwindKm: 320, crosswindKm: 48, label: "Intermediate modelled deposition band" },
          { id: "low", category: "MODERATE", downwindKm: 520, crosswindKm: 80, label: "Outer modelled deposition band" }
        ]
      },
      yieldExponent: 0.5,
      fireballCoeffM: 90,
      fireballExponent: 0.4
    },
    economic: {
      sourceIds: ["natural-earth", "fema-planning"],
      status: "estimated",
      units: { money: "dataset USD, millions as published then converted to billions for display", area: "km²" },
      limitations: "Exposure share of a national GDP figure. Not an insured-loss model. Building density, wages and reconstruction prices are not in this dataset.",
      damageFractionByCategory: {
        EXTREME: [0.45, 0.8],
        MAJOR: [0.2, 0.45],
        MODERATE: [0.05, 0.2],
        LIGHT: [0.01, 0.05],
        MINIMAL: [0, 0.01]
      }
    },
    population: {
      sourceIds: ["natural-earth", "un-wpp"],
      status: "estimated",
      units: { people: "persons", density: "persons/km²" },
      limitations: "Uniform-density assumption inside each country polygon. Cities are not resolved. POP_EST years are mostly 2017."
    },
    geography: {
      sourceIds: ["natural-earth"],
      status: "measured",
      units: { coordinate: "WGS84 degrees", distance: "km" },
      limitations: "1:110 million boundaries. Coastlines and small islands are generalised. Disputed areas follow Natural Earth de facto drawing, not a political determination.",
      earthRadiusKm: 6371.0088
    }
  };

  return { CONSTANTS: CONSTANTS };
});
