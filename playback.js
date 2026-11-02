(() => {
  const T = YouListenTime;
  let video = null, playing = false, foreground = false, previous = null;
  let pending = { listening: [], watching: [] };
  let lastContact = 0, sending = false, stopped = false, dirty = false;
  const mode = () => document.documentElement?.hasAttribute('data-yta-visible') && foreground ? 'watching' : 'listening';
  function eligible(element) {
    if (!(element instanceof HTMLVideoElement)) return false;
    // Feed hover previews use a different player. Shorts must be active.
    const reel = element.closest('ytd-reel-video-renderer');
    if (reel) return reel.hasAttribute('is-active');
    return !!element.closest('#movie_player');
  }
  function sample(discard = false) {
    if (!video) { previous = null; return; }
    const current = { wall: Date.now(), mono: performance.now(), media: video.currentTime, rate: video.playbackRate || 1, playing: playing && !video.paused && !video.ended && !video.seeking && video.isConnected, seeking: video.seeking };
    const interval = discard ? null : T.evidence(previous, current);
    if (interval) {
      const bucket = pending[previous.mode];
      const tail = bucket[bucket.length-1];
      if (tail && interval[0] - tail[1] < 2) tail[1] = interval[1];
      else bucket.push(interval);
    }
    previous = { ...current, mode: mode() };
  }
  function packet() {
    sample();
    const result = { type: 'playback', ...pending, playing: !!previous?.playing, mode: mode() };
    pending = { listening: [], watching: [] };
    return result;
  }
  async function send() {
    if (stopped) return;
    if (sending) { dirty = true; return; }
    sending = true;
    const report = packet();
    try {
      const reply = await chrome.runtime.sendMessage(report);
      if (!reply?.ok) throw new Error('No receiver');
      sample();
      foreground = reply.foreground;
      if (previous) previous.mode = mode();
      lastContact = Date.now();
    } catch {
      for (const key of ['listening','watching']) pending[key] = T.merge([...report[key], ...pending[key]]);
      lastContact = Date.now();
      if (!chrome.runtime.id) stopped = true;
    } finally { sending = false; if (dirty) { dirty = false; send(); } }
  }
  function discover() {
    const next = [...document.querySelectorAll('#movie_player video, ytd-reel-video-renderer[is-active] video')].find(eligible);
    if (next === video) return;
    sample();
    video = next || null;
    playing = !!video && !video.paused && !video.ended && !video.seeking && video.readyState >= 3;
    previous = null;
    sample();
    send();
  }
  const events = ['playing','pause','ended','waiting','seeking','seeked','ratechange','loadedmetadata','emptied','timeupdate'];
  for (const event of events) document.addEventListener(event, e => {
    if (!eligible(e.target) && e.target !== video) return;
    if (e.target !== video) { sample(); video = e.target; previous = null; playing = false; }
    sample(event === 'seeking' || event === 'emptied');
    if (event === 'playing') playing = true;
    if (['pause','ended','waiting','seeking','emptied'].includes(event)) playing = false;
    if (event === 'seeked' || event === 'loadedmetadata') playing = !video.paused && video.readyState >= 3 && !video.seeking;
    if (previous) { previous.playing = playing && !video.paused && !video.seeking; previous.rate = video.playbackRate || 1; }
    if (event !== 'timeupdate' || Date.now() - lastContact > 65000) send();
  }, true);
  document.addEventListener('youlisten-mode-change', () => { sample(); if (previous) previous.mode = mode(); send(); });
  document.addEventListener('yt-navigate-finish', discover);
  document.addEventListener('DOMContentLoaded', discover, { once: true });
  window.addEventListener('pageshow', discover);
  window.addEventListener('pagehide', () => { sample(); playing = false; if (previous) previous.playing = false; send(); });
  chrome.runtime.onMessage.addListener((message, _, respond) => {
    if (message.type !== 'checkpoint') return;
    const report = packet();
    foreground = !!message.foreground;
    if (previous) previous.mode = mode();
    report.mode = mode();
    lastContact = Date.now();
    respond(report);
  });
  discover();
  send();
})();
