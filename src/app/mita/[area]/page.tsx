import Link from 'next/link';
import { notFound } from 'next/navigation';
import { mitaAreas, getMitaArea, mitaProcessesByArea, mitaProcessHref } from '@/lib/mita';
import { AreaModulePanel } from '@/components/MitaCrosswalk';

export function generateStaticParams() {
  return mitaAreas.map((a) => ({ area: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  const a = getMitaArea(area);
  return { title: `${a?.name ?? 'MITA'} · MITA · MES Certification Navigator` };
}

export default async function MitaAreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  const a = getMitaArea(area);
  if (!a) notFound();
  const procs = mitaProcessesByArea(a.slug);

  // Group by the BPT sub-category, keeping the order CMS lists processes in.
  const groups = new Map<string, typeof procs>();
  for (const p of procs) {
    const key = p.subCategory || 'Processes';
    groups.set(key, [...(groups.get(key) || []), p]);
  }

  return (
    <div>
      <nav className="text-xs text-ink-2">
        <Link href="/mita" className="hover:text-accent">MITA</Link>
      </nav>
      <div className="mt-3 flex items-center gap-3">
        {a.code && (
          <span className="rounded bg-ink px-2 py-1 font-mono text-sm font-semibold text-gold-bright">{a.code}</span>
        )}
        <h1 className="display text-2xl">{a.name}</h1>
      </div>
      <p className="mt-2 text-sm text-ink-2">
        {procs.length} business process{procs.length === 1 ? '' : 'es'}, each with its Business Process Template and
        Business Capability Model.
      </p>
      <AreaModulePanel area={a} />

      {[...groups].map(([sub, list]) => (
        <section key={sub} className="mt-9">
          <h2 className="eyebrow mb-3">{sub}</h2>
          <div className="grid gap-3.5 sm:grid-cols-2">
            {list.map((p) => (
              <Link
                key={p.slug}
                href={mitaProcessHref(p)}
                className="group flex flex-col gap-2 rounded-lg border border-line border-l-[3px] border-l-ink bg-white p-[16px_18px] shadow-[0_1px_2px_rgba(16,35,63,.05)] transition-colors hover:border-line-2 focus-ring"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-serif text-[17px] font-semibold leading-snug text-ink group-hover:text-accent-dark">
                    {p.name}
                  </span>
                  <span className="shrink-0 font-mono text-[10.5px] text-ink-3">
                    {p.steps.length} steps · {p.maturity.length} questions
                  </span>
                </div>
                <p className="line-clamp-3 text-[13px] leading-[1.6] text-ink-2 text-pretty">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
