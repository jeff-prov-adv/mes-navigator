import { Suspense } from 'react';
import SearchResults from '@/components/SearchResults';

export const metadata = { title: 'Search — MES Certification Navigator' };

export default function SearchPage() {
  return (
    <div>
      <h1 className="display mb-1 text-2xl">Search</h1>
      <p className="mb-6 max-w-3xl text-sm text-ink-2">
        Every CMS-required outcome and CMS-published state example, indexed with its metrics and citations. Filter
        by result type and module; search from the field in the header on any page.
      </p>
      <Suspense fallback={<ResultsSkeleton />}>
        <SearchResults />
      </Suspense>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid items-start gap-0 md:grid-cols-[224px_1fr]">
      <div className="hidden md:block md:border-r md:border-line md:pr-5" />
      <div className="flex flex-col gap-2.5 md:pl-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-line bg-white p-[16px_18px]">
            <div className="flex items-center gap-2">
              <div className="h-[15px] w-[34px] rounded bg-line/70" />
              <div className="h-[11px] w-[120px] rounded-sm bg-line/70" />
            </div>
            <div className="mt-2.5 h-[17px] w-3/5 rounded bg-line" />
            <div className="mt-2.5 h-[11px] w-full rounded-sm bg-line/70" />
            <div className="mt-1.5 h-[11px] w-[82%] rounded-sm bg-line/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
