"use strict";
function equipChip(n){
  const q = EQUIP[n]; if (!q) return "";
  return `<span class="eq eq-${q[0]}">${EQ_LABEL[q[0]]}</span>${q[1]?`<span class="eq-d">${esc(q[1])}</span>`:""}`;
}
function howTo(n){
  const s = slug(n);
  return `<details class="how" data-media="${s}" data-name="${esc(n)}"><summary>شوف الطريقة</summary><div class="how-body"></div></details>`;
}
function fillHowTo(d){
  const body = d.querySelector(".how-body"); if (body.dataset.done) return;
  const m = MEDIA[d.dataset.media], n = d.dataset.name;
  const f = m && (typeof m === "string" ? m : m.f);
  const yt = "https://www.youtube.com/results?search_query=" + encodeURIComponent(n + (GRIP[n] && GRIP[n][0] ? " " + GRIP[n][0] : "") + " exercise form");
  if (f){
    const talk = m.talk, poster = m.poster ? ` poster="${m.poster}"` : "";
    body.innerHTML = (/\.(mp4|webm)$/i.test(f)
      ? (talk
          ? `<video src="${f}"${poster} playsinline controls preload="metadata"></video><p class="small">فيه شرح بالصوت، شغّله بالصوت.</p>`
          : `<video src="${f}"${poster} autoplay loop muted playsinline controls preload="metadata"></video>`)
      : `<img src="${f}" alt="طريقة ${esc(n)}" loading="lazy">`)
      + (m.credit ? `<p class="small">المصدر: ${esc(m.credit)}</p>` : "");
  } else {
    body.innerHTML = `<p class="small">لسه مفيش فيديو للتمرين ده في الأبلكيشن. ابعتهولي وأنا أضيفه.</p><a class="yt" href="${yt}" target="_blank" rel="noopener">دوّر على فيديو في يوتيوب</a>`;
  }
  body.dataset.done = "1";
}

/* ===================== TRAINING ===================== */
function restSec(e){
  const r = e.rest || "";
  let m = r.match(/(\d+)(?:–\d+)?\s*د/); if (m) return +m[1] * 60;
  m = r.match(/(\d+)(?:–\d+)?\s*ث/); if (m) return +m[1];
  return null;
}
const fmtSec = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
function setsShort(e){
  if (e.k === "main" || e.k === "comp") return `3 × ${e.reps}`;
  if (e.k === "iso") return `${e.sets||2} × ${e.reps}`;
  return e.sets || "";
}
function exCard(e, id){
  let pills = "", warm = "", log = "";
  if (e.k === "main" || e.k === "comp"){
    pills = `<span class="pill sets">3 مجموعات × ${esc(e.reps)}</span><span class="pill">2 تقيلة + 1 أخف 10%</span><span class="pill">سايب 1–2 عدة</span>`;
    warm = `<p class="warm"><b>تسخين:</b> ${e.k==="main"?WARM_MAIN:WARM_COMP}</p>`;
  } else if (e.k === "iso"){
    pills = `<span class="pill sets">${e.sets||2} مجموعات × ${esc(e.reps)}</span><span class="pill">لقرب الفشل</span>${e.partial?`<span class="pill">آخر مجموعة: + 4 أنصاف عدات</span>`:""}`;
    warm = `<p class="warm"><b>تسخين:</b> ${WARM_ISO}</p>`;
  } else pills = `<span class="pill sets">${esc(e.sets)}</span>`;
  if (e.rest) pills += `<span class="pill">${esc(e.rest)}</span>`;
  const date = curDate();
  if (e.k === "main" || e.k === "comp" || e.k === "iso" || e.log){
    const s = slug(e.n), lg = state.weights[s] || {};
    const prev = Object.keys(lg).filter(k=>k<date && lg[k]!=="" && lg[k]!=null).sort().pop();
    log = `<div class="logrow"><label for="w-${s}">أتقل مجموعة</label><input class="field" id="w-${s}" data-w="${s}" inputmode="decimal" placeholder="كجم" value="${lg[date]!=null?esc(lg[date]):""}"><span class="last">${prev?`المرة اللي فاتت (${short(new Date(prev+"T00:00"))}): ${esc(lg[prev])} كجم`:""}</span></div>`;
  }
  const q = EQUIP[e.n], mu = MUSCLES[e.n], gr = GRIP[e.n];
  const kv = (q?`<dt>الجهاز</dt><dd>${equipChip(e.n)}</dd>`:"") + (mu?`<dt>العضلة</dt><dd>${esc(mu[0])}${mu[1]?` <span class="muted">· بيساعد: ${esc(mu[1])}</span>`:""}</dd>`:"") + (gr?`<dt>المسكة</dt><dd>${esc(gr[1])}</dd>`:"");
  const rs = restSec(e);
  const act = rs ? `<div class="actrow"><button type="button" class="btn primary" data-rest="${rs}" data-name="${esc(e.n)}">${ICO.timer} ابدأ الراحة ${fmtSec(rs)}</button></div>` : "";
  const sub = [setsShort(e), e.rest].filter(Boolean).join(" · ");
  return `<details class="exc" data-row="${id}"><summary>${box(id)}<span class="nm"><span class="ttl en">${esc(e.n)}</span><small>${esc(sub)}</small></span>${CHEV}</summary>
    <div class="inner"><div class="pills">${pills}</div>${kv?`<dl class="kv">${kv}</dl>`:""}${warm}<p class="cue">${esc(e.c)}</p>${log}${act}${howTo(e.n)}</div></details>`;
}
function phaseCard(id, p){
  return `<details class="exc" data-row="${id}"><summary>${box(id)}<span class="nm"><span class="ttl">${p.title}</span><small>${p.time}</small></span>${CHEV}</summary>
    <div class="inner phase-list"><ul class="plain">${p.items.map(([a,b,m])=>`<li><b>${a}</b>: ${b}${m && MEDIA[slug(m)] ? howTo(m) : ""}</li>`).join("")}</ul></div></details>`;
}
function trainIds(day){
  const ids = [];
  (day.routines||[]).forEach(r => r.items.forEach((_,i)=>ids.push(r.id+"-"+i)));
  const wus = day.wu ? (Array.isArray(day.wu) ? day.wu : [day.wu]) : [];
  if (wus[0]) ids.push("wu");
  day.ex.forEach((_,i)=>ids.push("e"+i));
  if (day.ex.length && day.tread) ids.push("tr");
  day.abs.forEach((_,i)=>ids.push("a"+i));
  wus.slice(1).forEach((_,i)=>ids.push("wu"+(i+2)));
  if (day.cd) ids.push("cd");
  return ids;
}
function renderTrain(){
  const day = curDay(), el = document.getElementById("scr-train");
  if (!hasWorkout(day)){
    el.innerHTML = emptyState("target", `مفيش تمرين ${isToday()?"النهارده":"اليوم ده"}`, "يوم راحة. لو عايز تضيف تمرين لليوم ده، عدّله من خطتك.", `<button type="button" class="btn primary" data-editday="${day.id}">ضيف تمرين</button>`); return;
  }
  const ids = trainIds(day);
  const gymT = day.tl.find(t => t.k === "gym");
  let h = `<div class="card"><div class="wo-head"><div><h2 class="en">${esc(day.k)}</h2><div class="small">${esc(day.badge)}</div></div><span class="small" data-cnt="${ids.join(",")}"></span></div>
    <div class="bar"><i id="trBar"></i></div><div class="actrow" style="justify-content:space-between;margin-top:8px">${gymT ? `<p class="small" style="margin:0">المعاد: <span class="num" dir="ltr">${esc(timeText(gymT))}</span></p>` : "<span></span>"}<button type="button" class="golink" data-editday="${day.id}">عدّل التمرين</button></div></div>`;
  (day.routines||[]).forEach(r => {
    h += `<h3 class="sect-title">${esc(r.title)}${r.time ? " · " + esc(r.time) : ""}</h3>` + r.items.map((e,i)=>exCard(Object.assign({k:"hold"}, e), r.id+"-"+i)).join("");
  });
  const wus = day.wu ? (Array.isArray(day.wu) ? day.wu : [day.wu]) : [];
  if (wus[0]) h += `<h3 class="sect-title">الإحماء</h3>` + phaseCard("wu", W[wus[0]]);
  if (day.ex.length){
    h += `<h3 class="sect-title">التمارين</h3>` + day.ex.map((e,i)=>exCard(e, "e"+i)).join("");
    if (day.tread) h += exCard(TREAD, "tr");
  }
  if (day.abs.length) h += `<h3 class="sect-title">البطن · 8–10 دقايق</h3>` + day.abs.map((e,i)=>exCard(Object.assign({k:"hold", rest:"راحة 45 ث"}, e), "a"+i)).join("");
  wus.slice(1).forEach((w,i)=>{ h += `<h3 class="sect-title">قبل الماتش</h3>` + phaseCard("wu"+(i+2), W[w]); });
  if (day.cd) h += `<h3 class="sect-title">في الآخر</h3>` + phaseCard("cd", C[day.cd]);
  el.innerHTML = h;
  refreshMarks();
  const c = checksOf(curDate());
  const first = [...el.querySelectorAll("details.exc")].find(d => !c[d.dataset.row]);
  if (first) first.open = true;
}
function advanceFrom(id){
  const el = document.getElementById("scr-train");
  const cards = [...el.querySelectorAll("details.exc")], c = checksOf(curDate());
  const k = cards.findIndex(d => d.dataset.row === id); if (k < 0) return;
  cards[k].open = false;
  const nx = cards.slice(k+1).find(d => !c[d.dataset.row]);
  if (nx){ nx.open = true; setTimeout(()=>nx.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block:"start"}), 60); }
}

/* ---------- rest timer ---------- */
const TM = {end:0, total:0, iv:null, ctx:null, lock:null, hideT:null};
const tEl = document.getElementById("timer");
function startTimer(sec, name){
  clearTimeout(TM.hideT);
  TM.total = sec*1000; TM.end = Date.now() + TM.total;
  try { TM.ctx = TM.ctx || new (window.AudioContext||window.webkitAudioContext)(); TM.ctx.resume && TM.ctx.resume(); } catch(e){}
  try { navigator.wakeLock && navigator.wakeLock.request("screen").then(l=>{ TM.lock = l; }).catch(()=>{}); } catch(e){}
  tEl.classList.remove("end"); tEl.hidden = false;
  document.querySelector("#tLbl b").textContent = "راحة";
  document.querySelector("#tLbl span").textContent = name;
  clearInterval(TM.iv); TM.iv = setInterval(tick, 250); tick();
}
function tick(){
  const rem = TM.end - Date.now();
  if (rem <= 0) return finishTimer();
  document.getElementById("tVal").textContent = fmtSec(Math.ceil(rem/1000));
  document.getElementById("tBar").style.width = (100 - rem/TM.total*100) + "%";
}
function beep(){
  const ctx = TM.ctx; if (!ctx) return;
  [0, .35, .7].forEach(t => {
    try { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(.0001, ctx.currentTime+t); g.gain.exponentialRampToValueAtTime(.35, ctx.currentTime+t+.02); g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime+t+.25);
      o.start(ctx.currentTime+t); o.stop(ctx.currentTime+t+.27); } catch(e){}
  });
}
function finishTimer(){
  clearInterval(TM.iv);
  document.getElementById("tVal").textContent = "0:00";
  document.getElementById("tBar").style.width = "100%";
  document.querySelector("#tLbl b").textContent = "يلا المجموعة الجاية";
  tEl.classList.add("end");
  try { navigator.vibrate && navigator.vibrate([300,150,300,150,300]); } catch(e){}
  beep();
  TM.hideT = setTimeout(stopTimer, 6000);
}
function stopTimer(){
  clearInterval(TM.iv); clearTimeout(TM.hideT); tEl.hidden = true;
  try { TM.lock && TM.lock.release(); } catch(e){} TM.lock = null;
}
document.getElementById("tPlus").addEventListener("click", ()=>{
  if (tEl.classList.contains("end")){ startTimer(15, document.querySelector("#tLbl span").textContent); return; }
  TM.end += 15000; TM.total += 15000; tick();
});
document.getElementById("tStop").addEventListener("click", stopTimer);

/* ---------- training events: rest timer, heaviest-set log, how-to videos ---------- */
document.addEventListener("click", e => { const rb = e.target.closest("[data-rest]"); if (rb) startTimer(+rb.dataset.rest, rb.dataset.name); });
document.addEventListener("input", e => {
  const s = e.target.dataset && e.target.dataset.w; if (!s) return;
  const date = curDate(), v = normDigits(e.target.value.trim());
  const lg = Object.assign({}, state.weights[s]||{});
  if (v === "") delete lg[date]; else lg[date] = isNaN(+v) ? v : +v;
  const keys = Object.keys(lg).sort(); while (keys.length > 60) delete lg[keys.shift()];
  state.weights[s] = lg; save();
});
document.addEventListener("toggle", e => {
  const d = e.target; if (d.classList && d.classList.contains("how") && d.open && d.dataset.media) fillHowTo(d);
}, true);
