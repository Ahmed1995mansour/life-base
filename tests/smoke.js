// Phase 1 check: migration from the old apps, every page, money flows, backup round trip, both themes.
const { chromium } = require('playwright');
const fs = require('fs');
const SP = process.env.SP || require('os').tmpdir(), URL = process.env.URL || 'http://localhost:8777/';
const out = {}; const errs = [];
function watch(p, tag){
  p.on('pageerror', e => errs.push(tag+' page: '+e.message));
  p.on('console', m => { if (m.type()==='error' && !/Failed to load resource|fonts\.g/.test(m.text())) errs.push(tag+' console: '+m.text()); });
}
(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const ctx = await b.newContext({viewport:{width:390,height:844}, deviceScaleFactor:2, acceptDownloads:true, serviceWorkers:'block'});
  const p = await ctx.newPage(); watch(p,'A');
  // seed the old apps' data on this origin
  await p.goto(URL + 'manifest.webmanifest');
  await p.evaluate(async () => {
    localStorage.clear();
    const now = new Date(), mk = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
    const iso = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const t = iso(now), y = new Date(now); y.setDate(y.getDate()-1);
    const in3 = new Date(now); in3.setDate(in3.getDate()+3);
    localStorage.setItem('fit:v2', JSON.stringify({checks:{[t]:{h2:true,p1:true}}, weights:{}, body:{w:{[t]:99.2},waist:{}}, quran:{page:120,hifz:{}},
      todos:{[iso(y)]:[{id:'a',text:'اتصل بالتوكيل',done:false}]}, rem:[{id:'r1',title:'تغيير شمعة فلتر المية',cat:'home',due:iso(in3),every:{n:3,u:'m'},note:''}]}));
    localStorage.setItem('fit:theme', JSON.stringify('light'));
    const m = {v:2, updatedAt:Date.now(), lastBackup:0, entries:[
      {id:'e1',type:'out',amount:350,cat:'home',sub:'home-0',note:'سوبر ماركت',month:mk,ts:Date.now()},
      {id:'e2',type:'in',amount:20000,cat:'income',sub:'',note:'مرتب',month:mk,ts:Date.now()-86400000*2},
      {id:'e3',type:'out',amount:1000,cat:'car',sub:'car-0',note:'بنزين',month:mk,ts:Date.now()-86400000}],
      goals:[{id:'g1',name:'مقدم العربية',target:100000,saved:20000,deadline:'',ts:1}], cats:null};
    // masrouf kept its data in IndexedDB "masrouf"/kv/"data" (newer) and a localStorage mirror (older)
    await new Promise((res, rej) => { const r = indexedDB.open('masrouf', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => { const tx = r.result.transaction('kv','readwrite'); tx.objectStore('kv').put(m,'data'); tx.oncomplete = () => { r.result.close(); res(); }; }; r.onerror = rej; });
    localStorage.setItem('masrouf-data', JSON.stringify({...m, updatedAt:1, entries:[m.entries[0]]}));
  });
  // money data needs default categories (cats:null → v2 without cats): fix the seed to v2 cats from the app itself
  await p.goto(URL); await p.waitForTimeout(900);
  out.guide = await p.isVisible('#guide'); await p.click('#obGo');
  out.mirror = await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('lb:data')); return {v:d.v, entries:d.money.entries.length, cats:d.money.cats.length, rem:d.core.rem.length, migrated:!!d.migrated, w:Object.values(d.core.body.w)}; });
  out.todayCards = await p.$$eval('#scr-today .card-h h2, #scr-today .nudge b', h => h.map(x => x.textContent));
  out.todo = await p.$$eval('#todos .ttl', l => l.map(x => x.textContent));
  out.moneyCard = await p.$$eval('#scr-today .tiles .tile', c => c.map(x => x.innerText.replace(/\s+/g,' ')));
  await p.screenshot({path:SP+'/p1-today.png', fullPage:true});

  // add an expense from Today without leaving it
  await p.click('#scr-today [data-money-add="out"]'); await p.waitForTimeout(200);
  await p.fill('#amt', '٢٥٠'); await p.fill('#noteIn', 'اكل من بره'); await p.waitForTimeout(100);
  out.guessed = await p.$eval('#picker [aria-pressed="true"]', x => x.textContent).catch(()=>null);
  await p.screenshot({path:SP+'/p1-sheet.png'});
  await p.click('#oneForm button.btn.primary'); await p.waitForTimeout(250);
  out.afterAdd = {page: await p.evaluate(()=>location.hash), card: await p.$$eval('#scr-today .tiles .tile .v', c => c.map(x => x.textContent))};

  // money pages
  await p.click('.tabbtn[data-tab="money"]'); await p.waitForTimeout(250);
  out.moneySub = await p.$$eval('#subnav button', b => b.map(x => x.textContent + (x.getAttribute('aria-current')==='page'?'*':'')));
  out.fab = await p.isVisible('#fab');
  out.hero = await p.$eval('.hero-money', x => x.innerText.replace(/\s+/g,' '));
  out.entries = await p.$$eval('.m-entry', l => l.map(x => x.innerText.replace(/\s+/g,' ')));
  await p.screenshot({path:SP+'/p1-money.png', fullPage:true});
  // edit an entry
  await p.click('.m-entry >> nth=0'); await p.waitForTimeout(100);
  await p.fill('.m-edit input[name=amt]', '300'); await p.click('.m-edit button.btn.primary'); await p.waitForTimeout(150);
  out.edited = await p.$eval('.m-entry .m-amt', x => x.textContent);
  // bulk add from the FAB
  await p.click('#fab'); await p.click('[data-mmode="bulk"]'); await p.fill('#bulkText', '120 فاتورة كهربا\n60 قهوه'); await p.waitForTimeout(80);
  out.bulkPrev = await p.$$eval('#bulkPrev span', l => l.map(x => x.textContent));
  await p.click('#bulkForm button'); await p.waitForTimeout(150);
  out.count = await p.$eval('.card-h .small.num', x => x.textContent);
  // month switch
  await p.click('[data-mmonth="-1"]'); await p.waitForTimeout(100); out.prevMonth = await p.$eval('.m-month b', x => x.textContent);
  await p.click('[data-mmonth="1"]'); await p.waitForTimeout(100);
  // stats
  await p.click('#subnav [data-page="mstats"]'); await p.waitForTimeout(150);
  out.stats = await p.$$eval('.m-cat .m-name', l => l.map(x => x.textContent));
  await p.click('.m-cat >> nth=0'); await p.waitForTimeout(80); out.subrows = await p.$$eval('.m-subrows div', l => l.map(x => x.innerText.replace(/\s+/g,' ')));
  await p.screenshot({path:SP+'/p1-stats.png', fullPage:true});
  // goals
  await p.click('#subnav [data-page="mgoals"]'); await p.waitForTimeout(150);
  await p.fill('.m-gform input', '5000'); await p.click('.m-gform button.soft'); await p.waitForTimeout(100);
  out.goal = await p.$eval('.m-goal .small.num', x => x.textContent);
  await p.fill('#gName', 'صندوق طوارئ'); await p.fill('#gTarget', '30000'); await p.click('#goalForm button'); await p.waitForTimeout(100);
  out.goals = await p.$$eval('.m-goal h2', l => l.map(x => x.textContent));
  await p.screenshot({path:SP+'/p1-goals.png', fullPage:true});
  // categories
  await p.click('#subnav [data-page="mcats"]'); await p.waitForTimeout(150);
  await p.fill('#cName', 'الجيم'); await p.fill('#cSubs', 'اشتراك، بروتين'); await p.click('#catForm button.primary'); await p.waitForTimeout(100);
  out.cats = await p.$$eval('.m-mainrow b', l => l.map(x => x.textContent));
  await p.click('.m-mainrow >> nth=0'); await p.waitForTimeout(80);
  await p.screenshot({path:SP+'/p1-cats.png', fullPage:true});

  // other pages render without errors
  for (const [tab, pg] of [['health','train'],['health','food'],['health','weight'],['rem',null],['more','quran'],['more','week'],['more','ref']]){
    await p.click(`.tabbtn[data-tab="${tab}"]`); await p.waitForTimeout(120);
    if (pg) { await p.click(`#subnav [data-page="${pg}"]`); await p.waitForTimeout(150); }
    await p.screenshot({path:`${SP}/p1-${pg||tab}.png`, fullPage:true});
  }
  out.ref = await p.$eval('#dataCard', x => x.innerText.replace(/\s+/g,' '));
  out.weightRows = await p.evaluate(() => { go('weight'); return document.querySelectorAll('#trkRows tr').length; });
  out.remList = await p.evaluate(() => { go('rem'); return [...document.querySelectorAll('.ritem .rt b')].map(x => x.textContent); });

  // dark theme pass
  await p.evaluate(() => setTheme('dark'));
  for (const pg of ['today','money','mstats','rem','ref']){ await p.evaluate(x => go(x), pg); await p.waitForTimeout(120); await p.screenshot({path:`${SP}/p1-dark-${pg}.png`, fullPage:true}); }
  await p.evaluate(() => go('today')); await p.click('#scr-today [data-money-add="in"]'); await p.waitForTimeout(150);
  await p.screenshot({path:SP+'/p1-dark-sheet.png'});
  await p.keyboard.press('Escape');

  // backup round trip
  await p.evaluate(() => go('ref'));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-backup="export"]')]);
  const bpath = SP + '/p1-backup.json'; await dl.saveAs(bpath);
  const bk = JSON.parse(fs.readFileSync(bpath,'utf8'));
  out.backup = {app:bk.app, version:bk.version, entries:bk.money.entries.length, rem:bk.core.rem.length, goals:bk.money.goals.length};
  out.lastBackupSet = await p.evaluate(() => meta.lastBackup > 0);
  // IndexedDB has the doc
  out.idb = await p.evaluate(() => new Promise(res => { const r = indexedDB.open('lifebase',1); r.onsuccess = () => { const q = r.result.transaction('kv').objectStore('kv').get('doc'); q.onsuccess = () => res(q.result ? q.result.money.entries.length : -1); }; }));

  // a fresh phone: restore from the file
  const ctx2 = await b.newContext({viewport:{width:390,height:844}, serviceWorkers:'block'});
  const q = await ctx2.newPage(); watch(q,'B');
  await q.goto(URL); await q.waitForTimeout(700); await q.click('#obGo');
  out.freshEmpty = await q.evaluate(() => money.entries.length);
  await q.evaluate(() => go('ref'));
  await q.setInputFiles('#importFile', bpath); await q.waitForTimeout(300);
  out.restored = await q.evaluate(() => ({entries:money.entries.length, rem:state.rem.length, goals:money.goals.length, quran:state.quran.page}));
  // and an old masrouf backup merges
  fs.writeFileSync(SP+'/p1-masrouf.json', JSON.stringify({app:'masrouf', v:2, entries:[{id:'old1',type:'out',amount:77,cat:'other',sub:'',note:'حاجة قديمة',month:'2026-01',ts:1767261600000}], goals:[], cats:bk.money.cats}));
  await q.setInputFiles('#importFile', SP+'/p1-masrouf.json'); await q.waitForTimeout(300);
  out.merged = await q.evaluate(() => money.entries.length);
  out.toast = await q.$eval('.toast', x => x.textContent).catch(()=>null);

  // reload keeps everything (IndexedDB wins even if the mirror is wiped)
  await q.evaluate(() => localStorage.removeItem('lb:data'));
  await q.reload(); await q.waitForTimeout(700);
  out.afterWipe = await q.evaluate(() => money.entries.length);

  out.errors = errs;
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})().catch(e => { console.error('FAILED', e.message); console.log(JSON.stringify({out, errs}, null, 1)); process.exit(1); });
