import { expect, test } from '@playwright/test';

// The smoke journey: what every app proves by running `norm smoke`. It touches
// only the chrome — footer, reader, tabs, reload — never app data and never a
// specific version or metric value, because those belong to the app.

test('[NORM-FOOTER-01] the footer has six items in order, each with its own icon', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');

  const items = page.locator('.footer-items .footer-item');
  await expect(items).toHaveCount(6);
  await expect(page.locator('.footer-sep')).toHaveCount(5);
  await expect(page.locator('#readme span')).toHaveText('README');

  // Versions are present and shaped like a version, but not pinned here.
  await expect(page.locator('#app-version')).toHaveText(/^\d+\.\d+\.\d+$/);
  await expect(page.locator('#norm-version')).toHaveText(/^\d+\.\d+\.\d+$/);

  // A metric label is either measured or "not executed", never empty or a fake zero.
  for (const id of ['#unit-label', '#e2e-label']) {
    await expect(page.locator(id)).toHaveText(/(not executed|\d+ · (\d+\.\d+ %|coverage not measured))/);
  }

  expect(errors).toEqual([]);
});

test('[NORM-READER-01] the footer opens the reader with README, SPECS and NORM tabs', async ({ page }) => {
  await page.goto('/');
  await page.locator('#readme').click();
  await expect(page.locator('#reader')).toBeVisible();
  await expect(page.locator('#home')).toBeHidden();

  const tabs = page.locator('#reader-tabs .reader-tab');
  await expect(tabs).toHaveCount(3);
  await expect(tabs).toHaveText(['README', 'SPECS', 'NORM']);

  await page.locator('#reader-close').click();
  await expect(page.locator('#home')).toBeVisible();
});

test('[NORM-LINKS-01] a reload restores the reader section', async ({ page }) => {
  await page.goto('/#/docs/readme');
  await expect(page.locator('#reader')).toBeVisible();
  await expect(page.locator('#reader-title')).toHaveText('README');
});
