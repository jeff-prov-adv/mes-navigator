import Link from 'next/link';
import type { Module } from '@/lib/data';

/** Ink card with a gold monogram; the CMS/state split reads at a glance in the footer rule. */
export default function ModuleCard({ mod }: { mod: Module }) {
  const total = mod.cmsRequired + mod.stateSpecific;
  const stateOnly = mod.cmsRequired === 0;
  const count =
    mod.cmsRequired && mod.stateSpecific
      ? `${total} total`
      : stateOnly
        ? `${mod.stateSpecific} examples`
        : `${mod.cmsRequired} outcomes`;

  return (
    <Link
      href={`/modules/${mod.slug}`}
      className="group flex min-h-[158px] flex-col gap-2.5 rounded-[9px] bg-ink p-[18px_20px_16px] ring-offset-2 transition-shadow hover:shadow-[0_12px_28px_-16px_rgba(16,35,63,.65)] focus-ring"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-xs font-semibold tracking-[.08em] text-gold-bright">{mod.code}</span>
        <span className="font-mono text-[10.5px] text-white/45">{count}</span>
      </div>
      <div className="font-serif text-[19px] font-semibold leading-tight text-white group-hover:text-white">
        {mod.name}
      </div>
      {mod.description && (
        <p className="line-clamp-3 text-[12.5px] leading-[1.55] text-white/60 text-pretty">{mod.description}</p>
      )}
      <div
        className={`mt-auto border-t pt-2.5 font-mono text-[10px] tracking-[.06em] ${
          stateOnly ? 'border-gold-bright/35 text-gold-bright' : 'border-white/12 text-white/50'
        }`}
      >
        {mod.cmsRequired} CMS · {mod.stateSpecific} STATE
      </div>
    </Link>
  );
}
