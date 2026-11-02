importScripts('settings.js', 'tracking-core.js', 'stats-history.js');
const H = YouListenHistory;
const T = YouListenTime;
let ledger, previousLedger = null, history, tabs = {}, lastSnapshot, lastSession;
let queue = Promise.resolve();
let alarmRunning = false;
const ready = (async () => {
  const [session, local] = await Promise.all([
    chrome.storage.session.get('trackingSession'), chrome.storage.local.get('dailyTotals')
  ]);
  const saved = session.trackingSession;
  ledger = saved?.ledger || T.create(Date.now(), local.dailyTotals);
  previousLedger = saved?.previousLedger || null;
  history = saved?.history || local.dailyTotals?.history || H.create(local.dailyTotals);
  tabs = saved?.tabs || {};
  rollDay();
  lastSnapshot = structuredClone(local.dailyTotals);
  lastSession = JSON.stringify(saved);
  alarmRunning = !!(await chrome.alarms.get('tracking-checkpoint'));
})();
function bucketTime(day) { return +new Date(day + 'T12:00:00'); }
function recordLedger(value) {
  if (value) H.record(history, T.totals(value, bucketTime(value.day)));
}
function rollDay() {
  const now = Date.now();
  if (ledger.day !== T.dayKey(now)) {
    recordLedger(previousLedger);
    recordLedger(ledger);
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    previousLedger = ledger.day === T.dayKey(yesterday) ? ledger : null;
    ledger = T.create(now, { day: T.dayKey(now), ...history.days[T.dayKey(now)] });
  }
}
function enqueue(task) {
  const result = queue.then(() => ready).then(task);
  queue = result.catch(console.error);
  return result;
}
async function foregroundTabs() {
  const [window, active] = await Promise.all([
    chrome.windows.getLastFocused(), chrome.tabs.query({ active: true })
  ]);
  return new Set(window.focused ? active.filter(tab => tab.windowId === window.id).map(tab => tab.id) : []);
}
function ingest(id, documentId, report, foreground) {
  if (!report || report.type !== 'playback') return;
  rollDay();
  const now = Date.now();
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = T.dayKey(yesterday);
  const hasPrevious = ['listening','watching'].some(mode => (report[mode] || []).some(([a,b]) => a < T.midnight(now) && b > T.midnight(yesterday)));
  if (hasPrevious) {
    previousLedger ||= T.create(+yesterday, { day: yesterdayKey, ...history.days[yesterdayKey] });
    T.add(previousLedger, report, now, +yesterday);
  }
  T.add(ledger, report, now);
  tabs[id] = { documentId, playing: report.playing === true, mode: report.mode === 'watching' && foreground ? 'watching' : 'listening' };
}
function liveMode() {
  const active = Object.values(tabs).filter(tab => tab.playing);
  return active.some(tab => tab.mode === 'watching') ? 'watching' : active.length ? 'listening' : null;
}
function snapshot() {
  return { ...T.totals(ledger, Date.now()), history, mode: liveMode(), asOf: Date.now() };
}
async function persist() {
  rollDay();
  recordLedger(previousLedger);
  recordLedger(ledger);
  H.prune(history, Date.now());
  // Session ledger survives worker suspension; only aggregate totals go to disk.
  const session = { ledger, previousLedger, history, tabs };
  const serialized = JSON.stringify(session);
  if (serialized !== lastSession) {
    await chrome.storage.session.set({ trackingSession: session });
    lastSession = serialized;
  }
  const next = snapshot();
  if (!lastSnapshot || ['day','listening','watching','mode'].some(key => next[key] !== lastSnapshot[key]) || JSON.stringify(next.history) !== JSON.stringify(lastSnapshot.history)) {
    await chrome.storage.local.set({ dailyTotals: next });
    lastSnapshot = structuredClone(next);
  }
  const needed = !!liveMode();
  if (needed && !alarmRunning) {
    await chrome.alarms.create('tracking-checkpoint', { periodInMinutes: 1 });
  } else if (!needed && alarmRunning) {
    await chrome.alarms.clear('tracking-checkpoint');
  }
  alarmRunning = needed;
}
async function checkpoint() {
  const foreground = await foregroundTabs();
  await Promise.all(Object.entries(tabs).map(async ([id, tab]) => {
    try {
      const report = await chrome.tabs.sendMessage(Number(id), { type: 'checkpoint', foreground: foreground.has(Number(id)) }, tab.documentId ? { documentId: tab.documentId } : { frameId: 0 });
      ingest(id, tab.documentId, report, foreground.has(Number(id)));
    } catch { delete tabs[id]; }
  }));
  await persist();
}
async function syncExpiry() {
  const settings = await AudioSettings.read();
  if (!AudioSettings.hidden(settings)) {
    await chrome.alarms.create('resume-hiding', { when: Number(settings.disabledUntil) });
  } else {
    await chrome.alarms.clear('resume-hiding');
    if (settings.disabledUntil !== 0) await chrome.storage.local.set({ disabledUntil: 0 });
  }
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (!['playback','stats'].includes(message?.type)) return;
  enqueue(async () => {
    if (message.type === 'stats') {
      await checkpoint();
      return { ok: true, ...snapshot() };
    }
    if (!sender.tab || sender.frameId !== 0) return { ok: false };
    const foreground = await foregroundTabs();
    ingest(sender.tab.id, sender.documentId, message, foreground.has(sender.tab.id));
    await persist();
    return { ok: true, foreground: foreground.has(sender.tab.id) };
  }).then(respond, () => respond({ ok: false }));
  return true;
});
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'tracking-checkpoint') enqueue(checkpoint);
  if (alarm.name === 'resume-hiding') enqueue(syncExpiry);
});
chrome.tabs.onActivated.addListener(() => enqueue(checkpoint));
chrome.windows.onFocusChanged.addListener(() => enqueue(checkpoint));
chrome.tabs.onRemoved.addListener(id => enqueue(async () => { delete tabs[id]; await persist(); }));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.disabledUntil) enqueue(syncExpiry);
});
chrome.runtime.onStartup.addListener(() => enqueue(async () => { await syncExpiry(); await checkpoint(); }));
chrome.runtime.onInstalled.addListener(() => enqueue(syncExpiry));
// Recreate missing alarms after a worker/browser restart, without extrapolating
// any elapsed time from saved playing flags.
enqueue(async () => { await syncExpiry(); await checkpoint(); });
