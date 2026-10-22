"use strict";
/* ===================== FOOD: today's meals with ingredients and how to cook them ===================== */
function renderFood(){
  const day = curDay(), T = state.plan.targets;
  const meals = timed(day).filter(x => x.it.k === "food");
  const goal = [T.kcal && `حوالي ${T.kcal} سعر`, T.protein && `${T.protein} جم بروتين`].filter(Boolean).join(" و");
  let h = `<div class="card"><div class="card-h"><h2>أكل ${isToday()?"النهارده":"اليوم ده"}</h2><span class="small" data-cnt="${meals.map(x=>x.i).join(",")}"></span></div>
    <p class="small" style="margin:0">${goal ? goal + ". " : ""}علّم على كل وجبة لما تاكلها.</p></div>`;
  if (!meals.length) h += emptyState("list", "مفيش وجبات في اليوم ده", "ضيف وجبات لجدول اليوم من أنا ← خطتي.", `<button type="button" class="btn primary" data-editday="${day.id}">عدّل اليوم</button>`);
  meals.forEach(({it}) => {
    const id = it.id, rc = recipeCards(it.r);
    h += `<div class="card" data-row="${id}"><div class="card-h" style="margin-bottom:4px"><label for="ck-${id}" style="display:flex;align-items:center;gap:10px;cursor:pointer">${box(id)}<span><span class="ttl" style="font-weight:700">${esc(it.t)}</span>${it.sub?`<span class="sub">${esc(it.sub)}</span>`:""}</span></label><span class="small num" dir="ltr">${esc(timeText(it))}</span></div>
      ${it.m && it.m.length ? menuList(it.m) : ""}${rc?`<details class="more"><summary>طريقة التحضير</summary>${rc}</details>`:""}</div>`;
  });
  h += `<button type="button" class="btn" data-go="ref" data-ref="food" style="align-self:flex-start">البدائل ونصايح الأكل ←</button>`;
  $("scr-food").innerHTML = h;
  refreshMarks();
}
