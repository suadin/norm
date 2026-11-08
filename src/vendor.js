// The vendor step: write the runtime into the app as a committed, generated
// directory. The app references `<dir>/norm/norm.js` and `norm/norm.css` and
// fetches `norm/NORM.md` for the NORM tab. Nothing here is hand-maintained;
// `norm check` regenerates and compares, so a stale copy is a defect.

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNTIME = join(HERE, 'runtime');

// The module set `norm.js` imports, plus the stylesheet and the logo. No
// dependency graph needed: the runtime has no external dependencies.
const FILES = ['norm.js', 'reader.js', 'icons.js', 'metrics.js', 'footer.js', 'norm.css', 'tokens.svg'];

export function vendor(dir, { version }) {
  const target = join(dir, 'norm');
  mkdirSync(target, { recursive: true });
  for (const file of FILES) {
    copyFileSync(join(RUNTIME, file), join(target, file));
  }
  writeFileSync(join(target, 'NORM.md'), readFileSync(join(HERE, '..', 'NORM.md'), 'utf8'));
  writeFileSync(join(target, 'version.json'), `${JSON.stringify({ version }, null, 2)}\n`);
  return target;
}
