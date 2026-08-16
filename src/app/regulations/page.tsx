import RegulationsTable from '@/components/RegulationsTable';

export const metadata = { title: 'Regulation Crosswalk — MES Certification Navigator' };

export default function RegulationsPage() {
  return (
    <div>
      <h1 className="display text-2xl">Regulation → Outcome Crosswalk</h1>
      <p className="mt-1 max-w-3xl text-sm text-ink-2">
        Every CFR citation in the certification repository, mapped to the CMS-required outcomes it anchors. Start
        from the regulation your system touches; land on the outcomes and metrics CMS will certify against.
      </p>
      <RegulationsTable />
    </div>
  );
}
