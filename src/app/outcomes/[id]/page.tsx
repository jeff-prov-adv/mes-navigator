import Link from 'next/link';
import { notFound } from 'next/navigation';
import { outcomes, getOutcome, examplesByModule, getModule } from '@/lib/data';

export function generateStaticParams() {
  return outcomes.map((o) => ({ id: o.slug }));
}

export default async function OutcomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = getOutcome(decodeURIComponent(id));
  if (!o) notFound();

  const siblings = outcomes.filter((x) => x.moduleSlug === o.moduleSlug && x.id !== o.id);
  const examples = examplesByModule(o.moduleSlug).slice(0, 3);

  return (
    <div className="max-w-4xl">
      <nav className="text-xs text-ink-2">
        <Link href="/modules" className="hover:text-accent">Modules</Link>
        {' / '}
        <Link href={`/modules/${o.moduleSlug}`} className="hover:text-accent">{o.module}</Link>
      </nav>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="rounded bg-ink px-2 py-1 font-mono text-sm font-semibold text-white">{o.id}</span>
        <h1 className="display text-2xl">{o.title || 'CMS-Required Outcome'}</h1>
      </div>

      {o.alsoIn.length > 0 && (
        <p className="mt-2 text-xs text-ink-2">
          Also listed under{' '}
          {o.alsoIn.map((slug, i) => (
            <span key={slug}>
              {i > 0 && ', '}
              <Link href={`/modules/${slug}`} className="font-semibold text-accent hover:text-accent-dark">
                {getModule(slug)?.name ?? slug}
              </Link>
            </span>
          ))}
          .
        </p>
      )}

      <div className="mt-5 rounded-lg border border-line border-l-[3px] border-l-ink bg-white p-5 shadow-[0_1px_2px_rgba(16,35,63,.05)]">
        <div className="eyebrow">CMS-required outcome</div>
        <p className="mt-2 text-[15px] leading-[1.62] text-ink text-pretty">{o.outcome}</p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-5 shadow-[0_1px_2px_rgba(16,35,63,.05)]">
          <div className="eyebrow">Default metrics</div>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-2">
            {o.metrics.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
            {!o.metrics.length && <li className="list-none text-ink-3">None published</li>}
          </ul>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-[0_1px_2px_rgba(16,35,63,.05)]">
          <div className="eyebrow">Regulatory sources</div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {o.regLines.map((segs, i) => (
              <li key={i} className="text-ink-2">
                {segs.map((s, j) =>
                  s.url ? (
                    <span key={j}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        title={s.note ? `Open in eCFR — ${s.note}` : 'Open in eCFR'}
                        className="font-mono text-[12.5px] font-medium text-accent underline underline-offset-2 hover:text-accent-dark focus-ring"
                      >
                        {s.text}
                      </a>
                      {s.note && <span className="ml-1 text-[11px] text-ink-3">({s.note})</span>}
                    </span>
                  ) : (
                    <span key={j}>{s.text}</span>
                  ),
                )}
              </li>
            ))}
            {!o.regRaw && <li className="text-ink-3">None cited</li>}
          </ul>
        </div>
      </div>

      {examples.length > 0 && (
        <section className="mt-9">
          <h2 className="eyebrow">How states write outcomes in this module</h2>
          <div className="mt-2.5 space-y-2.5">
            {examples.map((s, i) => (
              <div
                key={i}
                className="rounded-lg border border-line border-l-[3px] border-l-gold bg-white p-4 text-sm shadow-[0_1px_2px_rgba(16,35,63,.05)]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[11.5px] font-bold text-gold-ink">
                    {s.state}
                  </span>
                  <span className="font-serif text-[15px] font-semibold text-ink">{s.goal}</span>
                </div>
                <p className="mt-1.5 line-clamp-3 leading-relaxed text-ink-2 text-pretty">{s.outcome}</p>
              </div>
            ))}
          </div>
          <Link
            href={`/modules/${o.moduleSlug}#state-examples`}
            className="mt-2.5 inline-block text-sm font-semibold text-accent hover:text-accent-dark"
          >
            All {o.module} state examples →
          </Link>
        </section>
      )}

      {siblings.length > 0 && (
        <section className="mt-10">
          <h2 className="eyebrow">Other {o.module} outcomes</h2>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {siblings.map((s) => (
              <Link
                key={s.id}
                href={`/outcomes/${s.slug}`}
                title={s.title}
                className="rounded border border-line bg-white px-2 py-1 font-mono text-[11.5px] font-semibold text-accent transition-colors hover:border-accent focus-ring"
              >
                {s.id}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
