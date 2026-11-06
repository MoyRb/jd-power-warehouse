import { test, expect } from '@playwright/test'

test.describe('Public Shop Sync', () => {
  test('/shop renders product grid', async ({ page }) => {
    await page.goto('/shop')
    // Should show product cards
    await expect(page.locator('.grid > div').first()).toBeVisible({ timeout: 10_000 })
    // Count items text should appear
    await expect(page.getByText(/\d+ items? available/)).toBeVisible()
  })

  test('/shop shows empty state when no published products match filters', async ({ page }) => {
    await page.goto('/shop')
    // Apply a search that matches nothing
    await page.fill('input[type="search"]', 'zzz_nonexistent_item_xyzqwerty')
    await expect(page.getByText('No products found matching your search.')).toBeVisible({ timeout: 5_000 })
  })

  test('creating a product and publishing it makes it visible at /shop', async ({ page }) => {
    // Log in and create a product
    await page.goto('/admin/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'anypassword')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin$/, { timeout: 10_000 })

    await page.goto('/admin/products/new')
    const uniqueName = `E2E Published Product ${Date.now()}`
    await page.fill('input[name="name"]', uniqueName)
    await page.fill('input[name="price"]', '49.99')
    await page.selectOption('select[name="status"]', 'published')
    await page.getByRole('button', { name: /create product/i }).click()
    await expect(page).toHaveURL(/\/admin\/products$/, { timeout: 10_000 })

    // Visit shop and find the product
    await page.goto('/shop')
    await page.fill('input[type="search"]', uniqueName)
    await expect(page.getByText(uniqueName).first()).toBeVisible({ timeout: 10_000 })
  })
})
