# Norm

The reusable base for a small web app whose primary reader is a future AI session.
It covers the documentation reader, the footer, links, layout, design, dates, data,
tests and quality checks — as a package, not as a copy.

The normative text is [`NORM.md`](NORM.md). The package is `@suadin/norm`; the CLI is
`norm`. An app declares itself in `norm.json`, vendors the runtime with `norm vendor`
and proves it with `norm check`. The rules are read inside the app through the NORM
tab, which the package carries with it.

The footer shows the app version and the Norm version. The app version opens SPECS; the
Norm version opens NORM. SPECS starts with a Changelog page.

## The three layers

- **`norm.css`** — design tokens and components (card, button, field, badge, pager,
  table) with a paper-and-ink comic character.
- **`norm.js`** — `mountNorm()` renders the footer and the documentation reader, owns
  the hash routing, Markdown and tooltips.
- **`norm` (CLI)** — `check`, `vendor`, `docs`, `metrics`, `smoke`, `eject`.

## Use it

```sh
pnpm add @suadin/norm        # or a release tarball, or the Pages URL
pnpm norm init
pnpm norm vendor             # writes <vendorDir>/norm/{norm.js,norm.css,NORM.md}
pnpm norm check              # static conformance
pnpm norm smoke              # behavioural conformance against the served page
```

The vendored directory is committed; it works from a naked checkout, without the
registry and without a build step. `norm eject` removes the dependency and leaves the
files behind as the app's own.

## The contract, not the library

The Norm is satisfied by behaviour, not by origin. An app may implement the footer and
reader itself; it must then supply the conformance tests (NORM-OPT-01). No check
inspects imports — every check inspects the page and the files it declares.

## Release policy

- **Patch** — wording, clarity, checker fix.
- **Minor** — new optional rule or new quality check, advisory first.
- **Major** — mandatory new rule, removed or renamed rule, changed behaviour.

Before a major release, every app must be on the same major or every remaining
exception documented. A newer major is reported by `norm check` in CI; the page itself
does no version lookup.

## Licence

Documentation is CC BY 4.0. Code is MIT. See [`LICENSE`](LICENSE).
