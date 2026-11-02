/* Pure interval accounting, shared with tests. No URLs or video metadata. */
globalThis.YouListenTime = (() => {
  const dayKey = (time) => {
    const d = new Date(time);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const midnight = time => { const d = new Date(time); d.setHours(0, 0, 0, 0); return +d; };
  function merge(ranges) {
    const out = [];
    for (const [start, end] of ranges.filter(([a,b]) => Number.isFinite(a) && Number.isFinite(b) && b > a).sort((a,b) => a[0]-b[0])) {
      const last = out[out.length-1];
      if (last && start <= last[1]) last[1] = Math.max(end, last[1]);
      else out.push([start, end]);
    }
    return out;
  }
  const duration = ranges => ranges.reduce((total, [a,b]) => total+b-a, 0);
  function create(now, saved = {}) {
    const sameDay = saved.day === dayKey(now);
    return { day: dayKey(now), base: { listening: sameDay ? saved.listening || 0 : 0, watching: sameDay ? saved.watching || 0 : 0 }, listening: [], watching: [] };
  }
  function add(state, packet, now, bucketTime = now) {
    if (state.day !== dayKey(bucketTime)) Object.assign(state, create(bucketTime));
    const end = new Date(bucketTime); end.setHours(24, 0, 0, 0);
    for (const mode of ['listening', 'watching']) {
      const ranges = Array.isArray(packet[mode]) ? packet[mode] : [];
      state[mode] = merge([...state[mode], ...ranges.filter(r => Array.isArray(r) && r.length === 2).map(([a,b]) => [Math.max(a, midnight(bucketTime)), Math.min(b, now, +end)])]);
    }
  }
  function totals(state, now) {
    if (state.day !== dayKey(now)) return { day: dayKey(now), listening: 0, watching: 0 };
    const watching = duration(state.watching);
    const union = duration(merge([...state.listening, ...state.watching]));
    return { day: state.day, listening: state.base.listening + union - watching, watching: state.base.watching + watching };
  }
  // Only credit short intervals with actual media progress. Large gaps after
  // sleep/suspension are discarded, never inferred from a stale playing flag.
  function evidence(previous, current) {
    if (!previous || !previous.playing || current.seeking) return null;
    const elapsed = current.wall - previous.wall;
    const monotonic = current.mono - previous.mono;
    const progress = (current.media - previous.media) / previous.rate * 1000;
    if (elapsed <= 0 || elapsed > 10000 || monotonic < 0 || Math.abs(elapsed-monotonic) > 1000 || progress <= 0 || progress > elapsed + 1500) return null;
    const credit = Math.abs(elapsed - progress) <= 100 ? elapsed : Math.min(elapsed, progress);
    return [previous.wall, previous.wall + credit];
  }
  return { dayKey, midnight, merge, create, add, totals, evidence };
})();
if (typeof module !== 'undefined') module.exports = globalThis.YouListenTime;
