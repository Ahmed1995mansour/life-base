// Daily tasks: show every day, done per day, not "late", on Today and the tasks page.
const { chromium } = require('playwright');
const SP = process.env.SP || require('os').tmpdir(), APP = process.env.URL || 'http://localhost:8777/';
(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const ctx = await b.newContext({viewport:{width:390,height:844}, deviceScaleFactor:2, serviceWorkers:'block', timezoneId:'Africa/Cairo'});
  const p = await ctx.newPage(); const errs = [], out = {}; p.on('pageerror', e => errs.push(e.message));
  await p.clock.install({time: new Date('2026-11-11T10:00:00+02:00')});
  await p.goto(APP + 'manifest.webmanifest');
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('lb:ob','1'); localStorage.setItem('lb:theme','"light"');
    localStorage.setItem('lb:data', JSON.stringify({v:3, updatedAt:Date.now(), lastBackup:Date.now(), migrated:{at:1}, core:{prefs:{noLoc:true, planV:9},
      tasks:{lists:[{id:'gen',name:'عام',ts:0}], items:[{id:'o1',text:'مهمة عادية',list:'gen',due:'2026-11-11',star:false,done:false,doneAt:0,ts:1}]}}, money:{entries:[]}})); });
  await p.goto(APP + '#tasks'); await p.waitForTimeout(700);
  // add a daily task from the page button
  await p.click('[data-todonew="daily"]'); await p.waitForTimeout(100);
  out.sheetDaily = await p.$eval('[data-tsday="daily"]', x => x.getAttribute('aria-pressed'));
  await p.fill('#tsText', 'قدّم على 3 وظايف'); await p.click('#todoSheet button.primary'); await p.waitForTimeout(150);
  // and one from the sheet chip
  await p.click('[data-todonew]:not([data-todonew="daily"])'); await p.fill('#tsText', 'ساعة LeetCode'); await p.click('[data-tsday="daily"]'); await p.click('#todoSheet button.primary'); await p.waitForTimeout(150);
  out.groups = await p.$$eval('#scr-tasks section.card', l => l.slice(1).map(x => x.querySelector('h2').textContent + ' ' + (x.querySelector('.card-h .small') || {}).textContent + ': ' + [...x.querySelectorAll('.ttl')].map(t => t.textContent).join(', ')));
  await p.screenshot({path:SP+'/daily-page.png', fullPage:true});
  // finish one today
  await p.click('.tgroup-daily .td:has-text("قدّم على 3 وظايف") .ck'); await p.waitForTimeout(120);
  out.todayDone = await p.$eval('.tgroup-daily .card-h .small', x => x.textContent);
  await p.evaluate(() => go('today')); await p.waitForTimeout(150);
  out.todayCard = await p.$$eval('[data-card="tasks"] .td', l => l.map(x => (x.classList.contains('is-done') ? '✓ ' : '') + x.querySelector('.ttl').textContent + ' · ' + ((x.querySelector('.sub') || {}).textContent || '')));
  // tomorrow: both daily tasks are there and not done
  await p.evaluate(() => shiftDay(1)); await p.waitForTimeout(100);
  out.tomorrow = await p.$$eval('[data-card="tasks"] .td', l => l.map(x => (x.classList.contains('is-done') ? '✓ ' : '') + x.querySelector('.ttl').textContent));
  // next real day: not late, fresh
  await p.clock.setFixedTime(new Date('2026-11-12T09:00:00+02:00')); await p.reload(); await p.waitForTimeout(700);
  out.nextDay = await p.$$eval('[data-card="tasks"] .td', l => l.map(x => (x.classList.contains('is-done') ? '✓ ' : '') + x.querySelector('.ttl').textContent + ((x.querySelector('.late') ? ' [late]' : ''))));
  // swipe right on a daily task marks only today
  const row = await p.$('[data-card="tasks"] .td:has-text("ساعة LeetCode")'); const bb = await row.boundingBox();
  await p.mouse.move(bb.x + 120, bb.y + bb.height/2); await p.mouse.down(); await p.mouse.move(bb.x + 170, bb.y + bb.height/2, {steps:4}); await p.mouse.move(bb.x + 260, bb.y + bb.height/2, {steps:6}); await p.mouse.up(); await p.waitForTimeout(200);
  out.doneDays = await p.evaluate(() => state.tasks.items.filter(x => x.repeat).map(x => x.text + ': ' + Object.keys(x.doneDays || {}).join(',')));
  // edit: turn a daily task into a dated one
  await p.click('.td-t:has-text("قدّم على 3 وظايف")'); out.editPressed = await p.$eval('[data-tsday="daily"]', x => x.getAttribute('aria-pressed'));
  await p.click('[data-tsday="2026-11-12"]'); await p.click('#todoSheet button.primary'); await p.waitForTimeout(120);
  out.afterEdit = await p.evaluate(() => state.tasks.items.map(x => x.text + ' | ' + (x.repeat || 'once') + ' | ' + (x.due || '-')));
  out.summary = await p.evaluate(() => tasksDoneOn('2026-11-11'));
  out.errors = errs; console.log(JSON.stringify(out, null, 1)); await b.close();
})();
