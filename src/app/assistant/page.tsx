import AssistantForm from '@/components/AssistantForm';
import AssistantTeaser from '@/components/AssistantTeaser';
import { assistantLive } from '@/lib/assistant';

export const metadata = { title: 'Outcome Drafting Assistant — MES Certification Navigator' };

// Read the flag per request rather than baking it in at build time, so the page
// and /api/draft can never disagree about whether drafting is live — flipping the
// env var takes effect without a rebuild.
export const dynamic = 'force-dynamic';

export default function AssistantPage() {
  const live = assistantLive();

  return (
    <div className="max-w-4xl">
      <h1 className="display text-2xl">State-Specific Outcome Drafting Assistant</h1>
      <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-ink-2 text-pretty">
        Describe an enhancement; get candidate state-specific outcome statements with metrics, checked against
        CMS&apos;s own outcome-writing guidance, grounded in the CMS-required baseline for your module and the
        state examples CMS has published. A starting draft for your team — not a submission. Per CMS guidance,
        state-specific outcomes are finalized in collaboration with your CMS State Officer.
      </p>

      <div className="mt-6">{live ? <AssistantForm /> : <AssistantTeaser />}</div>
    </div>
  );
}
