# web/AGENTS.md

SvelteKit SPA (SSR off), Svelte 5 runes, Tailwind, `@immich/ui`, `@tanstack/svelte-query`. Talks to the server through the workspace `@immich/sdk`.

## Rules

- Import with the `#lib/*` alias and an explicit `.ts` extension: `import { authManager } from '#lib/managers/auth-manager.svelte.ts'`. Never `$lib`. Other aliases: `#i18n/*`, `#test/*` (the `test/` directory).
- Build URLs with the typed `Route` object in `src/lib/route.ts`. `continue`/`previousRoute` query params must go through `Route.continue(...)` (lint-enforced).
- Global state lives in `*.svelte.ts` singleton managers in `src/lib/managers/`. `eventManager` is the typed app-wide bus; subscribe with `eventManager.on({...})` or `components/OnEvents.svelte`. `src/lib/stores/` is legacy.
- `src/lib/services/*.service.ts` only return `@immich/ui` `ActionItem`s and open modals; data access belongs in `src/lib/queries/`.
- Unused variables must be named exactly `_`. `svelte-check` runs with `--fail-on-warnings`.
- `@immich/sdk` must be built before the web builds or tests: `mise //:sdk:install && mise //:sdk:build` (`mise //web:start` does this).

## Skills

- **Add a query or mutation**: one `src/lib/queries/<controller>.query.ts` per API controller. Export a query-key constant, `getXQuery(...)` factories returning `queryOptions({ queryKey, queryFn: ({ signal }) => sdkFn(..., { signal }), select })`, and `xMutation` options built with `asMutation(sdkFn, { meta: { success: { toast }, error: { toast } } })`. Cache updates and `eventManager` emits happen in the mutation's `onSuccess`. The global `MutationCache` in `src/lib/queries/client.ts` shows the toasts and calls `handleError`; `meta.error.toast: false` suppresses it. Outside components run mutations with `executeMutation(optionsFn, variables, mutateOptions)`.
- **Add a page**: put it under `src/routes/(user)/` for the authenticated app or `src/routes/admin/`. In `+page.ts`: `await authenticate(url)`, preload with `await queryClient.query(getXQuery())`, `const $t = await getFormatter()`, and return `{ meta: { title: $t('...') } }`. In the component read the data with `createPreloadedQuery(() => getXQuery())`. Route-specific components sit next to the route.
- **Add a modal**: create `src/lib/modals/XModal.svelte` with `Props = { onClose: (result?) => void }` built on `@immich/ui` `Modal`/`FormModal`. Open it with `const result = await modalManager.show(XModal, props)`; the promise resolves with whatever is passed to `onClose`.
- **Use a translation**: `import { t } from 'svelte-i18n'` and `$t('key')` in components; `const $t = await getFormatter()` from `#lib/utils/i18n.ts` elsewhere. Keys are typed against `i18n/en.json`, so add the key there first (root skill). Rich text goes through `src/lib/elements/FormatMessage.svelte`.
- **Unit tests**: vitest runs every `src/**/*.spec.ts` in headless Chromium (`@vitest/browser-playwright`, config in the `test` block of `vite.config.ts`; `mise //web:test`). Pure-function and manager specs need nothing special. Rendered components use `render` from `vitest-browser-svelte`, locators from `vitest/browser` (`page.getByRole`, `userEvent`) and `await expect.element(...)`; there is no testing-library. Specs that touch the API use `test` from `#test/unit/fixtures.ts` and its `api` fixture (`api.on({ operationId: handler })`, `expect(api.operationId).toHaveBeenCalledWith(...)`) instead of mocking `@immich/sdk`. `test/unit/setup.ts` fakes `$app/navigation` and `$app/state` and sets the `dev` locale, so `$t('key')` renders the key. Build data with `factory` from `#test/unit/factories.ts`.
- **Page tests**: `page.spec.ts` next to a route, using `test` from `#test/unit/fixtures.ts`; see `src/routes/(user)/albums/page.spec.ts`. `router.goto(url, params)` then `render(Page, load)`; `await settle()` after an action that calls the API.
- **Unit or medium?** Both tiers share the mock API in `test/common/` (`MockData`, handlers, spies). What differs:

  | | Unit / page (Chromium iframe, vite dev) | Medium (Playwright, production build) |
  | --- | --- | --- |
  | API calls | `fetch` stub in the page | Playwright route interception |
  | `<img>` / `<video>` / downloads | never load (404); a failed test prints the URLs | served by the mock |
  | Routing | one route per test, `goto` only records the URL | real SvelteKit router, multi-page flows |
  | Layouts | root and `(user)` layouts are not rendered; routes nested in other `+layout.svelte` files are medium | all |
  | Websocket, service worker | none | mocked |

- **Medium tests**: Playwright specs in `test/medium/specs/` run against the production build with every `/api` call mocked (`mise //web:test-medium`). Fixtures: `app` (locators and gestures, `test/medium/app.ts`), `data` (seed state via `MockData` methods), `api` (`expect(api.updateAsset).toHaveBeenCalledWith({ params, body })`; handlers live in `test/common/handlers.ts`) and `logger` (browser errors). The UI uses the `dev` locale, so locate elements by translation key. Unhandled requests, unasserted mutations and unasserted browser errors fail the test.
