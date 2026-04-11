# AGENTS Guide

## Purpose

- This repository is an Angular 19 standalone frontend for running local LLMs in the browser.
- The architecture is intentionally layered so agents should preserve boundaries between domain, application, infrastructure, and feature UI code.
- Prefer minimal, targeted edits that match the existing TypeScript and Angular patterns already in `src/app`.
- There are no Cursor or Copilot instruction files in this repo right now: no `.cursorrules`, no `.cursor/rules/`, and no `.github/copilot-instructions.md` were found.

## Repository Shape

- `src/app/domain`: pure contracts and entities; keep framework-free when possible.
- `src/app/application`: facades and state containers that coordinate use cases.
- `src/app/infrastructure`: browser persistence, model catalogs, and provider implementations.
- `src/app/features`: route-level pages and feature-specific components.
- `src/app/shared`: reusable presentational UI.
- `src/app/core`: DI tokens, app config, platform capability services, and utilities.
- `src/styles.css`: global design tokens and base styles.
- `dist/`: generated output; do not edit by hand.
- `.playwright-mcp/` and root-level PNG/JSON/YML QA artifacts are generated investigation files, not source of truth.

## Environment Notes

- Package manager in use is `npm` because `package-lock.json` is present.
- Main app entry is `src/main.ts` using `bootstrapApplication`.
- Routing is standalone and lazy via `loadComponent` in `src/app/app.routes.ts`.
- TypeScript strict mode is enabled in `tsconfig.json`.
- Angular template strictness is enabled via `strictTemplates`.
- Build output goes to `dist/pure-llm-front`.

## Install And Run

- Install dependencies: `npm install`
- Start dev server: `npm start`
- Equivalent direct command: `npx ng serve`
- Development build watch mode: `npm run watch`
- Production build: `npm run build`
- Lint TypeScript sources: `npm run lint`
- Run unit tests with coverage: `npm run test`
- Run the full validation suite: `npm run check`

## Verified Commands

- `npm run build` works and produces output in `dist/pure-llm-front`.
- `npm run lint` works with the committed ESLint flat config.
- `npm run test` works with Vitest in `jsdom` mode.
- `npx ng lint` still fails because the workspace has no Angular CLI `lint` target configured.
- `npx ng test pure-llm-front` still fails because the workspace has no Angular CLI `test` target configured.

## Lint And Test Status

- ESLint is configured through `eslint.config.mjs` and runs with `npm run lint`.
- Vitest is configured through `vitest.config.ts` and runs with `npm run test`.
- For code-only tasks, prefer `npm run check` when the change touches runtime logic; otherwise `npm run build` remains the minimum validation command.
- There is still no Angular CLI `lint` or `test` target in `angular.json`; use npm scripts instead.

## Single Test Guidance

- Single-test execution is available through Vitest file filtering, for example `npx vitest run src/app/application/chat/chat.facade.test.ts`.
- Current committed tests use the `*.test.ts` naming pattern under `src/app`.
- There is still no Angular CLI single-test command because the workspace has no `test` target configured.

## Architectural Rules

- Keep domain contracts and entities framework-light and free from UI concerns.
- Put orchestration logic in facades and state classes, not route templates.
- Keep infrastructure-specific logic inside repositories, providers, and persistence adapters.
- Keep route definitions declarative in `src/app/app.routes.ts`.
- Prefer reusable helpers for parsing, normalization, and data migration logic.
- Avoid leaking provider-specific behavior into feature components when a facade or contract can absorb it.

## Angular Conventions

- Use standalone components.
- Set `changeDetection: ChangeDetectionStrategy.OnPush` on components.
- Use `templateUrl` and `styleUrl` file references, not inline templates/styles, unless there is a strong reason.
- Use lazy `loadComponent` route entries for pages.
- Use `inject(...)` heavily inside components and some services where it keeps code concise.
- Use constructor injection when a class already depends on injected tokens or grouped dependencies.
- Keep component classes thin; push non-visual transformations into helpers or facades.

## TypeScript Style

- Keep `strict`-safe code; do not weaken tsconfig flags.
- Prefer explicit return types on public methods and exported helpers.
- Use `unknown` in catch paths and narrow before reading properties.
- Avoid `any`.
- Model nullable values explicitly with unions such as `string | null`.
- Use literal unions for bounded states, for example status and role types.
- Prefer small local types when a shape is only relevant within one file.
- Use `interface` for cross-file contracts and `type` for unions or local structural helpers.

## Imports

- Order imports with Angular/framework imports first, then a blank line, then app-relative imports.
- Within each group, keep imports stable and reasonably alphabetized.
- Prefer named imports over namespace imports.
- Use relative imports consistently within `src/app`; do not introduce path aliases unless the repo adopts them globally.
- Keep import lists tight; remove unused symbols promptly.

## Naming

- Use `PascalCase` for classes, interfaces, and Angular components.
- Use `camelCase` for functions, methods, variables, and properties.
- Use `UPPER_SNAKE_CASE` for shared constants and regex patterns when they behave like true constants.
- Use descriptive file suffixes that match the current project style: `.component.ts`, `.facade.ts`, `.state.ts`, `.service.ts`, `.repository.ts`, `.helper.ts`.
- Keep filenames kebab-case.
- Match route/page naming to feature folders, for example `chat-page.component.ts`.

## State Management

- Use Angular signals for app state containers, following patterns like `signal(...)` and `computed(...)`.
- Mark signal fields `readonly` when the reference itself should not change.
- Update arrays and objects immutably using spread syntax instead of in-place mutation where practical.
- Keep state transitions explicit: set loading, success, error, and ready flags deliberately.
- Derive UI booleans with computed state or focused helper methods instead of duplicating conditions.

## Async And Error Handling

- Prefer `async`/`await` over raw promise chains.
- Use early returns to keep async flows readable.
- Catch failures at boundaries where the UI or runtime state must be updated.
- Convert low-level runtime failures into user-facing messages in a single mapping function when possible.
- Preserve existing domain-specific error handling for WebGPU and model-loading failures.
- When swallowing errors intentionally, do it only where a safe fallback exists.
- Reset or restore state consistently on failure paths.

## Component And Template Practices

- Keep page components focused on loading data, wiring facades, and handling user actions.
- Keep reusable UI in `src/app/shared/ui` when it is not feature-specific.
- Prefer helper functions for display-only derivations rather than embedding dense logic in templates.
- Use explicit methods for event handlers such as `select`, `save`, `submit`, and `removeSource`.
- Preserve accessibility-friendly semantics in templates when editing forms and controls.

## Data And Persistence Rules

- Treat local storage payloads as untrusted input and normalize them before use.
- Maintain backward-compatible migration behavior in persistence code.
- Default missing persisted values carefully rather than assuming a fully valid shape.
- Preserve profile and knowledge source IDs unless the workflow intentionally clones data.
- Use ISO timestamps for persisted `createdAt` and `updatedAt` values.

## Styling Rules

- Reuse the CSS custom properties defined in `src/styles.css`.
- Preserve the existing warm, editorial visual language unless the task explicitly changes design direction.
- Prefer component-scoped CSS for feature styling and global CSS variables for shared tokens.
- Keep typography and spacing consistent with the current app rather than introducing generic defaults.
- Avoid one-off hardcoded colors when a shared token already exists or should be added.

## Editing Guidance For Agents

- Read nearby files before changing patterns that affect architecture or naming.
- Make the smallest coherent change that satisfies the request.
- Do not edit generated files in `dist/`.
- Do not remove QA artifact files unless the task explicitly asks for cleanup.
- If you add new tooling, wire it fully instead of leaving half-configured scripts.
- If you create tests or lint rules, update this document with exact commands, including single-test usage.

## Validation Expectations

- Minimum validation today: `npm run build`
- Preferred repo-wide validation after non-trivial logic changes: `npm run check`
- If a change affects startup behavior, also smoke-test with `npm start` when practical.
- If future lint or test tooling is added, run the narrowest relevant command first, then a repo-wide command if needed.
- In reports back to users, be explicit about commands that were unavailable because the workspace lacks configured targets.
