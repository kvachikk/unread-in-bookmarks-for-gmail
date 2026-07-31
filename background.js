/**
 * Gmail Unread in Bookmarks
 *
 * Polls the Gmail atom feed and writes the unread count into the title of a
 * bookmark on the bookmarks toolbar, which the extension creates and owns.
 */

// ── Configuration ──────────────────────────────────────────────────────────

/** Poll interval in minutes. Firefox silently clamps anything below 1. */
const PERIOD_MINUTES = 1;

/** Which signed-in Google account: 0 is the first one, 1 the second, and so on. */
const ACCOUNT_INDEX = 0;

/** Feed to count. "" is the inbox; a label name counts that label instead. */
const LABEL = "";

const FEED_URL =
  `https://mail.google.com/mail/u/${ACCOUNT_INDEX}/feed/atom` +
  (LABEL ? `/${encodeURIComponent(LABEL)}` : "");
const BOOKMARK_URL = `https://mail.google.com/mail/u/${ACCOUNT_INDEX}/#inbox`;
const BOOKMARK_FOLDER_ID = "toolbar_____"; // Firefox's Bookmarks Toolbar

/** Title before the first successful poll, and after a failed one. */
const PLACEHOLDER_TITLE = "Gmail";
const FALLBACK_TITLE = "—";

/**
 * Builds the bookmark title. Edit freely — the unread count is passed in.
 *
 * Examples:
 *   bare number  →  return String(n);
 *   with icon    →  return n ? `✉ ${n}` : "✉";
 */
function formatTitle(n) {
  return n ? `${n} new` : "nothing";
}

// ── Unread count ───────────────────────────────────────────────────────────

async function fetchUnread() {
  const res = await fetch(FEED_URL, { credentials: "include" });

  if (res.status === 401) throw new Error("Not signed in to Gmail");
  if (!res.ok) throw new Error(`feed → HTTP ${res.status}`);

  const xml = await res.text();
  const match = xml.match(/<fullcount>(\d+)<\/fullcount>/);
  if (!match) throw new Error("No count in feed — check the account index");
  return Number(match[1]);
}

// ── Bookmark ───────────────────────────────────────────────────────────────

/** Returns the id of our bookmark, creating it on the toolbar if it isn't there. */
async function ensureBookmark() {
  const { bookmarkId } = await browser.storage.local.get("bookmarkId");
  if (bookmarkId) {
    try {
      const [node] = await browser.bookmarks.get(bookmarkId);
      if (node) return node.id;
    } catch {
      // Deleted by the user — make a new one below.
    }
  }

  const created = await browser.bookmarks.create({
    parentId: BOOKMARK_FOLDER_ID,
    title: PLACEHOLDER_TITLE,
    url: BOOKMARK_URL,
  });
  await browser.storage.local.set({ bookmarkId: created.id });
  return created.id;
}

// ── Refresh loop ───────────────────────────────────────────────────────────

function setBadge(text, color, title) {
  browser.action.setBadgeText({ text });
  browser.action.setBadgeBackgroundColor({ color });
  browser.action.setTitle({ title });
}

async function refresh() {
  let id;
  try {
    id = await ensureBookmark();
  } catch (err) {
    console.warn("[gmail-unread]", err);
    setBadge("!", "#7f8c8d", `Gmail unread: ${err.message}`);
    return;
  }

  try {
    const n = await fetchUnread();
    await browser.bookmarks.update(id, { title: formatTitle(n) });
    setBadge(n ? String(n) : "", "#c0392b", n ? `Gmail: ${n} unread` : "Gmail: nothing new");
  } catch (err) {
    console.warn("[gmail-unread]", err);
    setBadge("!", "#7f8c8d", `Gmail unread: ${err.message}`);
    await browser.bookmarks.update(id, { title: FALLBACK_TITLE });
  }
}

browser.alarms.create("poll", {
  periodInMinutes: PERIOD_MINUTES,
  when: Date.now() + 500,
});
browser.alarms.onAlarm.addListener(refresh);
browser.runtime.onInstalled.addListener(refresh);
browser.runtime.onStartup.addListener(refresh);
browser.action.onClicked.addListener(refresh);
