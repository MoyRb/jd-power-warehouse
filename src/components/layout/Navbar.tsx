'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Home',          href: '/'            },
  { label: 'Catalogue',     href: '/shop'         },
  { label: 'Sell Your Items', href: '/sell'       },
  { label: 'Testimonials',  href: '/testimonials' },
  { label: 'About Us',      href: '/about'        },
  { label: 'Contact',       href: '/contact'      },
];

function JDLogo() {
  return (
    <Link href="/" className="flex items-center gap-3 shrink-0" aria-label="JD Power Warehouse home">
      {/* Logo mark */}
      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#f3c41b] bg-[#1a0f00] shrink-0">
        <Image
          src="/images/logo/151663a7-560a-4334-a81d-264aee653769_jpg.jpg"
          alt="JD Power Warehouse"
          fill
          className="object-cover"
          sizes="48px"
        />
      </div>
      {/* Wordmark */}
      <div className="hidden sm:flex flex-col leading-tight">
        <span className="text-[#f3c41b] font-black text-base tracking-wide uppercase">JD Power</span>
        <span className="text-[#f6f4ee]/60 font-semibold text-[10px] tracking-[0.2em] uppercase">Warehouse</span>
      </div>
    </Link>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#2e2e2e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          <JDLogo />

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-[#f3c41b]',
                  pathname === link.href
                    ? 'text-[#f3c41b]'
                    : 'text-[#f6f4ee]/80',
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/shop"
              className="hidden sm:inline-flex items-center gap-2 bg-[#f3c41b] text-[#0f0f0f] font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-[#e8b818] transition-colors"
            >
              View Inventory
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 rounded-xl text-[#f6f4ee]/70 hover:text-[#f6f4ee] hover:bg-[#1e1e1e] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#2e2e2e] bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'bg-[#f3c41b]/10 text-[#f3c41b]'
                    : 'text-[#f6f4ee]/80 hover:bg-[#1e1e1e] hover:text-[#f6f4ee]',
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/shop"
              onClick={() => setMobileOpen(false)}
              className="mt-2 flex items-center justify-center bg-[#f3c41b] text-[#0f0f0f] font-bold text-sm px-4 py-3 rounded-xl hover:bg-[#e8b818] transition-colors"
            >
              View Inventory
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
