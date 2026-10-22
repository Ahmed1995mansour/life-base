"use strict";
/* ===================== TODAY: where you are in the day, habits, prayers and the schedule ===================== */
const curDay = () => DAYS.find(x=>x.id===current);
const curDate = () => iso(dateOf(current));
const checksOf = date => state.checks[date] || {};
const isToday = () => curDate() === iso(today);

function countItems(day){
  let n = HABITS.length + PRAYERS.length + day.tl.length;
  if (day.wu) n += Array.isArray(day.wu) ? day.wu.length : 1;
  n += day.ex.length + (day.ex.length && day.id!=="thu" ? 1 : 0);
  n += day.abs.length;
  (day.routines||[]).forEach(r=>{ n += r.items.length; });
  if (day.cd) n++;
  return n;
}
function doneCount(day, date){
  const c = state.checks[date || iso(dateOf(day.id))] || {};
  return Object.keys(c).filter(k=>c[k] && !/^m\d$/.test(k)).length;
}
function mosqueCount(date){
  const c = state.checks[date] || {};
  return Object.keys(c).filter(k=>c[k] && /^m\d$/.test(k)).length;
}

/* ---------- times: "5:50–7:10" in a 12-hour day → minutes since midnight, in order ---------- */
const toMin = s => { const m = String(s).match(/(\d{1,2}):(\d{2})/); return m ? (+m[1] % 12) * 60 + +m[2] : null; };
function timed(day){
  let last = -1;
  return day.tl.map((it, i) => {
    const parts = String(it[0]).split("–");
    let s = toMin(parts[0]), e = parts[1] != null ? toMin(parts[1]) : null;
    if (s != null){
      while (s < last - 45) s += 720;
      last = s;
      if (e != null){ e += Math.floor(s / 720) * 720; while (e <= s) e += 720; }
    }
    const g = s == null || s < 720 ? 0 : s < 1020 ? 1 : 2;
    return {i, s, e, g, it};
  });
}
function nowNext(day){
  const T = timed(day), c = checksOf(curDate());
  const d = new Date(), now = d.getHours()*60 + d.getMinutes();
  let cur = null;
  T.forEach((x, k) => {
    if (x.s == null || x.s > now) return;
    const nextS = (T.slice(k+1).find(y => y.s != null) || {}).s;
    const end = x.e != null ? x.e : Math.min(x.s + 30, nextS != null ? nextS : x.s + 30);
    if (now < end && (!cur || x.s >= cur.s)) cur = x;
  });
  const next = T.find(x => x.s != null && x.s > now && !c["t"+x.i]);
  return {cur, next};
}

/* ---------- small builders ---------- */
const box = id => `<input type="checkbox" class="ck" data-ck="${id}" id="ck-${id}">`;
function menuList(m){ return `<ul class="menu">${m.map(x=>`<li>${esc(BREAD[x]||x)}</li>`).join("")}</ul>`; }
function recipeCards(keys){
  return (keys||[]).map(k=>RECIPES[k]).filter(Boolean).map(r=>
    `<div class="rc"><div class="rc-h"><b>${r.t}</b><span>${r.time}</span></div><ol>${r.steps.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>${r.tip?`<p class="rc-tip">${esc(r.tip)}</p>`:""}</div>`).join("");
}
const hasWorkout = day => day.ex.length || (day.routines||[]).length || day.wu || day.cd;

/* ===================== TODAY ===================== */
function heroHTML(){
  const day = curDay(), date = curDate();
  const total = countItems(day), done = Math.min(total, doneCount(day, date));
  const pct = Math.round(done / total * 100), circ = 2 * Math.PI * 32;
  let lines = "";
  if (isToday()){
    const {cur, next} = nowNext(day);
    if (cur) lines += `<div class="nowline"><span class="k">دلوقتي</span><span class="v">${esc(cur.it[2])}</span><span class="t">${esc(cur.it[0])}</span></div>`;
    if (next) lines += `<div class="nowline"><span class="k">الجاي</span><span class="v">${esc(next.it[2])}</span><span class="t">${esc(next.it[0])}</span></div>`;
    if (!cur && !next) lines += `<div class="nowline"><span class="v">خلّصت جدول النهارده</span></div>`;
  } else {
    lines += `<div class="nowline"><span class="v">${esc(day.d)} ${short(dateOf(current))}</span></div>`;
  }
  return `<div class="card hero hero-today" id="hero">
    <div class="ring" aria-label="خلّصت ${done} من ${total}"><svg viewBox="0 0 76 76"><circle cx="38" cy="38" r="32" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="7"/><circle cx="38" cy="38" r="32" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ*(1-pct/100)}"/></svg><span class="rv">${pct}%</span></div>
    <div class="hero-txt"><div class="hero-badge">${esc(day.badge)}</div>${lines}</div>
    <p class="hero-note">${esc(day.note)}</p></div>`;
}

function renderToday(){
  const day = curDay(), date = curDate(), c = checksOf(date);
  let h = heroHTML() + backupHTML() + soonHTML() + todoHTML() + moneyHTML();
  const wv = (state.body.w||{})[date];
  h += `<div class="card"><div class="card-h"><h2>عادات اليوم</h2><span class="small" data-cnt="${HABITS.map(x=>x[0]).join(",")}"></span></div>
    <div class="weighrow"><label for="wIn">وزنك الصبح</label><input class="field" id="wIn" inputmode="decimal" placeholder="كجم" value="${wv!=null?esc(wv):""}"><span class="small">كجم</span></div>
    <div class="chips">${HABITS.map(([id,t])=>`<label class="hchip" data-row="${id}"><input type="checkbox" data-ck="${id}" id="ck-${id}"><span class="dot"></span><span>${t}</span></label>`).join("")}</div></div>`;
  h += `<div class="card"><div class="card-h"><h2>الصلاة</h2><span class="small" id="mDay"></span></div>
    <div class="prayers">${PRAYERS.map(([id,t])=>`<button type="button" class="pr" data-pr="${id.slice(1)}"><span>${t}</span><span class="st"></span></button>`).join("")}</div>
    <div class="legend"><span>دوسة: صليت · دوستين: في المسجد <b>★</b></span><span id="mWeek"></span></div></div>`;

  // one schedule for the whole day, in time order
  const T = timed(day).slice().sort((x, y) => (x.s == null ? -1 : x.s) - (y.s == null ? -1 : y.s) || x.i - y.i);
  const nowI = isToday() ? (nowNext(day).cur || {}).i : -1;
  h += `<div class="card sched"><div class="card-h"><h2>جدول اليوم</h2><span class="small" data-cnt="${T.map(x=>"t"+x.i).join(",")}"></span></div><ol class="tl">${
    T.map(({i, it}) => {
      const [t,k,a,b,m,r] = it, id = "t"+i;
      let extra = "";
      if (m) extra += `<details class="more"><summary>${r&&r.length?"المكونات والوصفة":"المكونات"}</summary>${menuList(m)}${recipeCards(r)}</details>`;
      if (k === "gym" && hasWorkout(day)) extra += `<button type="button" class="golink" data-go="train">افتح التمرين ←</button>`;
      if (k === "deen" && /حفظ/.test(a)) extra += `<button type="button" class="golink" data-go="progress" data-seg="quran">افتح الحفظ ←</button>`;
      if (k === "deen" && /ورد/.test(a)) extra += `<button type="button" class="golink" data-go="progress" data-seg="quran">سجّل الصفحة ←</button>`;
      return `<li data-row="${id}" class="${i===nowI?"now":""}">${box(id)}<span class="t">${esc(t)}</span><div class="body">
        <label for="ck-${id}"><span class="tdot d-${k}"></span><span class="ttl">${esc(a)}</span></label>${b?`<span class="sub">${esc(b)}</span>`:""}${extra}</div></li>`;
    }).join("")}</ol></div>`;
  document.getElementById("scr-today").innerHTML = h;
  refreshMarks();
}

function refreshMarks(){
  const date = curDate(), c = checksOf(date);
  document.querySelectorAll("main [data-ck]").forEach(el => {
    const on = !!c[el.dataset.ck]; el.checked = on;
    const row = el.closest("[data-row]"); if (row){ row.classList.toggle("is-done", on); if (row.classList.contains("hchip")) row.classList.toggle("on", on); }
  });
  document.querySelectorAll("main [data-cnt]").forEach(el => {
    const ids = el.dataset.cnt.split(","); el.textContent = `${ids.filter(id=>c[id]).length}/${ids.length}`;
  });
  document.querySelectorAll(".pr").forEach(b => {
    const n = b.dataset.pr, p = !!c["p"+n], m = !!c["m"+n];
    b.classList.toggle("done", p && !m); b.classList.toggle("mosque", m);
    b.querySelector(".st").textContent = m ? "★ المسجد" : p ? "✓ صليت" : "—";
    b.setAttribute("aria-pressed", p ? "true" : "false");
  });
  const md = document.getElementById("mDay"), mw = document.getElementById("mWeek");
  if (md){ md.textContent = `${PRAYERS.filter(([id])=>c[id]).length}/5`; mw.textContent = `المسجد الأسبوع ده: ${ORDER.reduce((s,id)=>s+mosqueCount(iso(dateOf(id))),0)} من 35`; }
  const hero = document.getElementById("hero"); if (hero) hero.outerHTML = heroHTML();
  const tb = document.getElementById("trBar");
  if (tb){ const ids = trainIds(curDay()); tb.style.width = Math.round(ids.filter(id=>c[id]).length/ids.length*100) + "%"; }
}

/* ---------- today events: checkboxes, prayers, morning weight ---------- */
document.addEventListener("change", e => {
  const id = e.target.dataset && e.target.dataset.ck; if (!id) return;
  const date = curDate(), c = Object.assign({}, checksOf(date));
  if (e.target.checked) c[id] = true; else delete c[id];
  state.checks[date] = c; save(); refreshMarks();
  if (e.target.checked && screen === "train" && e.target.closest("details.exc")) advanceFrom(id);
});
document.addEventListener("click", e => {
  const pr = e.target.closest(".pr"); if (!pr) return;
  const date = curDate(), c = Object.assign({}, checksOf(date)), n = pr.dataset.pr;
  if (!c["p"+n]) c["p"+n] = true;
  else if (!c["m"+n]) c["m"+n] = true;
  else { delete c["p"+n]; delete c["m"+n]; }
  state.checks[date] = c; save(); refreshMarks();
});
document.addEventListener("input", e => {
  if (e.target.id !== "wIn") return;
  const date = curDate(), v = parseNum(e.target.value), w = Object.assign({}, state.body.w);
  if (v == null) delete w[date]; else w[date] = v;
  state.body.w = w;
  if (v != null){ const c = Object.assign({}, checksOf(date)); c.h1 = true; state.checks[date] = c; }
  save(); refreshMarks();
});
