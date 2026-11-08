import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { packageVersion, rules } from '../src/config.js';
import { runtimeText, runChecks } from '../src/check.js';
import { vendor } from '../src/vendor.js';

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'norm-fixture-'));
  mkdirSync(join(root, 'docs'), { recursive: true });
  mkdirSync(join(root, 'test'), { recursive: true });
  mkdirSync(join(root, 'e2e'), { recursive: true });

  writeFileSync(join(root, 'README.md'), '# Demo\n');
  writeFileSync(join(root, 'RELEASE-NOTES.md'), '# Releases\n');
  writeFileSync(join(root, 'docs', 'APP-SPECS.md'), '# Demo app\n');
  writeFileSync(join(root, 'test', 'demo.test.js'), "test('[NORM-FOOTER-01] footer items', () => {});\n");
  writeFileSync(join(root, 'e2e', 'demo.spec.js'), "test('[NORM-FOOTER-01] footer items', () => {});\n");

  vendor(join(root, 'site'), { version: packageVersion() });

  const config = {
    name: 'demo',
    appVersion: '1.0.0',
    vendorDir: 'site',
    profiles: ['web-static'],
    docs: { appSpecs: 'docs/APP-SPECS.md', releaseNotes: 'RELEASE-NOTES.md' },
    runtime: 'site/norm/app.json',
    metrics: 'site/test-metrics.json',
    commands: { unit: 'true', e2e: 'true', metrics: 'true' },
    allow: rules()
      .filter((rule) => rule.profiles.includes('web-static') && rule.level === 'MUST' && rule.id !== 'NORM-FOOTER-01' && rule.test === true)
      .map((rule) => ({ rule: rule.id, reason: 'fixture', review: '2099-01-01' })),
  };
  writeFileSync(join(root, 'norm.json'), JSON.stringify(config, null, 2) + '\n');
  writeFileSync(join(root, 'site', 'norm', 'app.json'), runtimeText(config, packageVersion()));
  writeFileSync(join(root, 'site', 'test-metrics.json'), JSON.stringify({
    unit: { tests: 1, coverage: 100 },
    e2e: { tests: 1, coverage: 100 },
  }, null, 2) + '\n');

  return { root, config };
}

test('[NORM-TESTS-03] a conforming app passes every static check', () => {
  const { root, config } = fixture();
  assert.deepEqual(runChecks(root, config), []);
});

test('[NORM-DOCS-02] a hand-edited vendored file is a defect', () => {
  const { root, config } = fixture();
  writeFileSync(join(root, 'site', 'norm', 'norm.js'), '// hand edit\n');
  const errors = runChecks(root, config);
  assert.ok(errors.some((error) => error.includes('norm.js differs')));
});

test('[NORM-VERSION-02] a runtime file that drifted is a defect', () => {
  const { root, config } = fixture();
  writeFileSync(join(root, 'site', 'norm', 'app.json'), runtimeText({ ...config, appVersion: '9.9.9' }, packageVersion()));
  assert.ok(runChecks(root, config).some((error) => error.includes('app.json')));
});

test('an expired deviation is a defect', () => {
  const { root, config } = fixture();
  config.allow.push({ rule: 'NORM-DATA-02', reason: 'fixture', review: '2000-01-01' });
  writeFileSync(join(root, 'norm.json'), JSON.stringify(config, null, 2) + '\n');
  assert.ok(runChecks(root, config).some((error) => error.includes('expired')));
});

test('[NORM-DATA-02] an unapproved MUST rule without a test tag is a defect', () => {
  const { root, config } = fixture();
  config.profiles = ['web-server'];
  // NORM-DATA-02 is test:true and not allowed, no tag in the fixture tests.
  writeFileSync(join(root, 'norm.json'), JSON.stringify(config, null, 2) + '\n');
  assert.ok(runChecks(root, config).some((error) => error === 'NORM-DATA-02 has no test carrying its tag'));
});
