'use client';

import { useState, useRef, useTransition } from 'react';
import { Upload, DollarSign, CheckCircle } from 'lucide-react';
import { submitInquiryAction } from '@/app/actions/inquiries';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  itemName: string;
  description: string;
  condition: 'new' | 'used';
  askingPrice: string;
}

const INITIAL: FormData = {
  fullName: '',
  email: '',
  phone: '',
  itemName: '',
  description: '',
  condition: 'new',
  askingPrice: '',
};

export default function SellForm() {
  const [form, setForm]         = useState<FormData>(INITIAL);
  const [files, setFiles]       = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInputRef            = useRef<HTMLInputElement>(null);

  function handleChange(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFiles(incoming: FileList | null) {
    if (!incoming) return;
    const accepted = Array.from(incoming).filter((f) =>
      ['image/png', 'image/jpeg', 'image/webp'].includes(f.type),
    );
    setFiles((prev) => [...prev, ...accepted].slice(0, 5));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Note: file attachments (images) are captured in component state only.
    // Supabase Storage integration for sell request images is PENDING — see ADMIN_BACKLOG.md.
    const askingPriceNum = parseFloat(form.askingPrice);
    startTransition(async () => {
      await submitInquiryAction({
        type: 'sell_request',
        name: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        message: form.description || 'No description provided',
        item_name: form.itemName,
        item_condition: form.condition,
        asking_price: isNaN(askingPriceNum) ? undefined : askingPriceNum,
      });
      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#f3c41b]/10 border-2 border-[#f3c41b] flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-[#f3c41b]" />
        </div>
        <h2 className="text-2xl font-black text-[#f6f4ee] mb-2">Request Received!</h2>
        <p className="text-[#8c8c8c] max-w-md">
          We&apos;ll review your submission and get back to you via WhatsApp or email within 24 hours with a fair offer.
        </p>
        <button
          type="button"
          onClick={() => { setSubmitted(false); setForm(INITIAL); setFiles([]); }}
          className="mt-6 text-[#f3c41b] text-sm hover:underline"
        >
          Submit another item
        </button>
      </div>
    );
  }

  const inputClass =
    'w-full px-4 py-3 bg-[#1a1a1a] border border-[#2e2e2e] text-[#f6f4ee] rounded-xl text-sm placeholder-[#8c8c8c] focus:outline-none focus:border-[#f3c41b] transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 2-col row */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-[#f6f4ee] mb-1.5">Full Name</label>
          <input
            type="text"
            required
            placeholder="John Doe"
            value={form.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#f6f4ee] mb-1.5">Email Address</label>
          <input
            type="email"
            required
            placeholder="john@example.com"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-[#f6f4ee] mb-1.5">Phone Number</label>
          <input
            type="tel"
            placeholder="(815) 555-0123"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#f6f4ee] mb-1.5">Item Name</label>
          <input
            type="text"
            required
            placeholder="e.g. DeWalt Miter Saw"
            value={form.itemName}
            onChange={(e) => handleChange('itemName', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-[#f6f4ee] mb-1.5">Item Description</label>
        <textarea
          rows={4}
          placeholder="Describe the condition, age, and any issues..."
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Condition + Price */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-[#f6f4ee] mb-1.5">Condition</label>
          <div className="flex gap-4 mt-1">
            {(['new', 'used'] as const).map((c) => (
              <label key={c} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  value={c}
                  checked={form.condition === c}
                  onChange={() => handleChange('condition', c)}
                  className="accent-[#f3c41b] w-4 h-4"
                />
                <span className="text-[#f6f4ee] text-sm capitalize">{c}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#f6f4ee] mb-1.5">Asking Price</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8c8c]" />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.askingPrice}
              onChange={(e) => handleChange('askingPrice', e.target.value)}
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>
      </div>

      {/* File upload */}
      <div>
        <label className="block text-sm font-medium text-[#f6f4ee] mb-1.5">Upload Images</label>
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-[#f3c41b] bg-[#f3c41b]/5'
              : 'border-[#2e2e2e] hover:border-[#f3c41b]/40 bg-[#1a1a1a]'
          }`}
        >
          <Upload className="w-8 h-8 text-[#8c8c8c] mx-auto mb-2" />
          <p className="text-[#f6f4ee] text-sm font-medium">Click to upload or drag and drop</p>
          <p className="text-[#8c8c8c] text-xs mt-1">PNG, JPG up to 10MB (max 5 images)</p>
          {files.length > 0 && (
            <p className="text-[#f3c41b] text-xs mt-2 font-medium">{files.length} file(s) selected</p>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-[#f3c41b] text-[#0f0f0f] font-black text-sm py-4 rounded-xl hover:bg-[#e8b818] transition-colors tracking-wide disabled:opacity-50"
      >
        {pending ? 'Submitting…' : 'Submit for Review'}
      </button>
    </form>
  );
}
