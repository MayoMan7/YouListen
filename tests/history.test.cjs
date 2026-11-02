const {test}=require('node:test');
const assert=require('node:assert/strict');
const H=require('../stats-history.js');
const now=+new Date(2026,10,2,12);
test('week and month include today, with calendar-day boundaries',()=>{
 const history=H.create();
 for(let days=0;days<40;days++) {
  const date=new Date(now); date.setDate(date.getDate()-days);
  H.record(history,{day:H.dayKey(date),listening:1000,watching:500});
 }
 assert.deepEqual(H.totals(history,'1W',now),{listening:7000,watching:3500});
 assert.deepEqual(H.totals(history,'1M',now),{listening:30000,watching:15000});
 assert.deepEqual(H.totals(history,'ALL',now),{listening:40000,watching:20000});
 H.prune(history,now);
 assert.equal(Object.keys(history.days).length,30);
 assert.equal(H.totals(history,'ALL',now).listening,40000);
});
test('checkpoints replace daily totals rather than add them twice',()=>{
 const history=H.create({day:'2026-11-02',listening:2000,watching:1000});
 H.record(history,{day:'2026-11-02',listening:2000,watching:1000});
 assert.equal(history.all.listening,2000);
 H.record(history,{day:'2026-11-02',listening:1500,watching:2000});
 assert.deepEqual(history.all,{listening:1500,watching:2000});
});
test('long absence expires recent buckets but keeps all-time totals',()=>{
 const history=H.create({day:'2025-01-01',listening:60000,watching:0});
 H.prune(history,now);
 assert.deepEqual(history.days,{});
 assert.equal(H.totals(history,'ALL',now).listening,60000);
 assert.equal(H.totals(history,'1W',now).listening,0);
});
