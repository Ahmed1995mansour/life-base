"use strict";
/* ===================== WEEK: how each day of this week went ===================== */
function renderWeek(){
  const ws = weekStart(), we = new Date(ws); we.setDate(we.getDate()+6);
  document.getElementById("wkTitle").textContent = weekOffset === 0 ? "الأسبوع ده" : `${short(ws)} – ${short(we)}`;
  document.getElementById("wkDays").innerHTML = DAYS.map(d => {
    const dt = iso(dateOf(d.id)), pct = Math.min(100, Math.round(doneCount(d, dt)/countItems(d)*100));
    return `<button type="button" class="wkday${dt===iso(today)?" today":""}" data-day="${d.id}"><span><b>${WEEKDAYS[ORDER.indexOf(d.id)]}</b><small>${esc(d.k)}</small></span><span class="bar" style="margin:0"><i style="width:${pct}%"></i></span><span class="pct">${pct}%</span></button>`;
  }).join("");
  renderWeekCells();
  document.getElementById("wkMosque").textContent = `المسجد: ${ORDER.reduce((s,id)=>s+mosqueCount(iso(dateOf(id))),0)} من 35`;
}

document.addEventListener("click", e => { const wd = e.target.closest(".wkday"); if (wd){ current = wd.dataset.day; go("today"); } });

/* time the plan gives each part of life in a week */
function renderWeekCells(){
  const sum = {}, gymDays = DAYS.filter(d => d.ex.length || d.routines.length).length;
  DAYS.forEach(d => timed(d).forEach(({s, e, it}) => { if (s != null && e != null) sum[it.k] = (sum[it.k] || 0) + (e - s); }));
  const h = k => { const m = sum[k] || 0; return m ? `${+(m / 60).toFixed(1)} س` : "—"; };
  const cell = (v, l) => `<div class="cell"><div class="v">${v}</div><div class="l">${l}</div></div>`;
  $("wkCells").innerHTML = cell(gymDays, "أيام تمرين") + cell(h("gym"), "رياضة") + cell(h("work"), "شغل") + cell(h("home"), "أسرة وبيت") + cell(h("self"), "وقتك") + cell(h("deen"), "عبادة");
}
