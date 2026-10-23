"use strict";
/* ===================== navigation =====================
   Pages live inside 5 tabs. A tab with more than one page shows a sub navigation under the title. */
const PAGES = {
  today:{scr:"today", grp:"today"},
  sched:{scr:"sched", grp:"plan", t:"الجدول"}, tasks:{scr:"tasks", grp:"plan", t:"المهام"}, rem:{scr:"rem", grp:"plan", t:"التذكيرات"}, week:{scr:"progress", seg:"week", grp:"plan", t:"الأسبوع"},
  train:{scr:"train", grp:"health", t:"التمرين"}, food:{scr:"food", grp:"health", t:"الأكل"}, weight:{scr:"progress", seg:"weight", grp:"health", t:"الوزن"},
  money:{scr:"money", grp:"money", t:"الرئيسية"}, mstats:{scr:"money", grp:"money", t:"التحليل"}, mgoals:{scr:"money", grp:"money", t:"الأهداف"}, mcats:{scr:"money", grp:"money", t:"الفئات"},
  quran:{scr:"progress", seg:"quran", grp:"me", t:"القرآن"}, myplan:{scr:"myplan", grp:"me", t:"خطتي"}, ref:{scr:"ref", grp:"me", t:"المرجع"}, settings:{scr:"settings", grp:"me", t:"الإعدادات"}
};
const GROUPS_NAV = {
  today:{t:"يومي", p:["today"]}, plan:{t:"الخطة", p:["sched","tasks","rem","week"]}, health:{t:"الصحة", p:["train","food","weight"]},
  money:{t:"الفلوس", p:["money","mstats","mgoals","mcats"]}, me:{t:"أنا", p:["quran","myplan","ref","settings"]}
};
const SCREENS = ["today","sched","tasks","train","food","progress","ref","settings","myplan","money","rem"];
const DAY_PAGES = ["today","sched","train","food"];
const lastIn = LS.get("lb:last") || {};

function updateDayNav(){
  const day = curDay(), dt = dateOf(current);
  $("dayName").textContent = WEEKDAYS[ORDER.indexOf(day.id)];
  $("dayDate").textContent = isToday() ? `النهارده · ${short(dt)}` : `${short(dt)} · ارجع للنهارده`;
  $("dayLbl").classList.toggle("not-today", !isToday());
  $("dayNav").hidden = !DAY_PAGES.includes(page);
  if (page === "today") $("scrTitle").textContent = relDay(curDate());   // the title follows the day you're looking at
}
/* "النهارده", "بكرة", "امبارح", "بعد 5 أيام", "من 3 أيام" */
function relDay(date){
  const n = Math.round((new Date(date + "T00:00") - today) / 864e5);
  if (n === 0) return "النهارده"; if (n === 1) return "بكرة"; if (n === -1) return "امبارح";
  return n > 1 ? `بعد ${daysWord(n)}` : `من ${daysWord(-n)}`;
}
/* redraw whatever is on screen (after any change to the data) */
function renderScreen(){
  updateDayNav();
  if (screen === "today") renderToday();
  else if (screen === "train") renderTrain();
  else if (screen === "food") renderFood();
  else if (screen === "progress"){ if (seg === "week") renderWeek(); else if (seg === "quran") renderQuran(); else renderTracker(); }
  else if (screen === "sched") renderSchedule();
  else if (screen === "tasks") renderTasks();
  else if (screen === "rem") renderRem();
  else if (screen === "money") renderMoney();
  else if (screen === "settings") renderRef();
  else if (screen === "myplan") renderMyPlan();
  else if (screen === "ref") renderTargets();
  updateRemBadge();
}
function go(name, opts){
  opts = opts || {};
  if (name === "progress") name = opts.seg || "weight";
  if (!PAGES[name]) name = "today";
  const on = state.profile.modules, grpOn = {plan:on.plan, health:on.health, money:on.money};
  if (grpOn[PAGES[name].grp] === false || (name === "quran" && !on.quran)) name = "today";
  if (name !== "myplan") editDay = null;
  const P = PAGES[name], G = GROUPS_NAV[P.grp];
  page = name; screen = P.scr;
  SCREENS.forEach(s => { const el = $("scr-"+s); el.hidden = s !== screen; if (s !== screen && !["progress","ref","settings"].includes(s)) el.innerHTML = ""; });
  document.querySelectorAll(".tabbtn").forEach(b => b.setAttribute("aria-current", b.dataset.tab === P.grp ? "page" : "false"));
  $("scrTitle").textContent = G.t;
  const sn = $("subnav");
  sn.hidden = G.p.length < 2;
  sn.innerHTML = G.p.map(k => `<button type="button" data-page="${k}" aria-current="${k === name ? "page" : "false"}">${PAGES[k].t}</button>`).join("");
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
$("fab").addEventListener("click", () => screen === "money" ? openAdd("out") : openQuick());

/* swipe left/right on a day screen to change the day (next day is to the left in Arabic) */
let dsw = null;
document.querySelector("main").addEventListener("touchstart", e => {
  if (!DAY_PAGES.includes(page) || e.touches.length > 1) return;
  if (e.target.closest(".td,.subnav,.tablewrap,input,textarea,select,.chips,.prayers,.chartbox,video")) return;
  dsw = {x:e.touches[0].clientX, y:e.touches[0].clientY, t:Date.now()};
}, {passive:true});
document.querySelector("main").addEventListener("touchend", e => {
  if (!dsw) return;
  const t = e.changedTouches[0], dx = t.clientX - dsw.x, dy = t.clientY - dsw.y, fast = Date.now() - dsw.t < 600; dsw = null;
  if (fast && Math.abs(dx) > 70 && Math.abs(dy) < 45){ shiftDay(dx > 0 ? 1 : -1); buzz(6); }
}, {passive:true});

/* ===================== start ===================== */
(async () => {
  current = ORDER[today.getDay()];
  applyTheme(theme);
  await loadAll();
  if (cloudOn()) await Promise.race([pullCloud(), new Promise(r => setTimeout(r, 5000))]);   // newer data from another device
  if (needsSetup) await openSetup(true);
  applyModules();
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
