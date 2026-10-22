"use strict";
/* ===================== FOOD ===================== */
function renderFood(){
  const day = curDay();
  const meals = timed(day).filter(x => x.it[1] === "food");
  let h = `<div class="card"><div class="card-h"><h2>أكل ${isToday()?"النهارده":"اليوم ده"}</h2><span class="small" data-cnt="${meals.map(x=>"t"+x.i).join(",")}"></span></div>
    <p class="small" style="margin:0">حوالي 2100–2200 سعر و160 جم بروتين. علّم على كل وجبة لما تاكلها.</p></div>`;
  meals.forEach(({i, it}) => {
    const [t,,a,b,m,r] = it, id = "t"+i;
    const rc = recipeCards(r);
    h += `<div class="card" data-row="${id}"><div class="card-h" style="margin-bottom:4px"><label for="ck-${id}" style="display:flex;align-items:center;gap:10px;cursor:pointer">${box(id)}<span><span class="ttl" style="font-weight:700">${esc(a)}</span>${b?`<span class="sub">${esc(b)}</span>`:""}</span></label><span class="small num" dir="ltr">${esc(t)}</span></div>
      ${m?menuList(m):""}${rc?`<details class="more"><summary>طريقة التحضير</summary>${rc}</details>`:""}</div>`;
  });
  h += `<button type="button" class="btn" data-go="ref" data-ref="food" style="align-self:flex-start">البدائل ونصايح الأكل ←</button>`;
  document.getElementById("scr-food").innerHTML = h;
  refreshMarks();
}
