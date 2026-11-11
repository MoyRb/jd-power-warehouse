import type { Metadata } from 'next';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy — JD Power Warehouse',
  description: 'Read the JD Power Warehouse privacy policy to understand how we handle and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-black text-[#f3c41b] mb-2">Privacy Policy</h1>
        <p className="text-[#8c8c8c] text-sm mb-10">Last updated: January 1, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-[#8c8c8c] text-sm leading-relaxed">
          <section>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you submit an inquiry form, contact us via WhatsApp, or visit our store. This may include your name, phone number, email address, and information about items you wish to sell or purchase.</p>
          </section>

          <section>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to respond to your inquiries, process transactions, and improve our services. We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties without your consent.</p>
          </section>

          <section>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-3">3. Data Security</h2>
            <p>We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-3">4. Contact Us</h2>
            <p>If you have questions about this privacy policy, please contact us at <a href="mailto:contact@jd-power-warehouse.com" className="text-[#f3c41b] hover:underline">contact@jd-power-warehouse.com</a>.</p>
          </section>
        </div>
      </div>
      <Footer compact />
    </>
  );
}
