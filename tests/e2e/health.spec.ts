import { test, expect } from '@playwright/test';

test.describe('System Health Check', () => {
  const apiRoutes = [
    '/api/auth/session',
    '/api/categories',
    '/api/services',
  ];

  for (const route of apiRoutes) {
    test(`API route ${route} is responsive`, async ({ request }) => {
      const response = await request.get(route);
      expect(response.status()).toBeLessThan(500); // 401 is okay if protected, 500 is not
    });
  }

  test('main pages are accessible', async ({ page }) => {
    const pages = ['/', '/login', '/register', '/search'];
    for (const p of pages) {
      const response = await page.goto(p);
      expect(response?.status()).toBe(200);
    }
  });
});
