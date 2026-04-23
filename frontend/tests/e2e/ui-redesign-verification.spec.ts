import { test, expect } from '@playwright/test';

test.describe('StatVision: "Night Stadium" UI Redesign Verification', () => {
  
  test.beforeEach(async ({ page }) => {
    // Enable mock authentication via environment variables
    // Note: In a real Playwright setup, these would be passed via process.env 
    // or handled by the mock provider logic we implemented.
    await page.goto('/dashboard');
  });

  test('Command Center renders with Night Stadium aesthetic', async ({ page }) => {
    // Check for the new bold header
    await expect(page.locator('h1')).toContainText('COMMAND CENTER');
    
    // Check for the "Refined Courtside" dark background
    const body = page.locator('body');
    await expect(body).toHaveCSS('background-color', 'rgb(12, 14, 16)'); // --bg-stadium (#0c0e10)

    // Check for the Electric Blue accent
    const statusText = page.locator('text=Status: Active Analysis');
    await expect(statusText).toHaveCSS('color', 'rgb(0, 209, 255)'); // --primary-electric (#00D1FF)

    // Verify Glassmorphism elements exist
    const frostedElements = page.locator('.frosted-glass');
    await expect(frostedElements.first()).toBeVisible();

    // Take screenshot of Command Center
    await page.screenshot({ path: 'ui_verification/dashboard_automation.png', fullPage: true });
  });

  test('Elite Analytics page features high-fidelity visualizations', async ({ page }) => {
    await page.goto('/stats');
    
    // Check for Editorial Header
    await expect(page.locator('h1')).toContainText('ELITE ANALYTICS');

    // Take screenshot of Analytics
    await page.screenshot({ path: 'ui_verification/analytics_automation.png', fullPage: true });

    // Verify Court Heatmap section
    await expect(page.locator('text=Shot Density Map')).toBeVisible();
    
    // Verify Radar Chart / Archetype section
    await expect(page.locator('text=Offensive Archetype')).toBeVisible();
    await expect(page.locator('text=Elite Sniper')).toBeVisible();

    // Check for the "Coach's Brief"
    await expect(page.locator('text=AI Scout Insight')).toBeVisible();
  });

  test('Stadium Gallery shows high-performance game cards', async ({ page }) => {
    await page.goto('/games');
    
    await expect(page.locator('h1')).toContainText('STADIUM GALLERY');
    
    // Check for the Park Setup button
    const parkBtn = page.locator('text=Park Setup');
    await expect(parkBtn).toBeVisible();
    await expect(parkBtn).toHaveCSS('background-color', 'rgb(17, 20, 22)'); // --bg-container-low (#111416)
  });

  test('Park Mode flow is low-friction', async ({ page }) => {
    await page.goto('/games/park-setup');
    
    await expect(page.locator('h1')).toContainText('QUICK START');
    
    // Verify team color bubbles exist
    const colorBubbles = page.locator('button[style*="background-color"]');
    await expect(colorBubbles).toHaveCount(10); // 5 for home, 5 for away

    // Check for the high-energy "START RUN" button
    const startBtn = page.locator('text=Start Analysis Run');
    await expect(startBtn).toBeVisible();
  });
});
