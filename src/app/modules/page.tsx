import ModuleCard from '@/components/ModuleCard';
import { modules } from '@/lib/data';

export const metadata = { title: 'Modules — MES Certification Navigator' };

export default function ModulesPage() {
  const baseline = modules.filter((m) => m.cmsRequired > 0);
  const stateOnly = modules.filter((m) => m.cmsRequired === 0);

  return (
    <div>
      <h1 className="display text-2xl">MES Modules</h1>
      <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-ink-2">
        {baseline.length} modules carry a CMS-required baseline. {stateOnly.length} (
        {stateOnly.map((m) => m.code).join(', ')}) certify against state-specific outcomes only.
      </p>

      <h2 className="eyebrow mt-9 mb-3">CMS-required baseline</h2>
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {baseline.map((m) => (
          <ModuleCard key={m.slug} mod={m} />
        ))}
      </div>

      {stateOnly.length > 0 && (
        <>
          <h2 className="eyebrow mt-10 mb-3">State-specific outcomes only</h2>
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {stateOnly.map((m) => (
              <ModuleCard key={m.slug} mod={m} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
