// Saving outside the browser: encrypted GitHub gist sync between two phones, restore on a fresh install, and a picked file.
// GitHub and the file picker are mocked.
const { chromium } = require('playwright');
const SP = process.env.SP || require('os').tmpdir(), APP = process.env.URL || 'http://localhost:8777/';
const out = {}, errs = [];
const watch = (p, tag) => { p.on('pageerror', e => errs.push(tag+' page: '+e.message)); p.on('console', m => { if (m.type()==='error' && !/Failed to load resource|fonts\.g/.test(m.text())) errs.push(tag+' console: '+m.text()); }); };
const gists = {}; let nextId = 1; const calls = [];
async function mockGitHub(ctx){
  await ctx.route('https://api.github.com/**', async route => {
    const req = route.request(), u = new URL(req.url()), auth = req.headers()['authorization'];
    calls.push(req.method() + ' ' + u.pathname);
    if (auth !== 'Bearer ghp_good') return route.fulfill({status:401, contentType:'application/json', body:'{"message":"Bad credentials"}'});
    if (u.pathname === '/user') return route.fulfill({json:{login:'Ahmed1995mansour'}});
    if (u.pathname === '/gists' && req.method() === 'GET') return route.fulfill({json:Object.values(gists)});
    if (u.pathname === '/gists' && req.method() === 'POST'){ const b = JSON.parse(req.postData()); const id = 'g' + nextId++; gists[id] = {id, description:b.description, public:b.public, files:{}}; for (const [n, f] of Object.entries(b.files)) gists[id].files[n] = {filename:n, content:f.content, truncated:false}; return route.fulfill({status:201, json:gists[id]}); }
    const m = u.pathname.match(/^\/gists\/(\w+)$/);
    if (m && req.method() === 'GET') return route.fulfill({json:gists[m[1]]});
    if (m && req.method() === 'PATCH'){ const b = JSON.parse(req.postData()); for (const [n, f] of Object.entries(b.files)) gists[m[1]].files[n] = {filename:n, content:f.content, truncated:false}; return route.fulfill({json:gists[m[1]]}); }
    route.fulfill({status:404, body:'{}'});
  });
}
const fakeFiles = () => {
  // a fake File System Access API: files live in window.__files; permission starts as "prompt" when __askPerm is set
  window.__files = {};
  const handle = name => ({ name, kind:'file',
    queryPermission: async () => window.__askPerm ? 'prompt' : 'granted',
    requestPermission: async () => { window.__askPerm = false; return 'granted'; },
    createWritable: async () => { let buf = ''; return {write: async t => { buf += t; }, close: async () => { window.__files[name] = buf; }}; },
    getFile: async () => ({text: async () => window.__files[name] || ''}) });
  window.showSaveFilePicker = async o => handle(o.suggestedName);
  window.showOpenFilePicker = async () => [handle(Object.keys(window.__files)[0] || 'lifebase-data.json')];
};
(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  // ---------- phone A with data ----------
  const A = await b.newContext({viewport:{width:390,height:844}, deviceScaleFactor:2, serviceWorkers:'block'});
  await mockGitHub(A); await A.addInitScript(fakeFiles);
  const p = await A.newPage(); watch(p,'A');
  await p.goto(APP + 'manifest.webmanifest');
  await p.evaluate(() => { localStorage.clear();
    localStorage.setItem('lb:data', JSON.stringify({v:3, updatedAt:Date.now(), lastBackup:Date.now(), core:{checks:{'2026-10-20':{h2:true}}, weights:{}, body:{w:{'2026-10-20':99}, waist:{}}, quran:{page:1,hifz:{}}, rem:[], prefs:{noLoc:true}, tasks:{lists:[{id:'gen',name:'عام',ts:0}], items:[{id:'x1',text:'كلم التوكيل',list:'gen',due:'',star:false,done:false,doneAt:0,ts:1}]}}, money:{entries:[], goals:[], cats:[]}}));
    localStorage.setItem('lb:ob','1'); localStorage.setItem('lb:theme', JSON.stringify('light')); });
  await p.goto(APP + '#settings'); await p.waitForTimeout(700);
  await p.screenshot({path:SP+'/p5-settings.png', fullPage:true});
  // wrong token first
  await p.click('[data-sync="setup"]'); await p.fill('#cfToken', 'ghp_bad'); await p.fill('#cfPass', 'secret12'); await p.click('#cfGo'); await p.waitForTimeout(300);
  out.badToken = await p.$eval('.toast', x => x.textContent).catch(() => null);
  await p.screenshot({path:SP+'/p5-cloudsheet.png'});
  await p.fill('#cfToken', 'ghp_good'); await p.click('#cfGo'); await p.waitForTimeout(1500);
  out.connected = await p.$eval('.toast', x => x.textContent).catch(() => null);
  const g = Object.values(gists)[0];
  out.gist = g ? {public:g.public, file:Object.keys(g.files), encrypted:!/كلم التوكيل/.test(g.files['lifebase.enc.json'].content), hasCipher:/"alg":"AES-GCM"/.test(g.files['lifebase.enc.json'].content)} : null;
  // a change on A goes up a few seconds later
  await p.evaluate(() => { addTask({text:'مهمة من الموبايل الأول'}); renderScreen(); });
  await p.waitForTimeout(5000);
  out.pushed = calls.filter(c => c.startsWith('PATCH')).length;
  // file: pick one, it gets written; then a session where Chrome asks again
  await p.click('[data-file="pick"]'); await p.waitForTimeout(400);
  out.fileWritten = await p.evaluate(() => { const f = window.__files['lifebase-data.json']; return f ? JSON.parse(f).core.tasks.items.length : 0; });
  await p.evaluate(() => { window.__askPerm = true; addTask({text:'بعد ما Chrome يسأل'}); });
  await p.waitForTimeout(3200);
  await p.evaluate(() => go('today')); await p.waitForTimeout(150);
  out.attention = await p.$$eval('.attn .att b', l => l.map(x => x.textContent));
  await p.click('.attn [data-file="ok"]'); await p.waitForTimeout(300);
  out.fileAfterOk = await p.evaluate(() => JSON.parse(window.__files['lifebase-data.json']).core.tasks.items.map(x => x.text));
  await p.evaluate(() => go('settings')); await p.waitForTimeout(150);
  out.syncCard = await p.$eval('#syncCard', x => x.innerText.replace(/\s+/g,' '));
  await p.screenshot({path:SP+'/p5-settings-on.png', fullPage:true});

  // ---------- phone B: fresh install, restore from the cloud ----------
  const B = await b.newContext({viewport:{width:390,height:844}, deviceScaleFactor:2, serviceWorkers:'block'});
  await mockGitHub(B);
  const q = await B.newPage(); watch(q,'B');
  await q.goto(APP); await q.waitForTimeout(700);
  out.bSetup = await q.isVisible('#setup');
  await q.click('[data-su-restore]'); await q.waitForTimeout(100);
  await q.screenshot({path:SP+'/p5-restore.png'});
  await q.click('[data-sync="setup"]'); await q.fill('#cfToken', 'ghp_good'); await q.fill('#cfPass', 'wrongpass'); await q.click('#cfGo'); await q.waitForTimeout(1200);
  out.bWrongPass = await q.$eval('.toast', x => x.textContent).catch(() => null);
  await q.fill('#cfToken', 'ghp_good'); await q.fill('#cfPass', 'secret12'); await q.click('#cfGo'); await q.waitForTimeout(1500);
  out.bRestored = {setupHidden:!(await q.isVisible('#setup')), tasks:await q.evaluate(() => state.tasks.items.map(x => x.text)), weight:await q.evaluate(() => state.body.w['2026-10-20'])};
  out.bToast = await q.$eval('.toast', x => x.textContent).catch(() => null);
  // B changes something; A picks it up when it comes back to the foreground
  await q.evaluate(() => { addTask({text:'مهمة من الموبايل التاني'}); });
  await q.waitForTimeout(5000);
  await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', {value:'visible', configurable:true}); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForTimeout(1500);
  out.aPulled = await p.evaluate(() => state.tasks.items.map(x => x.text));
  // reload A: still connected, nothing lost
  await p.reload(); await p.waitForTimeout(1500);
  out.aAfterReload = await p.evaluate(() => ({cloud:cloudOn(), n:state.tasks.items.length}));
  out.errors = errs;
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})().catch(e => { console.error('FAILED', e.message); console.log(JSON.stringify({out, errs, calls}, null, 1)); process.exit(1); });
