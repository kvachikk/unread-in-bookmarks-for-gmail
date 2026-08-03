# Security Policy

## Supported versions

The latest release on addons.mozilla.org.

## Reporting a vulnerability

Use [GitHub private vulnerability
reporting](https://github.com/kvachikk/unread-in-bookmarks-for-gmail/security/advisories/new).
Please do not open a public issue for a security problem.

Expect a first reply within a week.

## Scope

The extension has no content script and runs on no page, which removes most of
the usual surface. Reports of most interest:

- Anything that lets the extension contact a host other than `mail.google.com`.
- Anything that leaks the response, or the cookies authenticating it, off the
  device — the extension has no other network access by design, so any path to
  one is a bug.
- Anything that reads or modifies a bookmark the extension did not create.
- Anything that turns a value in settings into executed code.

`npm audit` findings in development-only dependencies (`web-ext` and its
tree) are out of scope: they never ship to users.
