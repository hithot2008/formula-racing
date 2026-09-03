<!-- Generated from paired bilingual sources; update both languages together. Source: docs/source/VALIDATION.json -->

# v0.1 validation record

[繁體中文](VALIDATION.md)

<!-- section: section-00 -->

Date: 2026-09-03. Environment: macOS, Node.js 22.15.1, Google Chrome and Playwright. Browser tests used software WebGL; these results do not establish a target framerate on real GPUs.

<!-- section: section-01 -->

## Passed checks

- 8 vehicle-core Node tests: 8 closed circuits, acceleration/stopping, longer wet stopping distances, fixed-step consistency at 30/60 FPS, reset penalties, collision separation, AI completing a lap on all 8 circuits, and left/right steering regression.
- Chrome DOM/keyboard actions: circuit selection, countdown, 6-car start, acceleration, pause freezing simulation, camera changes, reset +5 seconds, guide and saved settings.
- The development fixed-step interface completed a 3-lap Grand Prix, 2-lap time trial and 1-lap skill challenge, verifying results, best valid laps and ghost saves.
- Desktop captures at 1440 × 1000 and mobile menu captures at 390 × 844; no horizontal menu overflow.
- No uncaught JavaScript page errors.
- `npm run build` succeeded; the engine is a separate bundle.
- After updating Vite to 6.4.3, the npm installation audit reported 0 vulnerabilities.

Screenshots are in `artifacts/`, physics tests in `tests/physics.test.js` and browser verification in `tests/browser.mjs`.

<!-- section: section-02 -->

## Verification boundaries

Full-race tests used program-controlled driving and accelerated simulation, not a human manually driving the entire race. Steering wheels, physical gamepads, touch devices, Safari and minimum hardware performance remain untested. The pit box is implemented but full servicing was not included in this browser-interaction pass. Model tests cover weather physics and circuit completion, not complete art acceptance for every environment.

<!-- section: section-03 -->

## Left/right steering correction

Corrected steering signs with +Z forward and converted AI steering output accordingly. The pit box is also on the driver's right. Added 18 physics assertions spanning three difficulties, three headings and both directions, plus the `npm run test:steering` browser-keyboard regression.

<!-- section: section-04 -->

## English version

- Central translation dictionary and parameter substitution cover static labels, circuits, live HUD, guide, pause and results in English / Traditional Chinese.
- `npm test` passed 10 tests at this stage: dictionary coverage, no Chinese in English translations, parameter consistency and existing physics/steering tests.
- `npm run test:english` verifies switching, English content, a complete time trial, pit guidance, pause, results, language restoration and preservation of medals/lap records.
- `npm run test:browser` was rerun; Chinese Grand Prix, time trial and skill modes all completed, with controls and local saves intact.
- English desktop, mobile and result captures are in `artifacts/*-en.png`. Mobile headings and circuit cards remain readable without horizontal overflow.
- Production build passed. Language selection does not modify physics, AI or steering input.

<!-- section: section-05 -->

## Six background music styles

- Six original Web Audio arrangements each rendered a four-bar test excerpt; all produced nonzero and distinct signals.
- At the default 35% volume, excerpt peaks were approximately 0.197–0.230 without digital clipping. This is signal verification, not a subjective listening assessment.
- Chrome interactions passed: preview, six-track switching, independent engine sound, volume persistence, no reload autoplay, pause/resume, mute and blur stopping.
- Desktop/mobile screenshots were inspected, with no horizontal mobile overflow. Physical phones and audio equipment were not tested.
- `npm test` passed 10 tests and `npm run build` succeeded at this stage. Rerun music verification with `npm run test:music`.

<!-- section: bilingual-maintenance -->

## Bilingual documentation synchronization

- Generation and parity checks passed for 10 Chinese/English documents covering the README, design, development status, validation and contribution guide.
- `npm test` passed 12 tests, including rejection of missing translations, unequal detail counts, differing numbers and mismatched commands.
- `npm run build` passed; this change does not modify game physics, music or control logic.
- GitHub CI now runs `npm run docs:check`; beyond structural checks, both languages were manually compared item by item.
