# Migrations

## 2.0.0

Basic Specs becomes Norm: a package instead of a pinned copy, `basic-specs` renamed to
`norm`, rule IDs renamed `BASIC-*` to `NORM-*`.

An app migrates by dropping `basics/`, `basics.lock` and the generated
`docs/BASIC-SPECS.md`, declaring `norm.json`, running `norm vendor` and committing the
result. `norm check` replaces `basics check`.

Rule map:

| Before | After | What changed |
|---|---|---|
| BASIC-DOCS-01 | NORM-DOCS-01 | renamed |
| BASIC-DOCS-02 | NORM-DOCS-02 | now checks vendor drift, not a `basics.lock` hash |
| BASIC-READER-01..05 | NORM-READER-01..05 | renamed; the third tab reads NORM, not BASIC SPECS |
| BASIC-FOOTER-01 | NORM-FOOTER-01 | six items, `BASIC SPECS` becomes `NORM` |
| BASIC-FOOTER-02..04 | NORM-FOOTER-02..04 | renamed |
| BASIC-VERSION-01 | NORM-VERSION-01 | renamed |
| BASIC-VERSION-02 | NORM-VERSION-02 | version now comes from the installed package |
| BASIC-VERSION-03 | — | dropped: no runtime "latest" lookup |
| BASIC-VERSION-04 | — | dropped: no `version.json` fetch |
| BASIC-LINKS-01 | NORM-LINKS-01 | renamed |
| BASIC-LAYOUT-01..02 | NORM-LAYOUT-01..02 | renamed |
| BASIC-DESIGN-01..03 | NORM-DESIGN-01..03 | renamed |
| BASIC-DESIGN-04 | NORM-DESIGN-04 | the 80–200 % zoom clause is dropped |
| BASIC-DATES-01 | NORM-DATES-01 | renamed |
| BASIC-DATA-01..02 | NORM-DATA-01..02 | renamed |
| BASIC-TESTS-01..03 | NORM-TESTS-01..03 | renamed |
| BASIC-QUALITY-01 | NORM-QUALITY-01 | renamed |
| — | NORM-OPT-01 | new: the contract is behaviour, not the package |

`allow` entries in `norm.json` keep their rule ID with the new prefix; the suffix never
changes. `BASIC-TESTS-02` becomes `NORM-TESTS-02`, `BASIC-DATA-02` becomes
`NORM-DATA-02`.

## 1.2.1

No rule changed. This release moves CI plumbing into the standard.

- In `basics.yml`, replace the checkout, setup-python, pnpm/action-setup and
  setup-node steps with one line:
  `- uses: suadin/basic-specs/.github/actions/setup@v1.2.1` plus `with:` for `node`,
  `python`, `pnpm` and `cache`. Everything after it - the app's own commands - stays.
- Replace the body of `basics-update.yml` with a single job that calls
  `suadin/basic-specs/.github/workflows/update-app.yml@v1.2.1`.

Adopting this changes nothing about how an app is checked.

## 1.2.0

The reference implementation changed, so the copies in the apps have to follow. No rule
changed and no app has to alter its behaviour.

- `reference/specimen/reader.js` exports `composeSpecs`. Copy it over the app's
  `reader.js` and delete the local function of the same name in `app.js`, otherwise two
  copies live side by side.
- `reference/specimen/style.css` gained two rules that only `app-template` had. Copy the
  file over the app's `style.css` and keep the app's own rules below it.
- `design/tokens.css` is unchanged.

To check the result: `python3 checks/specimen_drift.py --workspace ~/dev`.

## 1.1.1

Clarifies footer item wrapping and the placement of the automated test list. No
behavioural change for an app that already follows 1.1.0.

## 1.1.0

- Add `appVersion` and `runtime` to `basics.json`.
- Generate the runtime file with `basics docs`.
- Remove `RELEASE NOTES` as a reader tab; compose it as the first `SPECS` page.
- Add the six-item footer and the version state rules.
- Publish `version.json` at the Pages root.

## 1.0.0

This is the first release. There is no earlier standard to migrate from.

To adopt it in an existing app:

1. Add `basics.json` with `standard`, `name`, `profiles` and `docs`.
2. Run `python3 basics/check.py sync --from ../basic-specs`.
3. Run `python3 basics/check.py docs`.
4. Add missing tests or record a deviation with a reason and review date.
5. Add `python3 basics/check.py check` to the app's check command and CI.
