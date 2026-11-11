import type { Metadata } from 'next';
import { Star } from 'lucide-react';
import { testimonials } from '@/data/testimonials';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Customer Testimonials',
  description:
    'Read what our customers have to say about the quality, prices, and service at JD Power Warehouse in Plainfield, IL.',
  alternates: { canonical: '/testimonials' },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? 'fill-[#f3c41b] text-[#f3c41b]' : 'text-[#2e2e2e] fill-[#2e2e2e]'}`}
        />
      ))}
    </div>
  );
}

export default function TestimonialsPage() {
  return (
    <>
      {/* Gold hero */}
      <section className="bg-[#f3c41b] py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl lg:text-5xl font-black text-[#0f0f0f] mb-4">Testimonials</h1>
          <p className="text-[#0f0f0f]/70 text-base">
            Hear from our local customers in Plainfield and the surrounding areas about their experience shopping with us.
          </p>
        </div>
      </section>

      {/* Reviews grid */}
      <section className="py-16 lg:py-20 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="relative bg-[#141414] border border-[#2e2e2e] rounded-xl p-6 flex flex-col gap-4 hover:border-[#f3c41b]/20 transition-colors"
              >
                {/* Decorative quote mark */}
                <span
                  aria-hidden="true"
                  className="absolute top-4 right-5 text-7xl font-black text-[#2e2e2e] leading-none select-none"
                >
                  &ldquo;
                </span>

                <StarRating rating={t.rating} />

                <p className="text-[#f6f4ee]/80 text-sm leading-relaxed italic relative z-10">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div className="flex items-center gap-3 pt-2 border-t border-[#2e2e2e]">
                  <div className="w-9 h-9 rounded-full bg-[#f3c41b] text-[#0f0f0f] flex items-center justify-center font-black text-sm shrink-0">
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-[#f6f4ee] font-semibold text-sm">{t.name}</p>
                    <p className="text-[#8c8c8c] text-xs">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#0f0f0f] border-t border-[#2e2e2e] text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl lg:text-3xl font-black text-[#f3c41b] mb-3">
            Join our community of happy DIYers
          </h2>
          <p className="text-[#8c8c8c] text-sm mb-8">
            We&apos;ve helped hundreds of homeowners in Illinois save money on their renovation and landscaping projects.
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-center">
            {['LOCAL BUSINESS', 'COMMUNITY FIRST', 'QUALITY GUARANTEED'].map((label) => (
              <div key={label}>
                <p className="text-[#f6f4ee] font-black text-sm tracking-widest">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer compact />
    </>
  );
}
