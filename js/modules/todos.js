"use strict";
/* ===================== TO-DO: per-day tasks, unfinished ones move to today ===================== */
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
function todoHTML(){
  const date = curDate(), list = state.todos[date] || [];
  const done = list.filter(x=>x.done).length;
  const past = date < iso(today);
  const items = list.map(x => `<li class="td${x.done?" is-done":""}" data-tid="${x.id}">
      <input type="checkbox" class="ck" data-todo="${x.id}" id="td-${x.id}" ${x.done?"checked":""}>
      <label for="td-${x.id}"><span class="ttl">${esc(x.text)}</span>${x.from?`<span class="sub">مترحّلة من ${esc(dayLabel(x.from))}</span>`:""}</label>
      <button type="button" class="tdx" data-deltodo="${x.id}" aria-label="امسح المهمة: ${esc(x.text)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></li>`).join("");
  return `<div class="card" id="todos"><div class="card-h"><h2>مهام ${isToday()?"النهارده":dayLabel(date)}</h2><span class="small">${list.length?`${done}/${list.length}`:""}</span></div>
    ${list.length?`<ul class="tdl">${items}</ul>`:`<p class="small" style="margin:0 0 10px">${past?"مفيش مهام متسجلة لليوم ده.":"مفيش مهام لسه. اكتب أول مهمة تحت."}</p>`}
    ${past?`<p class="small" style="margin:8px 0 0">المهام اللي مخلصتش بتترحّل للنهارده لوحدها.</p>`:`<form class="tdform" id="todoForm" autocomplete="off"><input class="field" id="todoIn" maxlength="140" placeholder="ضيف مهمة ${isToday()?"للنهارده":"لـ"+dayLabel(date)}" aria-label="مهمة جديدة"><button class="btn primary" type="submit">ضيف</button></form>`}
    </div>`;
}
function redrawTodos(keepFocus){
  const el = document.getElementById("todos"); if (!el) return;
  el.outerHTML = todoHTML();
  if (keepFocus){ const i = document.getElementById("todoIn"); if (i) i.focus(); }
}
document.addEventListener("submit", e => {
  if (e.target.id !== "todoForm") return;
  e.preventDefault();
  const inp = document.getElementById("todoIn"), text = inp.value.trim(); if (!text) return;
  const date = curDate();
  state.todos[date] = (state.todos[date] || []).concat({id: Date.now().toString(36) + Math.random().toString(36).slice(2,5), text, done:false});
  save(); redrawTodos(true);
});
document.addEventListener("change", e => {
  const id = e.target.dataset && e.target.dataset.todo; if (!id) return;
  const list = state.todos[curDate()] || [], x = list.find(t=>t.id===id); if (!x) return;
  x.done = e.target.checked; save(); redrawTodos(false);
});
document.addEventListener("click", e => {
  const b = e.target.closest("[data-deltodo]"); if (!b) return;
  const date = curDate();
  state.todos[date] = (state.todos[date] || []).filter(t=>t.id!==b.dataset.deltodo);
  if (!state.todos[date].length) delete state.todos[date];
  save(); redrawTodos(false);
});
