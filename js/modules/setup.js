"use strict";
/* ===================== SETUP: first-run questions → a starting plan =====================
   About two minutes: you, your goal, your day, your training, what you want in the app.
   Everything it makes can be changed later from أنا ← خطتي. */
const GOALS = {cut:"أخس وأنزّل دهون", bulk:"أبني عضل وأزوّد وزن", fit:"لياقة وصحة"};
let su = null;   // answers while the setup is open
let setupDone = null;

function suDefaults(){
  const p = state.profile, b = needsSetup ? {} : (state.plan.body || {});   // a new person starts blank
  return {name:p.name || "", goal:p.goal || "cut", weight:b.start || "", height:b.height || "", target:"",
    wake:"06:30", sleep:"23:00", workDays:["sun","mon","tue","wed","thu"], workS:"09:00", workE:"17:00",
    gymDays:["sun","tue","thu"], gymT:"18:00", modules:Object.assign({}, p.modules), step:0};
}
const dayChips = (name, sel) => `<div class="chips">${ORDER.map((id, i) => `<button type="button" class="chip" data-su-day="${name}" data-id="${id}" aria-pressed="${sel.includes(id)}">${WEEKDAYS[i]}</button>`).join("")}</div>`;
const SU_STEPS = [
  () => `<h2>أهلًا بيك في LifeBase</h2><p class="small">كام سؤال سريع ونعملك خطة يومك. كل حاجة تقدر تغيّرها بعدين.</p>
    <button type="button" class="restore-link" data-su-restore>عندك بيانات قبل كده؟ رجّعها من هنا ←</button>
    <label class="lbl">اسمك<input class="input" data-su="name" value="${esc(su.name)}" placeholder="اختياري" autocomplete="given-name"></label>
    <span class="lbl">هدفك</span><div class="chips">${Object.entries(GOALS).map(([k, t]) => `<button type="button" class="chip" data-su-goal="${k}" aria-pressed="${su.goal === k}">${t}</button>`).join("")}</div>
    <div class="row3s"><label class="lbl">وزنك (كجم)<input class="input" data-su="weight" inputmode="decimal" value="${esc(su.weight)}"></label>
      <label class="lbl">طولك (سم)<input class="input" data-su="height" inputmode="numeric" value="${esc(su.height)}"></label>
      <label class="lbl">الوزن اللي عايزه<input class="input" data-su="target" inputmode="decimal" value="${esc(su.target)}" placeholder="اختياري"></label></div>`,
  () => `<h2>يومك</h2><p class="small">عشان نرتّب الجدول حوالين نومك وشغلك.</p>
    <div class="row2"><label class="lbl">بتصحى الساعة<input class="input" type="time" data-su="wake" value="${su.wake}"></label>
      <label class="lbl">بتنام الساعة<input class="input" type="time" data-su="sleep" value="${su.sleep}"></label></div>
    <span class="lbl">أيام الشغل أو الدراسة</span>${dayChips("workDays", su.workDays)}
    <div class="row2"><label class="lbl">من<input class="input" type="time" data-su="workS" value="${su.workS}"></label>
      <label class="lbl">لحد<input class="input" type="time" data-su="workE" value="${su.workE}"></label></div>`,
  () => `<h2>التمرين</h2><p class="small">اختار أيام الجيم، وإحنا نختار البرنامج المناسب لعددها.</p>
    <span class="lbl">أيام الجيم</span>${dayChips("gymDays", su.gymDays)}
    <label class="lbl">الساعة<input class="input" type="time" data-su="gymT" value="${su.gymT}"></label>
    <p class="small" id="suProg">${progLine()}</p>`,
  () => `<h2>عايز إيه في الأبلكيشن؟</h2><p class="small">اللي هتقفله مش هيظهر، وتقدر ترجّعه من الإعدادات.</p>
    <div class="toggles">${Object.entries(MODULES).map(([k, t]) => `<label class="toggle"><span>${t}</span><input type="checkbox" data-su-mod="${k}" ${su.modules[k] ? "checked" : ""}><i></i></label>`).join("")}</div>
    <div class="card" style="box-shadow:none;background:var(--surface-2)"><div class="card-h" style="margin-bottom:6px"><h2>مواقيت الصلاة</h2></div>
      <p class="small" style="margin:0 0 10px">${state.profile.loc ? `مدينتك: ${esc(state.profile.loc.name)}` : "حدد مدينتك عشان المواقيت تظهر في النهارده."}</p>
      <button type="button" class="btn soft" data-locsheet>${state.profile.loc ? "غيّر المدينة" : "حدد مدينتك"}</button></div>`
];
function progLine(){
  const n = su.gymDays.length;
  return n ? `البرنامج: <b>${PROGRAMS[Math.min(6, n)].n}</b> · ${n} ${n <= 2 ? (n === 1 ? "يوم" : "يومين") : "أيام"} في الأسبوع` : "من غير جيم. تقدر تضيفه بعدين.";
}
function renderSetup(){
  const last = su.step === SU_STEPS.length - 1;
  $("setup").innerHTML = `<div class="su-card" role="dialog" aria-modal="true" aria-label="إعداد LifeBase">
    <div class="su-dots">${SU_STEPS.map((_, i) => `<i class="${i <= su.step ? "on" : ""}"></i>`).join("")}</div>
    <div class="form">${SU_STEPS[su.step]()}</div>
    <div class="su-nav">${su.step ? `<button type="button" class="btn ghost" data-su-nav="-1">رجوع</button>` : `<button type="button" class="btn ghost" data-su-skip>بعدين</button>`}
      <button type="button" class="btn primary lg" data-su-nav="1">${last ? "يلا نبدأ" : "التالي"}</button></div></div>`;
  $("setup").hidden = false;
}
/* opens the setup; resolves when it is finished */
function openSetup(fresh){
  su = suDefaults(); su.fresh = !!fresh;
  renderSetup();
  return new Promise(res => { setupDone = res; });
}
function closeSetup(){ $("setup").hidden = true; $("setup").innerHTML = ""; if (setupDone){ const r = setupDone; setupDone = null; r(); } }

document.addEventListener("input", e => { const k = e.target.dataset && e.target.dataset.su; if (k && su) su[k] = e.target.value; });
document.addEventListener("change", e => { const k = e.target.dataset && e.target.dataset.suMod; if (k && su) su.modules[k] = e.target.checked; });
document.addEventListener("click", e => {
  if (!su) return;
  const g = e.target.closest("[data-su-goal]");
  if (g){ su.goal = g.dataset.suGoal; document.querySelectorAll("[data-su-goal]").forEach(b => b.setAttribute("aria-pressed", b === g)); return; }
  const d = e.target.closest("[data-su-day]");
  if (d){ const list = su[d.dataset.suDay], id = d.dataset.id, i = list.indexOf(id);
    if (i < 0) list.push(id); else list.splice(i, 1);
    d.setAttribute("aria-pressed", i < 0); const pl = $("suProg"); if (pl) pl.innerHTML = progLine(); return; }
  if (e.target.closest("[data-su-skip]")){ finishSetup(true); return; }
  const n = e.target.closest("[data-su-nav]"); if (!n) return;
  const step = su.step + +n.dataset.suNav;
  if (step >= SU_STEPS.length){ finishSetup(false); return; }
  su.step = Math.max(0, step); renderSetup();
});

function finishSetup(skipped){
  const a = su; su = null;
  state.profile.name = a.name.trim(); state.profile.goal = a.goal; state.profile.modules = a.modules; state.profile.setup = true;
  state.plan = buildPlan(a); bindPlan(); needsSetup = false;
  save(); closeSetup();
  toast(skipped ? "عملنالك خطة مبدئية. عدّلها من أنا ← خطتي" : `خطتك جاهزة${a.name ? " يا " + a.name.trim() : ""}`);
}

/* ---------- the generator ---------- */
function buildPlan(a){
  const w = parseNum(a.weight) || 0, tw = parseNum(a.target) || 0, goal = a.goal;
  const kcalMid = w ? Math.round((w * 30 + (goal === "cut" ? -700 : goal === "bulk" ? 300 : 0)) / 50) * 50 : 0;
  const protein = w ? Math.round((goal === "bulk" ? 1.8 : 1.6) * w / 5) * 5 : 0;
  const water = w ? Math.max(2, Math.round(w * 0.033 * 2) / 2) : 2.5;
  const gymKeys = PROGRAMS[Math.min(6, Math.max(1, a.gymDays.length))].s;
  const gymOrder = ORDER.filter(id => a.gymDays.includes(id));
  const meals = mealBank();
  const m = s => toMin(s) ?? 0;
  const days = ORDER.map((id, di) => {
    const work = a.workDays.includes(id), gi = gymOrder.indexOf(id), gym = gi >= 0 && a.gymDays.length;
    const W = gym ? sessionWorkout(gymKeys[gi % gymKeys.length]) : null;
    let wake = m(a.wake), sleep = m(a.sleep); if (sleep <= wake) sleep += 1440;
    const tl = [], add = (s, e, k, t, sub, meal) => tl.push({id:"t" + uid(), s:hhmm(s), e:e != null ? hhmm(e) : "", free:"", k, t, sub:sub || "", m:meal ? meal.m : [], r:meal ? meal.r : []});
    add(wake, null, "sleep", "تصحى", "كوباية مية أول ما تصحى");
    const ws = m(a.workS), we = m(a.workE) > ws ? m(a.workE) : m(a.workE) + 1440;
    const bf = work ? Math.min(wake + 30, ws - 15) : wake + 45;
    add(Math.max(wake + 10, bf), null, "food", "فطار", "", meals.breakfast[di % meals.breakfast.length]);
    if (work) add(ws, we, "work", "شغل", "");
    let gs = gym ? m(a.gymT) : null;
    if (gym && work && gs >= ws && gs < we) gs = we + 30;            // gym can't be during work
    const lunch = gym && gs >= 11 * 60 && gs <= 14 * 60 ? gs + 90 : (work && we <= 16 * 60 ? we + 30 : 14 * 60);
    add(lunch, null, "food", "غدا", gym && gs + 90 === lunch ? "بعد الجيم على طول" : "", meals.lunch[di % meals.lunch.length]);
    if (gym){
      add(gs - 75, null, "food", "سناك قبل الجيم", "", meals.pre[di % meals.pre.length]);
      add(gs, gs + 75, "gym", `الجيم: ${W.k}`, "التفاصيل في شاشة التمرين");
    }
    const snack = gym && gs > 15 * 60 ? null : 17 * 60;
    if (snack != null && !(gym && Math.abs(gs - snack) < 90)) add(snack, null, "food", "سناك", "", meals.snack[di % meals.snack.length]);
    let dinner = Math.min(Math.max(lunch + 300, 19 * 60 + 30), sleep - 150);
    if (gym && gs + 75 > dinner - 30) dinner = Math.min(gs + 90, sleep - 60);   // after an evening workout
    add(dinner, null, "food", "عشا", "", meals.dinner[di % meals.dinner.length]);
    if (a.modules.quran) add(Math.min(dinner + 60, sleep - 60), Math.min(dinner + 80, sleep - 40), "deen", "ورد القرآن", "");
    add(sleep - 30, sleep, "self", "تهدى قبل النوم", "من غير موبايل لو تقدر");
    add(sleep, null, "sleep", "نوم", "");
    tl.sort((x, y) => toMin(x.s) - toMin(y.s));
    return {id, k:W ? W.k : (work ? "شغل" : "إجازة"), badge:gym ? `جيم ${t12(gs)}: ${SESSIONS[gymKeys[gi % gymKeys.length]].t}` : (work ? "يوم شغل، من غير جيم" : "يوم راحة"),
      note:"", tl, wu:W ? W.wu : null, cd:W ? W.cd : null, ex:W ? W.ex : [], abs:W && gi % 2 === 0 ? W.abs : [], routines:[], tread:!!W && goal === "cut"};
  });
  const habits = [["h1","اتوزنت الصبح على الريق"],["h2",`${water} لتر مية`],["h3","8–10 آلاف خطوة"]];
  if (protein) habits.push(["h4",`بروتين ${protein} جم`]);
  habits.push(["h5","غسلت سناني الصبح"],["h6","غسلت سناني قبل النوم"]);
  if (a.modules.quran) habits.push(["h7","قرأت وردي من القرآن"]);
  const lo = tw || (goal === "cut" ? Math.round(w * 0.85) : goal === "bulk" ? Math.round(w * 1.08) : w);
  return {v:1, days, habits,
    targets:{kcal:kcalMid ? `${kcalMid - 100}–${kcalMid + 100}` : "", protein:protein ? String(protein) : "", water:String(water), steps:"8–10 آلاف", sleep:"7+", quran:a.modules.quran ? "نص جزء" : ""},
    body:{start:w || "", goalLo:goal === "bulk" ? lo - 2 : lo, goalHi:goal === "bulk" ? lo : lo + 2, height:parseNum(a.height) || ""}};
}
/* meals from Mans's plan, sorted into slots (personal notes dropped) */
function mealBank(){
  const bank = {breakfast:[], lunch:[], dinner:[], snack:[], pre:[]};
  DEFAULT_DAYS.forEach(d => d.tl.forEach(it => {
    if (it[1] !== "food" || !it[4]) return;
    const t = it[2], meal = {m:it[4].slice(), r:(it[5] || []).slice()};
    if (/فطار/.test(t)) bank.breakfast.push(meal);
    else if (/غدا/.test(t)) bank.lunch.push(meal);
    else if (/عشا/.test(t)) bank.dinner.push(meal);
    else if (/قبل الجيم/.test(t)) bank.pre.push(meal);
    else if (/سناك/.test(t)) bank.snack.push(meal);
  }));
  Object.keys(bank).forEach(k => { if (!bank[k].length) bank[k] = [{m:[], r:[]}]; });
  return bank;
}
