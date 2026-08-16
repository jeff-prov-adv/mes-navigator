import Link from 'next/link';
import { notFound } from 'next/navigation';
import OpenFromHash from '@/components/OpenFromHash';
import { modules, getModule, outcomesByModule, examplesByModule } from '@/lib/data';

export function generateStaticParams() {
  return modules.map((m) => ({ slug: m.slug }));
}

export default async function ModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mod = getModule(slug);
  if (!mod) notFound();
  const cms = outcomesByModule(slug);
  const examples = examplesByModule(slug);

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="rounded bg-ink px-2 py-1 font-mono text-sm font-semibold text-gold-bright">{mod.code}</span>
        <h1 className="display text-2xl">{mod.name}</h1>
      </div>
      {mod.description && (
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-2 text-pretty">{mod.description}</p>
      )}

      {cms.length > 0 && (
        <section className="mt-9">
          <h2 className="display text-lg">CMS-Required Outcomes ({cms.length})</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-line bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-paper text-left">
                    <th className="eyebrow px-4 py-2.5 font-normal">Ref</th>
                    <th className="eyebrow px-4 py-2.5 font-normal">Outcome</th>
                    <th className="eyebrow px-4 py-2.5 font-normal">Sources</th>
                  </tr>
                </thead>
                <tbody>
                  {cms.map((o, i) => (
                    <tr key={o.id} className={`align-top ${i % 2 ? 'bg-zebra' : 'bg-white'}`}>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link
                          href={`/outcomes/${o.slug}`}
                          className="font-mono text-[12.5px] font-semibold text-accent hover:text-accent-dark focus-ring"
                        >
                          {o.id}
                        </Link>
                        {o.title && <div className="mt-0.5 text-[11px] text-ink-3">{o.title}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/outcomes/${o.slug}`}
                          className="block text-[13.5px] leading-[1.6] text-ink-2 hover:text-ink focus-ring"
                        >
                          {o.outcome}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5 font-mono text-[11px] leading-[1.7]">
                          {o.regs.map((r) => (
                            <a
                              key={r.cite}
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              title={r.note ? `Open in eCFR — ${r.note}` : 'Open in eCFR'}
                              className="whitespace-nowrap text-accent hover:text-accent-dark focus-ring"
                            >
                              {r.cite}
                            </a>
                          ))}
                          {o.regOther.map((s) => (
                            <span key={s} className="text-ink-3">{s}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {examples.length > 0 && (
        <section className="mt-11" id="state-examples">
          <h2 className="display text-lg">State-Specific Examples ({examples.length})</h2>
          <p className="mt-1 max-w-3xl text-xs text-ink-2">
            Outcome statements from other states, gathered and shared by CMS in the certification repository — the
            best available reference for drafting your own.
          </p>
          <OpenFromHash />
          <div className="mt-3 space-y-2.5">
            {examples.map((s, i) => (
              <details
                key={i}
                id={`ex-${i}`}
                className="rounded-lg border border-line border-l-[3px] border-l-gold bg-white p-4 shadow-[0_1px_2px_rgba(16,35,63,.05)] target:ring-3 target:ring-accent/30"
              >
                <summary className="flex cursor-pointer flex-wrap items-center gap-2 focus-ring">
                  <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[11.5px] font-bold text-gold-ink">
                    {s.state}
                  </span>
                  <span className="font-serif text-[15px] font-semibold text-ink">
                    {s.goal || 'State-specific outcome'}
                  </span>
                </summary>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-2 text-pretty">{s.outcome}</p>
                {s.metrics.length > 0 && (
                  <div className="mt-3">
                    <div className="eyebrow">Metrics</div>
                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-ink-2">
                      {s.metrics.map((m, j) => (
                        <li key={j}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
