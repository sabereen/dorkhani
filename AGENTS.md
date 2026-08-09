# Repository Guidelines

## Architecture Reference

`ARCHITECTURE.md` documents the system architecture, route map, data flows, persistence,
and cross-file dependencies. Do not read it by default. Read it only when a task requires
cross-cutting architectural context, and prefer inspecting the directly relevant files for
small, well-scoped changes.

## UI System Reference

[`UI_GUIDE.md`](UI_GUIDE.md) is the source of truth for the local `ui-*` design system,
component composition, theming, accessibility, RTL behavior, and Chrome 64 compatibility.
Read it before adding or changing application UI. Do not introduce DaisyUI classes, aliases,
presets, or another UI component library.

## Project Structure & Module Organization

This is a SvelteKit and TypeScript application for coordinating Quran recitations. Application routes, pages, endpoints, and route-specific components live in `src/routes/`; SvelteKit conventions apply (for example, `+page.svelte`, `+page.server.ts`, and `+server.ts`). Reusable UI belongs in `src/lib/components/`, domain types in `src/lib/entity/`, and client persistence helpers in `src/lib/idb/`. Server-only database and business logic belongs under `src/lib/server/`. Prisma's MySQL schema and timestamped migrations are in `prisma/`. Put public icons and images in `static/`.

## Development Commands

Use pnpm (the repository pins pnpm 10) rather than npm:

- `pnpm dev` starts the Vite development server.
- `pnpm build` generates the Prisma client, then creates the production build.
- `pnpm start` runs the built Node server.
- `pnpm check` runs Svelte and TypeScript diagnostics.
- `pnpm lint` checks Prettier formatting and ESLint rules; `pnpm format` rewrites formatting.
- `pnpm prisma:generate`, `pnpm prisma:validate`, and `pnpm prisma:status` manage the Prisma client and migration state.

Copy `.env.example` to `.env` and supply a MariaDB `DATABASE_URL`; never commit credentials or local environment files.

## Coding Style & Naming Conventions

Follow Prettier: tabs, single quotes, no semicolons, trailing commas, and a 100-character print width. Use TypeScript for new logic. Name Svelte components in PascalCase (for example, `ThemeButton.svelte`), utility modules in camelCase (for example, `splitIntervals.ts`), and SvelteKit files using the required `+page`/`+server` names. Keep server code out of client imports and prefer existing services over duplicating database queries.

## Testing Guidelines

Vitest runs browser-facing Svelte tests in jsdom and other tests in Node. Place tests beside the code they cover and use `*.test.ts`, `*.spec.ts`, or `*.svelte.test.ts`; examples include `src/lib/utility/overlapping.test.ts` and `src/routes/page.svelte.test.ts`. Run the suite with `pnpm test`; use `pnpm test:unit` while developing.

## Commit & Pull Request Guidelines

Recent history uses concise Conventional Commit-style subjects such as `feat: show all ranges` and `fix: generate Prisma client`. Use an imperative, scoped subject when useful (`refactor: upgrade prisma`). Keep commits focused. Pull requests should explain the user-visible change, note schema or environment changes, link the relevant issue, and include screenshots for UI changes. Mention the commands run and any follow-up migration steps.
