import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/StatVision/);
});

test('renders brand name', async ({ page }) => {
  await page.goto('/');
  const brand = page.locator('text=StatVision');
  await expect(brand).toBeVisible();
});
