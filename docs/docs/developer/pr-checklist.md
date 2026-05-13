# PR Checklist

A minimal devcontainer is supplied with this repository. All commands can be executed directly inside this container to avoid tedious installation of the environment.
:::warning
The provided devcontainer isn't complete at the moment. At least all dockerized steps in the Makefile won't work (`make dev`, ....). Feel free to contribute!
:::
When contributing code through a pull request, please check the following:

## Web Checks

- [ ] `pnpm run lint` (linting via ESLint)
- [ ] `pnpm run format` (formatting via Prettier)
- [ ] `pnpm run check:svelte` (Type checking via SvelteKit)
- [ ] `pnpm run check:typescript` (check typescript)
- [ ] `pnpm test` (unit tests)

:::tip AIO
Run all web checks with `pnpm run check:all`
:::

## Documentation

- [ ] `pnpm run format` (formatting via Prettier)
- [ ] Update the `_redirects` file if you have renamed a page or removed it from the documentation.

## Server Checks

- [ ] `pnpm run lint` (linting via ESLint)
- [ ] `pnpm run format` (formatting via Prettier)
- [ ] `pnpm run check` (Type checking via `tsc`)
- [ ] `pnpm test` (unit tests)

:::tip AIO
Run all server checks with `pnpm run check:all`
:::

:::tip Auto Fix
You can use `pnpm run __:fix` to potentially correct some issues automatically for `pnpm run format` and `lint`.
:::

## Mobile Checklist

- [ ] `mise //mobile:codegen` (auto-generate files using build_runner)
- [ ] `mise //mobile:lint` (static analysis via Dart Analyzer and DCM)
- [ ] `mise //mobile:format` (formatting via Dart Formatter)
- [ ] `mise //mobile:test` (unit tests)

:::tip
Run all these commands at once with `mise //mobile:checklist`
:::

:::tip Auto Fix
You can use `mise //mobile:lint-fix` to potentially correct some issues automatically for `mise //mobile:lint`.
:::

## OpenAPI

The OpenAPI client libraries need to be regenerated whenever there are changes to the `immich-openapi-specs.json` file. Note that you should not modify this file directly as it is auto-generated. See [OpenAPI](/api.md) for more details.

## Database Migrations

A database migration needs to be generated whenever there are changes to `server/src/infra/src/entities`. See [Database Migration](/developer/database-migrations.md) for more details.
