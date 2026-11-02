# YouListen

Hide the moving picture. Keep listening.

YouListen is a small, open-source Chrome extension for using YouTube as background audio. It keeps YouTube's player controls, uses plain JavaScript and CSS, and stores preferences and listening totals on your device. No account, backend, analytics SDK, or runtime dependencies.

## Install locally

1. Extract the release ZIP into a permanent folder, or use this source folder.
2. Disable any earlier YouTube-hiding experiment so its CSS does not override the switches.
3. Open `chrome://extensions`, enable **Developer mode**, and select **Load unpacked**.
4. Select the folder containing `manifest.json`. Pin YouListen from Chrome's extensions menu.
5. Refresh existing YouTube tabs after installing or updating.

## Use

- **Hide video:** on by default. Turn it off to reveal video until the next local midnight; turn it on to resume hiding early.
- **Thumbnail:** use a static thumbnail on regular watch pages instead of the grey screen. Other playback surfaces remain blank.
- **1W / 1M / ALL:** compare listening and watching over the last 7 local calendar days, last 30 days, or all recorded time. The rolling windows include today, and your selected range is remembered.
- Light/dark appearance follows your system; keyboard focus and reduced motion are supported.

**Listening** means hidden playback or playback outside the active tab of the focused window. **Watching** means revealed playback in that foreground tab. Pauses, buffering, seeks, and feed hover previews are excluded. Playback speed does not multiply elapsed time. Muted main-player playback and ads using that player still count. Overlapping tabs count once, with watching taking priority.

## Privacy

Read [the privacy policy](PRIVACY.md). Preferences, up to 30 daily aggregate buckets, and two all-time counters are saved locally. Temporary timing intervals and tab/document identifiers stay in session storage for coordination. No video titles, URLs, or per-video history are saved. The developer receives no usage data.

Thumbnail mode requests the current video's image from YouTube's `i.ytimg.com` server; that request includes the video ID and normal browser network metadata. YouTube's own traffic continues normally. Uninstalling YouListen removes its extension-local settings and counters.

## Limits

- This hides images, not decoding or downloads. It does not promise bandwidth or CPU savings.
- Native picture-in-picture, YouTube Music, mobile sites, and embeds on other sites are outside scope. Standard video elements in Shorts, previews, and the page mini-player are hidden by the same CSS, but site-specific surfaces can change.
- Timing is approximate: sleep/suspension gaps longer than 10 seconds are discarded conservatively. Unusual background throttling can undercount. An unexpected close may lose the latest unsaved interval (normally up to a minute).
- Existing retained totals migrate. Older totals already discarded by earlier versions cannot be recovered.
- The reveal deadline uses the local timezone at the moment it is set. A later timezone change does not recalculate that deadline.
- A new page can briefly stay hidden while its saved reveal setting loads. YouTube layout changes may require an extension update.

## Development

Chrome 109 or later is declared in the manifest. There is no compilation step. Reload the extension in `chrome://extensions`, then refresh YouTube after changing its content scripts.

| Area | Files |
| --- | --- |
| Page appearance | `content.js`, `hide-video.css` |
| Playback evidence and accounting | `playback.js`, `tracking-core.js` |
| Aggregation, focus, alarms, storage | `background.js`, `stats-history.js` |
| Preferences and popup | `settings.js`, `popup.html`, `popup.css`, `popup.js` |

The only API permissions are `storage` and `alarms`. Content scripts run only on `https://www.youtube.com/*`. No DOM polling loop or permanent background process is used. A minute checkpoint alarm exists during playback; a one-second display timer exists only while the popup is open.

## Tests and release

- `node --test tests/*.test.cjs` runs the dependency-free test suite.
- `node tests/browser.cjs` runs optional Playwright integration checks with the actual extension and controlled media pages. See [the testing guide](docs/TESTING.md) for development-only tooling and live checks.
- `python scripts/build-release.py` creates and validates the runtime-only ZIP in `dist/`, with `manifest.json` at its root.
- [Store listing copy](store-assets/LISTING.md), [privacy declarations](store-assets/PRIVACY-DISCLOSURES.md), [release checklist](docs/RELEASE.md), and [verification results](docs/RELEASE-VERIFICATION.md) accompany the release.
- `docs/privacy.html` is a standalone, script-free copy of the privacy policy, ready to host at a public HTTPS URL for the store dashboard.

Licensed under [MIT](LICENSE). YouListen is an independent project and is not affiliated with or endorsed by YouTube or Google.
