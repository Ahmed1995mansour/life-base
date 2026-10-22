"use strict";
/* ===================== PLAN: the full day schedule (tasks, reminders and the week have their own files) ===================== */
function renderSchedule(){
  const day = curDay(), T = timed(day).slice().sort((x, y) => (x.s == null ? -1 : x.s) - (y.s == null ? -1 : y.s) || x.i - y.i);
  const nowI = isToday() ? (nowNext(day).cur || {}).i : -1;
  $("scr-sched").innerHTML = `<div class="card sched"><div class="card-h"><h2>جدول ${isToday() ? "النهارده" : dayLabel(curDate())}</h2><span class="small" data-cnt="${T.map(x=>"t"+x.i).join(",")}"></span></div>
    <p class="small sched-hint">اسحب يمين أو شمال تغيّر اليوم.</p>
    <ol class="tl">${T.map(({i, it}) => schedRow(day, i, it, true, nowI)).join("")}</ol></div>`;
  refreshMarks();
  const now = document.querySelector("#scr-sched li.now");
  if (now && !renderSchedule.scrolled){ renderSchedule.scrolled = true; setTimeout(() => now.scrollIntoView({block:"center"}), 60); }
}
