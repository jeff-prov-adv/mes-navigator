import Link from 'next/link';
import ModuleCard from '@/components/ModuleCard';
import { outcomes, stateExamples, regulations, cefs, modules, meta } from '@/lib/data';

const baselineModules = modules.filter((m) => m.cmsRequired > 0).length;

const STATS = [
  { value: outcomes.length, label: 'CMS-required outcomes', sub: `across ${baselineModules} modules`, tone: 'text-ink' },
  { value: stateExamples.length, label: 'State-specific examples', sub: 'published by CMS', tone: 'text-gold' },
  { value: regulations.length, label: 'Regulatory citations', sub: 'crosswalked both directions', tone: 'text-accent' },
  { value: cefs.length, label: 'Conditions for Enhanced Funding', sub: 'with example evidence', tone: 'text-ink' },
];

export default function Home() {
  // Lead with the modules carrying the most weight; the rest are one click away.
  const featured = [...modules]
    .sort((a, b) => b.cmsRequired + b.stateSpecific - (a.cmsRequired + a.stateSpecific))
    .slice(0, 6);

  return (
    <div>
      <section className="pt-6">
        <div className="mb-5 flex items-center gap-2.5">
          <span aria-hidden className="h-px w-[26px] bg-gold" />
          <span className="font-mono text-[10.5px] font-medium uppercase tracking-[.14em] text-gold-ink">
            Unofficial · Synced from the CMS repository {meta.syncedAt}
          </span>
        </div>

        <h1 className="display-1 max-w-[860px] text-[clamp(2.25rem,6vw,54px)] leading-[1.06] text-balance">
          Every MES certification outcome.{' '}
          <span className="text-accent">Actually searchable.</span>
        </h1>

        <p className="mt-5 max-w-[660px] text-[17px] leading-[1.62] text-ink-2 text-pretty">
          CMS publishes the outcomes and metrics behind Streamlined Modular Certification — but the official
          repository has no search. This navigator indexes every one of them, crosswalked to the regulation behind
          it and to the state examples CMS has already published.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/modules"
            className="rounded-md bg-accent px-[22px] py-3 text-[14.5px] font-semibold text-white transition-colors hover:bg-accent-dark focus-ring"
          >
            What certification requires now →
          </Link>
          <Link
            href="/regulations"
            className="rounded-md border border-line-2 bg-white px-[22px] py-3 text-[14.5px] font-semibold text-ink transition-colors hover:border-accent focus-ring"
          >
            Browse the crosswalk
          </Link>
        </div>

        {/* The numbers are the proof, so they get display type on a rule. */}
        <dl className="mt-13 grid grid-cols-2 border-t-2 border-ink md:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`py-5 pr-6 ${i > 0 ? 'md:pl-6' : ''} ${i < STATS.length - 1 ? 'md:border-r md:border-line' : ''}`}
            >
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <div className={`font-serif text-[clamp(2rem,5vw,46px)] font-semibold leading-none tracking-[-.02em] ${s.tone}`}>
                  {s.value}
                </div>
                <div className="mt-2 text-[12.5px] leading-[1.45] text-ink-2">
                  {s.label}
                  <br />
                  <span className="text-ink-3">{s.sub}</span>
                </div>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-14">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="display text-2xl">Browse by module</h2>
          <Link href="/modules" className="text-[13px] font-semibold text-accent hover:text-accent-dark">
            All {modules.length} modules →
          </Link>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((m) => (
            <ModuleCard key={m.slug} mod={m} />
          ))}
        </div>
      </section>
    </div>
  );
}
