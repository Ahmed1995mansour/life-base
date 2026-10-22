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
  trend:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 18l6-6 4 4 6-8"/></svg>`
};

/* ---------- toast ---------- */
function toast(msg){
  const r = $("toastRoot");
  r.innerHTML = `<div class="toast" role="status">${esc(msg)}</div>`;
  clearTimeout(toast.t); toast.t = setTimeout(() => r.innerHTML = "", 2600);
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
