'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/register', label: 'Register', icon: 'M12 4v16m8-8H4' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 h-screen border-r border-gray-100 bg-white flex flex-col justify-between px-5 py-6">
      <div>
        <div className="mb-8">
          <Image src="/oak-logo.webp" alt="OAK Foundation" width={110} height={65} />
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-3">
            Partner Convening 2026
          </p>
        </div>

        <nav className="space-y-1">
          {NAV.map(item => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={item.icon} strokeLinecap="round" />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <p className="text-[11px] text-gray-400">Harare, Zimbabwe</p>
    </aside>
  );
}
