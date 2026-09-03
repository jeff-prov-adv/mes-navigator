import { meta, outcomes, stateExamples, regulations, cefs, modules } from '@/lib/data';
import { BOOKING_URL, CONTACT_EMAIL } from '@/lib/contact';

export const metadata = { title: 'About — MES Certification Navigator' };

export default function AboutPage() {
  const baselineModules = modules.filter((m) => m.cmsRequired > 0);
  const stateOnlyModules = modules.filter((m) => m.cmsRequired === 0);

  return (
    <div className="max-w-3xl">
      <h1 className="display text-2xl">About this tool</h1>

      <div className="prose-md mt-4">
        <p>
          The MES Certification Navigator makes the CMS MES Certification Repository — the source of truth for
          Streamlined Modular Certification outcomes and metrics — searchable and crosswalked. The official site
          publishes this content as static tables with no search, no filtering, and no way to trace a regulation
          to the outcomes it anchors. This tool fixes that.
        </p>
        <p>
          It indexes {outcomes.length} CMS-required outcomes across the {baselineModules.length} modules that
          carry a CMS-required baseline ({stateOnlyModules.length} more —{' '}
          {stateOnlyModules.map((m) => m.name).join(', ')} — certify on state-specific outcomes only),{' '}
          {stateExamples.length} state-specific outcome examples gathered and shared by CMS,{' '}
          {cefs.length} Conditions for Enhanced Funding, and {regulations.length} distinct regulatory citations
          linked to the eCFR — plus CMS&apos;s own guidance on the certification process and writing outcome
          statements. The drafting assistant applies that guidance, the module&apos;s CMS-required baseline, and
          the shared state examples to give teams a rigorous starting draft — one they finalize with their own
          experts and their CMS State Officer.
        </p>
        <h2>Who built it</h2>
        <p>
          <strong>Jeff Grabinski — Provenance Advisors.</strong> Nine years inside a state Medicaid agency:
          enterprise integration portfolio management with a required seat at the CMS modular certification
          table, plus the forensic data work behind nine-figure liability resolutions and fraud findings
          presented to CMS nationally. Provenance Advisors helps states and vendors understand their data and
          systems — and what certification demands of them — before the stakes get expensive.
        </p>
        <p>
          A system that cannot be certified is not a viable product in this market. That is the premise of this
          tool, and of the practice behind it.
        </p>
        <p>
          Questions about this tool, or about certification generally —{' '}
          <a href={BOOKING_URL}>book a call</a> or email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
        <h2>Sources &amp; disclaimers</h2>
        <ul>
          <li>
            All repository content is sourced from the public{' '}
            <a href={meta.source} target="_blank" rel="noreferrer">
              CMS MES Certification Repository
            </a>{' '}
            (CMSgov/CMCS-DSG-DSS-Certification), synced {meta.syncedAt}. CMS publishes that repository publicly
            without an asserted license; this tool attributes all content to it and adds navigation, crosswalks,
            and drafting support on top.
          </li>
          <li>
            This is an unofficial tool, not affiliated with or endorsed by CMS. Always verify against the official
            repository and your CMS state officer before relying on content for a certification submission.
          </li>
          <li>
            AI-drafted outcomes are starting points for expert review, not submission-ready artifacts.
            Per CMS&apos;s own guidance, states finalize state-specific outcomes in collaboration with their CMS
            State Officer.
          </li>
        </ul>
      </div>
    </div>
  );
}
