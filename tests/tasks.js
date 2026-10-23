// Tasks in lists: migration of old per-day to-dos, lists, dates or none, star, late, Today card, swipe, edit, delete list.
const { chromium } = require('playwright');
const SP = process.env.SP || require('os').tmpdir(), URL = process.env.URL || 'http://localhost:8777/';
const out = {}, errs = [];
const watch = (p, tag) => { p.on('pageerror', e => errs.push(tag+' page: '+e.message)); p.on('console', m => { if (m.type()==='error' && !/Failed to load resource|fonts\.g/.test(m.text())) errs.push(tag+' console: '+m.text()); }); };
(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const ctx = await b.newContext({viewport:{width:390,height:844}, deviceScaleFactor:2, serviceWorkers:'block', timezoneId:'Africa/Cairo'});
  const p = await ctx.newPage(); watch(p,'A');
  await p.clock.install({time: new Date('2026-10-23T10:00:00+03:00')});   // Friday
  await p.goto(URL + 'manifest.webmanifest');
  await p.evaluate(() => {
    localStorage.clear();
    // the old format: to-dos per day; one carried from the 20th, one done yesterday, one for tomorrow
    localStorage.setItem('lb:data', JSON.stringify({v:3, updatedAt:Date.now(), lastBackup:Date.now(),
      core:{checks:{}, weights:{}, body:{w:{},waist:{}}, quran:{page:1,hifz:{}}, rem:[], prefs:{},
        todos:{'2026-10-23':[{id:'a',text:'كلم التوكيل',done:false,from:'2026-10-20'},{id:'b',text:'ادفع النت',done:false}], '2026-10-22':[{id:'c',text:'اشتري لبن',done:true}], '2026-10-24':[{id:'d',text:'غسيل العربية',done:false}]}},
      money:{entries:[], goals:[], cats:[]}}));
    localStorage.setItem('lb:ob','1'); localStorage.setItem('lb:theme', JSON.stringify('light'));
  });
  await p.goto(URL + '#today'); await p.waitForTimeout(800);
  out.migrated = await p.evaluate(() => state.tasks.items.map(x => `${x.text}|${x.due}|${x.done ? 'done' : ''}|${x.list}`));
  out.lists = await p.evaluate(() => state.tasks.lists.map(l => l.name));
  out.todayCard = await p.$$eval('[data-card="tasks"] .td', l => l.map(x => x.innerText.replace(/\s+/g,' ').trim()));
  // add from the Today card: due today
  await p.fill('[data-card="tasks"] [data-taskform] input', 'احجز الدكتور'); await p.press('[data-card="tasks"] [data-taskform] input', 'Enter'); await p.waitForTimeout(120);
  out.todayAfterAdd = await p.$$eval('[data-card="tasks"] .ttl', l => l.map(x => x.textContent));
  await p.screenshot({path:SP+'/p4-today.png', fullPage:true});
  // tasks page
  await p.evaluate(() => go('tasks')); await p.waitForTimeout(150);
  out.groups = await p.$$eval('#scr-tasks section.card h2', l => l.map(x => x.textContent));
  // add without a date from the quick form
  await p.fill('#scr-tasks [data-taskform] input', 'اقرا كتاب العادات'); await p.press('#scr-tasks [data-taskform] input', 'Enter'); await p.waitForTimeout(120);
  // new list + task in it
  await p.click('[data-tlistnew]'); await p.fill('#lsName', 'مشتريات'); await p.click('#listSheet button.primary'); await p.waitForTimeout(120);
  out.viewAfterNewList = await p.$eval('#scr-tasks .card-h h2', x => x.textContent);
  await p.fill('#scr-tasks [data-taskform] input', 'زيت زيتون'); await p.press('#scr-tasks [data-taskform] input', 'Enter'); await p.waitForTimeout(120);
  // a dated task with a star via the sheet
  await p.click('[data-todonew]'); await p.waitForTimeout(100);
  await p.fill('#tsText', 'هدية عيد ميلاد'); await p.click('[data-tsday=""]'); await p.click('label.toggle:has(#tsStar)'); await p.click('#todoSheet button.primary'); await p.waitForTimeout(150);
  out.items = await p.evaluate(() => state.tasks.items.map(x => `${x.text}|${x.due || '-'}|${x.star ? '★' : ''}|${listOf(x.list).name}`));
  await p.screenshot({path:SP+'/p4-list.png', fullPage:true});
  await p.click('[data-tview="all"]'); await p.waitForTimeout(120);
  out.allGroups = await p.$$eval('#scr-tasks section.card', l => l.slice(1).map(x => x.querySelector('h2').textContent + ': ' + [...x.querySelectorAll('.ttl')].map(t => t.textContent).join(', ')));
  out.chips = await p.$$eval('.tlists .chip', l => l.map(x => x.innerText.replace(/\s+/g,' ').trim()));
  await p.screenshot({path:SP+'/p4-all.png', fullPage:true});
  // star an undated task → it shows on Today
  await p.click('[data-swipe] .td-t:has-text("اقرا كتاب العادات") ~ [data-tstar]'); await p.waitForTimeout(100);
  // edit: move "غسيل العربية" to today
  await p.click('.td-t:has-text("غسيل العربية")'); await p.waitForTimeout(100);
  await p.click('[data-tsday="2026-10-23"]'); await p.click('#todoSheet button.primary'); await p.waitForTimeout(120);
  await p.evaluate(() => go('today')); await p.waitForTimeout(150);
  out.todayFinal = await p.$$eval('[data-card="tasks"] .td', l => l.map(x => x.innerText.replace(/\s+/g,' ').trim()));
  out.todayMeta = await p.$eval('[data-card="tasks"] .card-h .small', x => x.textContent);
  // finish the late one with the checkbox; it stays (struck) for today
  await p.click('[data-card="tasks"] .td:has-text("كلم التوكيل") .ck'); await p.waitForTimeout(120);
  out.afterDone = await p.$$eval('[data-card="tasks"] .td.is-done .ttl', l => l.map(x => x.textContent));
  await p.screenshot({path:SP+'/p4-today2.png', fullPage:true});
  // tomorrow: the late one isn't there, only what's due
  await p.evaluate(() => shiftDay(1)); await p.waitForTimeout(100);
  out.tomorrowCard = await p.$$eval('[data-card="tasks"] .ttl', l => l.map(x => x.textContent));
  await p.evaluate(() => { current = ORDER[today.getDay()]; renderScreen(); });
  // delete the list "مشتريات": its task moves to عام
  await p.evaluate(() => go('tasks')); await p.click('[data-tview]:has-text("مشتريات")'); await p.click('[data-tlistedit]'); await p.click('[data-tlistdel]'); await p.waitForTimeout(120);
  out.afterListDelete = await p.evaluate(() => ({lists:state.tasks.lists.map(l => l.name), oil:listOf(state.tasks.items.find(x => x.text === 'زيت زيتون').list).name}));
  // swipe left deletes, undo brings it back
  const row = await p.$('#scr-tasks .td >> nth=0'); const bb = await row.boundingBox();
  const name = await row.$eval('.ttl', x => x.textContent);
  await p.mouse.move(bb.x + 250, bb.y + bb.height/2); await p.mouse.down(); await p.mouse.move(bb.x + 180, bb.y + bb.height/2, {steps:4}); await p.mouse.move(bb.x + 80, bb.y + bb.height/2, {steps:6}); await p.mouse.up(); await p.waitForTimeout(200);
  out.swipeDeleted = await p.evaluate(n => !state.tasks.items.some(x => x.text === n), name);
  await p.click('.toast-act'); await p.waitForTimeout(100);
  out.undo = await p.evaluate(n => state.tasks.items.some(x => x.text === n), name);
  // quick add from + defaults: on Today = today, elsewhere = no date
  await p.click('#fab'); await p.click('[data-quick="todo"]'); out.fabDefaultTasks = await p.$eval('[data-tsday][aria-pressed="true"]', x => x.textContent); await p.keyboard.press('Escape');
  await p.evaluate(() => go('today')); await p.click('#fab'); await p.click('[data-quick="todo"]'); out.fabDefaultToday = await p.$eval('[data-tsday][aria-pressed="true"]', x => x.textContent); await p.keyboard.press('Escape');
  // reload keeps everything; dark screenshot
  await p.reload(); await p.waitForTimeout(600);
  out.afterReload = await p.evaluate(() => state.tasks.items.length + ' items, ' + state.tasks.lists.length + ' lists');
  await p.evaluate(() => { setTheme('dark'); go('tasks'); }); await p.waitForTimeout(150);
  await p.screenshot({path:SP+'/p4-dark.png', fullPage:true});
  out.errors = errs;
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})().catch(e => { console.error('FAILED', e.message); console.log(JSON.stringify({out, errs}, null, 1)); process.exit(1); });
