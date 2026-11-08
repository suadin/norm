import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// NORM-OPT-01 as a browser proof: an app with no vendored runtime still
// renders its content and reports no uncaught error. This is the seam the
// package may never close.

const here = dirname(fileURLToPath(import.meta.url));
const fixture = join(here, '..', 'test', 'fixtures', 'eject-app');

let server;

test.beforeAll(async () => {
  server = createServer((req, res) => {
    const name = req.url === '/' ? 'index.html' : req.url.slice(1);
    try {
      res.setHeader('Content-Type', name.endsWith('.js') ? 'application/javascript' : 'text/html');
      res.end(readFileSync(join(fixture, name)));
    } catch {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
});

test.afterAll(() => server?.close());

test('[NORM-OPT-01] an app renders its content without the package', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(`http://127.0.0.1:${server.address().port}/`);

  await expect(page.locator('#content')).toHaveText('app content');
  await expect(page.locator('#status')).toHaveText('ok');
  await expect(page.locator('#norm-footer')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
