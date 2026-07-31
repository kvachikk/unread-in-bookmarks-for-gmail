# Gmail Unread in Bookmarks

A tiny Firefox extension that keeps your Gmail unread count visible on the bookmarks toolbar. It renames one of your bookmarks once a minute, so the number is just *there* — no tab to open, no page to refresh. When there is nothing unread it says `nothing`.

## Install

Firefox only — the extension relies on the `bookmarks` API, and Chrome does not show bookmark titles the same way.

**Try it out** — go to `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on* → pick `manifest.json`. Gone on restart.

**Keep it** — pick one:

- **Self-sign via AMO.** Zip the folder, upload to [addons.mozilla.org/developers](https://addons.mozilla.org/developers/) as an **unlisted** add-on. Free, nothing becomes public, you get a signed `.xpi` back that installs permanently in release Firefox.
- **Disable signature enforcement.** Set `xpinstall.signatures.required` to `false` in `about:config`. Only works on Developer Edition, Nightly, and ESR — release Firefox ignores the pref.

The only requirement is that you are signed in to Gmail in the same browser. On first run the extension adds its own bookmark to the bookmarks toolbar and renames that one from then on — no setup, and none of your existing bookmarks are touched.

## Configure

Everything tunable sits at the top of `background.js`.

```js
const PERIOD_MINUTES = 1;   // Firefox clamps anything below 1
const ACCOUNT_INDEX  = 0;   // 0 is the first signed-in Google account
const LABEL          = "";  // "" is the inbox; or e.g. "starred", "work"

function formatTitle(n) {
  return n ? `${n} new` : "nothing";
}
```

`formatTitle` receives the unread count, so a bare `3` is `return String(n)`.

## How it works

`GET https://mail.google.com/mail/u/0/feed/atom`, authenticated by the Google cookies you already have — the same feed old desktop mail checkers used. The `<fullcount>` field in the response is the number of unread messages in the inbox.

A one-minute `alarms` timer drives the refresh. Clicking the toolbar icon forces one immediately.

The bookmark's id lives in `storage.local`. Delete the bookmark and a fresh one appears on the next tick, so removing it for good means uninstalling the extension.

## Caveats

If you are signed out of Google the feed answers `401` and the bookmark falls back to `—`. With several accounts signed in, `ACCOUNT_INDEX` has to match the one you want; a wrong index shows `—` too.

Everything stays local. No servers, no telemetry, no OAuth, no API key. The extension only ever talks to `mail.google.com`. Nothing here is affiliated with or endorsed by Google.

## License

MIT
