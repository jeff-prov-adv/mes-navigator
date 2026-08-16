'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { regulations, outcomes } from '@/lib/data';

export default function RegulationsTable() {
  const [q, setQ] = useState('');
  const byId = useMemo(() => new Map(outcomes.map((o) => [o.id, o])), []);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return regulations;
    return regulations.filter((r) => {
      if (r.cite.toLowerCase().includes(needle)) return true;
      return r.outcomes.some((id) => {
        const o = byId.get(id);
        return (
          id.toLowerCase().includes(needle) ||
          (o && (o.title.toLowerCase().includes(needle) || o.module.toLowerCase().includes(needle)))
        );
      });
    });
  }, [q, byId]);

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Filter citations"
        placeholder="Filter by citation, outcome ref, title, or module… e.g. “435.9”, “EE13”, “provider”"
        className="mt-4 w-full max-w-xl rounded-md border border-line bg-white px-4 py-2.5 text-sm shadow-sm focus-ring"
      />
      <p className="mt-2 font-mono text-[11px] text-ink-3">
        {rows.length} of {regulations.length} citations
      </p>

      {rows.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-line-2 bg-zebra p-[22px] text-center">
          <p className="font-serif text-base font-semibold text-ink">No citations match “{q}”</p>
          <p className="mt-1.5 text-[12.5px] text-ink-2">Try a partial section number, like “435.9”.</p>
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-lg border border-line bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-left">
                  <th className="eyebrow px-4 py-2.5 font-normal">Citation</th>
                  <th className="eyebrow px-4 py-2.5 font-normal">Outcomes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.cite} className={`align-top ${i % 2 ? 'bg-zebra' : 'bg-white'}`}>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        title={r.note ? `Open in eCFR — ${r.note}` : 'Open in eCFR'}
                        className="font-mono text-[12.5px] font-medium text-accent underline underline-offset-2 hover:text-accent-dark focus-ring"
                      >
                        {r.cite}
                      </a>
                      {r.note && <div className="mt-0.5 text-[11px] font-normal text-ink-3">{r.note}</div>}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {r.outcomes.map((id) => {
                          const o = byId.get(id);
                          return (
                            <Link
                              key={id}
                              href={`/outcomes/${o?.slug ?? id}`}
                              title={o ? `${o.title}: ${o.outcome.slice(0, 140)}…` : id}
                              className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[11.5px] font-semibold text-ink transition-colors hover:border-accent hover:text-accent-dark focus-ring"
                            >
                              {id}
                            </Link>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
