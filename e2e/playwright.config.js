import { defineConfig } from '@playwright/test';

// The package's own gate. A static file server for the specimen; the browser
// is already required for the conformance journeys, so it lives here once.
export default defineConfig({
  testDir: '.',
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:8123',
    trace: 'off',
  },
  webServer: {
    command: 'python3 -m http.server 8123 --directory ../reference/specimen',
    url: 'http://127.0.0.1:8123',
    reuseExistingServer: true,
  },
});
