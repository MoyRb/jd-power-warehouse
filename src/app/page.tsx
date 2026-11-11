import Link from 'next/link';
import Image from 'next/image';
import { Wrench, Leaf, Armchair, Flame, Tag, Home, CheckCircle, MapPin, RefreshCw, DollarSign, ShoppingCart } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import QuickInquiryForm from '@/components/ui/QuickInquiryForm';
import { categories } from '@/data/categories';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench, Leaf, Armchair, Flame, Tag, Home,
};

const whyItems = [
  { icon: DollarSign, title: 'Unbeatable Prices',    desc: 'We source overstock and returns directly from major retailers and pass the savings on to you — up to 70% off retail.' },
  { icon: CheckCircle, title: 'Quality Tested',      desc: "Every item is inspected before hitting our floor. If it's on our shelves, it's worth buying." },
  { icon: ShoppingCart, title: 'Community First', desc: 'We bridge the gap between major retailers and the community with affordable home improvement products.' },
  { icon: MapPin, title: 'Local Pickup',             desc: "Located in Plainfield, IL, we're open daily 6am–10pm. Reserve via WhatsApp and pick up same day." },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden">
        {/* Background photo */}
        <Image
          src="/images/catalog/76d4c105-6c45-4b32-a80e-033882c38d7f_png.png"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[#0a0a0a]/80" />
        {/* Subtle gold tint overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            background: 'radial-gradient(ellipse at 70% 50%, rgba(243,196,27,1) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <span className="inline-block text-[#f3c41b] text-sm font-semibold tracking-widest uppercase mb-4 bg-[#f3c41b]/10 px-3 py-1 rounded-full border border-[#f3c41b]/20">
                Plainfield &amp; Homer Glen, IL
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] mb-6">
                Quality Home<br />
                <span className="text-[#f3c41b]">Improvement</span><br />
                for Less
              </h1>
              <p className="text-[#8c8c8c] text-base lg:text-lg leading-relaxed mb-8 max-w-lg">
                Discounted tools, hardware, landscaping, and outdoor furniture from Plainfield, IL. Up to 70% off retail every day.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-[#f3c41b] text-[#0f0f0f] font-black text-base px-8 py-4 rounded-xl hover:bg-[#e8b818] transition-colors shadow-lg shadow-[#f3c41b]/20"
              >
                View Inventory
              </Link>
            </div>

            {/* Quick inquiry */}
            <div className="flex justify-center lg:justify-end">
              <QuickInquiryForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── Explore Categories ────────────────────────────────────────── */}
      <section className="py-16 lg:py-20 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-[#f6f4ee] mb-10">
            Explore Categories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => {
              const Icon = iconMap[cat.iconName];
              return (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-[#141414] border border-[#2e2e2e] hover:border-[#f3c41b]/40 hover:bg-[#1a1200] transition-all duration-200 text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#f3c41b]/10 border border-[#f3c41b]/20 flex items-center justify-center group-hover:bg-[#f3c41b]/20 transition-colors">
                    {Icon && <Icon className="w-6 h-6 text-[#f3c41b]" />}
                  </div>
                  <span className="text-xs font-medium text-[#f6f4ee]/80 leading-tight group-hover:text-[#f6f4ee] transition-colors">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Why Shop With Us ──────────────────────────────────────────── */}
      <section className="py-16 lg:py-24 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Section image */}
            <div className="relative rounded-xl overflow-hidden min-h-[320px] lg:min-h-[420px] border border-[#2e2e2e]">
              <Image
                src="/images/catalog/e0ad9a1c-51d5-4f2e-928c-2cb7ac8aad0c_png.png"
                alt="Power tools, drill sets, and toolboxes"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-[#0a0a0a]/40" />
              <div className="absolute inset-0 flex items-end p-6">
                <div className="bg-[#141414]/90 backdrop-blur rounded-lg px-4 py-3 border border-[#f3c41b]/20">
                  <p className="text-[#f3c41b] font-bold text-sm">New Inventory Added Weekly</p>
                  <p className="text-[#8c8c8c] text-xs mt-0.5">Plainfield &amp; Homer Glen, IL</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <span className="text-[#f3c41b] text-xs font-semibold tracking-widest uppercase mb-3 block">Why Shop With Us?</span>
              <h2 className="text-2xl lg:text-3xl font-black text-[#f6f4ee] mb-8 leading-tight">
                The Smarter Way to Shop<br />
                <span className="text-[#f3c41b]">Home Improvement</span>
              </h2>
              <div className="space-y-6">
                {whyItems.map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-[#f3c41b]/10 border border-[#f3c41b]/20 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-[#f3c41b]" />
                    </div>
                    <div>
                      <h3 className="text-[#f6f4ee] font-semibold text-sm mb-1">{item.title}</h3>
                      <p className="text-[#8c8c8c] text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Have Overstock? ───────────────────────────────────────────── */}
      <section className="py-16 lg:py-20 bg-[#0f0f0f] border-y border-[#2e2e2e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block text-[#f3c41b] text-xs font-semibold tracking-widest uppercase mb-3 bg-[#f3c41b]/10 px-3 py-1 rounded-full border border-[#f3c41b]/20">
                We Buy Your Items
              </span>
              <h2 className="text-2xl lg:text-3xl font-black text-[#f6f4ee] mb-4">
                Have overstock or items to liquidate?
              </h2>
              <p className="text-[#8c8c8c] leading-relaxed mb-6">
                Turn your unused home improvement products, tools, and outdoor furniture into cash. We are building to expand our inventory with quality items from the community.
              </p>
              <ul className="space-y-2.5 mb-8">
                {[
                  'Quick and easy review process',
                  'We pay fairly for quality goods',
                  'We handle the details',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-[#8c8c8c] text-sm">
                    <CheckCircle className="w-4 h-4 text-[#f3c41b] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/sell"
                className="inline-flex items-center gap-2 bg-[#f3c41b] text-[#0f0f0f] font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#e8b818] transition-colors"
              >
                Start Selling
              </Link>
            </div>

            {/* Section image */}
            <div className="relative rounded-xl overflow-hidden min-h-[280px] border border-[#2e2e2e]">
              <Image
                src="/images/catalog/6c0ea11f-edcd-46c9-8ff7-3e30801acd45_png.png"
                alt="Outdoor grills and patio sets"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-[#0a0a0a]/50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="w-12 h-12 text-[#f3c41b]/70 mx-auto mb-3" />
                  <p className="text-[#f3c41b] font-semibold text-sm">Sell • Get Offer • Get Paid</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ready to Start CTA ────────────────────────────────────────── */}
      <section className="bg-[#f3c41b] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-4xl font-black text-[#0f0f0f] mb-2 tracking-tight uppercase">
            Ready to Start Your Next Project?
          </h2>
          <p className="text-[#0f0f0f]/70 text-sm lg:text-base mb-8 max-w-xl mx-auto">
            Visit our warehouse today or message us on WhatsApp to check availability and reserve items.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/shop"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0f0f0f] text-[#f3c41b] font-bold text-sm px-7 py-3.5 rounded-xl hover:bg-[#1a1200] transition-colors"
            >
              Browse Inventory
            </Link>
            <a
              href="mailto:contact@jd-power-warehouse.com"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0f0f0f] text-[#f6f4ee] font-bold text-sm px-7 py-3.5 rounded-xl hover:bg-[#1a1200] transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
