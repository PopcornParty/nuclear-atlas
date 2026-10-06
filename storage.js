/* Local history and learn progress. IndexedDB, no account. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.NA = root.NA || {}; root.NA.storage = api; }
})(typeof self !== "undefined" ? self : this, function () {
  const DB = "nuclear-atlas";
  function openDb() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error("IndexedDB unavailable")); return; }
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = function () {
        const db = req.result;
        if (!db.objectStoreNames.contains("runs")) db.createObjectStore("runs", { keyPath: "id" });
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "id" });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }
  function txDone(tx) {
    return new Promise(function (resolve, reject) {
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
    });
  }
  async function saveRun(record) {
    const db = await openDb();
    const tx = db.transaction("runs", "readwrite");
    tx.objectStore("runs").put(record);
    await txDone(tx);
    db.close();
  }
  async function listRuns() {
    const db = await openDb();
    const tx = db.transaction("runs", "readonly");
    const req = tx.objectStore("runs").getAll();
    const rows = await new Promise(function (resolve, reject) {
      req.onsuccess = function () { resolve(req.result || []); };
      req.onerror = function () { reject(req.error); };
    });
    db.close();
    rows.sort(function (a, b) { return (b.savedAt || 0) - (a.savedAt || 0); });
    return rows;
  }
  async function saveMeta(id, value) {
    const db = await openDb();
    const tx = db.transaction("meta", "readwrite");
    tx.objectStore("meta").put({ id: id, value: value });
    await txDone(tx);
    db.close();
  }
  async function loadMeta(id) {
    const db = await openDb();
    const tx = db.transaction("meta", "readonly");
    const req = tx.objectStore("meta").get(id);
    const row = await new Promise(function (resolve, reject) {
      req.onsuccess = function () { resolve(req.result || null); };
      req.onerror = function () { reject(req.error); };
    });
    db.close();
    return row ? row.value : null;
  }
  async function exportAll() {
    return { version: 1, exportedAt: new Date().toISOString(), runs: await listRuns(), topics: await loadMeta("topics") };
  }
  async function importAll(data) {
    if (!data || !Array.isArray(data.runs)) throw new Error("File is not a Nuclear Atlas export");
    const db = await openDb();
    const tx = db.transaction(["runs", "meta"], "readwrite");
    data.runs.forEach(function (row) { if (row && row.id) tx.objectStore("runs").put(row); });
    if (data.topics) tx.objectStore("meta").put({ id: "topics", value: data.topics });
    await txDone(tx);
    db.close();
  }
  return { saveRun: saveRun, listRuns: listRuns, saveMeta: saveMeta, loadMeta: loadMeta, exportAll: exportAll, importAll: importAll };
});
