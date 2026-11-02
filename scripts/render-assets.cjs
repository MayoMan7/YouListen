// Development-only asset renderer. No rendering dependencies ship at runtime.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'store-assets');
const source = path.join(output, 'source');
const launch = { headless: true, executablePath: process.env.CHROMIUM_PATH };
const png = name => 'data:image/png;base64,' + fs.readFileSync(path.join(source,name)).toString('base64');
const icon = fs.readFileSync(path.join(root,'branding/icon.svg'),'utf8');
(async () => {
 fs.mkdirSync(source,{recursive:true}); fs.mkdirSync(path.join(root,'dist'),{recursive:true});
 const browser = await chromium.launch(launch);
 try {
  const page = await browser.newPage({deviceScaleFactor:1});
  for(const size of [16,32,48,128]) {
   await page.setViewportSize({width:256,height:256});
   await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${icon}`);
   await page.locator("svg").screenshot({path:path.join(root,`icons/icon-${size}.png`),omitBackground:true});
  }
 } finally {await browser.close();}
 fs.copyFileSync(path.join(root,'icons/icon-128.png'),path.join(output,'icon-128.png'));
 const profile=fs.mkdtempSync(path.join(root,'dist','asset-profile-'));
 const context=await chromium.launchPersistentContext(profile,{...launch,args:[`--disable-extensions-except=${root}`,`--load-extension=${root}`]});
 try {
  const worker=context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  const id=new URL(worker.url()).host;
  const page=await context.newPage();
  for(const theme of ['dark','light']) {
   await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
   await page.goto(`chrome-extension://${id}/popup.html`);
   await page.waitForFunction(()=>!document.querySelector('#toggle').disabled);
   await page.waitForFunction(()=>document.querySelector('#error').textContent==='');
   await page.locator('body').screenshot({path:path.join(source,`popup-${theme}.png`)});
  }
 } finally {await context.close();}
 if(process.env.LIVE_PLAYER_CAPTURE) fs.copyFileSync(process.env.LIVE_PLAYER_CAPTURE,path.join(source,'player-blank.png'));
 if(!fs.existsSync(path.join(source,'player-blank.png'))) throw new Error('Supply LIVE_PLAYER_CAPTURE: a screenshot of the real hidden YouTube player.');
 const compositor=await chromium.launch(launch);
 try {
  const page=await compositor.newPage({deviceScaleFactor:1});
  const brand=`<div class="brand">${icon}<span>YouListen</span></div>`;
  const base=`*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;font-family:Segoe UI,Arial,sans-serif}body{background:#14241b;color:#f2f7ef} .brand{display:flex;align-items:center;gap:12px;font-size:30px;font-weight:650;letter-spacing:-1px}.brand svg{width:52px;height:52px}h1{font-size:50px;line-height:1.1;letter-spacing:-1.6px;margin:22px 0 14px;font-weight:650}.sub{font-size:22px;color:#b7cdbc;margin:0}.popup{border:1px solid #526458;border-radius:16px;box-shadow:0 16px 50px #0004;overflow:hidden}.popup img{display:block;width:100%}.caption{font-size:15px;color:#b7cdbc;letter-spacing:.3px}`;
  async function render(name,width,height,body,css='') {
   await page.setViewportSize({width,height});
   await page.setContent(`<style>${base}${css}</style>${body}`);
   await page.evaluate(()=>Promise.all([...document.images].map(img=>img.decode())));
   await page.screenshot({path:path.join(output,name)});
  }
  await render('screenshot-01-listen.png',1280,800,`
   <div style="padding:44px 56px">${brand}<h1>Keep the audio. Lose the distraction.</h1><p class="sub">Your YouTube controls. A quieter screen.</p></div>
   <div class="player"><img src="${png('player-blank.png')}"></div>
   <div class="popup main-popup"><img src="${png('popup-dark.png')}"></div>
   <div class="caption player-caption">YouTube playback with Hide video enabled</div>
   <div class="caption popup-caption">The actual YouListen popup</div>`,
   `.player{position:absolute;left:56px;top:266px;width:620px;border:1px solid #526458;border-radius:14px;overflow:hidden}.player img{display:block;width:100%}.main-popup{position:absolute;right:56px;top:290px;width:360px}.player-caption{position:absolute;left:56px;bottom:28px}.popup-caption{position:absolute;right:56px;bottom:28px;width:360px}`);
  await render('screenshot-02-themes.png',1280,800,`
   <div style="padding:44px 56px">${brand}<h1>Listening time. On your terms.</h1><p class="sub">1W &middot; 1M &middot; ALL. Saved on your device.</p></div>
   <div class="theme left"><div class="popup"><img src="${png('popup-light.png')}"></div><p class="caption">LIGHT</p></div>
   <div class="theme right"><div class="popup"><img src="${png('popup-dark.png')}"></div><p class="caption">DARK</p></div>
   <p class="foot">Follows your system theme. No account required.</p>`,
   `.theme{position:absolute;top:270px;width:330px;text-align:center}.left{left:240px}.right{right:240px}.foot{position:absolute;bottom:18px;width:100%;text-align:center;font-size:18px;color:#b7cdbc}.theme .caption{margin-top:18px;letter-spacing:2px}`);
  await render('promo-small.png',440,280,`<div class="halo"></div><div class="symbol">${icon}</div>`,
   `.halo{position:absolute;width:330px;height:330px;border:1px solid #456951;border-radius:50%;left:55px;top:-25px}.halo:before{content:'';position:absolute;inset:35px;border:1px solid #456951;border-radius:50%}.symbol{position:absolute;left:120px;top:40px;width:200px;height:200px}.symbol svg{width:100%;height:100%}`);
  await render('promo-marquee.png',1400,560,`<div class="lockup">${icon}<span>YouListen</span></div><div class="ring one"></div><div class="ring two"></div>`,
   `.lockup{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:18px;font-size:100px;font-weight:650;letter-spacing:-5px}.lockup svg{width:230px;height:230px}.ring{position:absolute;border:1px solid #34533e;border-radius:50%;width:650px;height:650px;z-index:-0;pointer-events:none}.one{left:-420px;top:-300px}.two{right:-420px;bottom:-300px}`);
 } finally {await compositor.close();}
 console.log('Rendered icons, two store screenshots, and both promotional sizes.');
})().catch(error=>{console.error(error);process.exitCode=1;});
