import outcomesJson from '@/data/outcomes.json';
import stateExamplesJson from '@/data/state-examples.json';
import cefsJson from '@/data/cefs.json';
import modulesJson from '@/data/modules.json';
import guidanceJson from '@/data/guidance.json';
import regulationsJson from '@/data/regulations.json';
import metaJson from '@/data/meta.json';

export interface Reg {
  cite: string;
  title: string;
  section: string;
  url: string;
  /** Set when the cite needed normalizing to resolve (zero-padded section, range cite). */
  note?: string;
}

/** One rendered segment of a regulatory-sources line; `url` present means it's a link. */
export interface RegSeg {
  text: string;
  url?: string;
  note?: string;
}

export interface Outcome {
  id: string;
  /** URL-safe form of `id` — they differ only for DSS/DW1 and DSS/DW2. */
  slug: string;
  title: string;
  module: string;
  moduleCode: string;
  moduleSlug: string;
  outcome: string;
  metrics: string[];
  regs: Reg[];
  regOther: string[];
  regRaw: string;
  /** Precomputed in the ETL so citation parsing lives in exactly one place. */
  regLines: RegSeg[][];
  alsoIn: string[];
}

export interface StateExample {
  state: string;
  module: string;
  moduleSlug: string;
  moduleCode: string;
  goal: string;
  outcome: string;
  metrics: string[];
}

export interface Cef {
  ref: string;
  condition: string;
  evidence: string;
}

export interface Module {
  name: string;
  code: string;
  slug: string;
  dir: string;
  description: string;
  cmsRequired: number;
  stateSpecific: number;
}

export interface GuidancePage {
  slug: string;
  title: string;
  markdown: string;
}

export interface Regulation {
  cite: string;
  url: string;
  title: string;
  section: string;
  /** Set when the cite needed normalizing to resolve (zero-padded section, range cite). */
  note?: string;
  outcomes: string[];
}

export const outcomes = outcomesJson as Outcome[];
export const stateExamples = stateExamplesJson as StateExample[];
export const cefs = cefsJson as Cef[];
export const modules = modulesJson as Module[];
export const guidance = guidanceJson as GuidancePage[];
export const regulations = regulationsJson as Regulation[];
export const meta = metaJson as { syncedAt: string; source: string };

export const getModule = (slug: string) => modules.find((m) => m.slug === slug);

/** Accepts either the route slug or the raw CMS reference code, case-insensitively. */
export const getOutcome = (idOrSlug: string) => {
  const k = idOrSlug.toLowerCase();
  return outcomes.find((o) => o.slug.toLowerCase() === k || o.id.toLowerCase() === k);
};
export const outcomesByModule = (slug: string) =>
  outcomes.filter((o) => o.moduleSlug === slug || o.alsoIn.includes(slug));
export const examplesByModule = (slug: string) => stateExamples.filter((o) => o.moduleSlug === slug);
