'use strict';

/**
 * Pure helpers shared by the background script and the options page.
 *
 * This file is a classic script in the browser and a CommonJS module under
 * `node --test`, which is what the export tail at the bottom is for.
 */

const ORIGIN = 'https://mail.google.com';

/**
 * One mailbox being watched. Every watcher owns exactly one bookmark, so an
 * account and a label can each get their own line on the toolbar.
 */
const DEFAULT_WATCHER = {
  accountIndex: 0,
  label: '',
  template: '{n} new',
  zeroText: 'nothing',
};

const DEFAULT_SETTINGS = {
  intervalMinutes: 1,
  watchers: [{ ...DEFAULT_WATCHER, id: 'default' }],
};

/** Title before the first successful poll. */
const PLACEHOLDER_TITLE = 'Gmail';

/** Title after a failed poll, so a stale count is never left on screen. */
const FALLBACK_TITLE = '—';

const MAX_ACCOUNT_INDEX = 9;
const MAX_WATCHERS = 10;

/**
 * The atom feed for one mailbox. Google exposes it per label, and the empty
 * label is the inbox — the same feed desktop mail checkers have always read.
 */
const feedUrl = ({ accountIndex, label }) => {
  const base = `${ORIGIN}/mail/u/${accountIndex}/feed/atom`;
  return label ? `${base}/${encodeURIComponent(label)}` : base;
};

/** Where the bookmark points once clicked. */
const inboxUrl = ({ accountIndex, label }) => {
  const base = `${ORIGIN}/mail/u/${accountIndex}/`;
  return label ? `${base}#label/${encodeURIComponent(label)}` : `${base}#inbox`;
};

/**
 * Pulls `<fullcount>` out of the feed. Returns null when the element is
 * absent, which is what Google answers for an account index nobody is
 * signed in to.
 */
const parseFullcount = (xml) => {
  const match = /<fullcount>(\d+)<\/fullcount>/.exec(xml);
  return match ? Number(match[1]) : null;
};

/** Builds the bookmark title. `{n}` in the template is the unread count. */
const formatTitle = (count, watcher = DEFAULT_WATCHER) => {
  if (!count) return watcher.zeroText;
  return watcher.template.replaceAll('{n}', String(count));
};

/** A human label for a mailbox, used in the options page and error messages. */
const describeWatcher = ({ accountIndex, label }) => {
  const account = `Account ${accountIndex + 1}`;
  return label ? `${account} · ${label}` : `${account} · Inbox`;
};

const clampInt = (value, min, max, fallback) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
};

const normalizeWatcher = (stored, fallbackId) => {
  const source = stored && typeof stored === 'object' ? stored : {};
  const id =
    typeof source.id === 'string' && source.id ? source.id : fallbackId;
  const template =
    typeof source.template === 'string' && source.template.includes('{n}')
      ? source.template
      : DEFAULT_WATCHER.template;
  return {
    id,
    accountIndex: clampInt(
      source.accountIndex,
      0,
      MAX_ACCOUNT_INDEX,
      DEFAULT_WATCHER.accountIndex,
    ),
    label:
      typeof source.label === 'string'
        ? source.label.trim()
        : DEFAULT_WATCHER.label,
    template,
    zeroText:
      typeof source.zeroText === 'string'
        ? source.zeroText
        : DEFAULT_WATCHER.zeroText,
  };
};

/**
 * Drops unknown keys and out-of-range values from anything read out of
 * storage, and guarantees at least one watcher with a unique id — a settings
 * object with no watchers would leave the extension doing nothing at all.
 */
const normalizeSettings = (stored) => {
  const source = stored && typeof stored === 'object' ? stored : {};
  const list = Array.isArray(source.watchers) ? source.watchers : [];
  const seen = new Set();
  const watchers = [];

  for (const [index, entry] of list.slice(0, MAX_WATCHERS).entries()) {
    const watcher = normalizeWatcher(entry, `watcher-${index}`);
    if (seen.has(watcher.id)) watcher.id = `${watcher.id}-${index}`;
    seen.add(watcher.id);
    watchers.push(watcher);
  }

  return {
    intervalMinutes: clampInt(
      source.intervalMinutes,
      1,
      60,
      DEFAULT_SETTINGS.intervalMinutes,
    ),
    watchers: watchers.length
      ? watchers
      : DEFAULT_SETTINGS.watchers.map((watcher) => ({ ...watcher })),
  };
};

if (typeof module === 'object' && module.exports) {
  module.exports = {
    ORIGIN,
    DEFAULT_WATCHER,
    DEFAULT_SETTINGS,
    PLACEHOLDER_TITLE,
    FALLBACK_TITLE,
    MAX_ACCOUNT_INDEX,
    MAX_WATCHERS,
    feedUrl,
    inboxUrl,
    parseFullcount,
    formatTitle,
    describeWatcher,
    normalizeSettings,
    normalizeWatcher,
  };
}
