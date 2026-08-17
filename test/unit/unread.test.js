import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_WATCHER,
  DEFAULT_SETTINGS,
  MAX_WATCHERS,
  feedUrl,
  inboxUrl,
  parseFullcount,
  formatTitle,
  describeWatcher,
  normalizeSettings,
} from '../../src/lib/unread.js';

const watcher = (over = {}) => ({ ...DEFAULT_WATCHER, id: 'w', ...over });

test('feedUrl points at the inbox when no label is set', () => {
  assert.equal(
    feedUrl(watcher()),
    'https://mail.google.com/mail/u/0/feed/atom',
  );
});

test('feedUrl appends and escapes the label', () => {
  assert.equal(
    feedUrl(watcher({ accountIndex: 2, label: 'to do' })),
    'https://mail.google.com/mail/u/2/feed/atom/to%20do',
  );
});

test('inboxUrl follows the account and label', () => {
  assert.equal(
    inboxUrl(watcher({ accountIndex: 1 })),
    'https://mail.google.com/mail/u/1/#inbox',
  );
  assert.equal(
    inboxUrl(watcher({ accountIndex: 1, label: 'work' })),
    'https://mail.google.com/mail/u/1/#label/work',
  );
});

test('parseFullcount reads the count out of a feed', () => {
  const xml = '<feed><title>Gmail</title><fullcount>7</fullcount></feed>';
  assert.equal(parseFullcount(xml), 7);
});

test('parseFullcount returns null when the element is absent', () => {
  assert.equal(parseFullcount('<html>Sign in</html>'), null);
});

test('parseFullcount keeps zero distinct from missing', () => {
  assert.equal(parseFullcount('<fullcount>0</fullcount>'), 0);
});

test('formatTitle substitutes the count', () => {
  assert.equal(formatTitle(3, watcher()), '3 new');
});

test('formatTitle uses the empty text at zero', () => {
  assert.equal(formatTitle(0, watcher()), 'nothing');
});

test('formatTitle replaces every placeholder in a template', () => {
  const box = watcher({ template: '{n} · {n}' });
  assert.equal(formatTitle(4, box), '4 · 4');
});

test('describeWatcher counts accounts from one', () => {
  assert.equal(describeWatcher(watcher()), 'Account 1 · Inbox');
  assert.equal(
    describeWatcher(watcher({ accountIndex: 1, label: 'work' })),
    'Account 2 · work',
  );
});

test('normalizeSettings falls back to one inbox', () => {
  assert.deepEqual(normalizeSettings(undefined), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings({ watchers: [] }), DEFAULT_SETTINGS);
});

test('normalizeSettings keeps several mailboxes', () => {
  const settings = normalizeSettings({
    watchers: [
      { id: 'a', accountIndex: 0, label: '', template: 'work {n}' },
      { id: 'b', accountIndex: 1, label: 'family', template: '{n}' },
    ],
  });
  assert.equal(settings.watchers.length, 2);
  assert.equal(settings.watchers[1].label, 'family');
});

test('normalizeSettings gives duplicate ids something unique', () => {
  const settings = normalizeSettings({
    watchers: [{ id: 'same' }, { id: 'same' }],
  });
  assert.notEqual(settings.watchers[0].id, settings.watchers[1].id);
});

test('normalizeSettings caps how many mailboxes are kept', () => {
  const many = Array.from({ length: MAX_WATCHERS + 5 }, (_, index) => ({
    id: `w${index}`,
  }));
  assert.equal(normalizeSettings({ watchers: many }).watchers.length, 10);
});

test('normalizeSettings rejects a template with no placeholder', () => {
  const settings = normalizeSettings({
    watchers: [{ id: 'a', template: 'always the same' }],
  });
  assert.equal(settings.watchers[0].template, DEFAULT_WATCHER.template);
});

test('normalizeSettings clamps the account index and interval', () => {
  const settings = normalizeSettings({
    intervalMinutes: 0,
    watchers: [{ id: 'a', accountIndex: 99 }],
  });
  assert.equal(settings.intervalMinutes, 1);
  assert.equal(settings.watchers[0].accountIndex, 9);
});
