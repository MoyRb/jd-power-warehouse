'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Package, PenLine, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { submitQuoteAction, type SubmitQuoteResult } from '@/app/quote/actions'
import type { Product } from '@/lib/db/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LineItem {
  key: string
  mode: 'catalog' | 'freeform'
  product_id: string | null
  product_name: string | null
  product_price: number | null
  quantity: number
  description: string
  customer_note: string
}

interface Props {
  products: Pick<Product, 'id' | 'name' | 'price' | 'sku' | 'category'>[]
  /** Product to pre-load (from /shop/[id] "Request Quote" link) */
  initialProductId?: string | null
}

const MAX_LINES = 20

// ---------------------------------------------------------------------------
// Step indicators
// ---------------------------------------------------------------------------
function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
      ${done ? 'bg-[#f3c41b] border-[#f3c41b] text-[#0a0a0a]' :
        active ? 'border-[#f3c41b] text-[#f3c41b] bg-transparent' :
                 'border-[#2e2e2e] text-[#8c8c8c] bg-transparent'}`}>
      {done ? '✓' : n}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function QuoteRequestForm({ products, initialProductId }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [lines, setLines] = useState<LineItem[]>(() => {
    if (initialProductId) {
      const p = products.find(x => x.id === initialProductId)
      if (p) {
        return [{
          key: crypto.randomUUID(),
          mode: 'catalog',
          product_id: p.id,
          product_name: p.name,
          product_price: p.price,
          quantity: 1,
          description: '',
          customer_note: '',
        }]
      }
    }
    return []
  })
  const [productSearch, setProductSearch] = useState('')
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({})
  const [contactSnapshot, setContactSnapshot] = useState({ anon_name: '', anon_email: '', anon_company: '', anon_phone: '' })
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  const [state, formAction, isPending] = useActionState<SubmitQuoteResult | null, FormData>(
    submitQuoteAction,
    null,
  )

  // Scroll to top on success
  useEffect(() => {
    if (state?.success) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [state?.success])

  const filteredProducts = productSearch.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.sku ?? '').toLowerCase().includes(productSearch.toLowerCase()),
      )
    : products.slice(0, 20)

  // ---------------------------------------------------------------------------
  // Line mutation helpers
  // ---------------------------------------------------------------------------
  function addCatalogLine(p: typeof products[0]) {
    if (lines.length >= MAX_LINES) return
    // Prevent duplicate catalog product
    if (lines.some(l => l.product_id === p.id)) return
    setLines(prev => [...prev, {
      key: crypto.randomUUID(),
      mode: 'catalog',
      product_id: p.id,
      product_name: p.name,
      product_price: p.price,
      quantity: 1,
      description: '',
      customer_note: '',
    }])
    setProductSearch('')
  }

  function addFreeformLine() {
    if (lines.length >= MAX_LINES) return
    setLines(prev => [...prev, {
      key: crypto.randomUUID(),
      mode: 'freeform',
      product_id: null,
      product_name: null,
      product_price: null,
      quantity: 1,
      description: '',
      customer_note: '',
    }])
  }

  function updateLine(key: string, patch: Partial<LineItem>) {
    setLines(prev => prev.map(l => l.key === key ? { ...l, ...patch } : l))
  }

  function removeLine(key: string) {
    setLines(prev => prev.filter(l => l.key !== key))
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  function validateStep1(): boolean {
    const errors: Record<string, string> = {}
    if (lines.length === 0) {
      errors['_lines'] = 'Add at least one item to your quote request.'
    }
    for (const line of lines) {
      if (line.mode === 'freeform' && !line.description.trim()) {
        errors[line.key] = 'Description is required for custom items.'
      }
      if (line.quantity < 1) {
        errors[`${line.key}_qty`] = 'Quantity must be at least 1.'
      }
    }
    setLineErrors(errors)
    return Object.keys(errors).length === 0
  }

  function validateStep2(formEl: HTMLFormElement): boolean {
    const name = (formEl.querySelector('[name="anon_name"]') as HTMLInputElement)?.value.trim()
    const email = (formEl.querySelector('[name="anon_email"]') as HTMLInputElement)?.value.trim()
    if (!name || !email) return false
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false
    return true
  }

  // ---------------------------------------------------------------------------
  // Serialise lines into FormData
  // ---------------------------------------------------------------------------
  function buildFormData(formEl: HTMLFormElement): FormData {
    const fd = new FormData(formEl)
    fd.set('lines', JSON.stringify(
      lines.map(l => ({
        product_id: l.product_id ?? undefined,
        quantity: l.quantity,
        description: l.description || undefined,
        customer_note: l.customer_note || undefined,
      })),
    ))
    return fd
  }

  // ---------------------------------------------------------------------------
  // Success state
  // ---------------------------------------------------------------------------
  if (state?.success) {
    return (
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-8 text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-[#f3c41b] mx-auto" />
        <h2 className="text-xl font-black text-[#f6f4ee]">Quote Request Submitted</h2>
        <p className="text-[#8c8c8c]">
          Your reference number is{' '}
          <span className="text-[#f3c41b] font-mono font-bold">{state.quoteRef}</span>
          . Our team will review your request and contact you.
        </p>
        <p className="text-[#8c8c8c] text-sm">
          Please save this reference number for your records.
        </p>
        <button
          type="button"
          onClick={() => router.push('/shop')}
          className="mt-4 px-6 py-2.5 bg-[#f3c41b] text-[#0a0a0a] rounded-lg font-bold text-sm hover:bg-[#f3c41b]/90 transition-colors"
        >
          Back to Shop
        </button>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------
  return (
    <form
      ref={formRef}
      className="space-y-6"
      noValidate
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { n: 1, label: 'Items' },
          { n: 2, label: 'Contact' },
          { n: 3, label: 'Review' },
        ].map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-2">
            {i > 0 && <div className={`flex-1 h-px w-8 ${step > i ? 'bg-[#f3c41b]' : 'bg-[#2e2e2e]'}`} />}
            <div className="flex flex-col items-center gap-1">
              <StepDot n={n} active={step === n} done={step > n} />
              <span className={`text-xs ${step === n ? 'text-[#f3c41b]' : 'text-[#8c8c8c]'}`}>{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── STEP 1: Items ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-1">Select Items</h2>
            <p className="text-[#8c8c8c] text-sm">
              Add products from our catalog or describe custom items. Up to {MAX_LINES} items per request.
            </p>
          </div>

          {/* Product search */}
          <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#f3c41b] shrink-0" />
              <span className="text-[#f6f4ee] text-sm font-semibold">Add from Catalog</span>
            </div>
            <input
              type="text"
              placeholder="Search products by name or SKU…"
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg px-3 py-2 text-[#f6f4ee] text-sm placeholder:text-[#8c8c8c] focus:outline-none focus:border-[#f3c41b]/50"
            />
            {(productSearch.trim() || products.length <= 20) && (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredProducts.length === 0 && (
                  <p className="text-[#8c8c8c] text-xs py-2 text-center">No products found.</p>
                )}
                {filteredProducts.map(p => {
                  const alreadyAdded = lines.some(l => l.product_id === p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={alreadyAdded || lines.length >= MAX_LINES}
                      onClick={() => addCatalogLine(p)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                        ${alreadyAdded
                          ? 'text-[#8c8c8c] bg-[#1a1a1a] cursor-not-allowed'
                          : 'text-[#f6f4ee] hover:bg-[#f3c41b]/10 hover:text-[#f3c41b] cursor-pointer'}`}
                    >
                      <span className="text-left truncate">{p.name}</span>
                      <span className="shrink-0 ml-2 text-[#f3c41b]">
                        {alreadyAdded ? '✓' : `$${p.price.toFixed(2)}`}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Free-form add */}
          <button
            type="button"
            onClick={addFreeformLine}
            disabled={lines.length >= MAX_LINES}
            className="flex items-center gap-2 text-sm text-[#8c8c8c] hover:text-[#f3c41b] transition-colors disabled:opacity-40"
          >
            <PenLine className="w-4 h-4" />
            Add a custom item (not in catalog)
          </button>

          {/* Line items */}
          {lines.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[#f6f4ee] text-sm font-semibold">Your Items ({lines.length}/{MAX_LINES})</h3>
              {lines.map((line, idx) => (
                <div
                  key={line.key}
                  className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {line.mode === 'catalog' ? (
                        <div>
                          <p className="text-[#f6f4ee] text-sm font-medium truncate">{line.product_name}</p>
                          <p className="text-[#f3c41b] text-xs mt-0.5">List price: ${line.product_price?.toFixed(2)}</p>
                          <p className="text-[#8c8c8c] text-xs">Price will be quoted by our team</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="text-[#8c8c8c] text-xs font-medium">
                            Item #{idx + 1} — Custom item
                          </label>
                          <input
                            type="text"
                            placeholder="Describe the item (brand, model, specs…)"
                            value={line.description}
                            onChange={e => updateLine(line.key, { description: e.target.value })}
                            maxLength={500}
                            className="w-full bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-[#f6f4ee] text-sm placeholder:text-[#8c8c8c] focus:outline-none focus:border-[#f3c41b]/50"
                          />
                          {lineErrors[line.key] && (
                            <p className="text-red-400 text-xs">{lineErrors[line.key]}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      className="p-1.5 text-[#8c8c8c] hover:text-red-400 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-[#8c8c8c] text-xs font-medium shrink-0">Qty:</label>
                    <input
                      type="number"
                      min={1}
                      max={99999}
                      value={line.quantity}
                      onChange={e => updateLine(line.key, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-20 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg px-2 py-1 text-[#f6f4ee] text-sm focus:outline-none focus:border-[#f3c41b]/50"
                    />
                    {lineErrors[`${line.key}_qty`] && (
                      <p className="text-red-400 text-xs">{lineErrors[`${line.key}_qty`]}</p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Note for this item (optional)"
                      value={line.customer_note}
                      onChange={e => updateLine(line.key, { customer_note: e.target.value })}
                      maxLength={1000}
                      className="w-full bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-[#f6f4ee] text-sm placeholder:text-[#8c8c8c] focus:outline-none focus:border-[#f3c41b]/50"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {lineErrors['_lines'] && (
            <p className="text-red-400 text-sm">{lineErrors['_lines']}</p>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => { if (validateStep1()) setStep(2) }}
              disabled={lines.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#f3c41b] text-[#0a0a0a] rounded-lg font-bold text-sm hover:bg-[#f3c41b]/90 transition-colors disabled:opacity-40"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Contact ── */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-1">Your Contact Information</h2>
            <p className="text-[#8c8c8c] text-sm">We&apos;ll use this to send you the quote.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[#8c8c8c] text-xs font-medium" htmlFor="anon_name">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                id="anon_name"
                name="anon_name"
                type="text"
                required
                maxLength={100}
                autoComplete="name"
                className="w-full bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg px-3 py-2 text-[#f6f4ee] text-sm placeholder:text-[#8c8c8c] focus:outline-none focus:border-[#f3c41b]/50"
                placeholder="Maria Rodriguez"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[#8c8c8c] text-xs font-medium" htmlFor="anon_email">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                id="anon_email"
                name="anon_email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                className="w-full bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg px-3 py-2 text-[#f6f4ee] text-sm placeholder:text-[#8c8c8c] focus:outline-none focus:border-[#f3c41b]/50"
                placeholder="maria@company.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[#8c8c8c] text-xs font-medium" htmlFor="anon_company">
                Company Name
              </label>
              <input
                id="anon_company"
                name="anon_company"
                type="text"
                maxLength={200}
                autoComplete="organization"
                className="w-full bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg px-3 py-2 text-[#f6f4ee] text-sm placeholder:text-[#8c8c8c] focus:outline-none focus:border-[#f3c41b]/50"
                placeholder="Acme Corp (optional)"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[#8c8c8c] text-xs font-medium" htmlFor="anon_phone">
                Phone Number
              </label>
              <input
                id="anon_phone"
                name="anon_phone"
                type="tel"
                maxLength={30}
                autoComplete="tel"
                className="w-full bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg px-3 py-2 text-[#f6f4ee] text-sm placeholder:text-[#8c8c8c] focus:outline-none focus:border-[#f3c41b]/50"
                placeholder="+1 (optional)"
              />
            </div>
          </div>

          <p className="text-[#8c8c8c] text-xs">
            Your information will only be used to process your quote request and contact you about it.
          </p>

          {state?.error && !state.success && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-3">
              <p className="text-red-400 text-sm">{state.error}</p>
            </div>
          )}

          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-5 py-2.5 border border-[#2e2e2e] rounded-lg text-[#8c8c8c] hover:text-[#f6f4ee] hover:border-[#8c8c8c] transition-colors text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (!formRef.current) return
                if (!validateStep2(formRef.current)) return
                const f = formRef.current
                const val = (name: string) =>
                  (f.querySelector(`[name="${name}"]`) as HTMLInputElement | null)?.value ?? ''
                setContactSnapshot({
                  anon_name: val('anon_name'),
                  anon_email: val('anon_email'),
                  anon_company: val('anon_company'),
                  anon_phone: val('anon_phone'),
                })
                setStep(3)
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#f3c41b] text-[#0a0a0a] rounded-lg font-bold text-sm hover:bg-[#f3c41b]/90 transition-colors"
            >
              Review Request <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Review ── */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-[#f6f4ee] font-bold text-lg mb-1">Review Your Request</h2>
            <p className="text-[#8c8c8c] text-sm">Please confirm the details before submitting.</p>
          </div>

          {/* Items summary */}
          <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2e2e2e]">
              <p className="text-[#f6f4ee] text-sm font-semibold">Items ({lines.length})</p>
            </div>
            <div className="divide-y divide-[#1e1e1e]">
              {lines.map((line) => (
                <div key={line.key} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-[#f6f4ee] truncate">
                      {line.mode === 'catalog' ? line.product_name : line.description}
                    </p>
                    {line.mode === 'catalog' && (
                      <p className="text-[#8c8c8c] text-xs">List: ${line.product_price?.toFixed(2)}</p>
                    )}
                    {line.customer_note && (
                      <p className="text-[#8c8c8c] text-xs italic">Note: {line.customer_note}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-[#8c8c8c]">× {line.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact summary */}
          <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-4 text-sm space-y-1">
            <p className="text-[#f6f4ee] font-medium">{contactSnapshot.anon_name}</p>
            <p className="text-[#8c8c8c]">{contactSnapshot.anon_email}</p>
            {contactSnapshot.anon_company && (
              <p className="text-[#8c8c8c]">{contactSnapshot.anon_company}</p>
            )}
            {contactSnapshot.anon_phone && (
              <p className="text-[#8c8c8c]">{contactSnapshot.anon_phone}</p>
            )}
          </div>

          {state?.error && !state.success && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-3">
              <p className="text-red-400 text-sm">{state.error}</p>
            </div>
          )}

          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-5 py-2.5 border border-[#2e2e2e] rounded-lg text-[#8c8c8c] hover:text-[#f6f4ee] hover:border-[#8c8c8c] transition-colors text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!formRef.current) return
                const fd = buildFormData(formRef.current)
                formAction(fd)
              }}
              className="px-8 py-2.5 bg-[#f3c41b] text-[#0a0a0a] rounded-lg font-bold text-sm hover:bg-[#f3c41b]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? 'Submitting…' : 'Submit Quote Request'}
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
