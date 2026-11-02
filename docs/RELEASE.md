# Release handoff - YouListen 1.2.1

## Prepared in this repository

- Runtime extension, manifest icons, MIT license, and privacy policy.
- Store icon, two 1280 x 800 screenshots, small promotional tile, and optional marquee.
- Listing copy and privacy/permission explanations.
- Dependency-free accounting tests and optional browser integration tests.
- Reproducible runtime-only ZIP builder and verification report.

## Build

Run `node --test tests/*.test.cjs`, then `python scripts/build-release.py`. Use `dist/youlisten-1.2.1.zip` for Chrome Web Store upload. The manifest is at the archive root. Tests, scripts, Git files, and store artwork are excluded from that upload ZIP.

## Publisher steps outside this local release package

1. Set up or use your Chrome Web Store developer account and its public developer contact information.
2. Host `docs/privacy.html` at a public HTTPS URL. Check that it opens without authentication, then paste that URL into Privacy practices.
3. Create the store item, upload the ZIP, and paste the prepared listing and permission explanations. Upload `store-assets/icon-128.png` and the screenshots; promotional images are optional.
4. Review the data-use declarations as the publisher, choose distribution, and submit for review. This preparation does not submit or publish the extension.
5. If publishing the source repository, configure the real remote and publish the MIT-licensed source. Add its actual URL to the listing; no remote is configured here yet.

Chrome Web Store approval and review timing are controlled by Google. Check `RELEASE-VERIFICATION.md` for exactly what was tested and any remaining limits before submission.

## Official references

- https://developer.chrome.com/docs/webstore/prepare
- https://developer.chrome.com/docs/webstore/images
- https://developer.chrome.com/docs/webstore/publish
