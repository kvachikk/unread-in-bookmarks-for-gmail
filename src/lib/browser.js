/**
 * Chrome exposes the extension APIs as `chrome`, Firefox as `browser`.
 *
 * Every API this extension touches — storage, bookmarks, alarms, action,
 * runtime — returns a promise when called without a callback under MV3 in
 * both browsers, so aliasing the namespace is the whole compatibility layer.
 * No polyfill is bundled: what you read here is what runs.
 */

export const browser = globalThis.browser ?? globalThis.chrome;
