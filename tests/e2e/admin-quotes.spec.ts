import { test, expect } from '@playwright/test'

// Helper: log in with dev bypass
async function loginAdmin(page: import('@playwright/test').Page) {
  await page.goto('/admin/login')
  await page.fill('input[type="email"]', 'admin@example.com')
  await page.fill('input[type="password"]', 'anypassword')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/admin$/, { timeout: 10_000 })
}

test.describe('Admin — Quotes', () => {
  test('/admin/quotes is accessible after login', async ({ page }) => {
    await loginAdmin(page)
    await page.goto('/admin/quotes')
    await expect(page.getByRole('heading', { name: /quotes/i })).toBeVisible({ timeout: 10_000 })
  })

  test('Quotes link appears in admin sidebar', async ({ page }) => {
    await loginAdmin(page)
    // Scope to <aside> to avoid matching 'View Quotes' quick-action link on dashboard
    await expect(page.locator('aside').getByRole('link', { name: /quotes/i })).toBeVisible()
  })

  test('quotes list shows status tabs', async ({ page }) => {
    await loginAdmin(page)
    await page.goto('/admin/quotes')
    await expect(page.getByRole('button', { name: /pending/i })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /reviewing/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sent/i })).toBeVisible()
  })

  test('clicking a quote row opens the detail page', async ({ page }) => {
    await loginAdmin(page)
    await page.goto('/admin/quotes')

    // Click first "View →" link (scoped to table to avoid sidebar/nav matches)
    const viewLink = page.locator('table').getByRole('link', { name: /view/i }).first()
    await viewLink.waitFor({ timeout: 10_000 })
    await viewLink.click()

    // Should navigate to /admin/quotes/[id]
    await expect(page).toHaveURL(/\/admin\/quotes\/.+/, { timeout: 10_000 })
    // Quote detail shows the ref
    await expect(page.getByText(/QT-/)).toBeVisible({ timeout: 10_000 })
  })

  test('quote detail page shows Contact section', async ({ page }) => {
    await loginAdmin(page)
    await page.goto('/admin/quotes')

    const viewLink = page.locator('table').getByRole('link', { name: /view/i }).first()
    await viewLink.waitFor({ timeout: 10_000 })
    await viewLink.click()
    await expect(page).toHaveURL(/\/admin\/quotes\/.+/, { timeout: 10_000 })

    await expect(page.getByText('Contact')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Items')).toBeVisible()
  })

  test('quote detail page shows Update Status panel', async ({ page }) => {
    await loginAdmin(page)
    await page.goto('/admin/quotes')

    const viewLink = page.locator('table').getByRole('link', { name: /view/i }).first()
    await viewLink.waitFor({ timeout: 10_000 })
    await viewLink.click()

    await expect(page.getByText('Update Status')).toBeVisible({ timeout: 10_000 })
  })

  test('Save Prices button is visible on quote detail', async ({ page }) => {
    await loginAdmin(page)
    await page.goto('/admin/quotes')

    const viewLink = page.locator('table').getByRole('link', { name: /view/i }).first()
    await viewLink.waitFor({ timeout: 10_000 })
    await viewLink.click()

    await expect(page.getByRole('button', { name: /save prices/i })).toBeVisible({ timeout: 10_000 })
  })

  test('dashboard shows Quote Analytics section', async ({ page }) => {
    await loginAdmin(page)
    await expect(page.getByText('Quote Analytics')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Total Quotes')).toBeVisible()
  })
})
