<!-- Generated from paired bilingual sources; update both languages together. Source: docs/source/CONTRIBUTING.json -->

# Contributing and bilingual maintenance

[繁體中文](CONTRIBUTING.md)

<!-- section: section-00 -->

Chinese and English must provide the same features and explanatory detail. English documentation must not be a summary of Chinese; unimplemented items, risks, controls and verification limits need equal coverage.

<!-- section: section-01 -->

## Update workflow

- Update both interfaces, feature descriptions, controls, release limitations and relevant validation records in the same commit.
- Use shared game code, settings keys and save structures; language selection must not change physics or gameplay.
- Maintain English translations in `src/i18n.js`; review dictionary coverage when adding dynamic messages, music or circuits.
- Edit `docs/source/*.json`, maintaining both `zh` and `en` for every section while preserving shared section IDs.
- Do not edit generated Markdown directly. Run the generator, then review both language diffs and their GitHub presentation.
- Manually compare every fact, condition, limitation and meaning; structural checks cannot replace translation review.

<!-- section: section-02 -->

## Required commands

```sh
npm run docs:generate
npm run docs:check
npm test
npm run build
```

After changing game UI or controls, run the relevant browser checks with the development server running:

```sh
npm run test:browser
npm run test:english
npm run test:steering
npm run test:music
```

<!-- section: section-03 -->

## Automated checks and boundaries

Checks reject missing languages, empty sections, list/table structure differences, mismatched command blocks, differing numeric values, broken local document links and stale generated files. GitHub CI runs documentation checks alongside existing tests/builds.

Matching structure can still conceal inaccurate translations or a feature omitted in both languages. Maintainers must review each item against the implementation; do not remove checks or shorten the other language merely to obtain a passing result.
