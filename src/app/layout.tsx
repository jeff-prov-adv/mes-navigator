import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Source_Serif_4, Public_Sans, IBM_Plex_Mono } from 'next/font/google';
import Link from 'next/link';
import { meta, outcomes, stateExamples } from '@/lib/data';
import HeaderSearch from '@/components/HeaderSearch';
import NavLinks from '@/components/NavLinks';
import './globals.css';

const serif = Source_Serif_4({ subsets: ['latin'], display: 'swap', variable: '--font-source-serif' });
const sans = Public_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-public-sans' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], display: 'swap', variable: '--font-plex-mono' });

export const metadata: Metadata = {
  title: 'MES Certification Navigator — Provenance Advisors',
  description:
    'Search and crosswalk the CMS MES Certification Repository: CMS-required outcomes, state-specific examples, metrics, and regulatory citations for Streamlined Modular Certification.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const searchable = outcomes.length + stateExamples.length;

  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans">
        <header className="bg-ink text-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-3.5">
            <Link href="/" className="group flex items-baseline gap-3.5">
              <span className="font-serif text-[19px] font-semibold tracking-[-.01em]">MES Certification Navigator</span>
              <span className="hidden font-mono text-[9.5px] uppercase tracking-[.16em] text-white/50 group-hover:text-white/70 sm:inline">
                Streamlined Modular Certification
              </span>
            </Link>
            <Suspense fallback={<div className="h-[38px] w-full sm:w-[320px]" />}>
              <HeaderSearch total={searchable} />
            </Suspense>
          </div>
          <NavLinks />
        </header>

        <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8">{children}</main>

        <footer className="border-t border-line bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-start gap-x-10 gap-y-6 px-4 py-7">
            <div className="min-w-[320px] flex-1">
              <div className="font-serif text-[15px] font-semibold text-ink">Built by Provenance Advisors</div>
              <p className="mt-1.5 max-w-[460px] text-xs leading-[1.7] text-ink-2 text-pretty">
                Jeff Grabinski · Medicaid enterprise data &amp; systems consulting · 9 years inside state Medicaid
                data, systems integration, and CMS certification.
              </p>
            </div>
            <div className="min-w-[320px] flex-1">
              <div className="eyebrow">Source &amp; disclaimer</div>
              <p className="mt-1.5 text-xs leading-[1.7] text-ink-2 text-pretty">
                Unofficial tool, not affiliated with or endorsed by CMS. Content sourced from the public{' '}
                <a
                  className="text-accent underline underline-offset-2 hover:text-accent-dark"
                  href={meta.source}
                  target="_blank"
                  rel="noreferrer"
                >
                  CMS MES Certification Repository
                </a>{' '}
                (synced {meta.syncedAt}). Verify against the official repository before relying on it for a
                certification submission.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
