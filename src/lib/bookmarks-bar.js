import { browser } from './browser.js';

/**
 * Resolving the bookmarks toolbar.
 *
 * Its id is a browser-specific constant — Firefox names it, Chromium numbers
 * it — and neither is guaranteed to exist in the other. Both, however, place
 * the toolbar among the children of the bookmark root, so the constants are
 * only used to pick the right child; a browser that matches neither falls
 * back to the first folder, which is the toolbar everywhere it has been seen.
 */
const TOOLBAR_IDS = new Set([
  'toolbar_____', // Firefox
  '1', // Chrome, Edge, Brave and the other Chromium builds
]);

/**
 * Cached for the life of the background context. A service worker that has
 * been shut down simply resolves it again on the next wake-up, which is one
 * call against a local database.
 */
let cached = null;

export const bookmarksBarId = async () => {
  if (cached) return cached;

  const [root] = await browser.bookmarks.getTree();
  const children = root?.children ?? [];
  const bar =
    children.find((node) => TOOLBAR_IDS.has(node.id)) ??
    children.find((node) => !node.url);

  if (!bar) throw new Error('No bookmarks toolbar in this browser');

  cached = bar.id;
  return cached;
};
