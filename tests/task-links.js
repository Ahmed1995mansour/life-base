// Optional links on tasks.
const { chromium } = require('playwright');
const SP = process.env.SP || require('os').tmpdir(), APP = process.env.URL || 'http://localhost:8777/';
(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const ctx = await b.newContext({viewport:{width:390,height:844}, deviceScaleFactor:2, serviceWorkers:'block'});
  const p = await ctx.newPage(); const errs = [], out = {}; p.on('pageerror', e => errs.push(e.message));
  await p.goto(APP + 'manifest.webmanifest');
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('lb:data', JSON.stringify({v:3, updatedAt:Date.now(), lastBackup:Date.now(), migrated:{at:1}, core:{prefs:{noLoc:true}}, money:{entries:[]}})); localStorage.setItem('lb:ob','1'); localStorage.setItem('lb:theme','"light"'); });
  await p.goto(APP + '#tasks'); await p.waitForTimeout(700);
  // pasted with the text
  await p.fill('#scr-tasks [data-taskform] input', 'اقرا المقال ده https://www.example.com/article?id=5'); await p.press('#scr-tasks [data-taskform] input', 'Enter'); await p.waitForTimeout(100);
  // only a link
  await p.fill('#scr-tasks [data-taskform] input', 'https://github.com/Ahmed1995mansour/life-base'); await p.press('#scr-tasks [data-taskform] input', 'Enter'); await p.waitForTimeout(100);
  // no link
  await p.fill('#scr-tasks [data-taskform] input', 'اشتري لبن'); await p.press('#scr-tasks [data-taskform] input', 'Enter'); await p.waitForTimeout(100);
  // from the sheet, without https
  await p.click('[data-todonew]'); await p.fill('#tsText', 'احجز الدكتور'); await p.fill('#tsLink', 'vezeeta.com/doctor/1'); await p.click('#todoSheet button.primary'); await p.waitForTimeout(120);
  // a bad link is refused
  await p.click('[data-todonew]'); await p.fill('#tsText', 'تجربة'); await p.fill('#tsLink', 'javascript:alert(1)'); await p.click('#todoSheet button.primary'); await p.waitForTimeout(120);
  out.badToast = await p.$eval('.toast', x => x.textContent).catch(() => null); out.sheetStillOpen = await p.isVisible('#todoSheet');
  await p.keyboard.press('Escape');
  out.items = await p.evaluate(() => state.tasks.items.map(x => x.text + ' | ' + (x.link || '-')));
  out.links = await p.$$eval('.td-link', l => l.map(a => a.textContent + ' → ' + a.href + ' ' + a.target + ' ' + a.rel));
  // edit: remove a link
  await p.click('.td-t:has-text("احجز الدكتور")'); out.prefilled = await p.inputValue('#tsLink'); await p.fill('#tsLink', ''); await p.click('#todoSheet button.primary'); await p.waitForTimeout(100);
  out.afterRemove = await p.evaluate(() => state.tasks.items.find(x => x.text === 'احجز الدكتور').link || '-');
  // tapping the link doesn't open the edit sheet or finish the task
  const [popup] = await Promise.all([ctx.waitForEvent('page').catch(() => null), p.click('.td-link >> nth=0')]);
  out.opened = popup ? popup.url() : null; out.sheetAfterLink = await p.isVisible('#todoSheet');
  await p.screenshot({path:SP+'/p7-links.png', fullPage:true});
  await p.evaluate(() => { setTheme('dark'); }); await p.screenshot({path:SP+'/p7-dark.png', fullPage:true});
  out.errors = errs; console.log(JSON.stringify(out, null, 1)); await b.close();
})();
