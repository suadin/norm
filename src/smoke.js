// `norm smoke`: run the package's browser gate against an app. The app serves
// its vendor directory (or a running server) and the package's own spec proves
// the chrome — footer, reader, tabs, reload — with no app data involved.

import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SPEC = join(HERE, '..', 'e2e', 'smoke.spec.js');
const CONFIG = join(HERE, '..', 'e2e', 'playwright.config.js');

export function smoke({ dir, url }) {
  const env = { ...process.env };
  if (dir) env.NORM_SMOKE_DIR = resolve(dir);
  if (url) env.NORM_SMOKE_URL = url;

  const result = spawnSync('pnpm', ['exec', 'playwright', 'test', '--config', CONFIG, SPEC], {
    stdio: 'inherit',
    env,
  });
  return result.status ?? 1;
}
