import { test, expect } from '@playwright/test';

test.describe('Admin Governance', () => {
  test('admin can access dashboard and view identity matrix', async ({ page }) => {
    // 1. Visit admin login (using the mock bypass usually or standard login if shared)
    // For this app, admin dashboard is at /admin/dashboard
    await page.goto('/admin'); // Assuming this triggers login or is the landing
    
    // Fill credentials if needed, otherwise verify access if already authorized in session
    // Since we are starting fresh, we might need to go to /login or a specific admin login
    await page.goto('/admin/dashboard');

    // Verify metrics are loaded
    await expect(page.locator('h1')).toContainText(/Central Command/i);
    await expect(page.locator('text=Total Users')).toBeVisible();

    // 2. Navigate to User Management (Identity Matrix)
    // Often accessible via sidebar. Let's try direct navigation first
    await page.goto('/admin/dashboard/users');
    await expect(page.locator('h1')).toContainText(/Identity Matrix/i);

    // 3. Search for a user
    await page.fill('input[placeholder*="Scan identification"]', 'danyal');
    
    // Verify results appear
    const userCard = page.locator('h4:has-text("Danyal")');
    await expect(userCard).toBeVisible();

    // 4. Click a user to see details (Node Audit)
    await userCard.click();
    await expect(page.locator('h3:has-text("Node Audit")')).toBeVisible();
    await expect(page.locator('button:has-text("Isolate Node")')).toBeVisible();
  });

  test('admin can audit payments', async ({ page }) => {
    await page.goto('/admin/dashboard/payments');
    await expect(page.locator('h1')).toContainText(/Revenue Terminal/i);
    
    // Check for ledger items
    const ledger = page.locator('table >> tbody >> tr');
    // If table implementation doesn't use standard table tag, adjust selector
    // In our implementation it used a grid/list often. Let's check for "TRX-"
    await expect(page.locator('text=TRX-').first()).toBeVisible();
  });
});
