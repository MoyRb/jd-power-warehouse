import type { Metadata } from 'next';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Terms & Conditions — JD Power Warehouse',
  description: 'Read the terms and conditions for using the JD Power Warehouse website and purchasing our products.',
};

export default function TermsPage() {
  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-black text-[#f3c41b] mb-2">Terms &amp; Conditions</h1>
        <p className="text-[#8c8c8c] text-sm mb-10">Last updated: January 1, 2026</p>

        <div className="space-y-8 text-[#8c8c8c] text-sm leading-relaxed">
          <section>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-3">1. Acceptance of Terms</h2>
            <p>By accessing our website or visiting our store, you agree to be bound by these Terms &amp; Conditions. If you do not agree, please do not use our services.</p>
          </section>

          <section>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-3">2. Product Descriptions</h2>
            <p>JD Power Warehouse sells overstock, liquidation, and returned merchandise. Products may show minor cosmetic imperfections. All descriptions are provided in good faith; inspect all items before purchase when possible.</p>
          </section>

          <section>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-3">3. Pricing</h2>
            <p>All prices are in USD and are subject to change without notice. Prices displayed on our website represent in-store pricing at the time of listing and may differ from current in-store pricing.</p>
          </section>

          <section>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-3">4. Limitation of Liability</h2>
            <p>JD Power Warehouse is not liable for any indirect, incidental, or consequential damages arising from the use of our products or services beyond the purchase price of the item.</p>
          </section>

          <section>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-3">5. Contact</h2>
            <p>For questions about these terms, contact us at (815) 555-0123 or via WhatsApp.</p>
          </section>
        </div>
      </div>
      <Footer compact />
    </>
  );
}
