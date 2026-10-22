"use strict";
/* ---------- Quran: khatma + hifz ---------- */
const YUSUF = [
  [1,6,"رؤيا يوسف"],[7,14,"الإخوة بيتآمروا"],[15,20,"الجُب والبيع"],[21,29,"في بيت العزيز والمراودة"],
  [30,35,"نسوة المدينة والسجن"],[36,42,"رؤيا صاحبي السجن"],[43,49,"رؤيا الملك"],[50,57,"البراءة والتمكين"],
  [58,68,"الإخوة جايين مصر وبنيامين"],[69,79,"السقاية في رحل أخيه"],[80,87,"حزن يعقوب"],[88,93,"يوسف بيعرّفهم بنفسه"],
  [94,101,"لقاء الأسرة وتحقيق الرؤيا"],[102,111,"الخاتمة والعبرة"]
];
const HZ = [["t","فهمت التفسير"],["h","حفظت"],["s","سمّعت صح"]];
function renderQuran(){
  const q = state.quran || (state.quran = {page:null, hifz:{}});
  const pg = q.page, inp = document.getElementById("qPage");
  if (document.activeElement !== inp) inp.value = pg || "";
  const pct = pg ? Math.min(100, Math.round(pg/604*100)) : 0;
  document.getElementById("qBar").style.width = pct+"%";
  document.getElementById("qPct").textContent = `${pct}%`;
  if (pg){
    const left = Math.max(0, 604-pg), days = Math.ceil(left/10);
    const fin = new Date(today); fin.setDate(fin.getDate()+days);
    document.getElementById("qInfo").textContent = left ? `فاضل ${left} صفحة · هتختم تقريبًا ${short(fin)}` : "ختمت، ربنا يتقبل. ابدأ ختمة جديدة من صفحة 1.";
  } else document.getElementById("qInfo").textContent = "اكتب رقم الصفحة بعد ورد النهارده.";
  const cur = YUSUF.findIndex((_,i)=>!HZ.every(([k])=>(q.hifz[i]||{})[k]));
  document.getElementById("hRows").innerHTML = YUSUF.map(([a,b,t],i)=>{
    const st = q.hifz[i]||{};
    return `<tr class="${i===cur?"cur":""}"><td>${i+1}</td><td>${a}–${b}</td><td>${t}</td>${HZ.map(([k,l])=>
      `<td><input type="checkbox" class="ck" data-hz="${i}:${k}" aria-label="${l}: ${t}" ${st[k]?"checked":""}></td>`).join("")}</tr>`;
  }).join("");
  const done = YUSUF.filter((_,i)=>HZ.every(([k])=>(q.hifz[i]||{})[k])).length;
  const vdone = YUSUF.filter((_,i)=>(q.hifz[i]||{}).h).reduce((n,[a,b])=>n+(b-a+1),0);
  document.getElementById("hInfo").textContent = cur<0 ? "خلّصت السورة كلها، ما شاء الله" : `المقطع ${cur+1} من 14 · حفظت ${vdone} من 111 آية`;
}

document.addEventListener("input", e => {
  if (e.target.id !== "qPage") return;
  const v = parseInt(normDigits(e.target.value), 10);
  state.quran.page = (v>=1 && v<=604) ? v : null; save(); renderQuran();
});
$("hRows").addEventListener("change", e => {
  const t = e.target.dataset && e.target.dataset.hz; if (!t) return;
  e.stopPropagation();
  const [i,k] = t.split(":"), hz = state.quran.hifz;
  hz[i] = Object.assign({}, hz[i]||{}); if (e.target.checked) hz[i][k] = true; else delete hz[i][k];
  save(); renderQuran();
});
