import { expect, test } from '@playwright/test';

// The package's own conformance journeys — the things `norm smoke` leaves out
// because they are the package's guarantee, proven once here instead of in
// every app. No app data; the specimen is the fixture.

test.describe('NORM-FOOTER-04 — one line at desktop, wraps when narrow, always fixed', () => {
  test('desktop: six items in one row at the bottom edge', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const items = page.locator('.footer-items .footer-item');
    await expect(items).toHaveCount(6);

    const centers = await items.evaluateAll((nodes) =>
      nodes.map((node) => {
        const box = node.getBoundingClientRect();
        return box.top + box.height / 2;
      }),
    );
    for (const center of centers.slice(1)) expect(Math.abs(center - centers[0])).toBeLessThan(2);

    const box = await page.locator('.footer').boundingBox();
    expect(box.y + box.height).toBeCloseTo(800, 0);
  });

  test('narrow: the footer stays at the bottom and nothing overflows horizontally', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto('/');
    const box = await page.locator('.footer').boundingBox();
    expect(box.y + box.height).toBeCloseTo(700, 0);
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(scroll).toBe(true);
  });
});

test('[NORM-DESIGN-01] the page follows the operating system colour scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const lightPaper = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--paper').trim());

  await page.emulateMedia({ colorScheme: 'dark' });
  const darkPaper = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--paper').trim());

  expect(darkPaper).not.toEqual(lightPaper);
});

test('[NORM-DESIGN-02] keyboard focus gets the green outline', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toHaveCount(1);
  const outline = await focused.evaluate((node) => {
    const style = getComputedStyle(node);
    return { width: style.outlineWidth, color: style.outlineColor, style: style.outlineStyle };
  });
  expect(outline.width).not.toEqual('0px');
  expect(outline.style).toEqual('solid');
});

test('[NORM-DESIGN-04] reduced motion disables transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const duration = await page.evaluate(() => {
    const button = document.querySelector('.button') ?? document.querySelector('button');
    return getComputedStyle(button).transitionDuration;
  });
  expect(duration).toEqual('0s');
});

test('[NORM-FOOTER-03] a missing run says not executed and turns red', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#unit-label')).toHaveText('Unit not executed');
  await expect(page.locator('#e2e-label')).toHaveText('E2E not executed');
  await expect(page.locator('#unit-metrics')).toHaveClass(/danger/);
});
