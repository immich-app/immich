# web/AGENTS.md

SvelteKit SPA (SSR off), Svelte 5 runes, Tailwind, `@immich/ui`, `@tanstack/svelte-query`. Talks to the server through the workspace `@immich/sdk`.

## Rules

- Import with the `#lib/*` alias and an explicit `.ts` extension: `import { authManager } from '#lib/managers/auth-manager.svelte.ts'`. Never `$lib`. Other aliases: `#i18n/*`, `#test-data/*`, `#tests/*`.
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
- **Unit tests**: vitest config is the `test` block in `vite.config.ts` (happy-dom). `src/test-data/setup.ts` initializes svelte-i18n so `$t` returns the key. Build data with the factories in `src/test-data/factories/`; shared mocks (SDK, observers) are in `src/lib/__mocks__/`. Run one file with `mise //web:test --run src/lib/utils/date-time.spec.ts`.
