// Prebuild: clone the CMS MES Certification Repository and generate src/data/*.json.
// Runs before `next build`, locally and on Vercel.
//
// Content is PINNED to a known-good CMS commit (see PINNED_REF) so builds are
// reproducible and CMS cannot change the site's content under us between deploys.
// To resume tracking the latest CMS content, set CERT_REPO_REF=HEAD in the
// environment, or clear PINNED_REF below.
//
// Env knobs:
//   CERT_REPO_DIR    — reuse an existing clone (skips cloning if _data/ present)
//   CERT_REPO_REF    — override the pin with a commit/tag/branch. HEAD = latest.
//
// Failure behavior:
//   - Clone fails (GitHub down, repo moved) → fall back to the committed data-snapshot/,
//     with a loud warning. No snapshot → hard fail.
//   - ETL sanity checks fail (CMS renamed/emptied files) → hard fail. Never ship a hole.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const REPO_URL = 'https://github.com/CMSgov/CMCS-DSG-DSS-Certification.git';
const dir = process.env.CERT_REPO_DIR || path.join(os.tmpdir(), 'certrepo');
// Known-good CMS commit. Not sensitive — a public commit in a public repo.
// Verified: modules=16 outcomes=132 stateExamples=58 cefs=22 guidance=6 regulations=124 assets=6
const PINNED_REF = 'c9db9cd049f6641373b1ad0bb5aa1e07bd0ce68a';
const ref = process.env.CERT_REPO_REF || PINNED_REF;
const snapshotDir = path.join(process.cwd(), 'data-snapshot');
const outDir = path.join(process.cwd(), 'src', 'data');

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
  console.log(`Cert repo at commit ${head}${pinned ? (onPin ? ` (pinned: ${ref})` : ' (PIN NOT APPLIED)') : ' (latest)'}`);
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

// Refresh the committed snapshot so the fallback stays current with the last good build.
fs.mkdirSync(snapshotDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) {
  fs.copyFileSync(path.join(outDir, f), path.join(snapshotDir, f));
}
