// ETL: CMSgov/CMCS-DSG-DSS-Certification -> src/data/*.json
// Parses the canonical _data CSVs + module/guidance markdown into normalized JSON.
import { parse } from 'csv-parse/sync';
import fs from 'node:fs';
import path from 'node:path';

const REPO = process.env.CERT_REPO_DIR || '/root/certrepo';
const OUT = path.join(process.cwd(), 'src', 'data');
fs.mkdirSync(OUT, { recursive: true });

const MODULES = [
  { name: 'Claims Processing', code: 'CP', slug: 'claims-processing', dir: 'Claims Processing (CP)' },
  { name: 'Decision Support System & Data Warehouse', code: 'DSSDW', slug: 'dssdw', dir: 'Decision Support System & Data Warehouse (DSSDW)' },
  { name: 'Eligibility and Enrollment', code: 'EE', slug: 'eligibility-enrollment', dir: 'Eligibility and Enrollment (EE)' },
  { name: 'Encounter Processing System', code: 'EPS', slug: 'encounter-processing', dir: 'Encounter Processing System (EPS)' },
  { name: 'Financial Management', code: 'FM', slug: 'financial-management', dir: 'Financial Management (FM)' },
  { name: 'Long Term Services & Supports', code: 'LTSS', slug: 'ltss', dir: 'Long Term Services & Supports (LTSS)' },
  { name: 'Member Management', code: 'MM', slug: 'member-management', dir: 'Member Management (MM)' },
  { name: 'Pharmacy Benefit Management', code: 'PBM', slug: 'pbm', dir: 'Pharmacy Benefit Management (PBM)' },
  { name: 'Prescription Drug Monitoring Program', code: 'PDMP', slug: 'pdmp', dir: 'Prescription Drug Monitoring Program (PDMP)' },
  { name: 'Program Integrity', code: 'PI', slug: 'program-integrity', dir: 'Program Integrity (PI)' },
  { name: 'Provider Management', code: 'PM', slug: 'provider-management', dir: 'Provider Management (PM)' },
  { name: 'Third Party Liability', code: 'TPL', slug: 'tpl', dir: 'Third Party Liability (TPL)' },
  { name: 'Electronic Visit Verification', code: 'EVV', slug: 'evv', dir: 'Electronic Visit Verification (EVV)' },
  { name: 'Health Information Exchange', code: 'HIE', slug: 'hie', dir: 'Health Information Exchange (HIE)' },
  { name: 'Asset Verification System', code: 'AVS', slug: 'asset-verification', dir: 'Asset Verification System' },
  { name: '1115 or Waiver Support Systems', code: 'WSS', slug: 'waiver-support', dir: '1115 or Waiver Support Systems' },
];

// CSV file name fragments in _data/ don't always match dir names
const CMS_CSV = {
  'claims-processing': 'Claims Processing', 'dssdw': 'DSSDW', 'eligibility-enrollment': 'Eligibility and Enrollment',
  'encounter-processing': 'Encounter Processing', 'financial-management': 'Financial Management', 'ltss': 'LTSS',
  'member-management': 'Member Management', 'pbm': 'PBM', 'pdmp': 'PDMP', 'program-integrity': 'Program Integrity',
  'provider-management': 'Provider Management', 'tpl': 'TPL',
};
const STATE_CSV = {
  ...CMS_CSV, 'evv': 'EVV', 'hie': 'HIE', 'asset-verification': 'Asset Verification System', 'waiver-support': 'Waiver Support Systems',
};

// The four modules without a CMS_CSV entry publish their CMS-required baseline (or the
// lack of one) as a table in the module readme instead of a _data/*.csv. HIE, AVS, and
// Waiver Support Systems say "None"; EVV has a 9-row table. Parse whichever is actually
// there rather than assuming none of the four ever have one.
const parseReadmeOutcomeTable = (md) => {
  const section = md.split(/^## CMS-Required Outcomes/m)[1];
  if (!section) return null;
  const lines = section.split('\n');
  const tableStart = lines.findIndex((l) => l.trim().startsWith('|'));
  if (tableStart === -1) return null; // e.g. "None. There are no CMS-Required outcomes for X."

  const splitRow = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const header = splitRow(lines[tableStart]);
  const col = (name) => header.findIndex((h) => h.toLowerCase().startsWith(name.toLowerCase()));
  const cols = {
    'Reference #': col('Reference'),
    'CMS Required Outcomes': col('CMS Required Outcomes'),
    'Default Metrics': col('Default Metrics'),
    'Regulatory Sources': col('Regulatory Source'),
  };
  for (const [field, idx] of Object.entries(cols)) {
    if (idx < 0) {
      throw new Error(
        `ETL: CMS-Required Outcomes table is missing a "${field}" column — CMS may have renamed it. ` +
          `Found headers: ${JSON.stringify(header)}. Failing loudly instead of shipping a hole.`,
      );
    }
  }
  const refCol = cols['Reference #'];
  const outcomeCol = cols['CMS Required Outcomes'];
  const metricsCol = cols['Default Metrics'];
  const regCol = cols['Regulatory Sources'];

  // GFM table cells can't contain a real newline, so CMS uses <br/> and markdown links
  // for the bulleted sub-items; rejoin those as plain newline-separated text so the
  // shared clean()/splitMetrics()/splitRegs() below treat this exactly like a CSV cell.
  const mdCellToText = (cell) =>
    (cell || '')
      .split(/<br\s*\/?>/i)
      .map((l) => l.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim())
      .filter(Boolean)
      .join('\n');

  const rows = [];
  for (let i = tableStart + 2; i < lines.length; i++) {
    if (!lines[i].trim().startsWith('|')) break;
    const cells = splitRow(lines[i]);
    rows.push({
      'Reference #': cells[refCol],
      'CMS Required Outcomes': mdCellToText(cells[outcomeCol]),
      'Default Metrics': mdCellToText(cells[metricsCol]),
      'Regulatory Sources': mdCellToText(cells[regCol]),
    });
  }
  return rows;
};

const clean = (s) => (s || '').replace(/&nbsp;/gi, ' ').replace(/ /g, ' ').replace(/[ \t]+\n/g, '\n').trim();

// URL-safe form of a CMS reference code. Codes are already safe apart from the
// slash in DSS/DW1 and DSS/DW2, so every other outcome URL is unchanged.
const slugifyId = (id) => id.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const readCsv = (f) => {
  const p = path.join(REPO, '_data', f);
  if (!fs.existsSync(p)) return null;
  return parse(fs.readFileSync(p, 'utf8'), { columns: true, skip_empty_lines: true, bom: true, relax_column_count: true, trim: false });
};

// split a metrics cell into bullet items
const splitMetrics = (s) => {
  if (!s) return [];
  const items = s.split(/\n/).map((l) => l.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean);
  // if no newlines, still one metric
  return items.length ? items : [s.trim()];
};

// extract CFR citations & leftover sources
const CFR_RE = /(\d+)\s*C\.?F\.?R\.?\s*(?:§+\s*)?([\d.]+[\w()\-–.]*)/gi;

// eCFR only routes two shapes: /current/title-N/section-X.Y and /current/title-N/part-N.
// Subsections are #p- anchors on the section page; section ranges have no route at all.
// Everything below normalizes a raw CMS cite onto one of those two, so the link resolves.
const ecfrUrl = (title, rawSection) => {
  const base = `https://www.ecfr.gov/current/title-${title}`;
  const section = rawSection.replace(/[.,;]+$/, '');

  // Part-level cite (e.g. "42 CFR 438") — no section number to hang a section route off.
  if (!section.includes('.')) return { section, url: `${base}/part-${section}`, note: '' };

  const m = section.match(/^(\d+\.\d+)(.*)$/);
  if (!m) return { section, url: `${base}/section-${section}`, note: '' };
  let num = m[1];
  const rest = m[2];
  let note = '';

  // A few CMS cites zero-pad the section number in a way the CFR itself doesn't
  // (431.052 -> 431.52). Link the section that actually exists; keep CMS's cite as published.
  const padded = num.match(/^(\d+)\.0(\d+)$/);
  if (padded) {
    num = `${padded[1]}.${padded[2]}`;
    note = `published as ${section}; resolves to ${num}`;
  }

  // Range (e.g. "435.940-965") — eCFR has no range route, so link the first section.
  if (/^[-–]/.test(rest)) return { section, url: `${base}/section-${num}`, note: note || `range cite; opens ${num}` };

  // Subsection (e.g. "433.138(k)(2)(i)") — anchor on the parent section page.
  if (rest) return { section, url: `${base}/section-${num}#p-${num}${rest}`, note };

  return { section, url: `${base}/section-${num}`, note };
};

const splitRegs = (s) => {
  if (!s) return { regs: [], other: [] };
  const lines = s.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const regs = []; const other = [];
  for (const line of lines) {
    let matched = false; CFR_RE.lastIndex = 0;
    let m;
    while ((m = CFR_RE.exec(line)) !== null) {
      matched = true;
      const title = m[1];
      const { section, url, note } = ecfrUrl(title, m[2]);
      regs.push({ cite: `${title} CFR ${section}`, title, section, url, note });
    }
    if (!matched) other.push(line);
  }
  return { regs, other };
};

// Pre-render the raw regulatory-sources cell into text/link segments here, so the UI
// never re-parses citations with a second copy of the regex that can drift from this one.
const buildRegLines = (raw) =>
  (raw || '')
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const segs = [];
      let last = 0;
      CFR_RE.lastIndex = 0;
      let m;
      while ((m = CFR_RE.exec(line)) !== null) {
        if (m.index > last) segs.push({ text: line.slice(last, m.index) });
        const { url, note } = ecfrUrl(m[1], m[2]);
        segs.push({ text: m[0], url, ...(note ? { note } : {}) });
        last = m.index + m[0].length;
      }
      if (last < line.length) segs.push({ text: line.slice(last) });
      return segs;
    });

const outcomes = [];
for (const mod of MODULES) {
  const frag = CMS_CSV[mod.slug];
  let rows;
  if (frag) {
    rows = readCsv(`MES Outcomes - CMS-Required ${frag}.csv`);
    if (!rows) throw new Error(`ETL: missing required CSV "MES Outcomes - CMS-Required ${frag}.csv" — CMS may have renamed it. Failing loudly instead of shipping a hole.`);
  } else {
    const readmePath = path.join(REPO, 'Outcomes and Metrics', mod.dir, 'readme.md');
    const md = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
    rows = parseReadmeOutcomeTable(md) || [];
  }
  for (const r of rows) {
    const ref = (r['Reference #'] || '').trim();
    if (!ref) continue;
    const m = ref.match(/^([A-Za-z]+\s?\d+[a-z]?)\s*(.*)$/);
    const code = m ? m[1].replace(/\s+/, '') : ref;
    const title = m && m[2] ? m[2].trim() : '';
    const regRaw = clean(r['Regulatory Sources'] || '');
    const { regs, other } = splitRegs(regRaw);
    outcomes.push({
      // Some CMS reference codes contain a slash (DSS/DW1), which would split the
      // /outcomes/[id] route into two segments and 404. Route on slug, display id.
      id: code, slug: slugifyId(code),
      title, module: mod.name, moduleCode: mod.code, moduleSlug: mod.slug,
      outcome: clean(r['CMS Required Outcomes'] || ''),
      metrics: splitMetrics(clean(r['Default Metrics'] || '')),
      regs, regOther: other, regRaw, regLines: buildRegLines(regRaw),
    });
  }
}

// Dedupe cross-listed outcomes (e.g., PI lists CP2/FM5/PBM9/PM11/PM17/PM18 from their home modules).
// Keep the home-module row (id prefix matches module code) as canonical; record cross-listings in alsoIn.
const byId = new Map();
for (const o of outcomes) {
  const prefix = (o.id.match(/^[A-Za-z]+/) || [''])[0];
  const isHome = prefix === o.moduleCode;
  const existing = byId.get(o.id);
  if (!existing) {
    byId.set(o.id, { ...o, alsoIn: [], _home: isHome });
  } else if (isHome && !existing._home) {
    byId.set(o.id, { ...o, alsoIn: [...existing.alsoIn, existing.moduleSlug], _home: true });
  } else {
    existing.alsoIn.push(o.moduleSlug);
  }
}
const dedupedOutcomes = [...byId.values()].map(({ _home, ...o }) => o);
outcomes.length = 0;
outcomes.push(...dedupedOutcomes);

const stateExamples = [];
for (const mod of MODULES) {
  const frag = STATE_CSV[mod.slug];
  if (!frag) continue;
  const rows = readCsv(`MES Outcomes - State-Specific ${frag}.csv`);
  if (!rows) continue;
  for (const r of rows) {
    const state = clean(r['State'] || '');
    const stmt = clean(r['Outcome Statement'] || '');
    if (!state || !stmt) continue;
    stateExamples.push({
      state, module: mod.name, moduleSlug: mod.slug, moduleCode: mod.code,
      goal: clean(r['Medicaid Program Goal'] || ''),
      outcome: stmt,
      metrics: splitMetrics(clean(r['Metric(s)'] || r['Metrics'] || '')),
    });
  }
}

const cefRows = readCsv('CEFs.csv') || [];
const cefs = cefRows.map((r) => ({
  ref: clean(r['Ref #'] || ''), condition: clean(r['Condition'] || ''), evidence: clean(r['Example Evidence'] || ''),
})).filter((c) => c.ref);

// Module descriptions from module readmes (strip Liquid/frontmatter)
const stripMd = (raw) =>
  raw
    .replace(/^---[\s\S]*?---/, '')
    .replace(/\{%[\s\S]*?%\}/g, '')
    .replace(/\{\{[\s\S]*?\}\}/g, '')
    .trim();

const modulesOut = MODULES.map((mod) => {
  let description = '';
  const p = path.join(REPO, 'Outcomes and Metrics', mod.dir, 'readme.md');
  if (fs.existsSync(p)) {
    const body = stripMd(fs.readFileSync(p, 'utf8'));
    // first substantive paragraph (skip headings)
    const para = body.split(/\n\n+/).map((s) => s.trim()).find((s) => s && !s.startsWith('#') && s.length > 80);
    description = (para || '').replace(/\s+/g, ' ').trim();
  }
  return {
    ...mod,
    description,
    cmsRequired: outcomes.filter((o) => o.moduleSlug === mod.slug || o.alsoIn.includes(mod.slug)).length,
    stateSpecific: stateExamples.filter((o) => o.moduleSlug === mod.slug).length,
  };
});

// Guidance pages
const guidancePages = [
  { slug: 'writing-outcome-statements', title: 'Writing Outcome Statements', file: 'writing-outcome-statements.md' },
  { slug: 'certification-process', title: 'The Certification Process', file: 'certification-process.md' },
  { slug: 'smc-overview', title: 'SMC Process — Overview', file: 'SMC Process/Overview/readme.md' },
  { slug: 'smc-planning', title: 'SMC Process — Planning Phase', file: 'SMC Process/Planning/readme.md' },
  { slug: 'smc-development', title: 'SMC Process — Development Phase', file: 'SMC Process/Development/readme.md' },
  { slug: 'smc-production', title: 'SMC Process — Production Phase', file: 'SMC Process/Production/readme.md' },
];
// The guidance markdown is written for the CMS Jekyll site: images resolve against the
// repo root and cross-links are relative repo paths. Both are dead here unless we copy
// the assets in and repoint the links — at internal routes where we have an equivalent
// page, and back at the CMS repo on GitHub where we don't.
const REPO_WEB = 'https://github.com/CMSgov/CMCS-DSG-DSS-Certification';

const INTERNAL_LINKS = [
  [/^(\.\.\/)*writing-outcome-statements\/?$/, '/guidance/writing-outcome-statements'],
  [/^(\.\.\/)*certification-process\/?$/, '/guidance/certification-process'],
  [/^(\.\.\/)*SMC(%20|\s)Process\/Overview\/?$/, '/guidance/smc-overview'],
  [/^(\.\.\/)*SMC(%20|\s)Process\/Planning\/?$/, '/guidance/smc-planning'],
  [/^(\.\.\/)*SMC(%20|\s)Process\/Development\/?$/, '/guidance/smc-development'],
  [/^(\.\.\/)*SMC(%20|\s)Process\/Production\/?$/, '/guidance/smc-production'],
  [/^(\.\.\/)*Conditions(%20|\s)for(%20|\s)Enhanced(%20|\s)Funding\/CEFs\/?$/, '/cefs'],
];

const copiedAssets = [];
const copyAsset = (src) => {
  const rel = decodeURIComponent(src.replace(/^\//, ''));
  const from = path.join(REPO, rel);
  if (!fs.existsSync(from)) return false;
  const to = path.join(process.cwd(), 'public', rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  copiedAssets.push(rel);
  return true;
};

const rewriteGuidance = (md) => {
  // <img src="/SMC Process/..."> — copy the file into public/ at the same path.
  let out = md.replace(/(<img\b[^>]*?\bsrc=")([^"]+)(")/gi, (full, pre, src, post) => {
    if (/^https?:/i.test(src)) return full;
    return copyAsset(src) ? `${pre}${encodeURI(src)}${post}` : full;
  });

  // [text](relative/path) — internal route where one exists, else the CMS repo.
  //
  // A leading slash is repo-root-relative, not app-absolute: CMS writes these as
  // [text]({{ site.baseurl }}/Templates/) for their Jekyll site, and stripMd removes
  // the Liquid variable before this runs, leaving "/Templates/". Skipping those as
  // already-absolute renders them as dead links here. copyAsset already reads a
  // leading slash the same way for <img src>. (The pinned content happens to carry
  // none of these — CMS dropped them in 2026-05 — but they were used for years, and
  // a weekly sync has to survive their return.)
  out = out.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (full, text, href) => {
    if (/^(https?:|mailto:|#)/i.test(href)) return full;
    href = href.replace(/^\//, '');
    const hit = INTERNAL_LINKS.find(([re]) => re.test(href));
    if (hit) return `[${text}](${hit[1]})`;
    const rel = href.replace(/^(\.\.\/)+/, '');
    const kind = /\.[a-z0-9]{2,5}$/i.test(rel) ? 'blob' : 'tree';
    return `[${text}](${REPO_WEB}/${kind}/main/${encodeURI(decodeURIComponent(rel)).replace(/\/$/, '')})`;
  });

  return out;
};

const guidance = guidancePages
  .map((g) => {
    const p = path.join(REPO, g.file);
    if (!fs.existsSync(p)) return null;
    return { slug: g.slug, title: g.title, markdown: rewriteGuidance(stripMd(fs.readFileSync(p, 'utf8'))) };
  })
  .filter(Boolean);

// Regulation crosswalk: cite -> outcomes
const regMap = {};
for (const o of outcomes) {
  for (const r of o.regs) {
    regMap[r.cite] ||= {
      cite: r.cite, url: r.url, title: r.title, section: r.section,
      ...(r.note ? { note: r.note } : {}),
      outcomes: [],
    };
    if (!regMap[r.cite].outcomes.includes(o.id)) regMap[r.cite].outcomes.push(o.id);
  }
}
const regulations = Object.values(regMap).sort((a, b) =>
  a.title === b.title ? a.section.localeCompare(b.section, undefined, { numeric: true }) : a.title.localeCompare(b.title)
);

// Sanity checks — fail the build loudly rather than ship silently-missing content.
const assert = (cond, msg) => {
  if (!cond) throw new Error(`ETL sanity check failed: ${msg}`);
};
assert(outcomes.length >= 129, `outcomes=${outcomes.length}, expected ≥129 (141 as of 2026-08 — 132 across 12 CSV-backed modules plus 9 for EVV, read from its readme table)`);
assert(
  modulesOut.filter((m) => m.cmsRequired > 0).length === 13,
  `modules with CMS-required outcomes = ${modulesOut.filter((m) => m.cmsRequired > 0).length}, expected 13 (12 CSV-backed + EVV)`,
);
assert(stateExamples.length >= 40, `stateExamples=${stateExamples.length}, expected ≥40 (58 as of 2026-08)`);
assert(guidance.length === 6, `guidance pages=${guidance.length}, expected 6`);
assert(regulations.length >= 100, `regulations=${regulations.length}, expected ≥100 (124 as of 2026-08)`);
assert(cefs.length >= 15, `cefs=${cefs.length}, expected ≥15 (22 as of 2026-08)`);

fs.writeFileSync(path.join(OUT, 'outcomes.json'), JSON.stringify(outcomes, null, 1));
fs.writeFileSync(path.join(OUT, 'state-examples.json'), JSON.stringify(stateExamples, null, 1));
fs.writeFileSync(path.join(OUT, 'cefs.json'), JSON.stringify(cefs, null, 1));
fs.writeFileSync(path.join(OUT, 'modules.json'), JSON.stringify(modulesOut, null, 1));
fs.writeFileSync(path.join(OUT, 'guidance.json'), JSON.stringify(guidance, null, 1));
fs.writeFileSync(path.join(OUT, 'regulations.json'), JSON.stringify(regulations, null, 1));
fs.writeFileSync(
  path.join(OUT, 'meta.json'),
  JSON.stringify({
    syncedAt: new Date().toISOString().slice(0, 10),
    source: 'https://github.com/CMSgov/CMCS-DSG-DSS-Certification',
    sourceCommit: process.env.CERT_REPO_COMMIT || 'unknown',
  }, null, 1)
);

console.log(`modules=${modulesOut.length} outcomes=${outcomes.length} stateExamples=${stateExamples.length} cefs=${cefs.length} guidance=${guidance.length} regulations=${regulations.length} assets=${copiedAssets.length}`);
