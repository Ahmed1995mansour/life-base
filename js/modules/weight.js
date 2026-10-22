"use strict";
/* ---------- weight tracker ---------- */
const START_KG = 100, GOAL_LO = 80, GOAL_HI = 83;
const fmt = n => (Math.round(n*10)/10).toFixed(1).replace(/\.0$/,"");
function sundayOf(dateStr){ const d = new Date(dateStr+"T00:00"); d.setDate(d.getDate()-d.getDay()); return iso(d); }

function weeklySeries(){
  const w = state.body.w || {};
  const dates = Object.keys(w).filter(k=>isFinite(+w[k]) && +w[k]>0).sort();
  if (!dates.length) return [];
  const buckets = {};
  dates.forEach(d=>{ const s = sundayOf(d); (buckets[s] = buckets[s]||[]).push(+w[d]); });
  const out = [], cur = new Date(sundayOf(dates[0])+"T00:00"), end = new Date(sundayOf(iso(today))+"T00:00");
  while (cur <= end){
    const k = iso(cur), arr = buckets[k];
    out.push({week:k, n:arr?arr.length:0, avg:arr?arr.reduce((a,b)=>a+b,0)/arr.length:null});
    cur.setDate(cur.getDate()+7);
  }
  return out;
}

function statusOf(ch){
  if (ch == null) return "";
  if (ch <= -1.3) return `<span class="st st-warn">! أسرع من اللازم</span>`;
  if (ch <= -0.4) return `<span class="st st-good">✓ ممتاز</span>`;
  if (ch < 0.25)  return `<span class="st st-warn">– ثابت</span>`;
  return `<span class="st st-bad">↑ زاد</span>`;
}

function renderTracker(){
  const series = weeklySeries();
  const pts = series.filter(p=>p.avg!=null);
  const last = pts.length ? pts[pts.length-1].avg : null;
  const tiles = [
    [`${START_KG}`, "البداية (كجم)"],
    [last!=null?fmt(last):"—", "متوسط آخر أسبوع"],
    [last!=null?(last-START_KG<=0?"":"+")+fmt(last-START_KG):"—", "التغيير من البداية"],
    [last!=null?(last<=GOAL_HI?"وصلت":fmt(last-GOAL_HI)):fmt(START_KG-GOAL_HI), "فاضل لحد 83 كجم"]
  ];
  document.getElementById("trkTiles").innerHTML = tiles.map(([v,l])=>`<div class="tile"><div class="v">${v}</div><div class="l">${l}</div></div>`).join("");

  // chart: start point + weekly averages
  const boxEl = document.getElementById("trkChart");
  const W_ = Math.max(300, Math.min(720, (boxEl.clientWidth||660) - 20)), H_ = W_ < 480 ? 220 : 250, L = 34, R = 44, T = 16, B = 28;
  const plot = [{label:"البداية", avg:START_KG, n:null, start:true}].concat(series.map(p=>({label:short(new Date(p.week+"T00:00")), avg:p.avg, n:p.n, week:p.week})));
  const vals = plot.filter(p=>p.avg!=null).map(p=>p.avg);
  let lo = Math.floor(Math.min(GOAL_LO, ...vals) - 1), hi = Math.ceil(Math.max(START_KG, ...vals) + 1);
  const minSlots = 8, slots = Math.max(plot.length, minSlots);
  const x = i => L + (slots===1?0:(i/(slots-1))*(W_-L-R));
  const y = v => T + (hi - v)/(hi - lo)*(H_-T-B);
  let g = "";
  for (let v = Math.ceil(lo/5)*5; v <= hi; v += 5){
    g += `<line x1="${L}" x2="${W_-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)" stroke-width="1"/>`;
    g += `<text class="ax" x="${L-6}" y="${y(v)+4}" text-anchor="end">${v}</text>`;
  }
  g += `<rect x="${L}" y="${y(GOAL_HI)}" width="${W_-L-R}" height="${y(GOAL_LO)-y(GOAL_HI)}" fill="var(--band)"/>`;
  g += `<text class="ax" x="${W_-R+4}" y="${(y(GOAL_HI)+y(GOAL_LO))/2+4}">الهدف</text>`;
  const step = Math.max(1, Math.ceil(plot.length/7));
  plot.forEach((p,i)=>{ if (i%step===0 || i===plot.length-1) g += `<text class="ax" x="${x(i)}" y="${H_-8}" text-anchor="middle">${p.label}</text>`; });
  // line segments between consecutive known points
  let d = "", prev = null;
  plot.forEach((p,i)=>{ if (p.avg==null) return; d += (prev==null?"M":"L")+x(i).toFixed(1)+" "+y(p.avg).toFixed(1)+" "; prev = i; });
  g += `<path d="${d}" fill="none" stroke="var(--chart)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  plot.forEach((p,i)=>{ if (p.avg==null) return;
    g += `<circle cx="${x(i)}" cy="${y(p.avg)}" r="4.5" fill="${p.start?"var(--surface)":"var(--chart)"}" stroke="${p.start?"var(--chart)":"var(--surface)"}" stroke-width="2"/>`; });
  const li = plot.map(p=>p.avg!=null).lastIndexOf(true);
  if (li >= 0) g += `<text class="lbl" x="${x(li)+8}" y="${y(plot[li].avg)-8}">${fmt(plot[li].avg)}</text>`;
  // hit areas
  const bw = (W_-L-R)/Math.max(1,slots-1);
  plot.forEach((p,i)=>{ if (p.avg==null) return;
    g += `<rect class="hit" data-i="${i}" x="${x(i)-bw/2}" y="${T}" width="${bw}" height="${H_-T-B}" fill="transparent"/>`; });
  const empty = pts.length ? "" : `<text class="ax" x="${(L+W_-R)/2}" y="${y((lo+hi)/2)-8}" text-anchor="middle">اكتب وزنك الصبح في "عادات كل يوم"</text><text class="ax" x="${(L+W_-R)/2}" y="${y((lo+hi)/2)+10}" text-anchor="middle">والمتوسط هيظهر هنا كل أسبوع</text>`;
  const box = document.getElementById("trkChart");
  box.innerHTML = `<svg viewBox="0 0 ${W_} ${H_}" role="img" aria-label="متوسط الوزن الأسبوعي">${g}${empty}</svg><div class="tip" hidden></div>`;
  const tip = box.querySelector(".tip"), svg = box.querySelector("svg");
  box.querySelectorAll(".hit").forEach(r=>{
    const show = ()=>{
      const p = plot[+r.dataset.i];
      const sx = svg.clientWidth / W_;
      tip.textContent = p.start ? `البداية: ${START_KG} كجم` : `أسبوع ${p.label}: ${fmt(p.avg)} كجم (${p.n} ${p.n===1?"يوم":"أيام"})`;
      tip.style.left = (10 + x(+r.dataset.i)*sx)+"px"; tip.style.top = (10 + y(p.avg)*sx)+"px"; tip.hidden = false;
    };
    r.addEventListener("mouseenter", show); r.addEventListener("click", show);
    r.addEventListener("mouseleave", ()=>{ tip.hidden = true; });
  });

  // table (newest first) with change vs previous measured week
  let prevAvg = START_KG; const rows = [];
  series.forEach(p=>{ const ch = p.avg!=null ? p.avg - prevAvg : null; rows.push({p, ch}); if (p.avg!=null) prevAvg = p.avg; });
  document.getElementById("trkRows").innerHTML = rows.length ? rows.slice().reverse().map(({p,ch})=>
    `<tr><td>${short(new Date(p.week+"T00:00"))}</td><td>${p.n}</td><td>${p.avg!=null?fmt(p.avg):"—"}</td><td><span dir="ltr">${ch!=null?(ch>0?"+":"")+fmt(ch):"—"}</span></td><td>${statusOf(ch)}</td></tr>`).join("")
    : `<tr><td colspan="5" style="color:var(--muted)">لسه مفيش أوزان متسجلة.</td></tr>`;

  // plateau note: last two measured weeks both flat or up
  const chs = rows.filter(r=>r.ch!=null).map(r=>r.ch);
  const note = document.getElementById("trkNote");
  if (chs.length >= 2 && chs.slice(-2).every(c=>c > -0.25)){
    note.innerHTML = `<div class="trk-note"><b>الوزن ثابت أسبوعين.</b> قلّل نص كوباية رز أو نص رغيف في اليوم، وشوف مقاس الوسط كمان: لو بينزل، يبقى بتخس دهون وبتبني عضل.</div>`;
  } else if (chs.length && chs[chs.length-1] <= -1.3){
    note.innerHTML = `<div class="trk-note"><b>نزلت أسرع من اللازم الأسبوع ده.</b> لو اتكرر، زوّد نص كوباية رز في اليوم عشان متخسرش عضل. أول أسبوعين طبيعي ينزلوا أسرع بسبب المية.</div>`;
  } else note.innerHTML = "";

  // waist
  const wa = state.body.waist || {}, wd = Object.keys(wa).sort();
  const wi = document.getElementById("waistIn");
  if (document.activeElement !== wi) wi.value = wa[iso(today)] != null ? wa[iso(today)] : "";
  document.getElementById("waistInfo").textContent = wd.length
    ? wd.slice(-4).map(k=>`${short(new Date(k+"T00:00"))}: ${wa[k]} سم`).join(" · ") + (wd.length>1 ? ` · التغيير: ${fmt(wa[wd[wd.length-1]]-wa[wd[0]])} سم` : "")
    : "بيتسجل بتاريخ النهارده.";
}


document.addEventListener("input", e => {
  if (e.target.id !== "waistIn") return;
  const v = parseNum(e.target.value), wa = Object.assign({}, state.body.waist);
  if (v == null) delete wa[iso(today)]; else wa[iso(today)] = v;
  state.body.waist = wa; save(); renderTracker();
});
