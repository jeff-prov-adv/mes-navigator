// ETL: nickarrow/mita-open-blueprint -> src/data/mita-*.json
//
// MITA's framework (business process templates and capability maturity models) is
// published by CMS only as 2014 appendix PDFs. This reads the machine-readable
// transcription of those PDFs, which carries source_file and source_page_range on
// every record so a page here can cite the CMS page it came from.
//
// A BPT (what the process does) and a BCM (how mature a state's implementation is)
// describe the same process. They are paired on `process_id`, which is stable across
// the pair — never on filename: CMS names two processes differently across its own
// appendices, and pairing by filename silently drops both.
import fs from 'node:fs';
import path from 'node:path';

const REPO = process.env.MITA_REPO_DIR;
const OUT = path.join(process.cwd(), 'src', 'data');
fs.mkdirSync(OUT, { recursive: true });

const slugify = (s) =>
  String(s).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const walk = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.json') ? [path.join(dir, e.name)] : [],
      )
    : [];

const readAll = (kind) =>
  walk(path.join(REPO, 'data', kind)).map((f) => ({ file: f, doc: JSON.parse(fs.readFileSync(f, 'utf8')) }));

const bpts = readAll('bpt');
const bcms = readAll('bcm');

const provenance = (doc) => ({
  file: doc.metadata?.source_file || '',
  pages: doc.metadata?.source_page_range || '',
});

// Levels arrive as { level_1..level_5 }; emit an ordered array so the UI renders
// maturity 1-5 without re-deriving the ordering.
const levelsOf = (q) =>
  [1, 2, 3, 4, 5].map((n) => (q.levels?.[`level_${n}`] ?? '').trim());

const byId = new Map();
for (const { doc } of bpts) {
  byId.set(doc.process_id, {
    id: doc.process_id,
    slug: slugify(doc.process_id),
    name: doc.process_name,
    // Present only where CMS's two appendices disagree on the name. Shown rather
    // than silently resolved, the same way a normalized CFR cite shows its note.
    ...(doc.metadata?.source_process_name && doc.metadata.source_process_name !== doc.process_name
      ? { sourceName: doc.metadata.source_process_name }
      : {}),
    code: doc.process_code,
    area: doc.business_area,
    areaSlug: slugify(doc.business_area),
    subCategory: doc.sub_category || '',
    description: (doc.process_details?.description || '').trim(),
    steps: doc.process_details?.process_steps || [],
    triggers: {
      environment: doc.process_details?.trigger_events?.environment_based || [],
      interaction: doc.process_details?.trigger_events?.interaction_based || [],
    },
    results: doc.process_details?.results || [],
    sharedData: doc.process_details?.shared_data || [],
    predecessors: doc.process_details?.predecessor_processes || [],
    successors: doc.process_details?.successor_processes || [],
    constraints: (doc.process_details?.constraints || '').trim(),
    failures: doc.process_details?.failures || [],
    performanceMeasures: doc.process_details?.performance_measures || [],
    maturity: [],
    source: { bpt: provenance(doc), bcm: null },
  });
}

for (const { doc } of bcms) {
  const p = byId.get(doc.process_id);
  if (!p) continue; // asserted below rather than silently dropped
  p.maturity = (doc.maturity_model?.capability_questions || []).map((q) => ({
    category: q.category || '',
    question: q.question || '',
    levels: levelsOf(q),
    ...(q.note ? { note: q.note } : {}),
  }));
  p.source.bcm = provenance(doc);
  if (!p.sourceName && doc.metadata?.source_process_name && doc.metadata.source_process_name !== p.name) {
    p.sourceName = doc.metadata.source_process_name;
  }
}

const processes = [...byId.values()].sort((a, b) =>
  a.area === b.area ? a.name.localeCompare(b.name) : a.area.localeCompare(b.area),
);

const areaMap = new Map();
for (const p of processes) {
  const a = areaMap.get(p.areaSlug) || { name: p.area, slug: p.areaSlug, codes: new Set(), processes: 0 };
  a.codes.add(p.code);
  a.processes += 1;
  areaMap.set(p.areaSlug, a);
}
const areas = [...areaMap.values()]
  .map(({ name, slug, codes, processes: n }) => ({ name, slug, code: codes.size === 1 ? [...codes][0] : '', processes: n }))
  .sort((a, b) => a.name.localeCompare(b.name));

// Sanity checks — fail the build loudly rather than ship silently-missing content.
const assert = (cond, msg) => {
  if (!cond) throw new Error(`MITA ETL sanity check failed: ${msg}`);
};
assert(REPO, 'MITA_REPO_DIR is not set — prepare-data.mjs should set it before importing this');
assert(bpts.length >= 70, `BPT documents=${bpts.length}, expected >=70 (76 as of 2026-09)`);
assert(bcms.length >= 70, `BCM documents=${bcms.length}, expected >=70 (76 as of 2026-09)`);
assert(areas.length === 9, `business areas=${areas.length}, expected 9`);

const unpaired = processes.filter((p) => !p.source.bcm);
assert(unpaired.length === 0, `${unpaired.length} process(es) have a BPT but no BCM: ${unpaired.slice(0, 5).map((p) => p.id).join(', ')}`);
const orphanBcm = bcms.filter(({ doc }) => !byId.has(doc.process_id));
assert(orphanBcm.length === 0, `${orphanBcm.length} BCM(s) have no matching BPT process_id: ${orphanBcm.slice(0, 5).map((x) => x.doc.process_id).join(', ')}`);

const slugs = new Set();
for (const p of processes) {
  assert(p.id, `a process is missing process_id (${p.name})`);
  assert(p.slug && encodeURIComponent(p.slug) === p.slug, `process ${p.id}: slug "${p.slug}" is not URL-safe`);
  assert(!slugs.has(p.slug), `process ${p.id}: duplicate slug "${p.slug}"`);
  slugs.add(p.slug);
  assert(p.source.bpt.file && p.source.bpt.pages, `process ${p.id}: BPT provenance missing`);
  assert(p.source.bcm.file && p.source.bcm.pages, `process ${p.id}: BCM provenance missing`);
  assert(p.maturity.length > 0, `process ${p.id}: no capability questions`);
  for (const q of p.maturity) {
    assert(q.levels.length === 5, `process ${p.id}: a capability question has ${q.levels.length} levels, expected 5`);
  }
}

fs.writeFileSync(path.join(OUT, 'mita-processes.json'), JSON.stringify(processes, null, 1));
fs.writeFileSync(path.join(OUT, 'mita-areas.json'), JSON.stringify(areas, null, 1));

// Record the MITA pin alongside the CMS one. etl.mjs wrote meta.json already, so
// read-modify-write rather than clobbering it.
const metaPath = path.join(OUT, 'meta.json');
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
meta.mitaSource = 'https://github.com/nickarrow/mita-open-blueprint';
meta.mitaSourceCommit = process.env.MITA_REPO_COMMIT || 'unknown';
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 1));

const questions = processes.reduce((n, p) => n + p.maturity.length, 0);
const steps = processes.reduce((n, p) => n + p.steps.length, 0);
console.log(
  `mita: processes=${processes.length} areas=${areas.length} capabilityQuestions=${questions} steps=${steps} (bpt=${bpts.length} bcm=${bcms.length})`,
);
