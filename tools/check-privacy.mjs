/**
 * Fails the build if the extension grows a way to send your data anywhere
 * other than the single origin it is built to read.
 *
 * The promise this extension makes is narrow but exact: it talks to
 * mail.google.com and to nothing else, it stores nothing off the device, and
 * it runs no code it did not ship with. Each of those is checked below, so the
 * claim in PRIVACY.md is enforced by CI rather than by good intentions.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const SOURCE_DIR = 'src';
const MANIFEST_PATH = 'src/manifest.json';
const SCANNED_EXTENSIONS = ['.js', '.html', '.css'];

/** The one origin this extension is allowed to contact. */
const ALLOWED_ORIGIN = 'https://mail.google.com';

/** URLs that may appear in source without being a request at runtime. */
const ALLOWED_URL_PREFIXES = [
  ALLOWED_ORIGIN,
  'https://github.com/',
  'http://www.w3.org/',
];

const ALLOWED_PERMISSIONS = ['bookmarks', 'alarms', 'storage'];

const FORBIDDEN_PATTERNS = [
  { pattern: /\bXMLHttpRequest\b/, reason: 'unreviewable network API' },
  { pattern: /\bsendBeacon\b/, reason: 'telemetry beacon' },
  { pattern: /\bWebSocket\b/, reason: 'network connection' },
  { pattern: /\bEventSource\b/, reason: 'network connection' },
  { pattern: /\bimportScripts\b/, reason: 'remote code' },
  { pattern: /\beval\s*\(/, reason: 'dynamic code execution' },
  { pattern: /new\s+Function\s*\(/, reason: 'dynamic code execution' },
  { pattern: /\bstorage\.sync\b/, reason: 'account-synced storage' },
  { pattern: /\bnavigator\.geolocation\b/, reason: 'device sensor' },
  { pattern: /\bnavigator\.mediaDevices\b/, reason: 'device sensor' },
  { pattern: /\bnavigator\.connection\b/, reason: 'device fingerprinting' },
  { pattern: /\bdocument\.cookie\b/, reason: 'cookie access' },
  {
    pattern: /\b(gtag|mixpanel|amplitude|posthog|sentry)\b/i,
    reason: 'analytics',
  },
  { pattern: /\b(telemetry|analytics)\s*[:=(]/i, reason: 'analytics' },
];

const URL_PATTERN = /https?:\/\/[^\s'"`)<>]+/g;

const collectFiles = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectFiles(path);
      files.push(...nested);
    } else if (SCANNED_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      files.push(path);
    }
  }
  return files;
};

const scanFile = async (path) => {
  const content = await readFile(path, 'utf8');
  const violations = [];

  for (const [index, line] of content.split('\n').entries()) {
    const place = { file: relative('.', path), line: index + 1 };

    for (const rule of FORBIDDEN_PATTERNS) {
      if (rule.pattern.test(line)) {
        violations.push({ ...place, reason: rule.reason, text: line.trim() });
      }
    }

    for (const url of line.match(URL_PATTERN) ?? []) {
      const allowed = ALLOWED_URL_PREFIXES.some((prefix) =>
        url.startsWith(prefix),
      );
      if (!allowed) {
        violations.push({ ...place, reason: 'foreign origin', text: url });
      }
    }
  }

  return violations;
};

const checkManifest = async () => {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  const violations = [];
  const at = (reason, text) => ({ file: MANIFEST_PATH, line: 0, reason, text });

  for (const permission of manifest.permissions ?? []) {
    if (!ALLOWED_PERMISSIONS.includes(permission)) {
      violations.push(at('permission outside the allowlist', permission));
    }
  }

  for (const permission of manifest.optional_permissions ?? []) {
    violations.push(at('optional permission', permission));
  }

  const hosts = manifest.host_permissions ?? [];
  const expected = `${ALLOWED_ORIGIN}/*`;
  if (hosts.length !== 1 || hosts[0] !== expected) {
    violations.push(at('host permissions beyond one origin', hosts.join(', ')));
  }

  if (manifest.content_scripts) {
    violations.push(at('content script', 'the extension runs on no page'));
  }

  if (manifest.web_accessible_resources) {
    violations.push(at('web accessible resource', 'pages could detect this'));
  }

  const consent =
    manifest.browser_specific_settings?.gecko?.data_collection_permissions;
  const required = consent?.required ?? [];
  if (required.length !== 1 || required[0] !== 'none') {
    violations.push(
      at('data collection declared', `required: ${required.join(', ')}`),
    );
  }

  return violations;
};

const run = async () => {
  const files = await collectFiles(SOURCE_DIR);
  const scanned = await Promise.all(files.map(scanFile));
  const manifest = await checkManifest();
  const violations = [...scanned.flat(), ...manifest];

  if (violations.length > 0) {
    console.error('Privacy check failed:\n');
    for (const violation of violations) {
      console.error(
        `  ${violation.file}:${violation.line}  ${violation.reason}\n` +
          `    ${violation.text}`,
      );
    }
    console.error(`\n${violations.length} violation(s).`);
    process.exit(1);
  }

  console.log(`Privacy check passed: ${files.length} files clean.`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
