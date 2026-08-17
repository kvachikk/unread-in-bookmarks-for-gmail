# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased][unreleased]

## [1.2.0][] - 2026-08-17

Support for Chrome and the other Chromium browsers, alongside Firefox. The
extension itself behaves exactly as before in Firefox; everything below is
about making the same source run in two browsers.

### Added

- Chromium support. `src/manifest.chrome.json` declares an MV3
  `service_worker`, `src/manifest.firefox.json` keeps the `scripts` event page
  and the `browser_specific_settings` block, and `npm run build` writes
  `dist/chrome/` and `dist/firefox/` from the same sources. There is still no
  bundler, transpiler or minifier.
- `lib/browser.js`, aliasing `chrome` to `browser` where the former is what the
  browser provides. No polyfill is bundled: under MV3 both browsers return
  promises from every API this extension calls.
- `lib/bookmarks-bar.js`, which resolves the bookmarks toolbar rather than
  assuming its id. Firefox names that folder `toolbar_____` and Chromium calls
  it `1`, so the id that used to be a constant is now looked up in the tree.

### Changed

- The background script and the shared helpers are ES modules, loaded as
  `"type": "module"` by both browsers. This replaces the classic scripts that
  shared one global scope through the manifest's `scripts` array.
- The privacy check runs against both manifests, so a promise kept in the
  Firefox build cannot be quietly dropped from the Chrome one.

## [1.1.0][] - 2026-08-03

First release submitted to addons.mozilla.org. The extension was renamed from
"Gmail Unread in Bookmarks" so the listing cannot be read as an official Google
product, and what used to be edited by hand at the top of `background.js` is
now a settings page.

### Added

- Several mailboxes at once, up to ten, each with its own bookmark on the
  toolbar. A work account and a personal one can sit side by side, and a label
  can be watched separately from its inbox.
- Settings page: per mailbox the account position, the label, the title text
  and the text shown when it is empty, plus a shared refresh interval from one
  to sixty minutes. A live preview renders each resulting title.
- `data_collection_permissions: { required: ["none"] }` in the manifest, so the
  absence of data collection is machine-checkable rather than merely
  documented.
- Toolbar badge carrying the total unread across every mailbox, with the
  per-mailbox breakdown in its tooltip.
- Privacy check that fails the build on any network API, dynamic-code API,
  synced storage, sensor API, analytics name, or URL outside `mail.google.com`,
  and on any manifest permission beyond the four the extension declares. It
  runs in CI on every commit.
- Unit tests for feed and inbox URLs, feed parsing, title formatting and
  settings normalization, run by `node --test`.
- Linting with `eslint-config-metarhia` and Prettier, commit-message linting,
  Git hooks, Dependabot, and CI running all of it plus `web-ext lint`.
- CONTRIBUTING, SECURITY and PRIVACY documents.

### Changed

- Extension id is now `unread-in-bookmarks-for-gmail@kvachikk.github.io`.
  Anyone who loaded the old temporary add-on gets a separate entry rather than
  an upgrade, and should remove the old one.
- Source moved into `src/`, with pure helpers split into `src/lib/unread.js` so
  they can be tested outside a browser.
- Minimum Firefox raised to 140, the first version that understands the data
  collection consent key.
- A bookmark is repointed when its account or label changes, instead of staying
  on the mailbox it was created for.
- Removing a mailbox in settings now removes its bookmark rather than leaving
  it behind with a stale count.
- A feed with no `<fullcount>` is now reported as a failure naming the mailbox,
  instead of a bare message about the account index.

### Fixed

- An unread count of zero is no longer indistinguishable from a feed that could
  not be read; only the latter falls back to `—`.

[unreleased]:
  https://github.com/kvachikk/unread-in-bookmarks-for-gmail/compare/v1.2.0...HEAD
[1.2.0]:
  https://github.com/kvachikk/unread-in-bookmarks-for-gmail/releases/tag/v1.2.0
[1.1.0]:
  https://github.com/kvachikk/unread-in-bookmarks-for-gmail/releases/tag/v1.1.0
