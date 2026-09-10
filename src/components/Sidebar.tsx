'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import OakLogo from './OakLogo';

const NAV = [
  {
    href: '/admin/checkin',
    label: 'Event Check-In',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <rect x="7" y="7" width="10" height="10" rx="1" />
      </svg>
    ),
  },
  {
    href: '/admin/attendees',
    label: 'Attendees',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 h-screen border-r border-gray-100 bg-white flex flex-col justify-between px-4 py-6">
      <div>
        <div className="mb-8 px-1">
          <OakLogo size="sm" />
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-3 font-medium">
            Partner Convening 2026
          </p>
        </div>

        <nav className="space-y-1">
          {NAV.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active
                    ? 'bg-[#0B1F3A] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className={active ? 'text-white' : 'text-gray-400'}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2.5 px-1">
        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-gray-700 leading-tight">Harare, Zimbabwe</p>
          <p className="text-[10px] text-gray-400 leading-tight mt-0.5">9-11 March 2026</p>
        </div>
      </div>
    </aside>
  );
}
