import { test, expect } from '@playwright/test'

async function loginAdmin(page: import('@playwright/test').Page) {
  await page.goto('/admin/login')
  await page.fill('input[type="email"]', 'admin@example.com')
  await page.fill('input[type="password"]', 'anypassword')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/admin$/, { timeout: 10_000 })
}

test.describe('Admin — Customers', () => {
  test('/admin/customers is accessible after login', async ({ page }) => {
    await loginAdmin(page)
    await page.goto('/admin/customers')
    await expect(page.getByRole('heading', { name: /customers/i })).toBeVisible({ timeout: 10_000 })
  })

  test('Customers link appears in admin sidebar', async ({ page }) => {
    await loginAdmin(page)
    // Scope to <aside> to match specifically the sidebar nav link
    await expect(page.locator('aside').getByRole('link', { name: /customers/i })).toBeVisible()
  })

  test('customers list shows "+ New Customer" button', async ({ page }) => {
    await loginAdmin(page)
    await page.goto('/admin/customers')
    await expect(page.getByRole('link', { name: /new customer/i })).toBeVisible({ timeout: 10_000 })
  })

  test('/admin/customers/new renders the customer form', async ({ page }) => {
    await loginAdmin(page)
    await page.goto('/admin/customers/new')
    await expect(page.getByRole('heading', { name: /new customer/i })).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('input[name="company_name"]')).toBeVisible()
    await expect(page.locator('input[name="contact_name"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })

  test('creating a customer navigates to customer detail', async ({ page }) => {
    await loginAdmin(page)
    await page.goto('/admin/customers/new')

    await page.fill('input[name="company_name"]', '[E2E] Test Company')
    await page.fill('input[name="contact_name"]', '[E2E] Test Contact')
    await page.fill('input[name="email"]', 'e2e-customer@example.com')

    await page.getByRole('button', { name: /create customer/i }).click()

    // Should redirect to the customer detail page
    await expect(page).toHaveURL(/\/admin\/customers\/.+/, { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: /\[E2E\] Test Company/i })).toBeVisible({ timeout: 10_000 })
  })

  test('customer detail page has editable fields and Save Changes button', async ({ page }) => {
    await loginAdmin(page)
    await page.goto('/admin/customers')

    // Click first View link (scoped to table to avoid sidebar/nav matches)
    const viewLink = page.locator('table').getByRole('link', { name: /view/i }).first()
    await viewLink.waitFor({ timeout: 10_000 })
    await viewLink.click()

    await expect(page).toHaveURL(/\/admin\/customers\/.+/, { timeout: 10_000 })
    await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('input[name="price_tier"]')).toBeVisible()
  })

  test('customer list search filters by company name', async ({ page }) => {
    await loginAdmin(page)
    await page.goto('/admin/customers')

    const searchInput = page.locator('input[type="search"]')
    await searchInput.fill('xyzqwerty_no_match_12345')
    await expect(page.getByText(/no customers match/i)).toBeVisible({ timeout: 5_000 })

    await searchInput.fill('')
    // Should show results again
    await expect(page.getByText(/no customers match/i)).not.toBeVisible({ timeout: 3_000 })
  })
})
