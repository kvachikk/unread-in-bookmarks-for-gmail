/**
 * Assembles a loadable extension directory for one browser.
 *
 * There is no bundler and no transpiler here on purpose: `src/` already holds
 * plain ES modules that both browsers load as they are. The only thing that
 * genuinely differs between the two is the manifest — Chromium wants a
 * `service_worker`, Firefox wants `scripts` and its gecko block — so the build
 * copies the sources verbatim and drops the right manifest in beside them.
 *
 *   node tools/build.mjs chrome    → dist/chrome/
 *   node tools/build.mjs firefox   → dist/firefox/
 */

import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SOURCE_DIR = 'src';
const OUTPUT_ROOT = 'dist';
const TARGETS = ['chrome', 'firefox'];

/** Source files that describe a build rather than belong to one. */
const isManifest = (name) => /^manifest\.[a-z]+\.json$/.test(name);

const build = async (target) => {
  const outDir = join(OUTPUT_ROOT, target);
  const manifestPath = join(SOURCE_DIR, `manifest.${target}.json`);

  // Parsed rather than copied so a syntax error fails the build here, and not
  // silently at install time in a browser.
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  await cp(SOURCE_DIR, outDir, {
    recursive: true,
    filter: (source) => !isManifest(source.split('/').pop()),
  });

  await writeFile(
    join(outDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  console.log(`Built ${target} → ${outDir}/ (v${manifest.version})`);
};

const run = async () => {
  const requested = process.argv.slice(2);
  const targets = requested.length ? requested : TARGETS;

  for (const target of targets) {
    if (!TARGETS.includes(target)) {
      throw new Error(`Unknown target "${target}". Use: ${TARGETS.join(', ')}`);
    }
    await build(target);
  }
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
