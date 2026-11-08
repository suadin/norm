#!/usr/bin/env node
// The Norm CLI. Thin entry point; the commands live in src/cli.js.
//   norm vendor --dir <dir>          write <dir>/norm/ from the runtime
//   norm check  --root <dir>         static conformance
//   norm docs   --root <dir>         regenerate the runtime file and site docs
//   norm init   --root <dir>         write a norm.json skeleton
//   norm eject  --root <dir>         remove the dependency, keep the files
//   norm smoke  --dir <dir>|--url <u> run the browser gate against the app

import { run } from '../src/cli.js';

run(process.argv.slice(2));
