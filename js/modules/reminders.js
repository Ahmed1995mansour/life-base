"use strict";
/* ===================== REMINDERS ===================== */
const RCATS = {car:["العربية","#3550F0"], home:["البيت","#0E9F8E"], health:["الصحة","#D9468F"], kid:["أنس","#7B6CF0"], bills:["فواتير واشتراكات","#0FA37F"], other:["تانية","#8A93AA"]};
const UNITS = {d:["يوم","أيام"], w:["أسبوع","أسابيع"], m:["شهر","شهور"], y:["سنة","سنين"]};
const TEMPLATES = [
  {title:"تغيير زيت العربية", cat:"car", n:4, u:"m"},
  {title:"تغيير شمعة فلتر المية", cat:"home", n:3, u:"m"},
  {title:"ترخيص العربية", cat:"car", n:1, u:"y"},
  {title:"تأمين العربية", cat:"car", n:1, u:"y"},
  {title:"تجديد باقة النت", cat:"bills", n:1, u:"m"}
];
let remEdit = null, remDel = null;
const dOf = s => new Date(s+"T00:00");
const daysTo = s => Math.round((dOf(s) - today) / 86400000);
const DNAME = d => (DAYS.find(x=>x.id===ORDER[d.getDay()])||{}).d || "";
function addInterval(dateStr, n, u){
  const d = dOf(dateStr);
  if (u==="d") d.setDate(d.getDate()+n); else if (u==="w") d.setDate(d.getDate()+7*n);
  else if (u==="m"){ const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth()+n); d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth()+1, 0).getDate())); }
  else if (u==="y") d.setFullYear(d.getFullYear()+n);
  return iso(d);
}
function unitWord(n, u){ return n===1 ? UNITS[u][0] : (n===2 ? {d:"يومين",w:"أسبوعين",m:"شهرين",y:"سنتين"}[u] : `${n} ${n<=10?UNITS[u][1]:UNITS[u][0]}`); }
const everyText = r => r.every ? `كل ${unitWord(r.every.n, r.every.u)}` : "مرة واحدة";
const daysWord = n => n===1 ? "يوم" : n===2 ? "يومين" : `${n} ${n<=10?"أيام":"يوم"}`;
function whenText(r){
  const n = daysTo(r.due), d = dOf(r.due), dl = `${DNAME(d)} ${short(d)}`;
  if (n < 0) return {t:`متأخر ${daysWord(-n)}`, c:"over", dl};
  if (n === 0) return {t:"النهارده", c:"now", dl};
  if (n === 1) return {t:"بكرة", c:"now", dl};
  if (n <= 7) return {t:`بعد ${daysWord(n)}`, c:"soon", dl};
  return {t:`بعد ${daysWord(n)}`, c:"", dl};
}
const activeRem = () => state.rem.filter(r=>!r.closed).sort((a,b)=>a.due<b.due?-1:a.due>b.due?1:0);
function updateRemBadge(){
  const n = activeRem().filter(r=>daysTo(r.due)<=1).length, b = document.getElementById("remBadge");
  b.hidden = !n; b.textContent = n;
}
function remItem(r, compact){
  const w = whenText(r), c = RCATS[r.cat] || RCATS.other;
  if (compact) return `<div class="soonrow"><span class="rdot" style="background:${c[1]};margin:0"></span><span><b>${esc(r.title)}</b><small>${w.dl}</small></span><span class="rwhen ${w.c}">${w.t}</span></div>`;
  const sure = remDel === r.id;
  return `<li class="ritem${w.c==="over"?" over":""}"><div class="rh"><span class="rdot" style="background:${c[1]}"></span><div class="rt"><b>${esc(r.title)}</b>
    <small>${c[0]} · ${everyText(r)} · ${w.dl}${r.last?` · آخر مرة ${short(dOf(r.last))}`:""}</small>${r.note?`<small>${esc(r.note)}</small>`:""}</div><span class="rwhen ${w.c}">${w.t}</span></div>
    <div class="acts"><button type="button" class="btn sm done" data-rdone="${r.id}">${r.every?`خلصت، والجاي بعد ${unitWord(r.every.n, r.every.u)}`:"خلصت"}</button>
    <button type="button" class="btn sm" data-rics="${r.id}">ضيفه للتقويم</button><button type="button" class="btn sm" data-redit="${r.id}">تعديل</button>
    <button type="button" class="btn sm danger${sure?" sure":""}" data-rdel="${r.id}">${sure?"متأكد؟ امسح":"مسح"}</button></div></li>`;
}
function remForm(){
  const r = remEdit ? state.rem.find(x=>x.id===remEdit) : null;
  const v = r || {title:"", cat:"car", due: addInterval(iso(today), 1, "m"), every:{n:1,u:"m"}, note:""};
  const rep = !!v.every;
  return `<form class="rform" id="remForm" autocomplete="off">
    ${r?"":`<div class="tpl">${TEMPLATES.map((t,i)=>`<button type="button" data-tpl="${i}">${t.title}</button>`).join("")}</div>`}
    <label class="lbl">التذكير<input class="input" id="rTitle" required maxlength="80" placeholder="مثلًا: تغيير زيت العربية" value="${esc(v.title)}"></label>
    <div class="row2"><label class="lbl">النوع<select class="input" id="rCat">${Object.entries(RCATS).map(([k,c])=>`<option value="${k}" ${k===v.cat?"selected":""}>${c[0]}</option>`).join("")}</select></label>
      <label class="lbl">المعاد<input class="input" id="rDue" type="date" required value="${v.due}"></label></div>
    <div class="row3"><label class="lbl">بيتكرر؟<select class="input" id="rRep"><option value="0" ${rep?"":"selected"}>مرة واحدة</option><option value="1" ${rep?"selected":""}>كل</option></select></label>
      <label class="lbl">كام<input class="input" id="rN" type="number" min="1" max="99" inputmode="numeric" value="${rep?v.every.n:1}" ${rep?"":"disabled"}></label>
      <label class="lbl">&nbsp;<select class="input" id="rU" ${rep?"":"disabled"}>${Object.entries(UNITS).map(([k,u])=>`<option value="${k}" ${(rep?v.every.u:"m")===k?"selected":""}>${u[1]}</option>`).join("")}</select></label></div>
    <label class="lbl">ملاحظة (اختياري)<input class="input" id="rNote" maxlength="120" placeholder="مثلًا: زيت 5W-30، أو عند الكيلو 45,000" value="${esc(v.note||"")}"></label>
    <p class="small" style="margin:0">هيظهرلك في شاشة النهارده قبل المعاد بأسبوع. ولو عايز إشعار على الموبايل وهو مقفول، دوس "ضيفه للتقويم" بعد ما تحفظه، وهيفكّرك قبلها بأسبوع وقبلها بيوم.</p>
    <div class="actrow"><button class="btn primary" type="submit">${r?"احفظ التعديل":"ضيف التذكير"}</button>${r?`<button class="btn" type="button" data-rcancel="1">إلغاء</button>`:""}</div>
  </form>`;
}
function renderRem(){
  const el = document.getElementById("scr-rem"), list = activeRem();
  const over = list.filter(r=>daysTo(r.due)<0), week = list.filter(r=>{const n=daysTo(r.due); return n>=0&&n<=7;}), later = list.filter(r=>daysTo(r.due)>7);
  const closed = state.rem.filter(r=>r.closed);
  let h = `<div class="card"><div class="card-h"><h2>${list.length?"تذكيراتك":"مفيش تذكيرات لسه"}</h2></div>
    ${list.length?`<div class="rsum">${over.length?`<span class="o">متأخر ${over.length}</span>`:""}<span class="w">الأسبوع ده ${week.length}</span><span>الكل ${list.length}</span></div>`:`<p class="small" style="margin:0">ضيف حاجة محتاج تفتكرها، زي زيت العربية أو شمعة الفلتر، وحدد المعاد وكل قد إيه بتتكرر.</p>`}</div>`;
  h += `<details class="ref" id="remNew" ${remEdit||!list.length?"open":""}><summary><span>${remEdit?"تعديل التذكير":"تذكير جديد"}</span>${CHEV}</summary><div>${remForm()}</div></details>`;
  const sec = (t, arr) => arr.length ? `<h3 class="sect-title">${t}</h3><ul class="rlist">${arr.map(r=>remItem(r)).join("")}</ul>` : "";
  h += sec("متأخر", over) + sec("خلال أسبوع", week) + sec("بعدين", later);
  if (closed.length) h += `<details class="ref"><summary><span>خلصت (${closed.length})</span>${CHEV}</summary><div><ul class="plain">${closed.slice(-20).reverse().map(r=>`<li>${esc(r.title)}${r.last?` · ${short(dOf(r.last))}`:""}</li>`).join("")}</ul></div></details>`;
  el.innerHTML = h;
  const rep = document.getElementById("rRep");
  if (rep) rep.addEventListener("change", ()=>{ const on = rep.value==="1"; document.getElementById("rN").disabled = !on; document.getElementById("rU").disabled = !on; });
  updateRemBadge();
}
function soonHTML(){
  if (!isToday()) return "";
  const soon = activeRem().filter(r=>daysTo(r.due)<=7);
  if (!soon.length) return "";
  return `<div class="card"><div class="card-h"><h2>جاي قريب</h2><button type="button" class="golink" data-go="rem" style="margin:0">كل التذكيرات ←</button></div>${soon.map(r=>remItem(r,true)).join("")}</div>`;
}
function icsFor(r){
  const d = r.due.replace(/-/g,""), stamp = new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+Z$/,"Z");
  const e2 = t => String(t).replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\n/g,"\\n");
  const freq = r.every ? {d:"DAILY",w:"WEEKLY",m:"MONTHLY",y:"YEARLY"}[r.every.u] : null;
  return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//LifeBase//AR","CALSCALE:GREGORIAN","BEGIN:VEVENT",
    `UID:${r.id}@lifebase`, `DTSTAMP:${stamp}`, `DTSTART:${d}T100000`, `DTEND:${d}T103000`,
    `SUMMARY:${e2(r.title)}`, r.note?`DESCRIPTION:${e2(r.note)}`:"", freq?`RRULE:FREQ=${freq};INTERVAL=${r.every.n}`:"",
    "BEGIN:VALARM","ACTION:DISPLAY",`DESCRIPTION:${e2("بعد أسبوع: "+r.title)}`,"TRIGGER:-P7D","END:VALARM",
    "BEGIN:VALARM","ACTION:DISPLAY",`DESCRIPTION:${e2("بكرة: "+r.title)}`,"TRIGGER:-P1D","END:VALARM",
    "END:VEVENT","END:VCALENDAR"].filter(Boolean).join("\r\n");
}
function downloadIcs(r){
  const blob = new Blob([icsFor(r)], {type:"text/calendar"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${r.title.replace(/[\\/:*?"<>|]/g,"").slice(0,40) || "reminder"}.ics`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
}
document.addEventListener("submit", e => {
  if (e.target.id !== "remForm") return;
  e.preventDefault();
  const title = document.getElementById("rTitle").value.trim(), due = document.getElementById("rDue").value;
  if (!title || !due) return;
  const rep = document.getElementById("rRep").value === "1";
  const n = Math.max(1, Math.min(99, parseInt(document.getElementById("rN").value, 10) || 1));
  const o = {title, cat: document.getElementById("rCat").value, due, every: rep ? {n, u: document.getElementById("rU").value} : null, note: document.getElementById("rNote").value.trim()};
  if (remEdit){ const r = state.rem.find(x=>x.id===remEdit); if (r) Object.assign(r, o); remEdit = null; }
  else state.rem.push(Object.assign({id: "r"+Date.now().toString(36)+Math.random().toString(36).slice(2,5)}, o));
  save(); renderRem();
});
document.addEventListener("click", e => {
  const t = e.target.closest("[data-tpl]");
  if (t){ const x = TEMPLATES[+t.dataset.tpl];
    document.getElementById("rTitle").value = x.title; document.getElementById("rCat").value = x.cat;
    document.getElementById("rRep").value = "1"; document.getElementById("rN").disabled = false; document.getElementById("rU").disabled = false;
    document.getElementById("rN").value = x.n; document.getElementById("rU").value = x.u;
    document.getElementById("rDue").value = addInterval(iso(today), x.n, x.u); return; }
  const dn = e.target.closest("[data-rdone]");
  if (dn){ const r = state.rem.find(x=>x.id===dn.dataset.rdone); if (!r) return;
    r.last = iso(today);
    if (r.every) r.due = addInterval(iso(today), r.every.n, r.every.u); else r.closed = true;
    save(); renderScreen(); return; }
  const ic = e.target.closest("[data-rics]");
  if (ic){ const r = state.rem.find(x=>x.id===ic.dataset.rics); if (r) downloadIcs(r); return; }
  const ed = e.target.closest("[data-redit]");
  if (ed){ remEdit = ed.dataset.redit; renderRem(); const n = document.getElementById("remNew"); if (n) n.scrollIntoView({block:"start"}); return; }
  if (e.target.closest("[data-rcancel]")){ remEdit = null; renderRem(); return; }
  const dl = e.target.closest("[data-rdel]");
  if (dl){ const id = dl.dataset.rdel;
    if (remDel !== id){ remDel = id; renderRem(); setTimeout(()=>{ if (remDel===id){ remDel = null; if (screen==="rem") renderRem(); } }, 4000); return; }
    state.rem = state.rem.filter(x=>x.id!==id); remDel = null; save(); renderRem(); return; }
});
