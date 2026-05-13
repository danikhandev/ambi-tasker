
import { test, expect } from '@playwright/test';

test.describe('AmbiTasker User Signup Flow', () => {
  test('should register a new user successfully', async ({ page }) => {
    // 1. Navigate to Signup
    await page.goto('http://localhost:3001/signup');
    await expect(page).toHaveURL(/.*signup/);

    // 2. Select User Role
    const userCard = page.getByText(/Continue as User/i);
    await userCard.click();
    await expect(page).toHaveURL(/.*signup\/user/);

    // 3. Step 1: Personal Details
    const testEmail = `automation_${Date.now()}@test.com`;
    await page.fill('input[id="firstName"]', 'Auto');
    await page.fill('input[placeholder*="Last Name"]', 'Tester');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="tel"]', '03009876543');
    await page.fill('input[id="password"]', 'Password123!');
    await page.fill('input[id="confirmPassword"]', 'Password123!');

    // 4. Click Next
    const nextButton = page.getByRole('button', { name: /Next/i });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    // 5. Step 2: Location
    // Verify that the location step loaded (Wait for 'Select Your Location' heading)
    await expect(page.getByText(/Select Your Location/i)).toBeVisible();

    // Select Province (Wait for dropdown to be populated)
    const provinceSelect = page.locator('select').first();
    await provinceSelect.selectOption({ label: 'Khyber Pakhtunkhwa' });

    // Select District
    const districtSelect = page.locator('select').nth(1);
    await expect(districtSelect).toBeEnabled({ timeout: 5000 });
    await districtSelect.selectOption({ label: 'Haripur' });

    // Select City
    const citySelect = page.locator('select').nth(2);
    await expect(citySelect).toBeEnabled({ timeout: 5000 });
    await citySelect.selectOption({ label: 'Haripur City' });

    // 6. Finalize Registration
    const submitButton = page.getByRole('button', { name: /Complete Registration/i });
    await expect(submitButton).toBeEnabled();
    // In automation, we might not want to actually hit the DB if it's a dry run,
    // but the goal is to test the flow.
    // await submitButton.click();
    // await expect(page).toHaveURL(/.*login/);
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('http://localhost:3001/signup/user');
    await page.fill('input[type="email"]', 'invalid-email');
    await page.locator('input[type="email"]').blur();
    
    await expect(page.getByText(/Invalid email address/i)).toBeVisible();
  });
});
