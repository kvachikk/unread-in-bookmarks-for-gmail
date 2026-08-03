# Privacy Policy

**Unread in Bookmarks for Gmail collects nothing and transmits nothing.**

That is the entire policy. The rest of this document explains how you can check
that claim yourself rather than taking it on trust.

## What is collected

Nothing. No personal data, no usage data, no crash reports, no identifiers, no
analytics, no advertising, no "anonymous statistics". The extension has no
server, no account, and no operator to send anything to.

## What leaves your device

One request per configured mailbox, to `mail.google.com`, on the interval you
chose:

`GET https://mail.google.com/mail/u/{account}/feed/atom` — optionally with a
label appended. This is Gmail's own atom feed, authenticated by the Google
cookies already in your browser. No other host is ever contacted: the extension
holds a host permission for `https://mail.google.com/*` and nothing else, so it
is not technically able to reach one.

**The feed contains message subjects, senders and snippets. The extension reads
none of them.** The response is matched against a single regular expression for
the `<fullcount>` element, the unread number is taken out, and the rest of the
response is discarded unparsed. That is the whole of `parseFullcount` in
`src/lib/unread.js`, and it is eleven lines long.

## What is stored

On your device, through the WebExtension `storage.local` API:

- Your settings — the mailboxes you added, with their account position, label,
  title text, and the shared refresh interval.
- The ids of the bookmarks the extension created, so it renames those and never
  touches another.

Label names you type are stored because they have to be, to build the feed URL.
No message, subject, sender or address is ever stored.

The extension deliberately does **not** use `storage.sync`, because that would
copy the above through a Mozilla account. Uninstalling removes everything it
stored.

## Permissions

| Permission                  | Why                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| `bookmarks`                 | Create one bookmark per mailbox on the toolbar and rename it. No other bookmark is read or changed. |
| `alarms`                    | Wake up on the interval you chose. Firefox event pages cannot hold a timer any other way.           |
| `storage`                   | Remember your settings and the bookmark ids, on your device.                                        |
| `https://mail.google.com/*` | Read the atom feed. This is the only host the extension may contact.                                |

There is no content script, so the extension runs on no web page at all.

## How to verify this

1. **Read the manifest.** `src/manifest.json` is under fifty lines and lists
   every permission the extension can ever have.
2. **Run the privacy check.** `npm run lint:privacy` scans the source for
   `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `EventSource`, `eval`,
   `storage.sync`, device-sensor APIs, analytics SDK names, and any URL
   pointing anywhere other than `mail.google.com`. It also fails if the
   manifest grows a permission, a content script, or a data-collection
   declaration. It runs in CI on every commit.
3. **Read the shipped code.** There is no build step. The JavaScript inside the
   add-on is byte for byte the JavaScript in `src/`.
4. **Watch the network.** Open `about:debugging`, inspect the extension, and
   look at the Network tab. Only mail.google.com appears.

## Third parties

There are none. No SDKs, no CDNs, no fonts, no remote resources of any kind.
All dependencies are development-time only and never reach your browser.

## Changes

Any change to this policy will appear in [CHANGELOG.md](CHANGELOG.md) and in
the Git history of this file.

## Contact

Open an issue at
<https://github.com/kvachikk/unread-in-bookmarks-for-gmail/issues>.
