// Summarize what a CMS content sync actually changed, in review-able terms.
//
// Compares the COMMITTED snapshot (git show HEAD:data-snapshot/*.json) against the
// freshly built src/data/*.json and writes markdown to stdout. .github/workflows/
// cms-sync.yml uses that as the body of the weekly pin-bump PR, so the review is
// about content — which outcomes moved — rather than a 170KB JSON blob.
//
// Run it standalone after any build to see the same summary:
//   npm run build && node scripts/summarize-sync.mjs
//
// Always exits 0. "No content change." is a normal, expected result.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const MAX_LIST = 20; // long lists get truncated; the diff is still in the PR
const REPO = 'https://github.com/CMSgov/CMCS-DSG-DSS-Certification';
const outDir = path.join(process.cwd(), 'src', 'data');

const git = (args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/** Committed version of a snapshot file, or null when it isn't in HEAD yet. */
function committed(file) {
  try {
    return JSON.parse(git(['show', `HEAD:data-snapshot/${file}`]));
  } catch {
    return null;
  }
}

const built = (file) => JSON.parse(fs.readFileSync(path.join(outDir, file), 'utf8'));

// Each dataset: how to identify a row across syncs, how to name it in the summary,
// and which fields count as a substantive change. Derived cross-references are
// deliberately not in `fields` — `outcomes` on a regulation, `alsoIn`/`regLines`/
// `slug` on an outcome — because they churn whenever anything upstream of them
// moves, and reporting them would bury the change that caused it.
const SETS = [
  {
    file: 'outcomes.json',
    label: 'outcomes',
    key: (o) => o.id,
    // 59 of 132 outcomes carry no title — those modules title only the outcome
    // statement itself, so fall back to it rather than printing a bare dash.
    name: (o) => `\`${o.id}\` — ${o.title || snippet(o.outcome)}`,
    fields: ['title', 'module', 'outcome', 'metrics', 'regRaw'],
  },
  {
    // State examples carry no stable identifier — 58 rows share 33 state+module+goal
    // keys — so they are matched by group rather than by key. See diffGrouped.
    file: 'state-examples.json',
    label: 'state examples',
    group: (e) => `${e.state}|${e.moduleCode}`,
    name: (e) => `${e.state} · ${e.moduleCode} — ${snippet(e.goal)}`,
    fields: ['goal', 'outcome', 'metrics'],
  },
  {
    file: 'cefs.json',
    label: 'CEFs',
    key: (c) => c.ref,
    name: (c) => `\`${c.ref}\` — ${snippet(c.condition)}`,
    fields: ['condition', 'evidence'],
  },
  {
    file: 'regulations.json',
    label: 'citations',
    key: (r) => r.cite,
    name: (r) => `${r.cite}`,
    fields: ['url', 'title', 'section', 'note'],
  },
  {
    file: 'guidance.json',
    label: 'guidance pages',
    key: (g) => g.slug,
    name: (g) => `${g.title}`,
    fields: ['title', 'markdown'],
  },
  {
    file: 'modules.json',
    label: 'modules',
    key: (m) => m.code,
    name: (m) => `${m.code} — ${m.name}`,
    fields: ['name', 'description', 'cmsRequired', 'stateSpecific'],
  },
];

/** Index rows by key, disambiguating genuine duplicates so neither side loses one. */
function index(rows, keyOf) {
  const map = new Map();
  const seen = new Map();
  for (const row of rows) {
    const base = keyOf(row);
    const n = (seen.get(base) || 0) + 1;
    seen.set(base, n);
    map.set(n === 1 ? base : `${base} #${n}`, row);
  }
  return map;
}

/** Rows present on both sides, byte-identical, paired off and dropped. */
function dropUnchanged(before, after) {
  const pool = new Map();
  for (const row of before) {
    const s = JSON.stringify(row);
    pool.set(s, (pool.get(s) || 0) + 1);
  }
  const aRest = [];
  for (const row of after) {
    const s = JSON.stringify(row);
    const n = pool.get(s) || 0;
    if (n > 0) pool.set(s, n - 1);
    else aRest.push(row);
  }
  const bRest = [];
  for (const [s, n] of pool) for (let i = 0; i < n; i++) bRest.push(JSON.parse(s));
  return { bRest, aRest };
}

const groupBy = (rows, of) => {
  const m = new Map();
  for (const r of rows) m.set(of(r), [...(m.get(of(r)) || []), r]);
  return m;
};

/**
 * Diff a dataset with no stable identifier. Identical rows are paired off first,
 * so a pure reordering reports nothing; whatever is left is matched in order
 * within its group (a state's rows for one module), which keeps a reworded row
 * reading as a change rather than as a removal plus an unrelated addition.
 */
function diffGrouped(set, before, after, out) {
  const { bRest, aRest } = dropUnchanged(before, after);
  const b = groupBy(bRest, set.group);
  const a = groupBy(aRest, set.group);
  for (const key of new Set([...b.keys(), ...a.keys()])) {
    const bs = b.get(key) || [];
    const as = a.get(key) || [];
    const paired = Math.min(bs.length, as.length);
    for (let i = 0; i < paired; i++) {
      const fields = changedFields(bs[i], as[i], set.fields);
      if (fields.length) out.changed.push(`**${set.label}**: ${set.name(as[i])} — ${fields.join(', ')}`);
    }
    for (const row of bs.slice(paired)) out.removed.push(`**${set.label}**: ${set.name(row)}`);
    for (const row of as.slice(paired)) out.added.push(`**${set.label}**: ${set.name(row)}`);
  }
}

/** Which of `fields` differ, described the way a reviewer wants to read it. */
function changedFields(before, after, fields) {
  const out = [];
  for (const f of fields) {
    const a = before[f];
    const b = after[f];
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    if (Array.isArray(a) && Array.isArray(b)) {
      out.push(`${f} (${a.length} → ${b.length})`);
    } else if (typeof a === 'string' && typeof b === 'string' && (a.length > 200 || b.length > 200)) {
      out.push(`${f} (${a.length} → ${b.length} chars)`);
    } else {
      out.push(f);
    }
  }
  return out;
}

/** Trim to n chars on a word boundary — summary lines stay one line. */
const snippet = (text, n = 80) => {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  return `${t.slice(0, t.lastIndexOf(' ', n) > 0 ? t.lastIndexOf(' ', n) : n)}…`;
};

const list = (items) => {
  const shown = items.slice(0, MAX_LIST).map((i) => `- ${i}`);
  if (items.length > MAX_LIST) shown.push(`- …and ${items.length - MAX_LIST} more`);
  return shown.join('\n');
};

// --- compare ---------------------------------------------------------------
const counts = [];
const removed = [];
const added = [];
const changed = [];

for (const set of SETS) {
  const before = committed(set.file);
  const after = built(set.file);
  if (before === null) {
    counts.push({ label: set.label, before: '—', after: after.length, delta: `+${after.length}` });
    continue;
  }
  counts.push({
    label: set.label,
    before: before.length,
    after: after.length,
    delta: after.length - before.length,
  });

  if (set.group) {
    diffGrouped(set, before, after, { removed, added, changed });
    continue;
  }

  const b = index(before, set.key);
  const a = index(after, set.key);
  for (const [key, row] of b) if (!a.has(key)) removed.push(`**${set.label}**: ${set.name(row)}`);
  for (const [key, row] of a) if (!b.has(key)) added.push(`**${set.label}**: ${set.name(row)}`);
  for (const [key, row] of a) {
    if (!b.has(key)) continue;
    const fields = changedFields(b.get(key), row, set.fields);
    if (fields.length) changed.push(`**${set.label}**: ${set.name(row)} — ${fields.join(', ')}`);
  }
}

// Guidance images live outside the JSON; the ETL copies them into public/.
let assets = [];
try {
  assets = git(['status', '--porcelain', '--', 'public/SMC Process'])
    .split('\n')
    .filter(Boolean)
    .map((l) => l.trim());
} catch {
  /* not a git checkout — skip */
}

const oldMeta = committed('meta.json') || {};
const newMeta = built('meta.json');
const short = (c) => (c ? c.slice(0, 7) : 'unknown');
const nothing = !removed.length && !added.length && !changed.length && !assets.length;

if (nothing && oldMeta.sourceCommit === newMeta.sourceCommit) {
  console.log('No content change.');
  process.exit(0);
}

// --- report ----------------------------------------------------------------
const out = [];
out.push('## CMS content sync');
out.push('');
out.push(
  `\`${short(oldMeta.sourceCommit)}\` → \`${short(newMeta.sourceCommit)}\` ` +
    `([compare](${REPO}/compare/${oldMeta.sourceCommit}...${newMeta.sourceCommit}))`,
);
out.push('');
out.push('| Dataset | Before | After | Δ |');
out.push('|---|---:|---:|---:|');
for (const c of counts) {
  const d = typeof c.delta === 'number' ? (c.delta === 0 ? '—' : c.delta > 0 ? `+${c.delta}` : `${c.delta}`) : c.delta;
  out.push(`| ${c.label} | ${c.before} | ${c.after} | ${d} |`);
}
out.push('');

if (removed.length) {
  // First and flagged: the ETL floors in scripts/etl.mjs tolerate a partial loss,
  // so a shrink has to be loud here rather than pass quietly.
  out.push(`### ⚠ Removed (${removed.length})`);
  out.push('');
  out.push(list(removed));
  out.push('');
}
if (added.length) {
  out.push(`### Added (${added.length})`);
  out.push('');
  out.push(list(added));
  out.push('');
}
if (changed.length) {
  out.push(`### Changed (${changed.length})`);
  out.push('');
  out.push(list(changed));
  out.push('');
}
if (assets.length) {
  out.push(`### Guidance images (${assets.length})`);
  out.push('');
  out.push(list(assets.map((a) => `\`${a}\``)));
  out.push('');
}
if (nothing) {
  out.push('Pin moved, but no dataset changed — CMS commits since the last sync did not touch');
  out.push('any content this tool indexes.');
  out.push('');
}

console.log(out.join('\n'));
