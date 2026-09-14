import Link from 'next/link';
import { mitaAreas, mitaProcesses, mitaProcessesByArea, mitaMeta } from '@/lib/mita';

export const metadata = { title: 'MITA Business Areas · MES Certification Navigator' };

export default function MitaPage() {
  const questions = mitaProcesses.reduce((n, p) => n + p.maturity.length, 0);

  return (
    <div>
      <h1 className="display text-2xl">MITA Business Areas</h1>
      <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-ink-2 text-pretty">
        The Medicaid Information Technology Architecture Framework 3.0 (May 2014 Update) describes{' '}
        {mitaProcesses.length} business processes across {mitaAreas.length} business areas. Each process pairs a
        Business Process Template, which lays out its steps, triggers, and results, with a Business Capability
        Model that defines five maturity levels for {questions} capability questions in all. These are the
        documents a State Self-Assessment scores against.
      </p>
      <p className="mt-2 max-w-3xl text-xs leading-relaxed text-ink-3 text-pretty">
        Transcribed from the CMS appendix PDFs by Nick Aretakis in{' '}
        <a
          href={mitaMeta.mitaSource}
          target="_blank"
          rel="noreferrer"
          className="text-accent underline underline-offset-2 hover:text-accent-dark"
        >
          MITA Open Blueprint
        </a>{' '}
        (MIT License). Every process page cites the PDF pages it came from.
      </p>

      <div className="mt-8 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {mitaAreas.map((a) => {
          const procs = mitaProcessesByArea(a.slug);
          const qs = procs.reduce((n, p) => n + p.maturity.length, 0);
          const subs = [...new Set(procs.map((p) => p.subCategory).filter(Boolean))];
          return (
            <Link
              key={a.slug}
              href={`/mita/${a.slug}`}
              className="group flex min-h-[158px] flex-col gap-2.5 rounded-[9px] bg-ink p-[18px_20px_16px] ring-offset-2 transition-shadow hover:shadow-[0_12px_28px_-16px_rgba(16,35,63,.65)] focus-ring"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-xs font-semibold tracking-[.08em] text-gold-bright">{a.code}</span>
                <span className="font-mono text-[10.5px] text-white/45">{a.processes} processes</span>
              </div>
              <div className="font-serif text-[19px] font-semibold leading-tight text-white">{a.name}</div>
              {subs.length > 0 && (
                <p className="line-clamp-3 text-[12.5px] leading-[1.55] text-white/60 text-pretty">{subs.join(' · ')}</p>
              )}
              <div className="mt-auto border-t border-white/12 pt-2.5 font-mono text-[10px] tracking-[.06em] text-white/50">
                {a.processes} BPT · {a.processes} BCM · {qs} QUESTIONS
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
