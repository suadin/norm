#!/usr/bin/env node
// The Norm CLI. Grows command by command.
//   norm vendor --dir <dir> --version <v>   write <dir>/norm/ from the runtime
//   norm check  [--root <dir>]              static conformance

import { resolve } from 'node:path';
import { check } from '../src/check.js';
import { vendor } from '../src/vendor.js';
import { packageVersion } from '../src/config.js';

function flag(argv, name) {
  const index = argv.indexOf(name);
  return index >= 0 && argv[index + 1] !== undefined ? argv[index + 1] : null;
}

const [command, ...rest] = process.argv.slice(2);

async function main() {
  if (command === 'vendor') {
    const dir = flag(rest, '--dir') ?? 'site';
    const version = flag(rest, '--version') ?? packageVersion();
    const target = vendor(resolve(dir), { version });
    console.log(`norm: vendored ${version} into ${target}`);
    return;
  }
  if (command === 'check') {
    const root = resolve(flag(rest, '--root') ?? '.');
    process.exitCode = check(root);
    return;
  }
  console.error('norm: unknown or missing command. Try `norm vendor` or `norm check`.');
  process.exitCode = 1;
}

main();
