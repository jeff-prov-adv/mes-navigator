import Link from 'next/link';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { guidance } from '@/lib/data';

export function generateStaticParams() {
  return guidance.map((g) => ({ slug: g.slug }));
}

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
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  });

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <aside className="lg:w-60 shrink-0">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-2">Guidance</div>
        <ul className="mt-2 space-y-1.5 text-sm">
          {guidance.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/guidance/${g.slug}`}
                className={g.slug === slug ? 'font-semibold text-ink' : 'text-accent hover:underline'}
              >
                {g.title}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <article className="max-w-3xl min-w-0">
        <h1 className="display text-2xl">{page.title}</h1>
        <div className="prose-md mt-2" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </div>
  );
}
