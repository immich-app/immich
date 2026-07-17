# PR Checklist

A minimal devcontainer is supplied with this repository. All commands can be executed directly inside this container to avoid tedious installation of the environment.
:::warning
The provided devcontainer isn't complete at the moment. At least all dockerized steps in the Makefile won't work (`mise dev`, ....). Feel free to contribute!
:::
When contributing code through a pull request, please check the following:

## Web Checks

- [ ] `mise //web:lint` (linting via ESLint)
- [ ] `mise //web:format` (formatting via Prettier)
- [ ] `mise //web:check-svelte` (type checking via SvelteKit)
- [ ] `mise //web:check-typescript` (type checking via `tsc`)
- [ ] `mise //web:test` (unit tests)

:::tip AIO
Run all web checks with `mise //web:checklist`
:::

:::tip Auto Fix
Use `mise //web:lint-fix` and `mise //web:format-fix` to automatically correct some issues.
:::

## Documentation

- [ ] `mise //docs:format` (formatting via Prettier)
- [ ] Update the `_redirects` file if you have renamed a page or removed it from the documentation.

:::tip Auto Fix
Use `mise //docs:format-fix` to automatically fix formatting.
:::

## Server Checks

- [ ] `mise //server:lint` (linting via ESLint)
- [ ] `mise //server:format` (formatting via Prettier)
- [ ] `mise //server:check` (type checking via `tsc`)
- [ ] `mise //server:test` (unit tests)

:::tip AIO
Run all server checks with `mise //server:checklist`
:::

:::tip Auto Fix
Use `mise //server:lint-fix` and `mise //server:format-fix` to automatically correct some issues.
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

## Machine Learning Checklist

- [ ] `mise //machine-learning:lint` (linting via ruff)
- [ ] `mise //machine-learning:format` (formatting via ruff)
- [ ] `mise //machine-learning:check` (type checking via mypy)
- [ ] `mise //machine-learning:test` (unit tests via pytest)

:::tip AIO
Run all machine learning checks with `mise //machine-learning:checklist`
:::

## OpenAPI

The OpenAPI client libraries need to be regenerated whenever there are changes to the `immich-openapi-specs.json` file. Note that you should not modify this file directly as it is auto-generated. See [OpenAPI](/api.md) for more details.

## Database Migrations

A database migration needs to be generated whenever there are changes to `server/src/infra/src/entities`. See [Database Migration](/developer/database-migrations.md) for more details.
