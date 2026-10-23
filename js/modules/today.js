"use strict";
/* ===================== TODAY: shared day helpers + the Today screen ===================== */
const curDay = () => DAYS.find(x=>x.id===current);
const curDate = () => iso(dateOf(current));
const checksOf = date => state.checks[date] || {};
const isToday = () => curDate() === iso(today);

function countItems(day){
  let n = HABITS.length + PRAYERS.length + day.tl.length;
  if (day.wu) n += Array.isArray(day.wu) ? day.wu.length : 1;
  n += day.ex.length + (day.ex.length && day.tread ? 1 : 0);
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

/* ---------- times: items keep "HH:MM" (24-hour; 25:15 = 1:15 after midnight) ---------- */
const toMin = s => { const m = String(s||"").match(/^(\d{1,2}):(\d{2})$/); return m ? +m[1] * 60 + +m[2] : null; };
const t12 = m => { const h = Math.floor(m / 60) % 24; return `${(h % 12) || 12}:${pad(m % 60)}`; };
function timeText(it){
  const s = toMin(it.s), e = toMin(it.e);
  if (s == null) return it.free || "";
  return e != null ? `${t12(s)}–${t12(e)}` : t12(s);
}
/* the day's items in time order (untimed ones first) with minutes since midnight */
function timed(day){
  return day.tl.map((it, n) => {
    const s = toMin(it.s); let e = toMin(it.e);
    if (s != null && e != null && e <= s) e += 1440;
    return {i:it.id, s, e, n, it};
  }).sort((x, y) => (x.s == null ? -1 : x.s) - (y.s == null ? -1 : y.s) || x.n - y.n);
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
  const next = T.find(x => x.s != null && x.s > now && !c[x.i]);
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

/* ===================== TODAY =====================
   A quick look: where you are now and what's next, what needs attention, then cards you can reorder, hide or fold. */
const minsWord = m => m < 60 ? `${m} دقيقة` : (m % 60 ? `${Math.floor(m/60)} س و${m % 60} د` : `${m/60} ساعة`);
function heroHTML(){
  const day = curDay(), date = curDate();
  const total = countItems(day), done = Math.min(total, doneCount(day, date));
  const pct = Math.round(done / total * 100), circ = 2 * Math.PI * 32;
  let lines = "";
  if (isToday()){
    const {cur, next} = nowNext(day), d = new Date(), now = d.getHours()*60 + d.getMinutes();
    if (cur) lines += `<div class="nowline"><span class="k">دلوقتي</span><span class="v">${esc(cur.it.t)}</span><span class="t">${esc(timeText(cur.it))}</span></div>`;
    if (next) lines += `<div class="nowline"><span class="k">الجاي</span><span class="v">${esc(next.it.t)}</span><span class="t">${t12(next.s)}</span><span class="in">بعد ${minsWord(next.s - now)}</span></div>`;
    if (!cur && !next) lines += `<div class="nowline"><span class="v">خلّصت جدول النهارده</span></div>`;
    const np = nextPrayer();
    if (np) lines += `<div class="nowline"><span class="k">الصلاة</span><span class="v">${np.name}</span><span class="t">${clock(np.at)}</span><span class="in">بعد ${minsWord(Math.max(1, Math.round((np.at - d) / 60000)))}</span></div>`;
  } else {
    lines += `<div class="nowline"><span class="v">${WEEKDAYS[ORDER.indexOf(day.id)]} ${short(dateOf(current))}</span></div>`;
  }
  return `<div class="card hero hero-today" id="hero">
    <div class="ring" aria-label="خلّصت ${done} من ${total}"><svg viewBox="0 0 76 76"><circle cx="38" cy="38" r="32" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="7"/><circle cx="38" cy="38" r="32" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ*(1-pct/100)}"/></svg><span class="rv">${pct}%</span></div>
    <div class="hero-txt"><div class="hero-date">${hijri(dateOf(current))}</div><div class="hero-badge">${esc(day.badge)}</div>${lines}</div></div>`;
}

const hijri = d => { try { return new Intl.DateTimeFormat("ar-EG-u-ca-islamic-umalqura-nu-latn", {day:"numeric", month:"long", year:"numeric"}).format(d); } catch(e){ return ""; } };

/* things that need you now; the card only shows when there is something */
function attentionHTML(){
  if (!isToday()) return "";
  const rows = [], on = state.profile.modules;
  const dp = duePrayer();
  if (dp) rows.push(`<div class="att"><span class="att-ic" style="color:var(--gold)">${ICO.moon}</span><span><b>صليت ${dp.name}؟</b><small>الأذان كان ${clock(dp.at)}</small></span>
    <span class="actrow"><button type="button" class="btn sm soft" data-prdue="${dp.n}">صليت</button><button type="button" class="btn sm" data-prdue="${dp.n}" data-mosque="1">في المسجد ★</button></span></div>`);
  if (!state.profile.loc && !state.prefs.noLoc)
    rows.push(`<div class="att"><span class="att-ic" style="color:var(--gold)">${ICO.clock}</span><span><b>حدد مدينتك</b><small>عشان مواقيت الصلاة تظهر هنا</small></span>
    <span class="actrow"><button type="button" class="btn sm primary" data-locsheet>حدد</button><button type="button" class="btn sm ghost" data-noloc>بعدين</button></span></div>`);
  if (on.plan) activeRem().filter(r => daysTo(r.due) <= 1).forEach(r => {
    const w = whenText(r);
    rows.push(`<button type="button" class="att" data-go="rem"><span class="att-ic" style="color:var(--rem)">${ICO.bell}</span><span><b>${esc(r.title)}</b><small>${w.dl}</small></span><span class="rwhen ${w.c}">${w.t}</span></button>`);
  });
  const t0 = today.getTime(), mk = monthKey(today), d = monthData(mk);
  const spentToday = money.entries.filter(e => e.type !== "in" && e.ts >= t0 && e.ts < t0 + 864e5).reduce((a,e) => a + e.amount, 0);
  const pastDays = new Date().getDate() - 1, before = d.spent - spentToday, avg = pastDays > 0 ? before / pastDays : 0;
  if (on.money && avg > 0 && spentToday > avg * 1.5 && spentToday - avg > 100)
    rows.push(`<button type="button" class="att" data-go="money"><span class="att-ic" style="color:var(--spend)">${ICO.wallet}</span><span><b>صرفت النهارده ${mfmt(spentToday)}</b><small>متوسطك في اليوم الشهر ده ${mfmt(avg)}</small></span>${CHEV.replace('class="chev"','class="chev att-go"')}</button>`);
  if (backupDue())
    rows.push(`<div class="att"><span class="att-ic" style="color:var(--accent)">${ICO.list}</span><span><b>خد نسخة احتياطية</b><small>${meta.lastBackup ? "آخر نسخة من أكتر من أسبوعين" : "لسه ماخدتش ولا نسخة"}</small></span><button class="btn sm primary" type="button" data-backup="export">احفظ</button></div>`);
  if (!rows.length) return "";
  return `<section class="card attn"><div class="card-h"><h2>محتاج انتباهك</h2><span class="small num">${rows.length}</span></div>${rows.join("")}</section>`;
}

/* end of the day (from 8 pm) or a past day: what got done */
function summaryHTML(){
  const date = curDate(), past = date < iso(today);
  if (!past && !(isToday() && new Date().getHours() >= 20)) return "";
  const day = curDay(), c = checksOf(date), todos = tasksDoneOn(date);
  const ids = trainIds(day), trained = ids.filter(id => c[id]).length;
  const t0 = new Date(date+"T00:00").getTime();
  const spent = money.entries.filter(e => e.type !== "in" && e.ts >= t0 && e.ts < t0 + 864e5).reduce((a,e) => a + e.amount, 0);
  const cell = (v, l) => `<div class="cell"><div class="v num">${v}</div><div class="l">${l}</div></div>`;
  return `<section class="card"><div class="card-h"><h2>${past ? `ملخص ${dayLabel(date)}` : "ملخص يومك"}</h2>${ICO.moon.replace("<svg",'<svg class="sum-ic"')}</div>
    <div class="cells">${cell(`${PRAYERS.filter(([id]) => c[id]).length}/5`, "صلاة")}${cell(`${HABITS.filter(([id]) => c[id]).length}/${HABITS.length}`, "عادات")}
    ${cell(todos.all ? `${todos.done}/${todos.all}` : "—", "مهام")}${ids.length ? cell(`${trained}/${ids.length}`, "تمرين") : cell("راحة", "تمرين")}
    ${cell(mfmt(spent), "صرفت")}${cell(state.body.w[date] != null ? state.body.w[date] : "—", "الوزن")}</div></section>`;
}

/* prayers + habits + morning weight in one card */
function routineCard(){
  const date = curDate(), c = checksOf(date), wv = (state.body.w||{})[date];
  const body = `<div class="prayers">${PRAYERS.map(([id,t])=>`<button type="button" class="pr" data-pr="${id.slice(1)}"><span>${t}</span><span class="st"></span></button>`).join("")}</div>
    <div class="legend"><span>دوسة: صليت · دوستين: في المسجد <b>★</b></span><span id="mWeek"></span></div>
    <div class="weighrow"><label for="wIn">وزنك الصبح</label><input class="field" id="wIn" inputmode="decimal" placeholder="كجم" value="${wv!=null?esc(wv):""}"><span class="small">كجم</span></div>
    <div class="chips">${HABITS.map(([id,t])=>`<label class="hchip" data-row="${id}"><input type="checkbox" data-ck="${id}" id="ck-${id}"><span class="dot"></span><span>${t}</span></label>`).join("")}</div>`;
  return {t:"روتينك", meta:`<span data-cnt="${PRAYERS.concat(HABITS).map(x=>x[0]).join(",")}"></span>`, body};
}

/* the next few things in today's schedule */
function nextCard(){
  const day = curDay(), T = timed(day);
  const c = checksOf(curDate()), d = new Date(), now = d.getHours()*60 + d.getMinutes();
  let list = T.filter(x => !c[x.i]);
  if (isToday()){ const cur = nowNext(day).cur; list = list.filter(x => x.s == null || x.s >= now || (cur && x.i === cur.i)); }
  list = list.slice(0, 3);
  const body = list.length ? `<ol class="tl tl-mini">${list.map(({it}) => schedRow(day, it, false)).join("")}</ol>` : `<p class="small" style="margin:0">مفيش حاجة فاضلة في جدول اليوم.</p>`;
  return {t:"الجاي في جدولك", meta:"", body, link:`<button type="button" class="golink" data-go="sched">الجدول كله ←</button>`};
}

/* one row of the schedule (used here and on the schedule page) */
function schedRow(day, it, full, nowI){
  const t = timeText(it), k = it.k, a = it.t, b = it.sub, m = it.m && it.m.length ? it.m : null, r = it.r, id = it.id;
  let extra = "";
  if (full && m) extra += `<details class="more"><summary>${r&&r.length?"المكونات والوصفة":"المكونات"}</summary>${menuList(m)}${recipeCards(r)}</details>`;
  if (k === "gym" && hasWorkout(day)) extra += `<button type="button" class="golink" data-go="train">افتح التمرين ←</button>`;
  if (full && k === "deen" && /حفظ/.test(a)) extra += `<button type="button" class="golink" data-go="quran">افتح الحفظ ←</button>`;
  if (full && k === "deen" && /ورد/.test(a)) extra += `<button type="button" class="golink" data-go="quran">سجّل الصفحة ←</button>`;
  return `<li data-row="${id}" class="${id===nowI?"now":""}">${box(id)}<span class="t">${esc(t)}</span><div class="body">
    <label for="ck-${id}"><span class="tdot d-${k}"></span><span class="ttl">${esc(a)}</span></label>${b?`<span class="sub">${esc(b)}</span>`:""}${extra}</div></li>`;
}

/* cards on Today: order, hidden and folded ones are remembered (and go into the backup) */
const TODAY_CARDS = {
  tasks:{n:"المهام", f:() => tasksCard()},
  routine:{n:"روتينك: الصلاة والعادات والوزن", f:() => routineCard()},
  next:{n:"الجاي في جدولك", f:() => nextCard()},
  soon:{n:"التذكيرات اللي جاية", f:() => soonCard()},
  money:{n:"الفلوس", f:() => moneyCard()}
};
function todayPrefs(){
  const p = state.prefs.today || (state.prefs.today = {});
  const all = Object.keys(TODAY_CARDS);
  p.order = (p.order || []).filter(k => all.includes(k)).concat(all.filter(k => !(p.order || []).includes(k)));
  p.hidden = p.hidden || []; p.folded = p.folded || [];
  return p;
}
function cardHTML(key){
  const x = TODAY_CARDS[key].f(); if (!x) return "";
  const p = todayPrefs(), folded = p.folded.includes(key);
  return `<section class="card tcard${folded ? " folded" : ""}" data-card="${key}">
    <div class="card-h"><button type="button" class="tc-h" data-fold="${key}" aria-expanded="${!folded}"><h2>${x.t}</h2>${CHEV}</button><span class="small num">${x.meta || ""}</span></div>
    <div class="tc-b">${x.body}${x.link ? `<div class="tc-link">${x.link}</div>` : ""}</div></section>`;
}
function renderToday(){
  const p = todayPrefs();
  let h = heroHTML() + attentionHTML() + summaryHTML();
  const on = state.profile.modules, need = {tasks:"plan", next:"plan", soon:"plan", money:"money"};
  p.order.forEach(k => { if (!p.hidden.includes(k) && (!need[k] || on[need[k]])) h += cardHTML(k); });
  h += `<button type="button" class="btn ghost" data-arrange style="align-self:center">${ICO.sliders} رتّب الشاشة</button>`;
  $("scr-today").innerHTML = h;
  refreshMarks();
}
function openArrange(){
  const p = todayPrefs();
  openSheet(`<h2 class="sheet-t">رتّب شاشة النهارده</h2><p class="small" style="margin:-6px 0 0">غيّر ترتيب الكروت، وخبّي اللي مش محتاجه.</p>
    <ul class="arr">${p.order.map((k, i) => { const hid = p.hidden.includes(k); return `<li class="${hid ? "off" : ""}"><span>${TODAY_CARDS[k].n}</span>
      <button type="button" class="iconbtn" data-arr="up" data-k="${k}" aria-label="لفوق" ${i === 0 ? "disabled" : ""}>${ICO.up}</button>
      <button type="button" class="iconbtn" data-arr="down" data-k="${k}" aria-label="لتحت" ${i === p.order.length - 1 ? "disabled" : ""}>${ICO.down}</button>
      <button type="button" class="iconbtn" data-arr="eye" data-k="${k}" aria-label="${hid ? "اظهر" : "اخفي"}" aria-pressed="${!hid}">${hid ? ICO.eyeOff : ICO.eye}</button></li>`; }).join("")}</ul>
    <button type="button" class="btn ghost" data-arr="reset">رجّع الترتيب الأصلي</button>`, "رتّب الشاشة");
}
document.addEventListener("click", e => {
  const f = e.target.closest("[data-fold]");
  if (f){ const p = todayPrefs(), k = f.dataset.fold; p.folded = p.folded.includes(k) ? p.folded.filter(x => x !== k) : p.folded.concat(k);
    save(); const card = f.closest(".tcard"); card.classList.toggle("folded"); f.setAttribute("aria-expanded", !p.folded.includes(k)); return; }
  if (e.target.closest("[data-arrange]")){ openArrange(); return; }
  if (e.target.closest("[data-noloc]")){ state.prefs.noLoc = true; save(); renderScreen(); return; }
  const a = e.target.closest("[data-arr]"); if (!a) return;
  const p = todayPrefs(), k = a.dataset.k, i = p.order.indexOf(k);
  if (a.dataset.arr === "up" && i > 0) [p.order[i-1], p.order[i]] = [p.order[i], p.order[i-1]];
  else if (a.dataset.arr === "down" && i < p.order.length - 1) [p.order[i+1], p.order[i]] = [p.order[i], p.order[i+1]];
  else if (a.dataset.arr === "eye") p.hidden = p.hidden.includes(k) ? p.hidden.filter(x => x !== k) : p.hidden.concat(k);
  else if (a.dataset.arr === "reset") state.prefs.today = {};
  save(); renderScreen(); openArrange();
});

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
    const pt = prayerTimes(new Date(curDate() + "T12:00"));
    b.querySelector(".st").textContent = m ? "★ المسجد" : p ? "✓ صليت" : (pt ? clock(pt["p"+n]) : "—");
    b.setAttribute("aria-pressed", p ? "true" : "false");
  });
  const mw = $("mWeek");
  if (mw) mw.textContent = `المسجد الأسبوع ده: ${ORDER.reduce((s,id)=>s+mosqueCount(iso(dateOf(id))),0)} من 35`;
  const hero = document.getElementById("hero"); if (hero) hero.outerHTML = heroHTML();
  const tb = document.getElementById("trBar");
  if (tb){ const ids = trainIds(curDay()); tb.style.width = Math.round(ids.filter(id=>c[id]).length/ids.length*100) + "%"; }
}

/* ---------- today events: checkboxes, prayers, morning weight ---------- */
document.addEventListener("change", e => {
  const id = e.target.dataset && e.target.dataset.ck; if (!id) return;
  const date = curDate(), c = Object.assign({}, checksOf(date));
  if (e.target.checked) c[id] = true; else delete c[id];
  state.checks[date] = c; if (e.target.checked) buzz(); save(); refreshMarks();
  if (e.target.checked && screen === "train" && e.target.closest("details.exc")) advanceFrom(id);
});
document.addEventListener("click", e => {
  const pr = e.target.closest(".pr"); if (!pr) return;
  const date = curDate(), c = Object.assign({}, checksOf(date)), n = pr.dataset.pr;
  if (!c["p"+n]) c["p"+n] = true;
  else if (!c["m"+n]) c["m"+n] = true;
  else { delete c["p"+n]; delete c["m"+n]; }
  buzz(); state.checks[date] = c; save(); refreshMarks();
});
document.addEventListener("input", e => {
  if (e.target.id !== "wIn") return;
  const date = curDate(), v = parseNum(e.target.value), w = Object.assign({}, state.body.w);
  if (v == null) delete w[date]; else w[date] = v;
  state.body.w = w;
  if (v != null){ const c = Object.assign({}, checksOf(date)); c.h1 = true; state.checks[date] = c; }
  save(); refreshMarks();
});
