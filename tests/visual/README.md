# Browser style regressions

These tests serve the actual production CSR bundle in Chromium, with deterministic API
fixtures and fresh browser storage. They do not need a running database or backend.

```sh
pnpm exec playwright install chromium
PUBLIC_SERVER_ORIGIN=https://dorkhani.ir pnpm build:csr
pnpm test:visual
```

To use an existing Chromium installation, set `CHROMIUM_EXECUTABLE_PATH`.
For a quick run, select a project: `pnpm test:visual --project=fa-light-360`.

The matrix covers 360, 768, and 1200 pixel widths in both themes, plus English LTR
on mobile and desktop. Across eight configurations, 38 scenarios produce 304 comparisons.
They cover 21 routes plus interaction states: navigation and language dialogs, sharing,
range selection and confirmation, filtered grids, sign-out,
creation success, validation, loading indicators, offline creation/editing, Quran reading,
and audio progress with real Arabic text and deterministic silent audio.
One primitive fixture checks all five contextual spinner variants, including admin
form actions, against the real built stylesheet.

Every run attaches full-page screenshots. Computed-style assertions cover the regressions
in theme previews, form borders, spinner transparency, offline component spacing, edit
layout, share-button line height, Quran typography, and audio progress shape. Reports and
traces are written under `work/`.

## Compare before and after

Build the previous revision in a separate checkout, then point the comparison at its
CSR output:

```sh
VISUAL_BASELINE_DIR=/absolute/path/to/previous/build-capacitor pnpm test:visual
```

Both builds receive the same fixtures and interactions. The test attaches both screenshots
and requires them to match with a small antialias tolerance and a three-pixel difference limit.
Fonts and images settle before interactions and capture; scroll is reset and infinite animations are frozen.
Displayed localhost ports are normalized so server addresses do not create false differences.
No production data or external service is used. Inspect any differences before accepting an
intentional UI change.
