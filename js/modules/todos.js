"use strict";
/* ===================== TASKS: to-dos in lists. A task can have a date or not.
   Today shows: tasks due today, late ones (in red), and starred ones without a date.
   Swipe a task right to finish it, left to delete it (with undo). =====================
   Data: state.tasks = {lists:[{id, name, ts}], items:[{id, text, list, due:"YYYY-MM-DD"|"", star, done, doneAt, ts}]} */
const DAYNAME = id => WEEKDAYS[ORDER.indexOf(id)] || "";
function dayLabel(dateStr){
  const d = new Date(dateStr+"T00:00");
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return "النهارده";
  if (diff === -1) return "امبارح";
  if (diff === 1) return "بكرة";
  return `${DAYNAME(ORDER[d.getDay()])} ${short(d)}`;
}
const tomorrowIso = () => { const d = new Date(today); d.setDate(d.getDate()+1); return iso(d); };
const daysLate = due => Math.round((today - new Date(due + "T00:00")) / 864e5);
const listOf = id => state.tasks.lists.find(l => l.id === id) || state.tasks.lists[0];
let taskView = "all";          // "all" or a list id on the tasks page
let taskEdit = null;           // id of the task in the edit sheet

/* old per-day to-dos → one list "عام"; unfinished ones keep the day they were first planned for */
function normalizeTasks(t, todos){
  if (t && Array.isArray(t.lists) && Array.isArray(t.items)){
    if (!t.lists.length) t.lists.push({id:"gen", name:"عام", ts:0});
    return t;
  }
  const out = {lists:[{id:"gen", name:"عام", ts:0}], items:[]};
  Object.entries(todos || {}).forEach(([date, list]) => (list || []).forEach(x => {
    if (!x || !x.text) return;
    out.items.push({id:x.id || uid(), text:x.text, list:"gen", due:x.from || date, star:false, done:!!x.done,
      doneAt:x.done ? new Date(date + "T12:00").getTime() : 0, ts:new Date((x.from || date) + "T08:00").getTime()});
  }));
  return out;
}

function addTask(o){
  const x = Object.assign({id:uid(), text:"", list:state.tasks.lists[0].id, due:"", star:false, done:false, doneAt:0, ts:Date.now()}, o);
  state.tasks.items.push(x); save(); return x;
}
const byDue = (a, b) => (a.due || "9999") < (b.due || "9999") ? -1 : (a.due || "9999") > (b.due || "9999") ? 1 : a.ts - b.ts;

/* the tasks that belong to a day: due that day; on today also late ones and starred ones without a date */
function tasksForDay(date){
  const t = iso(today), isT = date === t;
  return state.tasks.items.filter(x => {
    if (x.due === date) return true;
    if (!isT) return false;
    const doneToday = x.done && x.doneAt >= today.getTime();
    if (x.due && x.due < t) return !x.done || doneToday;
    if (!x.due && x.star) return !x.done || doneToday;
    return false;
  }).sort((a, b) => (a.done - b.done) || byDue(a, b));
}

function taskRow(x, showList){
  const late = x.due && !x.done && x.due < iso(today);
  const meta = [];
  if (late) meta.push(`<span class="late">متأخرة ${daysLate(x.due) === 1 ? "يوم" : daysLate(x.due) === 2 ? "يومين" : daysLate(x.due) + " أيام"}</span>`);
  else if (x.due && x.due !== iso(today)) meta.push(esc(dayLabel(x.due)));
  if (showList && state.tasks.lists.length > 1) meta.push(esc(listOf(x.list).name));
  return `<li class="td${x.done ? " is-done" : ""}${late ? " is-late" : ""}" data-swipe="${x.id}">
    <input type="checkbox" class="ck" data-todo="${x.id}" id="td-${x.id}" ${x.done ? "checked" : ""} aria-label="خلصت: ${esc(x.text)}">
    <button type="button" class="td-t" data-tedit="${x.id}"><span class="ttl">${esc(x.text)}</span>${meta.length ? `<span class="sub">${meta.join(" · ")}</span>` : ""}</button>
    <button type="button" class="tdx star${x.star ? " on" : ""}" data-tstar="${x.id}" aria-label="${x.star ? "شيل النجمة" : "مهمة"}" aria-pressed="${!!x.star}">${x.star ? "★" : "☆"}</button></li>`;
}
const taskList = (items, showList) => `<ul class="tdl">${items.map(x => taskRow(x, showList)).join("")}</ul>`;
const quickForm = (attrs, ph) => `<form class="tdform" data-taskform ${attrs} autocomplete="off"><input class="input" maxlength="140" placeholder="${esc(ph)}" aria-label="مهمة جديدة"><button class="btn primary" type="submit">ضيف</button></form>`;

/* Today card */
function tasksCard(){
  const date = curDate(), list = tasksForDay(date), done = list.filter(x => x.done).length, past = date < iso(today);
  const body = (list.length ? taskList(list, true) : `<p class="small" style="margin:0 0 10px">${past ? "مفيش مهام كانت لليوم ده." : "مفيش مهام لليوم ده."}</p>`)
    + (past ? "" : quickForm(`data-due="${date}"`, isToday() ? "ضيف مهمة للنهارده" : "ضيف مهمة لـ" + dayLabel(date)));
  return {t: isToday() ? "مهام النهارده" : `مهام ${dayLabel(date)}`, meta: list.length ? `${done}/${list.length}` : "", body, link:`<button type="button" class="golink" data-go="tasks">كل المهام والقوايم ←</button>`};
}
/* for the end-of-day summary */
function tasksDoneOn(date){ const l = state.tasks.items.filter(x => x.due === date); return {done:l.filter(x => x.done).length, all:l.length}; }

/* ---------- tasks page: lists on top, then the tasks grouped by when ---------- */
function renderTasks(){
  const L = state.tasks.lists, t = iso(today), tm = tomorrowIso();
  if (taskView !== "all" && !L.some(l => l.id === taskView)) taskView = "all";
  const inView = state.tasks.items.filter(x => taskView === "all" || x.list === taskView);
  const open = inView.filter(x => !x.done), done = inView.filter(x => x.done).sort((a, b) => b.doneAt - a.doneAt);
  const count = id => state.tasks.items.filter(x => !x.done && (id === "all" || x.list === id)).length;
  let h = `<div class="tlists" role="tablist" aria-label="القوايم">
    <button type="button" class="chip" data-tview="all" aria-pressed="${taskView === "all"}">الكل <span class="num">${count("all")}</span></button>
    ${L.map(l => `<button type="button" class="chip" data-tview="${l.id}" aria-pressed="${taskView === l.id}">${esc(l.name)} <span class="num">${count(l.id)}</span></button>`).join("")}
    <button type="button" class="chip add" data-tlistnew>+ قايمة</button></div>`;
  const cur = taskView === "all" ? null : listOf(taskView);
  h += `<section class="card"><div class="card-h"><h2>${cur ? esc(cur.name) : "كل المهام"}</h2>
      <span class="actrow">${cur ? `<button type="button" class="btn sm ghost" data-tlistedit="${cur.id}">تعديل القايمة</button>` : ""}<button type="button" class="btn sm soft" data-todonew>+ بتاريخ</button></span></div>
    ${quickForm(cur ? `data-list="${cur.id}"` : "", cur ? `ضيف لـ${cur.name}…` : "ضيف مهمة…")}
    <p class="small" style="margin:8px 0 0">من غير تاريخ لو مش مستعجلة. ★ تخليها تظهر في النهارده. اسحب يمين تخلص، وشمال تتمسح.</p></section>`;
  const groups = [
    ["متأخرة", open.filter(x => x.due && x.due < t), "late"],
    ["النهارده", open.filter(x => x.due === t)],
    ["بكرة", open.filter(x => x.due === tm)],
    ["بعدين", open.filter(x => x.due && x.due > tm)],
    ["من غير تاريخ", open.filter(x => !x.due)]
  ];
  let any = false;
  groups.forEach(([title, items, cls]) => {
    if (!items.length) return; any = true;
    items.sort((a, b) => (b.star - a.star) || byDue(a, b));
    h += `<section class="card${cls ? " tgroup-" + cls : ""}"><div class="card-h"><h2>${title}</h2><span class="small num">${items.length}</span></div>${taskList(items, !cur)}</section>`;
  });
  if (!any) h += emptyState("list", cur ? `${cur.name} فاضية` : "مفيش مهام مفتوحة", "اكتب أول مهمة فوق. ولو ليها يوم، دوس \"+ بتاريخ\".");
  if (done.length) h += `<details class="ref"><summary><span>خلصت (${done.length})</span>${CHEV}</summary><div>${taskList(done.slice(0, 50), !cur)}
    <button type="button" class="btn sm danger" data-tclear style="margin-top:10px">امسح اللي خلصت</button></div></details>`;
  $("scr-tasks").innerHTML = h;
}

/* ---------- task sheet: new (with date and list) or edit ---------- */
function openTodoSheet(date, id){
  const x = id ? state.tasks.items.find(o => o.id === id) : null;
  taskEdit = x ? x.id : null;
  const t = iso(today), tm = tomorrowIso();
  const due = x ? x.due : (date === undefined ? (screen === "today" ? t : "") : date);
  const list = x ? x.list : (taskView !== "all" && screen === "tasks" ? taskView : state.tasks.lists[0].id);
  const dchip = (v, label) => `<button type="button" class="chip" data-tsday="${v}" aria-pressed="${due === v}">${label}</button>`;
  openSheet(`<h2 class="sheet-t">${x ? "تعديل المهمة" : "مهمة جديدة"}</h2>
    <form id="todoSheet" class="form" autocomplete="off">
      <input class="input" id="tsText" maxlength="140" placeholder="محتاج تعمل إيه؟" aria-label="المهمة" value="${x ? esc(x.text) : ""}">
      <span class="lbl">القايمة</span>
      <div class="chips" role="group" aria-label="القايمة">${state.tasks.lists.map(l => `<button type="button" class="chip" data-tslist="${l.id}" aria-pressed="${l.id === list}">${esc(l.name)}</button>`).join("")}</div>
      <span class="lbl">إمتى</span>
      <div class="chips" role="group" aria-label="إمتى">${dchip("", "من غير تاريخ")}${dchip(t, "النهارده")}${dchip(tm, "بكرة")}
        <label class="chip"><input type="date" id="tsDate" value="${due}" aria-label="يوم تاني" style="border:0;background:transparent;font:inherit;color:inherit;padding:0;max-width:9.5em"></label></div>
      <label class="toggle"><span>★ مهمة: تظهر في النهارده حتى لو من غير تاريخ</span><input type="checkbox" id="tsStar" ${x && x.star ? "checked" : ""}><i></i></label>
      <div class="actrow"><button class="btn primary lg" style="flex:1">${x ? "احفظ" : "ضيف المهمة"}</button>${x ? `<button type="button" class="btn danger" data-tdel="${x.id}">امسح</button>` : ""}</div></form>`, "مهمة");
  if (!x) setTimeout(() => { const el = $("tsText"); if (el) el.focus(); }, 80);
}
function openListSheet(id){
  const l = id ? listOf(id) : null, n = l ? state.tasks.items.filter(x => x.list === l.id).length : 0;
  openSheet(`<h2 class="sheet-t">${l ? "تعديل القايمة" : "قايمة جديدة"}</h2>
    <form id="listSheet" class="form" autocomplete="off" data-id="${l ? l.id : ""}">
      <input class="input" id="lsName" maxlength="40" placeholder="مثلًا: شغل، البيت، مشتريات" value="${l ? esc(l.name) : ""}" aria-label="اسم القايمة">
      <button class="btn primary lg">${l ? "احفظ" : "اعمل القايمة"}</button>
      ${l && state.tasks.lists.length > 1 ? `<button type="button" class="btn danger" data-tlistdel="${l.id}">امسح القايمة${n ? ` (المهام ${n} هتتنقل لـ${esc(state.tasks.lists.find(o => o.id !== l.id).name)})` : ""}</button>` : ""}
    </form>`, "قايمة");
  setTimeout(() => { const el = $("lsName"); if (el) el.focus(); }, 80);
}

/* ---------- changes ---------- */
function setTodoDone(id, on){
  const x = state.tasks.items.find(o => o.id === id); if (!x) return;
  x.done = on; x.doneAt = on ? Date.now() : 0; if (on) buzz(); save(); renderScreen();
}
function deleteTodo(id){
  const at = state.tasks.items.findIndex(o => o.id === id); if (at < 0) return;
  const [x] = state.tasks.items.splice(at, 1); save(); renderScreen();
  toast("المهمة اتمسحت", "تراجع", () => { state.tasks.items.splice(at, 0, x); save(); renderScreen(); });
}
document.addEventListener("click", e => {
  const pick = (sel, attr) => { const b = e.target.closest(sel); if (!b) return null; document.querySelectorAll(sel.replace(/=.*\]/, "]")).forEach(o => o.setAttribute("aria-pressed", o === b)); return b; };
  const d = pick("[data-tsday]");
  if (d){ $("tsDate").value = d.dataset.tsday; return; }
  if (pick("[data-tslist]")) return;
  const v = e.target.closest("[data-tview]"); if (v){ taskView = v.dataset.tview; renderTasks(); return; }
  if (e.target.closest("[data-tlistnew]")){ openListSheet(); return; }
  const le = e.target.closest("[data-tlistedit]"); if (le){ openListSheet(le.dataset.tlistedit); return; }
  const ld = e.target.closest("[data-tlistdel]");
  if (ld){ const id = ld.dataset.tlistdel, to = state.tasks.lists.find(o => o.id !== id);
    state.tasks.items.forEach(x => { if (x.list === id) x.list = to.id; });
    state.tasks.lists = state.tasks.lists.filter(o => o.id !== id); taskView = "all";
    save(); closeSheet(); renderScreen(); toast("القايمة اتمسحت"); return; }
  if (e.target.closest("[data-todonew]")){ openTodoSheet(tomorrowIso()); return; }
  const ed = e.target.closest("[data-tedit]"); if (ed){ openTodoSheet(undefined, ed.dataset.tedit); return; }
  const st = e.target.closest("[data-tstar]");
  if (st){ const x = state.tasks.items.find(o => o.id === st.dataset.tstar); if (x){ x.star = !x.star; buzz(6); save(); renderScreen(); } return; }
  const del = e.target.closest("[data-tdel]"); if (del){ closeSheet(); deleteTodo(del.dataset.tdel); return; }
  if (e.target.closest("[data-tclear]")){
    const gone = state.tasks.items.filter(x => x.done && (taskView === "all" || x.list === taskView));
    state.tasks.items = state.tasks.items.filter(x => !gone.includes(x)); save(); renderScreen();
    toast(`اتمسحت ${gone.length}`, "تراجع", () => { state.tasks.items.push(...gone); save(); renderScreen(); }); return; }
});
document.addEventListener("change", e => {
  if (e.target.id === "tsDate") document.querySelectorAll("[data-tsday]").forEach(b => b.setAttribute("aria-pressed", b.dataset.tsday === e.target.value));
  const id = e.target.dataset && e.target.dataset.todo; if (!id) return;
  setTodoDone(id, e.target.checked);
});
document.addEventListener("submit", e => {
  const f = e.target;
  if (f.hasAttribute("data-taskform")){
    e.preventDefault();
    const inp = f.querySelector("input"), text = inp.value.trim(); if (!text) return;
    addTask({text, due:f.dataset.due || "", list:f.dataset.list || state.tasks.lists[0].id});
    renderScreen();
    const again = document.querySelector(f.dataset.due ? `[data-taskform][data-due="${f.dataset.due}"] input` : "[data-taskform] input"); if (again) again.focus();
  } else if (f.id === "todoSheet"){
    e.preventDefault();
    const text = $("tsText").value.trim(); if (!text){ toast("اكتب المهمة الأول"); return; }
    const lb = document.querySelector('[data-tslist][aria-pressed="true"]');
    const o = {text, due:$("tsDate").value || "", list:lb ? lb.dataset.tslist : state.tasks.lists[0].id, star:$("tsStar").checked};
    if (taskEdit){ Object.assign(state.tasks.items.find(x => x.id === taskEdit) || {}, o); save(); toast("اتحفظت"); }
    else { addTask(o); toast(o.due ? `اتضافت لـ${dayLabel(o.due)}` : `اتضافت لـ${listOf(o.list).name}`); }
    taskEdit = null; closeSheet(); renderScreen();
  } else if (f.id === "listSheet"){
    e.preventDefault();
    const name = $("lsName").value.trim(); if (!name){ toast("اكتب اسم القايمة"); return; }
    if (f.dataset.id){ listOf(f.dataset.id).name = name; }
    else { const l = {id:"l" + uid(), name, ts:Date.now()}; state.tasks.lists.push(l); taskView = l.id; }
    save(); closeSheet(); renderScreen();
  }
});

/* ---------- swipe a task: right = done, left = delete ---------- */
let swp = null, swallowClick = false;
document.addEventListener("pointerdown", e => {
  const row = e.target.closest(".td[data-swipe]");
  if (!row || e.target.closest("input,a,.star") || e.button > 0) return;
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
  const id = row.dataset.swipe, x = state.tasks.items.find(o => o.id === id);
  if (dx > 80) setTodoDone(id, x ? !x.done : true);
  else if (dx < -80) deleteTodo(id);
  else { row.style.transform = ""; row.classList.remove("sw-done","sw-del"); }
}
document.addEventListener("pointerup", endSwipe);
document.addEventListener("pointercancel", endSwipe);
document.addEventListener("click", e => { if (swallowClick){ e.preventDefault(); e.stopPropagation(); } }, true);
