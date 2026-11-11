import type { Metadata } from 'next';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Shipping & Pickup Policy — JD Power Warehouse',
  description: 'Learn about local pickup options and delivery availability for JD Power Warehouse products in Plainfield, IL.',
};

export default function ShippingPolicyPage() {
  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-black text-[#f3c41b] mb-2">Shipping &amp; Pickup Policy</h1>
        <p className="text-[#8c8c8c] text-sm mb-10">Last updated: January 1, 2026</p>

        <div className="space-y-8 text-[#8c8c8c] text-sm leading-relaxed">
          <section>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-3">Local Pickup</h2>
            <p>JD Power Warehouse primarily operates as a local pickup store. Customers are welcome to visit us daily from 6am to 10pm at our location in Plainfield &amp; Homer Glen, IL.</p>
          </section>

          <section>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-3">Item Reservation</h2>
            <p>You can reserve items by contacting us via email or WhatsApp. We will hold reserved items for up to 24 hours pending confirmation.</p>
          </section>

          <section>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-3">Delivery</h2>
            <p>Limited local delivery may be available for large items at an additional fee. Please contact us to discuss delivery options for your specific item and location.</p>
          </section>

          <section>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-3">Store Hours</h2>
            <p>We are open daily from 6:00 AM to 10:00 PM, 7 days a week. New inventory is added weekly, so we recommend checking our catalogue regularly.</p>
          </section>

          <section>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-3">Contact</h2>
            <p>For shipping or pickup questions, email us at <a href="mailto:contact@jd-power-warehouse.com" className="text-[#f3c41b] hover:underline">contact@jd-power-warehouse.com</a>.</p>
          </section>
        </div>
      </div>
      <Footer compact />
    </>
  );
}
