import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/site-config';

/**
 * Floating contact button.
 * Uses email until a real WhatsApp number is confirmed.
 * To enable WhatsApp: set SITE_CONFIG.whatsapp and change href to
 *   `https://wa.me/${SITE_CONFIG.whatsapp}`
 */
export default function FloatingWhatsApp() {
  return (
    <Link
      href={`mailto:${SITE_CONFIG.email}`}
      aria-label="Contact us"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#f3c41b] text-[#0f0f0f] flex items-center justify-center shadow-lg hover:bg-[#e8b818] hover:scale-110 transition-all duration-200"
    >
      <MessageCircle className="w-7 h-7" />
    </Link>
  );
}
