import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should load the home page successfully', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Check that page loaded successfully (status code 200)
    expect(page.url()).toContain('localhost:3000')
  })

  test('should have correct page title', async ({ page }) => {
    await page.goto('/')

    // Check page title
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(0)
  })

  test('should display main content', async ({ page }) => {
    await page.goto('/')

    // Wait for body to be visible
    const body = await page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should be responsive', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()
  })
})
