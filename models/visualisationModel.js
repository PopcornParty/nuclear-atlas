/* Visual specification for layers. Colours are display choices; radii come from models. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.NA = root.NA || {}; root.NA.visualisationModel = api; }
})(typeof self !== "undefined" ? self : this, function () {
  const LAYERS = {
    heat: {
      id: "heat",
      label: "Heat",
      legend: "Continuous thermal-fluence field. Brighter amber is higher modelled cal/cm². Not a fire perimeter.",
      ramp: ["#3a220c", "#8a4b12", "#d4782a", "#f0c14a", "#fff4d6"]
    },
    blast: {
      id: "blast",
      label: "Blast",
      legend: "Overpressure contours. 20 psi extreme, 5 psi major, 2 psi moderate (interpolated), 1 psi light.",
      colors: { EXTREME: "#c4492c", MAJOR: "#d97845", MODERATE: "#e0b15a", LIGHT: "#8eb4c9" }
    },
    radiation: {
      id: "radiation",
      label: "Prompt radiation",
      legend: "Prompt ionizing dose in the first minute. This is not fallout.",
      colors: { EXTREME: "#d6e26a", MAJOR: "#9bbf55", MODERATE: "#5e8f62", LIGHT: "#2f5c55" }
    },
    fallout: {
      id: "fallout",
      label: "Fallout",
      legend: "Directional deposition bands under the stated wind. Model/estimate only.",
      colors: { EXTREME: "#6d5a2a", MAJOR: "#8a7340", MODERATE: "#b5a06a" }
    },
    combined: {
      id: "combined",
      label: "Combined",
      legend: "All active effect layers together. Overlaps are not a single hazard score."
    }
  };

  function fieldSamples(maxRadiusKm, steps) {
    const n = steps || 24;
    const out = [];
    for (let i = 1; i <= n; i++) out.push(maxRadiusKm * (i / n));
    return out;
  }

  return { LAYERS: LAYERS, fieldSamples: fieldSamples };
});
