import type { Metadata } from 'next';
import { Heart, Shield, Users } from 'lucide-react';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'About Us | JD Power Warehouse',
  description:
    'Learn about JD Power Warehouse in Plainfield, IL. We bridge the gap between major retailers and the community with affordable home improvement products.',
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-[#0f0f0f] border-b border-[#2e2e2e] text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl lg:text-5xl font-black text-[#f3c41b] mb-4">Our Story</h1>
          <p className="text-[#8c8c8c] text-base">
            Bridging the gap between major retailers and the community.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 lg:py-20 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#f3c41b]/10 border border-[#f3c41b]/20 rounded-full px-3 py-1 mb-4">
                <Users className="w-3.5 h-3.5 text-[#f3c41b]" />
                <span className="text-[#f3c41b] text-xs font-semibold tracking-wider uppercase">Who We Are</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-black text-[#f3c41b] mb-4 leading-tight">Our Mission</h2>
              <p className="text-[#8c8c8c] leading-relaxed mb-6">
                We believe everyone deserves access to high-quality home improvement products without the retail markup. By sourcing overstock, liquidations, and returns, we pass incredible savings on to you.
              </p>

              <div className="inline-flex items-center gap-2 bg-[#f3c41b]/10 border border-[#f3c41b]/20 rounded-full px-3 py-1 mb-4">
                <Users className="w-3.5 h-3.5 text-[#f3c41b]" />
                <span className="text-[#f3c41b] text-xs font-semibold tracking-wider uppercase">Local Roots</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-black text-[#f3c41b] mb-4 leading-tight">Community First</h2>
              <p className="text-[#8c8c8c] leading-relaxed">
                Located in Plainfield, Illinois, we are proud to serve our local community and help our neighbors build their dream homes affordably.
              </p>
            </div>

            {/* Feature cards */}
            <div className="space-y-4">
              <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-6 hover:border-[#f3c41b]/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#f3c41b]/10 border border-[#f3c41b]/20 flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5 text-[#f3c41b]" />
                  </div>
                  <div>
                    <h3 className="text-[#f6f4ee] font-bold text-base mb-1">Family Owned</h3>
                    <p className="text-[#8c8c8c] text-sm leading-relaxed">
                      Operated locally with a commitment to our neighbors. Every purchase supports a family business in your community.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-6 hover:border-[#f3c41b]/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#f3c41b]/10 border border-[#f3c41b]/20 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-[#f3c41b]" />
                  </div>
                  <div>
                    <h3 className="text-[#f6f4ee] font-bold text-base mb-1">Quality Assured</h3>
                    <p className="text-[#8c8c8c] text-sm leading-relaxed">
                      Every item is inspected before it hits our floor. We only sell products that meet our quality standards.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / values */}
      <section className="py-12 bg-[#0f0f0f] border-t border-[#2e2e2e]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[
              { value: '70%', label: 'Off Retail Prices' },
              { value: '6am', label: 'Daily Opening Time' },
              { value: '100+', label: 'Products In-Stock' },
              { value: 'IL',  label: 'Plainfield & Homer Glen' },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-5">
                <p className="text-[#f3c41b] font-black text-3xl mb-1">{stat.value}</p>
                <p className="text-[#8c8c8c] text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
