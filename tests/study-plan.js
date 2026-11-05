// Nov 2026 study schedule: offered once on Today to someone on the older plan; keeps habits; undo works.
const { chromium } = require('playwright');
const SP = process.env.SP || require('os').tmpdir(), APP = process.env.URL || 'http://localhost:8777/';
(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const ctx = await b.newContext({viewport:{width:390,height:844}, deviceScaleFactor:2, serviceWorkers:'block', timezoneId:'Africa/Cairo'});
  const p = await ctx.newPage(); const errs = [], out = {}; p.on('pageerror', e => errs.push(e.message));
  await p.clock.install({time: new Date('2026-11-08T07:00:00+02:00')});   // Sunday morning
  await p.goto(APP + 'manifest.webmanifest');
  // an older plan: same gym days, the old work-all-day schedule, a custom habit
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('lb:ob','1'); localStorage.setItem('lb:theme','"light"');
    localStorage.setItem('lb:data', JSON.stringify({v:3, updatedAt:Date.now(), lastBackup:Date.now(), migrated:{at:1}, core:{prefs:{noLoc:true}, checks:{'2026-11-01':{h1:true}},
      plan:{v:1, days:['sun','mon','tue','wed','thu','fri','sat'].map((id,i) => ({id, k:['Upper A','رجل','راحة','Upper B','كتف ودراع','ليونة','وقاية'][i], badge:'قديم', note:'', tl:[{id:'t0', s:'05:00', e:'07:50', free:'', k:'work', t:'شغل قديم', sub:'', m:[], r:[]}], wu:null, cd:null, ex:[], abs:[], routines:[], tread:false})),
        habits:[['h1','اتوزنت'],['hX','عادة بتاعتي']], targets:{kcal:'2000'}, body:{start:100, goalLo:80, goalHi:83}}}, money:{entries:[]}})); });
  await p.goto(APP + '#today'); await p.waitForTimeout(800);
  out.offer = await p.$$eval('.attn .att b', l => l.map(x => x.textContent));
  await p.screenshot({path:SP+'/study-offer.png', fullPage:true});
  await p.click('[data-newplan="apply"]'); await p.waitForTimeout(200);
  out.after = await p.evaluate(() => ({days:DAYS.map(d => d.k).join(', '), habits:HABITS.map(h => h[1]), kcal:state.plan.targets.kcal, sun:timed(DAYS[0]).map(x => timeText(x.it) + ' ' + x.it.t).slice(0, 6)}));
  out.hero = await p.$eval('#hero', x => x.innerText.replace(/\s+/g, ' '));
  out.next = await p.$$eval('[data-card="next"] .ttl', l => l.map(x => x.textContent));
  await p.click('.toast-act'); await p.waitForTimeout(150);
  out.undo = await p.evaluate(() => DAYS[0].tl[0].t);
  await p.reload(); await p.waitForTimeout(700);
  out.offerAfterReload = await p.$$eval('.attn .att b', l => l.map(x => x.textContent));
  await p.evaluate(() => { current = 'fri'; go('sched'); }); await p.waitForTimeout(150);
  await p.screenshot({path:SP+'/study-fri.png', fullPage:true});
  out.errors = errs; console.log(JSON.stringify(out, null, 1)); await b.close();
})();
