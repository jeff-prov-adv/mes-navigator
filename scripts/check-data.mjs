// Data invariants that the ETL's count assertions don't cover.
// These guard the specific defects found in the 2026-08 review: dead eCFR links
// and outcome IDs that break routing. Run after a build: `npm run check:data`.
import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'src', 'data');
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));

const outcomes = read('outcomes.json');
const regulations = read('regulations.json');
const guidance = read('guidance.json');
const modules = read('modules.json');
const mitaProcesses = read('mita-processes.json');
const mitaAreas = read('mita-areas.json');
// Hand-transcribed from a cited CMS page, not generated, so it lives beside the code that renders it.
const mitaUnpublished = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'mita-unpublished.json'), 'utf8'),
).areas;

const failures = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); };

// --- eCFR link shape -------------------------------------------------------
// eCFR routes only /current/title-N/section-X.Y and /current/title-N/part-N.
// Subsections belong in the #p- fragment; ranges and parens in the path 404.
const SECTION = /^https:\/\/www\.ecfr\.gov\/current\/title-\d+\/section-\d+\.\d+$/;
const PART = /^https:\/\/www\.ecfr\.gov\/current\/title-\d+\/part-\d+$/;

for (const r of regulations) {
  const [pathPart, fragment] = r.url.split('#');
  check(
    SECTION.test(pathPart) || PART.test(pathPart),
    `regulation ${r.cite}: malformed eCFR path ${pathPart}`,
  );
  if (fragment) {
    check(fragment.startsWith('p-'), `regulation ${r.cite}: fragment should be a #p- anchor, got #${fragment}`);
  }
}

// Cites carrying a subsection must land on an anchor, or the link silently
// drops the reader at the top of a long section.
for (const r of regulations) {
  if (/\(/.test(r.section)) {
    check(r.url.includes('#p-'), `regulation ${r.cite}: subsection cite has no #p- anchor`);
  }
}

// --- routing safety --------------------------------------------------------
const slugs = new Set();
for (const o of outcomes) {
  check(!!o.slug, `outcome ${o.id}: missing slug`);
  check(
    encodeURIComponent(o.slug) === o.slug,
    `outcome ${o.id}: slug "${o.slug}" is not URL-safe (would break /outcomes/[id])`,
  );
  check(!o.slug.includes('/'), `outcome ${o.id}: slug contains a slash and would split the route`);
  check(!slugs.has(o.slug), `outcome ${o.id}: duplicate slug "${o.slug}"`);
  slugs.add(o.slug);
  check(Array.isArray(o.regLines), `outcome ${o.id}: missing precomputed regLines`);
}

// --- guidance links resolve to real routes ---------------------------------
// CMS authors guidance cross-links for their own Jekyll site, and the ETL repoints
// them at routes here. A link into a route this app doesn't have renders dead, and
// the crawl only catches it if that page happens to be reachable and the link
// happens to be present in the pinned content — which is exactly how the
// {{ site.baseurl }} links went unnoticed until a sync against older CMS content.
// Assert it here instead: cheap, unconditional, and independent of the crawl.

// Route templates come from the filesystem, so adding a route can't silently
// invalidate this check.
const templates = [];
(function walk(dir, route) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'api') continue;
    walk(path.join(dir, entry.name), `${route}/${entry.name}`);
  }
  if (fs.existsSync(path.join(dir, 'page.tsx'))) templates.push(route || '/');
})(path.join(process.cwd(), 'src', 'app'), '');

// Dynamic segments expand from the same data generateStaticParams uses. Each entry is
// a list of concrete paths, so a route nesting two dynamic segments expands in pairs.
const PARAMS = {
  '/guidance/[slug]': guidance.map((g) => `/guidance/${g.slug}`),
  '/modules/[slug]': modules.map((m) => `/modules/${m.slug}`),
  '/outcomes/[id]': outcomes.map((o) => `/outcomes/${o.slug}`),
  '/mita/[area]': mitaAreas.map((a) => `/mita/${a.slug}`),
  '/mita/[area]/[process]': mitaProcesses.map((p) => `/mita/${p.areaSlug}/${p.slug}`),
};

const routes = new Set();
for (const t of templates) {
  if (!t.includes('[')) {
    routes.add(t);
    continue;
  }
  const paths = PARAMS[t];
  check(paths, `route ${t} has no expansion in check-data.mjs; add one, or guidance links into it go unverified`);
  for (const p of paths || []) routes.add(p);
}

let guidanceLinks = 0;
for (const page of guidance) {
  const hrefs = [
    ...[...page.markdown.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]),
    ...[...page.markdown.matchAll(/<a\b[^>]*\bhref="(\/[^"]*)"/gi)].map((m) => m[1]),
  ];
  for (const href of hrefs) {
    guidanceLinks += 1;
    const route = decodeURIComponent(href.split(/[#?]/)[0]).replace(/\/$/, '') || '/';
    check(
      routes.has(route),
      `guidance/${page.slug}: link ${href} resolves to ${route}, which is not a route in this app`,
    );
  }
}

// --- MITA shape ------------------------------------------------------------
// etl-mita.mjs asserts these too, but the clone-failure path in prepare-data.mjs
// copies data-snapshot/ straight into src/data and skips the ETL entirely. On that
// path these checks are the only thing standing between a damaged snapshot and a
// build, which is the same reason the outcome invariants above exist.
check(mitaAreas.length === 9, `MITA business areas=${mitaAreas.length}, expected 9`);
check(mitaProcesses.length >= 70, `MITA processes=${mitaProcesses.length}, expected >=70 (76 as of 2026-09)`);
for (const a of mitaAreas) {
  check(
    !!a.slug && encodeURIComponent(a.slug) === a.slug,
    `MITA area "${a.name}": slug "${a.slug}" is not URL-safe (would break /mita/[area])`,
  );
}

const mitaSlugs = new Set();
for (const p of mitaProcesses) {
  check(!!p.id, `MITA process "${p.name}": missing process id`);
  check(
    !!p.slug && encodeURIComponent(p.slug) === p.slug,
    `MITA process ${p.id}: slug "${p.slug}" is not URL-safe (would break /mita/[area]/[process])`,
  );
  check(!p.slug.includes('/'), `MITA process ${p.id}: slug contains a slash and would split the route`);
  check(!mitaSlugs.has(p.slug), `MITA process ${p.id}: duplicate slug "${p.slug}"`);
  mitaSlugs.add(p.slug);

  // Provenance is what lets a process page cite the CMS page it came from. A record
  // without it cannot be shown honestly, so treat it as a failure rather than hiding
  // the citation.
  check(!!p.source?.bpt?.file && !!p.source?.bpt?.pages, `MITA process ${p.id}: BPT provenance missing`);
  check(!!p.source?.bcm?.file && !!p.source?.bcm?.pages, `MITA process ${p.id}: BCM provenance missing`);

  check(Array.isArray(p.maturity) && p.maturity.length > 0, `MITA process ${p.id}: no capability questions`);
  for (const q of p.maturity || []) {
    check(
      Array.isArray(q.levels) && q.levels.length === 5,
      `MITA process ${p.id}: capability question has ${q.levels?.length} maturity levels, expected 5`,
    );
  }
  const area = mitaAreas.find((a) => a.slug === p.areaSlug);
  check(!!area, `MITA process ${p.id}: areaSlug "${p.areaSlug}" matches no entry in mita-areas.json`);
}

// --- MITA areas CMS never published -----------------------------------------
// The gap note says CMS published no templates for these areas. If upstream data ever
// carries one, the note is wrong, so fail here rather than keep showing it.
const mitaNames = new Set(mitaProcesses.flatMap((p) => [p.name, p.sourceName].filter(Boolean).map((n) => n.toLowerCase())));
for (const gap of mitaUnpublished) {
  check(
    !mitaAreas.some((a) => a.name.toLowerCase() === gap.name.toLowerCase() || a.code === gap.code),
    `MITA area ${gap.code} ${gap.name} is listed as unpublished in src/lib/mita-unpublished.json but now appears in mita-areas.json`,
  );
  check(gap.processes.length > 0 && !!gap.source?.file && !!gap.source?.pages, `unpublished MITA area ${gap.code}: processes or source citation missing`);
  for (const proc of gap.processes) {
    check(
      !mitaNames.has(proc.name.toLowerCase()),
      `unpublished MITA process ${proc.code} ${proc.name} now matches a published process; update src/lib/mita-unpublished.json`,
    );
  }
}

// --- report ----------------------------------------------------------------
if (failures.length) {
  console.error(`\n✗ ${failures.length} data check failure(s):\n`);
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

const anchored = regulations.filter((r) => r.url.includes('#p-')).length;
const parts = regulations.filter((r) => /\/part-/.test(r.url)).length;
const noted = regulations.filter((r) => r.note).length;
const mitaQuestions = mitaProcesses.reduce((n, p) => n + (p.maturity?.length || 0), 0);
console.log(
  `✓ data checks passed: ${regulations.length} citations (${anchored} subsection anchors, ${parts} part-level, ${noted} normalized), ${outcomes.length} outcomes with unique URL-safe slugs, ${guidanceLinks} guidance link(s) into ${routes.size} routes, ${mitaProcesses.length} MITA processes across ${mitaAreas.length} areas with ${mitaQuestions} capability questions, ${mitaUnpublished.length} unpublished area(s) confirmed absent`,
);
