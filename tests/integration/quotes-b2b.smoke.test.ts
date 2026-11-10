/**
 * B2B Quotes + Customers — integration smoke tests.
 * Uses anon client to test the public RPC and verifies RLS restrictions.
 * Uses service-role client (if available) for cleanup and admin operations.
 * Skipped when NEXT_PUBLIC_SUPABASE_URL is not set.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { SupabaseAdapter } from '../../src/lib/db/supabase-adapter'

const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const HAS_SERVICE_ROLE = !!process.env.SUPABASE_SERVICE_ROLE_KEY

// Shared test state
const createdQuoteIds: string[] = []
const createdCustomerIds: string[] = []

describe.skipIf(!HAS_SUPABASE)('B2B Quotes + Customers — smoke tests (real JDHOUSE)', () => {
  const anonClientFactory = () =>
    Promise.resolve(
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ) as ReturnType<typeof createClient>,
    )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new SupabaseAdapter(anonClientFactory as any)
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // For admin operations (admin-only methods), we need a service-role client
  const serviceAdapter = HAS_SERVICE_ROLE
    ? new SupabaseAdapter(() =>
        Promise.resolve(
          createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ) as any,
        ),
      )
    : null

  let firstPublishedProductId: string | null = null

  beforeAll(async () => {
    if (!HAS_SUPABASE) return
    const products = await adapter.listProducts({ status: 'published', per_page: 1 })
    firstPublishedProductId = products.data[0]?.id ?? null
  })

  afterAll(async () => {
    if (!HAS_SUPABASE || !HAS_SERVICE_ROLE) return
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    for (const id of createdQuoteIds) {
      await admin.from('quote_lines').delete().eq('quote_id', id)
      await admin.from('quote_events').delete().eq('quote_id', id)
      await admin.from('quotes').delete().eq('id', id)
    }
    for (const id of createdCustomerIds) {
      await admin.from('business_customers').delete().eq('id', id)
    }
  })

  // ── RLS: anon direct table access ──────────────────────────────────────────

  it('anon cannot INSERT directly into quotes (RLS blocks, use RPC)', async () => {
    const { error } = await anonClient.from('quotes').insert({
      anon_name: '[rls-test] unauthorized',
      anon_email: 'rls@example.com',
      status: 'pending',
      currency_code: 'USD',
    })
    expect(error).not.toBeNull()
    expect(error!.message).toBeTruthy()
  })

  it('anon cannot INSERT directly into business_customers (RLS blocks)', async () => {
    const { error } = await anonClient.from('business_customers').insert({
      company_name: '[rls-test] unauthorized',
      contact_name: 'Test',
      email: 'rls@example.com',
    })
    expect(error).not.toBeNull()
    expect(error!.message).toBeTruthy()
  })

  it('anon cannot SELECT from business_customers (admin-only table)', async () => {
    const { data, error } = await anonClient.from('business_customers').select('id')
    // Either error or empty result — anon has no SELECT policy
    if (error) {
      expect(error.message).toBeTruthy()
    } else {
      expect(data).toHaveLength(0)
    }
  })

  it('anon cannot SELECT from quotes (no anon SELECT policy)', async () => {
    const { data, error } = await anonClient.from('quotes').select('id')
    if (error) {
      expect(error.message).toBeTruthy()
    } else {
      expect(data).toHaveLength(0)
    }
  })

  it('anon cannot SELECT from quote_lines (admin-only)', async () => {
    const { data, error } = await anonClient.from('quote_lines').select('id')
    if (error) {
      expect(error.message).toBeTruthy()
    } else {
      expect(data).toHaveLength(0)
    }
  })

  it('anon cannot SELECT from quote_events (admin-only)', async () => {
    const { data, error } = await anonClient.from('quote_events').select('id')
    if (error) {
      expect(error.message).toBeTruthy()
    } else {
      expect(data).toHaveLength(0)
    }
  })

  // ── RPC: anon can submit via create_quote_with_lines ──────────────────────

  it('anon can submit a free-form quote via create_quote_with_lines RPC', async () => {
    const quote = await adapter.createQuote({
      anon_name: '[test] Integration Tester',
      anon_email: 'b2b-test@example.com',
      anon_phone: '+1-555-0100',
      anon_company: '[test] Integration Co.',
      lines: [
        { description: '[test] Free-form item #1', quantity: 3 },
        { description: '[test] Free-form item #2', quantity: 1 },
      ],
      ip_hash: 'test-hash-integration',
    })

    expect(quote.id).toBeTruthy()
    expect(quote.quote_ref).toMatch(/^QT-\d{4}-\d{4}$/)
    expect(quote.status).toBe('pending')
    expect(quote.anon_name).toBe('[test] Integration Tester')
    expect(quote.anon_email).toBe('b2b-test@example.com')
    createdQuoteIds.push(quote.id)
  })

  it('anon can submit a catalog quote when published products exist', async () => {
    if (!firstPublishedProductId) {
      console.warn('SKIP: no published products available for catalog quote test')
      return
    }

    const quote = await adapter.createQuote({
      anon_name: '[test] Catalog Buyer',
      anon_email: 'catalog-test@example.com',
      lines: [
        { product_id: firstPublishedProductId, quantity: 2 },
      ],
      ip_hash: 'test-hash-catalog',
    })

    expect(quote.id).toBeTruthy()
    expect(quote.status).toBe('pending')
    createdQuoteIds.push(quote.id)
  })

  it('anon can submit a mixed quote (catalog + free-form)', async () => {
    if (!firstPublishedProductId) {
      console.warn('SKIP: no published products for mixed quote test')
      return
    }

    const quote = await adapter.createQuote({
      anon_name: '[test] Mixed Buyer',
      anon_email: 'mixed-test@example.com',
      lines: [
        { product_id: firstPublishedProductId, quantity: 1 },
        { description: '[test] Custom part XYZ', quantity: 10, customer_note: 'Need in bulk' },
      ],
      ip_hash: 'test-hash-mixed',
    })

    expect(quote.id).toBeTruthy()
    createdQuoteIds.push(quote.id)
  })

  it('createQuote rejects empty lines', async () => {
    await expect(
      adapter.createQuote({
        anon_name: '[test] Empty Lines',
        anon_email: 'empty@example.com',
        lines: [],
      }),
    ).rejects.toThrow()
  })

  it('createQuote rejects non-existent product_id', async () => {
    await expect(
      adapter.createQuote({
        anon_name: '[test] Bad Product',
        anon_email: 'bad@example.com',
        lines: [{ product_id: '00000000-0000-0000-0000-000000000000', quantity: 1 }],
      }),
    ).rejects.toThrow()
  })

  // ── Admin operations (service role required) ───────────────────────────────

  it.skipIf(!HAS_SERVICE_ROLE)('admin can list quotes and find the test ones', async () => {
    const result = await serviceAdapter!.listQuotes({ per_page: 50 })
    expect(typeof result.total).toBe('number')
    const testQuotes = result.data.filter((q) => q.anon_name?.startsWith('[test]'))
    expect(testQuotes.length).toBeGreaterThan(0)
  })

  it.skipIf(!HAS_SERVICE_ROLE)('admin can getQuote with lines and events', async () => {
    if (createdQuoteIds.length === 0) return
    const quote = await serviceAdapter!.getQuote(createdQuoteIds[0])
    expect(quote).not.toBeNull()
    expect(quote!.lines).toBeDefined()
    expect(quote!.lines!.length).toBeGreaterThan(0)
    expect(quote!.events).toBeDefined()
  })

  it.skipIf(!HAS_SERVICE_ROLE)('admin can transition quote status pending → reviewing', async () => {
    if (createdQuoteIds.length === 0) return
    await expect(
      serviceAdapter!.updateQuoteStatus(createdQuoteIds[0], 'reviewing', 'Starting automated review', undefined),
    ).resolves.toBeUndefined()

    const updated = await serviceAdapter!.getQuote(createdQuoteIds[0])
    expect(updated!.status).toBe('reviewing')
    expect(updated!.events).toHaveLength(1)
    expect(updated!.events![0].event_type).toBe('status_change')
    expect(updated!.events![0].note).toBe('Starting automated review')
  })

  it.skipIf(!HAS_SERVICE_ROLE)('admin can set quoted prices on lines', async () => {
    if (createdQuoteIds.length === 0) return
    const quote = await serviceAdapter!.getQuote(createdQuoteIds[0])
    if (!quote?.lines?.length) return

    const prices = quote.lines.map((l) => ({
      lineId: l.id,
      unitQuotedPrice: 99.99,
    }))
    await expect(
      serviceAdapter!.setQuoteLinePrices(quote.id, prices),
    ).resolves.toBeUndefined()
  })

  it.skipIf(!HAS_SERVICE_ROLE)('admin can create a business customer', async () => {
    const customer = await serviceAdapter!.createCustomer({
      company_name: '[test] Integration Corp',
      contact_name: '[test] B2B Contact',
      email: 'b2b-customer-test@example.com',
      country: 'MX',
      tax_id: 'TEST123456',
      tax_id_type: 'RFC',
    })

    expect(customer.id).toBeTruthy()
    expect(customer.company_name).toBe('[test] Integration Corp')
    expect(customer.country).toBe('MX')
    createdCustomerIds.push(customer.id)
  })

  it.skipIf(!HAS_SERVICE_ROLE)('admin can list customers and find the test one', async () => {
    const result = await serviceAdapter!.listCustomers({ per_page: 50 })
    const testCustomers = result.data.filter((c) => c.company_name.startsWith('[test]'))
    expect(testCustomers.length).toBeGreaterThan(0)
  })

  it.skipIf(!HAS_SERVICE_ROLE)('admin can update customer price_tier', async () => {
    if (createdCustomerIds.length === 0) return
    await expect(
      serviceAdapter!.updateCustomer(createdCustomerIds[0], { price_tier: 'preferred' }),
    ).resolves.toBeDefined()

    const updated = await serviceAdapter!.getCustomer(createdCustomerIds[0])
    expect(updated!.price_tier).toBe('preferred')
  })

  it.skipIf(!HAS_SERVICE_ROLE)('getQuoteStats returns aggregated data', async () => {
    const stats = await serviceAdapter!.getQuoteStats(30)
    expect(typeof stats.total).toBe('number')
    expect(typeof stats.pending).toBe('number')
    expect(typeof stats.sentValue).toBe('number')
    expect(typeof stats.acceptedValue).toBe('number')
    expect(stats.total).toBeGreaterThan(0) // we created some test quotes
  })
})
