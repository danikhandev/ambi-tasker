import { test, expect } from '@playwright/test';

test.describe('Real-Time Chat', () => {
  test('user can initiate and send messages', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'danyal@gmail.com');
    await page.fill('input[type="password"]', '12345678');
    await page.click('button[type="submit"]');

    // 2. Go to Conversations
    // Assuming /dashboard/chat or similar
    await page.goto('/dashboard/chat'); 
    // If it's a floating chat, we might need to open it
    
    // Wait for chat interface
    await expect(page.locator('text=Messages')).toBeVisible();

    // 3. Select a conversation
    const firstConv = page.locator('[class*="conversation-item"]').first();
    // If names are visible
    // const firstConv = page.locator('text=Haroon').first(); 
    await firstConv.click();

    // 4. Send a message
    const messageInput = page.locator('input[placeholder*="message"]');
    await messageInput.fill('Hello, are you available for the plumbing job tomorrow?');
    await page.keyboard.press('Enter');

    // 5. Verify message appears in bubble
    const lastMessage = page.locator('[class*="message-bubble"]').last();
    await expect(lastMessage).toContainText('available for the plumbing job');
  });
});
