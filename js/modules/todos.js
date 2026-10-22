"use strict";
/* ===================== TASKS: per-day to-dos. Unfinished ones from past days move to today.
   Swipe a task right to finish it, left to delete it (with undo). ===================== */
const DAYNAME = id => (DAYS.find(d=>d.id===id)||{}).d || "";
function dayLabel(dateStr){
  const d = new Date(dateStr+"T00:00");
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return "النهارده";
  if (diff === -1) return "امبارح";
  if (diff === 1) return "بكرة";
  return `${DAYNAME(ORDER[d.getDay()])} ${short(d)}`;
}
function rollover(){
  const t = iso(today); let carried = [];
  Object.keys(state.todos).sort().forEach(d => {
    if (d >= t) return;
    const list = state.todos[d] || [], keep = [];
    list.forEach(x => { if (x.done) keep.push(x); else carried.push(Object.assign({}, x, {from: x.from || d})); });
    if (keep.length) state.todos[d] = keep; else delete state.todos[d];
  });
  if (carried.length){ state.todos[t] = carried.concat(state.todos[t] || []); save(); }
}
const tomorrowIso = () => { const d = new Date(today); d.setDate(d.getDate()+1); return iso(d); };
function addTodo(date, text){
  state.todos[date] = (state.todos[date] || []).concat({id:uid(), text, done:false});
  save();
}

function todoRow(x, date){
  const key = `${date}|${x.id}`;
  return `<li class="td${x.done?" is-done":""}" data-swipe="${key}">
    <input type="checkbox" class="ck" data-todo="${key}" id="td-${x.id}" ${x.done?"checked":""}>
    <label for="td-${x.id}"><span class="ttl">${esc(x.text)}</span>${x.from?`<span class="sub">مترحّلة من ${esc(dayLabel(x.from))}</span>`:""}</label>
    <button type="button" class="tdx" data-deltodo="${key}" aria-label="امسح المهمة: ${esc(x.text)}">${XICON}</button></li>`;
}
const todoList = (date, list) => `<ul class="tdl">${list.map(x => todoRow(x, date)).join("")}</ul>`;
const todoForm = (date, ph) => `<form class="tdform" data-todoform="${date}" autocomplete="off"><input class="input" maxlength="140" placeholder="${esc(ph)}" aria-label="مهمة جديدة"><button class="btn primary" type="submit">ضيف</button></form>`;

/* Today card */
function tasksCard(){
  const date = curDate(), list = state.todos[date] || [], done = list.filter(x=>x.done).length, past = date < iso(today);
  const body = (list.length ? todoList(date, list) : `<p class="small" style="margin:0 0 10px">${past ? "مفيش مهام متسجلة لليوم ده." : "مفيش مهام لسه. اكتب أول مهمة تحت."}</p>`)
    + (past ? `<p class="small" style="margin:8px 0 0">المهام اللي مخلصتش بتترحّل للنهارده لوحدها.</p>` : todoForm(date, isToday() ? "ضيف مهمة للنهارده" : "ضيف مهمة لـ" + dayLabel(date)));
  return {t: isToday() ? "مهام النهارده" : `مهام ${dayLabel(date)}`, meta: list.length ? `${done}/${list.length}` : "", body, link:`<button type="button" class="golink" data-go="tasks">كل المهام ←</button>`};
}

/* Tasks page: today, tomorrow, and later days */
function renderTasks(){
  const t = iso(today), tm = tomorrowIso();
  const later = Object.keys(state.todos).filter(d => d > tm && (state.todos[d]||[]).length).sort();
  const sec = (date, title, ph) => {
    const list = state.todos[date] || [], done = list.filter(x=>x.done).length;
    return `<section class="card"><div class="card-h"><h2>${title}</h2><span class="small">${list.length ? `${done}/${list.length}` : ""}</span></div>
      ${list.length ? todoList(date, list) : ""}${ph ? todoForm(date, ph) : ""}</section>`;
  };
  let h = `<div class="actrow" style="justify-content:space-between"><p class="small" style="margin:0">اسحب المهمة يمين تخلص، وشمال تتمسح.</p><button type="button" class="btn sm soft" data-todonew>+ مهمة ليوم تاني</button></div>`;
  h += sec(t, "النهارده", "ضيف مهمة للنهارده") + sec(tm, "بكرة", "ضيف مهمة لبكرة");
  later.forEach(d => { h += sec(d, dayLabel(d), ""); });
  $("scr-tasks").innerHTML = h;
}

/* Sheet: a task for any day */
function openTodoSheet(date){
  const t = iso(today), tm = tomorrowIso(); date = date || t;
  openSheet(`<h2 class="sheet-t">مهمة جديدة</h2>
    <form id="todoSheet" class="form" autocomplete="off">
      <input class="input" id="tsText" maxlength="140" placeholder="محتاج تعمل إيه؟" aria-label="المهمة">
      <div class="chips" role="group" aria-label="إمتى">
        <button type="button" class="chip" data-tsday="${t}" aria-pressed="${date===t}">النهارده</button>
        <button type="button" class="chip" data-tsday="${tm}" aria-pressed="${date===tm}">بكرة</button>
        <label class="chip"><input type="date" id="tsDate" value="${date}" min="${t}" aria-label="يوم تاني" style="border:0;background:transparent;font:inherit;color:inherit;padding:0"></label>
      </div>
      <button class="btn primary lg">ضيف المهمة</button></form>`, "مهمة جديدة");
  setTimeout(() => $("tsText").focus(), 80);
}
document.addEventListener("click", e => {
  const d = e.target.closest("[data-tsday]");
  if (d){ $("tsDate").value = d.dataset.tsday; document.querySelectorAll("[data-tsday]").forEach(b => b.setAttribute("aria-pressed", b === d)); return; }
  if (e.target.closest("[data-todonew]")){ openTodoSheet(tomorrowIso()); return; }
  const b = e.target.closest("[data-deltodo]"); if (b) deleteTodo(b.dataset.deltodo);
});
document.addEventListener("change", e => {
  if (e.target.id === "tsDate") document.querySelectorAll("[data-tsday]").forEach(b => b.setAttribute("aria-pressed", b.dataset.tsday === e.target.value));
  const key = e.target.dataset && e.target.dataset.todo; if (!key) return;
  setTodoDone(key, e.target.checked);
});
document.addEventListener("submit", e => {
  const f = e.target;
  if (f.dataset.todoform){
    e.preventDefault();
    const inp = f.querySelector("input"), text = inp.value.trim(); if (!text) return;
    const date = f.dataset.todoform;
    addTodo(date, text); renderScreen();
    const again = document.querySelector(`[data-todoform="${date}"] input`); if (again) again.focus();
  } else if (f.id === "todoSheet"){
    e.preventDefault();
    const text = $("tsText").value.trim(), date = $("tsDate").value || iso(today);
    if (!text){ toast("اكتب المهمة الأول"); return; }
    addTodo(date < iso(today) ? iso(today) : date, text); closeSheet(); renderScreen();
    toast(`اتضافت لـ${dayLabel(date)}`);
  }
});

function findTodo(key){ const [date, id] = key.split("|"); return {date, id, x:(state.todos[date]||[]).find(t => t.id === id)}; }
function setTodoDone(key, on){
  const {x} = findTodo(key); if (!x) return;
  x.done = on; if (on) buzz(); save(); renderScreen();
}
function deleteTodo(key){
  const {date, id, x} = findTodo(key); if (!x) return;
  const list = state.todos[date], at = list.indexOf(x);
  state.todos[date] = list.filter(t => t.id !== id);
  if (!state.todos[date].length) delete state.todos[date];
  save(); renderScreen();
  toast("المهمة اتمسحت", "تراجع", () => { const l = state.todos[date] || []; l.splice(at, 0, x); state.todos[date] = l; save(); renderScreen(); });
}

/* ---------- swipe a task: right = done, left = delete ---------- */
let swp = null, swallowClick = false;
document.addEventListener("pointerdown", e => {
  const row = e.target.closest(".td[data-swipe]");
  if (!row || e.target.closest("button,input,a") || e.button > 0) return;
  swp = {row, x:e.clientX, y:e.clientY, dx:0, on:false};
});
document.addEventListener("pointermove", e => {
  if (!swp) return;
  const dx = e.clientX - swp.x, dy = e.clientY - swp.y;
  if (!swp.on){
    if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)){ swp = null; return; }
    if (Math.abs(dx) < 12) return;
    swp.on = true; swp.row.classList.add("swiping");
  }
  swp.dx = dx;
  swp.row.style.transform = `translateX(${dx}px)`;
  swp.row.classList.toggle("sw-done", dx > 40);
  swp.row.classList.toggle("sw-del", dx < -40);
});
function endSwipe(){
  if (!swp) return;
  const {row, dx, on} = swp; swp = null;
  if (!on) return;
  swallowClick = true; setTimeout(() => swallowClick = false, 50);
  row.classList.remove("swiping");
  const key = row.dataset.swipe;
  if (dx > 80){ const {x} = findTodo(key); setTodoDone(key, x ? !x.done : true); }
  else if (dx < -80){ deleteTodo(key); }
  else { row.style.transform = ""; row.classList.remove("sw-done","sw-del"); }
}
document.addEventListener("pointerup", endSwipe);
document.addEventListener("pointercancel", endSwipe);
document.addEventListener("click", e => { if (swallowClick){ e.preventDefault(); e.stopPropagation(); } }, true);
