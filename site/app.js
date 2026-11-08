// The Norm specimen: this page is the package's own demo, so it mounts the
// runtime it ships. A real app writes the same guarded import and nothing else.

import { mountNorm } from './norm/norm.js';

await mountNorm({
  app: { name: 'Norm', version: '2.0.0', logo: 'tokens.svg' },
  source: 'https://github.com/suadin/norm',
  normVersion: '2.0.0',
  docs: [
    { slug: 'readme', title: 'README', file: 'README.md' },
    { slug: 'app-specs', title: 'SPECS', file: 'docs/APP-SPECS.md', changelog: 'RELEASE-NOTES.md' },
    { slug: 'norm', title: 'NORM', file: 'norm/NORM.md' },
  ],
});
