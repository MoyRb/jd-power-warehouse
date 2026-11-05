'use client';

import { useRef, useState, useTransition } from 'react';
import { submitInquiryAction } from '@/app/actions/inquiries';

export default function QuickInquiryForm() {
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = nameRef.current?.value ?? '';
    const phone = phoneRef.current?.value || undefined;
    const message = messageRef.current?.value ?? '';
    startTransition(async () => {
      await submitInquiryAction({ type: 'quick_inquiry', name, phone, message });
      setSubmitted(true);
    });
  }

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
        onSubmit={handleSubmit}
      >
        <input
          ref={nameRef}
          type="text"
          placeholder="Your name"
          required
          className="w-full px-4 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] text-[#f6f4ee] placeholder-[#8c8c8c] text-sm focus:outline-none focus:border-[#f3c41b]"
        />
        <input
          ref={phoneRef}
          type="tel"
          placeholder="Phone number"
          className="w-full px-4 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] text-[#f6f4ee] placeholder-[#8c8c8c] text-sm focus:outline-none focus:border-[#f3c41b]"
        />
        <textarea
          ref={messageRef}
          rows={3}
          placeholder="What are you looking for?"
          required
          className="w-full px-4 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] text-[#f6f4ee] placeholder-[#8c8c8c] text-sm focus:outline-none focus:border-[#f3c41b] resize-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-[#f3c41b] text-[#0f0f0f] font-bold text-sm py-3 rounded-xl hover:bg-[#e8b818] transition-colors disabled:opacity-50"
        >
          {pending ? 'Sending…' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
