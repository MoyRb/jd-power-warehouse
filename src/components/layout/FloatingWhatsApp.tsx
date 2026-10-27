import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

export default function FloatingWhatsApp() {
  return (
    <Link
      href="https://wa.me/18155550123"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#f3c41b] text-[#0f0f0f] flex items-center justify-center shadow-lg hover:bg-[#e8b818] hover:scale-110 transition-all duration-200"
    >
      <MessageCircle className="w-7 h-7" />
    </Link>
  );
}
