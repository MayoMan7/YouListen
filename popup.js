const toggle = document.getElementById('toggle');
const appearance = document.getElementById('appearance');
let settings = { ...AudioSettings.defaults };
let expiryTimer;
function render() {
  const hidden = AudioSettings.hidden(settings);
  toggle.checked = hidden;
  document.getElementById('pause-note').hidden = hidden;
  appearance.checked = settings.appearance === 'thumbnail';
  clearTimeout(expiryTimer);
  if (!hidden) expiryTimer = setTimeout(render, Math.min(settings.disabledUntil - Date.now() + 20, 2147483647));
}
async function save(patch) {
  toggle.disabled = appearance.disabled = true;
  try {
    await chrome.storage.local.set(patch);
    settings = await AudioSettings.read();
    document.getElementById('error').textContent = '';
    render();
  } catch {
    render();
    document.getElementById('error').textContent = 'Could not save. Reopen to retry.';
  } finally { toggle.disabled = appearance.disabled = false; }
}
toggle.addEventListener('change', () => save({ disabledUntil: toggle.checked ? 0 : AudioSettings.nextMidnight() }));
appearance.addEventListener('change', () => save({ appearance: appearance.checked ? 'thumbnail' : 'blank' }));
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'local') return;
  if (changes.disabledUntil || changes.appearance) {
    try { settings = await AudioSettings.read(); render(); } catch { /* Popup may be closing. */ }
  }
  if (changes.dailyTotals) { stats = changes.dailyTotals.newValue; renderStats(); }
});
AudioSettings.read().then(value => {
  settings = value;
  render();
  toggle.disabled = appearance.disabled = false;
}).catch(() => { document.getElementById('error').textContent = 'Could not load. Reopen to retry.'; });

let stats = null;
let period = '1W';
const periods = document.querySelectorAll('input[name="period"]');
function selectPeriod(value) {
  period = ['1W','1M','ALL'].includes(value) ? value : '1W';
  periods.forEach(input => { input.checked = input.value === period; });
  renderStats();
}
chrome.storage.local.get({ statsRange: '1W' }).then(value => selectPeriod(value.statsRange)).catch(() => selectPeriod('1W'));
periods.forEach(input => input.addEventListener('change', () => {
  if (!input.checked) return;
  selectPeriod(input.value);
  chrome.storage.local.set({ statsRange: period }).catch(() => {
    document.getElementById('error').textContent = 'Could not save range.';
  });
}));
function renderStats() {
  const now = Date.now();
  const totals = YouListenHistory.totals(stats?.history || YouListenHistory.create(stats), period, now);
  for (const mode of ['listening', 'watching']) {
    let ms = totals[mode];
    // Optimistic display only, never saved. Bound stale predictions after sleep.
    if (stats?.mode === mode && now-stats.asOf < 65000) ms += Math.max(0, now-stats.asOf);
    const minutes = Math.floor(ms/60000);
    document.getElementById(mode).textContent = minutes >= 60 ? `${Math.floor(minutes/60)}h ${minutes%60}m` : `${minutes}m`;
  }
}
chrome.runtime.sendMessage({ type: 'stats' }).then(result => {
  if (!result?.ok) throw new Error('Stats unavailable');
  stats = result; renderStats();
}).catch(() => { document.getElementById('error').textContent = 'Timers unavailable. Reload YouListen.'; });
// This interval exists only for the popup's lifetime; it does not write storage.
const displayTimer = setInterval(renderStats, 1000);
window.addEventListener('pagehide', () => clearInterval(displayTimer), { once: true });
