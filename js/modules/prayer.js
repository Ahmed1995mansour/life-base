"use strict";
/* ===================== PRAYER TIMES: calculated on the phone from your city (no internet needed) ===================== */
const CITIES = [
  ["القاهرة",30.0444,31.2357],["الجيزة",30.0131,31.2089],["الإسكندرية",31.2001,29.9187],["المنصورة",31.0409,31.3785],["طنطا",30.7865,31.0004],
  ["الزقازيق",30.5877,31.502],["بنها",30.4659,31.1848],["المنيا",28.1099,30.7503],["أسيوط",27.1783,31.1859],["سوهاج",26.5591,31.6948],
  ["الأقصر",25.6872,32.6396],["أسوان",24.0889,32.8998],["بورسعيد",31.2653,32.3019],["السويس",29.9668,32.5498],["الإسماعيلية",30.5965,32.2715],
  ["الغردقة",27.2579,33.8116],["شرم الشيخ",27.9158,34.33],["مكة",21.3891,39.8579],["المدينة",24.5247,39.5692],["الرياض",24.7136,46.6753],
  ["جدة",21.4858,39.1925],["دبي",25.2048,55.2708],["أبوظبي",24.4539,54.3773],["الدوحة",25.2854,51.531],["الكويت",29.3759,47.9774],["عمّان",31.9454,35.9284]
];
const METHODS = {Egyptian:"الهيئة المصرية", UmmAlQura:"أم القرى (السعودية)", Dubai:"دبي", Qatar:"قطر", Kuwait:"الكويت", MuslimWorldLeague:"رابطة العالم الإسلامي"};
const PKEYS = ["fajr","dhuhr","asr","maghrib","isha"];

/* {p1: Date, …, p5: Date} for a day, or null when no city is set */
function prayerTimes(date){
  const L = state.profile.loc; if (!L || !window.adhan) return null;
  try {
    const A = window.adhan, params = (A.CalculationMethod[state.profile.method] || A.CalculationMethod.Egyptian)();
    const t = new A.PrayerTimes(new A.Coordinates(L.lat, L.lng), date || new Date(), params);
    const out = {}; PKEYS.forEach((k, i) => out["p" + (i+1)] = t[k]);
    return out;
  } catch(e){ return null; }
}
const clock = d => { const h = d.getHours(), m = d.getMinutes(); return `${(h % 12) || 12}:${pad(m)}`; };

/* the next prayer today (or tomorrow's fajr) */
function nextPrayer(){
  const now = new Date(), t = prayerTimes(now); if (!t) return null;
  for (let i = 1; i <= 5; i++) if (t["p"+i] > now) return {id:"p"+i, name:PRAYERS[i-1][1], at:t["p"+i]};
  const tm = new Date(now); tm.setDate(tm.getDate() + 1);
  const t2 = prayerTimes(tm); return t2 ? {id:"p1", name:PRAYERS[0][1], at:t2.p1, tomorrow:true} : null;
}
/* the prayer whose time has come (at least 15 minutes ago) and isn't marked yet */
function duePrayer(){
  if (!isToday()) return null;
  const now = new Date(), t = prayerTimes(now); if (!t) return null;
  const c = checksOf(curDate());
  for (let i = 5; i >= 1; i--){
    if (t["p"+i] <= now){
      if (c["p"+i] || now - t["p"+i] < 15 * 60e3) return null;
      return {n:i, name:PRAYERS[i-1][1], at:t["p"+i]};
    }
  }
  return null;
}

/* city / location picker (sheet) */
function openLocSheet(){
  const L = state.profile.loc, m = state.profile.method;
  openSheet(`<h2 class="sheet-t">مواقيت الصلاة</h2>
    <p class="small" style="margin:-6px 0 0">المواقيت بتتحسب على الموبايل من مكانك، من غير نت.</p>
    <button type="button" class="btn soft lg" data-loc="gps">استخدم مكاني الحالي</button>
    <label class="lbl">أو اختار مدينتك<select class="input" id="locCity"><option value="">—</option>${CITIES.map(([n], i) => `<option value="${i}" ${L && L.name === n ? "selected" : ""}>${n}</option>`).join("")}</select></label>
    <label class="lbl">طريقة الحساب<select class="input" id="locMethod">${Object.entries(METHODS).map(([k, n]) => `<option value="${k}" ${k === m ? "selected" : ""}>${n}</option>`).join("")}</select></label>
    <div id="locPrev">${prayerPreview()}</div>
    <button type="button" class="btn primary lg" data-sheet-close>تمام</button>`, "مواقيت الصلاة");
}
function prayerPreview(){
  const t = prayerTimes(new Date()); if (!t) return `<p class="small" style="margin:0">اختار مدينتك عشان تظهر المواقيت.</p>`;
  return `<div class="ptimes">${PRAYERS.map(([id, n]) => `<div><span>${n}</span><b class="num">${clock(t[id])}</b></div>`).join("")}</div>
    <p class="small" style="margin:6px 0 0">${esc(state.profile.loc.name || "")}</p>`;
}
function setLoc(loc){ state.profile.loc = loc; save(); const p = $("locPrev"); if (p) p.innerHTML = prayerPreview(); renderScreen(); if (su) renderSetup(); }
document.addEventListener("change", e => {
  if (e.target.id === "locCity" && e.target.value !== ""){ const [n, lat, lng] = CITIES[+e.target.value]; setLoc({name:n, lat, lng}); }
  if (e.target.id === "locMethod"){ state.profile.method = e.target.value; setLoc(state.profile.loc); }
});
document.addEventListener("click", e => {
  if (e.target.closest("[data-locsheet]")){ openLocSheet(); return; }
  if (!e.target.closest('[data-loc="gps"]')) return;
  if (!navigator.geolocation){ toast("الموبايل مش بيدّي المكان. اختار مدينتك"); return; }
  toast("بنحدد مكانك…");
  navigator.geolocation.getCurrentPosition(
    p => { setLoc({name:"مكانك الحالي", lat:+p.coords.latitude.toFixed(4), lng:+p.coords.longitude.toFixed(4)}); toast("اتحدد مكانك"); },
    () => toast("مقدرناش نحدد مكانك. اختار مدينتك من القايمة"), {timeout:15000, maximumAge:864e5});
});

/* mark a due prayer straight from Today */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-prdue]"); if (!b) return;
  const n = b.dataset.prdue, date = curDate(), c = Object.assign({}, checksOf(date));
  c["p"+n] = true; if (b.dataset.mosque) c["m"+n] = true;
  state.checks[date] = c; buzz(); save(); renderScreen();
});
