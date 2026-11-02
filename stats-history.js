/* At most 30 daily aggregate buckets, plus two all-time counters. */
globalThis.YouListenHistory = (() => {
  const dayKey = time => {
    const d = new Date(time);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const startDay = (now, days) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days + 1);
    return dayKey(d);
  };
  function record(history, total) {
    if (!total?.day) return;
    const previous = history.days[total.day] || { listening: 0, watching: 0 };
    const next = { listening: total.listening || 0, watching: total.watching || 0 };
    for (const mode of ['listening', 'watching']) history.all[mode] += next[mode] - previous[mode];
    history.days[total.day] = next;
  }
  function create(legacy) {
    const history = { version: 1, days: {}, all: { listening: 0, watching: 0 } };
    record(history, legacy);
    return history;
  }
  function prune(history, now) {
    const cutoff = startDay(now, 30);
    for (const day of Object.keys(history.days)) if (day < cutoff) delete history.days[day];
  }
  function totals(history, period, now) {
    if (!history) return { listening: 0, watching: 0 };
    if (period === 'ALL') return { ...history.all };
    const cutoff = startDay(now, period === '1M' ? 30 : 7);
    const today = dayKey(now);
    const sum = { listening: 0, watching: 0 };
    for (const [day, values] of Object.entries(history.days)) {
      if (day >= cutoff && day <= today) for (const mode of ['listening', 'watching']) sum[mode] += values[mode];
    }
    return sum;
  }
  return { dayKey, startDay, create, record, prune, totals };
})();
if (typeof module !== 'undefined') module.exports = globalThis.YouListenHistory;
