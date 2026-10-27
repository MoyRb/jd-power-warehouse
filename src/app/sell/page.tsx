import type { Metadata } from 'next';
import { Package, DollarSign, CheckCircle2 } from 'lucide-react';
import SellForm from '@/components/sell/SellForm';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Sell Your Overstock & Tools for Cash | JD Power Warehouse IL',
  description:
    'Got overstock, tools, or outdoor equipment? Sell your home improvement items directly to JD Power Warehouse in Plainfield, IL for quick cash.',
};

const steps = [
  {
    icon: Package,
    title: 'Submit Details',
    desc: 'Tell us about the item you want to sell.',
  },
  {
    icon: DollarSign,
    title: 'Get an Offer',
    desc: 'Our team will review and provide a fair quote.',
  },
  {
    icon: CheckCircle2,
    title: 'Get Paid',
    desc: 'Drop off your item and get paid instantly.',
  },
];

export default function SellPage() {
  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-black text-[#f3c41b] mb-4">
            Sell Your Items to Us
          </h1>
          <p className="text-[#8c8c8c] text-base max-w-lg mx-auto">
            Have overstock or items you want to liquidate? We buy quality home improvement goods.
          </p>
        </div>

        {/* 3-step process */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="relative flex flex-col items-center text-center p-4 bg-[#141414] border border-[#2e2e2e] rounded-xl"
            >
              {/* Step number */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#f3c41b] text-[#0f0f0f] text-xs font-black flex items-center justify-center">
                {i + 1}
              </div>
              <div className="mt-2 mb-3 w-10 h-10 rounded-xl bg-[#f3c41b]/10 border border-[#f3c41b]/20 flex items-center justify-center">
                <step.icon className="w-5 h-5 text-[#f3c41b]" />
              </div>
              <h3 className="text-[#f6f4ee] font-bold text-xs sm:text-sm mb-1">{step.title}</h3>
              <p className="text-[#8c8c8c] text-xs leading-relaxed hidden sm:block">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-[#f6f4ee] font-bold text-lg">Sell Your Items</h2>
            <p className="text-[#8c8c8c] text-sm mt-1">Please provide as much detail as possible for a fast review.</p>
          </div>
          <SellForm />
        </div>
      </div>
      <Footer compact />
    </>
  );
}
