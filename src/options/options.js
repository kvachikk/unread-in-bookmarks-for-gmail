import { browser } from '../lib/browser.js';
import {
  DEFAULT_WATCHER,
  DEFAULT_SETTINGS,
  MAX_ACCOUNT_INDEX,
  MAX_WATCHERS,
  formatTitle,
  describeWatcher,
  normalizeSettings,
} from '../lib/unread.js';

const mailboxes = document.getElementById('mailboxes');
const mailboxTemplate = document.getElementById('mailbox-template');
const interval = document.getElementById('interval');
const statusLine = document.getElementById('status');
const addButton = document.getElementById('add');
const resetButton = document.getElementById('reset');

const SAMPLE_COUNT = 3;

let statusTimer = null;

const say = (message) => {
  statusLine.textContent = message;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusLine.textContent = '';
  }, 1500);
};

const fieldsOf = (card) => ({
  title: card.querySelector('[data-role="title"]'),
  account: card.querySelector('[data-role="account"]'),
  label: card.querySelector('[data-role="label"]'),
  template: card.querySelector('[data-role="template"]'),
  zero: card.querySelector('[data-role="zero"]'),
  preview: card.querySelector('[data-role="preview"]'),
  remove: card.querySelector('[data-role="remove"]'),
});

const readCard = (card) => {
  const field = fieldsOf(card);
  return {
    id: card.dataset.id,
    accountIndex: Number(field.account.value),
    label: field.label.value,
    template: field.template.value,
    zeroText: field.zero.value,
  };
};

/** Everything on screen, as a settings object. */
const collect = () => ({
  intervalMinutes: Number(interval.value),
  watchers: [...mailboxes.children].map(readCard),
});

const paintCard = (card, watcher) => {
  const field = fieldsOf(card);
  const withMail = formatTitle(SAMPLE_COUNT, watcher);
  const empty = formatTitle(0, watcher);
  field.title.textContent = describeWatcher(watcher);
  field.preview.textContent = `${withMail}   ·   ${empty}`;
};

const buildCard = (watcher) => {
  const card = mailboxTemplate.content.firstElementChild.cloneNode(true);
  card.dataset.id = watcher.id;

  const field = fieldsOf(card);
  for (let index = 0; index <= MAX_ACCOUNT_INDEX; index++) {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = index === 0 ? '1 (first)' : String(index + 1);
    field.account.append(option);
  }

  field.account.value = String(watcher.accountIndex);
  field.label.value = watcher.label;
  field.template.value = watcher.template;
  field.zero.value = watcher.zeroText;
  paintCard(card, watcher);

  // Removing a card is a settings change like any other, so let it travel the
  // same path rather than reaching forward to the save function.
  field.remove.addEventListener('click', () => {
    card.remove();
    mailboxes.dispatchEvent(new Event('change', { bubbles: true }));
  });

  return card;
};

const apply = (settings) => {
  interval.value = String(settings.intervalMinutes);
  mailboxes.replaceChildren(...settings.watchers.map(buildCard));
  addButton.disabled = settings.watchers.length >= MAX_WATCHERS;
};

/**
 * Normalizing before saving means a rejected value (a template without `{n}`,
 * an out-of-range account) is replaced rather than stored, so what the page
 * shows after a save is exactly what the background script will use.
 */
const save = async () => {
  const settings = normalizeSettings(collect());
  await browser.storage.local.set({ settings });
  apply(settings);
  say('Saved');
};

const load = async () => {
  const { settings } = await browser.storage.local.get('settings');
  apply(normalizeSettings(settings ?? DEFAULT_SETTINGS));
};

mailboxes.addEventListener('input', (event) => {
  const card = event.target.closest('.mailbox');
  if (card) paintCard(card, readCard(card));
});

document.addEventListener('change', save);

addButton.addEventListener('click', () => {
  const watcher = { ...DEFAULT_WATCHER, id: crypto.randomUUID() };
  mailboxes.append(buildCard(watcher));
  save();
});

resetButton.addEventListener('click', async () => {
  const settings = normalizeSettings(DEFAULT_SETTINGS);
  await browser.storage.local.set({ settings });
  apply(settings);
  say('Defaults restored');
});

load();
