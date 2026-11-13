import Link from 'next/link';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { guidance, type GuidancePage } from '@/lib/data';

export function generateStaticParams() {
  return guidance.map((g) => ({ slug: g.slug }));
}

/** Consecutive pages CMS files under one section, so the sidebar can nest them as CMS does. */
const sections = guidance.reduce<{ group?: string; pages: GuidancePage[] }[]>((acc, g) => {
  const last = acc.at(-1);
  if (last && last.group === g.group) last.pages.push(g);
  else acc.push({ group: g.group, pages: [g] });
  return acc;
}, []);

const HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

export default async function GuidancePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = guidance.find((g) => g.slug === slug);
  if (!page) notFound();
  // CMS-repo markdown is third-party content — sanitize before rendering.
  const html = sanitizeHtml(await marked.parse(page.markdown), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt'],
      a: ['href', 'name', 'target', 'rel'],
      // Heading anchors: the ETL carries CMS's own ids over so a page's table of
      // contents can link to its sections.
      ...Object.fromEntries(HEADINGS.map((h) => [h, ['id']])),
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  });

  const pageLink = (g: GuidancePage) => (
    <li key={g.slug}>
      <Link
        href={`/guidance/${g.slug}`}
        aria-current={g.slug === slug ? 'page' : undefined}
        className={g.slug === slug ? 'font-semibold text-ink' : 'text-accent hover:underline'}
      >
        {g.title}
      </Link>
    </li>
  );

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <aside className="lg:w-60 shrink-0">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-2">Guidance</div>
        <ul className="mt-2 space-y-1.5 text-sm">
          {sections.map((s) =>
            s.group ? (
              <li key={s.group} className="pt-2">
                <div className="text-xs font-semibold text-ink-2">{s.group}</div>
                <ul className="mt-1.5 space-y-1.5 border-l border-line pl-3">{s.pages.map(pageLink)}</ul>
              </li>
            ) : (
              s.pages.map(pageLink)
            ),
          )}
        </ul>
      </aside>
      <article className="max-w-3xl min-w-0">
        <h1 className="display text-2xl">{page.title}</h1>
        <div className="prose-md mt-2" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </div>
  );
}
