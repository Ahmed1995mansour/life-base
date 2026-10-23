// Phase 2 check: new tabs, Today (attention, cards, fold, arrange, summary), quick add, tasks swipe/undo, schedule + day swipe.
const { chromium } = require('playwright');
const SP = process.env.SP || require('os').tmpdir(), URL = process.env.URL || 'http://localhost:8777/';
const out = {}, errs = [];
const watch = (p, tag) => { p.on('pageerror', e => errs.push(tag+' page: '+e.message)); p.on('console', m => { if (m.type()==='error' && !/Failed to load resource|fonts\.g/.test(m.text())) errs.push(tag+' console: '+m.text()); }); };
const seed = async (p) => {
  await p.goto(URL + 'manifest.webmanifest');
  await p.evaluate(() => {
    localStorage.clear();
    const now = new Date(), iso = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const add = n => { const d = new Date(now); d.setDate(d.getDate()+n); return iso(d); };
    const mk = iso(now).slice(0,7), day = 864e5, start = new Date(now); start.setHours(0,0,0,0);
    const entries = [{id:'i1',type:'in',amount:20000,cat:'income',sub:'',note:'مرتب',month:mk,ts:start.getTime()-day*5}];
    // small spending on earlier days of the month, a big one today
    for (let k = 1; k < now.getDate(); k++) entries.push({id:'o'+k,type:'out',amount:100,cat:'home',sub:'',note:'بقالة',month:mk,ts:start.getTime()-day*k+3600e3});
    entries.push({id:'big',type:'out',amount:1500,cat:'car',sub:'',note:'كاوتش',month:mk,ts:start.getTime()+3600e3});
    localStorage.setItem('lb:data', JSON.stringify({v:3, updatedAt:Date.now(), lastBackup:0,
      core:{checks:{}, weights:{}, body:{w:{},waist:{}}, quran:{page:50,hifz:{}}, todos:{[iso(now)]:[{id:'t1',text:'ادفع الفاتورة',done:false},{id:'t2',text:'كلم التوكيل',done:false}]},
        rem:[{id:'r1',title:'تغيير زيت العربية',cat:'car',due:iso(now),every:{n:4,u:'m'},note:''},{id:'r2',title:'ترخيص العربية',cat:'car',due:add(1),every:{n:1,u:'y'},note:''},{id:'r3',title:'باقة النت',cat:'bills',due:add(4),every:{n:1,u:'m'},note:''}], prefs:{}},
      money:{entries, goals:[], cats:[]}}));
    localStorage.setItem('lb:ob', '1'); localStorage.setItem('lb:theme', JSON.stringify('light'));
  });
};
(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const ctx = await b.newContext({viewport:{width:390,height:844}, deviceScaleFactor:2, hasTouch:true, serviceWorkers:'block'});
  const p = await ctx.newPage(); watch(p,'A');
  await p.clock.install({time: new Date(new Date().setHours(10, 20, 0, 0))});
  await seed(p);
  await p.goto(URL + '#today'); await p.waitForTimeout(800);
  out.tabs = await p.$$eval('.tabbtn', l => l.map(x => x.innerText.trim()));
  out.badge = await p.$eval('#planBadge', x => x.hidden ? null : x.textContent);
  out.hero = await p.$eval('#hero', x => x.innerText.replace(/\s+/g,' '));
  out.attention = await p.$$eval('.attn .att b', l => l.map(x => x.textContent));
  out.cards = await p.$$eval('#scr-today .tcard', l => l.map(x => x.dataset.card + ':' + x.querySelector('h2').textContent));
  out.summaryAt10 = await p.$$eval('#scr-today .card-h h2', l => l.map(x => x.textContent).filter(t => t.includes('ملخص')));
  await p.screenshot({path:SP+'/p2-today.png', fullPage:true});
  // fold the routine card, hide money, move next up — then reload: remembered
  await p.click('[data-fold="routine"]'); await p.waitForTimeout(80);
  await p.click('[data-arrange]'); await p.waitForTimeout(150);
  await p.screenshot({path:SP+'/p2-arrange.png'});
  await p.click('[data-arr="eye"][data-k="money"]'); await p.waitForTimeout(100);
  await p.click('[data-arr="up"][data-k="next"]'); await p.waitForTimeout(100);
  await p.keyboard.press('Escape');
  await p.reload(); await p.waitForTimeout(700);
  out.cardsAfter = await p.$$eval('#scr-today .tcard', l => l.map(x => x.dataset.card + (x.classList.contains('folded') ? '(folded)' : '')));
  // quick add from Today
  await p.click('#fab'); await p.waitForTimeout(150);
  out.quick = await p.$$eval('.qk', l => l.map(x => x.innerText.trim()));
  await p.screenshot({path:SP+'/p2-quick.png'});
  await p.click('[data-quick="todo"]'); await p.waitForTimeout(120);
  await p.fill('#tsText', 'اشتري هدية'); await p.click('[data-tsday]:nth-of-type(2)'); await p.click('#todoSheet button.primary'); await p.waitForTimeout(150);
  out.toastTodo = await p.$eval('.toast', x => x.innerText).catch(() => null);
  await p.click('#fab'); await p.click('[data-quick="weight"]'); await p.fill('#wsVal', '98.6'); await p.click('#wSheet button'); await p.waitForTimeout(150);
  out.weight = await p.evaluate(() => state.body.w[iso(today)]);
  await p.click('#fab'); await p.click('[data-quick="rem"]'); await p.waitForTimeout(120);
  await p.screenshot({path:SP+'/p2-remsheet.png'});
  await p.click('[data-tpl="1"]'); await p.click('#remForm button[type=submit]'); await p.waitForTimeout(150);
  out.remCount = await p.evaluate(() => state.rem.length);
  await p.click('#fab'); await p.click('[data-quick="out"]'); await p.fill('#amt', '75'); await p.fill('#noteIn', 'قهوه'); await p.click('#oneForm button.primary'); await p.waitForTimeout(150);
  out.entries = await p.evaluate(() => money.entries.length);
  // plan tab: schedule, tasks, reminders, week
  await p.click('.tabbtn[data-tab="plan"]'); await p.waitForTimeout(200);
  out.planSub = await p.$$eval('#subnav button', l => l.map(x => x.textContent + (x.getAttribute('aria-current') === 'page' ? '*' : '')));
  out.dayNavOnSched = await p.isVisible('#dayNav');
  await p.screenshot({path:SP+'/p2-sched.png'});
  const before = await p.$eval('#dayName', x => x.textContent);
  // swipe right on the schedule = next day
  await p.evaluate(() => {
    const m = document.querySelector('main .sched .card-h'); const r = m.getBoundingClientRect();
    const mk = (x, y) => new Touch({identifier:1, target:m, clientX:x, clientY:y});
    m.dispatchEvent(new TouchEvent('touchstart', {bubbles:true, touches:[mk(r.left+60, r.top+10)], changedTouches:[mk(r.left+60, r.top+10)]}));
    m.dispatchEvent(new TouchEvent('touchend', {bubbles:true, touches:[], changedTouches:[mk(r.left+220, r.top+16)]}));
  });
  await p.waitForTimeout(150);
  out.swipeDay = before + ' → ' + await p.$eval('#dayName', x => x.textContent);
  await p.click('#dayLbl');
  await p.click('#subnav [data-page="tasks"]'); await p.waitForTimeout(150);
  out.tasks = await p.$$eval('#scr-tasks .card h2', l => l.map(x => x.textContent));
  await p.screenshot({path:SP+'/p2-tasks.png', fullPage:true});
  // swipe the first task right → done
  const row = await p.$('#scr-tasks .td >> nth=0'); const bb = await row.boundingBox();
  await p.mouse.move(bb.x + 120, bb.y + bb.height/2); await p.mouse.down(); await p.mouse.move(bb.x + 170, bb.y + bb.height/2, {steps:4}); await p.mouse.move(bb.x + 260, bb.y + bb.height/2, {steps:6}); await p.mouse.up();
  await p.waitForTimeout(250);
  out.afterSwipeRight = await p.evaluate(() => tasksForDay(iso(today)).map(x => x.text + (x.done ? ' ✓' : '')));
  // swipe the second task left → deleted, then undo
  const row2 = await p.$('#scr-tasks .td >> nth=1'); const b2 = await row2.boundingBox();
  await p.mouse.move(b2.x + 250, b2.y + b2.height/2); await p.mouse.down(); await p.mouse.move(b2.x + 200, b2.y + b2.height/2, {steps:4}); await p.mouse.move(b2.x + 100, b2.y + b2.height/2, {steps:6}); await p.mouse.up();
  await p.waitForTimeout(250);
  out.afterSwipeLeft = await p.evaluate(() => tasksForDay(iso(today)).map(x => x.text));
  await p.screenshot({path:SP+'/p2-undo.png'});
  await p.click('.toast-act'); await p.waitForTimeout(150);
  out.afterUndo = await p.evaluate(() => tasksForDay(iso(today)).map(x => x.text));
  await p.click('#subnav [data-page="rem"]'); await p.waitForTimeout(150);
  out.rem = await p.$$eval('.ritem .rt b', l => l.map(x => x.textContent));
  await p.screenshot({path:SP+'/p2-rem.png', fullPage:true});
  await p.click('#subnav [data-page="week"]'); await p.waitForTimeout(150);
  out.weekVisible = await p.isVisible('#wkDays');
  // me tab
  await p.click('.tabbtn[data-tab="me"]'); await p.waitForTimeout(150);
  out.meSub = await p.$$eval('#subnav button', l => l.map(x => x.textContent));
  await p.click('#subnav [data-page="settings"]'); await p.waitForTimeout(150);
  out.settings = await p.$$eval('#scr-settings h2', l => l.map(x => x.textContent));
  await p.screenshot({path:SP+'/p2-settings.png', fullPage:true});
  // money pages still OK, FAB goes straight to expense there
  await p.click('.tabbtn[data-tab="money"]'); await p.waitForTimeout(150);
  await p.click('#fab'); await p.waitForTimeout(120); out.fabOnMoney = await p.isVisible('#oneForm'); await p.keyboard.press('Escape');
  // empty states
  await p.click('#subnav [data-page="mgoals"]'); await p.waitForTimeout(120); out.emptyGoals = await p.$eval('.empty-state h2', x => x.textContent).catch(()=>null);
  await p.screenshot({path:SP+'/p2-goals-empty.png'});

  // evening: summary card shows
  await p.clock.setFixedTime(new Date(new Date().setHours(21, 5, 0, 0)));
  await p.evaluate(() => go('today')); await p.waitForTimeout(200);
  out.summaryAt21 = await p.$$eval('#scr-today .card-h h2', l => l.map(x => x.textContent).filter(t => t.includes('ملخص')));
  out.summary = await p.$$eval('#scr-today .cells .cell', l => l.map(x => x.innerText.replace(/\s+/g,' ')));
  await p.screenshot({path:SP+'/p2-evening.png', fullPage:true});
  // dark
  await p.evaluate(() => setTheme('dark'));
  await p.screenshot({path:SP+'/p2-dark-today.png', fullPage:true});
  await p.click('#fab'); await p.waitForTimeout(120); await p.screenshot({path:SP+'/p2-dark-quick.png'}); await p.keyboard.press('Escape');
  await p.evaluate(() => go('tasks')); await p.waitForTimeout(120); await p.screenshot({path:SP+'/p2-dark-tasks.png', fullPage:true});

  out.errors = errs;
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})().catch(e => { console.error('FAILED', e.message); console.log(JSON.stringify({out, errs}, null, 1)); process.exit(1); });
