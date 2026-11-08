import { defineConfig } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// One config, two consumers: the package's own gate (target the specimen) and
// `norm smoke` (target an app). The target comes from the environment, so the
// spec never hard-codes a directory or a URL.
const here = dirname(fileURLToPath(import.meta.url));
const dir = process.env.NORM_SMOKE_DIR;
const url = process.env.NORM_SMOKE_URL;
const baseURL = url ?? 'http://127.0.0.1:8123';

export default defineConfig({
  testDir: here,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'off',
  },
  webServer: dir
    ? {
        command: `python3 -m http.server 8123 --directory ${resolve(dir)}`,
        url: baseURL,
        reuseExistingServer: true,
      }
    : undefined,
});
