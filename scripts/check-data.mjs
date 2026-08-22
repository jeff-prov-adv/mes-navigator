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

// Dynamic segments expand from the same data generateStaticParams uses.
const PARAMS = {
  '/guidance/[slug]': guidance.map((g) => g.slug),
  '/modules/[slug]': modules.map((m) => m.slug),
  '/outcomes/[id]': outcomes.map((o) => o.slug),
};

const routes = new Set();
for (const t of templates) {
  if (!t.includes('[')) {
    routes.add(t);
    continue;
  }
  const values = PARAMS[t];
  check(values, `route ${t} has no expansion in check-data.mjs — add one, or guidance links into it go unverified`);
  for (const v of values || []) routes.add(t.replace(/\[[^\]]+\]/, v));
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

// --- report ----------------------------------------------------------------
if (failures.length) {
  console.error(`\n✗ ${failures.length} data check failure(s):\n`);
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

const anchored = regulations.filter((r) => r.url.includes('#p-')).length;
const parts = regulations.filter((r) => /\/part-/.test(r.url)).length;
const noted = regulations.filter((r) => r.note).length;
console.log(
  `✓ data checks passed — ${regulations.length} citations (${anchored} subsection anchors, ${parts} part-level, ${noted} normalized), ${outcomes.length} outcomes with unique URL-safe slugs, ${guidanceLinks} guidance link(s) into ${routes.size} routes`,
);
