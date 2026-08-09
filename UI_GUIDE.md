# Taalei UI Guide for Agents

This document is the source of truth for UI work in this repository. Read it before adding
or changing a page, shared component, theme behavior, or visual primitive.

## Core rules

- Use the local `ui-*` design system. Do not add DaisyUI classes, aliases, presets, or another
  component library.
- UnoCSS utilities are appropriate for page-specific layout and spacing. Reusable visual
  contracts belong in a semantic `ui-*` class instead of a long repeated utility string.
- Keep simple controls as native HTML with `ui-*` classes. Create or reuse a Svelte component
  when behavior, shared state, focus management, or ARIA logic needs an owner.
- Preserve RTL behavior and Chrome 64 compatibility. Modern browsers must be an enhancement,
  not a requirement for the main layout or controls.
- Reuse an existing primitive before adding a new one. Do not create a second spelling or a
  page-local substitute for an existing state or variant.

## Sources of truth

The design system is loaded through `src/app.css` and split by responsibility:

- `src/lib/styles/tokens.css`: colors, typography, spacing, radii, shadows, and theme values.
- `src/lib/styles/base.css`: document defaults and small semantic helpers.
- `src/lib/styles/layout.css`: application containers and page-level layout primitives.
- `src/lib/styles/components.css`: reusable controls and visual components.

Shared behavioral components live in `src/lib/components/`. Reuse `Modal.svelte`, `Tab.svelte`,
`Accardeon.svelte`, `TheToast.svelte`, `AppHeader.svelte`, and `ColorSchemeButton.svelte` rather
than reproducing their behavior in a route.

## Choosing classes or components

Use native elements for buttons, links, inputs, selects, textareas, badges, alerts, cards,
progress indicators, and simple lists:

```svelte
<button class="ui-btn ui-btn-primary ui-btn-sm" type="button">ذخیره</button>
<a class="ui-btn ui-btn-outline" href="/khatm">مشاهده ختم‌ها</a>

<article class="ui-card ui-card-bordered">
	<div class="ui-card-body">
		<h2 class="ui-card-title">عنوان</h2>
		<p class="ui-text-muted">توضیح کوتاه</p>
		<div class="ui-card-actions">...</div>
	</div>
</article>
```

Use a Svelte component for behavior that must remain consistent across routes. A modal, for
example, owns Escape handling, focus containment, focus restoration, backdrop behavior, and
dialog ARIA. A wrapper around a plain button or input adds no value and should not be created.

## Primitive contracts

Compose classes from a base primitive, one explicit variant, and an optional size or shape:

- Buttons: `ui-btn` with `ui-btn-primary`, `ui-btn-secondary`, `ui-btn-soft`,
  `ui-btn-outline`, `ui-btn-ghost`, `ui-btn-success`, or `ui-btn-danger`.
- Button sizing and shape: `ui-btn-xs`, `ui-btn-sm`, `ui-btn-lg`, `ui-btn-xl`,
  `ui-btn-block`, `ui-btn-icon`, or `ui-btn-square`.
- Cards: `ui-card`, optionally `ui-card-bordered`, with `ui-card-body`, `ui-card-title`, and
  `ui-card-actions`.
- Status: `ui-alert` with `ui-alert-info`, `ui-alert-success`, or `ui-alert-error`; badges use
  `ui-badge` plus an explicit badge variant.
- Forms: `ui-fieldset`, `ui-fieldset-legend`, `ui-field-label`, `ui-input`, `ui-textarea`,
  `ui-select`, `ui-checkbox`, and `ui-radio`.
- Data and feedback: `ui-list`, `ui-list-row`, `ui-progress`, `ui-progress-success`,
  `ui-radial-progress`, `ui-spinner`, `ui-stats`, and `ui-stat`.

Use the native `disabled` attribute on controls. For a link that must appear unavailable, add
`aria-disabled="true"`, prevent activation in behavior, and add `ui-btn-disabled`. Icon-only
buttons require an accessible name such as `aria-label`.

## Layout

Wrap normal application pages in `ui-container`; use `ui-container-reading` for forms,
long-form content, and Quran reading views. Build page spacing with `ui-page`, and use
`ui-page-grid` or `ui-page-grid ui-page-grid-three` for responsive card collections.

Use `ui-page-header` and its child classes for a consistent page heading. Header and navigation
internals belong to `AppHeader.svelte`; routes should not recreate the global navigation.

Utilities may handle truly local alignment, width, and spacing. If the same combination occurs
in several routes or represents a named design concept, move it to the appropriate stylesheet
as a `ui-*` primitive.

## Themes and tokens

The only color-scheme values are `system`, `light`, and `dark`. System mode has no
`data-color-scheme` attribute; explicit modes use `data-color-scheme="light"` or
`data-color-scheme="dark"`. Do not add `data-theme`, Daisy theme names, or `dark:` utility
variants.

Do not hard-code theme-dependent page, surface, border, or text colors in route markup. Use a
semantic class or a token from `tokens.css`. When introducing a semantic color, define both its
light and dark values. The light theme is the safe fallback when `prefers-color-scheme` is not
supported.

Fonts are also tokens. Do not set a page-local font family; this keeps a future move from
Vazirmatn to the official Nian files localized to the token layer.

## Chrome 64 compatibility

The primary UI contract must not rely on:

- Flexbox `gap`; use the existing margin-based helper or explicit sibling margins. CSS Grid
  spacing must include the legacy `grid-gap` form.
- Logical properties or logical utility names such as `margin-inline`, `inset-inline`, `ms-*`,
  `me-*`, `ps-*`, or `pe-*`.
- The `inset` shorthand; write `top`, `right`, `bottom`, and `left` explicitly.
- `:focus-visible`, `:is()`, `:where()`, `:has()`, or CSS cascade layers.
- `oklch()`, `oklab()`, `color-mix()`, or space-separated modern color syntax. Use hex,
  `rgb()`, or `rgba()`.

Use physical left/right properties deliberately for the RTL layout. Never remove an outline
unless an equally visible `:focus` replacement is provided.

## Accessibility and interaction checklist

- Prefer native controls and connect every form control to a visible label.
- Expose validation and status text in content, not through color alone.
- Preserve keyboard activation, visible focus, disabled behavior, and loading feedback.
- Keep modal, tab, accordion, and toast behavior in their shared components. Any behavioral
  change must preserve their ARIA relationships and keyboard contract.
- Avoid placing interactive elements inside another button or link.

## Before handing off UI changes

- Search for an existing primitive or shared component before adding one.
- Check the result conceptually at 360, 768, and 1200 pixel widths, in RTL, and in both themes.
- Ensure hover, active, focus, disabled, loading, success, and error states are covered where
  the primitive supports them.
- Keep readable content in `ui-container-reading` and list/dashboard content in `ui-container`.
- Do not introduce Daisy names, external UI dependencies, or CSS features outside the Chrome
  64 compatibility contract.
