// Crawl every internal link and asset on a running server and fail on any non-200.
// Guards the class of defect that shipped before: outcome pages unreachable from
// the UI, and guidance images referenced but never copied out of the CMS repo.
//
// Usage: npm run start & npm run check:links  (override with BASE_URL)
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const dir = path.join(process.cwd(), 'src', 'data');
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));

const modules = read('modules.json');
const guidance = read('guidance.json');
const outcomes = read('outcomes.json');

const seeds = [
  '/', '/search', '/search?q=timely', '/modules', '/regulations', '/cefs', '/about', '/assistant',
  ...modules.map((m) => `/modules/${m.slug}`),
  ...guidance.map((g) => `/guidance/${g.slug}`),
  ...outcomes.map((o) => `/outcomes/${o.slug}`),
];

async function waitForServer(tries = 30) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(BASE, { redirect: 'manual' });
      if (r.status < 500) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`server at ${BASE} never became ready`);
}

await waitForServer();

const seen = new Set();
const broken = [];
let checked = 0;

for (const seed of seeds) {
  let html;
  try {
    const res = await fetch(BASE + seed);
    if (!res.ok) { broken.push([seed, `${res.status} (seed)`]); continue; }
    html = await res.text();
  } catch (e) {
    broken.push([seed, `error: ${e.message} (seed)`]);
    continue;
  }

  for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)"/g)) {
    const url = m[1];
    if (seen.has(url)) continue;
    seen.add(url);
    checked++;
    try {
      const res = await fetch(BASE + url);
      if (!res.ok) broken.push([url, `${res.status} (linked from ${seed})`]);
    } catch (e) {
      broken.push([url, `error: ${e.message} (linked from ${seed})`]);
    }
  }
}

if (broken.length) {
  console.error(`\n✗ ${broken.length} broken internal URL(s):\n`);
  broken.forEach(([url, why]) => console.error(`  - ${why.padEnd(34)} ${url}`));
  process.exit(1);
}

console.log(`✓ link check passed — ${seeds.length} pages crawled, ${checked} internal URLs all 200`);
