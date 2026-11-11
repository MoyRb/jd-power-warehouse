import type { Metadata } from 'next';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Refund Policy — JD Power Warehouse',
  description: 'Review the JD Power Warehouse refund and return policy for discounted overstock and liquidation products.',
};

export default function RefundPolicyPage() {
  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-black text-[#f3c41b] mb-2">Refund Policy</h1>
        <p className="text-[#8c8c8c] text-sm mb-10">Last updated: January 1, 2026</p>

        <div className="space-y-8 text-[#8c8c8c] text-sm leading-relaxed">
          <section>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-3">General Policy</h2>
            <p>Due to the nature of our liquidation and overstock merchandise, all sales are generally considered final. We encourage customers to inspect all items thoroughly before purchasing.</p>
          </section>

          <section>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-3">Exceptions</h2>
            <p>We may accept returns or exchanges within 7 days of purchase if:</p>
            <ul className="mt-2 space-y-1 ml-4 list-disc">
              <li>The item was misrepresented at the time of sale.</li>
              <li>The item has a significant defect not disclosed at purchase.</li>
              <li>The item is returned unused and in original condition with receipt.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-3">Process</h2>
            <p>To initiate a return, email us at <a href="mailto:contact@jd-power-warehouse.com" className="text-[#f3c41b] hover:underline">contact@jd-power-warehouse.com</a> with your purchase details and reason for return. We will review each case individually.</p>
          </section>

          <section>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-3">Contact</h2>
            <p>Questions? Email us at <a href="mailto:contact@jd-power-warehouse.com" className="text-[#f3c41b] hover:underline">contact@jd-power-warehouse.com</a>.</p>
          </section>
        </div>
      </div>
      <Footer compact />
    </>
  );
}
