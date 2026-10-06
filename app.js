(function () {
  const features = (NA.countryData && NA.countryData.features) || [];
  let playing = false;
  let timer = null;
  let step = -1;
  let result = null;
  let compareResult = null;
  const tab = { id: "summary" };

  const els = {
    scenarios: document.getElementById("scenarios"),
    readout: document.getElementById("readout"),
    windRow: document.getElementById("wind-row"),
    windSpeed: document.getElementById("wind-speed"),
    windFrom: document.getElementById("wind-from"),
    timeline: document.getElementById("timeline"),
    legend: document.getElementById("legend"),
    layers: document.getElementById("layers"),
    sheet: document.getElementById("sheet"),
    sheetBody: document.getElementById("sheet-body"),
    tabs: document.getElementById("tabs"),
    compare: document.getElementById("compare")
  };

  function n(v, d) { return NA.formatNum(v, d); }
  function money(b) {
    if (!NA.finite(b)) return "unavailable";
    return "$" + n(b, 2) + " billion";
  }

  function selectedScenario() {
    return NA.scenarios.byId(NA.state.sim.scenarioId);
  }

  function renderScenarios() {
    els.scenarios.innerHTML = "";
    NA.scenarios.SCENARIOS.forEach(function (s) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = NA.state.sim.scenarioId === s.id ? "on" : "";
      b.innerHTML = s.name + "<small>" + s.type + " · " + s.yieldKt + " kt · " + s.burstType + "</small>";
      b.addEventListener("click", function () { chooseScenario(s.id); });
      els.scenarios.appendChild(b);
    });
    els.compare.innerHTML = "<option value=''>None</option>";
    NA.scenarios.SCENARIOS.forEach(function (s) {
      const o = document.createElement("option");
      o.value = s.id;
      o.textContent = s.name;
      els.compare.appendChild(o);
    });
  }

  function chooseScenario(id) {
    stopPlay();
    NA.state.setScenario(id);
    result = null;
    compareResult = null;
    NA.mapView.clearSelection();
    const s = NA.scenarios.byId(id);
    els.windRow.hidden = !s.supportsFallout;
    if (s.modelParameters.locationLocked) {
      const loc = { lat: s.modelParameters.lockedLat, lon: s.modelParameters.lockedLon, label: s.modelParameters.lockedLabel };
      NA.state.setLocation(loc);
      NA.mapView.select(loc.lat, loc.lon, loc.label);
      NA.mapView.getMap().setView([loc.lat, loc.lon], 11);
      els.readout.textContent = loc.label + " — location locked to the documented test site.";
    } else {
      els.readout.textContent = s.name + " selected. Tap the map to place this fictional case.";
    }
    renderScenarios();
    closeSheet();
    renderTimeline();
  }

  function renderLayers() {
    const spec = NA.visualisationModel.LAYERS;
    els.layers.innerHTML = "";
    Object.keys(spec).forEach(function (id) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = spec[id].label;
      b.className = NA.state.sim.layers[id] ? "on" : "";
      b.addEventListener("click", function () {
        if (id === "combined") {
          NA.state.sim.layers.combined = !NA.state.sim.layers.combined;
        } else {
          NA.state.sim.layers[id] = !NA.state.sim.layers[id];
          NA.state.sim.layers.combined = false;
        }
        renderLayers();
        paint();
      });
      els.layers.appendChild(b);
    });
    els.legend.innerHTML = "<h2>LEGEND</h2>" +
      "<p><i class='swatch' style='background:#d4782a'></i> Heat — continuous fluence field, brighter is higher cal/cm².</p>" +
      "<p><i class='swatch' style='background:#c4492c'></i> Blast 20 psi extreme · <i class='swatch' style='background:#d97845'></i> 5 psi major · <i class='swatch' style='background:#e0b15a'></i> 2 psi moderate · <i class='swatch' style='background:#8eb4c9'></i> 1 psi light.</p>" +
      "<p><i class='swatch' style='background:#9bbf55'></i> Prompt radiation — first minute, not fallout.</p>" +
      "<p><i class='swatch' style='background:#b5a06a'></i> Fallout — directional model, only if the scenario is surface-coupled.</p>";
  }

  function paint() {
    if (!result) return;
    NA.mapView.showResult(result, NA.state.sim.layers, NA.state.sim.opacity, step);
    const showHeat = NA.state.sim.layers.heat || NA.state.sim.layers.combined;
    if (showHeat) NA.mapView.fitEffect(result, result.physical.thermal.maxRadiusKm);
  }

  function renderTimeline() {
    els.timeline.innerHTML = "";
    if (!result) return;
    result.timeline.forEach(function (st, i) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = i === step ? "on" : "";
      b.textContent = st.tLabel + " " + st.title;
      b.addEventListener("click", function () { jump(i); });
      els.timeline.appendChild(b);
    });
    const pause = document.createElement("button");
    pause.type = "button";
    pause.textContent = playing ? "Pause" : "Play";
    pause.addEventListener("click", function () { playing ? stopPlay() : play(); });
    const skip = document.createElement("button");
    skip.type = "button";
    skip.textContent = "Skip";
    skip.addEventListener("click", function () { jump(result.timeline.length - 1); stopPlay(); });
    els.timeline.appendChild(pause);
    els.timeline.appendChild(skip);
  }

  function jump(i) {
    step = i;
    renderTimeline();
    paint();
    openSheet();
    renderSheet();
  }

  function play() {
    if (!result) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { jump(result.timeline.length - 1); return; }
    playing = true;
    if (step < 0) step = -1;
    tick();
  }
  function tick() {
    if (!playing) return;
    if (step >= result.timeline.length - 1) { playing = false; renderTimeline(); return; }
    step += 1;
    renderTimeline();
    paint();
    renderSheet();
    timer = setTimeout(tick, 1300);
  }
  function stopPlay() {
    playing = false;
    if (timer) clearTimeout(timer);
    renderTimeline();
  }

  function simulate() {
    const scenario = selectedScenario();
    const loc = NA.state.sim.location;
    if (!scenario || !loc) {
      els.readout.textContent = "Select a scenario and a map location first.";
      return;
    }
    stopPlay();
    try {
      result = NA.engine.run(scenario, loc, features, {
        windMph: Number(els.windSpeed.value),
        windFromDeg: Number(els.windFrom.value)
      });
    } catch (err) {
      els.readout.textContent = err.message;
      return;
    }
    NA.state.setResult(result);
    step = -1;
    saveHistory(result);
    openSheet();
    renderTimeline();
    play();
  }

  function saveHistory(run) {
    const record = {
      id: String(Date.now()),
      savedAt: Date.now(),
      scenarioId: run.scenario.id,
      scenarioName: run.scenario.name,
      yieldKt: run.scenario.yieldKt,
      label: run.location.label,
      lat: run.location.lat,
      lon: run.location.lon,
      blastKm: run.physical.blast.maxRadiusKm,
      fallout: run.physical.fallout.enabled ? run.physical.fallout.maxDownwindKm : 0,
      countries: run.population.countries.length
    };
    NA.storage.saveRun(record).catch(function () {});
  }

  function restart() {
    stopPlay();
    result = null;
    compareResult = null;
    step = -1;
    NA.state.restart();
    NA.mapView.clearSelection();
    NA.mapView.resetView();
    els.windRow.hidden = true;
    els.readout.textContent = "Simulation cleared. Choose a scenario, then tap the map.";
    els.timeline.innerHTML = "";
    closeSheet();
    renderScenarios();
    renderLayers();
  }

  function newScenario() {
    stopPlay();
    result = null;
    compareResult = null;
    step = -1;
    NA.state.resetSimulation();
    NA.mapView.clearSelection();
    els.windRow.hidden = true;
    els.readout.textContent = "Ready for a new scenario. Learn progress kept.";
    els.timeline.innerHTML = "";
    closeSheet();
    renderScenarios();
    renderLayers();
  }

  function openSheet() { els.sheet.classList.add("open"); }
  function closeSheet() { els.sheet.classList.remove("open"); }

  function renderSheet() {
    const tabs = [
      ["summary", "Summary"],
      ["countries", "Countries"],
      ["human", "Human"],
      ["economic", "Economic"],
      ["facts", "Facts"],
      ["report", "Report"]
    ];
    if (compareResult) tabs.push(["compare", "Compare"]);
    els.tabs.innerHTML = "";
    tabs.forEach(function (t) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = t[1];
      b.className = tab.id === t[0] ? "on" : "";
      b.addEventListener("click", function () { tab.id = t[0]; renderSheet(); });
      els.tabs.appendChild(b);
    });
    if (!result) { els.sheetBody.textContent = ""; return; }
    const p = result.physical;
    if (tab.id === "summary") els.sheetBody.innerHTML = summaryHtml(p);
    else if (tab.id === "countries") els.sheetBody.innerHTML = countriesHtml();
    else if (tab.id === "human") els.sheetBody.innerHTML = humanHtml();
    else if (tab.id === "economic") els.sheetBody.innerHTML = econHtml();
    else if (tab.id === "facts") els.sheetBody.innerHTML = factsHtml();
    else if (tab.id === "compare") els.sheetBody.innerHTML = compareHtml();
    else els.sheetBody.innerHTML = reportHtml();
    els.sheetBody.querySelectorAll("[data-sources]").forEach(function (b) {
      b.addEventListener("click", function () { showSources(b.getAttribute("data-sources").split(",")); });
    });
  }

  function summaryHtml(p) {
    const cards = p.blast.contours.map(function (c) {
      return "<article class='card'><b>" + c.psi + " psi · " + n(c.radiusKm, 1) + " km</b><div class='cat " + c.category + "'>" + c.category + "</div><p>" + c.meaning + (c.interpolated ? " Interpolated." : "") + "</p></article>";
    }).join("");
    return "<article class='card'><b>" + result.scenario.name + "</b><p>" + result.scenario.yieldKt + " kt · " + result.scenario.burstType + " · " + result.scenario.heightM + " m</p><p class='src'>" + result.location.label + "</p></article>" +
      cards +
      "<article class='card'><b>Heat</b><p>Severe-fluence radius " + n(p.thermal.severeRadiusKm, 1) + " km. The map fades from white-hot red at the centre to a red outline.</p><b>Prompt radiation</b><p>1 rad contour " + n(p.radiation.maxRadiusKm, 1) + " km. Not fallout.</p><b>Fallout</b><p>" + (p.fallout.enabled ? "On. Outer band " + n(p.fallout.maxDownwindKm, 0) + " km. Estimate." : "Off for this air burst.") + "</p></article>" +
      "<button type='button' data-sources='" + result.report.sourceIds.join(",") + "'>VIEW SOURCES</button>";
  }

  function countriesHtml() {
    const cards = result.population.countries.map(function (c) {
      return "<article class='card'><b>" + c.name + "</b><div class='cat " + c.category + "'>" + c.category + "</div><p>" + c.explanation + " " + c.why + "</p><p class='src'>" + n(c.intersectionKm2, 0) + " km² of polygon overlap</p></article>";
    }).join("");
    return cards || "<p>No country polygon intersects the modelled footprints.</p>";
  }

  function humanHtml() {
    const pop = result.population;
    return "<p>Affected population estimate: <strong>" + (NA.finite(pop.exposedPopulation) ? n(pop.exposedPopulation, 0) : "—") + "</strong></p>" +
      "<p class='src'>Uniform-density estimate from Natural Earth POP_EST (mostly 2017). Not a census of the circle. Confidence: low.</p>" +
      "<p>People inside major/extreme blast intersection (same method): " + n(pop.higherImpactExposure, 0) + "</p>" +
      "<p>Affected land area sampled against country polygons: " + n(pop.affectedLandKm2, 0) + " km².</p>" +
      "<p>" + pop.urbanNote + "</p><p>" + pop.agriculturalNote + "</p>" +
      "<p>Displacement: " + result.report.human.displacementNote + "</p>" +
      "<p>Casualties: " + result.report.human.historicalCasualties + "</p>" +
      "<p>Emergency implication: if fallout is plausible, public sources say get inside, stay inside, stay tuned. Damaged roads and hospitals would slow help. This is not a live instruction.</p>" +
      "<button type='button' data-sources='natural-earth,un-wpp,ready-gov,fema-planning'>VIEW SOURCES</button>";
  }

  function econHtml() {
    const e = result.economic;
    const sectors = e.sectors.map(function (s) {
      return "<tr><td>" + s.id + "</td><td class='cat " + s.category + "'>" + s.category + "</td><td>" + s.note + "</td></tr>";
    }).join("");
    return "<p>ECONOMIC IMPACT</p><p class='mono'>" + money(e.lowBillionUsd) + " – " + money(e.highBillionUsd) + "</p>" +
      "<p>CONFIDENCE<br>" + e.confidence + "</p>" +
      "<p>DATA COVERAGE<br>" + e.dataCoverage + "</p>" +
      "<p>WHY<br>" + e.why + "</p>" +
      "<p class='src'>" + e.currencyNote + "</p>" +
      "<table><tr><th>Sector</th><th>Category</th><th>Basis</th></tr>" + sectors + "</table>" +
      "<button type='button' data-sources='natural-earth,fema-planning'>VIEW SOURCES</button>";
  }

  function factsHtml() {
    return result.facts.map(function (f) {
      return "<p>" + f.text + "</p><button type='button' data-sources='" + f.sourceIds.join(",") + "'>VIEW SOURCES</button>";
    }).join("");
  }

  function reportHtml() {
    const r = result.report;
    return "<h3>SIMULATION SUMMARY</h3><p>LOCATION<br>" + r.location.label + "</p><p>SCENARIO<br>" + r.scenario.name + " (" + r.scenario.type + ")</p><p>MODEL TYPE<br>" + r.modelType + "</p>" +
      "<p>PHYSICAL EFFECTS<br>Blast 1 psi radius " + n(r.physical.blast[3].radiusKm, 1) + " km. Thermal light contour " + n(r.physical.heat[3].radiusKm, 1) + " km. Prompt light contour " + n(r.physical.radiation[3].radiusKm, 1) + " km. Fallout " + (r.physical.fallout.enabled ? "on, outer " + n(r.physical.fallout.maxDownwindKm, 0) + " km" : "not modelled") + ".</p>" +
      "<p>GEOGRAPHIC IMPACT<br>1 psi disc " + n(r.geographic.affectedAreaKm2, 0) + " km². Countries touched: " + r.geographic.countries.length + ".</p>" +
      "<p>HUMAN IMPACT<br>Exposure estimate " + n(r.human.exposure, 0) + ". " + r.human.historicalCasualties + "</p>" +
      "<p>ECONOMIC IMPACT<br>" + money(r.economic.lowBillionUsd) + " – " + money(r.economic.highBillionUsd) + ". " + r.economic.confidence + " confidence.</p>" +
      "<p>CONFIDENCE & LIMITATIONS<br>" + r.confidence + "</p><ul>" + r.limitations.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>" +
      "<button type='button' data-sources='" + r.sourceIds.join(",") + "'>VIEW SOURCES</button>";
  }

  function compareHtml() {
    if (!compareResult) return "<p>No comparison yet.</p>";
    const c = NA.engine.compare(result, compareResult);
    function row(label, a, b) {
      return "<tr><td>" + label + "</td><td class='mono'>" + a + "</td><td class='mono'>" + b + "</td></tr>";
    }
    return "<table><tr><th></th><th>" + c.a.name + "</th><th>" + c.b.name + "</th></tr>" +
      row("Yield kt", n(c.a.yieldKt, 0), n(c.b.yieldKt, 0)) +
      row("Blast area km²", n(c.a.blastArea, 0), n(c.b.blastArea, 0)) +
      row("Thermal area km²", n(c.a.thermalArea, 0), n(c.b.thermalArea, 0)) +
      row("Prompt area km²", n(c.a.radiationArea, 0), n(c.b.radiationArea, 0)) +
      row("Fallout downwind km", n(c.a.fallout, 0), n(c.b.fallout, 0)) +
      row("Countries touched", n(c.a.countries, 0), n(c.b.countries, 0)) +
      row("Exposure estimate", n(c.a.exposure, 0), n(c.b.exposure, 0)) +
      row("Economic low $bn", n(c.a.economicLow, 2), n(c.b.economicLow, 2)) +
      "</table><p class='src'>Both columns come from the same engine. Fallout is zero when that scenario is not surface-coupled.</p>";
  }

  function showSources(ids) {
    const dlg = document.getElementById("source-dialog");
    const unique = Array.from(new Set(ids)).filter(Boolean);
    dlg.innerHTML = "<h3>Sources</h3>" + unique.map(function (id) {
      const s = NA.sources.byId(id);
      if (!s) return "<p>" + id + "</p>";
      return "<p><strong>" + s.title + "</strong><br>" + s.organisation + " (" + s.year + ")<br><a href='" + s.url + "' target='_blank' rel='noopener'>" + s.url + "</a><br><span class='src'>" + s.claimsSupported.join("; ") + "</span></p>";
    }).join("") + "<button type='button' id='close-src'>Close</button>";
    dlg.showModal();
    dlg.querySelector("#close-src").addEventListener("click", function () { dlg.close(); });
  }

  function openLearn() {
    const dlg = document.getElementById("learn-dialog");
    const seen = NA.state.progress.topics;
    dlg.innerHTML = "<h3>Learn</h3>" + NA.learn.TOPICS.map(function (t) {
      return "<div class='topic'><button type='button' data-topic='" + t.id + "'>" + t.q + (seen[t.id] ? " · read" : "") + "</button><div id='topic-" + t.id + "' hidden><p>" + t.body + "</p><p class='src'>" + t.sourceIds.map(function (id) { return NA.sources.formatCitation(id); }).join(" ") + "</p></div></div>";
    }).join("") + "<button type='button' id='close-learn'>Close</button>";
    dlg.showModal();
    dlg.querySelectorAll("[data-topic]").forEach(function (b) {
      b.addEventListener("click", function () {
        const id = b.getAttribute("data-topic");
        const panel = document.getElementById("topic-" + id);
        panel.hidden = !panel.hidden;
        NA.state.progress.topics[id] = true;
        try { localStorage.setItem("na-progress", JSON.stringify(NA.state.progress.topics)); } catch (e) {}
        NA.storage.saveMeta("topics", NA.state.progress.topics).catch(function () {});
      });
    });
    dlg.querySelector("#close-learn").addEventListener("click", function () { dlg.close(); });
  }

  function openAllSources() {
    showSources(NA.sources.SOURCES.map(function (s) { return s.id; }));
  }

  NA.mapView.mount(document.getElementById("map"));
  NA.mapView.setCountries(NA.countryData);
  NA.mapView.getMap().on("click", function (ev) {
    const s = selectedScenario();
    if (!s) { els.readout.textContent = "Choose a scenario before placing a point."; return; }
    if (s.modelParameters.locationLocked) {
      els.readout.textContent = "Trinity stays on the documented test site.";
      return;
    }
    const hit = NA.geographyModel.countryAt(features, ev.latlng.lat, ev.latlng.lng);
    const label = (hit ? hit.properties.name : "Open ocean") + " · " + ev.latlng.lat.toFixed(2) + ", " + ev.latlng.lng.toFixed(2);
    NA.state.setLocation({ lat: ev.latlng.lat, lon: ev.latlng.lng, label: label });
    NA.mapView.select(ev.latlng.lat, ev.latlng.lng, label);
    els.readout.textContent = label;
    result = null;
    closeSheet();
  });

  document.getElementById("btn-sim").addEventListener("click", simulate);
  document.getElementById("btn-restart").addEventListener("click", restart);
  document.getElementById("btn-new").addEventListener("click", newScenario);
  document.getElementById("btn-reset-view").addEventListener("click", function () { NA.mapView.resetView(); NA.mapView.invalidate(); });
  document.getElementById("main-tabs").addEventListener("click", function (ev) {
    const btn = ev.target.closest("button");
    if (!btn) return;
    document.querySelectorAll("#main-tabs button").forEach(function (b) { b.classList.toggle("on", b === btn); });
    document.querySelectorAll(".panel").forEach(function (p) { p.classList.toggle("on", p.id === "panel-" + btn.getAttribute("data-panel")); });
    if (btn.getAttribute("data-panel") === "more" && selectedScenario() && selectedScenario().supportsFallout) {
      document.getElementById("wind-row").hidden = false;
    }
  });
  document.getElementById("btn-learn").addEventListener("click", openLearn);
  document.getElementById("btn-sources").addEventListener("click", openAllSources);
  document.getElementById("sheet-close").addEventListener("click", closeSheet);
  document.getElementById("opacity").addEventListener("input", function (ev) {
    NA.state.sim.opacity = Number(ev.target.value);
    paint();
  });
  document.getElementById("btn-compare").addEventListener("click", function () {
    const id = els.compare.value;
    if (!id || !result) { els.readout.textContent = "Run a simulation, then pick a second scenario."; return; }
    const other = NA.scenarios.byId(id);
    const loc = other.modelParameters.locationLocked ? { lat: other.modelParameters.lockedLat, lon: other.modelParameters.lockedLon, label: other.modelParameters.lockedLabel } : result.location;
    compareResult = NA.engine.run(other, loc, features, { windMph: Number(els.windSpeed.value), windFromDeg: Number(els.windFrom.value) });
    tab.id = "compare";
    openSheet();
    renderSheet();
  });
  document.getElementById("btn-history").addEventListener("click", function () {
    NA.storage.listRuns().then(function (rows) {
      openSheet();
      els.tabs.innerHTML = "";
      els.sheetBody.innerHTML = rows.length ? "<h3>Saved on this phone</h3>" + rows.map(function (r) {
        return "<p><strong>" + r.scenarioName + "</strong><br>" + r.label + "<br><span class='src'>" + new Date(r.savedAt).toLocaleString() + " · 1 psi about " + n(r.blastKm, 1) + " km · countries " + r.countries + "</span></p>";
      }).join("") : "<p>No saved runs yet. A completed simulation is stored on this device.</p>";
    }).catch(function () {
      els.readout.textContent = "History storage is not available in this browser.";
    });
  });
  document.getElementById("btn-export").addEventListener("click", function () {
    NA.storage.exportAll().then(function (data) {
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "nuclear-atlas-history.json";
      a.click();
      URL.revokeObjectURL(a.href);
    }).catch(function () { els.readout.textContent = "Export failed. Storage may be blocked."; });
  });
  document.getElementById("btn-import").addEventListener("click", function () { document.getElementById("import-file").click(); });
  document.getElementById("import-file").addEventListener("change", function (ev) {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    file.text().then(function (text) { return NA.storage.importAll(JSON.parse(text)); }).then(function () {
      els.readout.textContent = "Import saved on this device.";
    }).catch(function () { els.readout.textContent = "That file could not be imported."; });
  });

  try {
    const saved = JSON.parse(localStorage.getItem("na-progress") || "{}");
    NA.state.progress.topics = saved;
  } catch (e) {}
  NA.storage.loadMeta("topics").then(function (topics) {
    if (topics) NA.state.progress.topics = topics;
  }).catch(function () {});

  renderScenarios();
  renderLayers();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
  setTimeout(function () { NA.mapView.invalidate(); }, 200);
  window.addEventListener("resize", function () { NA.mapView.invalidate(); });
  window.addEventListener("orientationchange", function () { setTimeout(function () { NA.mapView.invalidate(); }, 250); });
})();
