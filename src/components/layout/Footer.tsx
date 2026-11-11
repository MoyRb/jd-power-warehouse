import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Clock } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/site-config';

const quickLinks = [
  { label: 'Home',            href: '/'            },
  { label: 'Shop Inventory',  href: '/shop'         },
  { label: 'Sell Your Items', href: '/sell'         },
  { label: 'Testimonials',    href: '/testimonials' },
  { label: 'About Us',        href: '/about'        },
];

const legalLinks = [
  { label: 'Privacy Policy',      href: '/privacy-policy'       },
  { label: 'Terms & Conditions',  href: '/terms-and-conditions' },
  { label: 'Refund Policy',       href: '/refund-policy'        },
  { label: 'Shipping Policy',     href: '/shipping-policy'      },
];

function LegalBar() {
  return (
    <div className="border-t border-[#2e2e2e] py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8c8c8c]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 justify-center sm:justify-start">
          {legalLinks.map((l, i) => (
            <span key={l.href} className="flex items-center gap-4">
              <Link href={l.href} className="hover:text-[#f6f4ee] transition-colors">
                {l.label}
              </Link>
              {i < legalLinks.length - 1 && <span className="text-[#2e2e2e]">•</span>}
            </span>
          ))}
        </div>
        <p>© 2026 JD Power Warehouse. All rights reserved.</p>
      </div>
    </div>
  );
}

interface FooterProps {
  compact?: boolean;
}

export default function Footer({ compact = false }: FooterProps) {
  if (compact) {
    return (
      <footer className="bg-[#0a0a0a] mt-auto">
        <LegalBar />
      </footer>
    );
  }

  return (
    <footer className="bg-[#0a0a0a] border-t border-[#2e2e2e] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-[#f3c41b] bg-[#1a0f00] shrink-0">
                <Image
                  src="/images/logo/151663a7-560a-4334-a81d-264aee653769_jpg.jpg"
                  alt="JD Power Warehouse"
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              </div>
              <span className="text-[#f3c41b] font-black text-sm tracking-wide uppercase">JD Power Warehouse</span>
            </div>
            <p className="text-[#8c8c8c] text-sm leading-relaxed">
              Premium home improvement products at liquidation prices. Quality tools, outdoor furniture, and seasonal deals.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-[#f6f4ee] font-semibold text-sm mb-4 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2.5">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[#8c8c8c] text-sm hover:text-[#f6f4ee] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Store info */}
          <div>
            <h3 className="text-[#f6f4ee] font-semibold text-sm mb-4 uppercase tracking-wider">Store Info</h3>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-[#8c8c8c] text-sm">
                <Mail className="w-4 h-4 text-[#f3c41b] shrink-0" />
                <a href={`mailto:${SITE_CONFIG.email}`} className="hover:text-[#f6f4ee] transition-colors">{SITE_CONFIG.email}</a>
              </li>
              <li className="flex items-start gap-2 text-[#8c8c8c] text-sm">
                <MapPin className="w-4 h-4 text-[#f3c41b] shrink-0 mt-0.5" />
                <span>{SITE_CONFIG.location.display}</span>
              </li>
              <li className="flex items-center gap-2 text-[#8c8c8c] text-sm">
                <Clock className="w-4 h-4 text-[#f3c41b] shrink-0" />
                <span>{SITE_CONFIG.hours.display}</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[#f6f4ee] font-semibold text-sm mb-4 uppercase tracking-wider">Contact Us</h3>
            <p className="text-[#8c8c8c] text-sm mb-3">Questions about inventory or pricing? Reach out.</p>
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              className="inline-flex items-center gap-2 text-sm text-[#f3c41b] hover:text-[#f3c41b]/80 transition-colors font-medium"
            >
              <Mail className="w-4 h-4" />
              {SITE_CONFIG.email}
            </a>
          </div>
        </div>
      </div>
      <LegalBar />
    </footer>
  );
}
