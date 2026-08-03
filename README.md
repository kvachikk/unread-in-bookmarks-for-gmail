<img width="902" height="358" alt="1" src="https://github.com/user-attachments/assets/fb9137a5-a505-4fd6-a753-880c6fb1254b" />

<img width="816" height="358" alt="2" src="https://github.com/user-attachments/assets/d99ecdac-ae4c-48e2-b925-ce80e3dc3223" />

# Unread in Bookmarks for Gmail

A tiny Firefox extension that keeps your Gmail unread counts visible on the
bookmarks toolbar. It renames bookmarks it owns once a minute, so the number is
just _there_ — no tab to open, no page to refresh. When there is nothing unread
it says `nothing`.

Not affiliated with, endorsed by, or sponsored by Google.

## Install

From
[addons.mozilla.org](https://addons.mozilla.org/firefox/addon/unread-in-bookmarks-for-gmail/),
or build it yourself:

```bash
npm ci
npm start          # opens a scratch Firefox with the extension loaded
npm run package    # writes artifacts/*.zip
```

To try the source without building, go to
`about:debugging#/runtime/this-firefox` → _Load Temporary Add-on_ → pick
`src/manifest.json`. Gone on restart.

Firefox on desktop only. The extension writes to the bookmarks toolbar, which
Firefox for Android does not show.

The one requirement is that you are signed in to Gmail in the same browser. On
first run the extension adds its own bookmark to the bookmarks toolbar and
renames that one from then on — no setup, and none of your existing bookmarks
are touched.

## Several mailboxes

Each mailbox you add gets its own bookmark, so a work account and a personal
one can sit side by side on the toolbar. Open the add-on's preferences
(`about:addons` → this extension → _Preferences_) and add as many as you need,
up to ten. Per mailbox you choose:

- **Account** — the position in Google's own account switcher, which is the
  `/u/0/` part of a Gmail URL.
- **Label** — empty for the inbox, or a label name to count that instead.
- **What the title says**, with `{n}` standing in for the count, and separate
  text for when the mailbox is empty. Giving each one a prefix like `work {n}`
  is what makes two bookmarks readable at a glance.

Removing a mailbox removes its bookmark with it. The refresh interval is shared
by all of them.

## How it works

`GET https://mail.google.com/mail/u/0/feed/atom`, authenticated by the Google
cookies you already have — the same feed old desktop mail checkers used. The
`<fullcount>` field in the response is the number of unread messages.

An `alarms` timer drives the refresh. Clicking the toolbar icon forces one
immediately, and the icon's badge carries the total across every mailbox, with
the per-mailbox breakdown in its tooltip.

Bookmark ids live in `storage.local`. Delete a bookmark and a fresh one appears
on the next tick, so removing it for good means removing the mailbox in
preferences, or uninstalling the extension.

## Caveats

If you are signed out of Google the feed answers `401` and the bookmark falls
back to `—`. An account position nobody is signed in to shows `—` too; the
tooltip on the toolbar icon names which mailbox failed.

## Privacy

Nothing is collected and nothing is transmitted anywhere except Gmail itself.
Message subjects and senders are in the feed but never read — only
`<fullcount>` is. See [PRIVACY.md](PRIVACY.md), which CI enforces on every
commit through `npm run lint:privacy`.

## Development

```bash
npm ci
npm run lint && npm test
```

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
