// The CLI command handlers. Each command is a pure function on (root, config)
// so the surface stays testable without shelling out.

import { basename, join, resolve } from 'node:path';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { check, runtimePath, runtimeText } from './check.js';
import { loadConfig, packageVersion } from './config.js';
import { vendor } from './vendor.js';

export function commandVendor(argv) {
  const dir = flag(argv, '--dir') ?? 'site';
  const version = flag(argv, '--version') ?? packageVersion();
  const target = vendor(resolve(dir), { version });
  console.log(`norm: vendored ${version} into ${target}`);
}

export function commandCheck(argv) {
  const root = resolve(flag(argv, '--root') ?? '.');
  process.exitCode = check(root);
}

export function commandDocs(argv) {
  const root = resolve(flag(argv, '--root') ?? '.');
  const config = loadConfig(root);
  if (!config) return missing(root);
  writeFileSync(runtimePath(root, config), runtimeText(config, packageVersion()));

  const dir = join(root, vendorDir(config), 'docs');
  mkdirSync(dir, { recursive: true });
  copyFileSync(join(root, 'README.md'), join(dir, 'README.md'));
  const releaseNotes = config.docs?.releaseNotes ?? 'RELEASE-NOTES.md';
  copyFileSync(join(root, releaseNotes), join(dir, basename(releaseNotes)));
  const docs = join(root, 'docs');
  if (existsSync(docs)) {
    for (const name of readdirSync(docs)) {
      if (name.endsWith('.md')) copyFileSync(join(docs, name), join(dir, name));
    }
  }
  console.log(`norm: wrote ${vendorDir(config)}/docs and ${relativeTo(root, runtimePath(root, config))}`);
}

export function commandInit(argv) {
  const root = resolve(flag(argv, '--root') ?? '.');
  const path = join(root, 'norm.json');
  if (existsSync(path)) {
    console.error('norm: norm.json already exists');
    process.exitCode = 2;
    return;
  }
  const config = {
    name: flag(argv, '--name') ?? basename(root),
    appVersion: '0.1.0',
    vendorDir: 'site',
    source: '',
    profiles: (flag(argv, '--profile') ?? 'web-static').split(','),
    docs: { appSpecs: 'docs/APP-SPECS.md', releaseNotes: 'RELEASE-NOTES.md' },
    runtime: 'site/norm/app.json',
    metrics: 'site/test-metrics.json',
    commands: { unit: 'pnpm test', e2e: 'pnpm test:e2e', metrics: 'pnpm metrics' },
    allow: [],
  };
  writeFileSync(path, JSON.stringify(config, null, 2) + '\n');
  console.log(`norm: wrote ${path}`);
}

export function commandEject(argv) {
  const root = resolve(flag(argv, '--root') ?? '.');
  const config = loadConfig(root);
  const json = join(root, 'norm.json');
  if (existsSync(json)) {
    rmSync(json);
    console.log('norm: removed norm.json');
  }
  const pkgPath = join(root, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    let changed = false;
    for (const field of ['dependencies', 'devDependencies']) {
      if (pkg[field]?.['@suadin/norm'] !== undefined) {
        delete pkg[field]['@suadin/norm'];
        changed = true;
      }
    }
    if (changed) writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
  if (config) {
    const dir = join(root, vendorDir(config), 'norm');
    console.log(`norm: ${existsSync(dir) ? `${vendorDir(config)}/norm stays as your own files` : 'no vendored files to keep'}`);
    console.log('norm: remove the guarded import from your page and you are standalone');
  }
}

function vendorDir(config) {
  return config.vendorDir ?? 'site';
}

function relativeTo(root, path) {
  return path.startsWith(root) ? path.slice(root.length + 1) : path;
}

function missing(root) {
  console.error('norm: norm.json is missing');
  process.exitCode = 2;
}

function flag(argv, name) {
  const index = argv.indexOf(name);
  return index >= 0 && argv[index + 1] !== undefined ? argv[index + 1] : null;
}

export function run(argv) {
  const [command, ...rest] = argv;
  if (command === 'vendor') return commandVendor(rest);
  if (command === 'check') return commandCheck(rest);
  if (command === 'docs') return commandDocs(rest);
  if (command === 'init') return commandInit(rest);
  if (command === 'eject') return commandEject(rest);
  console.error('norm: unknown or missing command. Try `norm vendor`, `norm check`, `norm docs`, `norm init` or `norm eject`.');
  process.exitCode = 1;
}
