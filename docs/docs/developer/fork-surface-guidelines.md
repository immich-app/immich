# Fork Surface Guidelines

Use Gallery-owned namespaces for new fork behavior when it is practical:

- server: `server/src/gallery/**`
- web: `web/src/lib/gallery/**`
- mobile: `mobile/lib/gallery/**`
- database migrations: `server/src/schema/migrations-gallery/**`
- CI helpers: `.github/actions/gallery-*/**` and `.github/workflows/gallery-*.yml`

Keep upstream-owned files as small adapters or hook points. When extracting
logic from an upstream-owned file, keep the adapter path in
`upstream_extension_paths` and add the Gallery-owned implementation path to
`owned_paths`.

Do not move code only for namespace purity during an urgent upstream rebase.
Fork-surface report findings are advisory; use them to choose opportunistic
follow-up work when the rebase is otherwise healthy.

Generated artifacts and upstream API clients should stay in their generated
locations. Do not move them into `gallery/*` namespaces.

## Migration Ladder

Start with new or actively touched fork work. Do not run a bulk move just to
make paths look clean.

1. Put new fork-only implementation code in the preferred namespace for its
   domain.
2. Leave a small adapter in the upstream-owned file when upstream still owns
   the route, component, service, repository, table, or workflow entry point.
3. Add the adapter path to `upstream_extension_paths` and the Gallery-owned
   implementation path to `owned_paths` in `docs/fork/ownership.yml`.
4. Add focused tests around the Gallery-owned module before moving behavior out
   of the upstream-owned file.
5. After the move, run `make fork-ownership-coverage-check` and
   `make upstream-rebase-ready` to confirm the manifest and reports classify the
   change correctly.

Good first candidates are fork code with stable seams and low upstream coupling:

- pure web helpers, stores, and view-model logic under `web/src/lib/gallery/**`
- server policy, permission, and orchestration helpers under
  `server/src/gallery/**`
- fork-only workflow actions under `.github/actions/gallery-*/**`
- fork-owned database migrations under `server/src/schema/migrations-gallery/**`

Avoid moving these until there is a stronger reason:

- generated OpenAPI, mobile OpenAPI, SQL, and Drift outputs
- files whose names or locations are required by upstream frameworks
- table definitions, DTOs, or route files that upstream frequently rewrites
- tiny one-line hook points where the adapter is already the whole change
