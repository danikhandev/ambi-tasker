import { test, expect } from '@playwright/test';

test.describe('Booking Lifecycle', () => {
  test('customer can search and request a booking', async ({ page }) => {
    // 1. Login as a customer first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'danyal@gmail.com');
    await page.fill('input[type="password"]', '12345678');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // 2. Navigate to Search
    await page.goto('/search');
    await expect(page.locator('h1')).toContainText(/Find Top Professionals/i);

    // 3. Search for a specific title or use filtered results
    await page.fill('input[placeholder*="looking for"]', 'Plumber');
    await page.click('button:has-text("Search")');

    // 4. Click on a "Book Now" button on one of the cards
    // The search page has "Book Now" links
    const bookNowButton = page.locator('text=Book Now').first();
    await expect(bookNowButton).toBeVisible();
    await bookNowButton.click();

    // 5. Verify we are on the provider profile with the booking modal intent
    // (The search page links to /search/[id]?book=true which should open the modal)
    // Wait for the modal to appear
    const modal = page.locator('h2:has-text("Book")');
    await expect(modal).toBeVisible();

    // 6. Step 1: Select a service
    await page.click('text=Available Services >> .. >> div >> text=Rs.'); // Click first service
    await page.click('button:has-text("Configure Details")');

    // 7. Step 2: Fill details
    await page.fill('textarea', 'Fixing a leaking tap in the kitchen.');
    
    // Set a future date
    const today = new Date();
    today.setDate(today.getDate() + 2);
    const dateStr = today.toISOString().split('T')[0];
    await page.fill('input[type="date"]', dateStr);

    // Click "Choose Payment"
    await page.click('button:has-text("Choose Payment")');

    // 8. Step 3: Select Payment
    await page.click('text=Cash After Service');
    await page.click('button:has-text("Confirm & Book Now")');

    // 9. Success Step
    await expect(page.locator('h3')).toContainText(/Booking Request Sent/i);
    await expect(page.locator('text=Manage Bookings')).toBeVisible();
  });
});
