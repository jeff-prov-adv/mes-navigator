'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/modules', label: 'Modules' },
  { href: '/regulations', label: 'Regulations' },
  { href: '/cefs', label: 'CEFs' },
  { href: '/guidance/certification-process', label: 'Guidance', match: '/guidance' },
  { href: '/assistant', label: 'Assistant' },
  { href: '/strategy', label: 'Strategy' },
  { href: '/about', label: 'About' },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 px-4">
        {NAV.map((n) => {
          // Outcome pages belong to Modules — keep the section lit while drilling in.
          const base = n.match || n.href;
          const active = pathname === base || pathname.startsWith(`${base}/`) || (base === '/modules' && pathname.startsWith('/outcomes'));
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? 'page' : undefined}
              className={`py-2.5 text-[13px] transition-colors ${
                active ? 'text-white shadow-[inset_0_-2px_0_var(--color-gold)]' : 'text-white/70 hover:text-white'
              }`}
            >
              {n.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
