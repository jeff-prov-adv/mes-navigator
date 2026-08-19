const RFI_URL = 'https://rfi.si-delivery.com';

const CONSTRAINTS = [
  { name: 'Lead time', description: 'Years from idea to proven outcome, when the work demands weeks.' },
  { name: 'Decision distance', description: 'Choices made many layers removed from the point of service delivery.' },
  { name: 'Procurement structure', description: 'Upfront certainty required in conditions where certainty is impossible.' },
  { name: 'Misapplied frameworks', description: 'Constructs that describe systems without changing how they get built.' },
];

const START_ITEMS = [
  { href: '/s1', title: 'Classifying work with a horizons model, and creating a new CMS support capability for Horizon 3' },
  { href: '/s2', title: 'Focusing intently on reducing the lead time to learn' },
  { href: '/s3', title: 'Pushing decision authority to the people closest to the work' },
  { href: '/s4', title: 'Preparing for AI-built software as a transformation driver' },
  { href: '/s5', title: 'Making procurement reform a first-class element of the standards program' },
  { href: '/s6', title: 'Filtering vendors on demonstrated performance, not proposals' },
  { href: '/s7', title: 'Making production-like testability a definition of done' },
  { href: '/s8', title: 'Funding small and deciding often' },
  { href: '/s9', title: 'Providing the central infrastructure only the federal government can provide' },
  { href: '/s10', title: 'Running end-to-end slices in protected environments, and letting standards emerge from what they teach' },
  { href: '/s11', title: 'Putting policy change on the table as part of Horizon 3 transformation' },
];

const CONTINUE_ITEMS = [
  { href: '/c1', title: 'Supporting outcome-based certification, extended further' },
  { href: '/c2', title: 'Supporting state flexibility and novel approaches' },
  { href: '/c3', title: 'Enforcing the CMS intellectual property model' },
];

const STOP_ITEMS = [
  { href: '/x1', title: 'Forcing solution and execution decisions to come from people far from the work' },
  { href: '/x2', title: 'Calling systems products' },
  { href: '/x3', title: 'Using enterprise architecture frameworks and MITA as the definitional frame for transformation work' },
  { href: '/x4', title: 'Misusing modularity' },
  { href: '/x5', title: 'Building procurement on the assumption of upfront correctness' },
  { href: '/x6', title: 'Treating standardization and COTS adoption as the transformation lever' },
  { href: '/x7', title: 'Using standards compliance as a barrier to entry' },
];

function RecommendationList({ items, prefix }: { items: { href: string; title: string }[]; prefix: string }) {
  return (
    <ol className="mt-3 space-y-2.5">
      {items.map((item, i) => (
        <li key={item.href} className="flex gap-3 text-[13.5px] leading-[1.55] text-ink-2">
          <span className="font-mono text-[10.5px] font-semibold tracking-[.04em] text-ink-3">
            {prefix}
            {i + 1}
          </span>
          <a
            href={`${RFI_URL}${item.href}`}
            target="_blank"
            rel="noreferrer"
            className="text-accent underline underline-offset-2 hover:text-accent-dark"
          >
            {item.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

export const metadata = { title: 'Strategy — MES Certification Navigator' };

export default function StrategyPage() {
  return (
    <div className="max-w-3xl">
      <span className="eyebrow">RFI 269888 · Medicaid Enterprise Systems (MES) IT Standards</span>
      <h1 className="display mt-1.5 text-2xl">A strategic perspective on MES transformation</h1>

      <div className="prose-md mt-4">
        <p>
          CMS is soliciting input on MES IT standards through{' '}
          <a href="https://sam.gov/workspace/contract/opp/180c46c0287a4b4097106e0979f8c58f/view" target="_blank" rel="noreferrer">
            RFI 269888
          </a>
          . <strong>SI Delivery Consulting</strong> has published a living response, written from three vantage
          points inside Medicaid Enterprise System modernization: delivery practitioner on MES implementations,
          strategy consultant developing modernization strategies with state Medicaid agencies, and advisor
          embedded inside them, working daily alongside program staff, state IT, counties, and vendors.
        </p>
        <p>
          The premise: states have not been constrained by a lack of technology or standards. FHIR, X12, NIST
          frameworks, cloud architectures, API patterns, and modern data platforms are mature and have been
          available for years. The binding constraints are institutional — how government learns, makes
          decisions, procures solutions, and translates established frameworks into effective implementation.
        </p>

        <div className="my-5 grid grid-cols-2 gap-x-6 gap-y-4 not-prose sm:grid-cols-4">
          {CONSTRAINTS.map((c) => (
            <div key={c.name}>
              <div className="font-serif text-[13.5px] font-semibold text-ink">{c.name}</div>
              <p className="mt-1 text-[12px] leading-[1.5] text-ink-2 text-pretty">{c.description}</p>
            </div>
          ))}
        </div>

        <p>
          The response lays out 21 recommendations — organized as what CMS should <strong>start</strong>,{' '}
          <strong>continue</strong>, and <strong>stop</strong> — that work together as one connected approach
          rather than isolated question-by-question answers. Two of them bear directly on this tool&apos;s
          subject: extending Streamlined Modular Certification&apos;s shift toward outcome-based certification,
          and retiring MITA and enterprise-architecture frameworks as the definitional frame for transformation
          work.
        </p>

        <h2>11 · Start</h2>
        <p className="!my-1 text-[13px] text-ink-3">Actions CMS can take to remove transformation barriers and better support states.</p>
        <RecommendationList items={START_ITEMS} prefix="S" />

        <h2>3 · Continue</h2>
        <p className="!my-1 text-[13px] text-ink-3">Reforms already underway that deserve defense and extension.</p>
        <RecommendationList items={CONTINUE_ITEMS} prefix="C" />

        <h2>7 · Stop</h2>
        <p className="!my-1 text-[13px] text-ink-3">Practices that actively prevent states from innovating, modernizing, and achieving outcomes.</p>
        <RecommendationList items={STOP_ITEMS} prefix="X" />

        <h2>Read the full response</h2>
        <p>
          Each recommendation above links to its full detail on the living response site, where you can also
          read the <a href={`${RFI_URL}/introduction`} target="_blank" rel="noreferrer">introduction</a> and{' '}
          <a href={`${RFI_URL}/background`} target="_blank" rel="noreferrer">background</a>, weigh in on SI&apos;s
          take, or build and submit your own response to CMS.
        </p>
        <p>
          <a
            href={RFI_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-[7px] bg-ink px-4 py-2 text-[13px] font-semibold text-white no-underline hover:bg-ink/90"
          >
            Read the full RFI response →
          </a>
        </p>

        <h2>Who wrote it</h2>
        <p>
          <strong>Kevin Sutherland — SI Delivery Consulting.</strong> Questions about this perspective, or about
          MES modernization strategy generally —{' '}
          <a href="https://www.linkedin.com/in/kjsuther/" target="_blank" rel="noreferrer">
            connect on LinkedIn
          </a>{' '}
          or email <a href="mailto:kjsuther@si-delivery.com">kjsuther@si-delivery.com</a>.
        </p>
      </div>
    </div>
  );
}
