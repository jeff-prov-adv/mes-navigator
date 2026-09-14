import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  mitaProcesses,
  getMitaProcess,
  mitaProcessesByArea,
  mitaProcessHref,
  findMitaProcessByName,
  mitaSourceUrl,
  type MitaMaturityQuestion,
  type MitaSourceDoc,
} from '@/lib/mita';

export function generateStaticParams() {
  return mitaProcesses.map((p) => ({ area: p.areaSlug, process: p.slug }));
}

type Params = Promise<{ area: string; process: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { area, process } = await params;
  const p = getMitaProcess(area, process);
  return { title: `${p?.name ?? 'MITA process'} · MITA · MES Certification Navigator` };
}

const card = 'rounded-lg border border-line bg-white p-5 shadow-[0_1px_2px_rgba(16,35,63,.05)]';

export default async function MitaProcessPage({ params }: { params: Params }) {
  const { area, process } = await params;
  const p = getMitaProcess(area, process);
  if (!p) notFound();

  const siblings = mitaProcessesByArea(p.areaSlug).filter((x) => x.slug !== p.slug);

  // BCM questions arrive grouped by category in CMS order; keep that grouping.
  const categories = new Map<string, MitaMaturityQuestion[]>();
  for (const q of p.maturity) categories.set(q.category, [...(categories.get(q.category) || []), q]);

  return (
    <div className="max-w-4xl">
      <nav className="text-xs text-ink-2">
        <Link href="/mita" className="hover:text-accent">MITA</Link>
        {' / '}
        <Link href={`/mita/${p.areaSlug}`} className="hover:text-accent">{p.area}</Link>
      </nav>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="rounded bg-ink px-2 py-1 font-mono text-sm font-semibold text-gold-bright">{p.code}</span>
        <h1 className="display text-2xl">{p.name}</h1>
      </div>
      {p.subCategory && <p className="mt-1.5 text-xs text-ink-2">{p.subCategory}</p>}
      {p.sourceName && (
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-ink-2 text-pretty">
          CMS names this process two ways. The Business Process Template and the framework&apos;s business
          architecture index use the name above; the Business Capability Model (Appendix D) publishes it as{' '}
          <span className="font-semibold text-ink">{p.sourceName}</span>.
        </p>
      )}

      <div className={`mt-5 border-l-[3px] border-l-ink ${card}`}>
        <div className="eyebrow">Description</div>
        <p className="mt-2 text-[15px] leading-[1.62] text-ink text-pretty">{p.description}</p>
      </div>

      <section className="mt-9">
        <h2 className="display text-lg">Business Process Template</h2>

        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div className={card}>
            <div className="eyebrow">Trigger events</div>
            <Labeled label="Environment-based" items={p.triggers.environment} />
            <Labeled label="Interaction-based" items={p.triggers.interaction} />
          </div>
          <div className={card}>
            <div className="eyebrow">Results</div>
            <Bullets items={p.results} />
          </div>
        </div>

        <div className={`mt-4 ${card}`}>
          <div className="eyebrow">Business process steps</div>
          {/* Steps carry CMS's own numbers (Manage Estate Recovery starts at 10), so no list numbering. */}
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink-2">
            {p.steps.map((s, i) => (
              <li key={i} className="text-pretty">{s}</li>
            ))}
          </ul>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className={card}>
            <div className="eyebrow">Predecessor processes</div>
            <ProcessNames names={p.predecessors} />
          </div>
          <div className={card}>
            <div className="eyebrow">Successor processes</div>
            <ProcessNames names={p.successors} />
          </div>
          <div className={card}>
            <div className="eyebrow">Shared data</div>
            <Bullets items={p.sharedData} />
          </div>
          <div className={card}>
            <div className="eyebrow">Constraints</div>
            <p className="mt-2 text-sm leading-relaxed text-ink-2 text-pretty">
              {p.constraints || <span className="text-ink-3">None published</span>}
            </p>
            <div className="eyebrow mt-4">Failures</div>
            <Bullets items={p.failures} />
          </div>
        </div>

        <div className={`mt-4 ${card}`}>
          <div className="eyebrow">Performance measures</div>
          <Bullets items={p.performanceMeasures} />
        </div>

        <Source label="Business Process Template" doc={p.source.bpt} />
      </section>

      <section className="mt-11" id="capability">
        <h2 className="display text-lg">Business Capability Model ({p.maturity.length} questions)</h2>
        <p className="mt-1 max-w-3xl text-xs text-ink-2">
          Each capability question defines five maturity levels, from Level 1 through Level 5.
        </p>

        {[...categories].map(([category, qs]) => (
          <div key={category} className="mt-6">
            <h3 className="eyebrow mb-2.5">{category}</h3>
            <div className="space-y-2.5">
              {qs.map((q, i) => (
                <details key={i} className={`${card} p-4`}>
                  <summary className="cursor-pointer font-serif text-[15px] font-semibold text-ink focus-ring">
                    {q.question}
                  </summary>
                  <ol className="mt-3 space-y-2">
                    {q.levels.map((level, n) => (
                      <li key={n} className="grid grid-cols-[64px_1fr] gap-3 text-sm leading-relaxed">
                        <span className="pt-0.5 font-mono text-[11px] font-semibold tracking-[.04em] text-accent">
                          LEVEL {n + 1}
                        </span>
                        <span className="text-ink-2 text-pretty">{level}</span>
                      </li>
                    ))}
                  </ol>
                </details>
              ))}
            </div>
          </div>
        ))}

        <Source label="Business Capability Model" doc={p.source.bcm} />
      </section>

      {siblings.length > 0 && (
        <section className="mt-10">
          <h2 className="eyebrow">Other {p.area} processes</h2>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {siblings.map((s) => (
              <Link
                key={s.slug}
                href={mitaProcessHref(s)}
                className="rounded border border-line bg-white px-2 py-1 text-[12.5px] font-semibold text-accent transition-colors hover:border-accent focus-ring"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  if (!items.length) return <p className="mt-2 text-sm text-ink-3">None published</p>;
  return (
    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-2">
      {items.map((s, i) => (
        <li key={i} className="text-pretty">{s}</li>
      ))}
    </ul>
  );
}

function Labeled({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mt-3">
      <div className="text-xs font-semibold text-ink">{label}</div>
      <Bullets items={items} />
    </div>
  );
}

/** Names that are exactly a published process link to it; the rest stay as CMS wrote them. */
function ProcessNames({ names }: { names: string[] }) {
  if (!names.length) return <p className="mt-2 text-sm text-ink-3">None published</p>;
  return (
    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-2">
      {names.map((n, i) => {
        const target = findMitaProcessByName(n);
        return (
          <li key={i} className="text-pretty">
            {target ? (
              <Link href={mitaProcessHref(target)} className="font-semibold text-accent hover:text-accent-dark focus-ring">
                {n}
              </Link>
            ) : (
              n
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Source({ label, doc }: { label: string; doc: MitaSourceDoc }) {
  const file = doc.file.split('/').pop();
  return (
    <p className="mt-3 text-xs leading-relaxed text-ink-3">
      Source: CMS MITA 3.0 {label},{' '}
      <a
        href={mitaSourceUrl(doc.file)}
        target="_blank"
        rel="noreferrer"
        className="text-accent underline underline-offset-2 hover:text-accent-dark"
      >
        {file}
      </a>
      , page{doc.pages.includes('-') ? 's' : ''} {doc.pages}.
    </p>
  );
}
