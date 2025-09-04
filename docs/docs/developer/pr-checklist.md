# PR Checklist

A minimal devcontainer is supplied with this repository. All commands can be executed directly inside this container to avoid tedious installation of the environment.
:::warning
The provided devcontainer isn't complete at the moment. At least all dockerized steps in the Makefile won't work (`make dev`, ....). Feel free to contribute!
:::
When contributing code through a pull request, please check the following:

## Web Checks

- [ ] `mise run web:lint` (linting via ESLint)
- [ ] `mise run web:format` (formatting via Prettier)
- [ ] `mise run web:check` (check typescript)
- [ ] `mise run web:check-svelte` (Type checking via SvelteKit)
- [ ] `mise run web:test` (unit tests)

## Documentation

- [ ] `pnpm run format` (formatting via Prettier)
- [ ] Update the `_redirects` file if you have renamed a page or removed it from the documentation.

:::tip AIO
Run all web checks with `pnpm run check:all`
:::

## Server Checks

- [ ] `mise run server:lint` (linting via ESLint)
- [ ] `mise run server:format` (formatting via Prettier)
- [ ] `mise run server:check` (type checking via `tsc`)
- [ ] `mise run server:test` (unit tests)
- [ ] `mise run server:test-medium` (medium tests)

:::tip AIO
Run all server checks with `pnpm run check:all`
:::

:::info Auto Fix
You can use `mise run server:lint-fix` and `mise run server:format-fix` to potentially correct some issues automatically.
:::

## Mobile Checks

The following commands must be executed from within the mobile app directory of the codebase.

- [ ] `make build` (auto-generate files using build_runner)
- [ ] `make analyze` (static analysis via Dart Analyzer and DCM)
- [ ] `make format` (formatting via Dart Formatter)
- [ ] `make test` (unit tests)

:::info Auto Fix
You can use `dart fix --apply` and `dcm fix lib` to potentially correct some issues automatically for `make analyze`.
:::

## OpenAPI

The OpenAPI client libraries need to be regenerated whenever there are changes to the `immich-openapi-specs.json` file. Note that you should not modify this file directly as it is auto-generated. See [OpenAPI](/docs/developer/open-api.md) for more details.

## Database Migrations

A database migration needs to be generated whenever there are changes to `server/src/infra/src/entities`. See [Database Migration](/docs/developer/database-migrations.md) for more details.
