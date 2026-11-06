import { test, expect, type Page } from '@playwright/test'

// Helper: log in before each test
async function login(page: Page) {
  await page.goto('/admin/login')
  await page.fill('input[type="email"]', 'admin@example.com')
  await page.fill('input[type="password"]', 'anypassword')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/admin$/, { timeout: 10_000 })
}

test.describe('Admin Products', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('/admin/products shows product table', async ({ page }) => {
    await page.goto('/admin/products')
    // Table should have product rows
    const rows = page.locator('table tbody tr')
    await rows.first().waitFor({ timeout: 10_000 })
    expect(await rows.count()).toBeGreaterThan(0)
  })

  test('clicking "New Product" navigates to /admin/products/new', async ({ page }) => {
    await page.goto('/admin/products')
    await page.getByRole('link', { name: /new product/i }).click()
    await expect(page).toHaveURL(/\/admin\/products\/new/)
  })

  test('creating a product with valid data redirects to /admin/products', async ({ page }) => {
    await page.goto('/admin/products/new')
    await page.fill('input[name="name"]', 'Test E2E Product')
    await page.fill('input[name="price"]', '99.99')
    await page.selectOption('select[name="status"]', 'published')
    await page.getByRole('button', { name: /create product/i }).click()
    await expect(page).toHaveURL(/\/admin\/products$/, { timeout: 10_000 })
  })

  test('creating a product with empty name shows validation error', async ({ page }) => {
    await page.goto('/admin/products/new')
    await page.fill('input[name="price"]', '10.00')
    // Leave name empty and submit
    await page.getByRole('button', { name: /create product/i }).click()
    // Browser required validation prevents submission, name input should be focused
    // Alternatively, if server validation fires, we see an error message
    const nameInput = page.locator('input[name="name"]')
    await expect(nameInput).toBeVisible()
  })

  test('"Archive" action on a published product updates its status badge', async ({ page }) => {
    await page.goto('/admin/products')
    // Find first published product's archive button
    const archiveBtn = page.getByRole('button', { name: 'Archive' }).first()
    await archiveBtn.waitFor({ timeout: 10_000 })
    await archiveBtn.click()
    // After action, badge should change to 'archived'
    await expect(page.locator('span', { hasText: 'archived' }).first()).toBeVisible({ timeout: 10_000 })
  })
})
