'use strict';

/**
 * Unread in Bookmarks for Gmail
 *
 * Polls the Gmail atom feed for every mailbox you configured and writes each
 * unread count into the title of its own bookmark on the bookmarks toolbar.
 * The extension creates and owns those bookmarks and touches nothing else.
 *
 * Helpers come from lib/unread.js, loaded ahead of this file by the manifest:
 * DEFAULT_SETTINGS, PLACEHOLDER_TITLE, FALLBACK_TITLE, feedUrl, inboxUrl,
 * parseFullcount, formatTitle, describeWatcher, normalizeSettings.
 */

/* global DEFAULT_SETTINGS, PLACEHOLDER_TITLE, FALLBACK_TITLE, feedUrl,
   inboxUrl, parseFullcount, formatTitle, describeWatcher, normalizeSettings */

const BOOKMARK_FOLDER_ID = 'toolbar_____'; // Firefox's Bookmarks Toolbar
const ALARM_NAME = 'poll';

const BADGE_ERROR = '#7f8c8d';
const BADGE_UNREAD = '#c0392b';

// ── Settings ───────────────────────────────────────────────────────────────

const readSettings = async () => {
  const { settings } = await browser.storage.local.get('settings');
  return normalizeSettings(settings ?? DEFAULT_SETTINGS);
};

/**
 * Bookmark ids are kept per watcher. Extensions installed before mailboxes
 * became a list stored a single `bookmarkId`; adopt it for the first watcher
 * so upgrading does not strand a bookmark nobody owns.
 */
const readBookmarkIds = async (watchers) => {
  const stored = await browser.storage.local.get(['bookmarkIds', 'bookmarkId']);
  if (stored.bookmarkIds) return { ...stored.bookmarkIds };
  if (stored.bookmarkId && watchers.length) {
    return { [watchers[0].id]: stored.bookmarkId };
  }
  return {};
};

// ── Unread count ───────────────────────────────────────────────────────────

const fetchUnread = async (watcher) => {
  const res = await fetch(feedUrl(watcher), { credentials: 'include' });

  if (res.status === 401) throw new Error('Not signed in to Gmail');
  if (!res.ok) throw new Error(`feed → HTTP ${res.status}`);

  const count = parseFullcount(await res.text());
  if (count === null) {
    throw new Error(`No feed for ${describeWatcher(watcher)}`);
  }
  return count;
};

// ── Bookmarks ──────────────────────────────────────────────────────────────

/**
 * Returns the id of a watcher's bookmark, creating it on the toolbar if it is
 * gone and repointing it when the account or label changed under it.
 */
const ensureBookmark = async (watcher, knownId) => {
  const target = inboxUrl(watcher);

  if (knownId) {
    try {
      const [node] = await browser.bookmarks.get(knownId);
      if (node) {
        if (node.url !== target) {
          await browser.bookmarks.update(node.id, { url: target });
        }
        return node.id;
      }
    } catch {
      // Deleted by the user — make a new one below.
    }
  }

  const created = await browser.bookmarks.create({
    parentId: BOOKMARK_FOLDER_ID,
    title: PLACEHOLDER_TITLE,
    url: target,
  });
  return created.id;
};

/** Removes the bookmarks of mailboxes that are no longer configured. */
const dropOrphans = async (bookmarkIds, watchers) => {
  const live = new Set(watchers.map((watcher) => watcher.id));
  for (const [watcherId, bookmarkId] of Object.entries(bookmarkIds)) {
    if (live.has(watcherId)) continue;
    try {
      await browser.bookmarks.remove(bookmarkId);
    } catch {
      // Already gone. Dropping the mapping below is all that is left to do.
    }
    delete bookmarkIds[watcherId];
  }
};

// ── Refresh loop ───────────────────────────────────────────────────────────

const setBadge = (text, color, title) => {
  browser.action.setBadgeText({ text });
  browser.action.setBadgeBackgroundColor({ color });
  browser.action.setTitle({ title });
};

/** Updates one bookmark. Returns the unread count, or null when it failed. */
const refreshWatcher = async (watcher, bookmarkId) => {
  try {
    const count = await fetchUnread(watcher);
    await browser.bookmarks.update(bookmarkId, {
      title: formatTitle(count, watcher),
    });
    return count;
  } catch (error) {
    console.warn('[unread-in-bookmarks]', describeWatcher(watcher), error);
    await browser.bookmarks.update(bookmarkId, { title: FALLBACK_TITLE });
    return null;
  }
};

const summarize = (watchers, counts) => {
  const failed = counts.filter((count) => count === null).length;
  const total = counts.reduce((sum, count) => sum + (count ?? 0), 0);

  if (failed === counts.length) {
    setBadge('!', BADGE_ERROR, 'Gmail unread: no mailbox could be read');
    return;
  }

  const lines = watchers.map((watcher, index) => {
    const count = counts[index];
    const value = count === null ? 'unavailable' : `${count} unread`;
    return `${describeWatcher(watcher)}: ${value}`;
  });

  setBadge(total ? String(total) : '', BADGE_UNREAD, lines.join('\n'));
};

const refresh = async () => {
  const { watchers } = await readSettings();

  let bookmarkIds;
  try {
    bookmarkIds = await readBookmarkIds(watchers);
    await dropOrphans(bookmarkIds, watchers);
    for (const watcher of watchers) {
      bookmarkIds[watcher.id] = await ensureBookmark(
        watcher,
        bookmarkIds[watcher.id],
      );
    }
    await browser.storage.local.set({ bookmarkIds });
  } catch (error) {
    console.warn('[unread-in-bookmarks]', error);
    setBadge('!', BADGE_ERROR, `Gmail unread: ${error.message}`);
    return;
  }

  const counts = [];
  for (const watcher of watchers) {
    counts.push(await refreshWatcher(watcher, bookmarkIds[watcher.id]));
  }
  summarize(watchers, counts);
};

/** (Re)arms the poll timer. Firefox clamps periods below one minute. */
const scheduleAlarm = async () => {
  const { intervalMinutes } = await readSettings();
  await browser.alarms.clear(ALARM_NAME);
  browser.alarms.create(ALARM_NAME, {
    periodInMinutes: intervalMinutes,
    when: Date.now() + 500,
  });
};

// Changing the interval has to rebuild the alarm; every other setting only
// changes the next titles, which the following tick picks up anyway.
browser.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.settings) return;
  const before = changes.settings.oldValue?.intervalMinutes;
  const after = changes.settings.newValue?.intervalMinutes;
  if (before !== after) scheduleAlarm();
  else refresh();
});

browser.alarms.onAlarm.addListener(refresh);
browser.runtime.onInstalled.addListener(scheduleAlarm);
browser.runtime.onStartup.addListener(scheduleAlarm);
browser.action.onClicked.addListener(refresh);

scheduleAlarm();
