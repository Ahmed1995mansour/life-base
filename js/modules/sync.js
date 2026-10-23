"use strict";
/* ===================== KEEPING DATA OUTSIDE THE BROWSER =====================
   1) Online: an encrypted copy in a secret GitHub Gist on the user's account. Saved a few seconds after every change,
      checked when the app opens, so it survives clearing Chrome and works on any device.
      Encrypted on the phone (AES-GCM, key from the user's passphrase with PBKDF2); GitHub only sees ciphertext.
   2) A file the user picks (on the phone or in Google Drive) that the app rewrites after every change (File System Access).
   Settings live in localStorage "lb:sync"; the file handle lives in IndexedDB "lifebase-files". */

const GIST_FILE = "lifebase.enc.json", GIST_DESC = "LifeBase data (encrypted)";
const SYNC = Object.assign({token:"", gistId:"", key:"", salt:"", lastSynced:0, lastPush:0, error:"", fileName:"", fileAt:0, fileNeedsOk:false}, LS.get("lb:sync") || {});
const saveSyncCfg = () => LS.set("lb:sync", SYNC);
let cryptoKey = null, pushTimer = null, fileTimer = null, pushing = false, fileHandle = null;

/* ---------- crypto ---------- */
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function deriveKey(pass, saltB64){
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2", salt:unb64(saltB64), iterations:250000, hash:"SHA-256"}, base, {name:"AES-GCM", length:256}, true, ["encrypt","decrypt"]);
}
async function getKey(){
  if (cryptoKey) return cryptoKey;
  if (!SYNC.key) throw new Error("nokey");
  cryptoKey = await crypto.subtle.importKey("raw", unb64(SYNC.key), "AES-GCM", true, ["encrypt","decrypt"]);
  return cryptoKey;
}
async function encryptDoc(doc){
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({name:"AES-GCM", iv}, await getKey(), new TextEncoder().encode(JSON.stringify(doc)));
  return JSON.stringify({app:"lifebase", v:1, alg:"AES-GCM", kdf:"PBKDF2-SHA256", iter:250000, salt:SYNC.salt, iv:b64(iv), updatedAt:doc.updatedAt, data:b64(data)});
}
async function decryptDoc(text, key){
  const x = JSON.parse(text);
  const plain = await crypto.subtle.decrypt({name:"AES-GCM", iv:unb64(x.iv)}, key || await getKey(), unb64(x.data));
  return JSON.parse(new TextDecoder().decode(plain));
}

/* ---------- GitHub ---------- */
async function gh(path, opts){
  const r = await fetch("https://api.github.com" + path, Object.assign({}, opts, {headers:Object.assign({"Authorization":"Bearer " + SYNC.token, "Accept":"application/vnd.github+json"}, (opts || {}).headers || {})}));
  if (r.status === 401) throw new Error("token");
  if (!r.ok) throw new Error("http " + r.status);
  return r.status === 204 ? null : r.json();
}
async function gistText(g){
  const f = g.files && g.files[GIST_FILE]; if (!f) return null;
  if (!f.truncated) return f.content;
  const r = await fetch(f.raw_url); return r.ok ? r.text() : null;
}
async function findGist(){
  for (let page = 1; page <= 5; page++){
    const list = await gh(`/gists?per_page=100&page=${page}`);
    const hit = list.find(g => g.files && g.files[GIST_FILE]); if (hit) return hit.id;
    if (list.length < 100) break;
  }
  return "";
}
const cloudOn = () => !!(SYNC.token && SYNC.gistId && SYNC.key);

/* connect: check the token, find or make the gist; if there's data there, use whichever copy is newer */
async function connectCloud(token, pass){
  SYNC.token = token.trim(); SYNC.error = "";
  const user = await gh("/user");
  SYNC.gistId = await findGist();
  let remote = null, remoteText = null;
  if (SYNC.gistId){ remoteText = await gistText(await gh(`/gists/${SYNC.gistId}`)); }
  if (remoteText){
    const x = JSON.parse(remoteText);
    const key = await deriveKey(pass, x.salt);
    try { remote = await decryptDoc(remoteText, key); } catch(e){ SYNC.token = ""; throw new Error("pass"); }
    SYNC.salt = x.salt; SYNC.key = b64(await crypto.subtle.exportKey("raw", key)); cryptoKey = key;
  } else {
    SYNC.salt = b64(crypto.getRandomValues(new Uint8Array(16)));
    cryptoKey = await deriveKey(pass, SYNC.salt); SYNC.key = b64(await crypto.subtle.exportKey("raw", cryptoKey));
  }
  let took = "local";
  if (remote && (!hasData() || (+remote.updatedAt || 0) > meta.updatedAt)){ useDoc(remote); took = "remote"; }
  if (!SYNC.gistId){
    const g = await gh("/gists", {method:"POST", body:JSON.stringify({description:GIST_DESC, public:false, files:{[GIST_FILE]:{content:await encryptDoc(docOf())}}})});
    SYNC.gistId = g.id;
  } else if (took === "local") await pushNow(true);
  SYNC.lastSynced = meta.updatedAt; SYNC.lastPush = Date.now(); saveSyncCfg();
  return {user:user.login, took};
}
function disconnectCloud(){ Object.assign(SYNC, {token:"", gistId:"", key:"", salt:"", lastSynced:0, error:""}); cryptoKey = null; saveSyncCfg(); }

/* replace everything on this phone with a copy from outside */
function useDoc(doc){
  applyDoc(doc); writeMirror(); writeIdb();
  if (typeof applyModules === "function") applyModules();
}
async function pushNow(force){
  if (!cloudOn() || pushing) return;
  if (!force && meta.updatedAt <= SYNC.lastSynced) return;
  if (!navigator.onLine){ SYNC.error = "offline"; return; }
  pushing = true;
  try {
    const at = meta.updatedAt;
    await gh(`/gists/${SYNC.gistId}`, {method:"PATCH", body:JSON.stringify({files:{[GIST_FILE]:{content:await encryptDoc(docOf())}}})});
    SYNC.lastSynced = at; SYNC.lastPush = Date.now(); SYNC.error = "";
  } catch(e){ SYNC.error = e.message === "token" ? "token" : "net"; }
  finally { pushing = false; saveSyncCfg(); }
}
/* on start: bring newer data from the cloud */
async function pullCloud(){
  if (!cloudOn() || !navigator.onLine) return false;
  try {
    const text = await gistText(await gh(`/gists/${SYNC.gistId}`)); if (!text) return false;
    const remoteAt = +JSON.parse(text).updatedAt || 0;
    if (remoteAt <= SYNC.lastSynced || remoteAt <= meta.updatedAt){
      if (meta.updatedAt > SYNC.lastSynced) pushNow();          // this phone has newer changes: send them
      return false;
    }
    const localChanged = meta.updatedAt > SYNC.lastSynced;
    useDoc(await decryptDoc(text));
    SYNC.lastSynced = meta.updatedAt; SYNC.error = ""; saveSyncCfg();
    toast(localChanged ? "كان في تعديلات على جهازين، خدنا الأحدث" : "اتحدّث من النسخة الأونلاين");
    return true;
  } catch(e){ SYNC.error = e.message === "token" ? "token" : e.message === "nokey" ? "pass" : "net"; saveSyncCfg(); return false; }
}

/* ---------- file on the phone / Drive ---------- */
const fileSupported = () => "showSaveFilePicker" in window;
function handleDb(){ return idbOpen("lifebase-files", "h"); }
async function loadHandle(){
  if (fileHandle) return fileHandle;
  try { const db = await handleDb(); fileHandle = await idbGet(db, "h", "file"); db.close(); } catch(e){}
  return fileHandle || null;
}
async function storeHandle(h){ fileHandle = h; try { const db = await handleDb(); await idbPut(db, "h", "file", h); db.close(); } catch(e){} }
async function filePermission(ask){
  const h = await loadHandle(); if (!h) return "none";
  try {
    let p = h.queryPermission ? await h.queryPermission({mode:"readwrite"}) : "granted";
    if (p !== "granted" && ask && h.requestPermission) p = await h.requestPermission({mode:"readwrite"});
    return p;
  } catch(e){ return "denied"; }
}
async function writeFile(ask){
  const p = await filePermission(ask);
  if (p === "none") return;
  if (p !== "granted"){ if (!SYNC.fileNeedsOk){ SYNC.fileNeedsOk = true; saveSyncCfg(); if (screen === "today" || page === "settings") renderScreen(); } return; }
  try {
    const w = await fileHandle.createWritable();
    await w.write(JSON.stringify({app:"lifebase", version:3, savedAt:new Date().toISOString(), core:state, money, updatedAt:meta.updatedAt}, null, 1));
    await w.close();
    const wasAsking = SYNC.fileNeedsOk;
    SYNC.fileAt = Date.now(); SYNC.fileNeedsOk = false; saveSyncCfg();
    if (wasAsking) renderScreen();
  } catch(e){ SYNC.fileNeedsOk = true; saveSyncCfg(); }
}
async function pickFile(){
  try {
    const h = await window.showSaveFilePicker({suggestedName:"lifebase-data.json", types:[{description:"LifeBase", accept:{"application/json":[".json"]}}]});
    await storeHandle(h); SYNC.fileName = h.name || "lifebase-data.json"; saveSyncCfg();
    await writeFile(true); toast("تمام. أي تعديل هيتحفظ في الملف ده كمان");
  } catch(e){ if (e && e.name !== "AbortError") toast("مقدرناش نفتح الملف"); }
}
async function restoreFromFile(){
  try {
    let text;
    if (window.showOpenFilePicker){ const [h] = await window.showOpenFilePicker({types:[{description:"LifeBase", accept:{"application/json":[".json"]}}]}); text = await (await h.getFile()).text(); await storeHandle(h); SYNC.fileName = h.name; saveSyncCfg(); }
    else { $("importFile").click(); return false; }
    toast(importBackup(text)); return true;
  } catch(e){ if (e && e.name !== "AbortError") toast("الملف ده مش من LifeBase"); return false; }
}
async function forgetFile(){ fileHandle = null; try { const db = await handleDb(); await idbPut(db, "h", "file", null); db.close(); } catch(e){} SYNC.fileName = ""; SYNC.fileAt = 0; SYNC.fileNeedsOk = false; saveSyncCfg(); }

/* ---------- after every save ---------- */
function onSaved(){
  if (cloudOn()){ clearTimeout(pushTimer); pushTimer = setTimeout(pushNow, 4000); }
  if (SYNC.fileName){ clearTimeout(fileTimer); fileTimer = setTimeout(() => writeFile(false), 2500); }
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden"){ if (pushTimer){ clearTimeout(pushTimer); pushNow(); } if (fileTimer){ clearTimeout(fileTimer); writeFile(false); } }
  else if (cloudOn()) pullCloud().then(changed => { if (changed) renderScreen(); });
});
window.addEventListener("online", () => { if (cloudOn()) pushNow(); });

/* ---------- UI ---------- */
const agoText = t => { if (!t) return "لسه"; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? "دلوقتي" : m < 60 ? `من ${m} دقيقة` : m < 1440 ? `من ${Math.round(m / 60)} ساعة` : dateText(t); };
function syncCardHTML(){
  const cloud = cloudOn()
    ? `<div class="kvrow"><span class="okdot ${SYNC.error ? "warn" : ""}"></span><p>أونلاين على GitHub: ${SYNC.error === "token" ? "<b>الـ token انتهى أو اتلغى</b>" : SYNC.error === "pass" ? "<b>محتاج كلمة السر تاني</b>" : SYNC.error ? "مستني النت" : "شغّال"} · آخر حفظ ${agoText(SYNC.lastPush)}</p></div>
       <div class="actrow"><button type="button" class="btn sm" data-sync="now">احفظ دلوقتي</button><button type="button" class="btn sm ghost" data-sync="off">وقّف</button>${SYNC.error === "token" || SYNC.error === "pass" ? `<button type="button" class="btn sm primary" data-sync="setup">وصّل تاني</button>` : ""}</div>`
    : `<p class="small" style="margin:0 0 8px">نسخة متشفّرة على حساب GitHub بتاعك، بتتحفظ لوحدها بعد كل تعديل، وتفتحها من أي جهاز.</p><button type="button" class="btn primary" data-sync="setup">شغّل الحفظ الأونلاين</button>`;
  const file = !fileSupported() ? `<p class="small" style="margin:0">المتصفح ده مش بيسمح بالكتابة في ملف. حدّث Chrome، أو استخدم النسخة الاحتياطية.</p>`
    : SYNC.fileName
    ? `<div class="kvrow"><span class="okdot ${SYNC.fileNeedsOk ? "warn" : ""}"></span><p>ملف <b class="en">${esc(SYNC.fileName)}</b> · ${SYNC.fileNeedsOk ? "<b>محتاج تأكيد منك</b>" : "آخر حفظ " + agoText(SYNC.fileAt)}</p></div>
       <div class="actrow">${SYNC.fileNeedsOk ? `<button type="button" class="btn sm primary" data-file="ok">كمّل الحفظ في الملف</button>` : ""}<button type="button" class="btn sm" data-file="pick">غيّر الملف</button><button type="button" class="btn sm ghost" data-file="off">وقّف</button></div>`
    : `<p class="small" style="margin:0 0 8px">اختار ملف على الموبايل أو في Google Drive، والأبلكيشن يكتب فيه بعد كل تعديل.</p><button type="button" class="btn" data-file="pick">اختار ملف</button>`;
  return `<div class="card-h"><h2>الحفظ برّه المتصفح</h2></div>
    <h3 class="sect-title" style="margin:0 0 8px">أونلاين</h3>${cloud}
    <h3 class="sect-title" style="margin:16px 0 8px">ملف</h3>${file}
    <p class="small" style="margin:14px 0 0">لو اتمسحت بيانات Chrome أو الأبلكيشن، افتحه تاني وهتلاقي "عندك بيانات قبل كده؟" في أول شاشة.</p>`;
}
function openCloudSheet(){
  openSheet(`<h2 class="sheet-t">الحفظ الأونلاين</h2>
    <ol class="plain small" style="color:var(--ink)">
      <li>افتح <a href="https://github.com/settings/tokens/new?scopes=gist&description=LifeBase" target="_blank" rel="noopener">صفحة الـ token على GitHub</a>. الصلاحية <b class="en">gist</b> متعلّمة لوحدها.</li>
      <li>في <b>Expiration</b> اختار <b>No expiration</b> أو سنة، وانزل دوس <b>Generate token</b>.</li>
      <li>انسخ الـ token والزقه هنا.</li></ol>
    <form id="cloudForm" class="form" autocomplete="off">
      <label class="lbl">الـ token<input class="input en" id="cfToken" type="password" placeholder="ghp_…" required></label>
      <label class="lbl">كلمة سر للتشفير<input class="input" id="cfPass" type="password" minlength="6" required placeholder="6 حروف أو أكتر"></label>
      <p class="small" style="margin:-4px 0 0">احفظ كلمة السر دي في مكان أمين. من غيرها مفيش حد يقدر يفتح البيانات، ولا حتى إحنا. ولو بتوصّل جهاز تاني، اكتب نفس كلمة السر.</p>
      <button class="btn primary lg" id="cfGo">وصّل</button></form>`, "الحفظ الأونلاين");
}
/* restore choices on a fresh install (from setup) */
function openRestoreSheet(){
  openSheet(`<h2 class="sheet-t">رجّع بياناتك</h2>
    <button type="button" class="btn primary lg" data-sync="setup">من الحفظ الأونلاين (GitHub)</button>
    <button type="button" class="btn lg" data-restore="file">من ملف أو نسخة احتياطية</button>`, "رجّع بياناتك");
}
const finishRestore = () => { if (needsSetup){ needsSetup = false; state.profile.setup = true; save(); } if (su){ su = null; closeSetup(); } closeSheet(); renderScreen(); };

document.addEventListener("click", async e => {
  const s = e.target.closest("[data-sync]"), f = e.target.closest("[data-file]"), r = e.target.closest("[data-restore]");
  if (e.target.closest("[data-su-restore]")){ openRestoreSheet(); return; }
  if (s){
    const a = s.dataset.sync;
    if (a === "setup") openCloudSheet();
    else if (a === "now"){ await pushNow(true); toast(SYNC.error ? "مقدرناش نحفظ أونلاين دلوقتي" : "اتحفظ أونلاين"); renderScreen(); }
    else if (a === "off"){ disconnectCloud(); toast("الحفظ الأونلاين وقف. البيانات اللي على GitHub لسه موجودة"); renderScreen(); }
  }
  if (f){
    const a = f.dataset.file;
    if (a === "pick") await pickFile();
    else if (a === "ok") await writeFile(true);
    else if (a === "off"){ await forgetFile(); toast("الحفظ في الملف وقف. الملف نفسه لسه موجود"); }
    renderScreen();
  }
  if (r && await restoreFromFile()) finishRestore();
});
document.addEventListener("submit", async e => {
  if (e.target.id !== "cloudForm") return;
  e.preventDefault();
  const btn = $("cfGo"); btn.disabled = true; btn.textContent = "بنوصّل…";
  try {
    const res = await connectCloud($("cfToken").value, $("cfPass").value);
    toast(res.took === "remote" ? `رجّعنا بياناتك من حساب ${res.user}` : `اتوصّل بحساب ${res.user}. بياناتك اتحفظت أونلاين`);
    finishRestore();
  } catch(err){
    btn.disabled = false; btn.textContent = "وصّل";
    toast(err.message === "token" ? "الـ token مش شغّال. اتأكد إنك نسخته كله" : err.message === "pass" ? "كلمة السر مش هي اللي اتشفّرت بيها البيانات" : "مقدرناش نوصل لـ GitHub. اتأكد من النت");
  }
});
