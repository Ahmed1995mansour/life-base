"use strict";
/* ===================== SETTINGS: your data and backups, install, theme, guide ===================== */

let installEvt = null;
const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const dateText = t => new Date(t).toLocaleDateString("ar-EG-u-nu-latn", {day:"numeric", month:"long", year:"numeric"});

function dataCardHTML(){
  const lb = meta.lastBackup ? dateText(meta.lastBackup) : "لسه";
  const days = Object.keys(state.checks).length;
  return `<div class="card-h"><h2>بياناتك</h2></div>
    <div class="kvrow"><span class="okdot ${meta.persisted ? "" : "warn"}"></span><p>${meta.persisted ? "محفوظة على الموبايل ده بشكل دائم" : "محفوظة على الموبايل ده. ثبّت الأبلكيشن وخد نسخ احتياطية"}</p></div>
    <div class="kvrow"><span class="okdot ${backupDue() ? "warn" : ""}"></span><p>آخر نسخة احتياطية: <b>${lb}</b></p></div>
    <p class="small num" style="margin:4px 0 12px">${days} يوم متعلّم · ${money.entries.length} عملية فلوس · ${state.rem.length} تذكير</p>
    <div class="actrow"><button class="btn primary" type="button" data-backup="export">خد نسخة احتياطية</button>
      <label class="btn" for="importFile">رجّع من نسخة</label></div>
    <p class="small" style="margin:10px 0 0">النسخة ملف واحد فيه كل حاجة: اليوم والصحة والفلوس والتذكيرات. احفظه في Drive أو ابعته لنفسك. وتقدر ترجّع منه نسخ Fourma ومصاريفي القديمة كمان.</p>`;
}
function installHTML(){
  if (isStandalone()) return "";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const how = installEvt ? `<button class="btn primary" type="button" data-install>ثبّت الأبلكيشن</button>`
    : ios ? `<p class="small" style="margin:0">من Safari: دوس زرار المشاركة واختار "Add to Home Screen".</p>`
    : `<p class="small" style="margin:0">من قايمة Chrome ⋮ اختار "Install app" أو "Add to Home screen"، وبعدها Install. متختارش "Create shortcut".</p>`;
  return `<div class="card"><div class="card-h"><h2>ثبّت الأبلكيشن</h2></div><p class="small" style="margin:0 0 10px">يفتح من أيقونة على الشاشة زي أي أبلكيشن، والبيانات بتتحفظ بشكل أضمن.</p>${how}</div>`;
}
function renderRef(){
  $("dataCard").innerHTML = dataCardHTML();
  $("installCard").innerHTML = installHTML();
}

document.addEventListener("click", async e => {
  if (e.target.closest('[data-backup="export"]')){
    if (await exportBackup()){ toast("النسخة الاحتياطية جاهزة"); renderScreen(); }
    return;
  }
  if (e.target.closest("[data-install]") && installEvt){
    installEvt.prompt();
    const r = await installEvt.userChoice; installEvt = null;
    if (r.outcome === "accepted") toast("اتثبّت، افتحه من الأيقونة");
    renderScreen();
  }
});
$("importFile").addEventListener("change", e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try { toast(importBackup(r.result)); renderScreen(); }
    catch(err){ toast("الملف ده مش نسخة احتياطية من الأبلكيشن"); }
    e.target.value = "";
  };
  r.readAsText(f);
});
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; if (page === "settings") renderRef(); });
window.addEventListener("appinstalled", () => { installEvt = null; toast("اتثبّت، افتحه من الأيقونة"); if (page === "settings") renderRef(); });

/* ---------- guide (first launch) ---------- */
const guide = $("guide");
function openGuide(){ guide.hidden = false; $("obGo").focus(); }
$("obGo").addEventListener("click", () => { guide.hidden = true; LS.set("lb:ob", 1); });
$("showGuide").addEventListener("click", openGuide);

/* ---------- theme: auto / light / dark ---------- */
const THEMES = ["auto","light","dark"];
const TH_ICON = {
  auto:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>`,
  light:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/></svg>`,
  dark:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>`
};
const TH_NAME = {auto:"تلقائي حسب الموبايل", light:"فاتح", dark:"غامق"};
function applyTheme(t){
  const root = document.documentElement;
  if (t === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", t);
  const btn = $("themeBtn");
  btn.innerHTML = TH_ICON[t]; btn.setAttribute("aria-label", `المظهر: ${TH_NAME[t]}`); btn.title = `المظهر: ${TH_NAME[t]}`;
  const dark = t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.setAttribute("content", dark ? "#0D1220" : "#F2F4FA"); m.removeAttribute("media"); });
  document.querySelectorAll("[data-theme-pick]").forEach(b => b.setAttribute("aria-pressed", b.dataset.themePick === t ? "true" : "false"));
  if (screen === "progress" && seg === "weight") renderTracker();
}
let theme = LS.get("lb:theme") || LS.get("fit:theme") || "auto";
function setTheme(t){ theme = t; LS.set("lb:theme", t); applyTheme(t); }
$("themeBtn").addEventListener("click", () => setTheme(THEMES[(THEMES.indexOf(theme)+1) % 3]));
document.addEventListener("click", e => { const b = e.target.closest("[data-theme-pick]"); if (b) setTheme(b.dataset.themePick); });
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (theme === "auto") applyTheme("auto"); });
