// Prebuild: clone the source repositories and generate src/data/*.json.
// Runs before `next build`, locally and on Vercel.
//
// Two sources, pinned the same way:
//   CMS MES Certification Repository -> outcomes, CEFs, guidance, regulations
//   mita-open-blueprint              -> MITA business processes and maturity models
//
// Content is PINNED to a reviewed commit per source so builds are reproducible and
// neither upstream can change the site's content under us between deploys. The pins
// are not constants in this file — they are `sourceCommit` and `mitaSourceCommit` in
// data-snapshot/meta.json, the commits that produced the committed data. One source
// of truth: a pin and the data it generated cannot drift apart.
//
// The pins move on review, not never. .github/workflows/cms-sync.yml builds against
// upstream HEAD every Monday and, when content actually changed, opens a PR carrying
// the new data plus the summary of what moved. Merging that PR advances the pin,
// because the snapshot refresh at the bottom of this file rewrites meta.json with the
// commits the build used.
//
// Env knobs:
//   CERT_REPO_DIR / MITA_REPO_DIR — reuse an existing clone (skips cloning)
//   CERT_REPO_REF / MITA_REPO_REF — override that pin. HEAD = latest.
//
// Failure behavior:
//   - Clone fails (GitHub down, repo moved) → fall back to the committed data-snapshot/,
//     with a loud warning. No snapshot → hard fail.
//   - ETL sanity checks fail (upstream renamed/emptied files) → hard fail. Never ship a hole.
//   - No pin readable and no *_REPO_REF → hard fail. An unreadable pin must never
//     silently become "track whatever upstream has today".
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CERT_REPO_URL = 'https://github.com/CMSgov/CMCS-DSG-DSS-Certification.git';
const MITA_REPO_URL = 'https://github.com/nickarrow/mita-open-blueprint.git';
const dir = process.env.CERT_REPO_DIR || path.join(os.tmpdir(), 'certrepo');
const mitaDir = process.env.MITA_REPO_DIR || path.join(os.tmpdir(), 'mitarepo');
const snapshotDir = path.join(process.cwd(), 'data-snapshot');
const outDir = path.join(process.cwd(), 'src', 'data');

// A pin: the upstream commit that produced the committed snapshot. Not sensitive —
// a public commit in a public repo.
function readPin(field, envVar) {
  const metaPath = path.join(snapshotDir, 'meta.json');
  let commit;
  try {
    commit = JSON.parse(fs.readFileSync(metaPath, 'utf8'))[field];
  } catch (err) {
    throw new Error(
      `Cannot read the ${field} pin from ${metaPath}: ${err.message}\n` +
        `Restore data-snapshot/meta.json, or set ${envVar} explicitly ` +
        `(${envVar}=HEAD tracks the latest upstream content).`,
    );
  }
  if (!commit || commit === 'unknown') {
    throw new Error(
      `No usable ${field} in ${metaPath} (got ${JSON.stringify(commit)}).\n` +
        `Set ${envVar} explicitly (${envVar}=HEAD tracks the latest upstream content).`,
    );
  }
  return commit;
}

const ref = process.env.CERT_REPO_REF || readPin('sourceCommit', 'CERT_REPO_REF');
const mitaRef = process.env.MITA_REPO_REF || readPin('mitaSourceCommit', 'MITA_REPO_REF');

/**
 * Clone `url` into `dir` at `ref`, or reuse an existing clone. `marker` is a path
 * inside the repo that proves a reuse candidate really is that checkout. Records the
 * resolved commit in `process.env[commitEnv]` for the ETL to stamp into meta.json.
 */
function cloneRepo({ url, dir, ref, label, marker, refEnv, commitEnv }) {
  // <REF_ENV>=HEAD is the documented way to opt out of the pin and track latest.
  const pinned = ref && ref !== 'HEAD';

  if (fs.existsSync(path.join(dir, marker))) {
    console.log(`Using existing ${label} repo at ${dir}`);
  } else {
    fs.rmSync(dir, { recursive: true, force: true });
    if (pinned) {
      console.log(`Cloning ${label} repo (full) into ${dir} and pinning to ${ref} …`);
      execSync(`git clone ${url} "${dir}"`, { stdio: 'inherit' });
      execSync(`git -C "${dir}" checkout --quiet ${ref}`, { stdio: 'inherit' });
    } else {
      console.log(`Cloning ${label} repo into ${dir} (tracking latest) …`);
      execSync(`git clone --depth 1 ${url} "${dir}"`, { stdio: 'inherit' });
    }
  }

  const head = execSync(`git -C "${dir}" rev-parse HEAD`).toString().trim();
  process.env[commitEnv] = head;

  // A reused clone (*_REPO_DIR) is left at whatever it was last checked out to —
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
    console.warn(`\n!!! ${label} repo at ${dir} is on ${head}, not the pinned ${ref}.`);
    console.warn('!!! Reusing an existing clone skips checkout. Remove that directory, or unset');
    console.warn(`!!! ${refEnv.replace('_REF', '_DIR')}, to build against the pinned content.\n`);
  }
  const source = process.env[refEnv] ? refEnv : 'data-snapshot/meta.json';
  console.log(
    `${label} repo at commit ${head}${pinned ? (onPin ? ` (pinned: ${ref} from ${source})` : ' (PIN NOT APPLIED)') : ` (latest, via ${source})`}`,
  );
}

/** Copy the named snapshot files into src/data as a stale-but-shippable fallback. */
const restoreFromSnapshot = (files) => {
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of files) fs.copyFileSync(path.join(snapshotDir, f), path.join(outDir, f));
};

try {
  cloneRepo({
    url: CERT_REPO_URL, dir, ref, label: 'Cert', marker: '_data',
    refEnv: 'CERT_REPO_REF', commitEnv: 'CERT_REPO_COMMIT',
  });
} catch (err) {
  console.error(`\n!!! Could not clone the CMS certification repo: ${err.message}`);
  if (fs.existsSync(path.join(snapshotDir, 'outcomes.json'))) {
    console.error('!!! FALLING BACK to committed data-snapshot/. Content may be stale — check meta.json syncedAt.\n');
    restoreFromSnapshot(fs.readdirSync(snapshotDir));
    process.exit(0); // skip ETL; snapshot is already the ETL output
  }
  console.error('!!! No data-snapshot/ fallback available. Failing the build.');
  throw err;
}

let runMitaEtl = true;
try {
  cloneRepo({
    url: MITA_REPO_URL, dir: mitaDir, ref: mitaRef, label: 'MITA', marker: 'data',
    refEnv: 'MITA_REPO_REF', commitEnv: 'MITA_REPO_COMMIT',
  });
} catch (err) {
  console.error(`\n!!! Could not clone the MITA blueprint repo: ${err.message}`);
  const mitaFiles = ['mita-processes.json', 'mita-areas.json'];
  if (mitaFiles.every((f) => fs.existsSync(path.join(snapshotDir, f)))) {
    console.error('!!! FALLING BACK to committed data-snapshot/ for MITA content only. The CMS');
    console.error('!!! content in this build is fresh; the MITA content may be stale.\n');
    restoreFromSnapshot(mitaFiles);
    runMitaEtl = false;
  } else {
    console.error('!!! No MITA data in data-snapshot/ to fall back to. Failing the build.');
    throw err;
  }
}

process.env.CERT_REPO_DIR = dir;
await import('./etl.mjs');

if (runMitaEtl) {
  process.env.MITA_REPO_DIR = mitaDir;
  await import('./etl-mita.mjs');
}

// Refresh the committed snapshot so the fallback stays current with the last good
// build — and, because the pins are read from meta.json, so that a build against a
// newer upstream commit advances that pin in the same commit as the data it produced.
fs.mkdirSync(snapshotDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) {
  fs.copyFileSync(path.join(outDir, f), path.join(snapshotDir, f));
}
