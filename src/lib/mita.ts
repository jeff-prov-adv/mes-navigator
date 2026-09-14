// Server-only by convention: mita-processes.json is ~1.2 MB, almost all of it maturity-level
// text. Importing this module from a client component would ship all of it to the browser, so
// search receives a slim projection from its server page instead (see mitaSearchDocs).
import processesJson from '@/data/mita-processes.json';
import areasJson from '@/data/mita-areas.json';
import metaJson from '@/data/meta.json';

export interface MitaMaturityQuestion {
  category: string;
  question: string;
  /** Always five, levels 1 through 5 in order; check-data.mjs enforces the count. */
  levels: string[];
}

export interface MitaSourceDoc {
  /** Path inside the MITA blueprint repo, e.g. source-pdfs/may-2014-update/bpt/.../X BPT.pdf */
  file: string;
  /** Page range within that PDF, as the upstream record cites it. */
  pages: string;
}

export interface MitaProcess {
  id: string;
  slug: string;
  name: string;
  code: string;
  area: string;
  areaSlug: string;
  subCategory: string;
  description: string;
  /** Carries CMS's own numbering, which does not always start at 1. Render as-is. */
  steps: string[];
  triggers: { environment: string[]; interaction: string[] };
  results: string[];
  sharedData: string[];
  predecessors: string[];
  successors: string[];
  constraints: string;
  failures: string[];
  performanceMeasures: string[];
  maturity: MitaMaturityQuestion[];
  source: { bpt: MitaSourceDoc; bcm: MitaSourceDoc };
  /** The Appendix D (BCM) spelling, present only where it differs from `name`. */
  sourceName?: string;
}

export interface MitaArea {
  name: string;
  slug: string;
  code: string;
  processes: number;
}

export const mitaProcesses = processesJson as MitaProcess[];
export const mitaAreas = areasJson as MitaArea[];
export const mitaMeta = metaJson as { mitaSource: string; mitaSourceCommit: string };

export const getMitaArea = (slug: string) => mitaAreas.find((a) => a.slug === slug);
export const mitaProcessesByArea = (slug: string) => mitaProcesses.filter((p) => p.areaSlug === slug);
export const mitaProcessHref = (p: Pick<MitaProcess, 'areaSlug' | 'slug'>) => `/mita/${p.areaSlug}/${p.slug}`;

/** Only a process in the named area resolves, so each process has exactly one URL. */
export const getMitaProcess = (areaSlug: string, slug: string) =>
  mitaProcesses.find((p) => p.areaSlug === areaSlug && p.slug === slug);

// Predecessor and successor lists are free text in the BPTs. Link an entry only when it is
// exactly a process name, or the Appendix D spelling of one; anything else (Member Management
// processes MITA never published, prose notes, "None") stays plain text rather than being
// guessed at.
const byName = new Map<string, MitaProcess>();
for (const p of mitaProcesses) {
  byName.set(p.name.toLowerCase(), p);
  if (p.sourceName) byName.set(p.sourceName.toLowerCase(), p);
}
export const findMitaProcessByName = (name: string) => byName.get(name.trim().toLowerCase());

/** Link to a source PDF at the exact commit the data was built from. */
export const mitaSourceUrl = (file: string) =>
  `${mitaMeta.mitaSource}/blob/${mitaMeta.mitaSourceCommit}/${file.split('/').map(encodeURIComponent).join('/')}`;

/** Search projection: what's worth indexing, without the maturity-level text. */
export interface MitaSearchDoc {
  slug: string;
  name: string;
  code: string;
  area: string;
  areaSlug: string;
  subCategory: string;
  description: string;
  steps: string;
  href: string;
}

export const mitaSearchDocs = (): MitaSearchDoc[] =>
  mitaProcesses.map((p) => ({
    slug: p.slug,
    name: p.name,
    code: p.code,
    area: p.area,
    areaSlug: p.areaSlug,
    subCategory: p.subCategory,
    description: p.description,
    steps: p.steps.join(' '),
    href: mitaProcessHref(p),
  }));
