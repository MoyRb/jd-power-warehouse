import Link from 'next/link';
import Image from 'next/image';
import { Phone, MessageCircle, MapPin, Clock } from 'lucide-react';

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
                <Phone className="w-4 h-4 text-[#f3c41b] shrink-0" />
                <a href="tel:+18155550123" className="hover:text-[#f6f4ee] transition-colors">(815) 555-0123</a>
              </li>
              <li className="flex items-center gap-2 text-[#8c8c8c] text-sm">
                <MessageCircle className="w-4 h-4 text-[#f3c41b] shrink-0" />
                <a href="https://wa.me/18155550123" target="_blank" rel="noopener noreferrer" className="hover:text-[#f6f4ee] transition-colors">WhatsApp Support</a>
              </li>
              <li className="flex items-start gap-2 text-[#8c8c8c] text-sm">
                <MapPin className="w-4 h-4 text-[#f3c41b] shrink-0 mt-0.5" />
                <span>Plainfield &amp; Homer Glen, IL</span>
              </li>
              <li className="flex items-center gap-2 text-[#8c8c8c] text-sm">
                <Clock className="w-4 h-4 text-[#f3c41b] shrink-0" />
                <span>Daily 6am–10pm</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-[#f6f4ee] font-semibold text-sm mb-4 uppercase tracking-wider">Follow Us</h3>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-lg bg-[#1e1e1e] border border-[#2e2e2e] flex items-center justify-center text-[#8c8c8c] hover:text-[#f3c41b] hover:border-[#f3c41b]/40 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-lg bg-[#1e1e1e] border border-[#2e2e2e] flex items-center justify-center text-[#8c8c8c] hover:text-[#f3c41b] hover:border-[#f3c41b]/40 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
      <LegalBar />
    </footer>
  );
}
