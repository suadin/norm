// The static conformance checker. It proves what can be proven without a
// browser: documents, the vendored runtime, the runtime version file, the
// deviations, the rule-to-test mapping, the test surface, the metrics file,
// the declared commands and the absence of secrets. Everything behavioural
// (footer, reader, design, dates) is the package's own suite via `norm smoke`.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, packageVersion, rules } from './config.js';
import { FILES } from './vendor.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(HERE, '..');

const TAG = /\[(NORM|QUALITY)-[A-Z0-9-]+\]/g;
const SKIP = new Set(['.git', 'node_modules', '.venv', '__pycache__', 'dist', 'test-results', '.opencode', '.angular']);
const TEXT_SUFFIXES = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.sh', '.html', '.css', '.md', '.json', '.yaml', '.yml', '.toml']);

function readText(path) {
  return readFileSync(path, 'utf8');
}

function* walkFiles(root, suffixes = null) {
  const entries = readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(path, suffixes);
    } else if (entry.isFile()) {
      const ext = entry.name.slice(entry.name.lastIndexOf('.'));
      if (suffixes && !suffixes.has(ext)) continue;
      yield path;
    }
  }
}

function testFiles(root, config) {
  const configured = config.testFiles;
  if (configured) return configured.map((name) => join(root, name)).filter((p) => existsSync(p));
  const files = [];
  for (const dir of ['test', 'tests', 'e2e']) {
    const base = join(root, dir);
    if (!existsSync(base)) continue;
    for (const path of walkFiles(base, new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.py']))) {
      files.push(path);
    }
  }
  return files;
}

function testNames(root, config) {
  const found = new Map();
  for (const path of testFiles(root, config)) {
    let lines;
    try {
      lines = readText(path).split('\n');
    } catch {
      continue;
    }
    for (const line of lines) {
      for (const match of line.matchAll(TAG)) {
        const tag = match[0].slice(1, -1);
        const label = /test\(\s*['"]([^'"]+)/.exec(line);
        let name = label ? label[1] : line.trim();
        name = name.replace(/\s+/g, ' ').slice(0, 180);
        const names = found.get(tag) ?? [];
        if (!names.includes(name)) names.push(name);
        found.set(tag, names);
      }
    }
  }
  for (const [rule, names] of Object.entries(config.tests ?? {})) {
    const list = found.get(rule) ?? [];
    for (const name of names) if (!list.includes(name)) list.push(name);
    found.set(rule, list);
  }
  return found;
}

export function vendorDir(config) {
  return config.vendorDir ?? 'site';
}

export function runtimeText(config, normVersion) {
  return JSON.stringify({
    app: config.name,
    appVersion: config.appVersion,
    norm: normVersion,
  }, null, 2) + '\n';
}

export function runtimePath(root, config) {
  return join(root, config.runtime ?? `${vendorDir(config)}/norm/app.json`);
}

export function checkDocuments(root, config, errors) {
  if (!existsSync(join(root, 'README.md'))) errors.push('README.md is missing');
  const docs = config.docs ?? {};
  const appSpecs = docs.appSpecs ?? 'docs/APP-SPECS.md';
  const releaseNotes = docs.releaseNotes ?? 'RELEASE-NOTES.md';
  if (!existsSync(join(root, appSpecs))) errors.push(`${appSpecs} is missing`);
  if (!existsSync(join(root, releaseNotes))) errors.push(`${releaseNotes} is missing`);
  if (!config.appVersion) errors.push('norm.json has no appVersion');
  if (!config.name) errors.push('norm.json has no name');
}

export function checkVendor(root, config, errors) {
  const dir = join(root, vendorDir(config), 'norm');
  const normVersion = packageVersion();
  for (const file of FILES) {
    const app = join(dir, file);
    const source = join(HERE, 'runtime', file);
    if (!existsSync(app)) {
      errors.push(`norm/${file} is missing; run norm vendor`);
    } else if (readText(app) !== readText(source)) {
      errors.push(`norm/${file} differs from the package; run norm vendor`);
    }
  }
  const norm = join(dir, 'NORM.md');
  if (!existsSync(norm)) errors.push('norm/NORM.md is missing; run norm vendor');
  else if (readText(norm) !== readText(join(PACKAGE_ROOT, 'NORM.md'))) errors.push('norm/NORM.md differs from the package; run norm vendor');

  const versionFile = join(dir, 'version.json');
  if (!existsSync(versionFile)) {
    errors.push('norm/version.json is missing; run norm vendor');
  } else {
    const pinned = JSON.parse(readText(versionFile)).version;
    if (pinned !== normVersion) errors.push(`norm pins ${pinned}, the package is ${normVersion}`);
  }
}

export function checkRuntime(root, config, errors) {
  const path = runtimePath(root, config);
  if (!existsSync(path)) {
    errors.push(`${relative(root, path)} is missing; run norm docs`);
    return;
  }
  if (readText(path) !== runtimeText(config, packageVersion())) {
    errors.push(`${relative(root, path)} is not generated; run norm docs`);
  }
}

export function checkAllow(config, errors) {
  const known = new Set(rules().map((rule) => rule.id));
  for (const item of config.allow ?? []) {
    const rule = item.rule;
    if (!known.has(rule)) errors.push(`allow names unknown rule: ${rule}`);
    if (!item.reason) errors.push(`allow ${rule} has no reason`);
    if (!item.review) {
      errors.push(`allow ${rule} has no review date`);
    } else {
      const review = new Date(`${item.review}T00:00:00`);
      if (Number.isNaN(review.getTime())) errors.push(`allow ${rule} has an invalid review date: ${item.review}`);
      else if (review < new Date()) errors.push(`allow ${rule} expired on ${item.review}`);
    }
  }
}

export function checkRuleTests(root, config, errors) {
  const names = testNames(root, config);
  const allowed = new Set((config.allow ?? []).map((item) => item.rule));
  const profiles = new Set(config.profiles ?? []);
  for (const rule of rules()) {
    if (rule.level !== 'MUST') continue;
    if (!rule.profiles.some((profile) => profiles.has(profile))) continue;
    if (allowed.has(rule.id)) continue;
    if (rule.test === 'package') continue; // the package's own suite covers it
    if (rule.test === true && !names.has(rule.id)) errors.push(`${rule.id} has no test carrying its tag`);
    if (rule.check == null && rule.test == null) errors.push(`${rule.id} has neither a test nor a built-in check`);
  }
}

export function checkTests(root, config, errors) {
  const profiles = new Set(config.profiles ?? []);
  if (!profiles.has('web-static') && !profiles.has('web-server')) return;
  if (testFiles(root, config).length === 0) errors.push('no unit or E2E test files found');
  if (!existsSync(join(root, 'e2e'))) errors.push('e2e/ is missing');
}

export function checkMetrics(root, config, errors) {
  const name = config.metrics;
  if (!name) return;
  const path = join(root, name);
  if (!existsSync(path)) {
    errors.push(`metrics file is missing: ${name}`);
    return;
  }
  let metrics;
  try {
    metrics = JSON.parse(readText(path));
  } catch (exc) {
    errors.push(`metrics file is not valid JSON: ${exc.message}`);
    return;
  }
  const coverageAllowed = new Set((config.allow ?? []).map((item) => item.rule)).has('NORM-TESTS-02');
  if (!coverageAllowed) {
    for (const suite of ['unit', 'e2e']) {
      const item = metrics[suite];
      if (item && typeof item === 'object') {
        const total = item.tests ?? item.total ?? 0;
        if (total && item.coverage == null) errors.push(`${suite} has tests but no line coverage`);
      }
    }
  }
  if (!metrics.unit) errors.push('metrics has no unit result');
}

export function checkCommands(root, config, errors) {
  const commands = config.commands ?? {};
  const profiles = new Set(config.profiles ?? []);
  if (profiles.has('web-static') || profiles.has('web-server')) {
    for (const name of ['unit', 'e2e', 'metrics']) {
      if (!commands[name]) errors.push(`commands.${name} is missing for a web profile`);
    }
  }
  for (const profile of ['quality-typescript', 'quality-python']) {
    if (profiles.has(profile)) {
      const required = profile === 'quality-typescript' ? ['lint', 'typecheck'] : ['lint', 'format'];
      for (const name of required) {
        if (!commands[name]) errors.push(`commands.${name} is missing for ${profile}`);
      }
    }
  }
}

export function checkSecrets(root, errors) {
  const patterns = [
    /github_pat_[A-Za-z0-9_]{20,}/,
    /ghp_[A-Za-z0-9]{30,}/,
    /sk-[A-Za-z0-9]{30,}/,
  ];
  for (const path of walkFiles(root, TEXT_SUFFIXES)) {
    if (path.endsWith('.env') || path.endsWith('norm.json')) continue;
    let text;
    try {
      text = readText(path);
    } catch {
      continue;
    }
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        errors.push(`possible secret in ${relative(root, path)}`);
        break;
      }
    }
  }
}

export function runChecks(root, config) {
  const errors = [];
  checkDocuments(root, config, errors);
  checkVendor(root, config, errors);
  checkRuntime(root, config, errors);
  checkAllow(config, errors);
  checkRuleTests(root, config, errors);
  checkTests(root, config, errors);
  checkMetrics(root, config, errors);
  checkCommands(root, config, errors);
  checkSecrets(root, errors);
  return errors;
}

export function check(root) {
  const config = loadConfig(root);
  if (!config) {
    console.error('norm: norm.json is missing');
    return 2;
  }
  const errors = runChecks(root, config);
  if (errors.length) {
    for (const error of errors) console.error(`norm: error: ${error}`);
    console.error(`norm: ${errors.length} error(s)`);
    return 1;
  }
  console.log(`norm: ${packageVersion()} ok — ${config.name ?? root}`);
  return 0;
}
