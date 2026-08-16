'use client';

import { useMemo, useState } from 'react';
import { cefs } from '@/lib/data';

export default function CefList() {
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return cefs;
    return cefs.filter(
      (c) =>
        c.ref.toLowerCase().includes(needle) ||
        c.condition.toLowerCase().includes(needle) ||
        c.evidence.toLowerCase().includes(needle),
    );
  }, [q]);

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Filter conditions"
        placeholder="Filter conditions and evidence… e.g. “MITA”, “reuse”, “CEF07”"
        className="mt-4 w-full max-w-xl rounded-md border border-line bg-white px-4 py-2.5 text-sm shadow-sm focus-ring"
      />
      <p className="mt-2 font-mono text-[11px] text-ink-3">
        {rows.length} of {cefs.length} conditions
      </p>

      {rows.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-line-2 bg-zebra p-[22px] text-center">
          <p className="font-serif text-base font-semibold text-ink">No conditions match “{q}”</p>
          <p className="mt-1.5 text-[12.5px] text-ink-2">Try a broader term, or clear the filter.</p>
        </div>
      ) : (
        <div className="mt-3 space-y-2.5">
          {rows.map((c) => (
            <div
              key={c.ref}
              className="rounded-lg border border-line bg-white p-5 shadow-[0_1px_2px_rgba(16,35,63,.05)]"
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 rounded bg-ink px-1.5 py-0.5 font-mono text-[11.5px] font-semibold text-white">
                  {c.ref}
                </span>
                <p className="font-serif text-[15px] font-semibold leading-snug text-ink text-pretty">{c.condition}</p>
              </div>
              {c.evidence && (
                <div className="mt-3 ml-1 border-l-2 border-line pl-4">
                  <div className="eyebrow">Example evidence</div>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-2 text-pretty">
                    {c.evidence}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
