/**
 * Unit tests for MockAdapter B2B methods — Corte 4A.
 * Covers customers, quotes (catalog + free-form + mixed), state machine,
 * price setting, line mutations, and analytics.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { MockAdapter } from '../../src/lib/db/mock-adapter'

function makeAdapter() {
  return new MockAdapter()
}

// ---------------------------------------------------------------------------
// Business Customers
// ---------------------------------------------------------------------------
describe('MockAdapter — Business Customers', () => {
  let adapter: MockAdapter

  beforeEach(() => { adapter = makeAdapter() })

  it('listCustomers returns seed customers', async () => {
    const result = await adapter.listCustomers()
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.total).toBe(result.data.length)
  })

  it('createCustomer stores and returns the new customer', async () => {
    const before = (await adapter.listCustomers()).total
    const c = await adapter.createCustomer({
      company_name: 'Acme Corp',
      contact_name: 'John Doe',
      email: 'john@acme.com',
    })
    expect(c.id).toBeTruthy()
    expect(c.company_name).toBe('Acme Corp')
    expect(c.email).toBe('john@acme.com')
    expect(c.tax_id).toBeNull()
    expect(c.price_tier).toBeNull()
    const after = (await adapter.listCustomers()).total
    expect(after).toBe(before + 1)
  })

  it('getCustomer returns the customer or null', async () => {
    const c = await adapter.createCustomer({
      company_name: 'Beta LLC',
      contact_name: 'Jane Smith',
      email: 'jane@beta.com',
      country: 'US',
      tax_id: '12-3456789',
      tax_id_type: 'EIN',
    })
    const found = await adapter.getCustomer(c.id)
    expect(found).not.toBeNull()
    expect(found!.tax_id).toBe('12-3456789')
    expect(found!.tax_id_type).toBe('EIN')
    expect(found!.country).toBe('US')

    const missing = await adapter.getCustomer('00000000-0000-0000-0000-000000000000')
    expect(missing).toBeNull()
  })

  it('updateCustomer modifies fields', async () => {
    const c = await adapter.createCustomer({
      company_name: 'OldName Inc',
      contact_name: 'Al',
      email: 'al@old.com',
    })
    const updated = await adapter.updateCustomer(c.id, {
      company_name: 'NewName Inc',
      notes: 'VIP client',
      price_tier: 'preferred',
    })
    expect(updated.company_name).toBe('NewName Inc')
    expect(updated.notes).toBe('VIP client')
    expect(updated.price_tier).toBe('preferred')
    expect(updated.email).toBe('al@old.com') // unchanged
  })

  it('listCustomers search filters by company and email', async () => {
    await adapter.createCustomer({ company_name: 'Searchable Corp', contact_name: 'X', email: 'x@searchable.com' })
    await adapter.createCustomer({ company_name: 'Other Ltd', contact_name: 'Y', email: 'y@other.com' })
    const r = await adapter.listCustomers({ search: 'searchable' })
    expect(r.data.some(c => c.company_name === 'Searchable Corp')).toBe(true)
    expect(r.data.every(c => c.company_name !== 'Other Ltd')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Quotes — catalog lines
// ---------------------------------------------------------------------------
describe('MockAdapter — Quotes (catalog lines)', () => {
  let adapter: MockAdapter

  beforeEach(() => { adapter = makeAdapter() })

  async function firstProductId() {
    const p = await adapter.listProducts({ status: 'published' })
    if (p.data.length === 0) throw new Error('No published products in seed')
    return p.data[0].id
  }

  it('createQuote with catalog line stores quote and line', async () => {
    const pid = await firstProductId()
    const quote = await adapter.createQuote({
      anon_name: 'Alice B',
      anon_email: 'alice@example.com',
      lines: [{ product_id: pid, quantity: 3 }],
    })
    expect(quote.id).toBeTruthy()
    expect(quote.quote_ref).toMatch(/^QT-\d{4}-\d{4}$/)
    expect(quote.status).toBe('pending')
    expect(quote.currency_code).toBe('USD')
    expect(quote.lines).toHaveLength(1)
    expect(quote.lines![0].product_id).toBe(pid)
    expect(quote.lines![0].quantity).toBe(3)
    expect(quote.lines![0].unit_list_price).toBeGreaterThan(0)   // snapshotted
    expect(quote.lines![0].unit_quoted_price).toBeNull()         // not yet set
  })

  it('getQuote returns full quote with lines and product join', async () => {
    const pid = await firstProductId()
    const created = await adapter.createQuote({
      anon_name: 'Bob C',
      anon_email: 'bob@example.com',
      lines: [{ product_id: pid, quantity: 1 }],
    })
    const q = await adapter.getQuote(created.id)
    expect(q).not.toBeNull()
    expect(q!.lines![0].product).toBeDefined()
    expect(q!.lines![0].product!.id).toBe(pid)
  })

  it('getQuote returns null for unknown id', async () => {
    expect(await adapter.getQuote('00000000-0000-0000-0000-000000000000')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Quotes — free-form lines
// ---------------------------------------------------------------------------
describe('MockAdapter — Quotes (free-form lines)', () => {
  let adapter: MockAdapter

  beforeEach(() => { adapter = makeAdapter() })

  it('createQuote with free-form line stores null product_id', async () => {
    const quote = await adapter.createQuote({
      anon_name: 'Carol D',
      anon_email: 'carol@example.com',
      lines: [{ description: 'Milwaukee drill set, model 2607', quantity: 2 }],
    })
    expect(quote.lines).toHaveLength(1)
    expect(quote.lines![0].product_id).toBeNull()
    expect(quote.lines![0].description).toBe('Milwaukee drill set, model 2607')
    expect(quote.lines![0].unit_list_price).toBeNull()
  })

  it('createQuote with mixed lines stores both types', async () => {
    const products = await adapter.listProducts({ status: 'published' })
    const pid = products.data[0].id
    const quote = await adapter.createQuote({
      anon_name: 'Dan E',
      anon_email: 'dan@example.com',
      lines: [
        { product_id: pid, quantity: 5 },
        { description: 'Custom wrench set', quantity: 1 },
      ],
    })
    expect(quote.lines).toHaveLength(2)
    const catalogLine = quote.lines!.find(l => l.product_id !== null)
    const freeFormLine = quote.lines!.find(l => l.product_id === null)
    expect(catalogLine).toBeDefined()
    expect(freeFormLine).toBeDefined()
    expect(catalogLine!.unit_list_price).not.toBeNull()
    expect(freeFormLine!.unit_list_price).toBeNull()
  })

  it('createQuote rejects lines with neither product_id nor description', async () => {
    await expect(adapter.createQuote({
      anon_name: 'Eve',
      anon_email: 'eve@example.com',
      lines: [{ quantity: 1 }],
    })).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Quotes — state machine
// ---------------------------------------------------------------------------
describe('MockAdapter — Quote state machine', () => {
  let adapter: MockAdapter

  beforeEach(() => { adapter = makeAdapter() })

  async function createPendingQuote() {
    const products = await adapter.listProducts({ status: 'published' })
    return adapter.createQuote({
      anon_name: 'Test',
      anon_email: 'test@example.com',
      lines: [{ product_id: products.data[0].id, quantity: 1 }],
    })
  }

  it('allows valid transition pending → reviewing', async () => {
    const q = await createPendingQuote()
    await expect(adapter.updateQuoteStatus(q.id, 'reviewing', null, 'admin-id')).resolves.toBeUndefined()
    const updated = await adapter.getQuote(q.id)
    expect(updated!.status).toBe('reviewing')
  })

  it('records quote_event on status change', async () => {
    const q = await createPendingQuote()
    await adapter.updateQuoteStatus(q.id, 'reviewing', 'Starting review', 'admin-id')
    const full = await adapter.getQuote(q.id)
    expect(full!.events).toHaveLength(1)
    expect(full!.events![0].event_type).toBe('status_change')
    expect(full!.events![0].old_status).toBe('pending')
    expect(full!.events![0].new_status).toBe('reviewing')
    expect(full!.events![0].note).toBe('Starting review')
  })

  it('rejects invalid transition pending → accepted', async () => {
    const q = await createPendingQuote()
    await expect(adapter.updateQuoteStatus(q.id, 'accepted', null, 'admin-id')).rejects.toThrow()
  })

  it('rejects transition from terminal status accepted', async () => {
    const q = await createPendingQuote()
    await adapter.updateQuoteStatus(q.id, 'reviewing', null, 'admin-id')
    await adapter.updateQuoteStatus(q.id, 'sent', null, 'admin-id')
    await adapter.updateQuoteStatus(q.id, 'accepted', null, 'admin-id')
    await expect(adapter.updateQuoteStatus(q.id, 'reviewing', null, 'admin-id')).rejects.toThrow()
  })

  it('allows expired → reviewing (reopen) with note', async () => {
    const q = await createPendingQuote()
    await adapter.updateQuoteStatus(q.id, 'reviewing', null, 'admin-id')
    await adapter.updateQuoteStatus(q.id, 'sent', null, 'admin-id')
    await adapter.updateQuoteStatus(q.id, 'expired', null, 'admin-id')
    await expect(
      adapter.updateQuoteStatus(q.id, 'reviewing', 'Client requested reopen', 'admin-id')
    ).resolves.toBeUndefined()
    const full = await adapter.getQuote(q.id)
    expect(full!.status).toBe('reviewing')
    const reopenEvent = full!.events!.find(e => e.event_type === 'reopened')
    expect(reopenEvent).toBeDefined()
    expect(reopenEvent!.note).toBe('Client requested reopen')
  })

  it('rejects expired → reviewing without note', async () => {
    const q = await createPendingQuote()
    await adapter.updateQuoteStatus(q.id, 'reviewing', null, 'admin-id')
    await adapter.updateQuoteStatus(q.id, 'sent', null, 'admin-id')
    await adapter.updateQuoteStatus(q.id, 'expired', null, 'admin-id')
    await expect(adapter.updateQuoteStatus(q.id, 'reviewing', null, 'admin-id')).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Quotes — line mutations and prices
// ---------------------------------------------------------------------------
describe('MockAdapter — Quote line mutations', () => {
  let adapter: MockAdapter

  beforeEach(() => { adapter = makeAdapter() })

  async function createQuoteWithLine() {
    const products = await adapter.listProducts({ status: 'published' })
    return adapter.createQuote({
      anon_name: 'Test',
      anon_email: 'test@example.com',
      lines: [{ product_id: products.data[0].id, quantity: 2 }],
    })
  }

  it('setQuoteLinePrices updates unit_quoted_price', async () => {
    const q = await createQuoteWithLine()
    const lineId = q.lines![0].id
    await adapter.setQuoteLinePrices(q.id, [{ lineId, unitQuotedPrice: 49.99 }])
    const updated = await adapter.getQuote(q.id)
    expect(updated!.lines![0].unit_quoted_price).toBe(49.99)
  })

  it('setQuoteLinePrices rejects negative price', async () => {
    const q = await createQuoteWithLine()
    const lineId = q.lines![0].id
    await expect(adapter.setQuoteLinePrices(q.id, [{ lineId, unitQuotedPrice: -1 }])).rejects.toThrow()
  })

  it('addQuoteLine adds a free-form line', async () => {
    const q = await createQuoteWithLine()
    const newLine = await adapter.addQuoteLine(q.id, { quantity: 10, description: 'Extra bolts' })
    expect(newLine.id).toBeTruthy()
    expect(newLine.product_id).toBeNull()
    expect(newLine.description).toBe('Extra bolts')
    const full = await adapter.getQuote(q.id)
    expect(full!.lines).toHaveLength(2)
  })

  it('removeQuoteLine removes a line', async () => {
    const q = await createQuoteWithLine()
    const products = await adapter.listProducts({ status: 'published' })
    const extra = await adapter.addQuoteLine(q.id, { product_id: products.data[0].id, quantity: 1 })
    await adapter.removeQuoteLine(q.id, extra.id)
    const full = await adapter.getQuote(q.id)
    expect(full!.lines!.some(l => l.id === extra.id)).toBe(false)
  })

  it('linkCustomerToQuote sets customer_id', async () => {
    const q = await createQuoteWithLine()
    const c = await adapter.createCustomer({ company_name: 'Linkable Co', contact_name: 'Z', email: 'z@linkable.com' })
    await adapter.linkCustomerToQuote(q.id, c.id)
    const full = await adapter.getQuote(q.id)
    expect(full!.customer_id).toBe(c.id)
    expect(full!.customer).toBeDefined()
    expect(full!.customer!.company_name).toBe('Linkable Co')
  })
})

// ---------------------------------------------------------------------------
// Quotes — filtering and analytics
// ---------------------------------------------------------------------------
describe('MockAdapter — Quote filtering and analytics', () => {
  let adapter: MockAdapter

  beforeEach(() => { adapter = makeAdapter() })

  it('listQuotes returns seed data with correct pagination', async () => {
    const r = await adapter.listQuotes()
    expect(r.data.length).toBeGreaterThan(0)
    expect(r.total).toBeGreaterThan(0)
  })

  it('listQuotes filters by status', async () => {
    const products = await adapter.listProducts({ status: 'published' })
    const pid = products.data[0].id
    await adapter.createQuote({ anon_name: 'A', anon_email: 'a@a.com', lines: [{ product_id: pid, quantity: 1 }] })
    const r = await adapter.listQuotes({ status: 'pending' })
    expect(r.data.every(q => q.status === 'pending')).toBe(true)
    expect(r.data.length).toBeGreaterThan(0)
  })

  it('getQuoteStats returns correct structure', async () => {
    const stats = await adapter.getQuoteStats(30)
    expect(typeof stats.total).toBe('number')
    expect(typeof stats.pending).toBe('number')
    expect(typeof stats.sentValue).toBe('number')
    expect(typeof stats.acceptedValue).toBe('number')
    expect(stats.conversionRate === null || typeof stats.conversionRate === 'number').toBe(true)
    expect(Array.isArray(stats.trend)).toBe(true)
  })
})
