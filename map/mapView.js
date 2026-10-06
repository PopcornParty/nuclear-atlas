/* Map: Leaflet world, Natural Earth borders, effect canvas. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.NA = root.NA || {}; root.NA.mapView = api; }
})(typeof self !== "undefined" ? self : this, function () {
  let map, countriesLayer, marker, effectLayer, labelLayer;
  const home = { lat: 20, lon: 10, zoom: 2 };

  function createEffectLayer() {
    return L.Layer.extend({
      initialize: function () { this._result = null; this._layersOn = {}; this._opacity = 0.72; this._step = -1; },
      onAdd: function (m) {
        this._map = m;
        this._canvas = L.DomUtil.create("canvas", "effect-canvas");
        this._canvas.style.pointerEvents = "none";
        m.getPane("effects").appendChild(this._canvas);
        m.on("move zoom resize viewreset zoomend moveend", this._draw, this);
        this._draw();
      },
      onRemove: function (m) {
        m.off("move zoom resize viewreset zoomend moveend", this._draw, this);
        if (this._canvas && this._canvas.parentNode) this._canvas.parentNode.removeChild(this._canvas);
      },
      setData: function (result, layersOn, opacity, step) {
        this._result = result;
        this._layersOn = layersOn || {};
        this._opacity = opacity;
        this._step = step;
        this._draw();
      },
      clear: function () { this.setData(null, {}, 0, -1); },
      _draw: function () {
        if (!this._map || !this._canvas) return;
        const m = this._map;
        const size = m.getSize();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this._canvas.width = size.x * dpr;
        this._canvas.height = size.y * dpr;
        this._canvas.style.width = size.x + "px";
        this._canvas.style.height = size.y + "px";
        const topLeft = m.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);
        const ctx = this._canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size.x, size.y);
        if (!this._result) return;
        const show = this._visibleLayers();
        ctx.globalAlpha = this._opacity;
        if (show.heat) this._heat(ctx);
        if (show.blast) this._contours(ctx, this._result.physical.blast.contours, NA.visualisationModel.LAYERS.blast.colors, "psi");
        if (show.radiation) this._contours(ctx, this._result.physical.radiation.contours, NA.visualisationModel.LAYERS.radiation.colors, "rad");
        if (show.fallout && this._result.physical.fallout.enabled) this._fallout(ctx);
      },
      _visibleLayers: function () {
        const on = this._layersOn;
        if (on.combined) return { heat: true, blast: true, radiation: true, fallout: true };
        return { heat: !!on.heat, blast: !!on.blast, radiation: !!on.radiation, fallout: !!on.fallout };
      },
      _pt: function (lat, lon) {
        const p = this._map.latLngToContainerPoint([lat, lon]);
        return p;
      },
      _heat: function (ctx) {
        const loc = this._result.location;
        const maxR = Math.max(this._result.physical.thermal.maxRadiusKm, 0.4);
        const center = this._map.latLngToContainerPoint([loc.lat, loc.lon]);
        const edge = this._map.latLngToContainerPoint(NA.destination(loc.lat, loc.lon, 90, maxR));
        const px = Math.max(48, Math.hypot(edge.x - center.x, edge.y - center.y));
        const g = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, px);
        g.addColorStop(0, "rgba(255,255,240,0.95)");
        g.addColorStop(0.15, "rgba(255,80,20,0.85)");
        g.addColorStop(0.45, "rgba(180,20,10,0.55)");
        g.addColorStop(0.8, "rgba(120,10,0,0.22)");
        g.addColorStop(1, "rgba(80,0,0,0)");
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(center.x, center.y, px, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(center.x, center.y, px, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,40,20,0.95)";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      },
      _circle: function (ctx, lat, lon, radiusKm) {
        const pts = NA.ring(lat, lon, radiusKm, 64);
        pts.forEach(function (p, i) {
          const pt = map.latLngToContainerPoint([p.lat, p.lon]);
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
      },
      _contours: function (ctx, contours, colors, kind) {
        const loc = this._result.location;
        contours.forEach(function (c) {
          ctx.beginPath();
          const pts = NA.ring(loc.lat, loc.lon, c.radiusKm, 72);
          pts.forEach(function (p, i) {
            const pt = map.latLngToContainerPoint([p.lat, p.lon]);
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.closePath();
          ctx.globalAlpha = (effectLayer._opacity || 0.7) * 0.22;
          ctx.fillStyle = colors[c.category] || "#8eb4c9";
          ctx.fill();
          ctx.globalAlpha = effectLayer._opacity || 0.7;
          ctx.strokeStyle = colors[c.category] || "#d7e2ea";
          ctx.lineWidth = kind === "rad" ? 1.25 : 1.6;
          ctx.setLineDash(kind === "rad" ? [4, 3] : []);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      },
      _fallout: function (ctx) {
        const f = this._result.physical.fallout;
        const loc = this._result.location;
        const colors = NA.visualisationModel.LAYERS.fallout.colors;
        f.bands.slice().reverse().forEach(function (b) {
          const pts = NA.falloutModel.ellipsePolygon(loc.lat, loc.lon, b.downwindKm, b.crosswindKm, f.windToDeg, 56);
          ctx.beginPath();
          pts.forEach(function (p, i) {
            const pt = map.latLngToContainerPoint([p.lat, p.lon]);
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.closePath();
          ctx.globalAlpha = (effectLayer._opacity || 0.7) * 0.35;
          ctx.fillStyle = colors[b.category] || "#8a7340";
          ctx.fill();
          ctx.globalAlpha = effectLayer._opacity || 0.7;
          ctx.strokeStyle = "#e6d7a8";
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }
    });
  }

  function mount(el) {
    map = L.map(el, { zoomControl: false, minZoom: 2, maxZoom: 12, worldCopyJump: true, attributionControl: false });
    map.setView([home.lat, home.lon], home.zoom);
    map.createPane("effects");
    map.getPane("effects").style.zIndex = "650";
    map.getPane("effects").style.pointerEvents = "none";
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "OpenStreetMap",
      maxZoom: 19
    }).addTo(map);
    const Effect = createEffectLayer();
    effectLayer = new Effect();
    effectLayer.addTo(map);
    return map;
  }

  function setCountries(fc) {
    if (countriesLayer) map.removeLayer(countriesLayer);
    countriesLayer = L.geoJSON(fc, {
      style: { color: "#c5d4e0", weight: 1, fillColor: "#1d2a36", fillOpacity: 0.28 },
      onEachFeature: function (feat, layer) {
        layer.bindTooltip(feat.properties.name, { sticky: true, className: "country-tip" });
      }
    }).addTo(map);
    if (effectLayer) effectLayer.bringToFront ? effectLayer.bringToFront() : null;
    countriesLayer.bringToBack();
  }

  function select(lat, lon, label) {
    if (marker) map.removeLayer(marker);
    marker = L.circleMarker([lat, lon], { radius: 7, color: "#f2f5f7", weight: 2, fillColor: "#d4782a", fillOpacity: 1 }).addTo(map);
    marker.bindTooltip(label || (lat.toFixed(2) + ", " + lon.toFixed(2)), { permanent: true, direction: "top", className: "pick-tip" }).openTooltip();
  }

  function clearSelection() {
    if (marker) { map.removeLayer(marker); marker = null; }
    if (effectLayer) effectLayer.clear();
  }

  function showResult(result, layersOn, opacity, step) {
    effectLayer.setData(result, layersOn, opacity, step);
    fitEffect(result, result.physical.thermal.maxRadiusKm);
  }

  function resetView() { map.setView([home.lat, home.lon], home.zoom); }
  function fitEffect(result, radiusKm) {
    const r = Math.max(radiusKm || result.physical.thermal.maxRadiusKm, 2);
    const lat = result.location.lat;
    const lon = result.location.lon;
    const n = NA.destination(lat, lon, 0, r * 1.35);
    const s = NA.destination(lat, lon, 180, r * 1.35);
    const e = NA.destination(lat, lon, 90, r * 1.35);
    const w = NA.destination(lat, lon, 270, r * 1.35);
    map.fitBounds([[s.lat, w.lon], [n.lat, e.lon]], { padding: [28, 28], maxZoom: 11, animate: false });
    setTimeout(function () { map.invalidateSize(); if (effectLayer) effectLayer._draw(); }, 60);
  }
  function invalidate() { if (map) map.invalidateSize(); }
  function getMap() { return map; }

  return { mount: mount, setCountries: setCountries, select: select, clearSelection: clearSelection, showResult: showResult, resetView: resetView, fitEffect: fitEffect, invalidate: invalidate, getMap: getMap };
});
