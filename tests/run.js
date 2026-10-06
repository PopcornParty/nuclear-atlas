/* Model and state tests. Run: node tests/run.js */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const files = [
  "data/sources.js",
  "data/constants.js",
  "data/scenarios.js",
  "models/geoMath.js",
  "models/blastModel.js",
  "models/thermalModel.js",
  "models/radiationModel.js",
  "models/falloutModel.js",
  "models/geographyModel.js",
  "models/populationImpactModel.js",
  "models/economicModel.js",
  "models/visualisationModel.js",
  "simulation/state.js",
  "simulation/engine.js"
];

const context = { console: console, NA: {} };
context.self = context;
context.global = context;
vm.createContext(context);
files.forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), context, { filename: f });
});
const NA = context.NA;
let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed++;
    console.error("FAIL", msg);
  } else console.log("ok", msg);
}

assert(NA.scenarios.SCENARIOS.length === 7, "seven scenarios");
NA.scenarios.SCENARIOS.forEach(function (s) {
  assert(s.yieldKt > 0 && s.name && s.burstType, "scenario fields " + s.id);
  assert(!s.design && !s.delivery, "no weapon design fields");
});

const alpha = NA.scenarios.byId("fic-small");
const radii = NA.blastModel.radii(alpha);
assert(radii[0].radiusKm < radii[1].radiusKm && radii[1].radiusKm < radii[3].radiusKm, "blast radii ordered");
const mt = NA.blastModel.radii(NA.scenarios.byId("fic-large"));
assert(Math.abs(mt[1].radiusKm - 7) < 0.05, "1 Mt airburst 5 psi near 7 km");
assert(Math.abs(mt[0].radiusKm - 2.8) < 0.05, "1 Mt 20 psi near 2.8 km");
const surface = NA.blastModel.radii(NA.scenarios.byId("fic-medium"));
assert(surface[1].radiusKm < NA.blastModel.radii({ yieldKt: 100, burstType: "air", heightM: 1000 })[1].radiusKm, "surface smaller than air");

assert(Math.abs(NA.haversineKm(0, 0, 0, 1) - 111.19) < 1, "haversine ~111 km per degree");
const dest = NA.destination(0, 0, 90, 111);
assert(Math.abs(dest.lon - 1) < 0.05, "destination east");

assert(NA.thermalModel.severeRadiusKm(1000) > NA.thermalModel.severeRadiusKm(15), "thermal grows with yield");
const flu = NA.thermalModel.fluenceAt(15, NA.thermalModel.severeRadiusKm(15));
assert(Math.abs(flu.fluence - 10) < 0.2, "fluence anchor 10 cal/cm2");

const dose = NA.radiationModel.doseAt(20, 1.24);
assert(Math.abs(dose.doseRad - 1000) < 5, "20 kt 1000 rad anchor");
assert(NA.radiationModel.run(alpha).kind === "prompt", "prompt not fallout");

assert(NA.falloutModel.run(alpha).enabled === false, "air burst fallout off");
assert(NA.falloutModel.run(NA.scenarios.byId("fic-medium"), { windMph: 30, windFromDeg: 180 }).enabled === true, "surface fallout on");
assert(NA.falloutModel.run(NA.scenarios.byId("fic-medium"), { windMph: 30 }).maxDownwindKm > NA.falloutModel.run(NA.scenarios.byId("fic-medium"), { windMph: 15 }).maxDownwindKm, "wind stretches plume");

let threw = false;
try { NA.blastModel.radii({ yieldKt: NaN, burstType: "air", heightM: 1 }); } catch (e) { threw = true; }
assert(threw, "rejects NaN yield");
threw = false;
try { NA.engine.validate(alpha, { lat: 100, lon: 0 }); } catch (e) { threw = true; }
assert(threw, "rejects bad latitude");

const square = {
  type: "Feature",
  properties: { name: "Testland", iso: "TST", pop: 1000000, popYear: 2017, gdpMd: 10000, gdpYear: 2016 },
  geometry: { type: "Polygon", coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]] }
};
assert(NA.geographyModel.pointInFeature(square, 1, 1), "point in polygon");
assert(!NA.geographyModel.pointInFeature(square, 3, 3), "point outside");
assert(NA.geographyModel.intersectsCircle(square, 1, 1, 10), "circle intersects country");
assert(!NA.geographyModel.intersectsCircle(square, 10, 10, 10), "distant circle misses");

const run = NA.engine.run(alpha, { lat: 1, lon: 1, label: "Testland" }, [square], {});
assert(run.population.countries.length === 1, "country impact");
assert(run.population.countries[0].category !== "WIPED OUT", "no wiped-out category");
assert(NA.finite(run.economic.lowBillionUsd), "economic range finite");
assert(run.economic.lowBillionUsd <= run.economic.highBillionUsd, "economic low <= high");
assert(run.facts.every(function (f) { return f.sourceIds.length > 0; }), "facts sourced");
assert(!JSON.stringify(run).includes("NaN"), "no NaN in result json");
assert(!JSON.stringify(run).includes("Infinity"), "no Infinity in result json");

NA.state.setScenario("fic-small");
NA.state.setLocation({ lat: 1, lon: 1, label: "x" });
NA.state.setResult(run);
NA.state.progress.topics.blast = true;
const kept = NA.state.resetSimulation();
assert(kept.scenarioId === null && kept.result === null && kept.location === null, "new scenario clears sim");
assert(NA.state.progress.topics.blast === true, "new scenario keeps learn progress");
NA.state.setScenario("fic-large");
NA.state.setResult(run);
NA.state.restart();
assert(NA.state.sim.scenarioId === null && NA.state.sim.result === null && NA.state.sim.location === null, "restart clears simulation");
assert(NA.state.sim.layers.heat === true && NA.state.sim.layers.combined === false, "restart restores default layers");

const ocean = NA.engine.run(alpha, { lat: -20, lon: -140, label: "ocean" }, [square], {});
assert(ocean.population.countries.length === 0, "missing land is empty not invented");
assert(ocean.economic.lowBillionUsd === null, "missing gdp coverage stays null");

const switched = NA.engine.run(NA.scenarios.byId("fic-large"), { lat: 1, lon: 1, label: "Testland" }, [square], {});
assert(switched.scenario.yieldKt !== run.scenario.yieldKt, "scenario switch changes yield");
assert(switched.physical.blast.maxRadiusKm > run.physical.blast.maxRadiusKm, "scenario switch does not keep old radius");

console.log(failed ? failed + " failed" : "all tests passed");
process.exit(failed ? 1 : 0);
