import React from 'react';

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Wrap query-term matches in <mark>. Builds React nodes rather than an HTML
 * string so user input can never reach the DOM as markup.
 */
export default function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const useful = terms.map((t) => t.trim()).filter((t) => t.length > 1);
  if (!useful.length) return <>{text}</>;

  const re = new RegExp(`(${useful.map(escapeRe).join('|')})`, 'gi');
  const parts = text.split(re);

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-sm bg-gold/25 px-0.5 text-ink">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}
