/* Shared by the popup, content script, and worker; no external dependencies. */
globalThis.AudioSettings = {
  defaults: { disabledUntil: 0, appearance: 'blank' },
  hidden(settings, now = Date.now()) {
    return !(Number(settings.disabledUntil) > now);
  },
  nextMidnight(now = new Date()) {
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    return next.getTime();
  },
  read() { return chrome.storage.local.get(this.defaults); }
};
