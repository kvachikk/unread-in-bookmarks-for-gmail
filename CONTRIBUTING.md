# Contributing

Thanks for taking a look.

## Setup

```bash
npm ci
npm run lint && npm test
```

Git hooks are installed automatically: staged files are linted and formatted,
commit messages are checked, and tests run before a push.

## Rules that are not negotiable

This extension makes one promise — it collects nothing, and it talks to
`mail.google.com` and to nowhere else. Any change that adds a host, a network API,
`eval`, `storage.sync`, a content script, or a manifest permission will fail
`npm run lint:privacy` in CI. If you believe a change genuinely needs one,
open an issue first.

There is no build step, and there should not be one: the JavaScript in the
signed add-on is the JavaScript in `src/`, which is what makes the add-on
reviewable by anyone who cares to look. Keep runtime dependencies out
entirely.

## Style

`eslint-config-metarhia` plus Prettier, 80 columns. Prefer code that reads
without comments; comment only what the code cannot say.

Note that `src/` ships as classic scripts sharing one global scope — the
manifest loads `lib/` ahead of the background script — so files there use no
`import`. The export tail at the bottom of each `lib/` file is what lets
`node --test` require the same file as a CommonJS module.

## Commits

[Conventional Commits](https://www.conventionalcommits.org), lower case, 72
characters max:

```
feat(options): let several mailboxes be watched at once
fix(feed): keep a zero count distinct from a missing one
```

Allowed scopes are listed in `commitlint.config.js`.

## Testing a change

Pure helpers in `src/lib/` get a unit test in `test/unit/`. Anything
touching bookmarks, alarms or the options page has to be checked in a real
browser:

```bash
npm start
```

That opens a scratch Firefox profile with the extension loaded. You will need
to sign in to Gmail in it before the bookmark shows anything.
