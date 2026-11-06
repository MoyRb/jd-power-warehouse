import { test, expect } from '@playwright/test'

test.describe('Admin Auth', () => {
  test('GET /admin redirects to /admin/login when not authenticated', async ({ page }) => {
    // Clear any existing auth cookies
    await page.context().clearCookies()
    const response = await page.goto('/admin')
    // Should end up at login (after redirect)
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('GET /admin/products redirects to /admin/login when not authenticated', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/admin/products')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('login page renders email and password fields', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('dev mode login with any credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/admin/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'anypassword')
    await page.click('button[type="submit"]')
    // In dev bypass mode, any credentials succeed
    await expect(page).toHaveURL(/\/admin$/, { timeout: 10_000 })
  })

  test('/admin dashboard shows stats cards after login', async ({ page }) => {
    await page.goto('/admin/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'anypassword')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin$/, { timeout: 10_000 })
    // Dashboard should show stats
    await expect(page.getByText('Total Products')).toBeVisible()
    await expect(page.getByText('Published', { exact: true }).first()).toBeVisible()
  })

  test('logout button redirects to /admin/login', async ({ page }) => {
    // Log in first
    await page.goto('/admin/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'anypassword')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin$/, { timeout: 10_000 })

    // Click logout
    await page.getByRole('button', { name: /log out/i }).click()
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10_000 })
  })
})
