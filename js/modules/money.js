"use strict";
/* ===================== MONEY: spending, income, savings goals, categories =====================
   Pages: money (home: month summary + list), mstats (where it went), mgoals, mcats.
   Data: money = {entries:[{id,type:"out"|"in",amount,cat,sub,note,month:"YYYY-MM",ts}], goals:[...], cats:[...]} */

const PALETTE = ["#6C9BF2","#4FC1A6","#45B5C4","#9B8CF2","#F29E7E","#EC8FB5","#E9B44C","#6BB8F0","#7CC47F","#C38BE8","#F2C46C","#9AA4B5"];
const OTHER = {id:"other", name:"تانية", color:"#9AA4B5", kw:[], subs:[]};
const subsOf = (main, list) => list.map(([name, kw], i) => ({id:`${main}-${i}`, name, kw}));
const DEFAULT_CATS = [
  {id:"kids",name:"أنس",color:"#45B5C4",kw:["انس","ابني"],subs:subsOf("kids",[["حضانة",["حضان"]],["لبس",["لبس","هدوم","جزم"]],["لعب",["لعب","لعبه"]],["مستلزمات",["بامبرز","حفاض","مناديل"]]])},
  {id:"wife",name:"بسنت",color:"#EC8FB5",kw:["بسنت","مراتي","زوجتي"],subs:subsOf("wife",[["لبس",["لبس","هدوم","جزم","شنطه"]],["عناية",["كريم","ميكب","صالون","كوافير"]],["هدايا",["هديه"]]])},
  {id:"car",name:"عربية",color:"#6C9BF2",kw:["عربيه"],subs:subsOf("car",[["بنزين",["بنزين","وقود"]],["تغيير زيت",["تغيير زيت","زيت عربيه","زيت موتور","فلتر"]],["صيانة",["صيانه","توكيل","ميكانيكي"]],["كاوتش",["كاوتش","اطار"]],["غسيل وركنة",["غسيل","ركنه","جراج"]]])},
  {id:"home",name:"البيت",color:"#4FC1A6",kw:[],subs:subsOf("home",[["بقالة",["مكرون","زيت","سوبر","بقال","رز","سكر","جبن","بيض","لبن","عيش","تموين","ايس كريم"]],["خضار وفاكهة",["فاكه","خضار"]],["لحوم وفراخ",["لحم","فراخ","سمك"]]])},
  {id:"bills",name:"فواتير",color:"#6BB8F0",kw:["فاتوره"],subs:subsOf("bills",[["كهربا",["كهربا"]],["مياه",["مياه"]],["غاز",["غاز"]],["نت وموبايل",["انترنت","موبايل","رصيد","باقه"]],["اشتراكات",["اشتراك"]]])},
  {id:"lux",name:"رفاهيات",color:"#9B8CF2",kw:["رفاهي"],subs:subsOf("lux",[["خروجات",["خروج","فسح","سينما","ملاهي","نادي"]],["أكل من برة",["اكل من بر","اكل بر","مطعم","دليفري","طلبات","كافيه","قهوه","شاورما","بيتزا","برجر"]],["سفر ومصايف",["سفر","مصيف","ساحل"]]])},
  {id:"me",name:"مصاريف شخصية",color:"#E9B44C",kw:["شخصي"],subs:subsOf("me",[["لبس",["لبس","هدوم","جزم","كوتش","قميص","بنطلون","تيشيرت"]],["برفان",["برفان","عطر","بيرفيوم"]],["حلاقة وعناية",["حلاق","شامبو","ديودرنت"]],["رياضة",["جيم","كوره","ملعب"]]])}
];
const LOCALE = "ar-EG-u-nu-latn";
const mui = {month:null, openEntry:null, sureDel:null, goalDel:null, openCat:null, catDel:null, subDel:null, openStat:null, newColor:PALETTE[9]};

/* ---------- helpers ---------- */
const monthKey = d => d.getFullYear() + "-" + pad(d.getMonth()+1);
mui.month = monthKey(new Date());
function shiftMonth(k, n){ const [y,m] = k.split("-").map(Number); return monthKey(new Date(y, m-1+n, 1)); }
function monthName(k, yr = true){ const [y,m] = k.split("-").map(Number); return new Date(y, m-1, 1).toLocaleDateString(LOCALE, yr ? {month:"long", year:"numeric"} : {month:"short"}); }
const mfmt = n => Math.round(n).toLocaleString("en-US");
const norm = s => String(s||"").toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/[ًٌٍَُِّْـ]/g,"").trim();
function parseAmount(s){ const m = normDigits(s).match(/\d+(\.\d+)?/); return m ? parseFloat(m[0]) : NaN; }
const splitList = s => String(s||"").split(/[،,]/).map(x => x.trim()).filter(Boolean);

/* ---------- categories ---------- */
const mains = () => [...money.cats].sort((a,b) => (a.ts||0) - (b.ts||0));
const allMains = () => [...mains(), OTHER];
const catOf = id => money.cats.find(c => c.id === id) || OTHER;
const subOf = (c, sid) => sid ? (c.subs||[]).find(s => s.id === sid) || null : null;
function mLabel(e){ const c = catOf(e.cat), s = subOf(c, e.sub); return s ? `${c.name} · ${s.name}` : c.name; }
const kwOf = o => [o.name, ...(o.kw||[])].map(norm).filter(Boolean);
function bestSub(c, t){
  let best = null, len = 0;
  (c.subs||[]).forEach(s => kwOf(s).forEach(w => { if (w.length > len && t.includes(w)){ best = s; len = w.length; } }));
  return best;
}
/* guess the category from the note: a named person or main category wins, else the most specific sub keyword */
function guess(text){
  const t = norm(text); if (!t) return {cat:"other", sub:""};
  for (const c of mains()){ if (kwOf(c).some(w => t.includes(w))){ const s = bestSub(c, t); return {cat:c.id, sub:s ? s.id : ""}; } }
  let best = null, len = 0;
  mains().forEach(c => (c.subs||[]).forEach(s => kwOf(s).forEach(w => { if (w.length > len && t.includes(w)){ best = {cat:c.id, sub:s.id}; len = w.length; } })));
  return best || {cat:"other", sub:""};
}
function parseLines(text){
  return normDigits(text).split(/\n+/).map(l => l.trim()).filter(Boolean).map(l => {
    const m = l.match(/\d+(\.\d+)?/); if (!m) return null;
    const amount = parseFloat(m[0]); if (!(amount > 0)) return null;
    const note = l.replace(m[0], "").replace(/جنيه|جنية|ج\.م/g, "").replace(/\s+/g, " ").trim();
    return {amount, note, ...guess(note)};
  }).filter(Boolean);
}
function tsForMonth(k){
  const cur = monthKey(new Date()); if (k === cur) return Date.now();
  const [y,m] = k.split("-").map(Number);
  return k > cur ? new Date(y, m-1, 1, 12).getTime() : new Date(y, m, 0, 12).getTime();
}
const catIcon = (c, cls = "") => `<span class="m-ico ${cls}" style="background:color-mix(in srgb,${c.color} 18%,transparent);color:${c.color}">${esc((c.name||"؟").trim().charAt(0))}</span>`;

/* old flat categories (مصاريفي v1) → main + sub */
const V1_MAP = {car:["car",""],home:["home",""],kids:["kids",""],out:["lux","lux-1"],fun:["lux","lux-0"],clothes:["me","me-0"],care:["me","me-1"],bills:["bills",""]};
function moneyNormalize(d){
  d = d && typeof d === "object" ? d : {};
  const out = {entries:Array.isArray(d.entries) ? d.entries.filter(e => e && e.id && +e.amount > 0) : [], goals:Array.isArray(d.goals) ? d.goals : [], cats:[]};
  if (Array.isArray(d.cats) && (d.v === 2 || d.cats.some(c => Array.isArray(c.subs)))){ out.cats = d.cats; }
  else {
    out.cats = JSON.parse(JSON.stringify(DEFAULT_CATS)).map((c,i) => ({...c, ts:i+1}));
    (Array.isArray(d.cats) ? d.cats : []).forEach((c,i) => { if (c && c.id && c.name && !out.cats.some(x => x.id === c.id)) out.cats.push({id:c.id, name:c.name, color:c.color||PALETTE[i%PALETTE.length], kw:c.kw||[], subs:[], ts:100+i}); });
    const prev = money; money = out;
    out.entries = out.entries.map(e => {
      if (e.type === "in") return e;
      if (V1_MAP[e.cat] || e.cat === "other" || !e.cat){
        const g = guess(e.note);
        if (g.cat !== "other") return {...e, cat:g.cat, sub:g.sub};
        const m = V1_MAP[e.cat]; return m ? {...e, cat:m[0], sub:m[1]} : {...e, cat:"other", sub:""};
      }
      return {...e, sub:e.sub||""};
    });
    money = prev;
  }
  out.entries.forEach(e => { e.amount = +e.amount; if (!e.month) e.month = monthKey(new Date(e.ts||Date.now())); });
  out.entries.sort((a,b) => b.ts - a.ts);
  return out;
}

/* ---------- derived ---------- */
function monthData(k){
  const es = money.entries.filter(e => e.month === k);
  const out = es.filter(e => e.type !== "in"), inc = es.filter(e => e.type === "in");
  const spent = out.reduce((s,e) => s + e.amount, 0), income = inc.reduce((s,e) => s + e.amount, 0);
  return {es, out, inc, spent, income, saved:income - spent};
}
function byCat(list){ const by = {}; list.forEach(e => { const k = catOf(e.cat).id; by[k] = (by[k]||0) + e.amount; }); return Object.entries(by).sort((a,b) => b[1] - a[1]); }
function bySub(list, cid){ const c = catOf(cid), by = {}; list.filter(e => catOf(e.cat).id === cid).forEach(e => { const s = subOf(c, e.sub); const k = s ? s.name : "بدون تفصيل"; by[k] = (by[k]||0) + e.amount; }); return Object.entries(by).sort((a,b) => b[1] - a[1]); }

/* ---------- changes ---------- */
function mPut(col, o){ money[col] = money[col].filter(x => x.id !== o.id).concat(o); if (col === "entries") money.entries.sort((a,b) => b.ts - a.ts); save(); renderScreen(); }
function mDel(col, id){ money[col] = money[col].filter(x => x.id !== id); save(); renderScreen(); }
function addEntries(list, k){
  const base = tsForMonth(k);
  list.forEach((x,i) => money.entries.push({id:uid(), type:x.type||"out", amount:x.amount, cat:x.type === "in" ? "income" : x.cat, sub:x.type === "in" ? "" : (x.sub||""), note:x.note||"", month:k, ts:base - i}));
  money.entries.sort((a,b) => b.ts - a.ts); save(); renderScreen();
}
const nextColor = () => { const used = new Set(money.cats.map(c => c.color)); return PALETTE.find(p => !used.has(p)) || PALETTE[money.cats.length % PALETTE.length]; };
function addMain(name, subs, color){
  name = (name||"").trim(); if (!name){ toast("اكتب اسم الفئة"); return null; }
  if (allMains().some(c => c.name === name)){ toast("الفئة دي موجودة"); return null; }
  const id = "c" + uid();
  const c = {id, name, color:color || nextColor(), kw:[], subs:(subs||[]).map((n,i) => ({id:`${id}-${i}`, name:n, kw:[]})), ts:Date.now()};
  money.cats.push(c); save(); toast(`اتضافت فئة ${name}`); return c;
}
function updateCat(id, fn){ const c = money.cats.find(x => x.id === id); if (!c) return; fn(c); save(); renderScreen(); }

/* ===================== render ===================== */
function moneyHero(){
  const d = monthData(mui.month), cur = monthKey(new Date()), future = mui.month > cur;
  const lbl = future ? "مصاريف متوقعة" : mui.month === cur ? "صرفت الشهر ده" : "صرفت في الشهر ده";
  const rate = d.income > 0 ? Math.round(d.saved / d.income * 100) : null;
  return `<section class="card hero hero-money">
    <div class="m-top"><span class="hero-badge">${lbl}</span>
      <div class="m-month"><button type="button" data-mmonth="-1" aria-label="الشهر اللي قبله">${ICO.prev}</button><b>${esc(monthName(mui.month))}</b><button type="button" data-mmonth="1" aria-label="الشهر اللي بعده">${ICO.next}</button></div></div>
    <div class="m-big num">${mfmt(d.spent)}<small>جنيه</small></div>
    ${d.income > 0 ? `<div class="m-meter" aria-label="المصروف من الدخل"><i class="${d.saved < 0 ? "over" : ""}" style="width:${Math.min(100, d.spent / d.income * 100)}%"></i></div>
      <div class="m-glassrow"><div class="m-glass"><span>الدخل</span><b class="num">${mfmt(d.income)}</b></div>
      <div class="m-glass"><span>${d.saved >= 0 ? "وفّرت" : "زيادة عن الدخل"}</span><b class="num">${mfmt(Math.abs(d.saved))}</b> <span class="m-rate num">${rate}%</span></div></div>`
    : `<button type="button" class="m-addinc" data-money-add="in">+ سجّل دخل الشهر عشان نحسب التوفير</button>`}
  </section>`;
}
function moneyTiles(){
  const d = monthData(mui.month), cur = monthKey(new Date());
  if (mui.month > cur || !d.out.length) return "";
  const [y,m] = mui.month.split("-").map(Number), dim = new Date(y, m, 0).getDate();
  const days = mui.month === cur ? new Date().getDate() : dim;
  const top = byCat(d.out)[0], tc = catOf(top[0]);
  const tile = (color, icon, label, v) => `<div class="tile"><span class="tile-ic" style="background:color-mix(in srgb,${color} 18%,transparent);color:${color}">${icon}</span><div class="v num">${v}</div><div class="l">${label}</div></div>`;
  let second;
  if (mui.month === cur && d.income > 0){ const left = dim - new Date().getDate() + 1, per = (d.income - d.spent) / left; second = tile("var(--money)", ICO.clock, "تقدر تصرف في اليوم", per > 0 ? mfmt(per) : "0"); }
  else second = tile(tc.color, ICO.trend, `أكتر فئة: ${esc(tc.name)}`, mfmt(top[1]));
  return `<div class="tiles tiles-2">${tile("var(--accent)", ICO.cal, "متوسط اليوم", mfmt(d.spent / days))}${second}</div>`;
}
function catPicker(selCat, selSub, act, id){
  const idAttr = id ? ` data-id="${id}"` : "";
  let h = `<div class="chips">${allMains().map(c => `<button type="button" class="chip" data-act="${act}Cat"${idAttr} data-cat="${c.id}" aria-pressed="${c.id === selCat}"><i class="dot" style="background:${c.color}"></i>${esc(c.name)}</button>`).join("")}${act === "pick" ? `<button type="button" class="chip add" data-act="newCatToggle">+ فئة جديدة</button>` : ""}</div>`;
  const c = catOf(selCat);
  if (selCat && c.subs && c.subs.length){
    h += `<span class="m-subhead"><i class="dot" style="background:${c.color}"></i>تحت ${esc(c.name)}</span>
      <div class="chips chips-sm">${c.subs.map(s => `<button type="button" class="chip" data-act="${act}Sub"${idAttr} data-sub="${s.id}" aria-pressed="${s.id === selSub}">${esc(s.name)}</button>`).join("")}</div>`;
  }
  return h;
}
function moneyList(){
  const d = monthData(mui.month);
  if (!d.es.length) return emptyState("wallet", `مفيش عمليات في ${monthName(mui.month, false)}`, "سجّل أول مصروف أو دخل للشهر ده.", `<button type="button" class="btn primary" data-money-add="out">سجّل مصروف</button>`);
  let h = "", last = "";
  d.es.forEach(e => {
    const day = new Date(e.ts).toLocaleDateString(LOCALE, {weekday:"long", day:"numeric", month:"long"});
    if (day !== last){ h += `<div class="m-day">${day}</div>`; last = day; }
    const isIn = e.type === "in", c = isIn ? {name:"دخل", color:"var(--money)"} : catOf(e.cat), lbl = isIn ? "دخل" : mLabel(e);
    const open = mui.openEntry === e.id;
    h += `<button type="button" class="m-entry" data-act="toggleEntry" data-id="${e.id}" aria-expanded="${open}">${catIcon(c)}
      <span class="m-t"><b>${esc(e.note || lbl)}</b><small>${esc(lbl)}</small></span>
      <span class="m-amt num ${isIn ? "in" : ""}">${isIn ? "+" : "−"}${mfmt(e.amount)}</span></button>`;
    if (open){
      h += `<form class="m-edit" data-entry="${e.id}" autocomplete="off">
        <div class="row2"><label class="lbl">المبلغ<input class="input" name="amt" inputmode="decimal" value="${e.amount}"></label><label class="lbl">الوصف<input class="input" name="note" value="${esc(e.note||"")}"></label></div>
        ${isIn ? "" : `<span class="small">الفئة</span>${catPicker(e.cat, e.sub, "re", e.id)}`}
        <div class="actrow"><button class="btn primary sm">احفظ</button><button type="button" class="btn sm ghost" data-act="toggleEntry" data-id="${e.id}">إلغاء</button>
        <button type="button" class="btn sm danger ${mui.sureDel === e.id ? "sure" : ""}" data-act="delEntry" data-id="${e.id}" style="margin-inline-start:auto">${mui.sureDel === e.id ? "متأكد؟ دوس تاني" : "امسح"}</button></div></form>`;
    }
  });
  return `<section class="card"><div class="card-h"><h2>العمليات</h2><span class="small num">${d.es.length} عملية</span></div><div class="m-list">${h}</div></section>`;
}
function moneyStats(){
  const d = monthData(mui.month), rows = byCat(d.out);
  let h = `<section class="card"><div class="card-h"><h2>راحت فين الفلوس</h2><span class="small">دوس على فئة تشوف تفاصيلها</span></div>`;
  if (!rows.length) h += `<p class="empty">لما تسجّل مصاريف هتظهر هنا</p>`;
  else {
    let acc = 0;
    const stops = rows.map(([k,v]) => { const c = catOf(k), a = acc / d.spent * 360; acc += v; return `${c.color} ${a}deg ${acc / d.spent * 360}deg`; }).join(",");
    h += `<div class="m-donutwrap"><div class="m-donut" style="background:conic-gradient(${stops})"><div><span class="small">الإجمالي</span><b class="num">${mfmt(d.spent)}</b><span class="small">${esc(monthName(mui.month, false))}</span></div></div></div>`;
    const max = rows[0][1];
    h += `<div class="m-cats">` + rows.map(([k,v]) => { const c = catOf(k), open = mui.openStat === k;
      return `<button type="button" class="m-cat" data-act="toggleStat" data-id="${k}" aria-expanded="${open}">${catIcon(c)}
        <span class="m-name">${esc(c.name)}<span class="m-pct num">${Math.round(v / d.spent * 100)}%</span></span><b class="num">${mfmt(v)}</b>
        <span class="m-track"><i style="width:${v / max * 100}%;background:${c.color}"></i></span></button>
        ${open ? `<div class="m-subrows">${bySub(d.out, k).map(([n,sv]) => `<div><span>${esc(n)}</span><b class="num">${mfmt(sv)}</b></div>`).join("")}</div>` : ""}`; }).join("") + `</div>`;
  }
  h += `</section>`;
  const months = [...Array(6)].map((_,i) => shiftMonth(mui.month, i - 5)), ds = months.map(monthData);
  const max = Math.max(1, ...ds.map(x => Math.max(x.spent, x.saved)));
  h += `<section class="card"><div class="card-h"><h2>آخر 6 شهور</h2></div>
    <div class="m-trend">${months.map((k,i) => { const x = ds[i]; return `<div class="m-col ${k === mui.month ? "cur" : ""}" title="${monthName(k)}">
      <div class="m-bars"><i class="s" style="height:${x.spent / max * 120}px"></i><i class="v" style="height:${Math.max(0, x.saved) / max * 120}px"></i></div><span>${monthName(k, false)}</span></div>`; }).join("")}</div>
    <div class="m-legend"><span><i class="dot" style="background:var(--spend)"></i>مصروف</span><span><i class="dot" style="background:var(--money)"></i>توفير</span></div></section>`;
  return h;
}
function moneyGoals(){
  const now = monthKey(new Date());
  let h = money.goals.length ? [...money.goals].sort((a,b) => a.ts - b.ts).map((g,i) => {
    const pct = Math.min(100, g.saved / g.target * 100), left = Math.max(0, g.target - g.saved), col = PALETTE[i % PALETTE.length];
    let per;
    if (left === 0) per = "وصلت للهدف";
    else if (g.deadline){ const [y1,m1] = now.split("-").map(Number), [y2,m2] = g.deadline.split("-").map(Number), n = (y2-y1)*12 + (m2-m1) + 1;
      per = n > 0 ? `محتاج ${mfmt(left / n)} جنيه في الشهر لحد ${monthName(g.deadline)}` : `المعاد عدّى، فاضل ${mfmt(left)}`; }
    else per = `فاضل ${mfmt(left)} جنيه`;
    return `<section class="card m-goal">
      <div class="m-ghead"><div><h2>${esc(g.name)}</h2><div class="small num">${mfmt(g.saved)} من ${mfmt(g.target)} جنيه</div></div>
        <div class="m-ring" style="background:conic-gradient(${col} ${pct * 3.6}deg,var(--line) 0)"><span class="num">${Math.round(pct)}%</span></div></div>
      <div class="small">${per}</div>
      <form class="m-gform" data-goal="${g.id}" autocomplete="off"><input class="input" inputmode="decimal" placeholder="حطّيت كام؟" aria-label="المبلغ اللي حطيته"><button class="btn sm soft">ضيف</button>
      <button type="button" class="btn sm ${mui.goalDel === g.id ? "danger sure" : "ghost"}" data-act="delGoal" data-id="${g.id}">${mui.goalDel === g.id ? "متأكد؟" : "امسح"}</button></form></section>`;
  }).join("") : emptyState("target", "لسه مفيش أهداف", "ضيف أول هدف تحت، زي مقدّم العربية أو صندوق طوارئ.");
  h += `<section class="card"><div class="card-h"><h2>هدف جديد</h2></div>
    <form id="goalForm" class="form" autocomplete="off"><input class="input" id="gName" placeholder="اسم الهدف، مثلاً: مقدّم العربية" aria-label="اسم الهدف">
      <div class="row2"><input class="input" id="gTarget" inputmode="decimal" placeholder="المبلغ" aria-label="المبلغ المطلوب"><input class="input" id="gDeadline" type="month" aria-label="عاوزه إمتى"></div>
      <button class="btn primary">ضيف الهدف</button></form></section>`;
  return h;
}
function moneyCats(){
  const map = Object.fromEntries(byCat(monthData(mui.month).out));
  const list = mains().map(c => {
    const open = mui.openCat === c.id, subs = c.subs || [];
    let h = `<button type="button" class="m-mainrow" data-act="toggleCat" data-id="${c.id}" aria-expanded="${open}">${catIcon(c)}
      <span><b>${esc(c.name)}</b><small>${subs.length ? subs.map(s => esc(s.name)).join("، ") : "مفيش فئات فرعية"}</small></span>
      <span class="m-rowend"><span class="small num">${map[c.id] ? mfmt(map[c.id]) : ""}</span>${CHEV}</span></button>`;
    if (open) h += `<div class="m-catedit">
      <label class="lbl">الاسم<input class="input" id="cn-${c.id}" value="${esc(c.name)}" autocomplete="off"></label>
      <label class="lbl">كلمات بتدل عليها<input class="input" id="ck-${c.id}" value="${esc((c.kw||[]).join("، "))}" placeholder="مثلاً: مراتي، زوجتي" autocomplete="off"></label>
      <div class="swatches">${PALETTE.map(p => `<button type="button" class="sw" style="background:${p}" data-act="catColor" data-id="${c.id}" data-color="${p}" aria-label="لون" aria-pressed="${p === c.color}"></button>`).join("")}</div>
      <span class="small">الفئات الفرعية</span>
      ${subs.map(s => `<div class="m-subline"><input class="input" id="sn-${s.id}" value="${esc(s.name)}" aria-label="اسم الفئة الفرعية" autocomplete="off">
        <button type="button" class="iconbtn ${mui.subDel === s.id ? "sure" : ""}" data-act="delSub" data-id="${c.id}" data-sub="${s.id}" aria-label="امسح الفئة الفرعية">${XICON}</button></div>`).join("")}
      <div class="m-subline"><input class="input" id="sa-${c.id}" placeholder="فئة فرعية جديدة" autocomplete="off"><button type="button" class="btn sm soft" data-act="addSub" data-id="${c.id}">ضيف</button></div>
      <div class="actrow"><button type="button" class="btn sm primary" data-act="saveCat" data-id="${c.id}">احفظ التعديلات</button>
        <button type="button" class="btn sm danger ${mui.catDel === c.id ? "sure" : ""}" data-act="delCat" data-id="${c.id}">${mui.catDel === c.id ? "متأكد؟ دوس تاني" : "امسح الفئة"}</button></div></div>`;
    return h;
  }).join("");
  return `<section class="card"><div class="card-h"><h2>الفئات</h2><span class="small">دوس على فئة علشان تعدّلها</span></div>${list}</section>
    <section class="card"><div class="card-h"><h2>فئة رئيسية جديدة</h2></div>
    <form id="catForm" class="form" autocomplete="off"><input class="input" id="cName" placeholder="اسم الفئة، مثلاً: الجيم" aria-label="اسم الفئة">
      <input class="input" id="cSubs" placeholder="الفئات الفرعية: اشتراك، بروتين، لبس رياضي" aria-label="الفئات الفرعية">
      <div class="swatches">${PALETTE.map(p => `<button type="button" class="sw" style="background:${p}" data-act="pickColor" data-color="${p}" aria-label="لون" aria-pressed="${p === mui.newColor}"></button>`).join("")}</div>
      <button class="btn primary">ضيف الفئة</button></form></section>`;
}
function renderMoney(){
  const el = $("scr-money");
  if (page === "money") el.innerHTML = moneyHero() + moneyTiles() + moneyList();
  else if (page === "mstats") el.innerHTML = moneyHero() + moneyStats();
  else if (page === "mgoals") el.innerHTML = moneyGoals();
  else el.innerHTML = moneyCats();
}

/* Today card */
function moneyCard(){
  if (!isToday()) return null;
  const t0 = today.getTime(), t1 = t0 + 864e5, d = monthData(monthKey(today));
  const todaySpent = money.entries.filter(e => e.type !== "in" && e.ts >= t0 && e.ts < t1).reduce((a,e) => a + e.amount, 0);
  const body = (money.entries.length
    ? `<div class="tiles tiles-2"><div class="tile"><div class="v num">${mfmt(todaySpent)}</div><div class="l">صرفت النهارده</div></div>
       <div class="tile"><div class="v num" style="color:var(--money)">${mfmt(d.spent)}</div><div class="l">${d.income ? `صرفت الشهر ده من ${mfmt(d.income)}` : "صرفت الشهر ده"}</div></div></div>`
    : `<p class="small" style="margin:0">لسه مفيش مصاريف متسجلة. سجّل أول مصروف وهتلاقي ملخصه هنا كل يوم.</p>`)
    + `<div class="actrow" style="margin-top:12px"><button type="button" class="btn primary" data-money-add="out">سجّل مصروف</button><button type="button" class="btn" data-money-add="in">سجّل دخل</button></div>`;
  return {t:"الفلوس", meta:"", body, link:`<button type="button" class="golink" data-go="money">افتح الفلوس ←</button>`};
}

/* ===================== add sheet ===================== */
const msheet = {mode:"out", cat:null, sub:"", touched:false, newCat:false, month:null};
function openAdd(mode){
  Object.assign(msheet, {mode:mode||"out", cat:null, sub:"", touched:false, newCat:false, month:screen === "money" ? mui.month : monthKey(new Date())});
  openSheet(`<div class="seg" role="group" aria-label="نوع العملية"><button type="button" data-mmode="out">مصروف</button><button type="button" data-mmode="in">دخل</button><button type="button" data-mmode="bulk">كذا حاجة</button></div><div id="sheetBody"></div>`, "سجّل عملية");
  renderAdd();
}
function renderAdd(){
  const b = $("sheetBody"); if (!b) return;
  document.querySelectorAll("[data-mmode]").forEach(x => x.setAttribute("aria-pressed", x.dataset.mmode === msheet.mode));
  const ml = msheet.month === monthKey(new Date()) ? "" : `<span class="small" style="text-align:center">هيتسجّل في ${esc(monthName(msheet.month))}</span>`;
  if (msheet.mode === "bulk"){
    b.innerHTML = `<form id="bulkForm" class="form">${ml}<label class="lbl">كل مصروف في سطر: المبلغ وبعده الوصف<textarea class="input" id="bulkText" rows="6" placeholder="1000 بنزين&#10;400 اكل من بره"></textarea></label>
      <div class="m-preview num" id="bulkPrev"></div><button class="btn primary lg">سجّل الكل</button></form>`;
    const t = $("bulkText");
    t.addEventListener("input", () => { $("bulkPrev").innerHTML = parseLines(t.value).map(x => `<span>${mfmt(x.amount)} · ${esc(x.note||"—")} ← ${esc(mLabel(x))}</span>`).join(""); });
    setTimeout(() => t.focus(), 80); return;
  }
  const isIn = msheet.mode === "in";
  b.innerHTML = `<form id="oneForm" class="form" autocomplete="off">${ml}
    <input class="m-amount num" id="amt" inputmode="decimal" placeholder="0" aria-label="المبلغ">
    <input class="input" id="noteIn" placeholder="${isIn ? "مرتب، شغل إضافي…" : "اتصرفت على إيه؟"}" aria-label="الوصف">
    ${isIn ? "" : `<div id="picker" class="form" style="gap:10px"></div><div id="newCatBox"></div>`}
    <button class="btn primary lg">${isIn ? "سجّل الدخل" : "سجّل"}</button></form>`;
  if (!isIn){
    paintPicker();
    const note = $("noteIn");
    note.addEventListener("input", () => { if (!msheet.touched){ const g = note.value.trim() ? guess(note.value) : {cat:null, sub:""}; msheet.cat = g.cat; msheet.sub = g.sub; paintPicker(); } });
  }
  setTimeout(() => $("amt").focus(), 80);
}
function paintPicker(){
  const el = $("picker"); if (!el) return;
  el.innerHTML = catPicker(msheet.cat, msheet.sub, "pick");
  $("newCatBox").innerHTML = msheet.newCat ? `<div class="m-subline"><input class="input" id="quickCat" placeholder="اسم الفئة الرئيسية" aria-label="اسم الفئة الجديدة" autocomplete="off"><button type="button" class="btn sm soft" data-act="quickCatSave">ضيف</button></div>` : "";
}

/* ===================== events ===================== */
document.addEventListener("click", e => {
  const add = e.target.closest("[data-money-add]"); if (add){ openAdd(add.dataset.moneyAdd); return; }
  const mm = e.target.closest("[data-mmonth]"); if (mm){ mui.month = shiftMonth(mui.month, +mm.dataset.mmonth); mui.openEntry = null; renderMoney(); return; }
  const md = e.target.closest("[data-mmode]"); if (md){ msheet.mode = md.dataset.mmode; renderAdd(); return; }
  const t = e.target.closest("[data-act]"); if (!t) return;
  const a = t.dataset.act, id = t.dataset.id;
  switch (a){
    case "pickCat": if (msheet.cat !== t.dataset.cat){ msheet.cat = t.dataset.cat; msheet.sub = ""; } msheet.touched = true; paintPicker(); break;
    case "pickSub": msheet.sub = msheet.sub === t.dataset.sub ? "" : t.dataset.sub; msheet.touched = true; paintPicker(); break;
    case "newCatToggle": msheet.newCat = !msheet.newCat; paintPicker(); if (msheet.newCat) setTimeout(() => $("quickCat").focus(), 30); break;
    case "quickCatSave": { const c = addMain($("quickCat").value, [], null); if (c){ msheet.cat = c.id; msheet.sub = ""; msheet.touched = true; msheet.newCat = false; paintPicker(); } break; }
    case "pickColor": mui.newColor = t.dataset.color; document.querySelectorAll('[data-act="pickColor"]').forEach(b => b.setAttribute("aria-pressed", b === t)); break;
    case "toggleEntry": mui.openEntry = mui.openEntry === id ? null : id; mui.sureDel = null; renderMoney(); break;
    case "reCat": { const x = money.entries.find(o => o.id === id); if (x && x.cat !== t.dataset.cat){ x.cat = t.dataset.cat; x.sub = ""; save(); renderMoney(); } break; }
    case "reSub": { const x = money.entries.find(o => o.id === id); if (x){ x.sub = x.sub === t.dataset.sub ? "" : t.dataset.sub; save(); renderMoney(); toast(`اتنقلت لـ ${mLabel(x)}`); } break; }
    case "delEntry": if (mui.sureDel !== id){ mui.sureDel = id; renderMoney(); return; } mui.openEntry = null; mui.sureDel = null; mDel("entries", id); toast("اتمسح"); break;
    case "delGoal": if (mui.goalDel !== id){ mui.goalDel = id; renderMoney(); return; } mui.goalDel = null; mDel("goals", id); toast("الهدف اتمسح"); break;
    case "toggleStat": mui.openStat = mui.openStat === id ? null : id; renderMoney(); break;
    case "toggleCat": mui.openCat = mui.openCat === id ? null : id; mui.catDel = null; mui.subDel = null; renderMoney(); break;
    case "catColor": updateCat(id, c => c.color = t.dataset.color); break;
    case "addSub": { const v = ($("sa-" + id).value || "").trim(); if (!v){ toast("اكتب اسم الفئة الفرعية"); return; }
      updateCat(id, c => { c.subs = c.subs || []; if (!c.subs.some(s => s.name === v)) c.subs.push({id:`${id}-${uid()}`, name:v, kw:[]}); }); toast(`اتضافت ${v}`); break; }
    case "delSub": { const sid = t.dataset.sub; if (mui.subDel !== sid){ mui.subDel = sid; renderMoney(); return; } mui.subDel = null;
      money.entries.forEach(x => { if (x.sub === sid) x.sub = ""; }); updateCat(id, c => c.subs = (c.subs||[]).filter(s => s.id !== sid)); toast("اتمسحت الفئة الفرعية"); break; }
    case "saveCat": { const name = ($("cn-" + id).value || "").trim(); if (!name){ toast("اكتب اسم الفئة"); return; }
      updateCat(id, c => { c.name = name; c.kw = splitList($("ck-" + id).value); (c.subs||[]).forEach(s => { const inp = $("sn-" + s.id); if (inp && inp.value.trim()) s.name = inp.value.trim(); }); }); toast("اتحفظ"); break; }
    case "delCat": if (mui.catDel !== id){ mui.catDel = id; renderMoney(); return; } mui.catDel = null; mui.openCat = null;
      money.cats = money.cats.filter(c => c.id !== id); money.entries.forEach(x => { if (x.cat === id){ x.cat = "other"; x.sub = ""; } }); save(); renderScreen(); toast("الفئة اتمسحت، مصاريفها بقت في تانية"); break;
  }
});
document.addEventListener("submit", ev => {
  const f = ev.target;
  if (f.id === "oneForm"){
    ev.preventDefault();
    const amount = parseAmount($("amt").value);
    if (!(amount > 0)){ toast("اكتب المبلغ الأول"); $("amt").focus(); return; }
    const note = $("noteIn").value.trim(), type = msheet.mode === "in" ? "in" : "out";
    let cat = msheet.cat, sub = msheet.sub;
    if (type === "out" && !cat){ const g = guess(note); cat = g.cat; sub = g.sub; }
    closeSheet(); addEntries([{type, amount, note, cat, sub}], msheet.month);
    toast(type === "in" ? `اتسجّل دخل ${mfmt(amount)}` : `اتسجّل ${mfmt(amount)} في ${mLabel({cat, sub})}`);
  } else if (f.id === "bulkForm"){
    ev.preventDefault();
    const p = parseLines($("bulkText").value);
    if (!p.length){ toast("اكتب سطر فيه مبلغ ووصف"); return; }
    closeSheet(); addEntries(p, msheet.month); toast(`اتسجّل ${p.length} مصاريف`);
  } else if (f.dataset.entry){
    ev.preventDefault();
    const x = money.entries.find(o => o.id === f.dataset.entry); if (!x) return;
    const amount = parseAmount(f.amt.value);
    if (!(amount > 0)){ toast("اكتب المبلغ"); return; }
    x.amount = amount; x.note = f.note.value.trim(); mui.openEntry = null; save(); renderScreen(); toast("اتحفظ");
  } else if (f.id === "goalForm"){
    ev.preventDefault();
    const name = $("gName").value.trim(), target = parseAmount($("gTarget").value);
    if (!name || !(target > 0)){ toast("اكتب اسم الهدف والمبلغ"); return; }
    mPut("goals", {id:uid(), name, target, saved:0, deadline:$("gDeadline").value || "", ts:Date.now()}); toast("الهدف اتضاف");
  } else if (f.id === "catForm"){
    ev.preventDefault();
    if (addMain($("cName").value, splitList($("cSubs").value), mui.newColor)){ mui.newColor = nextColor(); renderScreen(); }
  } else if (f.dataset.goal){
    ev.preventDefault();
    const g = money.goals.find(x => x.id === f.dataset.goal); if (!g) return;
    const v = parseAmount(f.querySelector("input").value); if (!(v > 0)) return;
    mPut("goals", {...g, saved:g.saved + v}); toast(`زوّدت ${mfmt(v)} على ${g.name}`);
  }
});
