"use strict";
/* ===================== MY PLAN (أنا ← خطتي): edit everything the app is built on =====================
   Days (schedule + workout), habits, targets, modules, prayer times, ready-made programs, and a fresh setup. */
const KINDS = {sleep:"نوم وصحيان", work:"شغل أو دراسة", food:"أكل", gym:"رياضة", home:"أسرة وبيت", self:"وقتك", deen:"عبادة"};
const EX_KINDS = {main:"أساسي تقيل (3 مجموعات)", comp:"مركّب (3 مجموعات)", iso:"معزول", hold:"وزن الجسم أو ثبات"};
const WU_OPTS = {"":"من غير", upper:"إحماء الجزء العلوي", lower:"إحماء الرجل", football:"إحماء الكورة"};
let editDay = null;            // day id being edited, or null for the overview
let itemEdit = null;           // {day, id} of the timeline item in the sheet
let exEdit = null;             // {day, list:"ex"|"abs", i}

const dayOf = id => DAYS.find(d => d.id === id);
const dayName = id => WEEKDAYS[ORDER.indexOf(id)];

function renderMyPlan(){
  const el = $("scr-myplan");
  if (editDay){ el.innerHTML = dayEditorHTML(dayOf(editDay)); return; }
  const P = state.plan, T = P.targets, B = P.body, pr = state.profile;
  const tField = (k, label, ph) => `<label class="lbl">${label}<input class="input" data-target="${k}" value="${esc(T[k] || "")}" placeholder="${ph || ""}"></label>`;
  const bField = (k, label) => `<label class="lbl">${label}<input class="input" data-bodyf="${k}" inputmode="decimal" value="${esc(B[k] || "")}"></label>`;
  el.innerHTML = `
    <section class="card"><div class="card-h"><h2>أيامك</h2><span class="small">دوس على يوم تعدّله</span></div>
      ${ORDER.map(id => { const d = dayOf(id), gym = d.ex.length || d.routines.length;
        return `<button type="button" class="prow" data-editday="${id}"><b>${dayName(id)}</b><span><span>${esc(d.k || "—")}</span><small>${d.tl.length} حاجة في الجدول${gym ? ` · ${d.ex.length + d.routines.reduce((n, r) => n + r.items.length, 0)} تمرين` : ""}</small></span>${ICO.next}</button>`; }).join("")}
    </section>
    <section class="card"><div class="card-h"><h2>برنامج تمرين جاهز</h2></div>
      <p class="small" style="margin:0 0 10px">اختار أيام الجيم، وهنحط برنامج مناسب لعددها مكان تمارين الأيام دي. الجدول نفسه مش هيتغيّر.</p>
      <div class="chips" id="progDays">${ORDER.map(id => `<button type="button" class="chip" data-progday="${id}" aria-pressed="${!!(dayOf(id).ex.length)}">${dayName(id)}</button>`).join("")}</div>
      <div class="actrow" style="margin-top:10px"><span class="small" id="progName"></span><button type="button" class="btn sm soft" data-progapply style="margin-inline-start:auto">طبّق البرنامج</button></div>
    </section>
    <section class="card"><div class="card-h"><h2>عاداتك اليومية</h2></div>
      <div class="hlist">${HABITS.map(([id, t]) => `<div class="m-subline"><input class="input" data-habit="${id}" value="${esc(t)}" aria-label="العادة"><button type="button" class="iconbtn" data-delhabit="${id}" aria-label="امسح العادة">${XICON}</button></div>`).join("")}</div>
      <form class="m-subline" id="habitForm" autocomplete="off" style="margin-top:8px"><input class="input" placeholder="عادة جديدة، مثلًا: قريت 10 صفحات" aria-label="عادة جديدة"><button class="btn sm soft">ضيف</button></form>
    </section>
    <section class="card"><div class="card-h"><h2>أهدافك</h2></div>
      <span class="lbl">الهدف</span><div class="chips" style="margin-bottom:10px">${Object.entries(GOALS).map(([k, t]) => `<button type="button" class="chip" data-goalset="${k}" aria-pressed="${pr.goal === k}">${t}</button>`).join("")}</div>
      <div class="row3s">${bField("start","وزن البداية")}${bField("goalLo","الهدف من")}${bField("goalHi","لحد")}</div>
      <div class="row3s" style="margin-top:10px">${tField("kcal","السعرات","2000–2200")}${tField("protein","بروتين (جم)")}${tField("water","مية (لتر)")}</div>
      <div class="row3s" style="margin-top:10px">${tField("steps","خطوات")}${tField("sleep","نوم (ساعات)")}${tField("quran","ورد القرآن")}</div>
      <label class="lbl" style="margin-top:10px">اسمك<input class="input" data-prof="name" value="${esc(pr.name)}"></label>
    </section>
    <section class="card"><div class="card-h"><h2>الأقسام</h2></div>
      <div class="toggles">${Object.entries(MODULES).map(([k, t]) => `<label class="toggle"><span>${t}</span><input type="checkbox" data-mod="${k}" ${pr.modules[k] ? "checked" : ""}><i></i></label>`).join("")}</div>
    </section>
    <section class="card"><div class="card-h"><h2>مواقيت الصلاة</h2><button type="button" class="btn sm soft" data-locsheet>${pr.loc ? "غيّر" : "حدد مدينتك"}</button></div>${prayerPreview()}</section>
    <section class="card"><div class="card-h"><h2>خطة جديدة من الأول</h2></div>
      <p class="small" style="margin:0 0 10px">نسألك نفس أسئلة البداية ونعمل جدول وتمرين وعادات جديدة. بياناتك (الفلوس، والوزن، والمهام، والتذكيرات) مش هتتمسح.</p>
      <button type="button" class="btn" data-resetup>ابدأ الأسئلة</button></section>`;
  progPreview();
}

/* ---------- one day ---------- */
function dayEditorHTML(d){
  const T = timed(d);
  const exRow = (e, i, list) => `<button type="button" class="prow" data-exedit="${list}:${i}"><span class="en" style="font-weight:600">${esc(e.n)}</span><span><small>${esc(list === "abs" ? (e.sets || "") : setsShort(e))}</small></span>${ICO.next}</button>`;
  return `<button type="button" class="golink" data-editday="" style="margin-bottom:-4px">→ كل الأيام</button>
    <section class="card"><div class="card-h"><h2>${dayName(d.id)}</h2></div>
      <div class="form"><div class="row2"><label class="lbl">اسم اليوم<input class="input" data-dayf="k" value="${esc(d.k)}" placeholder="مثلًا: Upper A أو راحة"></label>
        <label class="lbl">سطر تحت العنوان<input class="input" data-dayf="badge" value="${esc(d.badge)}"></label></div>
      <label class="lbl">ملاحظة لليوم<input class="input" data-dayf="note" value="${esc(d.note)}" placeholder="اختياري"></label></div></section>
    <section class="card"><div class="card-h"><h2>الجدول</h2><span class="small">${d.tl.length}</span></div>
      ${T.map(({it}) => `<button type="button" class="prow" data-item="${it.id}"><span class="num tt" dir="ltr">${esc(timeText(it)) || "—"}</span><span><span><i class="tdot d-${it.k}"></i> ${esc(it.t)}</span>${it.sub ? `<small>${esc(it.sub)}</small>` : ""}</span>${ICO.next}</button>`).join("") || `<p class="small">الجدول فاضي.</p>`}
      <div class="actrow" style="margin-top:10px"><button type="button" class="btn sm soft" data-item="">+ ضيف للجدول</button><button type="button" class="btn sm" data-copyday>انسخ الجدول لأيام تانية</button></div></section>
    <section class="card"><div class="card-h"><h2>التمرين</h2></div>
      <div class="row2"><label class="lbl">الإحماء<select class="input" data-dayf="wu">${Object.entries(WU_OPTS).map(([k, t]) => `<option value="${k}" ${(Array.isArray(d.wu) ? d.wu[0] : d.wu || "") === k ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <label class="lbl">الإطالات في الآخر<select class="input" data-dayf="cd">${Object.entries({"":"من غير", upper:"الجزء العلوي", lower:"الرجل", football:"بعد الماتش"}).map(([k, t]) => `<option value="${k}" ${(d.cd || "") === k ? "selected" : ""}>${t}</option>`).join("")}</select></label></div>
      <h3 class="sect-title" style="margin:14px 2px 4px">التمارين</h3>
      ${d.ex.map((e, i) => exRow(e, i, "ex")).join("") || `<p class="small" style="margin:0">مفيش تمارين.</p>`}
      <div class="actrow" style="margin-top:8px"><button type="button" class="btn sm soft" data-exedit="ex:new">+ تمرين</button></div>
      <h3 class="sect-title" style="margin:14px 2px 4px">البطن</h3>
      ${d.abs.map((e, i) => exRow(e, i, "abs")).join("") || `<p class="small" style="margin:0">مفيش.</p>`}
      <div class="actrow" style="margin-top:8px"><button type="button" class="btn sm soft" data-exedit="abs:new">+ تمرين بطن</button></div>
      ${d.routines.map((r, i) => `<div class="prow" style="cursor:default"><span style="font-weight:600">${esc(r.title)}</span><span><small>${r.items.length} تمرين</small></span><button type="button" class="iconbtn" data-delroutine="${i}" aria-label="امسح">${XICON}</button></div>`).join("")}
      <label class="toggle" style="margin-top:12px"><span>مشاية بعد التمرين (10–15 دقيقة)</span><input type="checkbox" data-dayf="tread" ${d.tread ? "checked" : ""}><i></i></label>
      <span class="lbl" style="margin-top:12px">أو حط تمرين جاهز مكان التمارين دي</span>
      <div class="chips">${Object.entries(SESSIONS).map(([k, S]) => `<button type="button" class="chip" data-session="${k}">${S.k}</button>`).join("")}</div>
    </section>`;
}

/* ---------- timeline item sheet ---------- */
function openItemSheet(dayId, id){
  const d = dayOf(dayId), it = id ? d.tl.find(x => x.id === id) : {s:"", e:"", k:"food", t:"", sub:"", m:[], r:[]};
  itemEdit = {day:dayId, id:id || null};
  const tm = v => { const x = toMin(v); return x == null ? "" : hhmm(x % 1440); };
  openSheet(`<h2 class="sheet-t">${id ? "تعديل" : "حاجة جديدة في الجدول"}</h2>
    <form id="itemForm" class="form" autocomplete="off">
      <label class="lbl">الاسم<input class="input" name="t" required value="${esc(it.t)}" placeholder="مثلًا: غدا، شغل، مشي"></label>
      <div class="row2"><label class="lbl">من<input class="input" type="time" name="s" value="${tm(it.s)}"></label><label class="lbl">لحد (اختياري)<input class="input" type="time" name="e" value="${tm(it.e)}"></label></div>
      <label class="lbl">النوع<select class="input" name="k">${Object.entries(KINDS).map(([k, t]) => `<option value="${k}" ${k === it.k ? "selected" : ""}>${t}</option>`).join("")}</select></label>
      <label class="lbl">تفاصيل (اختياري)<input class="input" name="sub" value="${esc(it.sub)}"></label>
      <label class="lbl">المكونات، كل حاجة في سطر (للأكل)<textarea class="input" name="m" rows="4">${esc((it.m || []).join("\n"))}</textarea></label>
      <div class="actrow"><button class="btn primary">احفظ</button>${id ? `<button type="button" class="btn danger" data-delitem style="margin-inline-start:auto">امسح</button>` : ""}</div>
    </form>`, "الجدول");
}
/* "HH:MM" from a time input; small hours belong to the end of the day (after midnight) */
function fromInput(v, after){
  const x = toMin(v); if (x == null) return "";
  return hhmm(x < 4 * 60 && after ? x + 1440 : x);
}

/* ---------- exercise sheet ---------- */
function openExSheet(dayId, list, i){
  const d = dayOf(dayId), isNew = i === "new", e = isNew ? {n:"", k:list === "abs" ? undefined : "iso", reps:"10–12", rest:"راحة 60 ث", c:"", sets:list === "abs" ? "3×12" : ""} : d[list][+i];
  exEdit = {day:dayId, list, i};
  const lib = exerciseLibrary();
  openSheet(`<h2 class="sheet-t">${isNew ? "تمرين جديد" : "تعديل التمرين"}</h2>
    <form id="exForm" class="form" autocomplete="off">
      <label class="lbl">الاسم<input class="input en" name="n" list="exLib" required value="${esc(e.n)}" placeholder="اختار من القايمة أو اكتب"></label>
      <datalist id="exLib">${Object.keys(lib).sort().map(n => `<option value="${esc(n)}">`).join("")}</datalist>
      ${list === "abs" ? `<label class="lbl">المجموعات والعدات<input class="input" name="sets" value="${esc(e.sets || "")}" placeholder="3×12"></label>`
        : `<label class="lbl">النوع<select class="input" name="k">${Object.entries(EX_KINDS).map(([k, t]) => `<option value="${k}" ${k === e.k ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <div class="row3s"><label class="lbl">مجموعات<input class="input" name="sets" value="${esc(e.sets || "")}" placeholder="${e.k === "main" || e.k === "comp" ? "3" : "2"}"></label>
          <label class="lbl">عدات<input class="input" name="reps" value="${esc(e.reps || "")}"></label>
          <label class="lbl">راحة<input class="input" name="rest" value="${esc(e.rest || "")}" placeholder="راحة 90 ث"></label></div>`}
      <label class="lbl">إزاي تعمله (اختياري)<textarea class="input" name="c" rows="3">${esc(e.c || "")}</textarea></label>
      <div class="actrow"><button class="btn primary">احفظ</button>${isNew ? "" : `<button type="button" class="btn danger" data-delex style="margin-inline-start:auto">امسح</button>`}</div>
    </form>`, "التمرين");
}

/* ---------- ready-made program over chosen days ---------- */
function progDays(){ return [...document.querySelectorAll("[data-progday]")].filter(b => b.getAttribute("aria-pressed") === "true").map(b => b.dataset.progday); }
function progPreview(){ const n = progDays().length, el = $("progName"); if (el) el.innerHTML = n ? `<b>${PROGRAMS[Math.min(6, n)].n}</b> على ${n} ${n === 1 ? "يوم" : n === 2 ? "يومين" : "أيام"}` : "اختار يوم واحد على الأقل"; }

/* ---------- events ---------- */
const planChanged = () => { save(); };
document.addEventListener("click", e => {
  const ed = e.target.closest("[data-editday]");
  if (ed){
    if (page !== "myplan"){ editDay = ed.dataset.editday || null; go("myplan"); return; }
    editDay = ed.dataset.editday || null; renderMyPlan(); window.scrollTo({top:0}); return;
  }
  const it = e.target.closest("[data-item]"); if (it){ openItemSheet(editDay, it.dataset.item); return; }
  const ex = e.target.closest("[data-exedit]"); if (ex){ const [list, i] = ex.dataset.exedit.split(":"); openExSheet(editDay, list, i); return; }
  if (e.target.closest("[data-delitem]")){
    const d = dayOf(itemEdit.day); d.tl = d.tl.filter(x => x.id !== itemEdit.id); planChanged(); closeSheet(); renderMyPlan(); toast("اتمسحت من الجدول"); return; }
  if (e.target.closest("[data-delex]")){
    const d = dayOf(exEdit.day); d[exEdit.list].splice(+exEdit.i, 1); planChanged(); closeSheet(); renderMyPlan(); toast("التمرين اتمسح"); return; }
  const dr = e.target.closest("[data-delroutine]");
  if (dr){ const d = dayOf(editDay); d.routines.splice(+dr.dataset.delroutine, 1); planChanged(); renderMyPlan(); return; }
  const ss = e.target.closest("[data-session]");
  if (ss){ const d = dayOf(editDay), W = sessionWorkout(ss.dataset.session);
    Object.assign(d, {ex:W.ex, abs:W.abs, wu:W.wu, cd:W.cd}); if (!d.k || /راحة|إجازة|شغل/.test(d.k)) d.k = W.k;
    planChanged(); renderMyPlan(); toast(`اتحط تمرين ${W.k}`); return; }
  if (e.target.closest("[data-copyday]")){
    openSheet(`<h2 class="sheet-t">انسخ جدول ${dayName(editDay)}</h2><p class="small" style="margin:-6px 0 0">الجدول بس، من غير التمرين. جدول الأيام اللي هتختارها هيتبدّل.</p>
      <div class="chips">${ORDER.filter(id => id !== editDay).map(id => `<button type="button" class="chip" data-copyto="${id}" aria-pressed="false">${dayName(id)}</button>`).join("")}</div>
      <button type="button" class="btn primary lg" data-copygo>انسخ</button>`, "انسخ الجدول"); return; }
  const ct = e.target.closest("[data-copyto]"); if (ct){ ct.setAttribute("aria-pressed", ct.getAttribute("aria-pressed") !== "true"); return; }
  if (e.target.closest("[data-copygo]")){
    const to = [...document.querySelectorAll('[data-copyto][aria-pressed="true"]')].map(b => b.dataset.copyto);
    if (!to.length){ toast("اختار يوم"); return; }
    const src = dayOf(editDay).tl;
    to.forEach(id => { dayOf(id).tl = src.map(x => Object.assign(JSON.parse(JSON.stringify(x)), {id:"t" + uid()})); });
    planChanged(); closeSheet(); toast(`اتنسخ لـ ${to.length} ${to.length === 1 ? "يوم" : "أيام"}`); return; }
  const pd = e.target.closest("[data-progday]"); if (pd){ pd.setAttribute("aria-pressed", pd.getAttribute("aria-pressed") !== "true"); progPreview(); return; }
  if (e.target.closest("[data-progapply]")){
    const days = progDays(); if (!days.length){ toast("اختار أيام الجيم"); return; }
    const keys = PROGRAMS[Math.min(6, days.length)].s;
    ORDER.forEach(id => { const d = dayOf(id), i = days.indexOf(id);
      if (i >= 0){ const W = sessionWorkout(keys[i % keys.length]); Object.assign(d, {ex:W.ex, abs:i % 2 === 0 ? W.abs : [], wu:W.wu, cd:W.cd, k:W.k, tread:d.tread}); }
      else if (d.ex.length){ Object.assign(d, {ex:[], abs:[], wu:null, cd:null}); if (!d.routines.length) d.k = "راحة"; } });
    planChanged(); renderMyPlan(); toast("البرنامج اتطبّق. ظبّط معاد الجيم في جدول كل يوم"); return; }
  const dh = e.target.closest("[data-delhabit]");
  if (dh){ const id = dh.dataset.delhabit, at = HABITS.findIndex(h => h[0] === id), gone = HABITS[at];
    HABITS.splice(at, 1); planChanged(); renderMyPlan();
    toast("العادة اتمسحت", "تراجع", () => { HABITS.splice(at, 0, gone); save(); renderScreen(); }); return; }
  const gs = e.target.closest("[data-goalset]");
  if (gs){ state.profile.goal = gs.dataset.goalset; save(); document.querySelectorAll("[data-goalset]").forEach(b => b.setAttribute("aria-pressed", b === gs)); return; }
  if (e.target.closest("[data-resetup]")){ openSetup(false).then(() => { editDay = null; go("today"); }); }
});
document.addEventListener("input", e => {
  const t = e.target, d = editDay && dayOf(editDay);
  if (t.form && t.form.id === "exForm" && t.name === "n" && exEdit && exEdit.i === "new"){   // picked from the library: fill the rest
    const L = exerciseLibrary()[t.value.trim()]; if (!L) return;
    const f = t.form; if (f.k && L.k) f.k.value = L.k; if (f.reps) f.reps.value = L.reps || ""; if (f.rest) f.rest.value = /Superset/.test(L.rest || "") ? "راحة 60 ث" : (L.rest || "");
    if (f.sets) f.sets.value = L.sets || ""; f.c.value = L.c || ""; return;
  }
  if (t.dataset.dayf && d && t.type !== "checkbox" && t.tagName !== "SELECT"){ d[t.dataset.dayf] = t.value; planChanged(); }
  else if (t.dataset.habit){ const h = HABITS.find(x => x[0] === t.dataset.habit); if (h){ h[1] = t.value; planChanged(); } }
  else if (t.dataset.target){ state.plan.targets[t.dataset.target] = t.value.trim(); planChanged(); }
  else if (t.dataset.bodyf){ const v = parseNum(t.value); state.plan.body[t.dataset.bodyf] = v == null ? "" : v; planChanged(); }
  else if (t.dataset.prof){ state.profile[t.dataset.prof] = t.value; planChanged(); }
});
document.addEventListener("change", e => {
  const t = e.target, d = editDay && dayOf(editDay);
  if (t.dataset.dayf && d && (t.type === "checkbox" || t.tagName === "SELECT")){
    const k = t.dataset.dayf;
    if (k === "tread") d.tread = t.checked;
    else if (k === "wu"){ const rest = Array.isArray(d.wu) ? d.wu.slice(1) : []; d.wu = t.value ? (rest.length ? [t.value, ...rest] : t.value) : (rest.length ? rest : null); }
    else d[k] = t.value || null;
    planChanged();
  }
  if (t.dataset.mod){ state.profile.modules[t.dataset.mod] = t.checked; save(); applyModules(); }
});
document.addEventListener("submit", e => {
  const f = e.target;
  if (f.id === "habitForm"){
    e.preventDefault(); const v = f.querySelector("input").value.trim(); if (!v) return;
    HABITS.push(["h" + uid(), v]); planChanged(); renderMyPlan(); return;
  }
  if (f.id === "itemForm"){
    e.preventDefault();
    const d = dayOf(itemEdit.day), firstS = toMin((timed(d).find(x => x.s != null) || {}).it?.s) ?? 360;
    const s = fromInput(f.s.value, true), en = f.e.value ? fromInput(f.e.value, true) : "";
    const o = {t:f.t.value.trim(), s, e:en, k:f.k.value, sub:f.sub.value.trim(), m:f.m.value.split("\n").map(x => x.trim()).filter(Boolean)};
    if (!o.t){ toast("اكتب الاسم"); return; }
    if (s && toMin(s) < firstS && toMin(s) < 4 * 60) o.s = hhmm(toMin(s) + 1440);
    if (itemEdit.id){ const it = d.tl.find(x => x.id === itemEdit.id); Object.assign(it, o); if (!s) it.free = it.free || ""; }
    else d.tl.push(Object.assign({id:"t" + uid(), free:"", r:[]}, o));
    planChanged(); closeSheet(); renderMyPlan(); toast("اتحفظ"); return;
  }
  if (f.id === "exForm"){
    e.preventDefault();
    const d = dayOf(exEdit.day), list = d[exEdit.list], name = f.n.value.trim(); if (!name){ toast("اكتب اسم التمرين"); return; }
    const base = exEdit.i === "new" ? (exerciseLibrary()[name] ? ex(name) : {n:name}) : list[+exEdit.i];
    const o = Object.assign({}, base, {n:name, c:f.c.value.trim()});
    if (exEdit.list === "abs"){ o.sets = f.sets.value.trim() || "3×12"; delete o.k; }
    else { o.k = f.k.value; o.reps = f.reps.value.trim(); o.rest = f.rest.value.trim(); const st = f.sets.value.trim(); if (st) o.sets = isNaN(+st) ? st : +st; else delete o.sets; }
    if (exEdit.i === "new") list.push(o); else list[+exEdit.i] = o;
    planChanged(); closeSheet(); renderMyPlan(); toast("اتحفظ"); return;
  }
});

/* hide what the user turned off */
function applyModules(){
  const on = state.profile.modules;
  document.querySelectorAll(".tabbtn").forEach(b => { const g = b.dataset.tab; b.hidden = (g === "plan" && !on.plan) || (g === "health" && !on.health) || (g === "money" && !on.money); });
  const vis = document.querySelectorAll(".tabbtn:not([hidden])").length;
  document.querySelector(".tabbar-in").style.gridTemplateColumns = `repeat(${vis},1fr)`;
  GROUPS_NAV.me.p = (on.quran ? ["quran"] : []).concat(["myplan","ref","settings"]);
}

/* المرجع: your daily targets */
function renderTargets(){
  const T = state.plan.targets, rows = [["kcal","سعر"],["protein","بروتين (جم)"],["water","مية (لتر)"],["steps","خطوة"],["sleep","نوم (ساعات)"],["quran","قرآن"]].filter(([k]) => T[k]);
  $("targetsCard").innerHTML = `<div class="card-h"><h2>أهدافك كل يوم</h2><button type="button" class="golink" data-go="myplan">عدّل ←</button></div>
    ${rows.length ? `<div class="targets">${rows.map(([k, l]) => `<div class="cell"><div class="v">${esc(T[k])}</div><div class="l">${l}</div></div>`).join("")}</div>` : `<p class="small" style="margin:0">حط أهدافك من أنا ← خطتي.</p>`}`;
}
