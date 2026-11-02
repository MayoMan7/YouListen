# Release verification - YouListen 1.2.1

Completed November 2, 2026. Tested with Chromium 149.0.7827.55 in isolated profiles on Windows.

## Results

- **15 automated tests passed:** real elapsed time across playback rates, pause/buffering, seek rejection, sleep/clock gaps, overlapping tabs with watching priority, focus/hiding splits, midnight, period boundaries, pruning, migration, and worker/browser recovery.
- **Packaged ZIP integration passed:** the actual 1.2.1 archive was extracted into a separate directory and loaded in a fresh browser profile. Real media streams on controlled pages verified hidden playback, pause, preview exclusion, foreground/background classification, idle alarm removal, keyboard switches, system themes, reduced motion, all three period totals, saved selection, and no per-second storage writes.
- **Live YouTube smoke checks passed:** a public regular watch page hid the picture while playback advanced. Native pause, seeking, playback speed, volume, thumbnail mode, fullscreen, listening/watching classification, and temporary-reveal expiry were checked. See `live-qa-results.json`.
- **Asset verification passed:** 16/32/48/128 PNG icons; two 1280 x 800 screenshots; 440 x 280 small promo; 1400 x 560 marquee. Actual popup captures and an actual hidden YouTube player capture are used, without fabricated activity totals. The layouts were visually reviewed.
- **Privacy page verified:** standalone HTML rendered successfully, with five policy sections and no scripts. It describes local counters, session state, optional Google thumbnail requests, deletion, and store-based developer contact.
- **Archive verification passed:** 17 allowlisted runtime/license/policy files, manifest at root, valid references, PNG dimensions checked, UTF-8 text checked, archive CRC verified. Git files, tests, build scripts, and marketing assets are excluded from the store-upload ZIP.

## Lightweight check

A short synthetic-media comparison at 4x CPU throttling measured page-main-thread task time over six seconds: approximately 13.2 ms without the extension and 15.4 ms with it. Page JavaScript heap was approximately 1.26 MB and 1.73 MB respectively. The extension's storage in that short run was 213 bytes local and 1,448 bytes session.

These single-run numbers are diagnostic, not a benchmark claim. They exclude worker CPU, use a simple generated stream, and do not represent every YouTube workload or physical old machine. Video decoding/downloads continue. See `performance-results.json` for raw values.

## Limits and publisher handoff

Native picture-in-picture is excluded. Shorts, preview layouts, and the page mini-player depend on YouTube's markup; their full live permutations were not validated in this pass. The mini-player control was not offered on the live smoke-test page. Captions were not independently verified on that sample. No promise of compatibility with future YouTube changes or Google approval is made.

The declared minimum is Chrome 109; the live/browser tests used Chromium 149, not every intervening version. Physical old-hardware testing remains outside this environment.

The local release preparation is complete. Store submission is not performed: the publisher still needs to host the supplied privacy HTML at a public HTTPS URL, set up the developer/listing contact, upload the release and store assets, review declarations, and submit for review. The local Git repository has no configured remote.
