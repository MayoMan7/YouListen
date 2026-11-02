(() => {
  let settings = { ...AudioSettings.defaults };
  let expiryTimer;
  function apply() {
    const root = document.documentElement;
    if (!root) return;
    const hidden = AudioSettings.hidden(settings);
    const changed = root.hasAttribute('data-yta-visible') === hidden;
    root.toggleAttribute('data-yta-visible', !hidden);
    if (changed) document.dispatchEvent(new Event('youlisten-mode-change'));
    const url = new URL(location.href);
    const id = url.pathname === '/watch' ? url.searchParams.get('v') : null;
    const thumbnail = hidden && settings.appearance === 'thumbnail' && /^[\w-]{11}$/.test(id || '');
    root.toggleAttribute('data-yta-thumbnail', thumbnail);
    if (thumbnail) {
      root.style.setProperty('--yta-thumbnail', `url("https://i.ytimg.com/vi/${id}/hqdefault.jpg")`);
    } else {
      root.style.removeProperty('--yta-thumbnail');
    }
    clearTimeout(expiryTimer);
    if (!hidden) expiryTimer = setTimeout(apply, Math.min(settings.disabledUntil - Date.now() + 20, 2147483647));
  }
  async function refresh() {
    try { settings = await AudioSettings.read(); apply(); }
    catch { /* An extension reload invalidates old tabs; reload the page. */ }
  }
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && Object.keys(AudioSettings.defaults).some(key => changes[key])) {
      for (const key of Object.keys(AudioSettings.defaults)) {
        if (changes[key]) settings[key] = changes[key].newValue ?? AudioSettings.defaults[key];
      }
      apply();
    }
  });
  document.addEventListener('yt-navigate-finish', apply);
  document.addEventListener('DOMContentLoaded', apply, { once: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('pageshow', refresh);
  window.addEventListener('focus', refresh);
  refresh();
})();
