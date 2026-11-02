// Optional browser integration test. Playwright is a development-only tool.
// Set PLAYWRIGHT_PATH, CHROMIUM_PATH and TEST_PROFILE to local test tooling.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fixture = `<!doctype html><div id="movie_player"><video muted></video></div>
<div id="inline-preview-player"><video muted></video></div><script>
const canvas=document.createElement('canvas'); canvas.width=64; canvas.height=64;
const ctx=canvas.getContext('2d'); let frame=0;
setInterval(()=>{ctx.fillStyle=++frame%2?'red':'blue';ctx.fillRect(0,0,64,64);},100);
for(const video of document.querySelectorAll('video')) video.srcObject=canvas.captureStream(10);
</script>`;
(async () => {
 const ext=process.env.EXTENSION_PATH || path.resolve(__dirname,'..');
 const context=await chromium.launchPersistentContext(process.env.TEST_PROFILE, {
   headless:true, executablePath:process.env.CHROMIUM_PATH,
   args:[`--disable-extensions-except=${ext}`,`--load-extension=${ext}`]
 });
 try {
  const errors=[];
  context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  const worker=context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  const id=new URL(worker.url()).host;
  await worker.evaluate(async()=>{await ready; await enqueue(async()=>{ledger=T.create(Date.now());previousLedger=null;history=H.create();tabs={};await persist();}); await chrome.storage.local.set({disabledUntil:0,appearance:'blank'});});
  await context.route('https://www.youtube.com/**',route=>route.fulfill({contentType:'text/html',body:fixture}));
  const page=await context.newPage(); await page.goto('https://www.youtube.com/watch?v=abcdefghijk');
  await page.bringToFront();
  const read=()=>worker.evaluate(()=>enqueue(async()=>{await checkpoint();return snapshot();}));
  const play=()=>page.locator('#movie_player video').evaluate(v=>v.play());
  const pause=()=>page.locator('#movie_player video').evaluate(v=>v.pause());
  await play(); await page.waitForTimeout(2200);
  let first=await read(); assert(first.listening>=1500,JSON.stringify(first)); assert.equal(first.watching,0);
  await pause(); await page.waitForTimeout(200); let paused=await read();
  await page.waitForTimeout(1200); let later=await read(); assert(Math.abs(later.listening-paused.listening)<50);
  assert.equal(await worker.evaluate(async()=>!!(await chrome.alarms.get('tracking-checkpoint'))),false);
  // Hover preview must not accrue time or start an alarm.
  await page.locator('#inline-preview-player video').evaluate(v=>v.play());
  await page.waitForTimeout(1200); let preview=await read(); assert.equal(preview.listening,later.listening);
  await worker.evaluate(()=>chrome.storage.local.set({disabledUntil:Date.now()+60000}));
  await play(); await page.waitForTimeout(2200); let watching=await read();
  assert(watching.watching>=1500,JSON.stringify(watching));
  // An active non-YouTube tab changes subsequent playback to listening.
  const other=await context.newPage(); await other.goto('about:blank'); await other.bringToFront();
  await page.waitForTimeout(200); const switched=await read();
  await page.waitForTimeout(1400); const background=await read();
  assert(background.listening>switched.listening+800); assert(background.watching-switched.watching<100);
  await pause();
  const popup=await context.newPage(); await popup.goto(`chrome-extension://${id}/popup.html`);
  await popup.waitForFunction(()=>!document.querySelector('#toggle').disabled);
  await popup.locator('#toggle').focus(); await popup.keyboard.press('Space');
  await popup.waitForFunction(()=>document.querySelector('#toggle').checked && !document.querySelector('#toggle').disabled);
  assert.equal(await worker.evaluate(async()=>(await chrome.storage.local.get('disabledUntil')).disabledUntil),0);
  await popup.locator('#appearance').focus(); await popup.keyboard.press('Space');
  await popup.waitForFunction(()=>document.querySelector('#appearance').checked && !document.querySelector('#appearance').disabled);
  await popup.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await popup.locator('.switch').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
  for(const theme of ['light','dark']) {
    await popup.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
    const color=await popup.locator('body').evaluate(e=>getComputedStyle(e).color);
    assert.equal(color,theme==='light'?'rgb(32, 42, 35)':'rgb(238, 243, 238)');
    if(process.env.SCREENSHOT_DIR) await popup.locator('body').screenshot({path:path.join(process.env.SCREENSHOT_DIR,`youlisten-${theme}.png`)});
  }
  // Periods must change actual totals, not just the selected label.
  await worker.evaluate(()=>enqueue(async()=>{
    history=H.create(); ledger=T.create(Date.now()); previousLedger=null;
    for(const [ago,minutes] of [[0,1],[10,2],[40,4]]) {
      const date=new Date();date.setDate(date.getDate()-ago);
      H.record(history,{day:H.dayKey(date),listening:minutes*60000,watching:0});
    }
    ledger=T.create(Date.now(),{day:T.dayKey(Date.now()),listening:60000,watching:0});
    await persist();
  }));
  await popup.locator('input[value="1W"]').check();
  await popup.waitForFunction(()=>document.querySelector('#listening').textContent==='1m');
  await popup.locator('input[value="1M"]').check();
  await popup.waitForFunction(()=>document.querySelector('#listening').textContent==='3m');
  await popup.locator('input[value="ALL"]').check();
  await popup.waitForFunction(()=>document.querySelector('#listening').textContent==='7m');
  await popup.reload();
  await popup.waitForFunction(()=>document.querySelector('input[value="ALL"]').checked && document.querySelector('#listening').textContent==='7m');
  for(const theme of ['light','dark']) {
    await popup.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
    if(process.env.SCREENSHOT_DIR) await popup.locator('body').screenshot({path:path.join(process.env.SCREENSHOT_DIR,`youlisten-${theme}.png`)});
  }
  assert.equal(await popup.locator('#error').innerText(),'');
  assert.deepEqual(errors,[]);
  // Popup's 1-second paint timer must not cause storage writes.
  await worker.evaluate(()=>{globalThis.testWrites=0;chrome.storage.onChanged.addListener((c,a)=>{if(a==='local'&&c.dailyTotals)globalThis.testWrites++;});});
  await popup.waitForTimeout(2200);
  assert.equal(await worker.evaluate(()=>globalThis.testWrites),0);
  console.log('PASS: loaded extension, actual media playback, pause, preview exclusion, focus classification, idle alarm removal, keyboard switches, themes, reduced motion, no per-second storage writes.');
 } finally {await context.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
