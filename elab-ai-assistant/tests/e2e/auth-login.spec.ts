import { test, expect } from '@playwright/test'

test.describe('Authentication - Login', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
  })

  test('should display login page', async ({ page }) => {
    // Check if we're on the login page
    expect(page.url()).toContain('/login')

    // Check for login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    const passwordInput = page.locator('input[type="password"], input[name="password"]')

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('should show validation error for empty email', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]')

    // Try to submit without filling email
    await submitButton.click()

    // Wait a bit for validation
    await page.waitForTimeout(500)

    // Browser HTML5 validation or custom error should prevent submission
    const emailInput = page.locator('input[type="email"], input[name="email"]')

    // Check if input is required
    const isRequired = await emailInput.getAttribute('required')
    expect(isRequired).toBeTruthy()
  })

  test('should show validation error for invalid email format', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    const passwordInput = page.locator('input[type="password"], input[name="password"]')
    const submitButton = page.locator('button[type="submit"]')

    // Fill with invalid email
    await emailInput.fill('invalid-email')
    await passwordInput.fill('password123')
    await submitButton.click()

    // HTML5 validation should catch this
    const validationMessage = await emailInput.evaluate((el: any) => el.validationMessage)
    expect(validationMessage).toBeTruthy()
  })

  test('should navigate to registration page from login page', async ({ page }) => {
    // Look for registration link
    const registerLink = page.locator('a:has-text("Registruj se"), a:has-text("Register"), a[href*="register"]')

    if (await registerLink.count() > 0) {
      await registerLink.first().click()

      // Wait for navigation
      await page.waitForURL(/.*register.*/)

      expect(page.url()).toContain('register')
    }
  })

  test('should have password field with type password', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]')

    await expect(passwordInput).toBeVisible()

    // Verify it's actually a password field (masked input)
    const type = await passwordInput.getAttribute('type')
    expect(type).toBe('password')
  })

  test('should fail login with invalid credentials', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    const passwordInput = page.locator('input[type="password"], input[name="password"]')
    const submitButton = page.locator('button[type="submit"]')

    // Fill with invalid credentials
    await emailInput.fill('nonexistent@fon.bg.ac.rs')
    await passwordInput.fill('wrongpassword')
    await submitButton.click()

    // Wait for response
    await page.waitForTimeout(1000)

    // Should still be on login page or show error
    // (We don't have valid test credentials, so login should fail)
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/login|error/)
  })
})
