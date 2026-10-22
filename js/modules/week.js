"use strict";
/* ===================== WEEK: how each day of this week went ===================== */
function renderWeek(){
  const ws = weekStart(), we = new Date(ws); we.setDate(we.getDate()+6);
  document.getElementById("wkTitle").textContent = weekOffset === 0 ? "الأسبوع ده" : `${short(ws)} – ${short(we)}`;
  document.getElementById("wkDays").innerHTML = DAYS.map(d => {
    const dt = iso(dateOf(d.id)), pct = Math.min(100, Math.round(doneCount(d, dt)/countItems(d)*100));
    return `<button type="button" class="wkday${dt===iso(today)?" today":""}" data-day="${d.id}"><span><b>${d.d}</b><small>${esc(d.k)}</small></span><span class="bar" style="margin:0"><i style="width:${pct}%"></i></span><span class="pct">${pct}%</span></button>`;
  }).join("");
  document.getElementById("wkMosque").textContent = `المسجد: ${ORDER.reduce((s,id)=>s+mosqueCount(iso(dateOf(id))),0)} من 35`;
}

document.addEventListener("click", e => { const wd = e.target.closest(".wkday"); if (wd){ current = wd.dataset.day; go("today"); } });
