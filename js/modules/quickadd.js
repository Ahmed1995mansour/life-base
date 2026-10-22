"use strict";
/* ===================== QUICK ADD: the + button on every screen ===================== */
const QUICK = [
  {k:"out", t:"مصروف", ic:"wallet", c:"var(--spend)", m:"money"},
  {k:"in", t:"دخل", ic:"income", c:"var(--money)", m:"money"},
  {k:"todo", t:"مهمة", ic:"list", c:"var(--accent)", m:"plan"},
  {k:"rem", t:"تذكير", ic:"bell", c:"var(--rem)", m:"plan"},
  {k:"weight", t:"وزن", ic:"scale", c:"var(--sleep)", m:"health"}
];
function openQuick(){
  openSheet(`<h2 class="sheet-t">تضيف إيه؟</h2><div class="quick">${QUICK.filter(q => state.profile.modules[q.m]).map(q => `<button type="button" class="qk" data-quick="${q.k}"><span class="qk-ic" style="color:${q.c};background:color-mix(in srgb,${q.c} 14%,transparent)">${ICO[q.ic]}</span>${q.t}</button>`).join("")}</div>`, "إضافة سريعة");
}
function openWeightSheet(){
  const t = iso(today), v = state.body.w[t];
  openSheet(`<h2 class="sheet-t">وزن النهارده</h2><form id="wSheet" class="form" autocomplete="off">
    <input class="m-amount num" id="wsVal" inputmode="decimal" placeholder="0.0" value="${v != null ? v : ""}" aria-label="الوزن بالكيلو">
    <p class="small" style="text-align:center;margin:-6px 0 0">كيلو · على الريق الصبح أدق</p>
    <button class="btn primary lg">احفظ</button></form>`, "وزن النهارده");
  setTimeout(() => $("wsVal").focus(), 80);
}
document.addEventListener("click", e => {
  const q = e.target.closest("[data-quick]"); if (!q) return;
  const k = q.dataset.quick;
  if (k === "out" || k === "in") openAdd(k);
  else if (k === "todo") openTodoSheet();
  else if (k === "rem") openRemForm();
  else if (k === "weight") openWeightSheet();
});
document.addEventListener("submit", e => {
  if (e.target.id !== "wSheet") return;
  e.preventDefault();
  const v = parseNum($("wsVal").value);
  if (v == null || v < 20 || v > 400){ toast("اكتب الوزن بالكيلو"); return; }
  const t = iso(today);
  state.body.w = Object.assign({}, state.body.w, {[t]: v});
  state.checks[t] = Object.assign({}, state.checks[t] || {}, {h1: true});
  closeSheet(); save(); renderScreen(); toast(`اتسجّل ${v} كجم`);
});
