import Link from 'next/link';
import { BOOKING_URL } from '@/lib/contact';

/**
 * Public deployments ship the assistant as a worked example, not a live endpoint.
 * Drafting runs are demo-only; the capability is configured per-tenant with the
 * operator's own model provider.
 */
export default function AssistantTeaser() {
  return (
    <div className="max-w-4xl">
      <div className="rounded-lg border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,35,63,.05)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-[.04em] text-gold-ink">
            Worked example
          </span>
          <span className="text-xs text-ink-3">Not live output — a saved run, shown in full</span>
        </div>

        <dl className="mt-4 grid gap-x-8 gap-y-3 border-y border-line py-4 sm:grid-cols-[150px_1fr]">
          <dt className="eyebrow pt-0.5">Module</dt>
          <dd className="text-sm text-ink">Claims Processing (CP)</dd>
          <dt className="eyebrow pt-0.5">Program goal</dt>
          <dd className="text-sm text-ink">Reduce provider enrollment fraud</dd>
          <dt className="eyebrow pt-0.5">Enhancement</dt>
          <dd className="text-sm text-ink-2 text-pretty">
            Automates reporting of provider exclusionary lists and routes an action report to the Provider
            Management oversight team for one-click review.
          </dd>
        </dl>

        <div className="prose-md mt-5">
          <h3>Candidate state-specific outcome</h3>
          <p>
            Claims billed by providers appearing on federal or state exclusionary lists are identified and
            suspended before payment, and the responsible oversight staff act on each finding within one business
            day of its appearance.
          </p>
          <h3>Proposed metrics</h3>
          <ul>
            <li>Count and dollar value of claims suspended on an exclusionary-list match, per month.</li>
            <li>Median hours from exclusionary-list match to a recorded oversight disposition.</li>
            <li>Percentage of matches dispositioned within one business day.</li>
          </ul>
          <h3>Overlap check</h3>
          <p>
            Flags overlap with the CMS-required baseline before you submit — here, the screening and payment
            suspension outcomes already carried by Provider Management, so the state-specific statement is scoped
            to the timeliness and disposition of the response rather than restating the requirement.
          </p>
        </div>

        <p className="mt-5 border-t border-line pt-3 text-xs text-ink-2">
          Drafts are a starting point for your team, never a submission. Per CMS guidance, state-specific outcomes
          are finalized in collaboration with your CMS State Officer.
        </p>
      </div>

      <div className="mt-4 rounded-lg bg-ink p-6">
        <div className="font-mono text-[10px] uppercase tracking-[.12em] text-gold-bright">Live drafting</div>
        <h2 className="mt-1.5 font-serif text-xl font-semibold text-white">Run against your own module and data</h2>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-[1.6] text-white/70 text-pretty">
          This deployment ships the assistant as an example rather than a live endpoint. Drafting runs against a
          model provider you choose and control — your cloud, your boundary, your retention terms — so nothing
          about your program leaves an environment your certification lead has already approved.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={BOOKING_URL}
            className="rounded-md bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-accent-dark focus-ring"
          >
            Book a walkthrough →
          </a>
          <Link
            href="/about"
            className="rounded-md border border-white/25 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:border-white/50 focus-ring"
          >
            How this was built
          </Link>
        </div>
      </div>
    </div>
  );
}
