const {test} = require('node:test');
const assert = require('node:assert/strict');
const T = require('../tracking-core.js');
const start = +new Date(2026, 10, 1, 12);
const sample = (wall, media, extra={}) => ({wall, mono:wall, media, rate:1, playing:true, seeking:false, ...extra});
test('real time, independent of playback speed', () => {
  for (const rate of [.5,1,1.5,2]) assert.deepEqual(T.evidence(sample(start,0,{rate}), sample(start+1000,rate)), [start,start+1000]);
});
test('paused and buffering intervals excluded; pause boundary retained', () => {
  assert.equal(T.evidence(sample(start,0,{playing:false}),sample(start+1000,0)), null);
  assert.equal(T.evidence(sample(start,0),sample(start+1000,0)), null);
  assert.deepEqual(T.evidence(sample(start,0),sample(start+500,.5,{playing:false})), [start,start+500]);
});
test('seeks and sleep/clock gaps do not create playback', () => {
  assert.equal(T.evidence(sample(start,0),sample(start+1000,120,{seeking:true})), null);
  assert.equal(T.evidence(sample(start,0),sample(start+1000,120)), null);
  assert.equal(T.evidence(sample(start,120),sample(start+1000,0)), null);
  assert.equal(T.evidence(sample(start,0),sample(start+3600000,1)), null);
  assert.equal(T.evidence(sample(start,0),sample(start+5000,5,{mono:start+100})), null);
});
test('overlapping tabs counted once, watching wins even for delayed reports', () => {
  const ledger=T.create(start);
  T.add(ledger,{listening:[[start,start+10000],[start+5000,start+15000]]},start+20000);
  T.add(ledger,{watching:[[start+3000,start+8000],[start+7000,start+11000]]},start+20000);
  assert.deepEqual(T.totals(ledger,start+20000),{day:T.dayKey(start),listening:7000,watching:8000});
  T.add(ledger,{watching:[[start+3000,start+8000]]},start+20000);
  assert.equal(T.totals(ledger,start+20000).watching,8000);
});
test('focus/hiding transitions divide categories without gaps', () => {
  const ledger=T.create(start);
  T.add(ledger,{watching:[[start,start+1000],[start+3000,start+4000]],listening:[[start+1000,start+3000]]},start+4000);
  assert.equal(T.totals(ledger,start+4000).listening,2000);
  assert.equal(T.totals(ledger,start+4000).watching,2000);
});
test('midnight retains only today, including an interval spanning midnight', () => {
  const before=+new Date(2026,10,1,23,59,59), after=before+2000;
  const ledger=T.create(before,{day:T.dayKey(before),listening:20000,watching:10000});
  T.add(ledger,{listening:[[before,after]]},after);
  assert.deepEqual(T.totals(ledger,after),{day:T.dayKey(after),listening:1000,watching:0});
});
test('worker restoration preserves union; browser restart uses totals without idle gap', () => {
  const ledger=T.create(start);
  T.add(ledger,{listening:[[start,start+1000]]},start+1000);
  const restored=JSON.parse(JSON.stringify(ledger));
  T.add(restored,{watching:[[start+500,start+1500]]},start+1500);
  const saved=T.totals(restored,start+1500);
  const restarted=T.create(start+3600000,saved);
  assert.deepEqual(T.totals(restarted,start+3600000),saved);
});
