// Phase 3 check: Mans's plan carried over, prayer times, plan editor, modules, and a brand-new person's setup.
const { chromium } = require('playwright');
const SP = process.env.SP || require('os').tmpdir(), URL = process.env.URL || 'http://localhost:8777/';
const out = {}, errs = [];
const watch = (p, tag) => { p.on('pageerror', e => errs.push(tag+' page: '+e.message)); p.on('console', m => { if (m.type()==='error' && !/Failed to load resource|fonts\.g/.test(m.text())) errs.push(tag+' console: '+m.text()); }); };
(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  // ---------- A: Mans (data from phase 2, no plan yet) ----------
  const ctx = await b.newContext({viewport:{width:390,height:844}, deviceScaleFactor:2, serviceWorkers:'block', timezoneId:'Africa/Cairo', geolocation:{latitude:30.0444, longitude:31.2357}, permissions:['geolocation']});
  const p = await ctx.newPage(); watch(p,'A');
  await p.clock.install({time: new Date('2026-10-22T16:30:00+03:00')});   // Thursday 4:30 pm
  await p.goto(URL + 'manifest.webmanifest');
  await p.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('lb:data', JSON.stringify({v:3, updatedAt:Date.now(), lastBackup:Date.now(), core:{checks:{'2026-10-22':{t6:true,p1:true,h2:true}}, weights:{}, body:{w:{'2026-10-20':99.4},waist:{}}, quran:{page:80,hifz:{}}, todos:{}, rem:[], prefs:{}}, money:{entries:[], goals:[], cats:[]}}));
    localStorage.setItem('lb:ob','1'); localStorage.setItem('lb:theme', JSON.stringify('light'));
  });
  await p.goto(URL + '#sched'); await p.waitForTimeout(800);
  out.setupShownForMans = await p.isVisible('#setup');
  out.schedTimes = await p.$$eval('#scr-sched .tl .t', l => l.map(x => x.textContent).slice(0, 14).join(' | '));
  out.gymChecked = await p.$eval('[data-row="t6"] .ck', x => x.checked).catch(() => 'missing');
  out.planDays = await p.evaluate(() => state.plan.days.map(d => d.id + ':' + d.k + ':' + d.tl.length + (d.tread ? '' : ':noTread')).join(' '));
  await p.evaluate(() => go('train')); await p.waitForTimeout(150);
  out.trainCount = await p.$eval('#scr-train .wo-head [data-cnt]', x => x.textContent);
  out.trainTime = await p.$eval('#scr-train .card .small .num', x => x.textContent).catch(()=>null);
  await p.evaluate(() => go('week')); await p.waitForTimeout(120);
  out.weekCells = await p.$$eval('#wkCells .cell', l => l.map(x => x.innerText.replace(/\s+/g,' ')));
  await p.evaluate(() => go('ref')); await p.waitForTimeout(120);
  out.targets = await p.$$eval('#targetsCard .cell', l => l.map(x => x.innerText.replace(/\s+/g,' ')));
  // today: city prompt, then pick Cairo
  await p.evaluate(() => go('today')); await p.waitForTimeout(150);
  out.attentionBefore = await p.$$eval('.attn .att b', l => l.map(x => x.textContent));
  await p.click('[data-locsheet]'); await p.waitForTimeout(120);
  await p.selectOption('#locCity', {label:'القاهرة'}); await p.waitForTimeout(150);
  out.preview = await p.$$eval('.ptimes div', l => l.map(x => x.innerText.replace(/\s+/g,' ')));
  await p.screenshot({path:SP+'/p3-loc.png'});
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  out.attentionAfter = await p.$$eval('.attn .att b', l => l.map(x => x.textContent));
  out.hero = await p.$eval('#hero', x => x.innerText.replace(/\s+/g,' '));
  out.prayerButtons = await p.$$eval('.pr', l => l.map(x => x.innerText.replace(/\s+/g,' ')));
  await p.screenshot({path:SP+'/p3-today.png', fullPage:true});
  await p.click('[data-prdue]'); await p.waitForTimeout(100);
  out.asrMarked = await p.evaluate(() => !!state.checks['2026-10-22'].p3);
  // GPS button works too
  await p.click('[data-quick]').catch(()=>{});
  await p.evaluate(() => openLocSheet()); await p.click('[data-loc="gps"]'); await p.waitForTimeout(400);
  out.gpsLoc = await p.evaluate(() => state.profile.loc);
  await p.keyboard.press('Escape');

  // ---------- plan editor ----------
  await p.evaluate(() => go('myplan')); await p.waitForTimeout(150);
  out.meSub = await p.$$eval('#subnav button', l => l.map(x => x.textContent));
  await p.screenshot({path:SP+'/p3-myplan.png', fullPage:true});
  await p.click('[data-editday="sat"]'); await p.waitForTimeout(150);
  await p.screenshot({path:SP+'/p3-day.png', fullPage:true});
  await p.fill('[data-dayf="k"]', 'وقاية + مشي');
  await p.click('[data-item=""]'); await p.waitForTimeout(100);
  await p.fill('#itemForm [name=t]', 'مشي في النادي'); await p.fill('#itemForm [name=s]', '17:30'); await p.fill('#itemForm [name=e]', '18:15'); await p.selectOption('#itemForm [name=k]', 'gym');
  await p.screenshot({path:SP+'/p3-item.png'});
  await p.click('#itemForm button.primary'); await p.waitForTimeout(120);
  out.satItems = await p.$$eval('#scr-myplan .prow .tt', l => l.map(x => x.textContent).join(' | '));
  // add an exercise from the library, then apply a ready session
  await p.click('[data-exedit="ex:new"]'); await p.fill('#exForm [name=n]', 'Leg Press'); await p.click('#exForm button.primary'); await p.waitForTimeout(100);
  out.satEx = await p.evaluate(() => dayOf('sat').ex.map(e => e.n + ':' + e.k));
  await p.click('[data-session="push"]'); await p.waitForTimeout(100);
  out.satAfterSession = await p.evaluate(() => dayOf('sat').ex.length + ' ' + dayOf('sat').k);
  // copy the schedule to Friday
  await p.click('[data-copyday]'); await p.click('[data-copyto="fri"]'); await p.click('[data-copygo]'); await p.waitForTimeout(100);
  out.friCopied = await p.evaluate(() => dayOf('fri').tl.length === dayOf('sat').tl.length);
  await p.click('[data-editday=""]'); await p.waitForTimeout(100);
  // habits
  await p.fill('#habitForm input', 'قريت 10 صفحات'); await p.click('#habitForm button'); await p.waitForTimeout(100);
  out.habits = await p.evaluate(() => HABITS.length);
  // targets
  await p.fill('[data-bodyf="goalHi"]', '85'); await p.fill('[data-target="protein"]', '170');
  // modules: money off
  await p.click('label.toggle:has([data-mod="money"])'); await p.waitForTimeout(100);
  out.tabsNoMoney = await p.$$eval('.tabbtn:not([hidden])', l => l.map(x => x.dataset.tab));
  await p.evaluate(() => go('today')); await p.waitForTimeout(150);
  out.cardsNoMoney = await p.$$eval('#scr-today .tcard', l => l.map(x => x.dataset.card));
  await p.click('#fab'); out.quickNoMoney = await p.$$eval('.qk', l => l.map(x => x.innerText.trim())); await p.keyboard.press('Escape');
  await p.evaluate(() => { state.profile.modules.money = true; save(); applyModules(); });
  // the edits show up in the app
  await p.evaluate(() => { current = 'sat'; go('sched'); }); await p.waitForTimeout(150);
  out.satSched = await p.$$eval('#scr-sched .tl .ttl', l => l.map(x => x.textContent).filter(t => /مشي في النادي/.test(t)));
  await p.evaluate(() => go('weight')); await p.waitForTimeout(150);
  out.weightTile = await p.$$eval('#trkTiles .l', l => l.map(x => x.textContent).join(' | '));
  // backup carries the plan
  out.backupHasPlan = await p.evaluate(() => { const x = JSON.parse(JSON.stringify({core:state})); return !!(x.core.plan && x.core.plan.days.length === 7 && x.core.profile); });

  // ---------- B: someone new ----------
  const ctx2 = await b.newContext({viewport:{width:390,height:844}, deviceScaleFactor:2, serviceWorkers:'block', timezoneId:'Africa/Cairo'});
  const q = await ctx2.newPage(); watch(q,'B');
  await q.clock.install({time: new Date('2026-10-22T09:10:00+03:00')});
  await q.goto(URL); await q.waitForTimeout(800);
  out.setupShown = await q.isVisible('#setup');
  await q.screenshot({path:SP+'/p3-setup1.png'});
  await q.fill('[data-su="name"]', 'سارة'); await q.click('[data-su-goal="fit"]'); await q.fill('[data-su="weight"]', '68'); await q.fill('[data-su="height"]', '165');
  await q.click('[data-su-nav="1"]'); await q.waitForTimeout(80);
  await q.fill('[data-su="wake"]', '07:00'); await q.fill('[data-su="sleep"]', '23:30');
  await q.click('[data-su-day="workDays"][data-id="thu"]');   // works sun–wed
  await q.fill('[data-su="workS"]', '10:00'); await q.fill('[data-su="workE"]', '18:00');
  await q.screenshot({path:SP+'/p3-setup2.png'});
  await q.click('[data-su-nav="1"]'); await q.waitForTimeout(80);
  await q.click('[data-su-day="gymDays"][data-id="mon"]');   // sun, mon, tue, thu = 4 days
  await q.fill('[data-su="gymT"]', '19:00');
  out.prog = await q.$eval('#suProg', x => x.textContent);
  await q.screenshot({path:SP+'/p3-setup3.png'});
  await q.click('[data-su-nav="1"]'); await q.waitForTimeout(80);
  await q.click('label.toggle:has([data-su-mod="quran"])');
  await q.click('[data-locsheet]'); await q.selectOption('#locCity', {label:'الإسكندرية'}); await q.keyboard.press('Escape'); await q.waitForTimeout(100);
  await q.screenshot({path:SP+'/p3-setup4.png'});
  await q.click('[data-su-nav="1"]'); await q.waitForTimeout(400);
  out.newSetupClosed = !(await q.isVisible('#setup'));
  out.newGuide = await q.isVisible('#guide'); if (out.newGuide) await q.click('#obGo');
  out.newProfile = await q.evaluate(() => state.profile);
  out.newPlan = await q.evaluate(() => state.plan.days.map(d => `${d.id}:${d.k}:${d.tl.map(t => t.s + ' ' + t.t).join(', ')}`));
  out.newHabits = await q.evaluate(() => HABITS.map(h => h[1]));
  out.newTargets = await q.evaluate(() => state.plan.targets);
  out.newTabs = await q.$$eval('.tabbtn:not([hidden])', l => l.map(x => x.dataset.tab));
  out.newMe = await q.evaluate(() => { go('settings'); return GROUPS_NAV.me.p; });
  await q.evaluate(() => go('today')); await q.waitForTimeout(150);
  await q.screenshot({path:SP+'/p3-new-today.png', fullPage:true});
  await q.evaluate(() => { current = 'sun'; go('train'); }); await q.waitForTimeout(150);
  out.newTrain = await q.$$eval('#scr-train .exc .ttl', l => l.map(x => x.textContent));
  await q.screenshot({path:SP+'/p3-new-train.png', fullPage:true});
  await q.evaluate(() => go('food')); await q.waitForTimeout(150);
  out.newFood = await q.$$eval('#scr-food .card .ttl', l => l.map(x => x.textContent));
  await q.evaluate(() => go('sched')); await q.waitForTimeout(150);
  await q.screenshot({path:SP+'/p3-new-sched.png', fullPage:true});
  await q.evaluate(() => setTheme('dark')); await q.evaluate(() => go('myplan')); await q.waitForTimeout(150);
  await q.screenshot({path:SP+'/p3-dark-myplan.png', fullPage:true});
  // reload keeps the plan and doesn't ask again
  await q.reload(); await q.waitForTimeout(700);
  out.newReloadSetup = await q.isVisible('#setup');
  // skip path
  const ctx3 = await b.newContext({viewport:{width:390,height:844}, serviceWorkers:'block'});
  const r = await ctx3.newPage(); watch(r,'C');
  await r.goto(URL); await r.waitForTimeout(700); await r.click('[data-su-skip]'); await r.waitForTimeout(300);
  out.skipPlan = await r.evaluate(() => state.profile.setup && state.plan.days.filter(d => d.ex.length).length);

  out.errors = errs;
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})().catch(e => { console.error('FAILED', e.message); console.log(JSON.stringify({out, errs}, null, 1)); process.exit(1); });
