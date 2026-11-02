# Testing YouListen

## Automated accounting tests

Run `node --test tests/*.test.cjs` with Node 20 or later. The tests use Node's built-in test runner and no external dependencies. They cover timing evidence, playback rates, buffering, seeks, overlapping tabs, midnight, history windows, migration, and worker/browser recovery.

## Browser integration tests

Playwright is development-only tooling and is not bundled in the extension. Install it outside the runtime package or provide an existing installation through `PLAYWRIGHT_PATH`. Use its Chromium executable through `CHROMIUM_PATH`. Set `TEST_PROFILE` to a new disposable directory on each run, not an existing personal profile. This avoids stale unpacked-extension service-worker caches.

Run `node tests/browser.cjs`. Optionally set `SCREENSHOT_DIR` to an existing directory for popup captures. Tests load the actual extension on controlled YouTube-shaped pages with real media streams; they also check native keyboard interaction, theme changes, reduced motion, period selection, and lack of idle storage writes.

## Live YouTube smoke test

Use an isolated Chrome profile and the release ZIP extracted into its own directory.

1. Play a regular YouTube video. Confirm hidden picture, advancing playback, pause, seeking, volume, speed, captions where available, and fullscreen.
2. Reveal video and confirm foreground watching increases; switch tabs or windows and confirm background listening.
3. Select thumbnail, then blank. Navigate to another video without reloading; the chosen mode should persist.
4. Confirm reveal expiry; for an accelerated test, set `disabledUntil` to `Date.now() + 5000` in the extension worker's local storage.
5. Inspect any available Shorts or mini-player surface. Native picture-in-picture is outside scope.
6. Reopen the popup in both system themes. Confirm 1W/1M/ALL selection, keyboard controls, and readable focus states.
7. Close or pause all playback. Confirm the tracking-checkpoint alarm is absent and counters stop.

## Performance interpretation

Compare page main-thread metrics under identical media workloads, with and without the extension. CPU throttling is a simulation, not a substitute for old physical hardware. Record the browser version, duration, throttle factor, and whether worker CPU is included. Do not advertise CPU or bandwidth savings: video decoding continues.

## Packaged release

Run `python scripts/build-release.py`. The script allowlists runtime files, checks the manifest's local references and PNG sizes, rejects obvious text corruption, and validates the archive after creating it. Run the browser test against the unpacked release by setting `EXTENSION_PATH` to that directory.
