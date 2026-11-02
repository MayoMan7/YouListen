# Chrome Web Store privacy declarations

Prepared for YouListen 1.2.1. These answers describe the included code; complete the dashboard accurately rather than claiming that local processing means no data is handled.

## Single purpose
Help users listen to YouTube with less visual distraction by hiding moving video while preserving playback controls and showing local listening-versus-watching totals.

## Permission justification: storage
Save display preferences, the temporary reveal deadline, selected statistics range, daily and all-time listening/watching totals, and temporary session accounting state on the user's device. Nothing is synchronized with Chrome Sync or sent to a developer server.

## Permission justification: alarms
Resume hiding when a temporary reveal expires, and checkpoint playback statistics approximately once per minute while playback is active. The playback checkpoint alarm is cleared when playback stops.

## Site access: https://www.youtube.com/*
Run bundled CSS and content scripts on desktop YouTube to hide video, preserve player controls, observe media playback events, and select the optional thumbnail. No access to other websites is requested.

## Remote code
No. All executable code ships in the extension package. Optional thumbnail images are media, not executable code.

## Data categories to disclose
Disclose local handling as well as network transfers. Based on the current functionality, use these categories where the dashboard presents them:

- **User activity:** playback events, elapsed listening/watching durations, and active-tab/window state.
- **Website content:** video elements and the optional thumbnail.
- **Web history / browsing activity:** the current YouTube watch-page URL/video ID is processed transiently for the thumbnail. No URL log or per-video history is retained, and no browser history API is used.

The developer does not receive this information. Optional thumbnail requests go to Google's YouTube image service and include the current video ID and normal browser network metadata. Do not select "no user data" merely because counters remain local.

The extension does not intentionally collect personally identifiable information, authentication data, financial/payment data, health data, personal communications, or precise location. Ordinary IP address exposure to the thumbnail provider is described in the policy; there is no separate IP collection endpoint.

## Data-use certifications
The included code does not sell or transfer data to third parties for unrelated purposes; does not use data for purposes unrelated to its stated single purpose; and does not use data for creditworthiness or lending. The optional Google image request is used only to display the user-selected thumbnail. Review and certify the dashboard statements yourself as the publisher.

## Privacy policy URL
Publish `docs/privacy.html` on a public HTTPS URL and enter that URL. It must be reachable without signing in. The local path or a `chrome-extension://` URL is not a substitute for the public policy URL.

## Primary guidance checked
- https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- https://developer.chrome.com/docs/webstore/program-policies/privacy
- https://developer.chrome.com/docs/webstore/program-policies/user-data-faq
