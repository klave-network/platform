import { test, expect } from '@playwright/test';

test('Has login button', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('nav');

    // Expect h1 to contain a substring.
    expect(await page.locator('nav').innerText()).toContain('Log in');
});
