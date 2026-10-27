'use client';

import { useState } from 'react';

export default function QuickInquiryForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="bg-[#141414]/90 backdrop-blur border border-[#2e2e2e] rounded-xl p-6 w-full max-w-sm text-center">
        <p className="text-[#f3c41b] font-bold mb-2">Request Received!</p>
        <p className="text-[#8c8c8c] text-sm">We&apos;ll reach out to you shortly.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#141414]/90 backdrop-blur border border-[#2e2e2e] rounded-xl p-6 w-full max-w-sm">
      <h2 className="text-[#f6f4ee] font-bold text-lg mb-4">Quick Inquiry</h2>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
      >
        <input
          type="text"
          placeholder="Your name"
          required
          className="w-full px-4 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] text-[#f6f4ee] placeholder-[#8c8c8c] text-sm focus:outline-none focus:border-[#f3c41b]"
        />
        <input
          type="tel"
          placeholder="Phone number"
          className="w-full px-4 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] text-[#f6f4ee] placeholder-[#8c8c8c] text-sm focus:outline-none focus:border-[#f3c41b]"
        />
        <textarea
          rows={3}
          placeholder="What are you looking for?"
          className="w-full px-4 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] text-[#f6f4ee] placeholder-[#8c8c8c] text-sm focus:outline-none focus:border-[#f3c41b] resize-none"
        />
        <button
          type="submit"
          className="w-full bg-[#f3c41b] text-[#0f0f0f] font-bold text-sm py-3 rounded-xl hover:bg-[#e8b818] transition-colors"
        >
          Submit Request
        </button>
      </form>
    </div>
  );
}
