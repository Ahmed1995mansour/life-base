const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport:{width:390,height:844}, serviceWorkers:'block'})).newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8777/manifest.webmanifest');
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('lb:ob','1'); });
  await p.goto('http://localhost:8777/'); await p.waitForTimeout(700); await p.click('[data-su-skip]'); await p.waitForTimeout(300);   // generic plan, like his phone now
  const before = await p.evaluate(() => DAYS.map(d => d.k).join(', '));
  await p.evaluate(() => go('myplan')); await p.click('[data-mansplan]'); const label = await p.textContent('[data-mansplan]'); await p.click('[data-mansplan]'); await p.waitForTimeout(150);
  const after = await p.evaluate(() => DAYS.map(d => d.k).join(', ') + ' | sun gym ' + timeText(DAYS[0].tl.find(t => t.k === 'gym')) + ' | lunch ' + timeText(DAYS[0].tl.find(t => /غدا/.test(t.t))));
  await p.click('.toast-act'); await p.waitForTimeout(100); const undo = await p.evaluate(() => DAYS.map(d => d.k).join(', '));
  console.log({before, label, after, undo, errs}); await b.close();
})();
