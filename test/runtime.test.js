import assert from 'node:assert/strict';
import test from 'node:test';
import {
  escapeHtml,
  iconFor,
  parseRoute,
  renderMarkdown,
  slugify,
  splitDocument,
  uniqueIcons,
} from '../src/runtime/reader.js';
import { metricLabel, tipFor, appVersionTip, normVersionTip } from '../src/runtime/metrics.js';
import { footerHtml, sourceLabel } from '../src/runtime/footer.js';

test('[NORM-READER-02] a heading becomes a slug', () => {
  assert.equal(slugify('Install & setup!'), 'install-setup');
});

test('[NORM-READER-02] a document is split at level-two headings', () => {
  const doc = splitDocument({
    slug: 'readme',
    title: 'README',
    markdown: '# Demo\n\nHello.\n\n## Install\n\nText.\n',
  });
  assert.deepEqual(doc.pages.map((page) => page.title), ['Overview', 'Install']);
  assert.equal(doc.pages[1].markdown, 'Text.');
});

test('[NORM-READER-03] sections pick an icon and fall back to a dot', () => {
  assert.equal(iconFor('Install'), 'install');
  assert.equal(iconFor('Something unknown'), 'dot');
  assert.equal(new Set(uniqueIcons(['Install', 'Install', 'Tests'])).size, 3);
});

test('[NORM-READER-04] html is escaped before markup is added', () => {
  assert.equal(escapeHtml('<b>x</b>'), '&lt;b&gt;x&lt;/b&gt;');
  assert.match(renderMarkdown('**bold** and `code`'), /<strong>bold<\/strong>/);
});

test('[NORM-LINKS-01] a doc route parses into view, doc and section', () => {
  assert.deepEqual(parseRoute('#/docs/readme/install'), {
    view: 'docs',
    doc: 'readme',
    section: 'install',
  });
});

test('[NORM-FOOTER-02] metric labels show count and coverage, never a fake zero', () => {
  assert.equal(metricLabel('Unit', { tests: 29, coverage: 95.63, failures: 0 }), 'Unit 29 · 95.63 %');
  assert.equal(metricLabel('Unit', { tests: 0 }), 'Unit not executed');
  assert.equal(metricLabel('Unit', { tests: 12 }), 'Unit 12 · coverage not measured');
  assert.equal(metricLabel('E2E', null), 'E2E not executed');
});

test('[NORM-FOOTER-03] a tooltip has three rows and a missing run says one word', () => {
  assert.match(tipFor({ measuredAt: '2026-10-27T18:15', durationSeconds: 0.4, perTest: 0.01 }), /Measured/);
  assert.equal(tipFor(null), 'not executed');
});

test('[NORM-VERSION-01] the app tooltip names the app and opens SPECS', () => {
  assert.equal(appVersionTip('taler', '1.2.0'), 'taler 1.2.0 — open SPECS');
  assert.equal(normVersionTip('2.0.0'), 'Norm 2.0.0 — the rules this app follows');
});

test('[NORM-FOOTER-01] the footer has six items in order with no icon repeat', () => {
  const html = footerHtml({ app: { name: 'taler', version: '1.2.0' }, source: 'https://github.com/suadin/taler', normVersion: '2.0.0' });
  for (const id of ['readme', 'specs', 'norm']) assert.ok(html.includes(`id="${id}"`));
  assert.ok(html.includes('id="unit-metrics"'));
  assert.ok(html.includes('id="e2e-metrics"'));
  assert.match(html, /README.*SPECS.*NORM.*source.*Unit.*E2E/s);
  assert.equal(sourceLabel('https://github.com/suadin/taler'), 'suadin/taler');
});
