'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

/** Search lives in the header on every page; submitting routes to /search. */
export default function HeaderSearch({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const ref = useRef<HTMLInputElement>(null);

  // Keep the field in step with the URL so a back/forward nav doesn't strand stale
  // text — adjusted during render rather than in an effect, so there's no extra pass.
  const urlQ = pathname === '/search' ? params.get('q') || '' : '';
  const [q, setQ] = useState(urlQ);
  const [seenUrlQ, setSeenUrlQ] = useState(urlQ);
  if (urlQ !== seenUrlQ) {
    setSeenUrlQ(urlQ);
    setQ(urlQ);
  }

  // "/" focuses search, matching the affordance shown in the header.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
      if (e.key === '/' && !typing) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/search');
  }

  const active = q.length > 0;

  return (
    <form
      onSubmit={submit}
      role="search"
      className={`flex w-full items-center gap-2.5 rounded-md border px-3 py-2 transition-colors sm:w-[320px] ${
        active
          ? 'border-accent bg-white shadow-[0_0_0_3px_rgba(14,124,134,.35)]'
          : 'border-white/20 bg-white/[.09] hover:border-white/35'
      }`}
    >
      <span
        aria-hidden
        className={`size-[11px] shrink-0 rounded-full border-[1.5px] ${active ? 'border-ink-3' : 'border-white/55'}`}
      />
      <input
        ref={ref}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search outcomes and examples"
        placeholder={`Search ${total} outcomes & examples`}
        className={`w-full bg-transparent text-[13.5px] outline-none ${
          active ? 'text-ink placeholder:text-ink-3' : 'text-white placeholder:text-white/50'
        }`}
      />
      {active ? (
        <button
          type="button"
          onClick={() => { setQ(''); ref.current?.focus(); }}
          aria-label="Clear search"
          className="ml-auto grid size-[15px] shrink-0 place-items-center rounded-full bg-line text-[9px] leading-none text-ink-2 hover:bg-line-2"
        >
          ×
        </button>
      ) : (
        <kbd className="ml-auto shrink-0 rounded-sm border border-white/20 px-1 font-mono text-[10px] text-white/40">
          /
        </kbd>
      )}
    </form>
  );
}
