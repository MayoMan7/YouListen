# Store artwork

All artwork is supplied under the project's MIT license except the unmodified YouTube player UI visible in the live capture, which belongs to its respective owners. The original YouListen mark is in `branding/icon.svg`.

| Asset | Dimensions | Purpose |
| --- | --- | --- |
| icon-128.png | 128 x 128 | Chrome Web Store icon, with transparent padding |
| screenshot-01-listen.png | 1280 x 800 | Hidden live YouTube player and actual popup |
| screenshot-02-themes.png | 1280 x 800 | Actual popup in both system themes |
| promo-small.png | 440 x 280 | Optional small promotional tile |
| promo-marquee.png | 1400 x 560 | Optional marquee |

`source/` keeps the actual UI captures used to compose the screenshots. The player capture is from a live public YouTube page with video hidden; it is not a simulated player. The popup captures show zero activity from a clean test profile.

To regenerate, set `PLAYWRIGHT_PATH` and `CHROMIUM_PATH` to development-only tooling, then run `node scripts/render-assets.cjs`. The saved player capture is reused; set `LIVE_PLAYER_CAPTURE` to replace it with another real capture. `python scripts/render-policy.py` updates the standalone HTML policy from `PRIVACY.md`.

Dimensions were checked against https://developer.chrome.com/docs/webstore/images . These assets and their preparation scripts are excluded from the runtime ZIP.
