'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import MiniSearch from 'minisearch';
import { outcomes, stateExamples, modules } from '@/lib/data';
import Highlight from '@/components/Highlight';

interface Doc {
  key: string;
  kind: 'cms' | 'state';
  ref: string;
  title: string;
  module: string;
  moduleSlug: string;
  outcome: string;
  metricCount: number;
  cites: string[];
  href: string;
  // indexed only
  id: string;
  metrics: string;
  regs: string;
  state?: string;
}

function buildDocs(): Doc[] {
  const docs: Doc[] = outcomes.map((o) => ({
    key: `cms-${o.id}`,
    kind: 'cms' as const,
    ref: o.id,
    id: o.id,
    title: o.title,
    module: o.module,
    moduleSlug: o.moduleSlug,
    outcome: o.outcome,
    metricCount: o.metrics.length,
    cites: o.regs.map((r) => r.cite),
    metrics: o.metrics.join(' '),
    regs: [...o.regs.map((r) => r.cite), ...o.regOther].join(' '),
    href: `/outcomes/${o.slug}`,
  }));
  // The module page renders #ex-N by position *within its own module*, so the
  // deep link has to use the module-local index, not the global one.
  const perModule = new Map<string, number>();
  stateExamples.forEach((s, i) => {
    const localIdx = perModule.get(s.moduleSlug) ?? 0;
    perModule.set(s.moduleSlug, localIdx + 1);
    docs.push({
      key: `state-${i}`,
      kind: 'state',
      ref: s.state,
      id: s.state,
      title: s.goal,
      module: s.module,
      moduleSlug: s.moduleSlug,
      state: s.state,
      outcome: s.outcome,
      metricCount: s.metrics.length,
      cites: [],
      metrics: s.metrics.join(' '),
      regs: '',
      href: `/modules/${s.moduleSlug}#ex-${localIdx}`,
    });
  });
  return docs;
}

const KINDS = [
  { id: 'cms', label: 'CMS-required' },
  { id: 'state', label: 'State examples' },
] as const;

export default function SearchResults() {
  const params = useSearchParams();
  const q = params.get('q') || '';

  const [kinds, setKinds] = useState<string[]>([]);
  const [mods, setMods] = useState<string[]>([]);

  const { mini, docs, byKey } = useMemo(() => {
    const docs = buildDocs();
    const mini = new MiniSearch<Doc>({
      fields: ['id', 'title', 'outcome', 'metrics', 'regs', 'module', 'state'],
      storeFields: ['key'],
      idField: 'key',
      searchOptions: { boost: { id: 3, title: 2 }, prefix: true, fuzzy: 0.15 },
    });
    mini.addAll(docs);
    return { mini, docs, byKey: new Map(docs.map((d) => [d.key, d])) };
  }, []);

  // Result set for the query, before any facet is applied.
  const matched = useMemo(() => {
    if (!q.trim()) return docs;
    return mini.search(q).map((r) => byKey.get(r.id as string)!).filter(Boolean);
  }, [q, mini, docs, byKey]);

  const terms = useMemo(() => q.trim().split(/\s+/).filter(Boolean), [q]);

  // Facet counts are computed against the *other* facet's selection, so each
  // number reflects what you'd actually get by ticking that box.
  const inKinds = (d: Doc) => !kinds.length || kinds.includes(d.kind);
  const inMods = (d: Doc) => !mods.length || mods.includes(d.moduleSlug);

  const kindCounts = useMemo(() => {
    const m = new Map<string, number>();
    matched.filter(inMods).forEach((d) => m.set(d.kind, (m.get(d.kind) || 0) + 1));
    return m;
  }, [matched, mods]); // eslint-disable-line react-hooks/exhaustive-deps

  const moduleCounts = useMemo(() => {
    const m = new Map<string, number>();
    matched.filter(inKinds).forEach((d) => m.set(d.moduleSlug, (m.get(d.moduleSlug) || 0) + 1));
    return m;
  }, [matched, kinds]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => matched.filter((d) => inKinds(d) && inMods(d)), [matched, kinds, mods]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = results.slice(0, 60);
  const activeFilters = kinds.length + mods.length;

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const facetModules = modules
    .filter((m) => (moduleCounts.get(m.slug) || 0) > 0 || mods.includes(m.slug))
    .sort((a, b) => (moduleCounts.get(b.slug) || 0) - (moduleCounts.get(a.slug) || 0));

  return (
    <div className="grid items-start gap-0 md:grid-cols-[224px_1fr]">
      {/* filters */}
      <aside className="pb-8 md:border-r md:border-line md:pr-5">
        <div className="eyebrow mb-2.5">Result type</div>
        <div className="flex flex-col gap-1.5">
          {KINDS.map((k) => (
            <Facet
              key={k.id}
              label={k.label}
              count={kindCounts.get(k.id) || 0}
              checked={kinds.includes(k.id)}
              onChange={() => toggle(kinds, setKinds, k.id)}
            />
          ))}
        </div>

        <div className="my-5 h-px bg-line" />

        <div className="eyebrow mb-2.5">Module</div>
        <div className="flex flex-col gap-1.5">
          {facetModules.map((m) => (
            <Facet
              key={m.slug}
              label={m.name}
              count={moduleCounts.get(m.slug) || 0}
              checked={mods.includes(m.slug)}
              onChange={() => toggle(mods, setMods, m.slug)}
            />
          ))}
          {!facetModules.length && <p className="text-[13px] text-ink-3">No modules match.</p>}
        </div>

        {activeFilters > 0 && (
          <button
            onClick={() => { setKinds([]); setMods([]); }}
            className="mt-5 text-[12.5px] font-semibold text-accent hover:text-accent-dark focus-ring"
          >
            Clear {activeFilters} filter{activeFilters === 1 ? '' : 's'}
          </button>
        )}
      </aside>

      {/* results */}
      <div className="md:pl-8">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <div className="text-[13.5px] text-ink-2">
            <span className="font-semibold text-ink">
              {results.length} result{results.length === 1 ? '' : 's'}
            </span>
            {q && <> for “{q}”</>}
            {activeFilters > 0 && (
              <>
                {' '}· <span className="font-semibold text-accent">{activeFilters} filter{activeFilters === 1 ? '' : 's'}</span>
              </>
            )}
          </div>
          <div className="text-[12.5px] text-ink-2">{q ? 'Sorted by relevance' : 'All entries'}</div>
        </div>

        {results.length === 0 ? (
          <EmptyState q={q} />
        ) : (
          <div className="flex flex-col gap-2.5">
            {shown.map((d) => (
              <ResultCard key={d.key} doc={d} terms={terms} />
            ))}
            {results.length > shown.length && (
              <p className="pt-2 text-center text-[12.5px] text-ink-3">
                Showing the first {shown.length} of {results.length}. Narrow with a filter or a longer query.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Facet({
  label, count, checked, onChange,
}: { label: string; count: number; checked: boolean; onChange: () => void }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2.5 text-[13.5px] ${checked ? 'text-ink' : 'text-ink-2'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={`${label} (${count})`}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`grid size-3.5 shrink-0 place-items-center rounded-[3px] border-[1.5px] peer-focus-visible:ring-3 peer-focus-visible:ring-accent/30 ${
          checked ? 'border-accent bg-accent' : 'border-line-2 bg-white'
        }`}
      >
        {checked && (
          <svg viewBox="0 0 10 8" className="size-2 fill-none stroke-white stroke-[1.8]">
            <path d="M1 4l2.5 2.5L9 1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="min-w-0 truncate">{label}</span>
      <span className="ml-auto shrink-0 font-mono text-[11px] text-ink-3">{count}</span>
    </label>
  );
}

function ResultCard({ doc, terms }: { doc: Doc; terms: string[] }) {
  const isCms = doc.kind === 'cms';
  return (
    <article
      className={`rounded-lg border border-line bg-white p-[16px_18px] shadow-[0_1px_2px_rgba(16,35,63,.05)] transition-colors hover:border-line-2 ${
        isCms ? 'border-l-[3px] border-l-ink' : 'border-l-[3px] border-l-gold'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {isCms ? (
          <span className="rounded bg-ink px-1.5 py-0.5 font-mono text-[11.5px] font-semibold text-white">{doc.ref}</span>
        ) : (
          <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[11.5px] font-bold text-gold-ink">{doc.ref}</span>
        )}
        <span className="text-xs font-semibold text-ink-2">{doc.module}</span>
        <span aria-hidden className="size-[3px] rounded-full bg-line-2" />
        <span
          className={`rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[.04em] ${
            isCms ? 'bg-accent/10 text-accent-dark' : 'bg-gold/12 text-gold-ink'
          }`}
        >
          {isCms ? 'CMS-required' : 'State example'}
        </span>
      </div>

      <Link href={doc.href} className="focus-ring group block">
        {doc.title && (
          <h3 className="mt-2.5 line-clamp-2 font-serif text-[19px] font-semibold leading-snug tracking-[-.008em] text-ink group-hover:text-accent-dark">
            <Highlight text={doc.title} terms={terms} />
          </h3>
        )}
        <p className={`${doc.title ? 'mt-1.5' : 'mt-2.5'} line-clamp-3 max-w-[720px] text-sm leading-[1.6] text-ink-2 text-pretty`}>
          <Highlight text={doc.outcome} terms={terms} />
        </p>
      </Link>

      {(doc.cites.length > 0 || doc.metricCount > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line/60 pt-2.5">
          {doc.cites.length > 0 && (
            <>
              <span className="font-mono text-[9.5px] uppercase tracking-[.1em] text-ink-3">Cites</span>
              {doc.cites.slice(0, 3).map((c) => (
                <span key={c} className="rounded border border-line px-1.5 py-0.5 font-mono text-[11.5px] font-medium text-accent">
                  {c}
                </span>
              ))}
              {doc.cites.length > 3 && (
                <span className="font-mono text-[11px] text-ink-3">+{doc.cites.length - 3}</span>
              )}
            </>
          )}
          {doc.metricCount > 0 && (
            <Link href={doc.href} className="ml-auto text-xs font-semibold text-accent hover:text-accent-dark focus-ring">
              {doc.metricCount} metric{doc.metricCount === 1 ? '' : 's'} →
            </Link>
          )}
        </div>
      )}
    </article>
  );
}

function EmptyState({ q }: { q: string }) {
  const suggestions = [...modules]
    .filter((m) => m.cmsRequired > 0)
    .sort((a, b) => b.cmsRequired - a.cmsRequired)
    .slice(0, 2);

  return (
    <div className="rounded-lg border border-dashed border-line-2 bg-zebra p-[22px] text-center">
      <p className="font-serif text-base font-semibold text-ink">
        {q ? <>No outcomes match “{q}”</> : <>Nothing to show</>}
      </p>
      <p className="mt-1.5 text-[12.5px] leading-[1.6] text-ink-2">
        Try a broader term, or browse{' '}
        {suggestions.map((m, i) => (
          <span key={m.slug}>
            {i > 0 && ' and '}
            <Link href={`/modules/${m.slug}`} className="font-semibold text-accent hover:text-accent-dark">
              {m.name} ({m.cmsRequired})
            </Link>
          </span>
        ))}
        .
      </p>
    </div>
  );
}
