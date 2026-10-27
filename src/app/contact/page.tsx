import type { Metadata } from 'next';
import { MessageCircle, Phone, MapPin, Clock } from 'lucide-react';
import ContactForm from '@/components/contact/ContactForm';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Contact Us — JD Power Warehouse | Plainfield, IL',
  description:
    'Contact JD Power Warehouse in Plainfield, IL. Call us, message us on WhatsApp, or send us an inquiry. Open daily 6am–10pm for all your home improvement needs.',
};

const infoCards = [
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    lines: ['+1 (815) 555-0123'],
    href: 'https://wa.me/18155550123',
  },
  {
    icon: Phone,
    title: 'Call Us',
    lines: ['+1 (815) 555-0123'],
    href: 'tel:+18155550123',
  },
  {
    icon: MapPin,
    title: 'Location',
    lines: ['Plainfield & Homer Glen, IL'],
    href: null,
  },
  {
    icon: Clock,
    title: 'Hours',
    lines: ['Daily 6am–10pm'],
    href: null,
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-20 text-center border-b border-[#2e2e2e] bg-[#0f0f0f]">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl lg:text-5xl font-black text-[#f6f4ee] mb-4">Get In Touch</h1>
          <p className="text-[#8c8c8c] text-base">
            Have questions about our inventory or want to check availability? Reach out — we&apos;re here to help.
          </p>
        </div>
      </section>

      {/* Info cards */}
      <section className="py-12 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {infoCards.map((card) => {
              const content = (
                <div className="flex flex-col items-center text-center p-5 bg-[#141414] border border-[#2e2e2e] rounded-xl h-full hover:border-[#f3c41b]/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-[#f3c41b]/10 border border-[#f3c41b]/20 flex items-center justify-center mb-3">
                    <card.icon className="w-5 h-5 text-[#f3c41b]" />
                  </div>
                  <h3 className="text-[#f6f4ee] font-bold text-sm mb-1">{card.title}</h3>
                  {card.lines.map((line) => (
                    <p key={line} className="text-[#8c8c8c] text-xs">{line}</p>
                  ))}
                </div>
              );

              return card.href ? (
                <a key={card.title} href={card.href} target="_blank" rel="noopener noreferrer" className="block">
                  {content}
                </a>
              ) : (
                <div key={card.title}>{content}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Form + map */}
      <section className="py-12 lg:py-16 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            {/* Form */}
            <div>
              <h2 className="text-xl font-bold text-[#f6f4ee] mb-2">Send Us a Message</h2>
              <p className="text-[#8c8c8c] text-sm mb-6">Fill out the form below and we&apos;ll get back to you as soon as possible.</p>
              <ContactForm />
            </div>

            {/* Map placeholder */}
            <div>
              <div
                className="w-full rounded-xl overflow-hidden border border-[#2e2e2e] min-h-[320px] flex flex-col items-center justify-center gap-3"
                style={{ background: 'linear-gradient(135deg, #141414, #0a0a0a)' }}
              >
                <MapPin className="w-10 h-10 text-[#f3c41b]/40" />
                <div className="text-center">
                  <p className="text-[#f6f4ee] font-semibold text-sm">Plainfield &amp; Homer Glen, IL</p>
                  <p className="text-[#8c8c8c] text-xs mt-1">Open Daily 6am–10pm</p>
                </div>
              </div>

              {/* Connect */}
              <div className="mt-6 p-5 bg-[#141414] border border-[#2e2e2e] rounded-xl">
                <h3 className="text-[#f6f4ee] font-semibold text-sm mb-3">Connect With Us</h3>
                <p className="text-[#8c8c8c] text-xs mb-4">
                  Follow us on social media for the latest deals and new inventory alerts.
                </p>
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
                  <a
                    href="https://wa.me/18155550123"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="w-9 h-9 rounded-lg bg-[#1e1e1e] border border-[#2e2e2e] flex items-center justify-center text-[#8c8c8c] hover:text-green-400 hover:border-green-400/40 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer compact />
    </>
  );
}
