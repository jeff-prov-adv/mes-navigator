import Link from 'next/link';
import type { Module } from '@/lib/data';
import {
  mitaAreaForModule,
  unpublishedMitaAreaForModule,
  moduleForMitaArea,
  mitaSourceUrl,
  type MitaArea,
  type MitaUnpublishedArea,
} from '@/lib/mita';

// Server components: they import lib/mita, whose process data must not reach a client bundle.

const NAME_MATCH =
  'Linked because the names match. CMS publishes no mapping between MES certification modules and MITA business areas, so read this as a pointer rather than a crosswalk.';

const panel = 'mt-5 max-w-3xl rounded-lg border border-line bg-white p-4 shadow-[0_1px_2px_rgba(16,35,63,.05)]';

/** On an MES module page: the MITA business area of the same name, or the gap where MITA published none. */
export function ModuleMitaPanel({ mod }: { mod: Module }) {
  const area = mitaAreaForModule(mod);
  if (area) {
    return (
      <aside className={panel}>
        <div className="eyebrow">MITA business area</div>
        <Link
          href={`/mita/${area.slug}`}
          className="mt-2 flex flex-wrap items-center gap-2 font-serif text-[16px] font-semibold text-ink hover:text-accent-dark focus-ring"
        >
          <span className="rounded bg-ink px-1.5 py-0.5 font-mono text-[11.5px] font-semibold text-gold-bright">{area.code}</span>
          {area.name}
          <span className="font-sans text-xs font-normal text-ink-2">
            · {area.processes} business process{area.processes === 1 ? '' : 'es'} →
          </span>
        </Link>
        <p className="mt-2 text-xs leading-relaxed text-ink-3 text-pretty">{NAME_MATCH}</p>
      </aside>
    );
  }
  const gap = unpublishedMitaAreaForModule(mod);
  return gap ? <UnpublishedAreaNote area={gap} className="mt-5 max-w-3xl" /> : null;
}

/** On a MITA area page: the MES module of the same name, when one exists. */
export function AreaModulePanel({ area }: { area: MitaArea }) {
  const mod = moduleForMitaArea(area);
  if (!mod) return null;
  return (
    <aside className={panel}>
      <div className="eyebrow">MES certification module</div>
      <Link
        href={`/modules/${mod.slug}`}
        className="mt-2 flex flex-wrap items-center gap-2 font-serif text-[16px] font-semibold text-ink hover:text-accent-dark focus-ring"
      >
        <span className="rounded bg-ink px-1.5 py-0.5 font-mono text-[11.5px] font-semibold text-gold-bright">{mod.code}</span>
        {mod.name}
        <span className="font-sans text-xs font-normal text-ink-2">
          · {mod.cmsRequired} CMS-required outcome{mod.cmsRequired === 1 ? '' : 's'} →
        </span>
      </Link>
      <p className="mt-2 text-xs leading-relaxed text-ink-3 text-pretty">{NAME_MATCH}</p>
    </aside>
  );
}

/** A business area the framework names but CMS never published templates or models for. */
export function UnpublishedAreaNote({
  area,
  className,
  children,
}: {
  area: MitaUnpublishedArea;
  /** Spacing and width only; the note draws its own dashed box. */
  className?: string;
  children?: React.ReactNode;
}) {
  const file = area.source.file.split('/').pop();
  return (
    <aside className={`rounded-lg border border-dashed border-line-2 bg-white p-4 ${className ?? ''}`}>
      <div className="eyebrow">MITA business area not published</div>
      <div className="mt-2 flex flex-wrap items-center gap-2 font-serif text-[16px] font-semibold text-ink">
        <span className="rounded border border-line-2 px-1.5 py-0.5 font-mono text-[11.5px] font-semibold text-ink-2">
          {area.code}
        </span>
        {area.name}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-2 text-pretty">
        MITA 3.0 defines a {area.name} business area, but CMS never published its Business Process Templates or
        Business Capability Models. The framework&apos;s table of contents lists its processes as{' '}
        {area.status.toLowerCase()}:
      </p>
      <ul className="mt-2 space-y-1 text-sm text-ink-2">
        {area.processes.map((p) => (
          <li key={p.code}>
            <span className="mr-2 font-mono text-[11.5px] font-semibold text-ink-3">{p.code}</span>
            {p.name}
          </li>
        ))}
      </ul>
      {children}
      <p className="mt-3 text-xs leading-relaxed text-ink-3">
        Source: CMS MITA 3.0 Business Architecture,{' '}
        <a
          href={mitaSourceUrl(area.source.file)}
          target="_blank"
          rel="noreferrer"
          className="text-accent underline underline-offset-2 hover:text-accent-dark"
        >
          {file}
        </a>
        , page {area.source.pages}.
      </p>
    </aside>
  );
}
