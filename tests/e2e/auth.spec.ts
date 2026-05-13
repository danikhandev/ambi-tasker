import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('successful user login', async ({ page }) => {
    await page.goto('/login');

    // Check for landing elements
    await expect(page.locator('h1')).toContainText('Welcome Back');

    // Fill the login form
    await page.fill('input[type="email"]', 'danyal@gmail.com');
    await page.fill('input[type="password"]', '12345678');

    // Click submit
    await page.click('button[type="submit"]');

    // Verify redirection to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText(/Dashboard|Personal/i);
  });

  test('failed login with wrong credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // Verify error message appearance
    const errorAlert = page.locator('.bg-red-50');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/invalid/i);
  });

  test('sign up navigation', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Create an account');
    await expect(page).toHaveURL(/.*register/);
  });
});
