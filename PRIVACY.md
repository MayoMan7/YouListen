# YouListen Privacy Policy

Effective date: November 2, 2026

YouListen is an independent browser extension that hides moving YouTube video while preserving audio and playback controls. This policy explains the data handled by the extension. YouListen does not require an account and does not operate a developer-run server for extension data.

## Data processed on your device

To provide its visible features, YouListen reads the current YouTube page's video elements and playback state, including play/pause, buffering, seeking, playback progress, and speed. It checks which browser tab and window are active, whether hiding is enabled, and local dates and times. In thumbnail mode, it reads the current regular watch page's video ID to choose its image.

The extension saves these items in Chrome extension-local storage:

- Display preferences, the temporary reveal deadline, and the selected statistics range.
- Listening and watching durations grouped by day for up to 30 days, plus cumulative all-time totals.
- A small current accounting snapshot, including its last update time and playback category, to display totals.

It also uses Chrome session storage for temporary playback intervals, category totals, and tab/document identifiers, so it can combine overlapping playback and recover when its background worker stops. These session records are cleared when the browser session ends; previous-day intervals may be retained during the session to finish midnight accounting. Daily buckets older than 30 days are removed on the next statistics update, while all-time totals remain.

YouListen does not save video titles, video IDs, full page URLs, or a per-video viewing history. It does not read passwords, account credentials, messages, payment information, or the browser's browsing-history database. It does not use Chrome Sync to synchronize its settings or counters.

## How this data is used

Data is used only to hide or reveal playback, display an optional thumbnail, restore preferences, resume hiding after a temporary pause, and show your listening-versus-watching statistics. The developer does not receive your settings or statistics. YouListen contains no advertising or analytics SDK and does not sell user data or use it for advertising, profiling, creditworthiness, or lending decisions.

YouListen's use of information received through Chrome APIs follows the Chrome Web Store User Data Policy, including its Limited Use requirements. No information is transferred to developer-operated services.

## YouTube and network requests

YouTube continues to load and play videos and make its own network requests, subject to Google's policies. Hiding the image does not stop video downloads or decoding.

If you enable Thumbnail, your browser requests the current video's thumbnail from Google's YouTube image service at `i.ytimg.com`. The request identifies that video and exposes normal network information to that service, such as your IP address and browser-supplied request headers. The image service's own policies apply. This extension-specific thumbnail request is not made in blank-screen mode. Google/YouTube is the recipient of this optional request; the YouListen developer is not.

The extension loads no remote executable code and includes no third-party analytics, advertising, or developer telemetry endpoint.

## Your choices and deletion

Use the popup to change hiding and thumbnail preferences. Disable YouListen in Chrome's Extensions page to stop it running. Disable thumbnail mode to stop extension-initiated thumbnail requests.

Uninstall YouListen from Chrome to remove its locally stored extension preferences and statistics. Reinstalling begins with new settings and counters. Disabling alone does not delete stored data. Because the developer does not hold your extension data, the developer cannot retrieve or restore it for you.

## Policy changes and contact

Updates to the extension may require an updated policy; the effective date above identifies this version. For questions, open YouListen's Chrome Web Store listing and use the developer contact information provided there.

YouListen is not affiliated with or endorsed by YouTube or Google.
