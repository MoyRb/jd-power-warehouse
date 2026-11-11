import Link from 'next/link';
import { Mail, Clock, MapPin } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/site-config';

export default function SubHeader() {
  return (
    <div className="bg-[#0a0a0a] border-b border-[#2e2e2e] py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between text-sm text-[#8c8c8c]">
          {/* Left: contact info */}
          <div className="flex items-center gap-4 flex-wrap">
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              className="flex items-center gap-1.5 hover:text-[#f6f4ee] transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#f3c41b]" />
              <span className="hidden sm:inline">{SITE_CONFIG.email}</span>
              <span className="sm:hidden">Email Us</span>
            </a>
            <span className="hidden sm:flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#f3c41b]" />
              <span>Hours: {SITE_CONFIG.hours.display}</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#f3c41b]" />
              <span>{SITE_CONFIG.location.city}, {SITE_CONFIG.location.stateCode}</span>
            </span>
          </div>

          {/* Right: request quote CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/quote"
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1a1a1a] hover:bg-[#292929] text-[#f6f4ee] transition-colors text-xs font-medium"
            >
              Request a Quote
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
