// Prebuild: clone the CMS MES Certification Repository and generate src/data/*.json.
// Runs before `next build`, locally and on Vercel.
//
// Content is PINNED to a reviewed CMS commit so builds are reproducible and CMS
// cannot change the site's content under us between deploys. The pin is not a
// constant in this file — it is `sourceCommit` in data-snapshot/meta.json, the
// commit that produced the committed data. One source of truth: the pin and the
// data it generated cannot drift apart.
//
// The pin moves weekly, not never. .github/workflows/cms-sync.yml builds against
// CMS HEAD every Monday and, when content actually changed, opens a PR carrying
// the new data plus the summary of what moved. Merging that PR advances the pin,
// because the snapshot refresh at the bottom of this file rewrites meta.json with
// the commit the build used.
//
// Env knobs:
//   CERT_REPO_DIR    — reuse an existing clone (skips cloning if _data/ present)
//   CERT_REPO_REF    — override the pin with a commit/tag/branch. HEAD = latest.
//
// Failure behavior:
//   - Clone fails (GitHub down, repo moved) → fall back to the committed data-snapshot/,
//     with a loud warning. No snapshot → hard fail.
//   - ETL sanity checks fail (CMS renamed/emptied files) → hard fail. Never ship a hole.
//   - No pin readable and no CERT_REPO_REF → hard fail. An unreadable pin must never
//     silently become "track whatever CMS has today".
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const REPO_URL = 'https://github.com/CMSgov/CMCS-DSG-DSS-Certification.git';
const dir = process.env.CERT_REPO_DIR || path.join(os.tmpdir(), 'certrepo');
const snapshotDir = path.join(process.cwd(), 'data-snapshot');
const outDir = path.join(process.cwd(), 'src', 'data');

// The pin: the CMS commit that produced the committed snapshot. Not sensitive —
// a public commit in a public repo.
function readPin() {
  const metaPath = path.join(snapshotDir, 'meta.json');
  let commit;
  try {
    commit = JSON.parse(fs.readFileSync(metaPath, 'utf8')).sourceCommit;
  } catch (err) {
    throw new Error(
      `Cannot read the CMS content pin from ${metaPath}: ${err.message}\n` +
        'Restore data-snapshot/meta.json, or set CERT_REPO_REF explicitly ' +
        '(CERT_REPO_REF=HEAD tracks the latest CMS content).',
    );
  }
  if (!commit || commit === 'unknown') {
    throw new Error(
      `No usable sourceCommit in ${metaPath} (got ${JSON.stringify(commit)}).\n` +
        'Set CERT_REPO_REF explicitly (CERT_REPO_REF=HEAD tracks the latest CMS content).',
    );
  }
  return commit;
}

const ref = process.env.CERT_REPO_REF || readPin();

function cloneRepo() {
  // CERT_REPO_REF=HEAD is the documented way to opt out of the pin and track latest.
  const pinned = ref && ref !== 'HEAD';

  if (fs.existsSync(path.join(dir, '_data'))) {
    console.log(`Using existing cert repo at ${dir}`);
  } else {
    fs.rmSync(dir, { recursive: true, force: true });
    if (pinned) {
      console.log(`Cloning CMS certification repo (full) into ${dir} and pinning to ${ref} …`);
      execSync(`git clone ${REPO_URL} "${dir}"`, { stdio: 'inherit' });
      execSync(`git -C "${dir}" checkout --quiet ${ref}`, { stdio: 'inherit' });
    } else {
      console.log(`Cloning CMS certification repo into ${dir} (tracking latest) …`);
      execSync(`git clone --depth 1 ${REPO_URL} "${dir}"`, { stdio: 'inherit' });
    }
  }

  const head = execSync(`git -C "${dir}" rev-parse HEAD`).toString().trim();
  process.env.CERT_REPO_COMMIT = head;

  // A reused clone (CERT_REPO_DIR) is left at whatever it was last checked out to —
  // it never goes through the checkout above, so it can silently defeat the pin.
  // Resolve what the pin actually points at and compare, rather than assuming.
  let want = '';
  if (pinned) {
    try {
      want = execSync(`git -C "${dir}" rev-parse --verify --quiet "${ref}^{commit}"`).toString().trim();
    } catch {
      want = ''; // ref not present locally (e.g. a shallow reused clone) — cannot confirm
    }
  }
  const onPin = !pinned || (want !== '' && want === head);

  if (pinned && !onPin) {
    console.warn(`\n!!! Cert repo at ${dir} is on ${head}, not the pinned ${ref}.`);
    console.warn('!!! Reusing an existing clone skips checkout. Remove that directory, or unset');
    console.warn('!!! CERT_REPO_DIR, to build against the pinned content.\n');
  }
  const source = process.env.CERT_REPO_REF ? 'CERT_REPO_REF' : 'data-snapshot/meta.json';
  console.log(
    `Cert repo at commit ${head}${pinned ? (onPin ? ` (pinned: ${ref} from ${source})` : ' (PIN NOT APPLIED)') : ` (latest, via ${source})`}`,
  );
}

try {
  cloneRepo();
} catch (err) {
  console.error(`\n!!! Could not clone the CMS certification repo: ${err.message}`);
  if (fs.existsSync(path.join(snapshotDir, 'outcomes.json'))) {
    console.error('!!! FALLING BACK to committed data-snapshot/. Content may be stale — check meta.json syncedAt.\n');
    fs.mkdirSync(outDir, { recursive: true });
    for (const f of fs.readdirSync(snapshotDir)) {
      fs.copyFileSync(path.join(snapshotDir, f), path.join(outDir, f));
    }
    process.exit(0); // skip ETL; snapshot is already the ETL output
  }
  console.error('!!! No data-snapshot/ fallback available. Failing the build.');
  throw err;
}

process.env.CERT_REPO_DIR = dir;
await import('./etl.mjs');

// Refresh the committed snapshot so the fallback stays current with the last good
// build — and, because the pin is read from meta.json, so that a build against a
// newer CMS commit advances the pin in the same commit as the data it produced.
fs.mkdirSync(snapshotDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) {
  fs.copyFileSync(path.join(outDir, f), path.join(snapshotDir, f));
}
