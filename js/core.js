"use strict";
/* Shared helpers used by every part of the app: text, dates, small prefs, toast and bottom sheet. */

/* ---------- text ---------- */
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const $ = id => document.getElementById(id);
/* Arabic and Persian digits → Latin, Arabic separators → dot / nothing */
const normDigits = s => String(s||"").replace(/[٠-٩]/g, d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[۰-۹]/g, d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٬,]/g,"").replace(/٫/g,".");
function parseNum(v){ v = normDigits(String(v).trim()); return v === "" ? null : (isFinite(+v) ? +v : null); }

/* ---------- dates ---------- */
const pad = n => String(n).padStart(2,"0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const short = d => `${d.getDate()}/${d.getMonth()+1}`;
const today = new Date(); today.setHours(0,0,0,0);
let weekOffset = 0;
function weekStart(){ const d = new Date(today); d.setDate(d.getDate() - d.getDay() + weekOffset*7); return d; }
function dateOf(id){ const d = weekStart(); d.setDate(d.getDate() + ORDER.indexOf(id)); return d; }

/* ---------- where the user is ---------- */
let current = null;            // day id shown on today/train/food (set at start)
let screen = "today", seg = "weight", page = "today";

/* ---------- small preferences (theme, last page) live in localStorage; data lives in store.js ---------- */
const LS = {
  get(k){ try{ return JSON.parse(localStorage.getItem(k)||"null"); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};

/* ---------- icons ---------- */
const CHEV = `<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;
const XICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
const ICO = {
  timer:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.5 1.5M9.5 2.5h5"/></svg>`,
  prev:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>`,
  next:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg>`,
  cal:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>`,
  clock:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="9"/></svg>`,
  link:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>`,
  bell:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>`,
  list:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6.5h11M9 12h11M9 17.5h11"/><path d="M3.5 6.5l1.2 1.2L7 5.4M3.5 12l1.2 1.2L7 10.9M3.5 17.5l1.2 1.2L7 16.4"/></svg>`,
  wallet:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16.5 14.5h1"/></svg>`,
  income:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>`,
  scale:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8.5 9.5a5 5 0 0 1 7 0L12 13z"/></svg>`,
  target:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/></svg>`,
  sliders:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>`,
  up:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>`,
  down:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`,
  eye:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 5.6A9.7 9.7 0 0 1 12 5.5C18 5.5 21.5 12 21.5 12a17 17 0 0 1-3 3.8M6.2 7.6A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4-.9"/></svg>`,
  moon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>`,
  trend:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 18l6-6 4 4 6-8"/></svg>`
};

/* ---------- toast (with an optional action such as "تراجع") ---------- */
function toast(msg, action, fn){
  const r = $("toastRoot");
  r.innerHTML = `<div class="toast" role="status"><span>${esc(msg)}</span>${action ? `<button type="button" class="toast-act">${esc(action)}</button>` : ""}</div>`;
  if (action) r.querySelector(".toast-act").onclick = () => { r.innerHTML = ""; fn(); };
  clearTimeout(toast.t); toast.t = setTimeout(() => r.innerHTML = "", action ? 5000 : 2600);
}
/* a short tap feeling on phones that support it */
const buzz = (ms = 10) => { try { navigator.vibrate && navigator.vibrate(ms); } catch(e){} };

/* ---------- empty state: icon, title, one line, optional action ---------- */
function emptyState(icon, title, text, action){
  return `<div class="card empty-state"><span class="es-ic">${ICO[icon] || ""}</span><h2>${esc(title)}</h2><p>${esc(text)}</p>${action || ""}</div>`;
}

/* ---------- bottom sheet ---------- */
let sheetBack = null;
function openSheet(html, label){
  sheetBack = document.activeElement;
  $("sheetRoot").innerHTML = `<div class="backdrop" data-sheet-close></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(label||"")}"><div class="grab"></div>${html}</div>`;
  document.body.classList.add("locked");
}
function closeSheet(){
  if (!$("sheetRoot").innerHTML) return;
  $("sheetRoot").innerHTML = "";
  document.body.classList.remove("locked");
  try { sheetBack && sheetBack.focus && sheetBack.focus({preventScroll:true}); } catch(e){}
}
document.addEventListener("click", e => { if (e.target.closest("[data-sheet-close]")) closeSheet(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });
