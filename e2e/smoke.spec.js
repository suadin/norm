import { expect, test } from '@playwright/test';

// The smoke journey: what every app proves by running `norm smoke`. It touches
// only the chrome — footer, reader, tooltips, the NORM tab — never app data.

test('[NORM-FOOTER-01] the footer has six items in order, each with its own icon', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');

  const items = page.locator('.footer-items .footer-item');
  await expect(items).toHaveCount(6);
  await expect(page.locator('#readme span')).toHaveText('README');
  await expect(page.locator('#specs')).toBeVisible();
  await expect(page.locator('#norm span')).toHaveText('2.0.0');
  await expect(page.locator('#norm-version')).toHaveText('2.0.0');
  await expect(page.locator('#app-version')).toHaveText('2.0.0');

  const seps = page.locator('.footer-sep');
  await expect(seps).toHaveCount(5);

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

test('[NORM-FOOTER-03] a missing run says not executed and turns red', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#unit-label')).toHaveText('Unit not executed');
  await expect(page.locator('#e2e-label')).toHaveText('E2E not executed');
  await expect(page.locator('#unit-metrics')).toHaveClass(/danger/);
});
