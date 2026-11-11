import type { Metadata } from 'next';
import { Mail, MapPin, Clock } from 'lucide-react';
import ContactForm from '@/components/contact/ContactForm';
import BusinessLocationMap from '@/components/contact/BusinessLocationMap';
import Footer from '@/components/layout/Footer';
import { SITE_CONFIG } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Contact Us',
  alternates: { canonical: '/contact' },
  openGraph: { title: 'Contact JD Power Warehouse', url: '/contact' },
  description:
    `Contact JD Power Warehouse in ${SITE_CONFIG.location.display}. Send us an email or submit an inquiry. Open ${SITE_CONFIG.hours.display} for all your home improvement needs.`,
};

const infoCards = [
  {
    icon: Mail,
    title: 'Email Us',
    lines: [SITE_CONFIG.email],
    href: `mailto:${SITE_CONFIG.email}`,
  },
  {
    icon: MapPin,
    title: 'Location',
    lines: [SITE_CONFIG.location.display],
    href: `https://www.google.com/maps/search/?api=1&query=${SITE_CONFIG.location.mapsQuery}`,
  },
  {
    icon: Clock,
    title: 'Hours',
    lines: [SITE_CONFIG.hours.display],
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <a key={card.title} href={card.href} target={card.href.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer" className="block">
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

            {/* Map */}
            <div>
              <h2 className="text-xl font-bold text-[#f6f4ee] mb-2">Find Us</h2>
              <p className="text-[#8c8c8c] text-sm mb-4">{SITE_CONFIG.location.display} · {SITE_CONFIG.hours.display}</p>
              <BusinessLocationMap />
            </div>
          </div>
        </div>
      </section>

      <Footer compact />
    </>
  );
}
