const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const base=+new Date(2026,10,1,12);
async function boot(stores, now, reports={}) {
 const alarms=new Map(), event=()=>({addListener(){}});
 const area=name=>({
  get: async key => typeof key==='string'?{[key]:structuredClone(stores[name][key])}:{...key,...structuredClone(stores[name])},
  set: async patch=>{Object.assign(stores[name],structuredClone(patch));}
 });
 class Clock extends Date {constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
 const c=vm.createContext({Date:Clock,console,structuredClone,chrome:{
  storage:{local:area('local'),session:area('session'),onChanged:event()},
  alarms:{get:async name=>alarms.get(name),create:async(name,spec)=>alarms.set(name,spec),clear:async name=>alarms.delete(name),onAlarm:event()},
  windows:{getLastFocused:async()=>({id:1,focused:true}),onFocusChanged:event()},
  tabs:{query:async()=>[{id:1,windowId:1}],sendMessage:async id=>{if(!reports[id])throw Error('closed');return reports[id];},onActivated:event(),onRemoved:event()},
  runtime:{onMessage:event(),onStartup:event(),onInstalled:event()}
 }});
 c.importScripts=(...files)=>files.forEach(file=>vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),c));
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../background.js'),'utf8'),c);
 await vm.runInContext('queue',c);
 return {c,alarms,run:code=>vm.runInContext(code,c)};
}
test('worker suspension preserves totals and deduplicates replayed intervals',async()=>{
 const stores={local:{},session:{}};
 const first=await boot(stores,base+2000);
 await first.run(`enqueue(async()=>{ingest(1,'doc',{type:'playback',playing:true,mode:'watching',watching:[[${base},${base+2000}]]},true);await persist();})`);
 assert.equal(stores.local.dailyTotals.watching,2000);
 assert(first.alarms.has('tracking-checkpoint'));
 const next=await boot(stores,base+4000,{1:{type:'playback',playing:true,mode:'watching',watching:[[base+1000,base+4000]]}});
 assert.equal(stores.local.dailyTotals.watching,4000);
 assert(next.alarms.has('tracking-checkpoint'));
});
test('browser restart preserves disk totals without counting closed-browser time',async()=>{
 const stores={local:{dailyTotals:{day:'2026-11-01',listening:12000,watching:3000}},session:{}};
 const worker=await boot(stores,base+3600000);
 assert.equal(stores.local.dailyTotals.listening,12000);
 assert.equal(stores.local.dailyTotals.watching,3000);
 assert.equal(stores.local.dailyTotals.mode,null);
 assert(!worker.alarms.has('tracking-checkpoint'));
});
test('missing/closed tabs stop checkpoint alarm and do not accrue phantom time',async()=>{
 const stores={local:{},session:{}};
 const first=await boot(stores,base+1000);
 await first.run(`enqueue(async()=>{ingest(1,'doc',{type:'playback',playing:true,mode:'listening',listening:[[${base},${base+1000}]]},true);await persist();})`);
 const next=await boot(stores,base+7200000);
 assert.equal(stores.local.dailyTotals.listening,1000);
 assert.equal(stores.local.dailyTotals.mode,null);
 assert(!next.alarms.has('tracking-checkpoint'));
});

test('legacy daily totals migrate once and survive repeated worker starts',async()=>{
 const stores={local:{dailyTotals:{day:'2026-10-31',listening:12000,watching:3000}},session:{}};
 await boot(stores,base);
 assert.equal(stores.local.dailyTotals.history.all.listening,12000);
 await boot(stores,base+1000);
 assert.equal(stores.local.dailyTotals.history.all.listening,12000);
 stores.session={};
 await boot(stores,base+2000);
 assert.equal(stores.local.dailyTotals.history.all.listening,12000);
});
test('midnight splits playback into both days without duplicate history',async()=>{
 const before=+new Date(2026,10,1,23,59,59), after=before+2000;
 const stores={local:{},session:{}};
 const first=await boot(stores,before);
 await first.run(`enqueue(async()=>{ingest(1,'doc',{type:'playback',playing:true,mode:'listening',listening:[[${before-1000},${before}]]},true);await persist();})`);
 await boot(stores,after,{1:{type:'playback',playing:false,mode:'listening',listening:[[before,after]]}});
 const h=stores.local.dailyTotals.history;
 assert.equal(h.days['2026-11-01'].listening,2000);
 assert.equal(h.days['2026-11-02'].listening,1000);
 assert.equal(h.all.listening,3000);
 await boot(stores,after+1000,{1:{type:'playback',playing:false,mode:'listening',listening:[[before,after]]}});
 assert.equal(stores.local.dailyTotals.history.all.listening,3000);
});
