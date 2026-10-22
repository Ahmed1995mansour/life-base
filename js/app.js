"use strict";
/* ===================== navigation =====================
   Pages live inside 5 tabs. A tab with more than one page shows a sub navigation under the title. */
const PAGES = {
  today:{scr:"today", grp:"today"},
  train:{scr:"train", grp:"health", t:"التمرين"}, food:{scr:"food", grp:"health", t:"الأكل"}, weight:{scr:"progress", seg:"weight", grp:"health", t:"الوزن"},
  money:{scr:"money", grp:"money", t:"الرئيسية"}, mstats:{scr:"money", grp:"money", t:"التحليل"}, mgoals:{scr:"money", grp:"money", t:"الأهداف"}, mcats:{scr:"money", grp:"money", t:"الفئات"},
  rem:{scr:"rem", grp:"rem"},
  quran:{scr:"progress", seg:"quran", grp:"more", t:"القرآن"}, week:{scr:"progress", seg:"week", grp:"more", t:"الأسبوع"}, ref:{scr:"ref", grp:"more", t:"المرجع والإعدادات"}
};
const GROUPS_NAV = {
  today:{t:"النهارده", p:["today"]}, health:{t:"الصحة", p:["train","food","weight"]},
  money:{t:"الفلوس", p:["money","mstats","mgoals","mcats"]}, rem:{t:"التذكيرات", p:["rem"]}, more:{t:"المزيد", p:["quran","week","ref"]}
};
const SCREENS = ["today","train","food","progress","ref","money","rem"];
const DAY_PAGES = ["today","train","food"];
const lastIn = LS.get("lb:last") || {};

function updateDayNav(){
  const day = curDay(), dt = dateOf(current);
  $("dayName").textContent = day.d;
  $("dayDate").textContent = isToday() ? `النهارده · ${short(dt)}` : `${short(dt)} · ارجع للنهارده`;
  $("dayLbl").classList.toggle("not-today", !isToday());
  $("dayNav").hidden = !DAY_PAGES.includes(page);
}
/* redraw whatever is on screen (after any change to the data) */
function renderScreen(){
  updateDayNav();
  if (screen === "today") renderToday();
  else if (screen === "train") renderTrain();
  else if (screen === "food") renderFood();
  else if (screen === "progress"){ if (seg === "week") renderWeek(); else if (seg === "quran") renderQuran(); else renderTracker(); }
  else if (screen === "rem") renderRem();
  else if (screen === "money") renderMoney();
  else if (screen === "ref") renderRef();
  updateRemBadge();
}
function go(name, opts){
  opts = opts || {};
  if (name === "progress") name = opts.seg || "weight";
  if (!PAGES[name]) name = "today";
  const P = PAGES[name], G = GROUPS_NAV[P.grp];
  page = name; screen = P.scr;
  SCREENS.forEach(s => { const el = $("scr-"+s); el.hidden = s !== screen; if (s !== screen && ["today","train","food","money","rem"].includes(s)) el.innerHTML = ""; });
  document.querySelectorAll(".tabbtn").forEach(b => b.setAttribute("aria-current", b.dataset.tab === P.grp ? "page" : "false"));
  $("scrTitle").textContent = G.t;
  const sn = $("subnav");
  sn.hidden = G.p.length < 2;
  sn.innerHTML = G.p.map(k => `<button type="button" data-page="${k}" aria-current="${k === name ? "page" : "false"}">${PAGES[k].t}</button>`).join("");
  $("fab").hidden = P.grp !== "money";
  if (P.seg) setSeg(P.seg);
  closeSheet();
  renderScreen();
  lastIn[P.grp] = name; LS.set("lb:last", lastIn);
  LS.set("lb:page", name);
  try { history.replaceState(null, "", "#"+name); } catch(e){}
  window.scrollTo({top:0});
  if (opts.ref){ const d = document.querySelector(`details.ref[data-ref="${opts.ref}"]`); if (d){ d.open = true; setTimeout(() => d.scrollIntoView({block:"start"}), 50); } }
}
function setSeg(name){
  seg = name;
  document.querySelectorAll("[data-pane]").forEach(p => p.hidden = p.dataset.pane !== name);
}
function shiftDay(n){
  let k = ORDER.indexOf(current) + n;
  if (k < 0){ weekOffset--; k = 6; } else if (k > 6){ weekOffset++; k = 0; }
  current = ORDER[k]; renderScreen();
}
$("prevDay").addEventListener("click", () => shiftDay(-1));
$("nextDay").addEventListener("click", () => shiftDay(1));
$("dayLbl").addEventListener("click", () => { weekOffset = 0; current = ORDER[today.getDay()]; renderScreen(); });
document.querySelector(".tabbar").addEventListener("click", e => {
  const b = e.target.closest(".tabbtn"); if (!b) return;
  const g = b.dataset.tab;
  go(lastIn[g] && GROUPS_NAV[g].p.includes(lastIn[g]) ? lastIn[g] : GROUPS_NAV[g].p[0]);
});
$("subnav").addEventListener("click", e => { const b = e.target.closest("[data-page]"); if (b) go(b.dataset.page); });
document.addEventListener("click", e => {
  const g = e.target.closest("[data-go]");
  if (g) go(g.dataset.go, {seg:g.dataset.seg, ref:g.dataset.ref});
});
$("fab").addEventListener("click", () => openAdd("out"));

/* ===================== start ===================== */
(async () => {
  current = ORDER[today.getDay()];
  applyTheme(theme);
  await loadAll();
  rollover();
  const fromHash = (location.hash || "").slice(1), last = LS.get("lb:page") || LS.get("fit:screen");
  go(PAGES[fromHash] ? fromHash : (PAGES[last] ? last : "today"));
  if (!LS.get("lb:ob")) openGuide();
  document.documentElement.classList.add("ready");
})();

let rsz; window.addEventListener("resize", () => { clearTimeout(rsz); rsz = setTimeout(() => { if (screen === "progress" && seg === "weight") renderTracker(); }, 150); });
setInterval(() => { if (screen === "today" && isToday() && !document.hidden){ const h = $("hero"); if (h) h.outerHTML = heroHTML(); } }, 60000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  const now = new Date(); now.setHours(0,0,0,0);
  if (now.getTime() !== today.getTime()) location.reload();
  if (!tEl.hidden && !tEl.classList.contains("end")) tick();
});
if ("serviceWorker" in navigator && location.protocol.startsWith("http")){
  window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
}
