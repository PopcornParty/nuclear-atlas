/* Source registry. Every displayed scientific claim should cite one or more ids. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.NA = root.NA || {}; root.NA.sources = api; }
})(typeof self !== "undefined" ? self : this, function () {
  const SOURCES = [
    {
      id: "glasstone-1977",
      title: "The Effects of Nuclear Weapons, 3rd edition",
      organisation: "U.S. Department of Defense and Energy Research and Development Administration (Glasstone & Dolan)",
      year: 1977,
      url: "https://www.atomicarchive.com/resources/documents/effects/glasstone-dolan/",
      claimsSupported: [
        "Cube-root blast scaling",
        "Air-blast overpressure and structural-damage discussion",
        "Thermal radiation and pulse timing",
        "Initial nuclear radiation",
        "Local fallout depends on surface contact and wind"
      ]
    },
    {
      id: "lovelace-1962",
      title: "CEX-62.2 nuclear blast overpressure curves (Lovelace Foundation fit reproduced against Glasstone Fig. 3.73)",
      organisation: "Lovelace Foundation / published blast-curve literature",
      year: 1962,
      url: "https://www.osti.gov/biblio/4791822",
      claimsSupported: [
        "1 Mt airburst reference radii used here: about 2.8 km at 20 psi, 7.0 km at 5 psi, 21.7 km at 1 psi"
      ]
    },
    {
      id: "sublette-faq",
      title: "Nuclear Weapons Frequently Asked Questions — effects sections",
      organisation: "Carey Sublette (public educational compilation of published effects data)",
      year: 1997,
      url: "https://nuclearweaponarchive.org/Nwfaq/Nfaq5.html",
      claimsSupported: [
        "Clear-day thermal-radius power-law fit",
        "Prompt-dose range scaling much weaker than blast"
      ]
    },
    {
      id: "sandia-2022",
      title: "Distances to Prompt Effects for a Nuclear Device",
      organisation: "Sandia National Laboratories (OSTI 1845378)",
      year: 2022,
      url: "https://www.osti.gov/biblio/1845378",
      claimsSupported: [
        "Prompt blast, thermal and ionizing-radiation distances are estimates",
        "Generic assumptions do not replace a site-specific analysis",
        "Fallout is too weather-dependent for a single generic map"
      ]
    },
    {
      id: "miller-1964",
      title: "Distribution of Local Fallout (biological and radiological effects series, ch. 3)",
      organisation: "URS Systems / U.S. technical report AD0688940 (Carl F. Miller)",
      year: 1964,
      url: "https://apps.dtic.mil/sti/html/tr/AD0688940",
      claimsSupported: [
        "Local fallout patterns depend on wind and particle fall",
        "Constant-wind simplifications are modelling assumptions"
      ]
    },
    {
      id: "mit-fallout",
      title: "Radioactive Fallout Calculator",
      organisation: "MIT Nuclear Weapons Education Project",
      year: 2020,
      url: "https://nuclearweaponsedproj.mit.edu/fallout-calculator/",
      claimsSupported: [
        "Educational fallout illustrations assume a stated wind, often 15 or 30 mph, for a surface burst"
      ]
    },
    {
      id: "natural-earth",
      title: "Natural Earth 1:110m cultural vectors — admin 0 countries",
      organisation: "Natural Earth",
      year: 2018,
      url: "https://www.naturalearthdata.com/",
      claimsSupported: [
        "Country boundaries used for intersection",
        "POP_EST (population year mostly 2017) and GDP_MD_EST (GDP year mostly 2016, millions of USD)"
      ]
    },
    {
      id: "doe-trinity",
      title: "Manhattan Project: Trinity test, 16 July 1945",
      organisation: "U.S. Department of Energy",
      year: 1945,
      url: "https://www.energy.gov/management/articles/manhattan-project-trinity-test-1945",
      claimsSupported: [
        "Trinity was a test at the Alamogordo bombing range, New Mexico",
        "Published yield is about 21 kilotons; contemporary estimates varied",
        "The device was on a 100-foot tower"
      ]
    },
    {
      id: "lanl-trinity",
      title: "Trinity site public coordinates and test description",
      organisation: "Los Alamos National Laboratory / White Sands Missile Range public history",
      year: 2020,
      url: "https://www.lanl.gov/about/history-innovation/trinity.php",
      claimsSupported: [
        "Documented test location in the New Mexico desert",
        "Historical test, not a city detonation"
      ]
    },
    {
      id: "ready-gov",
      title: "Nuclear explosion — public preparedness guidance",
      organisation: "Ready.gov / U.S. Federal Emergency Management Agency",
      year: 2024,
      url: "https://www.ready.gov/nuclear-explosion",
      claimsSupported: [
        "Public protective actions: get inside, stay inside, stay tuned",
        "Fallout hazard is time-dependent; sheltering reduces exposure"
      ]
    },
    {
      id: "fema-planning",
      title: "Planning Guidance for Response to a Nuclear Detonation",
      organisation: "U.S. Federal Emergency Management Agency / Office of Emerging Threats",
      year: 2022,
      url: "https://www.fema.gov/sites/default/files/documents/fema_nuc-detonation-planning-guide.pdf",
      claimsSupported: [
        "Infrastructure and emergency-response zones are planning constructs",
        "Damage is not uniform inside a drawn boundary"
      ]
    },
    {
      id: "iaea-radiation",
      title: "Radiation in everyday life and emergency public information",
      organisation: "International Atomic Energy Agency",
      year: 2023,
      url: "https://www.iaea.org/topics/radiation-in-everyday-life",
      claimsSupported: [
        "Difference between irradiation and contamination",
        "Dose units and why a single number does not describe harm"
      ]
    },
    {
      id: "un-wpp",
      title: "World Population Prospects (underlying many country population compilations)",
      organisation: "United Nations Population Division",
      year: 2017,
      url: "https://population.un.org/wpp/",
      claimsSupported: [
        "Country population totals are estimates and are not a map of where people live"
      ]
    },
    {
      id: "doe-hiroshima",
      title: "The atomic bombings of Hiroshima and Nagasaki",
      organisation: "U.S. Department of Energy, Manhattan Project history",
      year: 1945,
      url: "https://www.energy.gov/management/articles/manhattan-project-atomic-bombing-hiroshima-1945",
      claimsSupported: ["Little Boy was used at Hiroshima on 6 August 1945", "Fat Man was used at Nagasaki on 9 August 1945", "Published yields are about 15 kt and 21 kt"]
    },
    {
      id: "doe-bravo",
      title: "Castle Bravo nuclear test",
      organisation: "U.S. Department of Energy",
      year: 1954,
      url: "https://www.energy.gov/management/articles/castle-bravo",
      claimsSupported: ["Castle Bravo was a 1 March 1954 test at Bikini Atoll", "Published yield was about 15 megatons"]
    }
  ];

  function byId(id) {
    return SOURCES.find(function (s) { return s.id === id; }) || null;
  }

  function formatCitation(id) {
    const s = byId(id);
    if (!s) return id;
    return s.organisation + " (" + s.year + "). " + s.title + ".";
  }

  return { SOURCES: SOURCES, byId: byId, formatCitation: formatCitation };
});
