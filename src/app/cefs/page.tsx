import CefList from '@/components/CefList';
import { cefs } from '@/lib/data';

export const metadata = { title: 'Conditions for Enhanced Funding — MES Certification Navigator' };

export default function CefsPage() {
  return (
    <div>
      <h1 className="display text-2xl">Conditions for Enhanced Funding (CEFs)</h1>
      <p className="mt-1 max-w-3xl text-sm text-ink-2">
        The {cefs.length} conditions a state must meet for enhanced federal financial participation, with the
        example evidence CMS suggests for each.
      </p>
      <CefList />
    </div>
  );
}
