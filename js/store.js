"use strict";
/* All data in one place.
   One document {core, money} is kept in IndexedDB ("lifebase") and mirrored to localStorage ("lb:data").
   On load the newer of the two wins, so if one of them gets cleared the other brings everything back.
   The first time, data from the old Fourma (fit:v2) and مصاريفي (masrouf) apps is copied in; the old copies are left untouched. */

const DB_NAME = "lifebase", MIRROR = "lb:data", DOC_KEY = "doc";
const state = {checks:{}, weights:{}, body:{w:{}, waist:{}}, quran:{page:null, hifz:{}}, todos:{}, rem:[]};
let money = {entries:[], goals:[], cats:[]};
const meta = {updatedAt:0, lastBackup:0, migrated:null, persisted:null};

/* ---------- IndexedDB ---------- */
function idbOpen(name, store){
  return new Promise((res, rej) => {
    if (!("indexedDB" in window)) return rej(new Error("no indexedDB"));
    const r = indexedDB.open(name, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(store)) r.result.createObjectStore(store); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.onblocked = () => rej(new Error("blocked"));
  });
}
function idbGet(db, store, key){
  return new Promise((res, rej) => { const q = db.transaction(store).objectStore(store).get(key); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
}
function idbPut(db, store, key, val){
  return new Promise((res, rej) => { const tx = db.transaction(store, "readwrite"); tx.objectStore(store).put(val, key); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
}
async function idbExists(name){
  try { if (indexedDB.databases){ const list = await indexedDB.databases(); return list.some(d => d.name === name); } } catch(e){}
  return true; // can't tell: try opening it
}

/* ---------- shape ---------- */
function normalizeCore(c){
  c = c && typeof c === "object" ? c : {};
  return {
    checks: c.checks || {},
    weights: c.weights || {},
    body: {w: (c.body && c.body.w) || {}, waist: (c.body && c.body.waist) || {}},
    quran: {page: (c.quran && c.quran.page) || null, hifz: (c.quran && c.quran.hifz) || {}},
    todos: c.todos || {},
    rem: Array.isArray(c.rem) ? c.rem : []
  };
}
function applyDoc(doc){
  Object.assign(state, normalizeCore(doc.core));
  money = moneyNormalize(doc.money);
  meta.updatedAt = +doc.updatedAt || 0;
  meta.lastBackup = +doc.lastBackup || 0;
  meta.migrated = doc.migrated || null;
}
function docOf(){
  return {v:3, updatedAt:meta.updatedAt, lastBackup:meta.lastBackup, migrated:meta.migrated, core:state, money};
}
const newer = (a, b) => (a && b) ? ((+a.updatedAt||0) >= (+b.updatedAt||0) ? a : b) : (a || b);

/* ---------- first run: bring in the old apps' data ---------- */
async function legacyDoc(){
  const fit = LS.get("fit:v2");
  let mA = null, mB = null;
  try {
    if (await idbExists("masrouf")){ const db = await idbOpen("masrouf", "kv"); mA = await idbGet(db, "kv", "data"); db.close(); }
  } catch(e){}
  mB = LS.get("masrouf-data");
  const m = newer(mA, mB);
  const fitBackup = Date.parse(LS.get("fit:lastBackup") || "") || 0;
  return {
    v:3, updatedAt:Date.now(),
    lastBackup: Math.max(fitBackup, (m && +m.lastBackup) || 0),
    migrated: (fit || m) ? {at:Date.now(), fit:!!fit, money:!!m} : null,
    core: fit || {}, money: m
  };
}

/* ---------- load and save ---------- */
let lbdb = null, idbChain = Promise.resolve(), idbTimer = null, saveWarned = false;
async function loadAll(){
  let a = null;
  try { lbdb = await idbOpen(DB_NAME, "kv"); a = await idbGet(lbdb, "kv", DOC_KEY); } catch(e){ lbdb = null; }
  const b = LS.get(MIRROR);
  let doc = newer(a, b);
  const fresh = !doc;
  if (fresh) doc = await legacyDoc();
  applyDoc(doc);
  if (fresh || doc !== a || doc !== b){ writeMirror(); await writeIdb(); }
  askPersist();
}
function writeMirror(){
  try { localStorage.setItem(MIRROR, JSON.stringify(docOf())); return true; }
  catch(e){ if (!saveWarned){ saveWarned = true; toast("مساحة الحفظ قربت تخلص. خد نسخة احتياطية من الإعدادات"); } return false; }
}
function writeIdb(){
  if (!lbdb) return Promise.resolve();
  const snap = JSON.parse(JSON.stringify(docOf()));
  idbChain = idbChain.then(() => idbPut(lbdb, "kv", DOC_KEY, snap)).catch(() => {
    if (!saveWarned){ saveWarned = true; toast("في مشكلة في الحفظ. خد نسخة احتياطية من الإعدادات"); }
  });
  return idbChain;
}
/* call after every change */
function save(){
  meta.updatedAt = Date.now();
  writeMirror();
  clearTimeout(idbTimer); idbTimer = setTimeout(writeIdb, 250);
}
function flushSave(){ if (idbTimer){ clearTimeout(idbTimer); idbTimer = null; writeIdb(); } }
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushSave(); });
window.addEventListener("pagehide", flushSave);

async function askPersist(){
  try {
    if (navigator.storage && navigator.storage.persist){
      meta.persisted = await navigator.storage.persisted();
      if (!meta.persisted) meta.persisted = await navigator.storage.persist();
    }
  } catch(e){}
}

/* ---------- backup ---------- */
function hasData(){
  return money.entries.length > 0 || state.rem.length > 0 || Object.keys(state.checks).length > 0 || Object.keys(state.body.w).length > 0;
}
const backupDue = () => hasData() && Date.now() - (meta.lastBackup || 0) > 14 * 864e5;

async function exportBackup(){
  const name = `lifebase-backup-${iso(new Date())}.json`;
  const blob = new Blob([JSON.stringify({app:"lifebase", version:3, savedAt:new Date().toISOString(), core:state, money}, null, 1)], {type:"application/json"});
  let done = false;
  try {
    const file = new File([blob], name, {type:"application/json"});
    if (navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({files:[file], title:"نسخة احتياطية - LifeBase"}); done = true; }
  } catch(e){ if (e && e.name === "AbortError") return false; }
  if (!done){
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  meta.lastBackup = Date.now(); save();
  return true;
}

/* Accepts LifeBase (v2, v3), Fourma and مصاريفي backups. Returns a message for the user. */
function importBackup(text){
  const x = JSON.parse(text);
  if (!x || typeof x !== "object") throw new Error("bad");
  const merge = (a, b) => { const m = new Map(a.map(o => [o.id, o])); (b||[]).forEach(o => o && o.id && m.set(o.id, o)); return [...m.values()]; };
  let core = null, mon = null, mergeMoney = false;
  if (x.app === "lifebase" && x.core){ core = x.core; mon = x.money; }
  else if (x.state && typeof x.state === "object"){ core = x.state; mon = x.money; }            // LifeBase v2
  else if ("checks" in x){ core = x; }                                                          // Fourma
  else if (Array.isArray(x.entries)){ mon = x; mergeMoney = true; }                              // مصاريفي
  else throw new Error("bad");
  if (core) Object.assign(state, normalizeCore(core));
  let added = 0;
  if (mon && Array.isArray(mon.entries)){
    const m = moneyNormalize(mon);
    if (mergeMoney){
      const before = money.entries.length;
      money.entries = merge(money.entries, m.entries).sort((a,b) => b.ts - a.ts);
      money.goals = merge(money.goals, m.goals);
      m.cats.forEach(c => { if (!money.cats.find(o => o.id === c.id)) money.cats.push(c); });
      added = money.entries.length - before;
    } else money = m;
  }
  rollover(); save();
  if (mergeMoney && !core) return `اترجّع ${added} عملية فلوس جديدة`;
  return "رجّعت البيانات من النسخة الاحتياطية";
}
