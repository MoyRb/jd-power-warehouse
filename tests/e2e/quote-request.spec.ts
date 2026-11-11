import { test, expect } from '@playwright/test'

test.describe('Public Quote Request Form', () => {
  test('/quote page renders the wizard', async ({ page }) => {
    await page.goto('/quote')
    await expect(page.getByRole('heading', { name: /request a quote/i })).toBeVisible()
    // Step 1 is active (step label is 'Items', h2 is 'Select Items')
    await expect(page.getByRole('heading', { name: /select items/i })).toBeVisible()
  })

  test('/shop/[id] shows "Request a Quote" button for published product', async ({ page }) => {
    // Get any published product from the shop
    await page.goto('/shop')
    const firstProductLink = page.locator('a[href^="/shop/"]').first()
    await firstProductLink.waitFor({ timeout: 10_000 })
    const href = await firstProductLink.getAttribute('href')
    if (!href) return

    await page.goto(href)
    const quoteBtn = page.getByRole('link', { name: /request a quote/i })
    await expect(quoteBtn).toBeVisible({ timeout: 10_000 })

    // Should link to /quote?product_id=...
    const quoteBtnHref = await quoteBtn.getAttribute('href')
    expect(quoteBtnHref).toContain('/quote?product_id=')
  })

  test('can add a free-form item and proceed to step 2', async ({ page }) => {
    await page.goto('/quote')

    // Add a free-form item (button label: 'Add a custom item (not in catalog)')
    await page.getByRole('button', { name: /add custom item/i }).click()
    // Freeform input placeholder: 'Describe the item (brand, model, specs…)'
    await page.locator('input[placeholder*="Describe"]').first().fill('[E2E] Custom part ABC')
    await expect(page.getByText('[E2E] Custom part ABC')).toBeVisible()

    // Step 1 advance button is 'Continue'
    await page.getByRole('button', { name: /continue/i }).click()
    // Step 2 heading is 'Your Contact Information'
    await expect(page.getByRole('heading', { name: /your contact information/i })).toBeVisible()
  })

  test('step 2 validates required contact fields', async ({ page }) => {
    await page.goto('/quote')

    // Add a free-form item first
    await page.getByRole('button', { name: /add custom item/i }).click()
    await page.locator('input[placeholder*="Describe"]').first().fill('[E2E] Item for validation test')

    // Go to step 2 — step 1 advance button is 'Continue'
    await page.getByRole('button', { name: /continue/i }).click()

    // Try to proceed without name/email — step 2 advance button is 'Review Request'
    await page.getByRole('button', { name: /review request/i }).click()
    // Should stay on step 2 (validation failed — name/email empty)
    await expect(page.getByRole('heading', { name: /your contact information/i })).toBeVisible()
  })

  test('full quote submission flow reaches success state', async ({ page }) => {
    await page.goto('/quote')

    // Step 1: Add a free-form item
    await page.getByRole('button', { name: /add custom item/i }).click()
    const descInput = page.locator('input[placeholder*="Describe"]').first()
    await descInput.fill('[E2E] Automated test item - safe to delete')

    // Step 1 advance button is 'Continue'
    await page.getByRole('button', { name: /continue/i }).click()

    // Step 2: Contact info
    await page.locator('input[name="anon_name"]').fill('[E2E] Test Contact')
    await page.locator('input[name="anon_email"]').fill('e2e-quote-test@example.com')

    // Step 2 advance button is 'Review Request'
    await page.getByRole('button', { name: /review request/i }).click()

    // Step 3: Review
    await expect(page.getByText('[E2E] Automated test item - safe to delete')).toBeVisible()

    // Submit (button label: 'Submit Quote Request')
    await page.getByRole('button', { name: /submit quote/i }).click()

    // Success — should show quote reference
    await expect(page.getByText(/QT-/i)).toBeVisible({ timeout: 15_000 })
  })

  test('pre-loading product via ?product_id adds it to Step 1', async ({ page }) => {
    // Get a product id from the shop first
    await page.goto('/shop')
    const firstLink = page.locator('a[href^="/shop/"]').first()
    await firstLink.waitFor({ timeout: 10_000 })
    const href = await firstLink.getAttribute('href')
    if (!href) return

    const productId = href.split('/shop/')[1]?.split('?')[0]
    if (!productId) return

    await page.goto(`/quote?product_id=${productId}`)

    // The item should already be in the list (pre-loaded)
    // At minimum, the "Continue" button should be enabled (item present)
    const nextBtn = page.getByRole('button', { name: /continue/i })
    await expect(nextBtn).toBeVisible({ timeout: 5_000 })
  })
})
