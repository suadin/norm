#!/usr/bin/env node
// The Norm CLI. Grows command by command; for now it vendors the runtime.
// `norm vendor --dir <dir> --version <v>` writes <dir>/norm/ from the runtime.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vendor } from '../src/vendor.js';

const HERE = dirname(fileURLToPath(import.meta.url));

function readVersion() {
  try {
    return JSON.parse(readFileSync(join(HERE, '..', 'package.json'), 'utf8')).version;
  } catch {
    return '0.0.0';
  }
}

function flag(argv, name) {
  const index = argv.indexOf(name);
  return index >= 0 && argv[index + 1] !== undefined ? argv[index + 1] : null;
}

const [command, ...rest] = process.argv.slice(2);

async function main() {
  if (command === 'vendor') {
    const dir = flag(rest, '--dir') ?? 'site';
    const version = flag(rest, '--version') ?? readVersion();
    const target = vendor(resolve(dir), { version });
    console.log(`vendored ${version} into ${target}`);
    return;
  }
  console.error('norm: unknown or missing command. Try `norm vendor --dir <dir>`.');
  process.exitCode = 1;
}

main();
