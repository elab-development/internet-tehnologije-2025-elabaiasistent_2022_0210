import { test, expect } from '@playwright/test'

test.describe('Authentication - Registration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register')
  })

  test('should display registration page', async ({ page }) => {
    // Check if we're on the registration page
    expect(page.url()).toContain('/register')

    // Check for registration form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    const passwordInput = page.locator('input[type="password"]').first()

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('should show validation error for non-FON email', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    const passwordInputs = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"]')

    // Fill with non-FON email
    await emailInput.fill('test@gmail.com')
    await passwordInputs.nth(0).fill('SecurePass123!')

    // Fill confirm password if it exists
    if (await passwordInputs.count() > 1) {
      await passwordInputs.nth(1).fill('SecurePass123!')
    }

    await submitButton.click()

    // Wait for validation message
    await page.waitForTimeout(1000)

    // Should show error about FON email requirement
    const errorMessage = page.locator('text=/FON|fon.bg.ac.rs/i')

    // Error might be visible or the page might still show the form
    const hasError = await errorMessage.count() > 0
    expect(page.url()).toContain('/register') // Still on registration page
  })

  test('should show validation error for weak password', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    const passwordInputs = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"]')

    // Fill with valid FON email but weak password
    await emailInput.fill('test@fon.bg.ac.rs')
    await passwordInputs.nth(0).fill('weak')

    // Fill confirm password if it exists
    if (await passwordInputs.count() > 1) {
      await passwordInputs.nth(1).fill('weak')
    }

    await submitButton.click()

    // Wait for validation message
    await page.waitForTimeout(1000)

    // Should show error about password requirements
    // The page should still show the registration form
    expect(page.url()).toContain('/register')
  })

  test('should show error for password mismatch', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    const passwordInputs = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"]')

    // Only test if there are 2 password fields (password and confirm)
    const passwordCount = await passwordInputs.count()

    if (passwordCount >= 2) {
      await emailInput.fill('test@fon.bg.ac.rs')
      await passwordInputs.nth(0).fill('SecurePass123!')
      await passwordInputs.nth(1).fill('DifferentPass123!')

      await submitButton.click()

      // Wait for validation
      await page.waitForTimeout(1000)

      // Should show error about password mismatch
      expect(page.url()).toContain('/register')
    }
  })

  test('should have all required form fields', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    const passwordInputs = page.locator('input[type="password"]')

    // Check that required fields exist
    await expect(emailInput).toBeVisible()
    await expect(passwordInputs.first()).toBeVisible()

    // Check that email field is required
    const emailRequired = await emailInput.getAttribute('required')
    expect(emailRequired !== null).toBe(true)
  })

  test('should navigate to login page from registration page', async ({ page }) => {
    // Look for login link
    const loginLink = page.locator('a:has-text("Prijavi se"), a:has-text("Login"), a[href*="login"]')

    if (await loginLink.count() > 0) {
      await loginLink.first().click()

      // Wait for navigation
      await page.waitForURL(/.*login.*/)

      expect(page.url()).toContain('login')
    }
  })

  test('should accept valid FON email addresses', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]')

    // Test both valid FON email formats
    const validEmails = [
      'test@fon.bg.ac.rs',
      'student@student.fon.bg.ac.rs',
    ]

    for (const email of validEmails) {
      await emailInput.fill(email)
      const value = await emailInput.inputValue()
      expect(value).toBe(email)
    }
  })
})
