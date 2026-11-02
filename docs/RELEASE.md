# Publishing YouListen on GitHub

GitHub is the primary distribution channel. Users download the source or a release ZIP and load it locally in Chrome. Chrome Web Store submission is not required for this workflow.

## Publish the source

Create or choose a GitHub repository and push this project's committed source. Keep the README, privacy policy, MIT license, and generated PNG icons in the repository so **Code > Download ZIP** works without a build step. Enable Issues for support. No Git remote is configured in the local repository yet.

## Optional GitHub Release

1. Run `node --test tests/*.test.cjs`.
2. Run `python scripts/build-release.py`.
3. Create a GitHub Release for the version in `manifest.json` and attach the matching `dist/youlisten-<version>.zip` and its `.sha256` checksum.
4. Explain the changes and link users to the README installation steps. The ZIP is extracted and loaded with **Load unpacked**; it is not installed by dragging it into Chrome.

The source ZIP supplied automatically by GitHub also works. The smaller release ZIP excludes development scripts, tests, and promotional artwork.

## Update guidance

Tell existing users to replace the files in their current installed folder, click Reload in `chrome://extensions`, and refresh YouTube. Updates are manual. Do not tell users to uninstall first if they want to retain settings and counters.

## Privacy and support

The policy is in `PRIVACY.md`. Support goes through this repository's Issues tab. No separate hosted policy page or store listing is needed for this distribution method.

## Verification

See `RELEASE-VERIFICATION.md` for the tested behavior and limits.
