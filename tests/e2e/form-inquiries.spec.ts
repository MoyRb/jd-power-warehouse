import { test, expect } from '@playwright/test'

test.describe('Form Inquiries', () => {
  test('Contact form submission shows "Message Sent!" success state', async ({ page }) => {
    await page.goto('/contact')
    await page.fill('input[type="text"][required]', 'Test User')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('textarea', 'This is a test message for E2E testing.')
    await page.getByRole('button', { name: /send message/i }).click()
    await expect(page.getByText('Message Sent!')).toBeVisible({ timeout: 10_000 })
  })

  test('Sell form submission shows "Request Received!" success state', async ({ page }) => {
    await page.goto('/sell')
    await page.fill('input[placeholder="John Doe"]', 'Jane Doe')
    await page.fill('input[type="email"]', 'jane@example.com')
    await page.fill('input[placeholder*="DeWalt"]', 'Old Drill')
    await page.getByRole('button', { name: /submit for review/i }).click()
    await expect(page.getByText('Request Received!')).toBeVisible({ timeout: 10_000 })
  })

  test('submitted inquiry appears in /admin/inquiries inbox', async ({ page }) => {
    // Submit a contact form
    await page.goto('/contact')
    const uniqueName = `E2E Contact ${Date.now()}`
    await page.fill('input[type="text"][required]', uniqueName)
    await page.fill('input[type="email"]', 'e2e@example.com')
    await page.fill('textarea', 'E2E test inquiry message.')
    await page.getByRole('button', { name: /send message/i }).click()
    await expect(page.getByText('Message Sent!')).toBeVisible({ timeout: 10_000 })

    // Log in and check admin inbox
    await page.goto('/admin/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'anypassword')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin$/, { timeout: 10_000 })

    await page.goto('/admin/inquiries')
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 10_000 })
  })

  test('inquiry status can be changed from "new" to "read" via admin', async ({ page }) => {
    // Log in
    await page.goto('/admin/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'anypassword')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin$/, { timeout: 10_000 })

    await page.goto('/admin/inquiries')
    // Find first "new" status select and change to "read"
    const statusSelect = page.locator('select').first()
    await statusSelect.waitFor({ timeout: 10_000 })
    await statusSelect.selectOption('read')
    // The select should now show "read"
    await expect(statusSelect).toHaveValue('read')
  })
})
