// Read the app manifest and the rule set. One source for each: `norm.json` in
// the app, `rules.json` and `package.json` in the package.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function rules() {
  return readJson(join(HERE, 'rules.json')).rules;
}

export function packageVersion() {
  return readJson(join(HERE, '..', 'package.json')).version;
}

export function loadConfig(root) {
  const path = join(root, 'norm.json');
  return existsSync(path) ? readJson(path) : null;
}
