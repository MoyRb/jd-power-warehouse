'use client';

import { useState, useTransition } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import { submitInquiryAction } from '@/app/actions/inquiries';

export default function ContactForm() {
  const [form, setForm]       = useState({ name: '', phone: '', email: '', message: '' });
  const [submitted, setSubmit] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await submitInquiryAction({
        type: 'contact',
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        message: form.message,
      });
      setSubmit(true);
    });
  }

  const inputClass =
    'w-full px-4 py-3 bg-[#1a1a1a] border border-[#2e2e2e] text-[#f6f4ee] rounded-xl text-sm placeholder-[#8c8c8c] focus:outline-none focus:border-[#f3c41b] transition-colors';

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <CheckCircle className="w-12 h-12 text-[#f3c41b] mb-4" />
        <h3 className="text-[#f6f4ee] font-bold text-lg mb-2">Message Sent!</h3>
        <p className="text-[#8c8c8c] text-sm">We&apos;ll get back to you within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#f6f4ee] mb-1.5">Name</label>
          <input
            type="text"
            required
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#f6f4ee] mb-1.5">Phone</label>
          <input
            type="tel"
            placeholder="(optional)"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[#f6f4ee] mb-1.5">Email</label>
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#f6f4ee] mb-1.5">How can we help you?</label>
        <textarea
          rows={5}
          required
          placeholder="Tell us about your question or what you're looking for..."
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
          className={`${inputClass} resize-none`}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#f3c41b] text-[#0f0f0f] font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-[#e8b818] transition-colors disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        {pending ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
}
